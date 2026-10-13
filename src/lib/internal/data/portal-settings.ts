import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PortalSettings = {
  accessContactEmail: string | null;
  accessContactNote: string | null;
  updatedAt: string | null;
};

/**
 * The editable portal settings, read as the signed-in user. "unavailable"
 * when Supabase isn't configured or migration 20261005090100 isn't applied
 * yet; callers then fall back to their built-in text.
 */
export const loadPortalSettings = cache(async (): Promise<PortalSettings | "unavailable"> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return "unavailable";
  const { data, error } = await supabase
    .from("portal_settings")
    .select("access_contact_email, access_contact_note, updated_at")
    .maybeSingle();
  if (error || !data) return "unavailable";
  return {
    accessContactEmail: data.access_contact_email,
    accessContactNote: data.access_contact_note,
    updatedAt: data.updated_at,
  };
});
