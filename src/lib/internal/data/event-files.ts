import "server-only";

import { resolveInternalDataSource } from "@/lib/internal/data/source";
import type { EventFile } from "@/lib/internal/event-files";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Reads flagship event files as the signed-in user (RLS: internal roles).
 * `available` is false on deployments without Supabase, where the portal is
 * read-only and has no file storage.
 */

type FileRow = {
  id: string;
  folder: string;
  name: string;
  size_bytes: number;
  mime_type: string | null;
  updated_at: string;
};

/** PostgREST's default row cap on Supabase. */
const PAGE = 1000;

function toFile(row: FileRow): EventFile {
  return {
    id: row.id,
    folder: row.folder,
    name: row.name,
    sizeBytes: Number(row.size_bytes),
    mimeType: row.mime_type,
    updatedAt: row.updated_at,
  };
}

/** Files of one event (by activity code), or the shared files when `activityCode` is null. */
export async function listEventFiles(
  activityCode: string | null,
): Promise<{ available: boolean; files: EventFile[]; failed: boolean }> {
  if (resolveInternalDataSource() !== "supabase") return { available: false, files: [], failed: false };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { available: false, files: [], failed: false };
  const columns = "id, folder, name, size_bytes, mime_type, updated_at";
  const files: EventFile[] = [];
  for (let from = 0; ; from += PAGE) {
    const base =
      activityCode === null
        ? supabase.from("activity_files").select(columns).is("activity_id", null)
        : supabase
            .from("activity_files")
            .select(`${columns}, activity:activities!inner(code)`)
            .eq("activity.code", activityCode);
    const { data, error } = await base.order("id").range(from, from + PAGE - 1);
    if (error) return { available: true, files: [], failed: true };
    const rows = (data ?? []) as unknown as FileRow[];
    files.push(...rows.map(toFile));
    if (rows.length < PAGE) return { available: true, files, failed: false };
  }
}

/** Number of files per activity code, for the Flagship Events list. */
export async function eventFileCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (resolveInternalDataSource() !== "supabase") return counts;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return counts;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("activity_files")
      .select("activity:activities(code)")
      .not("activity_id", "is", null)
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) return counts;
    const rows = (data ?? []) as unknown as { activity: { code: string } | null }[];
    for (const row of rows) {
      const code = row.activity?.code;
      if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
    }
    if (rows.length < PAGE) return counts;
  }
}
