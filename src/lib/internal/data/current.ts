import type { Dataset } from "@/lib/internal/data/dataset";
import type { Agreement } from "@/lib/internal/types";

/**
 * The portal lists MoUs that are active or ended during the current calendar
 * year. An agreement that ended before 1 January of this year, or was closed
 * without an end date this year, is retired from every view.
 *
 * A university is retired when it has a retired agreement and no current one.
 * An undated agreement whose status is not stated does not keep it: it is
 * usually the same MoU listed without dates. A retired university's undated
 * agreements, programme offerings, and opportunities are retired with it;
 * activities and documents stay, unlinked from it.
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

/** An agreement with no dates and no stated status says nothing about whether the MoU is current. */
const isUndated = (agreement: Agreement) => agreement.endDate === null && agreement.recordStatus === "not-stated";

export function retireStaleAgreements(data: Dataset, today: string): { data: Dataset; retired: Retired } {
  const stale = new Set(data.agreements.filter((a) => isRetiredAgreement(a, today)).map((a) => a.id));
  if (stale.size === 0) return { data, retired: noneRetired };

  const parties = (agreement: Agreement) => [agreement.institutionId, ...(agreement.partnerInstitutionIds ?? [])];
  const current = new Set(
    data.agreements.filter((a) => !stale.has(a.id) && !isUndated(a)).flatMap(parties),
  );
  const institutions = new Set(
    data.agreements
      .filter((a) => stale.has(a.id))
      .flatMap(parties)
      .filter((id) => !current.has(id)),
  );
  const agreements = new Set([
    ...stale,
    ...data.agreements.filter((a) => isUndated(a) && institutions.has(a.institutionId)).map((a) => a.id),
  ]);

  const availability = data.availability.filter((row) => !institutions.has(row.institutionId));
  const offered = new Set(availability.map((row) => row.id));
  const unlinkAgreement = <T extends { agreementId: string | null }>(row: T): T =>
    row.agreementId && agreements.has(row.agreementId) ? { ...row, agreementId: null } : row;

  return {
    retired: { agreements, institutions },
    data: {
      ...data,
      institutions: data.institutions.filter((row) => !institutions.has(row.id)),
      agreements: data.agreements
        .filter((row) => !agreements.has(row.id))
        .map((row) =>
          row.partnerInstitutionIds?.some((id) => institutions.has(id))
            ? { ...row, partnerInstitutionIds: row.partnerInstitutionIds.filter((id) => !institutions.has(id)) }
            : row,
        ),
      availability: availability.map(unlinkAgreement),
      opportunities: data.opportunities.filter(
        (row) =>
          !(row.institutionId && institutions.has(row.institutionId)) &&
          !(row.availabilityId && !offered.has(row.availabilityId)),
      ),
      activities: data.activities.map((row) => {
        const unlinked = unlinkAgreement(row);
        return unlinked.institutionId && institutions.has(unlinked.institutionId)
          ? { ...unlinked, institutionId: null }
          : unlinked;
      }),
      documentLinks: data.documentLinks.filter(
        (row) =>
          !(row.agreementId && agreements.has(row.agreementId)) &&
          !(row.institutionId && institutions.has(row.institutionId)) &&
          !(row.availabilityId && !offered.has(row.availabilityId)),
      ),
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
