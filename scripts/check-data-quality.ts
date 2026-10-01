/**
 * Consistency checks for the official dataset and the private contacts file.
 *
 *   npm run data:check            offline checks
 *   npm run data:check -- --links also requests every official URL (network)
 *
 * Exits non-zero on any error. Contact values are never printed — only
 * counts and row positions.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { retiredPartnerSlugs } from "../next.config";
import { officialDataset } from "@/lib/internal/data/dataset";
import { legacyDirectoryInstitutions } from "@/lib/internal/data/seed/institutions";
import { officialCountries, officialRegions, referenceCountries } from "@/lib/official/countries";
import { officialAgreementRows, officialInstitutions } from "@/lib/official/partners";
import { globeMarkers, globeNodes, globeTotals, verifiedInstitutionLocations } from "@/lib/official/geo";
import { officialStats, publicInstitutions, publicSlug } from "@/lib/official/public";
import { partnerTableInstitutionIds as partnerTableIds } from "@/lib/official/records";
import { MUJ_SITE, officialSources } from "@/lib/official/source";
import type { OfficialRegion } from "@/lib/official/types";

const errors: string[] = [];
const warnings: string[] = [];
const error = (message: string) => errors.push(message);
const warn = (message: string) => warnings.push(message);

const data = officialDataset;

function duplicates<T>(rows: readonly T[], key: (row: T) => string | null) {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const value = key(row);
    if (value === null) continue;
    seen.set(value, (seen.get(value) ?? 0) + 1);
  }
  return [...seen].filter(([, count]) => count > 1).map(([value]) => value);
}

function foldName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|of|and)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

// --- Unique identifiers --------------------------------------------------
const tables = {
  institutions: data.institutions,
  agreements: data.agreements,
  availability: data.availability,
  opportunities: data.opportunities,
  documents: data.documents,
  documentLinks: data.documentLinks,
  activities: data.activities,
} as const;
for (const [name, rows] of Object.entries(tables)) {
  for (const id of duplicates(rows as readonly { id: string }[], (row) => row.id)) {
    error(`${name}: duplicate id ${id}`);
  }
}
for (const ref of duplicates(data.agreements, (row) => row.reference)) {
  error(`agreements: duplicate reference ${ref}`);
}

// --- Institution names ---------------------------------------------------
for (const name of duplicates(data.institutions, (row) => foldName(row.normalizedName ?? row.name))) {
  error(`institutions: two records fold to the same name "${name}"`);
}
for (const row of data.institutions) {
  if (!row.name.trim()) error(`institutions: ${row.id} has an empty name`);
  if (row.name !== row.name.trim()) error(`institutions: ${row.id} name has leading/trailing space`);
  if (/\s{2,}/.test(row.name)) warn(`institutions: ${row.id} name has repeated spaces`);
  if (/\bexample\b/i.test(row.name)) error(`institutions: ${row.id} looks like a sample name`);
}

// --- Countries and regions -----------------------------------------------
const countryIds = new Set([...officialCountries, ...referenceCountries].map((row) => row.id));
const officialCountryById = new Map(officialCountries.map((row) => [row.id, row]));
for (const row of data.institutions) {
  if (!countryIds.has(row.countryId)) error(`institutions: ${row.id} has unknown country ${row.countryId}`);
  if (!officialRegions.includes(row.region as (typeof officialRegions)[number])) {
    error(`institutions: ${row.id} has region "${row.region}" outside the official headings`);
  }
  const country = officialCountryById.get(row.countryId);
  if (country && country.name !== row.country) {
    error(`institutions: ${row.id} country label "${row.country}" ≠ "${country.name}"`);
  }
}
for (const country of officialCountries) {
  if (!data.institutions.some((row) => row.countryId === country.id && row.source === "official")) {
    warn(`countries: ${country.id} has no official institution`);
  }
}

// --- Foreign keys --------------------------------------------------------
const institutionIds = new Set(data.institutions.map((row) => row.id));
const agreementById = new Map(data.agreements.map((row) => [row.id, row]));
const programIds = new Set(data.programs.map((row) => row.id));
const availabilityIds = new Set(data.availability.map((row) => row.id));
const documentIds = new Set(data.documents.map((row) => row.id));

for (const row of data.agreements) {
  if (!institutionIds.has(row.institutionId)) error(`agreements: ${row.id} → missing institution ${row.institutionId}`);
}
for (const row of data.availability) {
  if (!institutionIds.has(row.institutionId)) error(`availability: ${row.id} → missing institution`);
  if (!programIds.has(row.programId)) error(`availability: ${row.id} → missing programme ${row.programId}`);
  if (row.agreementId) {
    const agreement = agreementById.get(row.agreementId);
    if (!agreement) error(`availability: ${row.id} → missing agreement ${row.agreementId}`);
    else if (agreement.institutionId !== row.institutionId) {
      error(`availability: ${row.id} agreement belongs to another institution`);
    }
  }
}
for (const row of data.opportunities) {
  if (!programIds.has(row.programId)) error(`opportunities: ${row.id} → missing programme`);
  if (row.institutionId && !institutionIds.has(row.institutionId)) error(`opportunities: ${row.id} → missing institution`);
  if (row.availabilityId && !availabilityIds.has(row.availabilityId)) error(`opportunities: ${row.id} → missing offering`);
}
for (const row of data.documentLinks) {
  if (!documentIds.has(row.documentId)) error(`documentLinks: ${row.id} → missing document`);
  const targets = [row.institutionId, row.agreementId, row.programId, row.availabilityId].filter(Boolean);
  if (targets.length !== 1) error(`documentLinks: ${row.id} must target exactly one record`);
  if (row.institutionId && !institutionIds.has(row.institutionId)) error(`documentLinks: ${row.id} → missing institution`);
  if (row.agreementId && !agreementById.has(row.agreementId)) error(`documentLinks: ${row.id} → missing agreement`);
  if (row.programId && !programIds.has(row.programId)) error(`documentLinks: ${row.id} → missing programme`);
  if (row.availabilityId && !availabilityIds.has(row.availabilityId)) error(`documentLinks: ${row.id} → missing offering`);
}
for (const row of data.activities) {
  if (row.institutionId && !institutionIds.has(row.institutionId)) error(`activities: ${row.id} → missing institution`);
  if (row.agreementId && !agreementById.has(row.agreementId)) error(`activities: ${row.id} → missing agreement`);
}

// --- Provenance and accuracy rules ---------------------------------------
const provenanced = [
  ...data.institutions.map((row) => ["institutions", row] as const),
  ...data.agreements.map((row) => ["agreements", row] as const),
  ...data.programs.map((row) => ["programs", row] as const),
  ...data.availability.map((row) => ["availability", row] as const),
  ...data.opportunities.map((row) => ["opportunities", row] as const),
  ...data.documents.map((row) => ["documents", row] as const),
  ...data.activities.map((row) => ["activities", row] as const),
];
for (const [table, row] of provenanced) {
  if (row.source === "sample") error(`${table}: ${row.id} sample row in the official dataset`);
  if (row.source !== "official") continue;
  if (!row.sourceUrl || !row.sourceUrl.startsWith(MUJ_SITE)) error(`${table}: ${row.id} source URL is not an official MUJ page`);
  if (!row.sourceTitle) error(`${table}: ${row.id} missing source title`);
  if (!row.sourceCheckedOn) error(`${table}: ${row.id} missing source check date`);
  if (row.verification === "verified") error(`${table}: ${row.id} is "verified"; official imports stay source-imported`);
}
for (const row of data.agreements.filter((agreement) => agreement.source === "official")) {
  if (row.recordStatus !== "not-stated") error(`agreements: ${row.id} official row has a status the source does not state`);
  if (row.startDate || row.endDate) error(`agreements: ${row.id} official row has dates the source does not state`);
  if (row.type !== "not-stated" && !row.typeLabel) error(`agreements: ${row.id} typed ${row.type} without quoting the source wording`);
}
for (const row of legacyDirectoryInstitutions) {
  if (row.isPublic) error(`institutions: earlier-directory ${row.id} must not be public`);
}

// --- Links ---------------------------------------------------------------
for (const row of data.documents) {
  if (row.url && !isUrl(row.url)) error(`documents: ${row.id} has a malformed URL`);
  if (row.publiclyAccessible && !row.url) error(`documents: ${row.id} marked publicly accessible without a URL`);
}
for (const row of data.institutions) {
  if (row.website && !isUrl(row.website)) error(`institutions: ${row.id} has a malformed website`);
}
for (const [key, page] of Object.entries(officialSources)) {
  if (!page.url.startsWith(MUJ_SITE)) error(`officialSources.${key} is not on ${MUJ_SITE}`);
}

// --- Public slugs and retired redirects -----------------------------------
for (const slug of duplicates(publicInstitutions, (row) => row.slug)) error(`public: duplicate slug ${slug}`);
const publicSlugs = new Set(publicInstitutions.map((row) => row.slug));
const legacySlugs = new Set(legacyDirectoryInstitutions.map((row) => publicSlug(row.id)));
const retired = new Set<string>(retiredPartnerSlugs);
for (const slug of legacySlugs) if (!retired.has(slug)) error(`redirects: earlier-directory slug ${slug} is not redirected`);
for (const slug of retired) {
  if (!legacySlugs.has(slug)) error(`redirects: retired slug ${slug} has no earlier-directory record`);
  if (publicSlugs.has(slug)) error(`redirects: retired slug ${slug} collides with a live partner page`);
}

// --- Figures shown on the site -------------------------------------------
if (officialStats.institutions !== officialInstitutions.length) error("stats: institution count differs from the partner table");
if (officialStats.collaborationRows !== officialAgreementRows.length) error("stats: row count differs from the partner table");

// --- Home-page globe (src/lib/official/geo) --------------------------------
const regionBounds: Record<OfficialRegion, { lat: [number, number]; lon: [number, number] }> = {
  Asia: { lat: [-11, 82], lon: [25, 180] },
  Europe: { lat: [34, 72], lon: [-25, 45] },
  Australia: { lat: [-45, -10], lon: [112, 155] },
  Africa: { lat: [-35, 38], lon: [-18, 52] },
  "North America": { lat: [14, 72], lon: [-170, -50] },
  "South America": { lat: [-56, 13], lon: [-82, -34] },
  Oceania: { lat: [-50, 0], lon: [110, 180] },
};
const inRange = (value: number, [min, max]: [number, number]) => value >= min && value <= max;
const publicById = new Map(publicInstitutions.map((row) => [row.id, row]));
const placed = new Map<string, number>();
for (const id of duplicates(globeNodes, (node) => node.id)) error(`globe: duplicate node ${id}`);
for (const key of duplicates(globeNodes, (node) => `${node.lat},${node.lon}`)) error(`globe: two nodes share position ${key}`);
for (const id of duplicates(
  globeNodes.filter((node) => node.precision === "country"),
  (node) => node.countryId,
)) {
  error(`globe: more than one country node for ${id}`);
}
for (const node of globeNodes) {
  const country = officialCountryById.get(node.countryId);
  if (!country) {
    error(`globe: ${node.id} country ${node.countryId} is not an official partner country`);
    continue;
  }
  if (node.country !== country.name) error(`globe: ${node.id} label "${node.country}" ≠ "${country.name}"`);
  if (node.region !== country.region) error(`globe: ${node.id} region "${node.region}" ≠ data layer "${country.region}"`);
  if (!inRange(node.lat, [-90, 90]) || !inRange(node.lon, [-180, 180])) error(`globe: ${node.id} coordinates out of range`);
  const bounds = regionBounds[node.region];
  if (!inRange(node.lat, bounds.lat) || !inRange(node.lon, bounds.lon)) {
    error(`globe: ${node.id} (${node.lat}, ${node.lon}) is outside the ${node.region} sanity box`);
  }
  if (!node.source.url.startsWith("http")) error(`globe: ${node.id} has no source URL`);
  const ids = node.precision === "city" ? [node.institutionId] : node.institutionIds;
  if (node.precision === "country") {
    if (node.lat !== country.lat || node.lon !== country.lon) error(`globe: ${node.id} is not at the country reference point`);
    if (node.institutions !== ids.length) error(`globe: ${node.id} institution count mismatch`);
    if (node.alsoListedUnder.includes(node.region)) error(`globe: ${node.id} repeats its own region in alsoListedUnder`);
  }
  let rows = 0;
  for (const id of ids) {
    placed.set(id, (placed.get(id) ?? 0) + 1);
    const institution = publicById.get(id);
    if (!institution) error(`globe: ${node.id} → ${id} is not a public official institution`);
    else {
      if (!institution.inPartnerTable) error(`globe: ${node.id} → ${id} is not in the partner table`);
      if (institution.countryId !== node.countryId) error(`globe: ${node.id} → ${id} belongs to ${institution.countryId}`);
      if (/\bexample\b/i.test(institution.name) || id.startsWith("smp-")) error(`globe: ${node.id} → ${id} is sample data`);
    }
    rows += officialAgreementRows.filter((row) => row.institutionId === id).length;
  }
  if (rows !== node.agreementRows) error(`globe: ${node.id} agreement rows ${node.agreementRows} ≠ ${rows}`);
}
for (const id of partnerTableIds) {
  const count = placed.get(id) ?? 0;
  if (count !== 1) error(`globe: partner ${id} is placed ${count} times`);
}
for (const [id, location] of Object.entries(verifiedInstitutionLocations)) {
  if (!publicById.has(id)) error(`globe: verified location for unknown institution ${id}`);
  if (!location.city.trim()) error(`globe: verified location for ${id} has no city`);
  if (!isUrl(location.sourceUrl)) error(`globe: verified location for ${id} has no source URL`);
}
if (globeTotals.institutions !== officialStats.institutions) error("globe: institution total differs from officialStats");
if (globeTotals.agreementRows !== officialStats.collaborationRows) error("globe: agreement-row total differs from officialStats");
if (globeTotals.countries !== officialStats.countries) error("globe: country total differs from officialStats");
if (globeTotals.regions !== officialStats.regions) error("globe: region total differs from the official headings");
if (globeMarkers.some((marker) => "institutionIds" in marker)) error("globe: client markers carry institution id lists");
const homeSources = [
  "src/app/page.tsx",
  "src/components/hero/hero.tsx",
  "src/components/globe/globe.tsx",
  "src/components/stats/stats.tsx",
  "src/components/editorial/classroom-section.tsx",
  "src/components/partner-preview/partner-preview.tsx",
  "src/components/opportunities/opportunities-section.tsx",
  "src/components/cta/cta.tsx",
];
for (const file of homeSources) {
  const text = readFileSync(join(process.cwd(), file), "utf8");
  if (/\bExample\b|\(sample\)|smp-/.test(text)) error(`home: ${file} references sample data`);
}
console.log(
  `globe: ${globeNodes.length} nodes, ${globeTotals.cityLevelInstitutions} city-level and ` +
    `${globeTotals.countryLevelInstitutions} country-level institutions, ${globeTotals.agreementRows} rows, ` +
    `${globeTotals.countries} countries, ${globeTotals.regions} regions`,
);

// --- Private contacts (optional) ------------------------------------------
const contactsPath = join(process.cwd(), "data/private/muj-nodal-contacts.json");
if (existsSync(contactsPath)) {
  const file = JSON.parse(readFileSync(contactsPath, "utf8")) as {
    contacts: { agreementId: string; name: string | null; phone: string | null; email: string | null }[];
  };
  const phoneShape = /^[0-9+() ,./-]{6,60}$/;
  const emailShape = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i;
  let badPhone = 0;
  let badEmail = 0;
  let empty = 0;
  file.contacts.forEach((row, index) => {
    if (!agreementById.has(row.agreementId)) error(`contacts: row ${index + 1} → unknown agreement`);
    if (row.phone && !phoneShape.test(row.phone)) badPhone += 1;
    if (row.email && !emailShape.test(row.email)) badEmail += 1;
    if (!row.name && !row.phone && !row.email) empty += 1;
  });
  if (badPhone) error(`contacts: ${badPhone} phone value(s) fail the database check`);
  if (badEmail) error(`contacts: ${badEmail} email value(s) fail the database check`);
  if (empty) error(`contacts: ${empty} row(s) have no name, phone, or email`);
  console.log(`contacts: ${file.contacts.length} rows checked (values not printed)`);
} else {
  console.log("contacts: data/private/muj-nodal-contacts.json not present; skipped");
}

// --- Optional network check -----------------------------------------------
async function checkLinks() {
  const urls = new Set<string>();
  for (const page of Object.values(officialSources)) urls.add(page.url);
  for (const row of data.documents) if (row.url) urls.add(row.url);
  const list = [...urls];
  let index = 0;
  async function worker() {
    while (index < list.length) {
      const url = list[index++];
      try {
        const response = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(20_000) });
        const doc = data.documents.find((row) => row.url === url);
        if (!response.ok) {
          (doc && !doc.publiclyAccessible ? warn : error)(`links: ${response.status} ${url}`);
        } else if (doc && !doc.publiclyAccessible) {
          warn(`links: ${url} returns 200 but is flagged not publicly accessible (may be a sign-in page; confirm manually)`);
        }
        await response.body?.cancel();
      } catch (cause) {
        error(`links: ${url} failed (${(cause as Error).message})`);
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(`links: ${list.length} URLs requested`);
}

async function main() {
  if (process.argv.includes("--links")) await checkLinks();

  console.log(
    `checked ${data.institutions.length} institutions, ${data.agreements.length} rows, ` +
      `${data.availability.length} offerings, ${data.opportunities.length} calls, ` +
      `${data.documents.length} documents, ${data.activities.length} activities`,
  );
  for (const message of warnings) console.warn(`warning  ${message}`);
  for (const message of errors) console.error(`error    ${message}`);
  console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exitCode = errors.length ? 1 : 0;
}

void main();
