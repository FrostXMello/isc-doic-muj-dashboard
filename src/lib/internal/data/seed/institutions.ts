import { partners } from "@/lib/data";
import { institutions as directoryInstitutions } from "@/lib/directory";
import type { Institution } from "@/lib/internal/types";

/**
 * Institution seed rows.
 *
 * 1. DIRECTORY ROWS — derived from the public site's illustrative directory
 *    (src/lib/directory.ts). They carry no agreement, programme, or activity
 *    records in this portal, because none are published. Coordinates are the
 *    shared country pin, not a checked campus location.
 *
 * 2. SAMPLE ROWS — FICTIONAL institutions ("Example … University") used only
 *    so the agreement, programme, opportunity, document, and activity
 *    workflows have something to link to. They are not real universities and
 *    not DoIC partners. Country, region, and city come from the existing
 *    country list so filters stay consistent.
 */

const fromDirectory: Institution[] = directoryInstitutions.map((entry) => ({
  id: `dir-${entry.slug}`,
  name: entry.name,
  country: entry.country,
  countryId: entry.countryId,
  region: entry.region,
  city: entry.city,
  latitude: entry.lat,
  longitude: entry.lon,
  website: null,
  note: entry.countrySummary,
  source: "directory",
}));

function sampleInstitution(id: string, name: string, countryId: string): Institution {
  const country = partners.find((partner) => partner.id === countryId);
  if (!country) throw new Error(`Unknown country id for sample institution: ${countryId}`);
  return {
    id,
    name,
    country: country.country,
    countryId: country.id,
    region: country.region,
    city: country.city,
    latitude: null,
    longitude: null,
    website: null,
    note: null,
    source: "sample",
  };
}

const samples: Institution[] = [
  sampleInstitution("smp-harbour", "Example Harbour University", "united-kingdom"),
  sampleInstitution("smp-alpine", "Example Alpine Institute of Technology", "germany"),
  sampleInstitution("smp-coastal", "Example Coastal University", "australia"),
  sampleInstitution("smp-lakes", "Example Lakes University", "canada"),
  sampleInstitution("smp-gulf", "Example Gulf Institute", "uae"),
  sampleInstitution("smp-straits", "Example Straits University", "singapore"),
];

export const institutionSeed: readonly Institution[] = [...samples, ...fromDirectory];
