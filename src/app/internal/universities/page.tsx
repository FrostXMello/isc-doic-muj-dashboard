import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import Link from "next/link";
import { SuccessNotice } from "@/components/internal/forms/form-fields";
import { getDataMode } from "@/lib/internal/data/context";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { FilterBar } from "@/components/internal/ui/filter-bar";
import { ManageLink } from "@/components/internal/ui/manage-action";
import { PageHeader } from "@/components/internal/ui/page-header";
import { ResourceCard, ResourceTable } from "@/components/internal/ui/resource-table";
import { DataNotice } from "@/components/internal/ui/source-badge";
import { StatusBadge } from "@/components/internal/ui/status-badge";
import { EXPIRY_WARNING_DAYS, formatDate, formatRelativeDays } from "@/lib/internal/dates";
import { agreementStatuses, agreementTypes } from "@/lib/internal/data/agreements";
import {
  agreementCoverage,
  getInstitutionFilterOptions,
  institutionSources,
  listInstitutions,
  type NodalOfficer,
  partnershipStatuses,
  type UniversityRow,
} from "@/lib/internal/data/institutions";
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
  type Tone,
} from "@/lib/internal/status";

export const metadata: Metadata = { title: "Universities & MoUs" };

const PAGE_SIZE = 25;

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
  const regions = options.regions
    .map((region) => {
      const members = all.filter((row) => row.region === region);
      return { region, universities: members.length, countries: new Set(members.map((row) => row.country)).size };
    })
    .filter((row) => row.universities > 0)
    .sort((a, b) => b.universities - a.universities);

  const lastPage = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(lastPage, Math.max(1, Number.parseInt(readParam(params, "page") ?? "1", 10) || 1));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageHref = (target: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "page" || key === "notice" || value === undefined) continue;
      for (const item of Array.isArray(value) ? value : [value]) next.append(key, item);
    }
    if (target > 1) next.set("page", String(target));
    const qs = next.toString();
    return qs ? `/internal/universities?${qs}` : "/internal/universities";
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Global network"
        title="Universities & MoUs"
        description="Each partner university once, with its DoIC nodal officer. Open a university for its MoUs, dates, rankings, contacts, and register history."
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
        DoIC nodal officers come from the official partner page and the DoIC MoU register. Where a
        university has more than one current officer, all are listed. Contact details are internal:
        they appear only for DoIC roles when the portal reads the access-controlled database
        {mode.source === "supabase" ? "" : " (this deployment reads the static dataset, so they show as Restricted)"}.
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
        searchPlaceholder="Search university, country, or officer"
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

      <ul aria-label="Expiry colours" className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-fg-subtle">
        {expiryLegend.map((entry) => (
          <li key={entry.label} className="flex items-center gap-2">
            <StatusBadge label={entry.label} tone={entry.tone} />
            {entry.description}
          </li>
        ))}
      </ul>

      <ResourceTable<UniversityRow>
        caption="Universities with their DoIC nodal officers"
        rows={pageRows}
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
            cell: (row) => <span className="font-medium">{row.name}</span>,
          },
          { key: "country", header: "Country", cell: (row) => row.country },
          {
            key: "expiry",
            header: "Expiry",
            className: "whitespace-nowrap",
            cell: (row) => <Expiry row={row} />,
          },
          {
            key: "officer",
            header: "DoIC nodal officer",
            cell: (row) => <Officers officers={row.officers} show="name" />,
          },
          {
            key: "phone",
            header: "Contact number",
            className: "whitespace-nowrap",
            cell: (row) => <Officers officers={row.officers} show="phone" />,
          },
        ]}
        renderCard={(row) => (
          <ResourceCard
            title={row.name}
            subtitle={row.country}
            badges={<Expiry row={row} />}
            meta={[
              { label: "DoIC nodal officer", value: <Officers officers={row.officers} show="name" /> },
              { label: "Contact number", value: <Officers officers={row.officers} show="phone" /> },
            ]}
          />
        )}
      />

      {lastPage > 1 ? (
        <nav aria-label="University pages" className="flex items-center justify-between text-[13px]">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="inline-flex items-center gap-1 text-fg-subtle hover:text-foreground">
              <ChevronLeft className="size-4" aria-hidden /> Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-fg-faint">
            Page {page} of {lastPage}
          </span>
          {page < lastPage ? (
            <Link href={pageHref(page + 1)} className="inline-flex items-center gap-1 text-fg-subtle hover:text-foreground">
              Next <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}

const expiryLegend: { label: string; tone: Tone; description: string }[] = [
  { label: "Active", tone: "positive", description: "in force" },
  { label: "Expiring soon", tone: "warning", description: `ends within ${EXPIRY_WARNING_DAYS} days` },
  { label: "Expired", tone: "danger", description: "end date has passed" },
];

/**
 * The expiry that matters most for a university: the earliest end date among
 * its agreements still in force, otherwise the most recent one that ended.
 * Coloured with the agreement's derived status.
 */
function Expiry({ row }: { row: UniversityRow }) {
  const dated = row.agreements.filter(
    (agreement) =>
      agreement.endDate &&
      (agreement.status === "active" || agreement.status === "expiring-soon" || agreement.status === "expired"),
  );
  const live = dated
    .filter((agreement) => agreement.status !== "expired")
    .sort((a, b) => a.endDate!.localeCompare(b.endDate!));
  const ended = dated
    .filter((agreement) => agreement.status === "expired")
    .sort((a, b) => b.endDate!.localeCompare(a.endDate!));
  const shown = live[0] ?? ended[0];

  if (!shown) {
    const openEnded = row.agreements.some((agreement) => agreement.status === "active");
    return <span className="text-fg-faint">{openEnded ? "No end date recorded" : "Not recorded"}</span>;
  }
  const meta = agreementStatusMeta[shown.status];
  const days = shown.daysToExpiry ?? 0;
  return (
    <span className="flex flex-col items-start gap-0.5">
      <StatusBadge label={formatDate(shown.endDate)} tone={meta.tone} title={meta.label} />
      <span className="text-[11px] text-fg-faint">
        {meta.label} · {days < 0 ? "ended" : "ends"} {formatRelativeDays(days)}
        {dated.length > 1 ? ` · +${dated.length - 1} more` : ""}
      </span>
    </span>
  );
}

/**
 * Officer names or numbers, one line per officer so the two columns line up.
 * A university with several current officers lists all of them.
 */
function Officers({ officers, show }: { officers: NodalOfficer[] | null; show: "name" | "phone" }) {
  if (officers === null) return <span className="text-fg-faint">Restricted</span>;
  if (officers.length === 0) return <span className="text-fg-faint">Not recorded</span>;
  return (
    <span className="flex flex-col gap-0.5">
      {officers.map((officer, index) => (
        <span key={index} className="whitespace-normal">
          {show === "name"
            ? (officer.name ?? <span className="text-fg-faint">Name not recorded</span>)
            : officer.phones.length > 0
              ? officer.phones.join(", ")
              : <span className="text-fg-faint">Not recorded</span>}
        </span>
      ))}
    </span>
  );
}
