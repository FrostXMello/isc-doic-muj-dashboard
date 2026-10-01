/**
 * Geographic view of the official partner listing, for the home-page globe.
 *
 * The official pages name each partner's country but not its city or campus
 * (docs/muj-internationalization-source-audit.md, "Not available"). So the
 * globe places partners at country level: one node per country, carrying the
 * number of partner-table institutions and agreement rows attributed to that
 * country by the data layer. The node sits at the country's reference point
 * from ./countries — a geographic centre, not an institutional location.
 *
 * City-level nodes exist only for institutions with an entry in
 * `verifiedInstitutionLocations`, each citing the page that states the city.
 * Adding one moves that institution out of its country node; institution
 * records are never edited for placement.
 *
 * Institutions under two headings on the official page (Malta, Antalya,
 * emlyon, Ohrid) count once, in the country the data layer records; their
 * other headings are kept in `alsoListedUnder`.
 */

import { countryById, officialRegions } from "@/lib/official/countries";
import { officialAgreementRows } from "@/lib/official/partners";
import { partnerCountries, publicInstitutions } from "@/lib/official/public";
import { officialSources, SOURCE_REVIEWED_ON } from "@/lib/official/source";
import type { OfficialAgreementRow, OfficialRegion } from "@/lib/official/types";

export type VerifiedInstitutionLocation = {
  city: string;
  lat: number;
  lon: number;
  /** Official or institutional page that states the city. Required. */
  sourceUrl: string;
  sourceTitle: string;
  checkedOn: string;
};

/**
 * Institution id → a city location confirmed against a cited page. Empty:
 * no official MUJ page states a partner's city. Do not infer a city from an
 * institution's name.
 */
export const verifiedInstitutionLocations: Readonly<Record<string, VerifiedInstitutionLocation>> = {};

export type GlobeSource = { label: string; url: string };

export type GlobeCountryNode = {
  id: string;
  precision: "country";
  countryId: string;
  country: string;
  region: OfficialRegion;
  /** Other regional headings the page lists this country's institutions under. */
  alsoListedUnder: OfficialRegion[];
  lat: number;
  lon: number;
  institutions: number;
  agreementRows: number;
  institutionIds: string[];
  source: GlobeSource;
};

export type GlobeCityNode = {
  id: string;
  precision: "city";
  institutionId: string;
  name: string;
  city: string;
  countryId: string;
  country: string;
  region: OfficialRegion;
  lat: number;
  lon: number;
  agreementRows: number;
  source: GlobeSource;
};

export type GlobeNode = GlobeCountryNode | GlobeCityNode;

const headingToRegion = new Map(officialRegions.map((region) => [region.toUpperCase(), region]));

const rowsByInstitution = new Map<string, OfficialAgreementRow[]>();
for (const row of officialAgreementRows) {
  const rows = rowsByInstitution.get(row.institutionId);
  if (rows) rows.push(row);
  else rowsByInstitution.set(row.institutionId, [row]);
}

const partnerSource: GlobeSource = {
  label: officialSources.partners.title,
  url: officialSources.partners.url,
};

function buildNodes(): GlobeNode[] {
  const institutionById = new Map(publicInstitutions.map((row) => [row.id, row]));
  const idBySlug = new Map(publicInstitutions.map((row) => [row.slug, row.id]));
  const cityNodes: GlobeCityNode[] = [];
  const countryNodes: GlobeCountryNode[] = [];

  for (const country of partnerCountries) {
    const ids = country.institutions.map((entry) => idBySlug.get(entry.slug)!);
    const countryLevel = ids.filter((id) => !verifiedInstitutionLocations[id]);
    const headings = new Set<OfficialRegion>();
    let agreementRows = 0;
    for (const id of countryLevel) {
      for (const row of rowsByInstitution.get(id) ?? []) {
        agreementRows += 1;
        const region = headingToRegion.get(row.sourceRegion);
        if (region && region !== country.region) headings.add(region);
      }
    }
    if (countryLevel.length > 0) {
      const reference = countryById(country.id);
      countryNodes.push({
        id: `country-${country.id}`,
        precision: "country",
        countryId: country.id,
        country: country.country,
        region: country.region,
        alsoListedUnder: officialRegions.filter((region) => headings.has(region)),
        lat: reference.lat,
        lon: reference.lon,
        institutions: countryLevel.length,
        agreementRows,
        institutionIds: countryLevel,
        source: partnerSource,
      });
    }
    for (const id of ids) {
      const location = verifiedInstitutionLocations[id];
      if (!location) continue;
      const institution = institutionById.get(id)!;
      cityNodes.push({
        id: `institution-${id}`,
        precision: "city",
        institutionId: id,
        name: institution.name,
        city: location.city,
        countryId: country.id,
        country: country.country,
        region: country.region,
        lat: location.lat,
        lon: location.lon,
        agreementRows: rowsByInstitution.get(id)?.length ?? 0,
        source: { label: location.sourceTitle, url: location.sourceUrl },
      });
    }
  }

  return [...countryNodes, ...cityNodes];
}

/** Built once per server process; small and serialisable for the client globe. */
export const globeNodes: readonly GlobeNode[] = buildNodes();

/** What the client globe receives: nodes without the institution id lists. */
export type GlobeMarker = Omit<GlobeCountryNode, "institutionIds"> | GlobeCityNode;

export const globeMarkers: readonly GlobeMarker[] = globeNodes.map((node) =>
  node.precision === "city"
    ? node
    : (Object.fromEntries(
        Object.entries(node).filter(([key]) => key !== "institutionIds"),
      ) as GlobeMarker),
);

export const globeTotals = (() => {
  const institutionIds = new Set<string>();
  let agreementRows = 0;
  for (const node of globeNodes) {
    if (node.precision === "city") institutionIds.add(node.institutionId);
    else node.institutionIds.forEach((id) => institutionIds.add(id));
    agreementRows += node.agreementRows;
  }
  return {
    institutions: institutionIds.size,
    agreementRows,
    countries: new Set(globeNodes.map((node) => node.countryId)).size,
    regions: new Set(globeNodes.map((node) => node.region)).size,
    cityLevelInstitutions: globeNodes.filter((node) => node.precision === "city").length,
    countryLevelInstitutions: globeNodes.reduce(
      (sum, node) => sum + (node.precision === "country" ? node.institutions : 0),
      0,
    ),
    sourceUrl: officialSources.partners.url,
    checkedOn: SOURCE_REVIEWED_ON,
  };
})();
