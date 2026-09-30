import { connection } from "next/server";
import { cache } from "react";
import { todayISO } from "@/lib/internal/dates";
import { type Dataset, staticDataset } from "@/lib/internal/data/dataset";
import { type InternalDataSource, resolveInternalDataSource } from "@/lib/internal/data/source";
import { createViews, type Views } from "@/lib/internal/data/views";

export type DataContext = {
  /** Calendar day (office time zone) used to derive date-based statuses. */
  today: string;
  source: InternalDataSource;
  data: Dataset;
  views: Views;
};

let staticViews: Views | undefined;

/**
 * Entry point for every repository call.
 *
 * Statuses such as "expiring soon" depend on the current date, so reads must
 * happen per request rather than at build time. `connection()` defers
 * rendering until a request arrives. The dataset comes from the static seed
 * modules or, when INTERNAL_DATA_SOURCE=supabase, from Supabase as the
 * signed-in user (see ./source.ts). Memoised per request.
 */
export const openDataContext = cache(async (): Promise<DataContext> => {
  await connection();
  const today = todayISO();
  const source = resolveInternalDataSource();

  if (source === "supabase") {
    const { loadSupabaseDataset } = await import("@/lib/internal/data/supabase-source");
    const data = await loadSupabaseDataset();
    return { today, source, data, views: createViews(data) };
  }

  staticViews ??= createViews(staticDataset);
  return { today, source, data: staticDataset, views: staticViews };
});

export function matchesQuery(query: string | undefined, ...fields: (string | null | undefined)[]) {
  if (!query) return true;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => field?.toLowerCase().includes(needle));
}

export function uniqueSorted(values: Iterable<string>) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
