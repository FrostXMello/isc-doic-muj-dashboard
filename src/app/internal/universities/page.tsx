import type { Metadata } from "next";
import { ChevronDown, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import Link from "next/link";
import { SuccessNotice } from "@/components/internal/forms/form-fields";
import {
  AgreementRegisterFacts,
  ContactRows,
  DepartmentSummary,
  ExpiryIndicator,
  ExpiryLegend,
  Facts,
  OfficerList,
  RegisterNotice,
  ScopeSummary,
  UniversityRegisterRows,
} from "@/components/internal/university-register";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { FilterBar } from "@/components/internal/ui/filter-bar";
import { ManageLink } from "@/components/internal/ui/manage-action";
import { PageHeader } from "@/components/internal/ui/page-header";
import { DataNotice } from "@/components/internal/ui/source-badge";
import { agreementStatuses, agreementTypes } from "@/lib/internal/data/agreements";
import { getDataMode } from "@/lib/internal/data/context";
import {
  type ExpiryWindow,
  expiryWindows,
  getInstitutionFilterOptions,
  listInstitutions,
  qsRankingBands,
  splitFaculties,
  type UniversityRow,
  universitySorts,
} from "@/lib/internal/data/institutions";
import { uniqueSorted } from "@/lib/internal/data/context";
import { todayISO } from "@/lib/internal/dates";
import { loadRegister } from "@/lib/internal/data/register";
import {
  readEnumParam,
  readParam,
  type SearchParamsProp,
  type SearchParamsRecord,
} from "@/lib/internal/query";
import { agreementTypeLabel, optionsFrom } from "@/lib/internal/status";
import { qsRankingBandLabel } from "@/lib/official/qs-rankings-2027";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "MoUs" };

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
  const [options, mode, register] = await Promise.all([getInstitutionFilterOptions(), getDataMode(), loadRegister()]);
  const sort = readEnumParam(params, "sort", universitySorts) ?? "name";

  const all = await listInstitutions();
  const faculties = uniqueSorted(all.flatMap((row) => splitFaculties(row.entry.faculties)));
  const departments = uniqueSorted(all.flatMap((row) => row.entry.departments));
  const rows = await listInstitutions(
    {
      q: readParam(params, "q"),
      region: readEnumParam(params, "region", options.regions),
      country: readEnumParam(params, "country", options.countries),
      // Older dashboard links filter by derived MoU status; the bar offers expiry windows instead.
      agreementStatus: readEnumParam(params, "mouStatus", agreementStatuses),
      agreementType: readEnumParam(params, "mouType", agreementTypes),
      expiry: readEnumParam(params, "expiry", expiryWindows),
      faculty: readEnumParam(params, "faculty", faculties),
      department: readEnumParam(params, "department", departments),
      qs: readEnumParam(params, "qs", qsRankingBands),
    },
    sort,
  );
  const year = todayISO().slice(0, 4);
  const expiryLabels: Record<ExpiryWindow, string> = {
    "in-force": "In force",
    "within-90": "Expiring within 90 days",
    "within-365": "Expiring within 12 months",
    ended: `Ended in ${year}`,
    "open-ended": "Perpetual / until cancelled",
    undated: "Expiry not recorded",
  };

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
        title="MoUs"
        description="Every partner university with each MoU's scope, signing department, expiry, and DoIC nodal officers at a glance. Expand a university for each MoU's reference, dates, rankings, partner officers, documents, workflow, and renewal history."
        actions={
          <>
            <Link
              href="/internal/universities/national"
              className="inline-flex h-9 items-center rounded-full border border-line-strong px-4 text-[13px] text-fg-soft transition-colors hover:border-line-bold hover:text-foreground"
            >
              National collaborations
            </Link>
            <ManageLink
              permission="institutions:create"
              href="/internal/universities/new"
              label="Add university"
              icon="add"
              variant="primary"
            />
          </>
        }
      />

      {deleted ? <SuccessNotice>University deleted.</SuccessNotice> : null}

      <DataNotice>
        Officers, contacts, and register details come from the official partner page and the DoIC
        MoU register (0_MoU details.xlsx). They are internal and shown only to DoIC roles reading
        the access-controlled database
        {mode.source === "supabase" ? "" : "; this deployment reads the static dataset, so they show as Restricted"}.
        The QS column is QS World University Rankings 2027, published on 18 June 2026; partners not
        in that table show as not ranked. Values written as &ldquo;NA&rdquo; or similar are shown as recorded;
        formula output is never shown.
        {mode.sampleData ? (
          <>
            {" "}
            <strong className="font-medium">Sample data</strong> institutions (&ldquo;Example
            &hellip;&rdquo;) are fictional and shown because INTERNAL_SAMPLE_DATA is on.
          </>
        ) : null}
        <span className="mt-1 block">
          <RegisterNotice register={register} />
        </span>
      </DataNotice>

      {regions.length > 0 ? <RegionIndex regions={regions} active={activeRegion} params={params} /> : null}

      <FilterBar
        searchPlaceholder="Search name, country, officer, email, phone, reference, QS rank"
        noun={{ singular: "university", plural: "universities" }}
        resultCount={rows.length}
        totalCount={all.length}
        selects={[
          {
            name: "country",
            label: "Country",
            allLabel: "All countries",
            options: options.countries.map((value) => ({ value, label: value })),
          },
          {
            name: "faculty",
            label: "Faculty",
            allLabel: "All faculties",
            options: faculties.map((value) => ({ value, label: value })),
          },
          {
            name: "department",
            label: "Department",
            allLabel: "All departments",
            options: departments.map((value) => ({ value, label: value })),
          },
          {
            name: "expiry",
            label: "Expiry",
            allLabel: "Any expiry",
            options: expiryWindows.map((value) => ({ value, label: expiryLabels[value] })),
          },
          {
            name: "mouType",
            label: "MoU type",
            allLabel: "Any MoU type",
            options: optionsFrom(
              agreementTypes.filter((type) => all.some((row) => row.agreements.some((a) => a.type === type))),
              agreementTypeLabel,
            ),
          },
          {
            name: "qs",
            label: "QS 2027",
            allLabel: "Any QS 2027 rank",
            options: qsRankingBands.map((value) => ({ value, label: qsRankingBandLabel[value] })),
          },
          {
            name: "sort",
            label: "Sort",
            defaultValue: "name",
            options: [
              { value: "name", label: "Name" },
              { value: "country", label: "Country" },
              { value: "qs", label: "QS 2027 (best first)" },
              { value: "expiry", label: "Soonest expiry" },
            ],
          },
        ]}
      />

      <ExpiryLegend />

      {pageRows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No universities match these filters"
          description="Try a different search term or clear the filters."
        />
      ) : (
        <section aria-label="Universities" className="overflow-hidden rounded-3xl border border-line bg-card">
          <div>
            <div
              aria-hidden
              className={cn(
                "grid gap-3 border-b border-hairline px-4 py-3 text-[11px] font-medium tracking-[0.14em] text-fg-faint uppercase lg:gap-5 lg:px-6",
                ROW_COLUMNS,
              )}
            >
              <span>University</span>
              <span>QS 2027</span>
              <span>DoIC nodal officer</span>
              <span>Department</span>
              <span>Scope</span>
              <span>Expiry</span>
            </div>
            <ul className="divide-y divide-hairline">
              {pageRows.map((row) => (
                <UniversityEntryRow key={row.id} row={row} />
              ))}
            </ul>
          </div>
        </section>
      )}

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

function agreementSummary(row: UniversityRow) {
  if (row.agreements.length === 0) return "No MoU recorded";
  const types = [...new Set(row.agreements.map((a) => a.typeLabel ?? agreementTypeLabel[a.type]))];
  const label = row.agreements.length === 1 ? "1 agreement" : `${row.agreements.length} agreements`;
  return `${label} · ${types.slice(0, 2).join(", ")}${types.length > 2 ? ` +${types.length - 2}` : ""}`;
}

const ROW_COLUMNS =
  "grid-cols-[minmax(0,2fr)_minmax(0,0.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,0.9fr)]";

/** One university: key facts always visible, everything else in an expandable panel. */
function UniversityEntryRow({ row }: { row: UniversityRow }) {
  const { entry } = row;
  const hasMore =
    entry.agreements.length > 0 ||
    entry.universityRows.length > 0 ||
    entry.universityContacts.length > 0 ||
    entry.earlierOfficers.length > 0;
  const qsRankings = entry.qsRankings;
  return (
    <li className="group/entry">
      <div className={cn("grid gap-3 px-4 py-4 [overflow-wrap:anywhere] lg:gap-5 lg:px-6", ROW_COLUMNS)}>
        <div className="min-w-0">
          <Link
            href={`/internal/universities/${row.id}`}
            className="text-[15px] font-medium text-foreground underline-offset-2 hover:text-muj-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-sm"
          >
            {row.name}
          </Link>
          {row.normalizedName && row.normalizedName !== row.name ? (
            <span className="block text-[12px] text-fg-faint">{row.normalizedName}</span>
          ) : null}
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {[row.city, row.country, row.region].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-1 text-[12px] text-fg-faint">{agreementSummary(row)}</p>
        </div>
        <div className="min-w-0 text-[13px]">
          {qsRankings.length > 0 ? (
            <span className="text-foreground">{qsRankings.join(" · ")}</span>
          ) : (
            <span className="text-fg-faint">Not in QS 2027</span>
          )}
        </div>
        <div className="min-w-0 text-[13px] [overflow-wrap:anywhere]">
          <OfficerList officers={entry.officers} compact />
        </div>
        <div className="min-w-0">
          <DepartmentSummary entry={entry} />
        </div>
        <div className="min-w-0">
          <ScopeSummary entry={entry} />
        </div>
        <div className="min-w-0">
          <ExpiryIndicator expiry={entry.expiry} compact />
        </div>
      </div>

      {hasMore ? (
        <details className="group border-t border-hairline/60">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 px-5 py-2 text-[12.5px] text-fg-subtle transition-colors hover:bg-overlay-subtle hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-6 [&::-webkit-details-marker]:hidden">
            <ChevronDown
              className="size-4 shrink-0 transition-transform group-open:rotate-180 group-open:text-muj-fg motion-reduce:transition-none"
              aria-hidden
            />
            <span className="group-open:hidden">Show all details</span>
            <span className="hidden group-open:inline">Hide details</span>
            <span className="sr-only">for {row.name}</span>
          </summary>
          <div className="space-y-5 bg-overlay-subtle px-5 pt-2 pb-5 sm:px-6">
            <Facts
              items={[
                entry.qsRankings.length > 0 ? { label: "QS 2027", value: entry.qsRankings.join(" · ") } : null,
                entry.theRankings.length > 0 ? { label: "THE ranking", value: entry.theRankings.join(" · ") } : null,
                entry.faculties.length > 0 ? { label: "Faculty", value: entry.faculties.join(" · ") } : null,
                entry.departments.length > 0 ? { label: "Department", value: entry.departments.join(" · ") } : null,
                entry.earlierOfficers.length > 0
                  ? { label: "Earlier DoIC nodal officer", value: <OfficerList officers={entry.earlierOfficers} /> }
                  : null,
                entry.universityContacts.length > 0
                  ? { label: "Other contacts", value: <ContactRows contacts={entry.universityContacts} />, wide: true }
                  : null,
              ]}
            />

            {entry.agreements.length > 0 ? (
              <ol className="space-y-3" aria-label={`Agreements with ${row.name}`}>
                {entry.agreements.map((agreementEntry) => (
                  <li
                    key={agreementEntry.agreement.id}
                    className={cn("rounded-2xl border border-line bg-card px-4 py-4 sm:px-5")}
                  >
                    <AgreementRegisterFacts entry={agreementEntry} />
                  </li>
                ))}
              </ol>
            ) : null}

            {entry.universityRows.length > 0 ? (
              <div className="rounded-2xl border border-dashed border-line-strong px-4 py-4 sm:px-5">
                <p className="mb-3 text-[12px] text-fg-subtle">
                  Register rows for this university that do not say which agreement they belong to:
                </p>
                <UniversityRegisterRows rows={entry.universityRows} />
              </div>
            ) : null}

            <Link
              href={`/internal/universities/${row.id}`}
              className="inline-flex text-[13px] text-muj-fg underline-offset-2 hover:underline"
            >
              Open the university page to edit
            </Link>
          </div>
        </details>
      ) : null}
    </li>
  );
}

