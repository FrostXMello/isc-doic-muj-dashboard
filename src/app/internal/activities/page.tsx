import type { Metadata } from "next";
import { getDataMode } from "@/lib/internal/data/context";
import { ArrowLeft, ChevronRight, SearchX } from "lucide-react";
import Link from "next/link";
import { ActivityStatusBadge } from "@/components/internal/badges";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { FilterBar } from "@/components/internal/ui/filter-bar";
import { PageHeader } from "@/components/internal/ui/page-header";
import { unavailableReasons } from "@/components/internal/ui/placeholder-action";
import { RecordAction } from "@/components/internal/ui/record-action";
import { DataNotice } from "@/components/internal/ui/source-badge";
import {
  activityStatuses,
  activityTimeframes,
  activityTypes,
  getActivityFilterOptions,
  listActivities,
} from "@/lib/internal/data/activities";
import { formatDateRange, formatRelativeDays } from "@/lib/internal/dates";
import { readEnumParam, readParam, type SearchParamsProp } from "@/lib/internal/query";
import { activityStatusMeta, activityTypeLabel, optionsFrom } from "@/lib/internal/status";
import type { ActivityView } from "@/lib/internal/types";

export const metadata: Metadata = { title: "Activities" };

const statusColor: Record<ActivityView["status"], string> = {
  "needs-update": "var(--warning)",
  planned: "var(--reach-2)",
  confirmed: "var(--reach-2)",
  completed: "var(--success)",
  cancelled: "var(--line-bold)",
};

const monthFormatter = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });

function dayParts(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  return { day: date.getUTCDate(), month: monthFormatter.format(date), year: date.getUTCFullYear() };
}

function place(row: ActivityView) {
  return [row.institution?.name, row.city, row.country].filter(Boolean).join(" · ");
}

function groupByYear(rows: readonly ActivityView[]) {
  const groups: { year: number; items: ActivityView[] }[] = [];
  for (const row of rows) {
    const year = dayParts(row.startDate).year;
    const last = groups.at(-1);
    if (last?.year === year) last.items.push(row);
    else groups.push({ year, items: [row] });
  }
  return groups;
}

const legend = [
  { label: "Needs an update", color: statusColor["needs-update"] },
  { label: "Planned or confirmed", color: statusColor.planned },
  { label: "Completed", color: statusColor.completed },
  { label: "Cancelled", color: statusColor.cancelled },
];

function Timeline({ rows }: { rows: readonly ActivityView[] }) {
  return (
    <div className="space-y-10">
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-muted-foreground" aria-label="Timeline colours">
        {legend.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: item.color }} aria-hidden />
            {item.label}
          </li>
        ))}
      </ul>
      {groupByYear(rows).map((group, groupIndex) => (
        <section
          key={`${group.year}-${groupIndex}`}
          aria-label={`${group.year} activities`}
          className="dash-rise"
          style={{ animationDelay: `${Math.min(groupIndex, 4) * 80}ms` }}
        >
          <h2 className="flex items-baseline gap-3 font-display text-[1.6rem] leading-none font-semibold tracking-[-0.04em] text-foreground tabular-nums">
            {group.year}
            <span className="font-sans text-[12px] font-normal tracking-normal text-fg-faint">
              {group.items.length} {group.items.length === 1 ? "activity" : "activities"}
            </span>
          </h2>
          <ol className="relative mt-4 before:absolute before:top-4 before:bottom-4 before:left-[4.75rem] before:w-px before:bg-line sm:before:left-[5.375rem]">
            {group.items.map((row) => {
              const { day, month } = dayParts(row.startDate);
              const color = statusColor[row.status];
              return (
                <li key={row.id}>
                  <Link
                    href={`/internal/activities/${row.id}`}
                    className="group relative grid grid-cols-[3.5rem_1.25rem_minmax(0,1fr)] items-start gap-x-2.5 rounded-2xl py-3.5 pr-3 transition-colors hover:bg-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:grid-cols-[4rem_1.25rem_minmax(0,1fr)_auto] sm:gap-x-3"
                  >
                    <span className="pt-0.5 text-right leading-none">
                      <span className="block font-display text-[1.45rem] font-medium tracking-[-0.03em] text-foreground tabular-nums">
                        {day}
                      </span>
                      <span className="mt-1 block text-[10px] tracking-[0.08em] text-fg-faint uppercase">{month}</span>
                    </span>
                    <span className="relative flex justify-center pt-1.5" aria-hidden>
                      <span
                        className="size-3 rounded-full ring-4 ring-background transition-transform group-hover:scale-125 motion-reduce:transition-none"
                        style={{ background: color }}
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] leading-snug font-medium text-foreground transition-colors group-hover:text-muj-fg">
                        {row.title}
                      </span>
                      <span className="mt-1 block text-[12px] text-muted-foreground">
                        {activityTypeLabel[row.type]}
                        {place(row) ? ` · ${place(row)}` : null}
                      </span>
                      <span className="mt-1 block text-[12px] text-fg-faint">
                        {formatDateRange(row.startDate, row.endDate)} · {formatRelativeDays(row.daysFromToday)}
                      </span>
                      <span className="mt-2 flex sm:hidden">
                        <ActivityStatusBadge status={row.status} />
                      </span>
                    </span>
                    <span className="hidden items-center gap-2 pt-0.5 sm:flex">
                      <ActivityStatusBadge status={row.status} />
                      <ChevronRight
                        className="size-4 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-muj-fg motion-reduce:transition-none"
                        aria-hidden
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

export default async function ActivitiesPage({ searchParams }: SearchParamsProp) {
  const params = await searchParams;
  const [options, mode] = await Promise.all([getActivityFilterOptions(), getDataMode()]);

  const [rows, all] = await Promise.all([
    listActivities({
      q: readParam(params, "q"),
      type: readEnumParam(params, "type", activityTypes),
      status: readEnumParam(params, "status", activityStatuses),
      country: readEnumParam(params, "country", options.countries),
      timeframe: readEnumParam(params, "when", activityTimeframes),
    }),
    listActivities(),
  ]);

  return (
    <div className="space-y-8">
      <Link
        href="/internal"
        className="inline-flex min-h-9 items-center gap-1.5 text-[13px] text-fg-subtle transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Dashboard
      </Link>
      <PageHeader
        eyebrow="Agenda"
        title="Activities"
        description="International visits, delegations, events, and meetings. Planned items whose date has passed are flagged for an update."
        actions={
          <RecordAction
            permission="activities:create"
            label="Log activity"
            icon="add"
            variant="primary"
            reason={unavailableReasons.editing}
          />
        }
      />

      <DataNotice>
        Activities are recorded only where an official MUJ page documents them (news, event, and
        programme pages), with the source linked on each record. Details the page does not state,
        such as participants or outcomes, are left <em>Not recorded</em>.
        {mode.sampleData
          ? " Fictional sample activities are included because INTERNAL_SAMPLE_DATA is on."
          : null}
      </DataNotice>

      <FilterBar
        searchPlaceholder="Search title, institution, or place"
        noun={{ singular: "activity", plural: "activities" }}
        resultCount={rows.length}
        totalCount={all.length}
        selects={[
          {
            name: "when",
            label: "When",
            allLabel: "Any time",
            options: [
              { value: "upcoming", label: "Upcoming" },
              { value: "past", label: "Past" },
            ],
          },
          {
            name: "type",
            label: "Type",
            allLabel: "All types",
            options: optionsFrom(activityTypes, activityTypeLabel),
          },
          {
            name: "status",
            label: "Status",
            allLabel: "All statuses",
            options: optionsFrom(activityStatuses, activityStatusMeta),
          },
          {
            name: "country",
            label: "Country",
            allLabel: "All countries",
            options: options.countries.map((value) => ({ value, label: value })),
          },
        ]}
      />

      {rows.length > 0 ? (
        <Timeline rows={rows} />
      ) : (
        <div className="portal-surface">
          <EmptyState
            icon={SearchX}
            title="No activities match these filters"
            description="Try a different search term or clear the filters."
          />
        </div>
      )}
    </div>
  );
}
