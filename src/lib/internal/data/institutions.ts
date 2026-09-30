import { matchesQuery, openDataContext, uniqueSorted } from "@/lib/internal/data/context";
import type { PartnershipStatus, RecordSource, Region } from "@/lib/internal/types";

export const partnershipStatuses: readonly PartnershipStatus[] = [
  "active",
  "listed",
  "renewal-due",
  "in-progress",
  "lapsed",
  "not-recorded",
];

export const institutionSources: readonly RecordSource[] = ["official", "directory", "sample"];

export type InstitutionFilters = {
  q?: string;
  region?: Region;
  country?: string;
  status?: PartnershipStatus;
  source?: RecordSource;
};

export async function listInstitutions(filters: InstitutionFilters = {}) {
  const { today, data, views } = await openDataContext();
  return data.institutions
    .map((institution) => views.toInstitutionView(institution, today))
    .filter(
      (row) =>
        matchesQuery(filters.q, row.name, row.normalizedName, row.country, row.city) &&
        (!filters.region || row.region === filters.region) &&
        (!filters.country || row.country === filters.country) &&
        (!filters.status || row.partnershipStatus === filters.status) &&
        (!filters.source || row.source === filters.source),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getInstitutionFilterOptions() {
  const { data } = await openDataContext();
  return {
    regions: uniqueSorted(data.institutions.map((row) => row.region)) as Region[],
    countries: uniqueSorted(data.institutions.map((row) => row.country)),
  };
}

export async function getInstitution(id: string) {
  const { today, data, views, contactAccess } = await openDataContext();
  const institution = data.institutions.find((row) => row.id === id);
  if (!institution) return null;

  return {
    contactAccess,
    institution: views.toInstitutionView(institution, today),
    agreements: views
      .agreementsForInstitution(id, today)
      .sort((a, b) => (b.startDate ?? "9999").localeCompare(a.startDate ?? "9999")),
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
