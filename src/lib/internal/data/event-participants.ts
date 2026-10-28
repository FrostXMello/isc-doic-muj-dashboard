import "server-only";

import { resolveInternalDataSource } from "@/lib/internal/data/source";
import type { EventParticipant } from "@/lib/internal/participants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Row = {
  id: string;
  name: string;
  email: string | null;
  gender: string | null;
  category: string | null;
  institution: string | null;
  country: string | null;
  course: string | null;
  mode: string | null;
  qualification: string | null;
  partner: { slug: string } | null;
};

/** An event's participants (by activity code), read as the signed-in user; empty without Supabase. */
export async function listEventParticipants(activityCode: string): Promise<EventParticipant[]> {
  if (resolveInternalDataSource() !== "supabase") return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("event_participants")
    .select(
      "id, name, email, gender, category, institution, country, course, mode, qualification, " +
        "partner:institutions(slug), activity:activities!inner(code)",
    )
    .eq("activity.code", activityCode)
    .order("sort_order")
    .range(0, 999);
  if (error || !data) return [];
  return (data as unknown as Row[]).map(({ partner, ...row }) => ({ ...row, partnerId: partner?.slug ?? null }));
}
