import { connection } from "next/server";
import { cache } from "react";
import { todayISO } from "@/lib/internal/dates";
import {
  canonicalDataset,
  type Dataset,
  sampleDataEnabled,
  staticDataset,
} from "@/lib/internal/data/dataset";
import { type InternalDataSource, resolveInternalDataSource } from "@/lib/internal/data/source";
import { createViews, type Views } from "@/lib/internal/data/views";
import type { InstitutionContact } from "@/lib/internal/types";

/**
 * Whether contact details may be shown. Only `granted` when the data comes
 * from Supabase and the signed-in user holds an internal role (RLS applies
 * the same rule); the static source never carries contacts.
 */
export type ContactAccess =
  | { state: "granted"; contacts: readonly InstitutionContact[] }
  | { state: "restricted"; reason: "static-source" | "no-internal-role" };

export type DataContext = {
  /** Calendar day (office time zone) used to derive date-based statuses. */
  today: string;
  source: InternalDataSource;
  sampleData: boolean;
  data: Dataset;
  views: Views;
  contactAccess: ContactAccess;
};

let staticViews: { samples: boolean; data: Dataset; views: Views } | undefined;

/**
 * Entry point for every repository call.
 *
 * Statuses such as "expiring soon" depend on the current date, so reads must
 * happen per request rather than at build time. `connection()` defers
 * rendering until a request arrives. The dataset comes from the official and
 * seed modules or, when INTERNAL_DATA_SOURCE=supabase, from Supabase as the
 * signed-in user (see ./source.ts). Memoised per request.
 */
export const openDataContext = cache(async (): Promise<DataContext> => {
  await connection();
  const today = todayISO();
  const source = resolveInternalDataSource();
  const sampleData = sampleDataEnabled();

  if (source === "supabase") {
    const { loadSupabaseDataset } = await import("@/lib/internal/data/supabase-source");
    const loaded = await loadSupabaseDataset();
    const { internalRole, contacts } = loaded;
    const data = canonicalDataset(loaded.data);
    return {
      today,
      source,
      sampleData,
      data,
      views: createViews(data),
      contactAccess: internalRole
        ? { state: "granted", contacts }
        : { state: "restricted", reason: "no-internal-role" },
    };
  }

  if (!staticViews || staticViews.samples !== sampleData) {
    const data = canonicalDataset(staticDataset(sampleData));
    staticViews = { samples: sampleData, data, views: createViews(data) };
  }
  return {
    today,
    source,
    sampleData,
    data: staticViews.data,
    views: staticViews.views,
    contactAccess: { state: "restricted", reason: "static-source" },
  };
});

/** Which dataset the portal is reading, for page-level notices. */
export async function getDataMode() {
  const { source, sampleData } = await openDataContext();
  return { source, sampleData };
}

export function matchesQuery(query: string | undefined, ...fields: (string | null | undefined)[]) {
  if (!query) return true;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => field?.toLowerCase().includes(needle));
}

export function uniqueSorted(values: Iterable<string>) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
