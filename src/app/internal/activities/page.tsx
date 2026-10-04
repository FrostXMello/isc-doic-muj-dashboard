import type { Metadata } from "next";
import { getDataMode } from "@/lib/internal/data/context";
import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";
import { ActivityStatusBadge } from "@/components/internal/badges";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { FilterBar } from "@/components/internal/ui/filter-bar";
import { PageHeader } from "@/components/internal/ui/page-header";
import { unavailableReasons } from "@/components/internal/ui/placeholder-action";
import { RecordAction } from "@/components/internal/ui/record-action";
import { ResourceCard, ResourceTable } from "@/components/internal/ui/resource-table";
import { DataNotice } from "@/components/internal/ui/source-badge";
import { StatCard } from "@/components/internal/ui/stat-card";
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

function Location({ row }: { row: ActivityView }) {
  return (
    <span>
      {row.institution?.name ?? row.country}
      <span className="block text-[12px] text-fg-faint">
        {[row.city, row.institution ? row.country : null].filter(Boolean).join(" · ") || "—"}
      </span>
    </span>
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

  const upcoming = all.filter((row) => row.daysFromToday >= 0 && row.status !== "cancelled").length;
  const needsUpdate = all.filter((row) => row.status === "needs-update").length;
  const completed = all.filter((row) => row.status === "completed").length;

  return (
    <div className="space-y-6">
      <Link
        href="/internal"
        className="inline-flex min-h-9 items-center gap-1.5 text-[13px] text-fg-subtle transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Dashboard
      </Link>
      <PageHeader
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Upcoming" value={upcoming} accent="var(--glow)" href="/internal/activities?when=upcoming" />
        <StatCard
          label="Needs update"
          value={needsUpdate}
          accent="var(--warning)"
          href="/internal/activities?status=needs-update"
        />
        <StatCard label="Completed" value={completed} accent="var(--success)" href="/internal/activities?status=completed" />
        <StatCard label="Total recorded" value={all.length} accent="var(--muted-foreground)" />
      </div>

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

      <ResourceTable<ActivityView>
        caption="Activities"
        rows={rows}
        getKey={(row) => row.id}
        getHref={(row) => `/internal/activities/${row.id}`}
        getRowLabel={(row) => row.title}
        empty={
          <EmptyState
            icon={SearchX}
            title="No activities match these filters"
            description="Try a different search term or clear the filters."
          />
        }
        columns={[
          {
            key: "title",
            header: "Activity",
            cell: (row) => <span className="font-medium">{row.title}</span>,
          },
          { key: "type", header: "Type", cell: (row) => activityTypeLabel[row.type] },
          {
            key: "date",
            header: "Date",
            className: "whitespace-nowrap",
            cell: (row) => (
              <span>
                {formatDateRange(row.startDate, row.endDate)}
                <span className="block text-[12px] text-fg-faint">
                  {formatRelativeDays(row.daysFromToday)}
                </span>
              </span>
            ),
          },
          { key: "where", header: "Institution / country", cell: (row) => <Location row={row} /> },
          { key: "status", header: "Status", cell: (row) => <ActivityStatusBadge status={row.status} /> },
        ]}
        renderCard={(row) => (
          <ResourceCard
            title={row.title}
            subtitle={`${activityTypeLabel[row.type]} · ${row.institution?.name ?? row.country}`}
            badges={<ActivityStatusBadge status={row.status} />}
            meta={[
              { label: "Date", value: formatDateRange(row.startDate, row.endDate) },
              { label: "Where", value: [row.city, row.country].filter(Boolean).join(", ") },
            ]}
          />
        )}
      />
    </div>
  );
}
