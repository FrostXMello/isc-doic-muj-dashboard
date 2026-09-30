import { connection } from "next/server";
import { todayISO } from "@/lib/internal/dates";

export type DataContext = {
  /** Calendar day (office time zone) used to derive date-based statuses. */
  today: string;
};

/**
 * Entry point for every repository call.
 *
 * Statuses such as "expiring soon" depend on the current date, so reads must
 * happen per request rather than at build time. `connection()` defers
 * rendering until a request arrives — the same behaviour a database query
 * would need. When a database is connected, this is where the client and the
 * signed-in user's scope would be resolved.
 */
export async function openDataContext(): Promise<DataContext> {
  await connection();
  return { today: todayISO() };
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
