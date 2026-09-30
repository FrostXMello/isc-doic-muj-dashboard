import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import Link from "next/link";
import { AvailabilityBadge } from "@/components/internal/badges";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { FilterBar } from "@/components/internal/ui/filter-bar";
import { PageHeader } from "@/components/internal/ui/page-header";
import {
  PlaceholderAction,
  unavailableReasons,
} from "@/components/internal/ui/placeholder-action";
import { ResourceCard, ResourceTable } from "@/components/internal/ui/resource-table";
import { DataNotice, SourceBadge } from "@/components/internal/ui/source-badge";
import {
  availabilityFilters,
  getOfferingFilterOptions,
  listOfferings,
  listPrograms,
  programTypes,
} from "@/lib/internal/data/programs";
import { formatDateRange } from "@/lib/internal/dates";
import { readEnumParam, readParam, type SearchParamsProp } from "@/lib/internal/query";
import { availabilityMeta, optionsFrom, programTypeLabel } from "@/lib/internal/status";
import type { ProgramAvailabilityView } from "@/lib/internal/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Programs" };

export default async function ProgramsPage({ searchParams }: SearchParamsProp) {
  const params = await searchParams;
  const options = await getOfferingFilterOptions();
  const selectedProgram = readEnumParam(params, "program", programTypes);

  const [programs, rows, all] = await Promise.all([
    listPrograms(),
    listOfferings({
      q: readParam(params, "q"),
      program: selectedProgram,
      country: readEnumParam(params, "country", options.countries),
      availability: readEnumParam(params, "availability", availabilityFilters),
    }),
    listOfferings(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programs"
        description="Programme types and the institution-specific offerings recorded for each. A programme is not assumed to be available at an institution unless an offering is recorded."
        actions={
          <PlaceholderAction
            label="New offering"
            icon="add"
            variant="primary"
            reason={unavailableReasons.editing}
          />
        }
      />

      <DataNotice>
        The four programme types come from the public site&apos;s programme catalogue. Every
        offering (institution × programme) is <strong className="font-medium">sample data</strong>{" "}
        at a fictional institution; durations and application windows are placeholders, and
        eligibility and credit are left unrecorded.
      </DataNotice>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Programme types">
        {programs.map((program) => {
          const active = selectedProgram === program.id;
          return (
            <li key={program.id}>
              <Link
                href={active ? "/internal/programs" : `/internal/programs?program=${program.id}`}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "block h-full rounded-xl border p-4 transition-colors",
                  active
                    ? "border-cyan/40 bg-cyan/[0.06]"
                    : "border-line bg-card hover:border-line-bold hover:bg-surface-raised",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[14px] font-medium text-foreground">{program.name}</p>
                  <SourceBadge source={program.source} />
                </div>
                <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-muted-foreground">
                  {program.description}
                </p>
                <p className="mt-3 text-[12px] text-fg-subtle">
                  <span className="text-foreground tabular-nums">{program.offeringCount}</span>{" "}
                  {program.offeringCount === 1 ? "offering" : "offerings"} ·{" "}
                  <span className="text-foreground tabular-nums">{program.openCount}</span> open
                </p>
              </Link>
            </li>
          );
        })}
      </ul>

      <FilterBar
        searchPlaceholder="Search programme, institution, or country"
        noun={{ singular: "offering", plural: "offerings" }}
        resultCount={rows.length}
        totalCount={all.length}
        selects={[
          {
            name: "program",
            label: "Programme type",
            allLabel: "All programme types",
            options: optionsFrom(programTypes, programTypeLabel),
          },
          {
            name: "country",
            label: "Country",
            allLabel: "All countries",
            options: options.countries.map((value) => ({ value, label: value })),
          },
          {
            name: "availability",
            label: "Availability",
            allLabel: "All availability",
            options: optionsFrom(availabilityFilters, availabilityMeta),
          },
        ]}
      />

      <ResourceTable<ProgramAvailabilityView>
        caption="Programme offerings"
        rows={rows}
        getKey={(row) => row.id}
        getHref={(row) => `/internal/programs/${row.id}`}
        getRowLabel={(row) => `${row.program.name} at ${row.institution?.name ?? "unknown institution"}`}
        empty={
          <EmptyState
            icon={SearchX}
            title="No offerings match these filters"
            description="No institution × programme pairing is recorded for this selection."
          />
        }
        columns={[
          {
            key: "program",
            header: "Programme",
            cell: (row) => <span className="font-medium">{row.program.name}</span>,
          },
          {
            key: "institution",
            header: "Partner university",
            cell: (row) => row.institution?.name ?? "—",
          },
          {
            key: "country",
            header: "Country",
            cell: (row) => row.institution?.country ?? "—",
          },
          {
            key: "availability",
            header: "Status",
            cell: (row) => <AvailabilityBadge availability={row.availability} />,
          },
          {
            key: "duration",
            header: "Duration",
            cell: (row) => row.duration ?? <span className="text-fg-faint">Not recorded</span>,
          },
          {
            key: "window",
            header: "Application window",
            className: "whitespace-nowrap text-[12px]",
            cell: (row) =>
              row.applicationStart || row.applicationEnd ? (
                formatDateRange(row.applicationStart, row.applicationEnd)
              ) : (
                <span className="text-fg-faint">Not recorded</span>
              ),
          },
        ]}
        renderCard={(row) => (
          <ResourceCard
            title={row.program.name}
            subtitle={`${row.institution?.name ?? "—"} · ${row.institution?.country ?? "—"}`}
            badges={<AvailabilityBadge availability={row.availability} />}
            meta={[
              { label: "Duration", value: row.duration ?? "Not recorded" },
              {
                label: "Applications",
                value:
                  row.applicationStart || row.applicationEnd
                    ? formatDateRange(row.applicationStart, row.applicationEnd)
                    : "Not recorded",
              },
            ]}
          />
        )}
      />
    </div>
  );
}
