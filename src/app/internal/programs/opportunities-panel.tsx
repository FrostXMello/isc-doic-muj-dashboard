import { getDataMode } from "@/lib/internal/data/context";
import { SearchX } from "lucide-react";
import Link from "next/link";
import { AudienceBadge, OpportunityStatusBadge, RelativeDays } from "@/components/internal/badges";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { FilterBar } from "@/components/internal/ui/filter-bar";
import { ResourceCard, ResourceTable } from "@/components/internal/ui/resource-table";
import { DataNotice } from "@/components/internal/ui/source-badge";
import { StatCard } from "@/components/internal/ui/stat-card";
import {
  getOpportunityFilterOptions,
  listOpportunities,
  opportunitySorts,
  opportunityStatuses,
} from "@/lib/internal/data/opportunities";
import { programTypes } from "@/lib/internal/data/programs";
import { DEADLINE_WARNING_DAYS, formatDate } from "@/lib/internal/dates";
import { readEnumParam, readParam, type SearchParamsRecord } from "@/lib/internal/query";
import {
  audienceMeta,
  opportunityStatusMeta,
  optionsFrom,
  programAudiences,
  programTypeLabel,
} from "@/lib/internal/status";
import type { OpportunityView } from "@/lib/internal/types";

export async function OpportunitiesPanel({ params }: { params: SearchParamsRecord }) {
  const [options, mode] = await Promise.all([getOpportunityFilterOptions(), getDataMode()]);

  const [rows, all] = await Promise.all([
    listOpportunities({
      q: readParam(params, "q"),
      status: readEnumParam(params, "status", opportunityStatuses),
      program: readEnumParam(params, "program", programTypes),
      audience: readEnumParam(params, "audience", programAudiences),
      country: readEnumParam(params, "country", options.countries),
      sort: readEnumParam(params, "sort", opportunitySorts),
    }),
    listOpportunities(),
  ]);

  const count = (status: OpportunityView["status"]) =>
    all.filter((row) => row.status === status).length;

  return (
    <div className="space-y-6">
      <DataNotice>
        Each call belongs to one programme and is for that programme&apos;s audience. Deadlines are
        as published on MUJ&apos;s pages; status follows the dates, and calls within{" "}
        {DEADLINE_WARNING_DAYS} days of the deadline are flagged.
        {mode.sampleData
          ? " Sample calls with invented deadlines are included because INTERNAL_SAMPLE_DATA is on."
          : null}
      </DataNotice>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open" value={count("open")} accent="var(--success)" href="/internal/programs?tab=opportunities&status=open" />
        <StatCard
          label="Closing soon"
          value={count("closing-soon")}
          accent="var(--warning)"
          href="/internal/programs?tab=opportunities&status=closing-soon"
        />
        <StatCard
          label="Opens soon"
          value={count("upcoming")}
          accent="var(--glow)"
          href="/internal/programs?tab=opportunities&status=upcoming"
        />
        <StatCard
          label="Closed or archived"
          value={count("closed") + count("archived")}
          accent="var(--muted-foreground)"
        />
      </div>

      <FilterBar
        searchPlaceholder="Search call, programme, or institution"
        noun={{ singular: "call", plural: "calls" }}
        resultCount={rows.length}
        totalCount={all.length}
        selects={[
          {
            name: "audience",
            label: "Audience",
            allLabel: "Students and faculty",
            options: optionsFrom(programAudiences, audienceMeta),
          },
          {
            name: "status",
            label: "Status",
            allLabel: "All statuses",
            options: optionsFrom(opportunityStatuses, opportunityStatusMeta),
          },
          {
            name: "program",
            label: "Programme",
            allLabel: "All programmes",
            options: optionsFrom(programTypes, programTypeLabel),
          },
          {
            name: "country",
            label: "Country",
            allLabel: "All countries",
            options: options.countries.map((value) => ({ value, label: value })),
          },
          {
            name: "sort",
            label: "Sort",
            defaultValue: "deadline",
            options: [
              { value: "deadline", label: "Deadline" },
              { value: "title", label: "Title" },
            ],
          },
        ]}
      />

      <ResourceTable<OpportunityView>
        caption="Opportunities"
        rows={rows}
        getKey={(row) => row.id}
        getHref={(row) => `/internal/opportunities/${row.id}`}
        getRowLabel={(row) => row.title}
        empty={
          <EmptyState
            icon={SearchX}
            title="No calls match these filters"
            description="Try a different search term or clear the filters."
          />
        }
        columns={[
          {
            key: "title",
            header: "Call",
            cell: (row) => <span className="font-medium">{row.title}</span>,
          },
          {
            key: "program",
            header: "Programme",
            cell: (row) => (
              <Link href={`/internal/programs/${row.programId}`} className="hover:text-primary">
                {row.program.name}
              </Link>
            ),
          },
          {
            key: "audience",
            header: "Audience",
            cell: (row) => <AudienceBadge program={row.programId} />,
          },
          {
            key: "institution",
            header: "University",
            cell: (row) =>
              row.institution ? (
                <span>
                  {row.institution.name}
                  <span className="block text-[12px] text-fg-faint">{row.institution.country}</span>
                </span>
              ) : (
                <span className="text-fg-faint">Not institution-specific</span>
              ),
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => <OpportunityStatusBadge status={row.status} />,
          },
          {
            key: "deadline",
            header: "Deadline",
            className: "whitespace-nowrap",
            cell: (row) => (
              <span>
                {formatDate(row.deadline, "—")}
                <span className="block text-[12px]">
                  <RelativeDays
                    days={row.daysToDeadline}
                    future="Due"
                    past="Closed"
                    warnWithin={DEADLINE_WARNING_DAYS}
                  />
                </span>
              </span>
            ),
          },
        ]}
        renderCard={(row) => (
          <ResourceCard
            title={row.title}
            subtitle={`${row.program.name} · ${row.institution?.name ?? "Not institution-specific"}`}
            badges={
              <>
                <AudienceBadge program={row.programId} />
                <OpportunityStatusBadge status={row.status} />
              </>
            }
            meta={[
              { label: "Opens", value: formatDate(row.opensOn, "—") },
              { label: "Deadline", value: formatDate(row.deadline, "—") },
            ]}
          />
        )}
      />
    </div>
  );
}
