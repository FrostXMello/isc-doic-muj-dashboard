import type { AgreementDetails, RegisterAccess, RegisterRow } from "@/lib/internal/data/register";
import { expiryConflict, type ExpirySummary, summarizeExpiry } from "@/lib/internal/expiry";
import { agreementTypeLabel } from "@/lib/internal/status";
import type { AgreementView, InstitutionContact, InstitutionView } from "@/lib/internal/types";
import { qs2027ForInstitution } from "@/lib/official/qs-rankings-2027";
import { displayCell, displayHeaders, meaningful, personKey, sheetLabels } from "@/lib/internal/workbook/source";

/**
 * Groups a university's agreements, contacts, register details, and source
 * worksheet rows for the Universities & MoUs list and detail pages. Pure, so
 * the grouping and search can be unit-tested.
 */

export const DOIC_OFFICER_ROLE = "MUJ Nodal Officer";
export const EARLIER_OFFICER_ROLE = "MUJ Nodal Officer (earlier)";
export const PARTNER_OFFICER_ROLE = "Partner Nodal Officer";

export type ContactView = InstitutionContact & { note: string | null };

/** One person, merged across the agreements that list them. */
export type OfficerView = {
  key: string;
  name: string | null;
  phones: string[];
  emails: string[];
  notes: string[];
  /** Agreements the person is listed against; empty for university-level contacts. */
  agreementIds: string[];
};

export type AgreementEntry = {
  agreement: AgreementView;
  details: AgreementDetails | null;
  officers: OfficerView[];
  earlierOfficers: OfficerView[];
  partners: OfficerView[];
  otherContacts: ContactView[];
  rows: {
    list: RegisterRow[];
    status: RegisterRow[];
    renewal: RegisterRow[];
    link: RegisterRow[];
  };
  /** The register and the stored dates disagree. */
  review: string | null;
};

export type UniversityEntry = {
  agreements: AgreementEntry[];
  /** Current DoIC nodal officers across all agreements; null when contacts are restricted. */
  officers: OfficerView[] | null;
  earlierOfficers: OfficerView[];
  /** Register rows tied to the university but to no single agreement. */
  universityRows: RegisterRow[];
  /** Contacts not tied to one agreement and not a DoIC officer. */
  universityContacts: ContactView[];
  /** QS World University Rankings 2027 only (published 18 June 2026; empty when the partner is not in that table). */
  qsRankings: string[];
  theRankings: string[];
  faculties: string[];
  departments: string[];
  /** "Opportunities mentioned in MoU", placeholders left out. */
  scopes: string[];
  /** "Summer School or similar program", placeholders left out. */
  programmes: string[];
  expiry: ExpirySummary;
  /** Lower-case text of every value shown for the university, for search. */
  searchText: string;
};

export type ContactSource =
  | { state: "granted"; contacts: readonly InstitutionContact[] }
  | { state: "restricted"; reason: string };

function distinct(values: (string | null | undefined)[]) {
  const seen = new Map<string, string>();
  for (const value of values) {
    const text = value?.trim();
    if (text && !seen.has(text.toLowerCase())) seen.set(text.toLowerCase(), text);
  }
  return [...seen.values()];
}

/** Spelling variants in the register's Department column, so each department is one filter option. */
const departmentSpellings: Record<string, string> = {
  "hotel managment": "Hotel Management",
  "chemical engg": "Chemical",
};

const department = (value: string | null | undefined) =>
  value ? (departmentSpellings[value.trim().toLowerCase()] ?? value) : value;

/** Merges contacts for the same person (by name, else by phone or email). */
export function mergeOfficers(contacts: readonly ContactView[]): OfficerView[] {
  const people = new Map<string, OfficerView>();
  for (const contact of contacts) {
    const key = contact.name ? `n:${personKey(contact.name)}` : `c:${contact.phone ?? contact.email ?? contact.id}`;
    const person = people.get(key) ?? { key, name: contact.name, phones: [], emails: [], notes: [], agreementIds: [] };
    if (contact.phone && !person.phones.includes(contact.phone)) person.phones.push(contact.phone);
    if (contact.email && !person.emails.includes(contact.email)) person.emails.push(contact.email);
    if (contact.note && !person.notes.includes(contact.note)) person.notes.push(contact.note);
    if (contact.agreementId && !person.agreementIds.includes(contact.agreementId)) {
      person.agreementIds.push(contact.agreementId);
    }
    people.set(key, person);
  }
  return [...people.values()];
}

/** Text a source row contributes to search: every displayable value, never formula output. */
export function rowSearchText(row: RegisterRow) {
  return displayHeaders(row.values, row.formulas)
    .map((header) => {
      const cell = displayCell(header, row.values, row.formulas);
      return cell && cell.kind !== "withheld" ? cell.text : "";
    })
    .join(" ");
}

const detailText = (details: AgreementDetails | null) =>
  details
    ? [
        details.doicReference,
        details.periodText,
        details.expiryText,
        details.recordedStatus,
        details.qsRanking,
        details.theRanking,
        details.faculty,
        details.department,
        details.opportunities,
        details.programmeReference,
        details.remarks,
        details.initiationYear?.toString(),
        details.renewalYear?.toString(),
      ]
    : [];

const officerText = (officers: readonly OfficerView[]) =>
  officers.flatMap((officer) => [officer.name, ...officer.phones, ...officer.emails, ...officer.notes]);

export function buildUniversityEntry(
  institution: InstitutionView,
  agreements: readonly AgreementView[],
  contacts: ContactSource,
  register: RegisterAccess,
): UniversityEntry {
  const notes = register.state === "granted" ? register.contactNotes : new Map<string, string>();
  const own: ContactView[] =
    contacts.state === "granted"
      ? contacts.contacts
          .filter((contact) => contact.institutionId === institution.id)
          .map((contact) => ({ ...contact, note: notes.get(contact.id) ?? null }))
      : [];
  const rows = register.state === "granted" ? register.rows.filter((row) => row.institutionId === institution.id) : [];
  const agreementIds = new Set(agreements.map((agreement) => agreement.id));

  const entries: AgreementEntry[] = agreements.map((agreement) => {
    const forAgreement = own.filter((contact) => contact.agreementId === agreement.id);
    const linked = rows.filter((row) => row.agreementId === agreement.id);
    const details = register.state === "granted" ? (register.details.get(agreement.id) ?? null) : null;
    return {
      agreement,
      details,
      officers: mergeOfficers(forAgreement.filter((contact) => contact.roleLabel === DOIC_OFFICER_ROLE)),
      earlierOfficers: mergeOfficers(forAgreement.filter((contact) => contact.roleLabel === EARLIER_OFFICER_ROLE)),
      partners: mergeOfficers(forAgreement.filter((contact) => contact.roleLabel === PARTNER_OFFICER_ROLE)),
      otherContacts: forAgreement.filter(
        (contact) => ![DOIC_OFFICER_ROLE, EARLIER_OFFICER_ROLE, PARTNER_OFFICER_ROLE].includes(contact.roleLabel),
      ),
      rows: {
        list: linked.filter((row) => row.sheet === "mou-list"),
        status: linked.filter((row) => row.sheet === "mou-status"),
        renewal: linked.filter((row) => row.sheet === "renewal"),
        link: linked.filter((row) => row.sheet === "mou-link"),
      },
      review: expiryConflict({
        id: agreement.id,
        status: agreement.status,
        endDate: agreement.endDate,
        daysToExpiry: agreement.daysToExpiry,
        recordedStatus: details?.recordedStatus,
        renewalYear: details?.renewalYear,
      }),
    };
  });

  const officerContacts = own.filter((contact) => contact.roleLabel === DOIC_OFFICER_ROLE);
  const earlierContacts = own.filter((contact) => contact.roleLabel === EARLIER_OFFICER_ROLE);
  const universityContacts = own.filter(
    (contact) =>
      (!contact.agreementId || !agreementIds.has(contact.agreementId)) &&
      contact.roleLabel !== DOIC_OFFICER_ROLE &&
      contact.roleLabel !== EARLIER_OFFICER_ROLE,
  );
  const universityRows = rows.filter((row) => !row.agreementId || !agreementIds.has(row.agreementId));
  const allDetails = entries.map((entry) => entry.details);
  const qs2027 = qs2027ForInstitution(institution.id);

  const entry: UniversityEntry = {
    agreements: entries,
    officers: contacts.state === "granted" ? mergeOfficers(officerContacts) : null,
    earlierOfficers: mergeOfficers(earlierContacts),
    universityRows,
    universityContacts,
    // List and filters use QS World University Rankings 2027 (published 18 June 2026) only — not workbook-era values.
    qsRankings: qs2027 ? [qs2027.rank] : [],
    theRankings: distinct(allDetails.map((details) => details?.theRanking)),
    faculties: distinct(allDetails.map((details) => details?.faculty)),
    departments: distinct(allDetails.map((details) => department(details?.department))),
    scopes: distinct(allDetails.map((details) => meaningful(details?.opportunities ?? null))),
    programmes: distinct(allDetails.map((details) => meaningful(details?.programmeReference ?? null))),
    expiry: summarizeExpiry(
      entries.map(({ agreement, details }) => ({
        id: agreement.id,
        status: agreement.status,
        endDate: agreement.endDate,
        daysToExpiry: agreement.daysToExpiry,
        recordedStatus: details?.recordedStatus,
        renewalYear: details?.renewalYear,
      })),
    ),
    searchText: "",
  };

  entry.searchText = [
    institution.name,
    institution.normalizedName,
    institution.country,
    institution.region,
    institution.city,
    qs2027?.rank,
    qs2027?.qsName,
    "qs 2027",
    ...officerText(entry.officers ?? []),
    ...officerText(entry.earlierOfficers),
    ...universityContacts.flatMap((contact) => [contact.name, contact.phone, contact.email, contact.note, contact.roleLabel]),
    ...entries.flatMap((item) => [
      item.agreement.reference,
      item.agreement.title,
      item.agreement.typeLabel,
      agreementTypeLabel[item.agreement.type],
      item.agreement.notes,
      ...item.agreement.collaborationAreas,
      ...detailText(item.details),
      ...officerText(item.partners),
      ...item.otherContacts.flatMap((contact) => [contact.name, contact.phone, contact.email, contact.note]),
    ]),
    ...rows.map(rowSearchText),
  ]
    .filter(Boolean)
    .join(" \u0001 ")
    .toLowerCase();
  return entry;
}

export function matchesEntry(entry: UniversityEntry, query: string | undefined) {
  const needle = query?.trim().toLowerCase();
  if (!needle) return true;
  if (entry.searchText.includes(needle)) return true;
  // Phone numbers are searchable without their spaces and dashes.
  const digits = needle.replace(/[^0-9]/g, "");
  return digits.length >= 4 && digits.length === needle.replace(/[\s+()-]/g, "").length
    ? entry.searchText.replace(/[\s()-]/g, "").includes(digits)
    : false;
}

export const sheetLabel = (row: RegisterRow) => `${sheetLabels[row.sheet]} row ${row.excelRow}`;
