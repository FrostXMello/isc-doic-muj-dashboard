import { matchesQuery, openDataContext, uniqueSorted } from "@/lib/internal/data/context";
import { type ProgramAudience, programAudience } from "@/lib/internal/status";
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
  audience?: ProgramAudience;
};

export function isProgramType(value: string): value is ProgramType {
  return (programTypes as readonly string[]).includes(value);
}

/** Programme catalogue with its recorded offerings and opportunities per programme. */
export async function listPrograms(filters: { audience?: ProgramAudience } = {}) {
  const { data } = await openDataContext();
  return data.programs
    .filter((program) => !filters.audience || programAudience[program.id] === filters.audience)
    .map((program) => {
      const offerings = data.availability.filter((row) => row.programId === program.id);
      return {
        ...program,
        audience: programAudience[program.id],
        offeringCount: offerings.length,
        openCount: offerings.filter((row) => row.availability === "open").length,
        opportunityCount: data.opportunities.filter((row) => row.programId === program.id).length,
      };
    });
}

/** One programme with everything recorded under it. Opportunities link through their programme. */
export async function getProgram(id: string) {
  if (!isProgramType(id)) return null;
  const { today, data, views } = await openDataContext();
  const program = data.programs.find((row) => row.id === id);
  if (!program) return null;
  return {
    program,
    audience: programAudience[program.id],
    offerings: data.availability
      .filter((row) => row.programId === id)
      .map((row) => views.toAvailabilityView(row, today))
      .sort((a, b) => (a.institution?.name ?? "").localeCompare(b.institution?.name ?? "")),
    opportunities: data.opportunities
      .filter((row) => row.programId === id)
      .map((row) => views.toOpportunityView(row, today))
      .sort((a, b) => (b.deadline ?? "").localeCompare(a.deadline ?? "")),
    documents: views.documentsLinkedTo({ programId: id }),
  };
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
        (!filters.audience || programAudience[row.programId] === filters.audience) &&
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
