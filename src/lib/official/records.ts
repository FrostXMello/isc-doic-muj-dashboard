/**
 * Official MUJ data mapped onto the internal entity types. This is the single
 * source of truth for the static data source, the public site, and the SQL
 * generator (scripts/generate-seed-sql.ts). Public-safe: no contacts.
 */

import { countryById } from "@/lib/official/countries";
import { officialAgreementRows, officialInstitutions } from "@/lib/official/partners";
import { officialSources, SOURCE_REVIEWED_ON } from "@/lib/official/source";
import type { Agreement, Institution, Provenance } from "@/lib/internal/types";

const partnerSource: Omit<Provenance, "verification"> = {
  sourceUrl: officialSources.partners.url,
  sourceTitle: officialSources.partners.title,
  sourceCheckedOn: SOURCE_REVIEWED_ON,
};

function institutionRecord(input: {
  id: string;
  name: string;
  normalizedName: string | null;
  countryId: string;
  website: string | null;
  note: string | null;
  provenance: Omit<Provenance, "verification">;
}): Institution {
  const country = countryById(input.countryId);
  if (!country.region) throw new Error(`Country without a region: ${input.countryId}`);
  return {
    id: input.id,
    name: input.name,
    normalizedName: input.normalizedName,
    country: country.name,
    countryId: country.id,
    region: country.region,
    city: null,
    latitude: null,
    longitude: null,
    website: input.website,
    note: input.note,
    isPublic: true,
    source: "official",
    ...input.provenance,
    verification: input.note ? "needs-review" : "source-imported",
  };
}

/** Institutions named on official pages but absent from the partner table. */
const otherOfficialInstitutions: readonly Institution[] = [
  institutionRecord({
    id: "ofc-the-university-of-melbourne",
    name: "The University of Melbourne, Australia",
    normalizedName: "The University of Melbourne",
    countryId: "australia",
    website: null,
    note: "Named on the official Global Programs page (dual degree: BSc Advanced (Hons)); not listed in the partner table on the International Collaborations page.",
    provenance: {
      sourceUrl: officialSources.globalPrograms.url,
      sourceTitle: officialSources.globalPrograms.title,
      sourceCheckedOn: SOURCE_REVIEWED_ON,
    },
  }),
];

export const officialInstitutionRecords: readonly Institution[] = [
  ...officialInstitutions.map((row) =>
    institutionRecord({
      id: row.id,
      name: row.name,
      normalizedName: row.normalizedName,
      countryId: row.countryId,
      website: row.website,
      note: row.notes,
      provenance: partnerSource,
    }),
  ),
  ...otherOfficialInstitutions,
];

export const officialAgreementRecords: readonly Agreement[] = officialAgreementRows.map((row) => ({
  id: row.id,
  reference: row.reference,
  institutionId: row.institutionId,
  title: row.listedAs,
  type: row.type,
  typeLabel: row.typeLabel,
  recordStatus: "not-stated",
  startDate: null,
  endDate: null,
  renewal: null,
  collaborationAreas: [],
  sourceSection: `${row.sourceRegion} › ${row.sourceCountry}`,
  notes: row.notes,
  source: "official",
  ...partnerSource,
  verification: row.notes ? "needs-review" : "source-imported",
}));

/** Institutions in the official partner table (excludes other official mentions). */
export const partnerTableInstitutionIds: ReadonlySet<string> = new Set(
  officialAgreementRows.map((row) => row.institutionId),
);
