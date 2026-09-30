/**
 * Public-site view of the official data: the partner directory, country
 * groupings for the globe, and headline counts. Only fields stated on the
 * official pages; no status, dates, or contacts. Safe to import from client
 * components.
 */

import { officialCountries, officialRegions } from "@/lib/official/countries";
import { officialAvailability, officialPrograms } from "@/lib/official/internationalization";
import { officialAgreementRows } from "@/lib/official/partners";
import { officialInstitutionRecords, partnerTableInstitutionIds } from "@/lib/official/records";
import { officialSources } from "@/lib/official/source";
import type { OfficialAgreementType, OfficialRegion } from "@/lib/official/types";

export type PublicAgreementRow = {
  reference: string;
  listedAs: string;
  type: OfficialAgreementType;
  /** Agreement wording as displayed, or null when the page states none. */
  typeLabel: string | null;
  sourceSection: string;
};

export type PublicProgramme = {
  programId: string;
  programName: string;
  duration: string | null;
  notes: string | null;
  sourceUrl: string | null;
};

export type PublicInstitution = {
  slug: string;
  id: string;
  /** Name as displayed on the official page. */
  listedName: string;
  /** Spelling-normalised name used for headings and sorting. */
  name: string;
  country: string;
  countryId: string;
  region: OfficialRegion;
  website: string | null;
  sourceUrl: string;
  sourceTitle: string;
  /** In the partner table on the International Collaborations page. */
  inPartnerTable: boolean;
  rows: PublicAgreementRow[];
  programmes: PublicProgramme[];
};

export function publicSlug(id: string) {
  return id.replace(/^(ofc|dir)-/, "");
}

const programById = new Map(officialPrograms.map((program) => [program.id, program]));

export const publicInstitutions: readonly PublicInstitution[] = officialInstitutionRecords
  .filter((institution) => institution.isPublic)
  .map((institution) => ({
    slug: publicSlug(institution.id),
    id: institution.id,
    listedName: institution.name,
    name: institution.normalizedName ?? institution.name,
    country: institution.country,
    countryId: institution.countryId,
    region: institution.region,
    website: institution.website,
    sourceUrl: institution.sourceUrl ?? officialSources.partners.url,
    sourceTitle: institution.sourceTitle ?? officialSources.partners.title,
    inPartnerTable: partnerTableInstitutionIds.has(institution.id),
    rows: officialAgreementRows
      .filter((row) => row.institutionId === institution.id)
      .map((row) => ({
        reference: row.reference,
        listedAs: row.listedAs,
        type: row.type,
        typeLabel: row.typeLabel,
        sourceSection: `${row.sourceRegion} › ${row.sourceCountry}`,
      })),
    programmes: officialAvailability
      .filter((row) => row.institutionId === institution.id)
      .map((row) => ({
        programId: row.programId,
        programName: programById.get(row.programId)?.name ?? row.programId,
        duration: row.duration,
        notes: row.notes,
        sourceUrl: row.sourceUrl,
      })),
  }))
  .sort(
    (a, b) =>
      officialRegions.indexOf(a.region) - officialRegions.indexOf(b.region) ||
      a.country.localeCompare(b.country) ||
      a.name.localeCompare(b.name),
  );

const bySlug = new Map<string, PublicInstitution>();
for (const institution of publicInstitutions) {
  if (bySlug.has(institution.slug)) throw new Error(`Duplicate public slug: ${institution.slug}`);
  bySlug.set(institution.slug, institution);
}

export function getPublicInstitution(slug: string) {
  return bySlug.get(slug);
}

export function institutionsInCountry(countryId: string, exceptSlug?: string) {
  return publicInstitutions.filter(
    (institution) => institution.countryId === countryId && institution.slug !== exceptSlug,
  );
}

export type PartnerCountry = {
  id: string;
  country: string;
  region: OfficialRegion;
  /** Approximate country centre, used only to place the globe point. */
  lat: number;
  lon: number;
  institutions: { slug: string; name: string }[];
};

/** Countries with at least one institution in the official partner table. */
export const partnerCountries: readonly PartnerCountry[] = officialCountries
  .map((country) => ({
    id: country.id,
    country: country.name,
    region: country.region,
    lat: country.lat,
    lon: country.lon,
    institutions: publicInstitutions
      .filter((institution) => institution.countryId === country.id && institution.inPartnerTable)
      .map((institution) => ({ slug: institution.slug, name: institution.name })),
  }))
  .filter((country) => country.institutions.length > 0)
  .sort(
    (a, b) =>
      officialRegions.indexOf(a.region) - officialRegions.indexOf(b.region) ||
      b.institutions.length - a.institutions.length ||
      a.country.localeCompare(b.country),
  );

/** Headline figures, counted from the official partner page. */
export const officialStats = {
  institutions: partnerTableInstitutionIds.size,
  collaborationRows: officialAgreementRows.length,
  countries: partnerCountries.length,
  regions: new Set(officialAgreementRows.map((row) => row.sourceRegion)).size,
  programmes: officialPrograms.length,
} as const;

export const publicRegions = officialRegions;

/** Wording for an agreement row on public pages; never implies a status. */
export function publicAgreementLabel(row: Pick<PublicAgreementRow, "type" | "typeLabel">) {
  if (row.typeLabel) return row.typeLabel;
  switch (row.type) {
    case "mou":
      return "Memorandum of Understanding";
    case "student-exchange":
      return "Student Exchange Agreement";
    case "agreement-of-cooperation":
      return "Agreement of Cooperation";
    case "addendum":
      return "Addendum";
    case "academic-agreement":
      return "Academic Agreement";
    case "other":
      return "Other agreement";
    case "not-stated":
      return "Collaboration listed (agreement type not stated)";
  }
}
