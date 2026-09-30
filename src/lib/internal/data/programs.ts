import { matchesQuery, openDataContext, uniqueSorted } from "@/lib/internal/data/context";
import type { AvailabilityState, ProgramType } from "@/lib/internal/types";

export type AvailabilityFilter = AvailabilityState | "not-recorded";

export const availabilityFilters: readonly AvailabilityFilter[] = [
  "open",
  "closed",
  "suspended",
  "not-recorded",
];

/** The programme type vocabulary (fixed; mirrors the program_type enum). */
export const programTypes: readonly ProgramType[] = [
  "student-exchange",
  "semester-exchange",
  "pathway-programs",
  "academic-visits",
  "dual-degree",
  "summer-winter-school",
];

export type OfferingFilters = {
  q?: string;
  program?: ProgramType;
  country?: string;
  availability?: AvailabilityFilter;
};

/** Programme catalogue with the number of recorded offerings per programme. */
export async function listPrograms() {
  const { data } = await openDataContext();
  return data.programs.map((program) => {
    const offerings = data.availability.filter((row) => row.programId === program.id);
    return {
      ...program,
      offeringCount: offerings.length,
      openCount: offerings.filter((row) => row.availability === "open").length,
    };
  });
}

export async function listOfferings(filters: OfferingFilters = {}) {
  const { today, data, views } = await openDataContext();
  return data.availability
    .map((row) => views.toAvailabilityView(row, today))
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
  const { data, views } = await openDataContext();
  return {
    countries: uniqueSorted(
      data.availability
        .map((row) => views.findInstitution(row.institutionId)?.country)
        .filter((country): country is string => Boolean(country)),
    ),
  };
}

export async function getOffering(id: string) {
  const { today, data, views } = await openDataContext();
  const offering = data.availability.find((row) => row.id === id);
  if (!offering) return null;

  const documents = [
    ...views.documentsLinkedTo({ availabilityId: id }),
    ...views.documentsLinkedTo({ programId: offering.programId }),
  ].filter((doc, index, all) => all.findIndex((other) => other.id === doc.id) === index);

  return {
    offering: views.toAvailabilityView(offering, today),
    opportunities: data.opportunities
      .filter((row) => row.availabilityId === id)
      .map((row) => views.toOpportunityView(row, today)),
    siblings: data.availability
      .filter((row) => row.programId === offering.programId && row.id !== id)
      .map((row) => views.toAvailabilityView(row, today)),
    documents,
  };
}
