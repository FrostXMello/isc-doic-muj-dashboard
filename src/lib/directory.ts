import { hub, partners, type PartnerRegion } from "@/lib/data";

/**
 * Institution rows derived from the country-level mock list.
 * Slugs are computed here so src/lib/data.ts can stay unchanged.
 * Names remain sample institutions, not a record of signed agreements.
 */

const regionOrder: readonly PartnerRegion[] = [
  "Europe",
  "Middle East",
  "Asia-Pacific",
  "North America",
];

export type Institution = {
  slug: string;
  name: string;
  region: PartnerRegion;
  country: string;
  countryId: string;
  city: string;
  lat: number;
  lon: number;
  countrySummary: string;
};

export function institutionSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const institutions: readonly Institution[] = regionOrder.flatMap((region) =>
  partners
    .filter((partner) => partner.region === region)
    .flatMap((partner) =>
      partner.universities.map((name) => ({
        slug: institutionSlug(name),
        name,
        region: partner.region,
        country: partner.country,
        countryId: partner.id,
        city: partner.city,
        lat: partner.lat,
        lon: partner.lon,
        countrySummary: partner.summary,
      })),
    )
    .sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name)),
);

const bySlug = new Map<string, Institution>();
for (const institution of institutions) {
  if (bySlug.has(institution.slug)) {
    throw new Error(`Duplicate institution slug: ${institution.slug}`);
  }
  bySlug.set(institution.slug, institution);
}

export function getInstitution(slug: string) {
  return bySlug.get(slug);
}

export function institutionsInCountry(countryId: string, exceptSlug?: string) {
  return institutions.filter(
    (institution) => institution.countryId === countryId && institution.slug !== exceptSlug,
  );
}

export function formatCoord(value: number, positive: string, negative: string) {
  const hemisphere = value >= 0 ? positive : negative;
  return `${Math.abs(value).toFixed(1)}° ${hemisphere}`;
}

export function longitudeFromJaipur(lon: number) {
  return Math.abs(lon - hub.lon).toFixed(0);
}

export const directoryRegions = regionOrder;
