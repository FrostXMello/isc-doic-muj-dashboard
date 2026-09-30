import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Which store the Internal Portal reads.
 *
 * - `static` (default): the official dataset in src/lib/official, plus the
 *   sample seeds when INTERNAL_SAMPLE_DATA=true. Needs no other environment
 *   variables; this is what the deployed site uses today. Never has contacts.
 * - `supabase`: Supabase, queried as the signed-in user, so row level
 *   security applies. Without a session only public-facing rows are visible
 *   and internal lists render their empty states. Set
 *   INTERNAL_DATA_SOURCE=supabase only once staff can sign in.
 */
export type InternalDataSource = "static" | "supabase";

let warnedMissingEnv = false;

export function resolveInternalDataSource(): InternalDataSource {
  if (process.env.INTERNAL_DATA_SOURCE !== "supabase") return "static";
  if (getSupabasePublicEnv()) return "supabase";

  if (!warnedMissingEnv) {
    warnedMissingEnv = true;
    console.warn(
      "INTERNAL_DATA_SOURCE=supabase but NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set; using static data.",
    );
  }
  return "static";
}
