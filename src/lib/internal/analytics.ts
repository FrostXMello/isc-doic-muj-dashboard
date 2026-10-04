/**
 * Dashboard analytics computed from the repository's record views.
 *
 * Pure functions: the dashboard page loads the views once and passes them in,
 * so every figure is a count of rows the signed-in user can read (RLS applies
 * upstream). Nothing is estimated or extrapolated.
 *
 * Metric definitions
 * - Universities: institution records, each counted once.
 * - MoUs: agreement records, each counted once even when it has several
 *   partner universities. With a country filter, an MoU counts when any of its
 *   parties is in that country. Geography charts place an MoU under its lead
 *   university only, so country and region totals add up to the MoU total.
 * - Active MoU: signed, started, and not past its end date (`active` or
 *   `expiring-soon`). Expired: signed and past its end date. Expiring soon:
 *   end date within EXPIRY_WARNING_DAYS. These are `null` ("not recorded"),
 *   not 0, when no MoU carries the status or dates they depend on.
 * - Programmes: the fixed programme types. Offerings: university × programme
 *   rows. Opportunities: application calls. Audience comes from the programme.
 * - Activities: completed = stored as completed; upcoming = planned or
 *   confirmed with a start date today or later; overdue = planned or confirmed
 *   whose last day has passed (`needs-update`).
 * - Documents: document records; reports = documents of type `report`.
 */

import type { Views } from "@/lib/internal/data/views";
import { EXPIRY_WARNING_DAYS } from "@/lib/internal/dates";
import { agreementHref } from "@/lib/internal/links";
import {
  activityStatusMeta,
  agreementStatusMeta,
  documentTypeLabel,
  programAudience,
  programAudiences,
  type ProgramAudience,
} from "@/lib/internal/status";
import type {
  ActivityStatus,
  ActivityView,
  AgreementStatus,
  AgreementView,
  DocumentType,
  DocumentView,
  InstitutionView,
  OpportunityView,
  Program,
  ProgramAvailabilityView,
  ProgramType,
  Region,
} from "@/lib/internal/types";
import { officialRegions } from "@/lib/official/countries";

export type DashboardInput = {
  today: string;
  institutions: readonly InstitutionView[];
  agreements: readonly AgreementView[];
  programs: readonly Program[];
  offerings: readonly ProgramAvailabilityView[];
  opportunities: readonly OpportunityView[];
  activities: readonly ActivityView[];
  documents: readonly DocumentView[];
};

/** Builds every record view the dashboard aggregates from one dataset load. */
export function buildDashboardInput(views: Views, today: string): DashboardInput {
  const { data } = views;
  return {
    today,
    institutions: data.institutions.map((row) => views.toInstitutionView(row, today)),
    agreements: data.agreements.map((row) => views.toAgreementView(row, today)),
    programs: data.programs,
    offerings: data.availability.map((row) => views.toAvailabilityView(row, today)),
    opportunities: data.opportunities.map((row) => views.toOpportunityView(row, today)),
    activities: data.activities.map((row) => views.toActivityView(row, today)),
    documents: data.documents.map(views.toDocumentView),
  };
}

export type DashboardFilters = {
  country?: string;
  audience?: ProgramAudience;
  /** Calendar year (YYYY) of an activity's start date. */
  year?: string;
};

export const dashboardFilterKeys = ["country", "audience", "year"] as const;

/** Which parts of the dashboard each filter narrows, shown next to the filters. */
export const dashboardFilterScope: Record<(typeof dashboardFilterKeys)[number], string> = {
  country: "universities, MoUs, offerings, opportunities, and activities",
  audience: "programmes, offerings, and opportunities",
  year: "activities",
};

export const agreementStatusKeys = Object.keys(agreementStatusMeta) as AgreementStatus[];
export const activityStatusKeys = Object.keys(activityStatusMeta) as ActivityStatus[];
export const documentTypeKeys = Object.keys(documentTypeLabel) as DocumentType[];

function countBy<K extends string, T>(keys: readonly K[], rows: readonly T[], pick: (row: T) => K) {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
  for (const row of rows) counts[pick(row)] += 1;
  return counts;
}

function uniqueSorted(values: Iterable<string>) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

/** Countries and activity years present in the data, for the filter selects. */
export function dashboardFilterOptions(input: DashboardInput) {
  return {
    countries: uniqueSorted([
      ...input.institutions.map((row) => row.country),
      ...input.activities.map((row) => row.country),
    ]),
    years: uniqueSorted(input.activities.map((row) => row.startDate.slice(0, 4))).reverse(),
  };
}

/** Keeps only filter values that exist in the data; anything else is ignored. */
export function parseDashboardFilters(
  params: Record<string, string | string[] | undefined>,
  options: { countries: readonly string[]; years: readonly string[] },
): DashboardFilters {
  const read = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value : undefined;
  };
  const country = read("country");
  const audience = read("audience");
  const year = read("year");
  return {
    country: country && options.countries.includes(country) ? country : undefined,
    audience: programAudiences.includes(audience as ProgramAudience)
      ? (audience as ProgramAudience)
      : undefined,
    year: year && options.years.includes(year) ? year : undefined,
  };
}

export function activeFilterCount(filters: DashboardFilters) {
  return dashboardFilterKeys.filter((key) => filters[key]).length;
}

/** Appends the active filters a section page understands to one of its URLs. */
export function sectionHref(
  href: string,
  filters: DashboardFilters,
  keys: readonly ("country" | "audience")[],
) {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  for (const key of keys) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export type RecentUpdate = {
  key: string;
  kind: string;
  title: string;
  href: string;
  updatedAt: string;
};

export function computeDashboard(input: DashboardInput, filters: DashboardFilters = {}) {
  const { country, audience, year } = filters;
  const inCountry = (value: string | null | undefined) => !country || value === country;
  const forAudience = (programId: ProgramType) => !audience || programAudience[programId] === audience;

  const institutions = input.institutions.filter((row) => inCountry(row.country));
  const agreements = input.agreements.filter(
    (row) => !country || [row.institution, ...row.partners].some((party) => party?.country === country),
  );
  const programs = input.programs.filter((row) => forAudience(row.id));
  const offerings = input.offerings.filter(
    (row) => forAudience(row.programId) && inCountry(row.institution?.country),
  );
  const opportunities = input.opportunities.filter(
    (row) => forAudience(row.programId) && inCountry(row.institution?.country),
  );
  const activities = input.activities.filter(
    (row) => inCountry(row.country) && (!year || row.startDate.startsWith(year)),
  );
  const documents = input.documents;

  // MoUs
  const agreementsByStatus = countBy(agreementStatusKeys, agreements, (row) => row.status);
  const signed = agreements.filter((row) => row.recordStatus === "signed");
  const withEndDate = signed.filter((row) => row.endDate !== null);
  const expiringSoon = agreements
    .filter((row) => row.status === "expiring-soon")
    .sort((a, b) => (a.endDate ?? "").localeCompare(b.endDate ?? ""));

  // Geography (each MoU under its lead university only)
  const byCountry = new Map<string, { country: string; universities: number; mous: number }>();
  const countryRow = (name: string) => {
    let row = byCountry.get(name);
    if (!row) {
      row = { country: name, universities: 0, mous: 0 };
      byCountry.set(name, row);
    }
    return row;
  };
  for (const row of institutions) countryRow(row.country).universities += 1;
  for (const row of agreements) if (row.institution) countryRow(row.institution.country).mous += 1;
  const countries = [...byCountry.values()].sort(
    (a, b) => b.mous - a.mous || b.universities - a.universities || a.country.localeCompare(b.country),
  );

  const byRegion = officialRegions.map((region: Region) => ({
    region,
    universities: institutions.filter((row) => row.region === region).length,
    mous: agreements.filter((row) => row.institution?.region === region).length,
  }));

  // Programmes and opportunities by audience
  const byAudience = programAudiences.map((key) => ({
    audience: key,
    programmes: programs.filter((row) => programAudience[row.id] === key).length,
    offerings: offerings.filter((row) => programAudience[row.programId] === key).length,
    opportunities: opportunities.filter((row) => programAudience[row.programId] === key).length,
  }));
  const offeringsByProgram = programs.map((program) => ({
    program,
    offerings: offerings.filter((row) => row.programId === program.id).length,
  }));
  const openOpportunities = opportunities.filter(
    (row) => row.status === "open" || row.status === "closing-soon",
  );
  const upcomingDeadlines = opportunities
    .filter(
      (row) =>
        row.deadline !== null &&
        row.daysToDeadline !== null &&
        row.daysToDeadline >= 0 &&
        (row.status === "open" || row.status === "closing-soon" || row.status === "upcoming"),
    )
    .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""));

  // Activities
  const activitiesByStatus = countBy(activityStatusKeys, activities, (row) => row.status);
  const upcomingActivities = activities
    .filter((row) => row.daysFromToday >= 0 && (row.status === "planned" || row.status === "confirmed"))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const overdueActivities = activities
    .filter((row) => row.status === "needs-update")
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const years = activities.map((row) => Number(row.startDate.slice(0, 4)));
  const activitiesByYear: { year: string; total: number; completed: number }[] = [];
  if (years.length > 0) {
    for (let y = Math.min(...years); y <= Math.max(...years); y += 1) {
      const inYear = activities.filter((row) => row.startDate.startsWith(String(y)));
      activitiesByYear.push({
        year: String(y),
        total: inYear.length,
        completed: inYear.filter((row) => row.status === "completed").length,
      });
    }
  }
  // A trend needs at least two years that actually have records.
  const activityTrendAvailable = activitiesByYear.filter((row) => row.total > 0).length >= 2;

  // Documents
  const documentsByType = countBy(documentTypeKeys, documents, (row) => row.type);

  // Records with a gap that can be identified from stored fields alone.
  const dataGaps = [
    {
      key: "mou-status",
      label: "MoUs with no status or dates recorded",
      count: agreementsByStatus["not-stated"],
      href: sectionHref("/internal/universities?mouStatus=not-stated", filters, ["country"]),
    },
    {
      key: "mou-end-date",
      label: "Signed MoUs with no end date",
      count: signed.length - withEndDate.length,
      href: sectionHref("/internal/universities?coverage=with", filters, ["country"]),
    },
    {
      key: "directory",
      label: "Universities awaiting DoIC review (earlier directory)",
      count: institutions.filter((row) => row.source === "directory").length,
      href: sectionHref("/internal/universities?source=directory", filters, ["country"]),
    },
    {
      key: "no-mou",
      label: "Universities with no MoU recorded",
      count: institutions.filter((row) => row.agreementCount === 0).length,
      href: sectionHref("/internal/universities?coverage=without", filters, ["country"]),
    },
    {
      key: "opportunity-deadline",
      label: "Opportunities with no deadline",
      count: opportunities.filter((row) => row.deadline === null).length,
      href: sectionHref("/internal/programs?tab=opportunities", filters, ["country", "audience"]),
    },
    {
      key: "document-unlinked",
      label: "Documents not linked to any record",
      count: documents.filter((row) => row.links.length === 0).length,
      href: "/internal/documents?linked=unlinked",
    },
    {
      key: "document-file",
      label: "Documents with no file or link",
      count: documents.filter((row) => row.url === null && row.storageKey === null).length,
      href: "/internal/documents",
    },
  ];

  const recentCandidates: (RecentUpdate | null)[] = [
    ...institutions.map((row) =>
      row.updatedAt
        ? { key: `i-${row.id}`, kind: "University", title: row.name, href: `/internal/universities/${row.id}`, updatedAt: row.updatedAt }
        : null,
    ),
    ...agreements.map((row) =>
      row.updatedAt
        ? { key: `a-${row.id}`, kind: "MoU", title: row.institution ? `${row.reference} · ${row.institution.name}` : row.reference, href: agreementHref(row), updatedAt: row.updatedAt }
        : null,
    ),
    ...offerings.map((row) =>
      row.updatedAt
        ? { key: `o-${row.id}`, kind: "Offering", title: row.institution ? `${row.program.name} · ${row.institution.name}` : row.program.name, href: `/internal/programs/${row.id}`, updatedAt: row.updatedAt }
        : null,
    ),
    ...opportunities.map((row) =>
      row.updatedAt
        ? { key: `c-${row.id}`, kind: "Opportunity", title: row.title, href: `/internal/opportunities/${row.id}`, updatedAt: row.updatedAt }
        : null,
    ),
    ...activities.map((row) =>
      row.updatedAt
        ? { key: `e-${row.id}`, kind: "Activity", title: row.title, href: `/internal/activities/${row.id}`, updatedAt: row.updatedAt }
        : null,
    ),
    ...documents.map((row) =>
      row.updatedAt
        ? { key: `d-${row.id}`, kind: "Document", title: row.title, href: `/internal/documents/${row.id}`, updatedAt: row.updatedAt }
        : null,
    ),
  ];
  const recentUpdates = recentCandidates
    .filter((row): row is RecentUpdate => row !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return {
    today: input.today,
    filters,
    universities: {
      total: institutions.length,
      official: institutions.filter((row) => row.source === "official").length,
      directory: institutions.filter((row) => row.source === "directory").length,
      sample: institutions.filter((row) => row.source === "sample").length,
      withMous: institutions.filter((row) => row.agreementCount > 0).length,
      countries: new Set(institutions.map((row) => row.country)).size,
    },
    mous: {
      total: agreements.length,
      byStatus: agreementsByStatus,
      statusRecorded: agreements.length - agreementsByStatus["not-stated"],
      active:
        signed.length === 0 ? null : agreementsByStatus.active + agreementsByStatus["expiring-soon"],
      expired: withEndDate.length === 0 ? null : agreementsByStatus.expired,
      expiringSoonCount: withEndDate.length === 0 ? null : expiringSoon.length,
      expiringSoon,
      expiryWindowDays: EXPIRY_WARNING_DAYS,
    },
    geography: { byRegion, countries },
    programs: {
      programmes: programs.length,
      offerings: offerings.length,
      opportunities: opportunities.length,
      openOpportunities: openOpportunities.length,
      byAudience,
      offeringsByProgram,
      upcomingDeadlines,
    },
    activities: {
      total: activities.length,
      byStatus: activitiesByStatus,
      completed: activitiesByStatus.completed,
      upcoming: upcomingActivities,
      overdue: overdueActivities,
      byYear: activitiesByYear,
      trendAvailable: activityTrendAvailable,
    },
    documents: {
      total: documents.length,
      reports: documentsByType.report,
      byType: documentsByType,
    },
    dataGaps,
    recentUpdates: {
      /** False when the data source carries no edit timestamps at all (static mode). */
      available: [
        input.institutions,
        input.agreements,
        input.offerings,
        input.opportunities,
        input.activities,
        input.documents,
      ].some((rows) => rows.some((row) => row.updatedAt)),
      rows: recentUpdates.slice(0, 8),
    },
  };
}

export type DashboardAnalytics = ReturnType<typeof computeDashboard>;
