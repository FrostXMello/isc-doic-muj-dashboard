import { matchesQuery, openDataContext, uniqueSorted } from "@/lib/internal/data/context";
import {
  findAvailability,
  findInstitution,
  opportunitySeed,
  toAvailabilityView,
  toOpportunityView,
} from "@/lib/internal/data/views";
import type { OpportunityStatus, OpportunityView, ProgramType } from "@/lib/internal/types";

export const opportunityStatuses: readonly OpportunityStatus[] = [
  "open",
  "closing-soon",
  "upcoming",
  "closed",
  "draft",
  "archived",
];

export const opportunitySorts = ["deadline", "title"] as const;
export type OpportunitySort = (typeof opportunitySorts)[number];

export type OpportunityFilters = {
  q?: string;
  status?: OpportunityStatus;
  program?: ProgramType;
  country?: string;
  sort?: OpportunitySort;
};

const sorters: Record<OpportunitySort, (a: OpportunityView, b: OpportunityView) => number> = {
  deadline: (a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"),
  title: (a, b) => a.title.localeCompare(b.title),
};

export async function listOpportunities(filters: OpportunityFilters = {}) {
  const { today } = await openDataContext();
  return opportunitySeed
    .map((row) => toOpportunityView(row, today))
    .filter(
      (row) =>
        matchesQuery(
          filters.q,
          row.title,
          row.program.name,
          row.institution?.name,
          row.institution?.country,
        ) &&
        (!filters.status || row.status === filters.status) &&
        (!filters.program || row.programId === filters.program) &&
        (!filters.country || row.institution?.country === filters.country),
    )
    .sort(sorters[filters.sort ?? "deadline"]);
}

export async function getOpportunityFilterOptions() {
  return {
    countries: uniqueSorted(
      opportunitySeed
        .map((row) => findInstitution(row.institutionId)?.country)
        .filter((country): country is string => Boolean(country)),
    ),
  };
}

export async function getOpportunity(id: string) {
  const { today } = await openDataContext();
  const opportunity = opportunitySeed.find((row) => row.id === id);
  if (!opportunity) return null;

  const availability = findAvailability(opportunity.availabilityId);
  return {
    opportunity: toOpportunityView(opportunity, today),
    offering: availability ? toAvailabilityView(availability, today) : null,
  };
}
