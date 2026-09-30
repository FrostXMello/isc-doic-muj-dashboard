import { matchesQuery, openDataContext, uniqueSorted } from "@/lib/internal/data/context";
import {
  activitySeed,
  agreementsForInstitution,
  availabilitySeed,
  documentsLinkedTo,
  institutionSeed,
  opportunitySeed,
  toActivityView,
  toAvailabilityView,
  toInstitutionView,
  toOpportunityView,
} from "@/lib/internal/data/views";
import type { PartnershipStatus, RecordSource, Region } from "@/lib/internal/types";

export const partnershipStatuses: readonly PartnershipStatus[] = [
  "active",
  "renewal-due",
  "in-progress",
  "lapsed",
  "not-recorded",
];

export const institutionSources: readonly RecordSource[] = ["directory", "sample"];

export type InstitutionFilters = {
  q?: string;
  region?: Region;
  country?: string;
  status?: PartnershipStatus;
  source?: RecordSource;
};

export async function listInstitutions(filters: InstitutionFilters = {}) {
  const { today } = await openDataContext();
  return institutionSeed
    .map((institution) => toInstitutionView(institution, today))
    .filter(
      (row) =>
        matchesQuery(filters.q, row.name, row.country, row.city) &&
        (!filters.region || row.region === filters.region) &&
        (!filters.country || row.country === filters.country) &&
        (!filters.status || row.partnershipStatus === filters.status) &&
        (!filters.source || row.source === filters.source),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getInstitutionFilterOptions() {
  return {
    regions: uniqueSorted(institutionSeed.map((row) => row.region)) as Region[],
    countries: uniqueSorted(institutionSeed.map((row) => row.country)),
  };
}

export async function getInstitution(id: string) {
  const { today } = await openDataContext();
  const institution = institutionSeed.find((row) => row.id === id);
  if (!institution) return null;

  return {
    institution: toInstitutionView(institution, today),
    agreements: agreementsForInstitution(id, today).sort((a, b) =>
      (b.startDate ?? "9999").localeCompare(a.startDate ?? "9999"),
    ),
    offerings: availabilitySeed
      .filter((row) => row.institutionId === id)
      .map((row) => toAvailabilityView(row, today)),
    opportunities: opportunitySeed
      .filter((row) => row.institutionId === id)
      .map((row) => toOpportunityView(row, today)),
    activities: activitySeed
      .filter((row) => row.institutionId === id)
      .map((row) => toActivityView(row, today))
      .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    documents: documentsLinkedTo({ institutionId: id }),
    peers: institutionSeed
      .filter((row) => row.countryId === institution.countryId && row.id !== id)
      .map((row) => toInstitutionView(row, today)),
  };
}
