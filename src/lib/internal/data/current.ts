import type { Dataset } from "@/lib/internal/data/dataset";
import type { Agreement } from "@/lib/internal/types";

/**
 * The portal lists MoUs that are active or ended during the current calendar
 * year. An agreement that ended before 1 January of this year, or was closed
 * without an end date this year, is retired from every view. A university is
 * retired with it only when all of its agreements are retired and no
 * programme, opportunity, activity, or document refers to it.
 */

export type Retired = { agreements: ReadonlySet<string>; institutions: ReadonlySet<string> };

export const noneRetired: Retired = { agreements: new Set(), institutions: new Set() };

/** 1 January of `today`'s year, as YYYY-MM-DD. */
export function currentYearStart(today: string) {
  return `${today.slice(0, 4)}-01-01`;
}

export function isRetiredAgreement(agreement: Agreement, today: string) {
  const endedThisYearOrLater = agreement.endDate !== null && agreement.endDate >= currentYearStart(today);
  if (agreement.recordStatus === "terminated") return !endedThisYearOrLater;
  return agreement.endDate !== null && !endedThisYearOrLater;
}

export function retireStaleAgreements(data: Dataset, today: string): { data: Dataset; retired: Retired } {
  const agreements = new Set(data.agreements.filter((a) => isRetiredAgreement(a, today)).map((a) => a.id));
  if (agreements.size === 0) return { data, retired: noneRetired };

  const parties = (agreement: Agreement) => [agreement.institutionId, ...(agreement.partnerInstitutionIds ?? [])];
  const withLiveAgreement = new Set(data.agreements.filter((a) => !agreements.has(a.id)).flatMap(parties));
  const referenced = new Set(
    [
      ...data.availability.map((row) => row.institutionId),
      ...data.opportunities.map((row) => row.institutionId),
      ...data.activities.map((row) => row.institutionId),
      ...data.documentLinks.map((row) => row.institutionId),
    ].filter((id): id is string => Boolean(id)),
  );
  const institutions = new Set(
    data.agreements
      .filter((a) => agreements.has(a.id))
      .flatMap(parties)
      .filter((id) => !withLiveAgreement.has(id) && !referenced.has(id)),
  );

  const unlink = <T extends { agreementId: string | null }>(row: T): T =>
    row.agreementId && agreements.has(row.agreementId) ? { ...row, agreementId: null } : row;

  return {
    retired: { agreements, institutions },
    data: {
      ...data,
      institutions: data.institutions.filter((row) => !institutions.has(row.id)),
      agreements: data.agreements.filter((row) => !agreements.has(row.id)),
      availability: data.availability.map(unlink),
      activities: data.activities.map(unlink),
      documentLinks: data.documentLinks.filter((row) => !row.agreementId || !agreements.has(row.agreementId)),
    },
  };
}

/** Whether a contact or register row belongs to a retired agreement or university. */
export function isRetiredRow(retired: Retired, row: { institutionId: string | null; agreementId: string | null }) {
  return (
    (row.agreementId !== null && retired.agreements.has(row.agreementId)) ||
    (row.institutionId !== null && retired.institutions.has(row.institutionId))
  );
}
