"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  blobPath,
  cleanFolder,
  cleanName,
  EVENT_FILES_BUCKET,
  type EventFileInput,
  isSha256,
  MAX_EVENT_FILE_BYTES,
  uniqueName,
} from "@/lib/internal/event-files";
import type { Permission } from "@/lib/internal/permissions";
import {
  commonError,
  isState,
  type PgError,
  refreshPortal,
  tryAgain,
  writableClient,
} from "@/lib/internal/write-context";

/**
 * Flagship event files. The browser uploads bytes straight to the private
 * bucket (storage RLS checks the role and path); these actions record,
 * rename, move, and delete the file rows as the signed-in user, so table RLS
 * decides: editors add, rename, and move; administrators delete.
 */

export type EventFileResult = { error?: string; message?: string };

const MAX_BATCH = 100;

async function client(permission: Permission): Promise<{ supabase: SupabaseClient } | { error: string }> {
  const writable = await writableClient(permission);
  if (isState(writable)) return { error: writable.error ?? "You don't have permission to do that." };
  return { supabase: writable.supabase };
}

function fail(error: NonNullable<PgError>): EventFileResult {
  return { error: (commonError(error) ?? tryAgain).error };
}

/** The activity's uuid, null for shared files, or an error message. */
async function scope(supabase: SupabaseClient, activityCode: string | null): Promise<{ id: string | null } | string> {
  if (activityCode === null) return { id: null };
  const { data, error } = await supabase.from("activities").select("id").eq("code", activityCode).maybeSingle();
  if (error) return tryAgain.error ?? "Try again.";
  if (!data) return "Unknown event.";
  return { id: data.id as string };
}

/** `select` on the event's files (or the shared files). */
function scopedFiles(supabase: SupabaseClient, columns: string, activityId: string | null) {
  const query = supabase.from("activity_files").select(columns);
  return activityId === null ? query.is("activity_id", null) : query.eq("activity_id", activityId);
}

/** Files in `folder` and every folder below it. */
async function filesUnder(
  supabase: SupabaseClient,
  activityId: string | null,
  folder: string,
): Promise<{ id: string; folder: string }[] | NonNullable<PgError>> {
  const found: { id: string; folder: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await scopedFiles(supabase, "id, folder", activityId)
      .order("id")
      .range(from, from + 999);
    if (error) return error;
    const rows = (data ?? []) as unknown as { id: string; folder: string }[];
    found.push(...rows.filter((row) => row.folder === folder || row.folder.startsWith(`${folder}/`)));
    if (rows.length < 1000) return found;
  }
}

/** Removes stored blobs that no file row points at any more. */
async function removeOrphans(supabase: SupabaseClient, paths: readonly string[]) {
  const unique = [...new Set(paths)];
  if (unique.length === 0) return;
  const { data } = await supabase.from("activity_files").select("storage_path").in("storage_path", unique);
  const used = new Set((data ?? []).map((row) => row.storage_path as string));
  const orphans = unique.filter((path) => !used.has(path));
  if (orphans.length > 0) await supabase.storage.from(EVENT_FILES_BUCKET).remove(orphans);
}

async function blobExists(supabase: SupabaseClient, sha: string) {
  const { data, error } = await supabase.storage.from(EVENT_FILES_BUCKET).list("blobs", { search: sha, limit: 1 });
  return !error && (data ?? []).some((object) => object.name === sha);
}

/** Records files the browser has just uploaded. Names already taken in a folder get " (2)", " (3)", … */
export async function recordEventFiles(activityCode: string | null, files: EventFileInput[]): Promise<EventFileResult> {
  if (!Array.isArray(files) || files.length === 0) return { error: "No files to add." };
  if (files.length > MAX_BATCH) return { error: `Add at most ${MAX_BATCH} files at a time.` };
  const rows: { folder: string; name: string; sha: string; size: number; mime: string }[] = [];
  for (const file of files) {
    const folder = cleanFolder(String(file.folder ?? ""));
    const name = cleanName(String(file.name ?? ""));
    const size = Number(file.size);
    if (folder === null || name === null) return { error: `"${file.name}" has a name or folder that can't be used.` };
    if (!isSha256(String(file.sha))) return { error: "Unknown upload." };
    if (!Number.isFinite(size) || size < 0 || size > MAX_EVENT_FILE_BYTES) return { error: `"${name}" is larger than 50 MB.` };
    rows.push({ folder, name, sha: file.sha, size, mime: String(file.mime || "application/octet-stream").slice(0, 200) });
  }

  const writable = await client("documents:upload");
  if ("error" in writable) return writable;
  const { supabase } = writable;
  const target = await scope(supabase, activityCode);
  if (typeof target === "string") return { error: target };

  const missing = await Promise.all(
    [...new Set(rows.map((row) => row.sha))].map(async (sha) => ((await blobExists(supabase, sha)) ? null : sha)),
  );
  if (missing.some(Boolean)) return { error: "Some uploads didn't complete. Try those files again." };

  const folders = [...new Set(rows.map((row) => row.folder))];
  const { data: existing, error: existingError } = await scopedFiles(supabase, "folder, name", target.id).in(
    "folder",
    folders,
  );
  if (existingError) return fail(existingError);
  const taken = new Map<string, Set<string>>();
  for (const row of (existing ?? []) as unknown as { folder: string; name: string }[]) {
    const set = taken.get(row.folder as string) ?? new Set<string>();
    set.add((row.name as string).toLowerCase());
    taken.set(row.folder as string, set);
  }

  const inserts = rows.map((row) => {
    const set = taken.get(row.folder) ?? new Set<string>();
    const name = uniqueName(row.name, set);
    set.add(name.toLowerCase());
    taken.set(row.folder, set);
    return {
      activity_id: target.id,
      folder: row.folder,
      name,
      storage_path: blobPath(row.sha),
      mime_type: row.mime,
      size_bytes: row.size,
    };
  });
  const { error } = await supabase.from("activity_files").insert(inserts);
  if (error) return fail(error);
  refreshPortal();
  return { message: `${inserts.length} ${inserts.length === 1 ? "file" : "files"} added.` };
}

/** Renames a file and/or moves it to another folder of the same event. */
export async function updateEventFile(id: string, name: string, folder: string): Promise<EventFileResult> {
  const cleanedName = cleanName(name);
  const cleanedFolder = cleanFolder(folder);
  if (!cleanedName) return { error: "Enter a file name without slashes." };
  if (cleanedFolder === null) return { error: "Enter a folder like “Certificates/Scanned”." };
  const writable = await client("activities:update");
  if ("error" in writable) return writable;
  const { supabase } = writable;
  const { data, error } = await supabase
    .from("activity_files")
    .update({ name: cleanedName, folder: cleanedFolder })
    .eq("id", id)
    .select("id");
  if (error) {
    if (error.code === "23505") return { error: "A file with that name is already in that folder." };
    return fail(error);
  }
  if (!data || data.length === 0) return { error: "You don't have permission to do that." };
  refreshPortal();
  return { message: "File updated." };
}

/** Renames or moves a folder, with everything inside it. */
export async function renameEventFolder(activityCode: string | null, from: string, to: string): Promise<EventFileResult> {
  const source = cleanFolder(from);
  const destination = cleanFolder(to);
  if (!source) return { error: "Unknown folder." };
  if (destination === null || destination === "") return { error: "Enter a folder name without slashes at the ends." };
  if (destination === source) return {};
  if (destination.startsWith(`${source}/`)) return { error: "A folder can't be moved inside itself." };
  const writable = await client("activities:update");
  if ("error" in writable) return writable;
  const { supabase } = writable;
  const target = await scope(supabase, activityCode);
  if (typeof target === "string") return { error: target };

  const rows = await filesUnder(supabase, target.id, source);
  if (!Array.isArray(rows)) return fail(rows);
  for (const row of rows) {
    const folder = destination + (row.folder as string).slice(source.length);
    const { error: updateError } = await supabase.from("activity_files").update({ folder }).eq("id", row.id);
    if (updateError) {
      refreshPortal();
      if (updateError.code === "23505") return { error: "Some files couldn't move: the destination already has files with the same names." };
      return fail(updateError);
    }
  }
  refreshPortal();
  return { message: "Folder updated." };
}

export async function deleteEventFile(id: string): Promise<EventFileResult> {
  const writable = await client("activities:delete");
  if ("error" in writable) return writable;
  const { supabase } = writable;
  const { data, error } = await supabase.from("activity_files").delete().eq("id", id).select("storage_path");
  if (error) return fail(error);
  if (!data || data.length === 0) return { error: "You don't have permission to do that." };
  await removeOrphans(supabase, data.map((row) => row.storage_path as string));
  refreshPortal();
  return { message: "File deleted." };
}

/** Deletes a folder and everything inside it. */
export async function deleteEventFolder(activityCode: string | null, folder: string): Promise<EventFileResult> {
  const source = cleanFolder(folder);
  if (!source) return { error: "Unknown folder." };
  const writable = await client("activities:delete");
  if ("error" in writable) return writable;
  const { supabase } = writable;
  const target = await scope(supabase, activityCode);
  if (typeof target === "string") return { error: target };
  const rows = await filesUnder(supabase, target.id, source);
  if (!Array.isArray(rows)) return fail(rows);
  const deleted: string[] = [];
  for (let i = 0; i < rows.length; i += MAX_BATCH) {
    const ids = rows.slice(i, i + MAX_BATCH).map((row) => row.id);
    const { data, error } = await supabase.from("activity_files").delete().in("id", ids).select("storage_path");
    if (error) {
      await removeOrphans(supabase, deleted);
      refreshPortal();
      return fail(error);
    }
    deleted.push(...(data ?? []).map((row) => row.storage_path as string));
  }
  if (rows.length > 0 && deleted.length === 0) return { error: "You don't have permission to do that." };
  await removeOrphans(supabase, deleted);
  refreshPortal();
  return { message: `${deleted.length} ${deleted.length === 1 ? "file" : "files"} deleted.` };
}
