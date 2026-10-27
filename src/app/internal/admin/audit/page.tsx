import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import Link from "next/link";
import { DetailSection } from "@/components/internal/ui/detail";
import { FilterBar } from "@/components/internal/ui/filter-bar";
import { requireAdministration } from "@/lib/internal/admin-access";
import { auditActionLabels, auditActions, auditChanges, auditTableLabels } from "@/lib/internal/audit";
import { readEnumParam, readParam, type SearchParamsProp } from "@/lib/internal/query";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Audit history" };

const PAGE_SIZE = 50;
const tables = Object.keys(auditTableLabels);

type Entry = {
  id: number;
  occurred_at: string;
  actor_id: string | null;
  table_name: string;
  record_id: string | null;
  action: (typeof auditActions)[number];
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
};

export default async function AuditHistoryPage({ searchParams }: SearchParamsProp) {
  await requireAdministration("audit:read");
  const params = await searchParams;
  const table = readEnumParam(params, "table", tables);
  const action = readEnumParam(params, "action", auditActions);
  const page = Math.max(1, Math.min(1000, Number.parseInt(readParam(params, "page") ?? "1", 10) || 1));

  const supabase = await createSupabaseServerClient();
  let entries: Entry[] = [];
  let total = 0;
  let failed = !supabase;
  if (supabase) {
    let query = supabase
      .from("audit_logs")
      .select("id, occurred_at, actor_id, table_name, record_id, action, old_data, new_data", { count: "exact" })
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (table) query = query.eq("table_name", table);
    if (action) query = query.eq("action", action);
    const { data, count, error } = await query;
    failed = Boolean(error);
    entries = (data ?? []) as Entry[];
    total = count ?? 0;
  }

  const actorIds = [...new Set(entries.map((entry) => entry.actor_id).filter((id): id is string => Boolean(id)))];
  const actors = new Map<string, string>();
  if (supabase && actorIds.length > 0) {
    const { data } = await supabase.from("profiles").select("id, email, full_name").in("id", actorIds);
    for (const row of data ?? []) actors.set(row.id, row.full_name?.trim() || row.email || "Unknown account");
  }

  const pageHref = (target: number) => {
    const next = new URLSearchParams();
    if (table) next.set("table", table);
    if (action) next.set("action", action);
    if (target > 1) next.set("page", String(target));
    const qs = next.toString();
    return qs ? `/internal/admin/audit?${qs}` : "/internal/admin/audit";
  };
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <DetailSection
      title="Audit history"
      icon={History}
      description="Every change to records, roles, account status, and settings, newest first. Entries are written by the database and can't be edited or deleted, even by administrators."
    >
      <div className="px-4 sm:px-6 pb-4">
        <FilterBar
          search={false}
          selects={[
            { name: "table", label: "Area", allLabel: "All areas", options: tables.map((value) => ({ value, label: auditTableLabels[value] })) },
            { name: "action", label: "Change", allLabel: "All changes", options: auditActions.map((value) => ({ value, label: auditActionLabels[value] })) },
          ]}
          resultCount={entries.length}
          totalCount={total}
          noun={{ singular: "entry on this page", plural: "entries on this page" }}
        />
      </div>
      {failed ? (
        <p className="px-4 sm:px-6 pb-6 text-[13px] text-danger-fg">Couldn&apos;t load the audit history. Refresh the page to try again.</p>
      ) : entries.length === 0 ? (
        <p className="px-4 sm:px-6 pb-6 text-[13px] text-muted-foreground">No entries match.</p>
      ) : (
        <ol className="divide-y divide-hairline border-t border-hairline">
          {entries.map((entry) => {
            const changes = auditChanges(entry.old_data, entry.new_data);
            const event = typeof entry.new_data?.event === "string" ? entry.new_data.event : typeof entry.old_data?.event === "string" ? entry.old_data.event : null;
            return (
              <li key={entry.id} className="px-4 sm:px-6 py-4 text-[13px]">
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-medium text-foreground">
                    {event ? event.replace(/-/g, " ") : auditActionLabels[entry.action]} · {auditTableLabels[entry.table_name] ?? entry.table_name}
                  </span>
                  <span className="text-fg-subtle">
                    by {entry.actor_id ? (actors.get(entry.actor_id) ?? `account ${entry.actor_id.slice(0, 8)}`) : "system (migration or owner)"}
                  </span>
                  <time dateTime={entry.occurred_at} className="text-fg-faint">
                    {new Date(entry.occurred_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })} IST
                  </time>
                </p>
                {changes.length > 0 ? (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[12px] text-fg-subtle hover:text-foreground">
                      {`${changes.length} ${changes.length === 1 ? "field" : "fields"}${entry.record_id ? ` · record ${entry.record_id.slice(0, 8)}` : ""}`}
                    </summary>
                    <dl className="mt-2 grid gap-1.5 text-[12px] sm:grid-cols-[minmax(8rem,auto)_1fr]">
                      {changes.map((change) => (
                        <div key={change.field} className="contents">
                          <dt className="font-mono text-fg-faint">{change.field}</dt>
                          <dd className="min-w-0 break-words text-fg-soft">
                            {entry.action === "UPDATE" ? (
                              <>
                                <span className="text-danger-fg line-through decoration-danger/40">{change.before ?? "empty"}</span>
                                {" → "}
                                <span className="text-success-fg">{change.after ?? "empty"}</span>
                              </>
                            ) : (
                              (change.after ?? change.before)
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
      {lastPage > 1 ? (
        <nav aria-label="Audit pages" className="flex items-center justify-between border-t border-hairline px-4 sm:px-6 py-3 text-[13px]">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="inline-flex items-center gap-1 text-fg-subtle hover:text-foreground">
              <ChevronLeft className="size-4" aria-hidden /> Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-fg-faint">
            Page {page} of {lastPage}
          </span>
          {page < lastPage ? (
            <Link href={pageHref(page + 1)} className="inline-flex items-center gap-1 text-fg-subtle hover:text-foreground">
              Older <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </DetailSection>
  );
}
