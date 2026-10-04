import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import Link from "next/link";
import { PartnershipBadge } from "@/components/internal/badges";
import { SuccessNotice } from "@/components/internal/forms/form-fields";
import { VerificationBadge } from "@/components/internal/ui/provenance";
import { getDataMode } from "@/lib/internal/data/context";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { FilterBar } from "@/components/internal/ui/filter-bar";
import { ManageLink } from "@/components/internal/ui/manage-action";
import { PageHeader } from "@/components/internal/ui/page-header";
import { ResourceCard, ResourceTable } from "@/components/internal/ui/resource-table";
import { DataNotice, SourceBadge } from "@/components/internal/ui/source-badge";
import { agreementStatuses, agreementTypes } from "@/lib/internal/data/agreements";
import {
  agreementCoverage,
  getInstitutionFilterOptions,
  institutionSources,
  listInstitutions,
  partnershipStatuses,
  type UniversityRow,
} from "@/lib/internal/data/institutions";
import { EXPIRY_WARNING_DAYS, formatDate } from "@/lib/internal/dates";
import {
  readEnumParam,
  readParam,
  type SearchParamsProp,
  type SearchParamsRecord,
} from "@/lib/internal/query";
import { cn } from "@/lib/utils";
import {
  agreementStatusMeta,
  agreementTypeLabel,
  optionsFrom,
  partnershipStatusMeta,
  sourceMeta,
} from "@/lib/internal/status";

export const metadata: Metadata = { title: "Universities & MoUs" };

function mouSummary(row: UniversityRow) {
  if (row.agreements.length === 0) return null;
  const types = [...new Set(row.agreements.map((a) => a.typeLabel ?? agreementTypeLabel[a.type]))];
  return types.length > 2 ? `${types.slice(0, 2).join(", ")} +${types.length - 2}` : types.join(", ");
}

function MouCount({ row }: { row: UniversityRow }) {
  if (row.agreementCount === 0) return <span className="text-fg-faint">None recorded</span>;
  return (
    <span>
      <span className="tabular-nums">
        {row.agreementCount} MoU{row.agreementCount === 1 ? "" : "s"}
        {row.activeAgreementCount > 0 ? (
          <span className="text-fg-faint"> · {row.activeAgreementCount} active</span>
        ) : null}
      </span>
      <span className="block max-w-56 truncate text-[12px] text-fg-faint">{mouSummary(row)}</span>
    </span>
  );
}

const regionColor = (rank: number) => `var(--reach-${(rank % 7) + 1})`;

function regionHref(params: SearchParamsRecord, region: string | null) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "region" || key === "notice" || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) next.append(key, item);
  }
  if (region) next.set("region", region);
  const query = next.toString();
  return query ? `/internal/universities?${query}` : "/internal/universities";
}

function RegionIndex({
  regions,
  active,
  params,
}: {
  regions: { region: string; universities: number; countries: number }[];
  active: string | undefined;
  params: SearchParamsRecord;
}) {
  const total = regions.reduce((sum, row) => sum + row.universities, 0);
  return (
    <nav aria-label="Browse by region" className="dash-rise">
      <div
        className="flex h-1.5 overflow-hidden rounded-full bg-overlay"
        role="img"
        aria-label={regions.map((row) => `${row.region}: ${row.universities}`).join(", ")}
      >
        {regions.map((row, rank) => (
          <span
            key={row.region}
            className={cn("h-full transition-opacity", active && active !== row.region && "opacity-30")}
            style={{ width: `${(row.universities / Math.max(total, 1)) * 100}%`, background: regionColor(rank) }}
          />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 xl:grid-cols-7">
        {regions.map((row, rank) => {
          const isActive = active === row.region;
          return (
            <li key={row.region}>
              <Link
                href={regionHref(params, isActive ? null : row.region)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "group flex flex-col rounded-lg py-2 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  active && !isActive && "opacity-55 hover:opacity-100",
                )}
              >
                <span className="flex items-center gap-2 text-[12px] text-muted-foreground group-hover:text-foreground">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: regionColor(rank) }} aria-hidden />
                  <span className="truncate">{row.region}</span>
                </span>
                <span className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-display text-[1.6rem] leading-none font-semibold tracking-[-0.04em] text-foreground tabular-nums">
                    {row.universities}
                  </span>
                  <span className="text-[11px] text-fg-faint">
                    {row.countries} {row.countries === 1 ? "country" : "countries"}
                  </span>
                </span>
                <span
                  className={cn(
                    "mt-2 h-0.5 w-6 rounded-full transition-[width] duration-300 group-hover:w-10 motion-reduce:transition-none",
                    isActive && "w-full group-hover:w-full",
                  )}
                  style={{ background: regionColor(rank) }}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default async function UniversitiesPage({ searchParams }: SearchParamsProp) {
  const params = await searchParams;
  const [options, mode] = await Promise.all([getInstitutionFilterOptions(), getDataMode()]);

  const [rows, all] = await Promise.all([
    listInstitutions({
      q: readParam(params, "q"),
      region: readEnumParam(params, "region", options.regions),
      country: readEnumParam(params, "country", options.countries),
      status: readEnumParam(params, "status", partnershipStatuses),
      source: readEnumParam(params, "source", institutionSources),
      coverage: readEnumParam(params, "coverage", agreementCoverage),
      agreementStatus: readEnumParam(params, "mouStatus", agreementStatuses),
      agreementType: readEnumParam(params, "mouType", agreementTypes),
    }),
    listInstitutions(),
  ]);

  const deleted = readParam(params, "notice") === "university-deleted";
  const activeRegion = readEnumParam(params, "region", options.regions);
  const regionRank = new Map<string, number>();
  const regions = options.regions
    .map((region) => {
      const members = all.filter((row) => row.region === region);
      return { region, universities: members.length, countries: new Set(members.map((row) => row.country)).size };
    })
    .filter((row) => row.universities > 0)
    .sort((a, b) => b.universities - a.universities);
  regions.forEach((row, rank) => regionRank.set(row.region, rank));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Global network"
        title="Universities & MoUs"
        description={`Each partner university once, with every MoU and agreement recorded for it. Where dates are recorded, agreements ending within ${EXPIRY_WARNING_DAYS} days are flagged as expiring soon.`}
        actions={
          <ManageLink
            permission="institutions:create"
            href="/internal/universities/new"
            label="Add university"
            icon="add"
            variant="primary"
          />
        }
      />

      {deleted ? <SuccessNotice>University deleted.</SuccessNotice> : null}

      <DataNotice>
        <strong className="font-medium">Official MUJ source</strong> institutions and their
        collaboration rows are imported from the official partner page, which gives no dates or
        status, so those MoUs show <em>Status not stated</em>. Only rows whose wording names an
        agreement type carry that type. <strong className="font-medium">Earlier directory</strong>{" "}
        names are not on the official page and await DoIC review.
        {mode.sampleData ? (
          <>
            {" "}
            <strong className="font-medium">Sample data</strong> institutions (&ldquo;Example
            &hellip;&rdquo;) are fictional and shown because INTERNAL_SAMPLE_DATA is on.
          </>
        ) : null}
      </DataNotice>

      {regions.length > 0 ? <RegionIndex regions={regions} active={activeRegion} params={params} /> : null}

      <FilterBar
        searchPlaceholder="Search university, country, or MoU"
        noun={{ singular: "university", plural: "universities" }}
        resultCount={rows.length}
        totalCount={all.length}
        selects={[
          {
            name: "region",
            label: "Region",
            allLabel: "All regions",
            options: options.regions.map((value) => ({ value, label: value })),
          },
          {
            name: "country",
            label: "Country",
            allLabel: "All countries",
            options: options.countries.map((value) => ({ value, label: value })),
          },
          {
            name: "coverage",
            label: "MoUs",
            allLabel: "With or without MoUs",
            options: [
              { value: "with", label: "With MoUs" },
              { value: "without", label: "No MoU recorded" },
            ],
          },
          {
            name: "mouStatus",
            label: "MoU status",
            allLabel: "Any MoU status",
            options: optionsFrom(agreementStatuses, agreementStatusMeta),
          },
          {
            name: "mouType",
            label: "MoU type",
            allLabel: "Any MoU type",
            options: optionsFrom(agreementTypes, agreementTypeLabel),
          },
          {
            name: "status",
            label: "Partnership",
            allLabel: "All partnership statuses",
            options: optionsFrom(partnershipStatuses, partnershipStatusMeta),
          },
          {
            name: "source",
            label: "Source",
            allLabel: "All sources",
            options: institutionSources.map((value) => ({
              value,
              label: sourceMeta[value].label,
            })),
          },
        ]}
      />

      <ResourceTable<UniversityRow>
        caption="Universities and their MoUs"
        rows={rows}
        getKey={(row) => row.id}
        getHref={(row) => `/internal/universities/${row.id}`}
        getRowLabel={(row) => `${row.name}, ${row.country}`}
        empty={
          <EmptyState
            icon={SearchX}
            title="No universities match these filters"
            description="Try a different search term or clear the filters."
          />
        }
        columns={[
          {
            key: "name",
            header: "University",
            cell: (row) => (
              <span className="font-medium">
                {row.name}
                {row.normalizedName && row.normalizedName !== row.name ? (
                  <span className="block text-[12px] font-normal text-fg-faint">{row.normalizedName}</span>
                ) : null}
              </span>
            ),
          },
          {
            key: "location",
            header: "Location",
            cell: (row) => (
              <span>
                {row.country}
                <span className="flex items-center gap-1.5 text-[12px] text-fg-faint">
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ background: regionColor(regionRank.get(row.region) ?? 0) }}
                    aria-hidden
                  />
                  {row.region}
                </span>
              </span>
            ),
          },
          {
            key: "agreements",
            header: "MoUs",
            cell: (row) => <MouCount row={row} />,
          },
          {
            key: "status",
            header: "Partnership",
            cell: (row) => <PartnershipBadge status={row.partnershipStatus} />,
          },
          {
            key: "expiry",
            header: "Next expiry",
            className: "whitespace-nowrap",
            cell: (row) =>
              row.nextExpiry ? formatDate(row.nextExpiry) : <span className="text-fg-faint">—</span>,
          },
          {
            key: "source",
            header: "Source",
            cell: (row) => (
              <span className="flex flex-col items-start gap-1">
                <SourceBadge source={row.source} />
                <VerificationBadge status={row.verification} />
              </span>
            ),
          },
        ]}
        renderCard={(row) => (
          <ResourceCard
            title={row.name}
            subtitle={`${row.country} · ${row.region}`}
            badges={
              <>
                <PartnershipBadge status={row.partnershipStatus} />
                <SourceBadge source={row.source} />
              </>
            }
            meta={[
              {
                label: "MoUs",
                value: row.agreementCount
                  ? `${row.agreementCount}${row.activeAgreementCount ? ` · ${row.activeAgreementCount} active` : ""}`
                  : "None recorded",
              },
              { label: "Next expiry", value: formatDate(row.nextExpiry, "—") },
            ]}
          />
        )}
      />
    </div>
  );
}
