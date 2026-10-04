import { SearchX } from "lucide-react";
import Link from "next/link";
import { AudienceBadge, AvailabilityBadge } from "@/components/internal/badges";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { FilterBar } from "@/components/internal/ui/filter-bar";
import { ResourceCard, ResourceTable } from "@/components/internal/ui/resource-table";
import { DataNotice, SourceBadge } from "@/components/internal/ui/source-badge";
import { getDataMode } from "@/lib/internal/data/context";
import {
  availabilityFilters,
  getOfferingFilterOptions,
  listOfferings,
  listPrograms,
  programTypes,
} from "@/lib/internal/data/programs";
import { formatDateRange } from "@/lib/internal/dates";
import { readEnumParam, readParam, type SearchParamsRecord } from "@/lib/internal/query";
import {
  audienceMeta,
  availabilityMeta,
  optionsFrom,
  programAudiences,
  programTypeLabel,
} from "@/lib/internal/status";
import type { ProgramAvailabilityView } from "@/lib/internal/types";

export async function ProgramsPanel({ params }: { params: SearchParamsRecord }) {
  const [options, mode] = await Promise.all([getOfferingFilterOptions(), getDataMode()]);
  const audience = readEnumParam(params, "audience", programAudiences);

  const [programs, rows, all] = await Promise.all([
    listPrograms({ audience }),
    listOfferings({
      q: readParam(params, "q"),
      audience,
      program: readEnumParam(params, "program", programTypes),
      country: readEnumParam(params, "country", options.countries),
      availability: readEnumParam(params, "availability", availabilityFilters),
    }),
    listOfferings(),
  ]);

  return (
    <div className="space-y-6">
      <DataNotice>
        Offerings are recorded only where an official page names the institution for a programme;
        details the page does not state are left <em>Not recorded</em>.
        {mode.sampleData
          ? " Sample offerings at fictional institutions are included because INTERNAL_SAMPLE_DATA is on."
          : null}
      </DataNotice>

      {programAudiences
        .map((audience) => ({ audience, items: programs.filter((p) => p.audience === audience) }))
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <section key={group.audience} aria-labelledby={`programs-${group.audience}`}>
            <h2
              id={`programs-${group.audience}`}
              className="mb-2 text-[12px] font-medium uppercase tracking-wide text-fg-subtle"
            >
              For {audienceMeta[group.audience].label.toLowerCase()}
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((program) => (
                <li key={program.id}>
                  <Link
                    href={`/internal/programs/${program.id}`}
                    className="block h-full rounded-xl border border-line bg-card p-4 transition-colors hover:border-line-bold hover:bg-surface-raised"
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
                      {program.offeringCount === 1 ? "offering" : "offerings"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

      <FilterBar
        searchPlaceholder="Search programme, institution, or country"
        noun={{ singular: "offering", plural: "offerings" }}
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
            key: "audience",
            header: "Audience",
            cell: (row) => <AudienceBadge program={row.programId} />,
          },
          {
            key: "institution",
            header: "Institution",
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
            key: "source",
            header: "Source",
            cell: (row) => <SourceBadge source={row.source} />,
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
            badges={
              <>
                <AudienceBadge program={row.programId} />
                <AvailabilityBadge availability={row.availability} />
              </>
            }
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
