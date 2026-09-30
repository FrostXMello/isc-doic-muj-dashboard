import { countryById } from "@/lib/official/countries";
import type { Institution } from "@/lib/internal/types";
import { SAMPLE } from "./sample";

/**
 * Non-official institution rows. Official institutions live in
 * src/lib/official/records.ts.
 *
 * 1. DIRECTORY ROWS — names from this platform's earlier illustrative public
 *    directory that do NOT appear on the official MUJ partner page (The
 *    University of Newcastle does, and is an official row). They are kept for
 *    DoIC to review, never shown publicly, and carry no agreements. Ids are
 *    unchanged so old links keep resolving.
 *
 * 2. SAMPLE ROWS — FICTIONAL institutions ("Example … University") so the
 *    workflows have something to link to. Loaded only when
 *    INTERNAL_SAMPLE_DATA=true.
 */

function row(
  id: string,
  name: string,
  countryId: string,
  rest: Pick<Institution, "source" | "note" | "sourceUrl" | "sourceTitle" | "sourceCheckedOn" | "verification">,
): Institution {
  const country = countryById(countryId);
  if (!country.region) throw new Error(`Country without a region: ${countryId}`);
  return {
    id,
    name,
    normalizedName: null,
    country: country.name,
    countryId: country.id,
    region: country.region,
    city: null,
    latitude: null,
    longitude: null,
    website: null,
    isPublic: false,
    ...rest,
  };
}

const LEGACY_NOTE =
  "Shown in this platform's earlier illustrative directory; not listed on the official MUJ partner page (reviewed 2026-09-30). Confirm with DoIC before publishing.";

function legacy(slug: string, name: string, countryId: string): Institution {
  return row(`dir-${slug}`, name, countryId, {
    source: "directory",
    note: LEGACY_NOTE,
    sourceUrl: null,
    sourceTitle: null,
    sourceCheckedOn: "2026-09-30",
    verification: "needs-review",
  });
}

export const legacyDirectoryInstitutions: readonly Institution[] = [
  legacy("university-of-birmingham", "University of Birmingham", "united-kingdom"),
  legacy("lancaster-university", "Lancaster University", "united-kingdom"),
  legacy("macquarie-university", "Macquarie University", "australia"),
  legacy("boston-university", "Boston University", "united-states"),
  legacy("university-of-massachusetts", "University of Massachusetts", "united-states"),
  legacy("technical-university-of-munich", "Technical University of Munich", "germany"),
  legacy("lmu-munich", "LMU Munich", "germany"),
  legacy("university-of-wollongong-in-dubai", "University of Wollongong in Dubai", "united-arab-emirates"),
  legacy("middlesex-university-dubai", "Middlesex University Dubai", "united-arab-emirates"),
  legacy("national-university-of-singapore", "National University of Singapore", "singapore"),
  legacy("singapore-management-university", "Singapore Management University", "singapore"),
  legacy("sciences-po", "Sciences Po", "france"),
  legacy("waseda-university", "Waseda University", "japan"),
  legacy("university-of-toronto", "University of Toronto", "canada"),
  legacy("university-of-amsterdam", "University of Amsterdam", "netherlands"),
  legacy("yonsei-university", "Yonsei University", "south-korea"),
];

function sample(id: string, name: string, countryId: string): Institution {
  return row(id, name, countryId, { ...SAMPLE, note: null });
}

export const sampleInstitutions: readonly Institution[] = [
  sample("smp-harbour", "Example Harbour University", "united-kingdom"),
  sample("smp-alpine", "Example Alpine Institute of Technology", "germany"),
  sample("smp-coastal", "Example Coastal University", "australia"),
  sample("smp-lakes", "Example Lakes University", "canada"),
  sample("smp-gulf", "Example Gulf Institute", "united-arab-emirates"),
  sample("smp-straits", "Example Straits University", "singapore"),
];
