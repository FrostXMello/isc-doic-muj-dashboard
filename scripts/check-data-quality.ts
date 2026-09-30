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
import { officialStats, publicInstitutions, publicSlug } from "@/lib/official/public";
import { MUJ_SITE, officialSources } from "@/lib/official/source";

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
