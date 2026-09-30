import { matchesQuery, openDataContext, uniqueSorted } from "@/lib/internal/data/context";
import type { AgreementStatus, AgreementType, AgreementView } from "@/lib/internal/types";

export const agreementStatuses: readonly AgreementStatus[] = [
  "active",
  "expiring-soon",
  "pending-start",
  "under-review",
  "draft",
  "expired",
  "terminated",
];

export const agreementTypes: readonly AgreementType[] = [
  "mou",
  "student-exchange",
  "research-collaboration",
  "dual-degree",
  "other",
];

export const agreementSorts = ["expiry", "start", "institution"] as const;
export type AgreementSort = (typeof agreementSorts)[number];

export type AgreementFilters = {
  q?: string;
  status?: AgreementStatus;
  type?: AgreementType;
  country?: string;
  sort?: AgreementSort;
};

/** Expiry order: live agreements (soonest end first), then in-progress, then ended (most recent first). */
const expiryRank: Record<AgreementStatus, number> = {
  "expiring-soon": 0,
  active: 0,
  "pending-start": 1,
  "under-review": 2,
  draft: 2,
  expired: 3,
  terminated: 3,
};

const sorters: Record<AgreementSort, (a: AgreementView, b: AgreementView) => number> = {
  expiry: (a, b) =>
    expiryRank[a.status] - expiryRank[b.status] ||
    (expiryRank[a.status] === 3
      ? (b.endDate ?? "").localeCompare(a.endDate ?? "")
      : (a.endDate ?? "9999").localeCompare(b.endDate ?? "9999")),
  start: (a, b) => (b.startDate ?? "0000").localeCompare(a.startDate ?? "0000"),
  institution: (a, b) => (a.institution?.name ?? "").localeCompare(b.institution?.name ?? ""),
};

export async function listAgreements(filters: AgreementFilters = {}) {
  const { today, data, views } = await openDataContext();
  return data.agreements
    .map((agreement) => views.toAgreementView(agreement, today))
    .filter(
      (row) =>
        matchesQuery(
          filters.q,
          row.reference,
          row.title,
          row.institution?.name,
          row.institution?.country,
          ...row.collaborationAreas,
        ) &&
        (!filters.status || row.status === filters.status) &&
        (!filters.type || row.type === filters.type) &&
        (!filters.country || row.institution?.country === filters.country),
    )
    .sort(sorters[filters.sort ?? "expiry"]);
}

export async function getAgreementFilterOptions() {
  const { data, views } = await openDataContext();
  return {
    countries: uniqueSorted(
      data.agreements
        .map((row) => views.findInstitution(row.institutionId)?.country)
        .filter((country): country is string => Boolean(country)),
    ),
  };
}

export async function getAgreement(id: string) {
  const { today, data, views } = await openDataContext();
  const agreement = data.agreements.find((row) => row.id === id);
  if (!agreement) return null;

  const institution = views.findInstitution(agreement.institutionId);
  return {
    today,
    agreement: views.toAgreementView(agreement, today),
    institution: institution ? views.toInstitutionView(institution, today) : null,
    related: data.agreements
      .filter((row) => row.institutionId === agreement.institutionId && row.id !== id)
      .map((row) => views.toAgreementView(row, today)),
    offerings: data.availability
      .filter((row) => row.agreementId === id)
      .map((row) => views.toAvailabilityView(row, today)),
    activities: data.activities
      .filter((row) => row.agreementId === id)
      .map((row) => views.toActivityView(row, today)),
    documents: views.documentsLinkedTo({ agreementId: id }),
  };
}
