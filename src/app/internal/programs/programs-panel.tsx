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
import { cn } from "@/lib/utils";

const audienceAccent: Record<(typeof programAudiences)[number], string> = {
  students: "var(--reach-2)",
  faculty: "var(--muj)",
};

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
    <div className="space-y-8">
      <DataNotice>
        Offerings are recorded only where an official page names the institution for a programme;
        details the page does not state are left <em>Not recorded</em>.
        {mode.sampleData
          ? " Sample offerings at fictional institutions are included because INTERNAL_SAMPLE_DATA is on."
          : null}
      </DataNotice>

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 lg:grid-cols-2">
        {programAudiences
          .map((audience) => ({ audience, items: programs.filter((p) => p.audience === audience) }))
          .filter((group) => group.items.length > 0)
          .map((group, groupIndex) => (
            <section
              key={group.audience}
              aria-labelledby={`programs-${group.audience}`}
              className="dash-rise min-w-0"
              style={{ animationDelay: `${groupIndex * 90}ms` }}
            >
              <div className="flex items-center gap-3 border-b border-line-strong pb-3">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: audienceAccent[group.audience] }}
                  aria-hidden
                />
                <h2
                  id={`programs-${group.audience}`}
                  className="font-display text-[1.25rem] leading-none font-medium tracking-[-0.03em] text-foreground"
                >
                  For {audienceMeta[group.audience].label.toLowerCase()}
                </h2>
                <span className="ml-auto text-[12px] text-fg-faint">
                  {group.items.length} {group.items.length === 1 ? "programme" : "programmes"}
                </span>
              </div>
              <ul className="divide-y divide-hairline">
                {group.items.map((program) => (
                  <li key={program.id}>
                    <Link
                      href={`/internal/programs/${program.id}`}
                      className="portal-row-marker group grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-xl px-3 py-4 hover:bg-overlay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-medium text-foreground transition-colors group-hover:text-muj-fg">
                            {program.name}
                          </span>
                          <SourceBadge source={program.source} />
                        </span>
                        <span className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                          {program.description}
                        </span>
                      </span>
                      <span className="text-right leading-none">
                        <span
                          className={cn(
                            "block font-display text-[1.6rem] font-semibold tracking-[-0.04em] tabular-nums",
                            program.offeringCount === 0 ? "text-fg-faint" : "text-foreground",
                          )}
                        >
                          {program.offeringCount}
                        </span>
                        <span className="mt-1 block text-[11px] text-fg-faint">
                          {program.offeringCount === 1 ? "offering" : "offerings"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>

      <div className="flex items-baseline gap-3 pt-2">
        <h2 className="font-display text-[1.5rem] leading-none font-medium tracking-[-0.03em] text-foreground">
          Offerings by institution
        </h2>
      </div>

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
