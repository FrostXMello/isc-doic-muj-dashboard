import type { OfficialCountry, OfficialRegion } from "@/lib/official/types";

/** Regional headings in the order the official page lists them. */
export const officialRegions: readonly OfficialRegion[] = [
  "Asia",
  "Europe",
  "Australia",
  "Africa",
  "North America",
  "South America",
  "Oceania",
];

/**
 * Countries of the institutions on the official page. Names are normalised
 * from the page's country headings ("UK" → United Kingdom, "SAUDI ARAB" →
 * Saudi Arabia, "PRAGUE" → Czechia, "MACEDONIA" → North Macedonia).
 *
 * Region follows the page's heading. Where one country appears under two
 * headings (Malta, Turkey), see docs/muj-internationalization-source-audit.md.
 * Coordinates are approximate country centres for the globe.
 */
export const officialCountries: readonly OfficialCountry[] = [
  { id: "kazakhstan", name: "Kazakhstan", region: "Asia", lat: 48.0, lon: 67.0 },
  { id: "malaysia", name: "Malaysia", region: "Asia", lat: 4.2, lon: 101.9 },
  { id: "nepal", name: "Nepal", region: "Asia", lat: 28.4, lon: 84.1 },
  { id: "russia", name: "Russia", region: "Asia", lat: 61.5, lon: 105.3 },
  { id: "thailand", name: "Thailand", region: "Asia", lat: 15.9, lon: 101.0 },
  { id: "armenia", name: "Armenia", region: "Asia", lat: 40.1, lon: 45.0 },
  { id: "indonesia", name: "Indonesia", region: "Asia", lat: -0.8, lon: 113.9 },
  { id: "bangladesh", name: "Bangladesh", region: "Asia", lat: 23.7, lon: 90.4 },
  { id: "kyrgyzstan", name: "Kyrgyzstan", region: "Asia", lat: 41.2, lon: 74.8 },
  { id: "united-arab-emirates", name: "United Arab Emirates", region: "Asia", lat: 23.4, lon: 53.8 },
  { id: "uzbekistan", name: "Uzbekistan", region: "Asia", lat: 41.4, lon: 64.6 },
  { id: "saudi-arabia", name: "Saudi Arabia", region: "Asia", lat: 23.9, lon: 45.1 },
  { id: "turkey", name: "Turkey", region: "Asia", lat: 39.0, lon: 35.2 },
  { id: "south-korea", name: "South Korea", region: "Asia", lat: 35.9, lon: 127.8 },
  { id: "malta", name: "Malta", region: "Europe", lat: 35.9, lon: 14.4 },
  { id: "france", name: "France", region: "Europe", lat: 46.2, lon: 2.2 },
  { id: "italy", name: "Italy", region: "Europe", lat: 41.9, lon: 12.6 },
  { id: "germany", name: "Germany", region: "Europe", lat: 51.2, lon: 10.5 },
  { id: "united-kingdom", name: "United Kingdom", region: "Europe", lat: 54.0, lon: -2.5 },
  { id: "czechia", name: "Czechia", region: "Europe", lat: 49.8, lon: 15.5 },
  { id: "bulgaria", name: "Bulgaria", region: "Europe", lat: 42.7, lon: 25.5 },
  { id: "ukraine", name: "Ukraine", region: "Europe", lat: 48.4, lon: 31.2 },
  { id: "poland", name: "Poland", region: "Europe", lat: 51.9, lon: 19.1 },
  { id: "romania", name: "Romania", region: "Europe", lat: 45.9, lon: 25.0 },
  { id: "greece", name: "Greece", region: "Europe", lat: 39.1, lon: 21.8 },
  { id: "serbia", name: "Serbia", region: "Europe", lat: 44.0, lon: 21.0 },
  { id: "switzerland", name: "Switzerland", region: "Europe", lat: 46.8, lon: 8.2 },
  { id: "belarus", name: "Belarus", region: "Europe", lat: 53.7, lon: 28.0 },
  { id: "portugal", name: "Portugal", region: "Europe", lat: 39.4, lon: -8.2 },
  { id: "ireland", name: "Ireland", region: "Europe", lat: 53.4, lon: -8.2 },
  { id: "norway", name: "Norway", region: "Europe", lat: 60.5, lon: 8.5 },
  { id: "north-macedonia", name: "North Macedonia", region: "Europe", lat: 41.6, lon: 21.7 },
  { id: "australia", name: "Australia", region: "Australia", lat: -25.3, lon: 133.8 },
  { id: "south-africa", name: "South Africa", region: "Africa", lat: -30.6, lon: 22.9 },
  { id: "tanzania", name: "Tanzania", region: "Africa", lat: -6.4, lon: 34.9 },
  { id: "united-states", name: "United States", region: "North America", lat: 39.8, lon: -98.6 },
  { id: "canada", name: "Canada", region: "North America", lat: 56.1, lon: -106.3 },
  { id: "peru", name: "Peru", region: "South America", lat: -9.2, lon: -75.0 },
  { id: "new-zealand", name: "New Zealand", region: "Oceania", lat: -40.9, lon: 174.9 },
];

/**
 * Countries referenced only by internal records: the home country (activities)
 * and countries of legacy directory names that are not on the official page.
 */
export const referenceCountries: readonly (Omit<OfficialCountry, "region"> & {
  region: OfficialRegion | null;
})[] = [
  { id: "india", name: "India", region: null, lat: 26.9124, lon: 75.7873 },
  { id: "singapore", name: "Singapore", region: "Asia", lat: 1.35, lon: 103.82 },
  { id: "japan", name: "Japan", region: "Asia", lat: 36.2, lon: 138.3 },
  { id: "netherlands", name: "Netherlands", region: "Europe", lat: 52.1, lon: 5.3 },
];

const byId = new Map(
  [...officialCountries, ...referenceCountries].map((country) => [country.id, country]),
);

export function countryById(id: string) {
  const country = byId.get(id);
  if (!country) throw new Error(`Unknown country id: ${id}`);
  return country;
}
