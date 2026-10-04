import "server-only";
import { openDataContext } from "@/lib/internal/data/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Countries a university can be filed under. Institutions need a country with
 * a region (enforced by a trigger), so only those are offered.
 */
export async function listCountryOptions(): Promise<{ slug: string; name: string }[]> {
  const { source, data } = await openDataContext();
  if (source === "supabase") {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data: rows, error } = await supabase
        .from("countries")
        .select("slug, name")
        .not("region_id", "is", null)
        .order("name");
      if (error) throw new Error(`Supabase query on countries failed: ${error.message}`);
      return (rows ?? []) as { slug: string; name: string }[];
    }
  }
  const seen = new Map<string, string>();
  for (const row of data.institutions) seen.set(row.countryId, row.country);
  return [...seen].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
}
