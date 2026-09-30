import { matchesQuery, openDataContext, uniqueSorted } from "@/lib/internal/data/context";
import {
  availabilitySeed,
  documentsLinkedTo,
  findInstitution,
  opportunitySeed,
  programSeed,
  toAvailabilityView,
  toOpportunityView,
} from "@/lib/internal/data/views";
import type { AvailabilityState, ProgramType } from "@/lib/internal/types";

export type AvailabilityFilter = AvailabilityState | "not-recorded";

export const availabilityFilters: readonly AvailabilityFilter[] = [
  "open",
  "closed",
  "suspended",
  "not-recorded",
];

export const programTypes: readonly ProgramType[] = programSeed.map((program) => program.id);

export type OfferingFilters = {
  q?: string;
  program?: ProgramType;
  country?: string;
  availability?: AvailabilityFilter;
};

/** Programme catalogue with the number of recorded offerings per programme. */
export async function listPrograms() {
  await openDataContext();
  return programSeed.map((program) => {
    const offerings = availabilitySeed.filter((row) => row.programId === program.id);
    return {
      ...program,
      offeringCount: offerings.length,
      openCount: offerings.filter((row) => row.availability === "open").length,
    };
  });
}

export async function listOfferings(filters: OfferingFilters = {}) {
  const { today } = await openDataContext();
  return availabilitySeed
    .map((row) => toAvailabilityView(row, today))
    .filter(
      (row) =>
        matchesQuery(
          filters.q,
          row.program.name,
          row.institution?.name,
          row.institution?.country,
          row.duration,
          row.intake,
        ) &&
        (!filters.program || row.programId === filters.program) &&
        (!filters.country || row.institution?.country === filters.country) &&
        (!filters.availability || (row.availability ?? "not-recorded") === filters.availability),
    )
    .sort(
      (a, b) =>
        a.program.name.localeCompare(b.program.name) ||
        (a.institution?.name ?? "").localeCompare(b.institution?.name ?? ""),
    );
}

export async function getOfferingFilterOptions() {
  return {
    countries: uniqueSorted(
      availabilitySeed
        .map((row) => findInstitution(row.institutionId)?.country)
        .filter((country): country is string => Boolean(country)),
    ),
  };
}

export async function getOffering(id: string) {
  const { today } = await openDataContext();
  const offering = availabilitySeed.find((row) => row.id === id);
  if (!offering) return null;

  const documents = [
    ...documentsLinkedTo({ availabilityId: id }),
    ...documentsLinkedTo({ programId: offering.programId }),
  ].filter((doc, index, all) => all.findIndex((other) => other.id === doc.id) === index);

  return {
    offering: toAvailabilityView(offering, today),
    opportunities: opportunitySeed
      .filter((row) => row.availabilityId === id)
      .map((row) => toOpportunityView(row, today)),
    siblings: availabilitySeed
      .filter((row) => row.programId === offering.programId && row.id !== id)
      .map((row) => toAvailabilityView(row, today)),
    documents,
  };
}
