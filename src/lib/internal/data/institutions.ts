import { openDataContext, uniqueSorted } from "@/lib/internal/data/context";
import { loadRegister } from "@/lib/internal/data/register";
import { expirySortKey } from "@/lib/internal/expiry";
import { buildUniversityEntry, matchesEntry, type UniversityEntry } from "@/lib/internal/register-view";
import type {
  AgreementStatus,
  AgreementType,
  AgreementView,
  InstitutionView,
  Region,
} from "@/lib/internal/types";
import {
  matchesQsRankingBand,
  qsRankSortKey,
  qsRankingBands,
  type QsRankingBand,
} from "@/lib/official/qs-rankings-2027";

/** Expiry windows; a university matches when any of its MoUs falls in the window. */
export const expiryWindows = ["in-force", "within-90", "within-365", "ended", "open-ended", "undated"] as const;
export type ExpiryWindow = (typeof expiryWindows)[number];

const inForce = (agreement: AgreementView) => agreement.status === "active" || agreement.status === "expiring-soon";

export function inExpiryWindow(agreement: AgreementView, window: ExpiryWindow) {
  switch (window) {
    case "in-force":
      return inForce(agreement);
    case "within-90":
      return agreement.status === "expiring-soon";
    case "within-365":
      return inForce(agreement) && agreement.daysToExpiry !== null && agreement.daysToExpiry <= 365;
    case "ended":
      return agreement.status === "expired";
    case "open-ended":
      return agreement.status === "active" && agreement.endDate === null;
    case "undated":
      return agreement.status === "not-stated";
  }
}

/** Faculty cells such as "FoA/FoSTA" name several faculties. */
export const splitFaculties = (values: readonly string[]) =>
  values.flatMap((value) => value.split("/").map((part) => part.trim())).filter(Boolean);

export { qsRankingBands };
export type { QsRankingBand };

export type InstitutionFilters = {
  q?: string;
  region?: Region;
  country?: string;
  /** Has at least one agreement with this derived status. */
  agreementStatus?: AgreementStatus;
  /** Has at least one agreement of this type. */
  agreementType?: AgreementType;
  expiry?: ExpiryWindow;
  faculty?: string;
  department?: string;
  /** QS World University Rankings 2027 band (edition published 18 June 2026). */
  qs?: QsRankingBand;
};

export const universitySorts = ["name", "country", "expiry", "qs"] as const;
export type UniversitySort = (typeof universitySorts)[number];

export type UniversityRow = InstitutionView & { agreements: AgreementView[]; entry: UniversityEntry };

function sortRows(rows: UniversityRow[], sort: UniversitySort) {
  const byName = (a: UniversityRow, b: UniversityRow) => a.name.localeCompare(b.name);
  if (sort === "country") return rows.sort((a, b) => a.country.localeCompare(b.country) || byName(a, b));
  if (sort === "expiry") {
    return rows.sort((a, b) => {
      const [ga, va] = expirySortKey(a.entry.expiry);
      const [gb, vb] = expirySortKey(b.entry.expiry);
      return ga - gb || va - vb || byName(a, b);
    });
  }
  if (sort === "qs") {
    return rows.sort((a, b) => {
      const qa = qsRankSortKey(a.entry.qsRankings[0]);
      const qb = qsRankSortKey(b.entry.qsRankings[0]);
      return qa - qb || byName(a, b);
    });
  }
  return rows.sort(byName);
}

export async function listInstitutions(
  filters: InstitutionFilters = {},
  sort: UniversitySort = "name",
): Promise<UniversityRow[]> {
  const [{ today, data, views, contactAccess }, register] = await Promise.all([openDataContext(), loadRegister()]);
  const { expiry } = filters;
  const rows = data.institutions
    .map((institution) => {
      const view = views.toInstitutionView(institution, today);
      const agreements = views.agreementsForInstitution(institution.id, today);
      return { ...view, agreements, entry: buildUniversityEntry(view, agreements, contactAccess, register) };
    })
    .filter(
      (row) =>
        row.agreements.length > 0 &&
        matchesEntry(row.entry, filters.q) &&
        (!filters.region || row.region === filters.region) &&
        (!filters.country || row.country === filters.country) &&
        (!filters.agreementStatus ||
          row.agreements.some((agreement) => agreement.status === filters.agreementStatus)) &&
        (!filters.agreementType ||
          row.agreements.some((agreement) => agreement.type === filters.agreementType)) &&
        (!expiry || row.agreements.some((agreement) => inExpiryWindow(agreement, expiry))) &&
        (!filters.faculty || splitFaculties(row.entry.faculties).includes(filters.faculty)) &&
        (!filters.department || row.entry.departments.includes(filters.department)) &&
        (!filters.qs || matchesQsRankingBand(row.entry.qsRankings[0] ?? null, filters.qs)),
    );
  return sortRows(rows, sort);
}

/** Agreement counts across every university, each agreement counted once. */
export async function getInstitutionFilterOptions() {
  const { data } = await openDataContext();
  return {
    regions: uniqueSorted(data.institutions.map((row) => row.region)) as Region[],
    countries: uniqueSorted(data.institutions.map((row) => row.country)),
  };
}

/** Every institution as an option for partner pickers, by name. */
export async function listInstitutionOptions() {
  const { data } = await openDataContext();
  return data.institutions
    .map((row) => ({ id: row.id, name: row.name, country: row.country }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getInstitution(id: string) {
  const [{ today, data, views, contactAccess }, register] = await Promise.all([openDataContext(), loadRegister()]);
  const institution = data.institutions.find((row) => row.id === id);
  if (!institution) return null;
  const view = views.toInstitutionView(institution, today);

  return {
    today,
    contactAccess,
    register,
    entry: buildUniversityEntry(view, views.agreementsForInstitution(id, today), contactAccess, register),
    institution: view,
    agreements: views
      .agreementsForInstitution(id, today)
      .sort((a, b) => (b.startDate ?? "9999").localeCompare(a.startDate ?? "9999"))
      .map((agreement) => ({
        agreement,
        role: agreement.institutionId === id ? ("lead" as const) : ("partner" as const),
        offerings: data.availability
          .filter((row) => row.agreementId === agreement.id)
          .map((row) => views.toAvailabilityView(row, today)),
        activities: data.activities
          .filter((row) => row.agreementId === agreement.id)
          .map((row) => views.toActivityView(row, today)),
        documents: views.documentsLinkedTo({ agreementId: agreement.id }),
      })),
    offerings: data.availability
      .filter((row) => row.institutionId === id)
      .map((row) => views.toAvailabilityView(row, today)),
    opportunities: data.opportunities
      .filter((row) => row.institutionId === id)
      .map((row) => views.toOpportunityView(row, today)),
    activities: data.activities
      .filter((row) => row.institutionId === id)
      .map((row) => views.toActivityView(row, today))
      .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    documents: views.documentsLinkedTo({ institutionId: id }),
    peers: data.institutions
      .filter((row) => row.countryId === institution.countryId && row.id !== id)
      .map((row) => views.toInstitutionView(row, today)),
  };
}

export type InstitutionRecord = NonNullable<Awaited<ReturnType<typeof getInstitution>>>;
export type UniversityAgreement = InstitutionRecord["agreements"][number];
