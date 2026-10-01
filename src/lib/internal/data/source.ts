import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Which store the Internal Portal reads.
 *
 * - `static` (default): the official dataset in src/lib/official, plus the
 *   sample seeds when INTERNAL_SAMPLE_DATA=true. Never has contacts.
 * - `supabase`: Supabase, queried as the signed-in user, so row level
 *   security applies; this is what the deployed site uses. Internal roles
 *   see every internal record and the nodal contacts.
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
