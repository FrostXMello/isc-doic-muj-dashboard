import { matchesQuery, openDataContext, uniqueSorted } from "@/lib/internal/data/context";
import type {
  AgreementStatus,
  AgreementType,
  AgreementView,
  InstitutionView,
  PartnershipStatus,
  RecordSource,
  Region,
} from "@/lib/internal/types";

export const partnershipStatuses: readonly PartnershipStatus[] = [
  "active",
  "listed",
  "renewal-due",
  "in-progress",
  "lapsed",
  "not-recorded",
];

export const institutionSources: readonly RecordSource[] = ["official", "directory", "sample"];

export const agreementCoverage = ["with", "without"] as const;
export type AgreementCoverage = (typeof agreementCoverage)[number];

export type InstitutionFilters = {
  q?: string;
  region?: Region;
  country?: string;
  status?: PartnershipStatus;
  source?: RecordSource;
  /** Has at least one agreement with this derived status. */
  agreementStatus?: AgreementStatus;
  /** Has at least one agreement of this type. */
  agreementType?: AgreementType;
  coverage?: AgreementCoverage;
};

export type UniversityRow = InstitutionView & { agreements: AgreementView[] };

export async function listInstitutions(filters: InstitutionFilters = {}): Promise<UniversityRow[]> {
  const { today, data, views } = await openDataContext();
  return data.institutions
    .map((institution) => ({
      ...views.toInstitutionView(institution, today),
      agreements: views.agreementsForInstitution(institution.id, today),
    }))
    .filter(
      (row) =>
        (matchesQuery(filters.q, row.name, row.normalizedName, row.country, row.city) ||
          row.agreements.some((agreement) =>
            matchesQuery(
              filters.q,
              agreement.reference,
              agreement.title,
              agreement.typeLabel,
              ...agreement.collaborationAreas,
            ),
          )) &&
        (!filters.region || row.region === filters.region) &&
        (!filters.country || row.country === filters.country) &&
        (!filters.status || row.partnershipStatus === filters.status) &&
        (!filters.source || row.source === filters.source) &&
        (!filters.agreementStatus ||
          row.agreements.some((agreement) => agreement.status === filters.agreementStatus)) &&
        (!filters.agreementType ||
          row.agreements.some((agreement) => agreement.type === filters.agreementType)) &&
        (!filters.coverage ||
          (filters.coverage === "with" ? row.agreements.length > 0 : row.agreements.length === 0)),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Agreement counts across every university, each agreement counted once. */
export async function getAgreementTotals() {
  const { today, data, views } = await openDataContext();
  const statuses = data.agreements.map((agreement) => views.toAgreementView(agreement, today).status);
  const count = (status: AgreementStatus) => statuses.filter((value) => value === status).length;
  return {
    total: statuses.length,
    count,
  };
}

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
  const { today, data, views, contactAccess } = await openDataContext();
  const institution = data.institutions.find((row) => row.id === id);
  if (!institution) return null;

  return {
    today,
    contactAccess,
    institution: views.toInstitutionView(institution, today),
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
