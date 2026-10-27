/**
 * Builds the import plan for the DoIC MoU register: which worksheet rows match
 * existing universities and agreements, what is created, what is a duplicate,
 * and what needs review. Pure: no file or database access, so the plan can be
 * tested and the report and SQL are generated from the same result.
 */

import {
  type CellValue,
  cellText,
  fieldsBeforeShift,
  hasShiftedColumns,
  isPlaceholder,
  matchKey,
  meaningful,
  mouList,
  parseEmails,
  parsePhone,
  parseSourceDate,
  parseStatus,
  parseYear,
  personKey,
  type SheetKey,
  sheetKeys,
  type SheetName,
  serialColumns,
  type SourceValues,
  STATUS_NAME_COLUMN,
} from "@/lib/internal/workbook/source";
import { agreementDecisions, type InstitutionDecision, institutionDecisions, rowDecisions } from "./decisions";

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export type Workbook = {
  source_file: string;
  worksheets: Record<
    string,
    { header_excel_row: number; fields: string[]; record_count: number; records: Record<string, unknown>[] }
  >;
};

export type ExistingInstitution = { slug: string; name: string; normalizedName: string | null; countryId: string };
export type ExistingAgreement = {
  code: string;
  institutionSlug: string;
  title: string;
  type: string;
  typeLabel: string | null;
};
export type ExistingContact = {
  code: string;
  agreementCode: string;
  name: string | null;
  phone: string | null;
  email: string | null;
};

export type Existing = {
  institutions: readonly ExistingInstitution[];
  agreements: readonly ExistingAgreement[];
  contacts: readonly ExistingContact[];
  countries: ReadonlySet<string>;
};

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

export type MatchStatus = "matched" | "created" | "duplicate" | "unresolved" | "standalone";

export type SourceRow = {
  importKey: string;
  sheet: SheetKey;
  sheetName: SheetName;
  excelRow: number;
  values: SourceValues;
  formulas: Record<string, string>;
  issues: string[];
  institutionSlug: string | null;
  agreementCode: string | null;
  matchStatus: MatchStatus;
  matchNote: string | null;
};

export type NewCountry = { slug: string; name: string; iso2: string; region: string };

export type NewInstitution = {
  slug: string;
  name: string;
  normalizedName: string | null;
  countryId: string;
  excelRow: number;
  note: string;
};

export type AgreementFill = {
  startDate: string | null;
  endDate: string | null;
  recordStatus: "signed" | "terminated" | null;
};

export type AgreementDetails = {
  doicReference: string | null;
  initiationYear: number | null;
  renewalYear: number | null;
  periodText: string | null;
  expiryText: string | null;
  recordedStatus: string | null;
  qsRanking: string | null;
  theRanking: string | null;
  faculty: string | null;
  department: string | null;
  opportunities: string | null;
  programmeReference: string | null;
  remarks: string | null;
  documentUrl: string | null;
};

export type PlannedAgreement = {
  code: string;
  excelRow: number;
  institutionSlug: string;
  /** Existing agreement enriched, or a new one. */
  existing: boolean;
  reference: string;
  title: string;
  type: "mou" | "other";
  typeLabel: string | null;
  fill: AgreementFill;
  details: AgreementDetails;
  needsReview: boolean;
};

export type PlannedContact = {
  code: string;
  excelRow: number;
  institutionSlug: string;
  agreementCode: string;
  roleLabel: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
};

export type ContactFill = { code: string; excelRow: number; phone: string | null; email: string | null };

export type Plan = {
  batch: string;
  sourceFile: string;
  counts: Record<SheetKey, number>;
  rows: SourceRow[];
  countries: NewCountry[];
  institutions: NewInstitution[];
  agreements: PlannedAgreement[];
  contacts: PlannedContact[];
  contactFills: ContactFill[];
  /** Existing contacts the register repeats (same person on the same agreement). */
  contactDuplicates: { code: string; excelRow: number; existing: string }[];
  /** Proposed name matches that need a reviewed decision before import. */
  proposals: { sheet: SheetKey; excelRow: number; name: string; candidates: string[] }[];
};

export const IMPORT_BATCH = "mou-register-2026-10";

/** Countries the register needs that the portal does not have yet. */
const knownNewCountries: Record<string, NewCountry> = {
  austria: { slug: "austria", name: "Austria", iso2: "AT", region: "Europe" },
  philippines: { slug: "philippines", name: "Philippines", iso2: "PH", region: "Asia" },
};

function sheetRecords(workbook: Workbook, sheet: SheetName) {
  const worksheet = workbook.worksheets[sheet];
  if (!worksheet) throw new Error(`Worksheet missing: ${sheet}`);
  if (worksheet.records.length !== worksheet.record_count) {
    throw new Error(`${sheet}: record_count ${worksheet.record_count} but ${worksheet.records.length} records`);
  }
  return worksheet.records;
}

function splitRecord(record: Record<string, unknown>) {
  const values: SourceValues = {};
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith("_")) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === "object") throw new Error(`Unexpected nested value in ${key}`);
    values[key] = value as CellValue;
  }
  const formulas = (record._source_formulas ?? {}) as Record<string, string>;
  const excelRow = Number(record._source_excel_row);
  if (!Number.isInteger(excelRow) || excelRow < 1) throw new Error("Record without _source_excel_row");
  return { values, formulas, excelRow };
}

function formulaIssues(formulas: Record<string, string>) {
  return Object.keys(formulas)
    .filter((header) => !serialColumns.has(header))
    .map((header) => `Formula in "${header}" (${formulas[header]}); its computed value is withheld.`);
}

const OPEN_ENDED = /perpetual|until\s+cancel/i;

/** Whole years from a Period cell such as "5 years" or "3 Year"; null for "perpetual", "NA", or blank. */
function periodYears(value: CellValue | null): number | null {
  const years = Number(cellText(value)?.match(/^(\d{1,2})\s*years?$/i)?.[1]);
  return years > 0 ? years : null;
}

/**
 * The register's usual convention: an N-year MoU ends the day before the
 * N-th anniversary of signing (63 rows; 33 end on the anniversary itself).
 */
export function expiryFromPeriod(startDate: string, years: number): string {
  const [y, m, d] = startDate.split("-").map(Number);
  const anniversary = new Date(Date.UTC(y + years, m - 1, d));
  anniversary.setUTCDate(anniversary.getUTCDate() - 1);
  return anniversary.toISOString().slice(0, 10);
}

function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
}

/** `today` (YYYY-MM-DD) only decides which recorded statuses contradict their dates. */
export function buildPlan(workbook: Workbook, existing: Existing, today: string, batch = IMPORT_BATCH): Plan {
  const rows: SourceRow[] = [];
  const counts = {} as Record<SheetKey, number>;
  const proposals: Plan["proposals"] = [];

  const institutionsByKey = new Map<string, ExistingInstitution>();
  for (const institution of existing.institutions) {
    institutionsByKey.set(matchKey(institution.name), institution);
    if (institution.normalizedName) institutionsByKey.set(matchKey(institution.normalizedName), institution);
  }
  const knownSlugs = new Set(existing.institutions.map((row) => row.slug));
  const decisionsByKey = new Map(Object.entries(institutionDecisions).map(([name, decision]) => [matchKey(name), decision]));
  const newInstitutions = new Map<string, NewInstitution>();
  const newCountries = new Map<string, NewCountry>();

  function candidatesFor(key: string) {
    const words = new Set(key.split(" ").filter((word) => word.length > 3));
    return existing.institutions
      .map((row) => {
        const other = new Set(matchKey(row.normalizedName ?? row.name).split(" ").filter((word) => word.length > 3));
        const shared = [...words].filter((word) => other.has(word)).length;
        return { slug: row.slug, score: shared / Math.max(1, Math.min(words.size, other.size)) };
      })
      .filter((row) => row.score >= 0.5)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((row) => row.slug);
  }

  /** Resolves a recorded name to a university, or explains why not. */
  function resolveInstitution(
    name: string | null,
    sheet: SheetKey,
    excelRow: number,
    allowCreate: boolean,
  ): { slug: string | null; status: "matched" | "created" | "unresolved" | "standalone"; note: string } {
    if (!name) return { slug: null, status: "unresolved", note: "No university name recorded." };
    const key = matchKey(name);
    const decision: InstitutionDecision | undefined = rowDecisions[`${sheet}:${excelRow}`] ?? decisionsByKey.get(key);
    if (decision) {
      if ("national" in decision) return { slug: null, status: "standalone", note: decision.national };
      if ("heading" in decision) return { slug: null, status: "standalone", note: decision.heading };
      if ("match" in decision) {
        if (!knownSlugs.has(decision.match)) throw new Error(`Decision for "${key}" names unknown slug ${decision.match}`);
        return { slug: decision.match, status: "matched", note: `Reviewed match: ${decision.reason}` };
      }
      if ("create" in decision) {
        const slug = `wb-${slugify(decision.create.name)}`;
        if (!allowCreate && !newInstitutions.has(slug)) {
          return { slug: null, status: "unresolved", note: "University is only created from the MoU list sheet." };
        }
        if (!newInstitutions.has(slug)) {
          const country = decision.create.country;
          if (!existing.countries.has(country)) {
            const known = knownNewCountries[country];
            if (!known) throw new Error(`Unknown country ${country} for "${key}"`);
            newCountries.set(country, known);
          }
          newInstitutions.set(slug, {
            slug,
            name: decision.create.name,
            normalizedName: decision.create.normalizedName ?? null,
            countryId: country,
            excelRow,
            note: `Added from the DoIC MoU register (${workbook.source_file}, MoU list row ${excelRow}); not listed on the official partner page. ${decision.reason}`,
          });
        }
        return { slug, status: "created", note: `New university: ${decision.reason}` };
      }
      return { slug: null, status: "unresolved", note: decision.unresolved };
    }
    const exact = institutionsByKey.get(key);
    if (exact) return { slug: exact.slug, status: "matched", note: "Exact name match." };
    proposals.push({ sheet, excelRow, name, candidates: candidatesFor(key) });
    return { slug: null, status: "unresolved", note: "No exact match and no reviewed decision." };
  }

  // -------------------------------------------------------------------------
  // MoU list
  // -------------------------------------------------------------------------

  const listRecords = sheetRecords(workbook, "MoU list");
  counts["mou-list"] = listRecords.length;
  const agreements: PlannedAgreement[] = [];
  const contacts: PlannedContact[] = [];
  const contactFills: ContactFill[] = [];
  const contactDuplicates: Plan["contactDuplicates"] = [];
  const seenReferences = new Map<string, number>();
  const duplicates = new Map<number, number>();
  const listRowsByInstitution = new Map<string, { excelRow: number; values: SourceValues; shifted: boolean }[]>();
  const listRowInfo = new Map<number, { values: SourceValues; formulas: Record<string, string>; shifted: boolean; issues: string[] }>();

  for (const record of listRecords) {
    const { values, formulas, excelRow } = splitRecord(record);
    const issues = formulaIssues(formulas);
    const shifted = hasShiftedColumns(values);
    if (shifted) {
      issues.push(
        "Columns after Expiry are shifted (the status column holds a person's name). Only reference, name, year, period, signing and expiry are used; the rest needs manual review.",
      );
    }
    const name = cellText(values[mouList.name] ?? null);
    const reference = cellText(values[mouList.reference] ?? null);
    const row: SourceRow = {
      importKey: `mou-list:${excelRow}`,
      sheet: "mou-list",
      sheetName: "MoU list",
      excelRow,
      values,
      formulas,
      issues,
      institutionSlug: null,
      agreementCode: null,
      matchStatus: "unresolved",
      matchNote: null,
    };
    rows.push(row);

    const duplicateOf = reference ? seenReferences.get(reference) : undefined;
    if (reference && duplicateOf !== undefined) {
      duplicates.set(excelRow, duplicateOf);
      row.matchStatus = "duplicate";
      row.matchNote = `Repeats MoU list row ${duplicateOf} (same DoIC reference). Not imported again.`;
      const first = listRowInfo.get(duplicateOf);
      if (first) {
        const differing = Object.keys({ ...first.values, ...values }).filter(
          (header) => !serialColumns.has(header) && String(first.values[header] ?? "") !== String(values[header] ?? ""),
        );
        if (differing.length > 0) {
          issues.push(`Differs from row ${duplicateOf} in: ${differing.join(", ")}. Review which is correct.`);
        }
      }
      continue;
    }
    if (reference) seenReferences.set(reference, excelRow);
    listRowInfo.set(excelRow, { values, formulas, shifted, issues });

    const resolved = resolveInstitution(name, "mou-list", excelRow, true);
    row.institutionSlug = resolved.slug;
    row.matchStatus = resolved.status;
    row.matchNote = resolved.note;
    if (!resolved.slug) continue;
    const list = listRowsByInstitution.get(resolved.slug) ?? [];
    list.push({ excelRow, values, shifted });
    listRowsByInstitution.set(resolved.slug, list);
  }

  // Agreement matching per university.
  const existingByInstitution = new Map<string, ExistingAgreement[]>();
  for (const agreement of existing.agreements) {
    const list = existingByInstitution.get(agreement.institutionSlug) ?? [];
    list.push(agreement);
    existingByInstitution.set(agreement.institutionSlug, list);
  }
  const contactByAgreement = new Map(existing.contacts.map((contact) => [contact.agreementCode, contact]));

  function referenceKind(reference: string | null): "MoU" | "MoA" | null {
    if (!reference) return null;
    const tokens = reference.split("/").map((token) => token.trim().toLowerCase());
    if (tokens.slice(0, 2).includes("moa")) return "MoA";
    if (tokens.slice(0, 2).includes("mou")) return "MoU";
    return null;
  }

  function officerKeys(values: SourceValues) {
    return new Set(
      [values[mouList.nodal], values[mouList.revisedNodal]]
        .map((value) => meaningful(value ?? null))
        .filter((value): value is string => value !== null)
        .map(personKey),
    );
  }

  function score(values: SourceValues, shifted: boolean, agreement: ExistingAgreement) {
    let total = 0;
    const name = cellText(values[mouList.name] ?? null);
    if (name && matchKey(name) === matchKey(agreement.title)) total += 4;
    const contact = contactByAgreement.get(agreement.code);
    if (contact && !shifted) {
      const emails = parseEmails(values[mouList.nodalEmail] ?? null).emails;
      if (contact.email && emails.includes(contact.email.toLowerCase())) total += 3;
      if (contact.name && officerKeys(values).has(personKey(contact.name))) total += 2;
    }
    const kind = referenceKind(cellText(values[mouList.reference] ?? null));
    const agreementIsMoU = agreement.type === "mou";
    const agreementIsOther = agreement.type !== "mou" && agreement.type !== "not-stated";
    if ((kind === "MoU" && agreementIsMoU) || (kind === "MoA" && agreementIsOther)) total += 1;
    return total;
  }

  const matchedExisting = new Set<string>();
  for (const [slug, listRows] of listRowsByInstitution) {
    const candidates = [...(existingByInstitution.get(slug) ?? [])];
    const assignment = new Map<number, string>();
    // Reviewed agreement decisions first.
    for (const entry of listRows) {
      const decision = agreementDecisions[entry.excelRow];
      if (decision && decision !== "new") assignment.set(entry.excelRow, decision);
    }
    const free = () => candidates.filter((agreement) => ![...assignment.values()].includes(agreement.code));
    const open = () =>
      listRows.filter((entry) => !assignment.has(entry.excelRow) && agreementDecisions[entry.excelRow] !== "new");
    if (open().length === 1 && free().length === 1) {
      assignment.set(open()[0].excelRow, free()[0].code);
    } else {
      const pairs = open()
        .flatMap((entry) => free().map((agreement) => ({ entry, agreement, score: score(entry.values, entry.shifted, agreement) })))
        .filter((pair) => pair.score >= 2)
        .sort((a, b) => b.score - a.score);
      for (const pair of pairs) {
        if (assignment.has(pair.entry.excelRow) || [...assignment.values()].includes(pair.agreement.code)) continue;
        const rivals = pairs.filter(
          (other) =>
            other !== pair &&
            other.score === pair.score &&
            (other.entry === pair.entry || other.agreement === pair.agreement) &&
            !assignment.has(other.entry.excelRow) &&
            ![...assignment.values()].includes(other.agreement.code),
        );
        if (rivals.length === 0) assignment.set(pair.entry.excelRow, pair.agreement.code);
      }
    }

    for (const entry of listRows) {
      const info = listRowInfo.get(entry.excelRow);
      const row = rows.find((candidate) => candidate.importKey === `mou-list:${entry.excelRow}`);
      if (!info || !row) continue;
      const matchedCode = assignment.get(entry.excelRow) ?? null;
      const planned = planAgreement(entry.excelRow, slug, info.values, info.shifted, info.issues, matchedCode);
      agreements.push(planned);
      row.agreementCode = planned.code;
      if (matchedCode) {
        matchedExisting.add(matchedCode);
        row.matchNote = `${row.matchNote} Agreement ${matchedCode} (existing official row).`;
      } else {
        const why =
          agreementDecisions[entry.excelRow] === "new"
            ? "Reviewed: a separate agreement."
            : candidates.length === 0
              ? "The university had no agreement recorded."
              : `Could not be paired with an existing row (${candidates.map((c) => c.code).join(", ")}) by nodal officer or type, so it is recorded as its own agreement.`;
        row.matchNote = `${row.matchNote} New agreement ${planned.code}. ${why}`;
        if (candidates.length > 0 && agreementDecisions[entry.excelRow] !== "new") {
          info.issues.push(`Check whether this is one of the existing rows ${candidates.map((c) => c.code).join(", ")}.`);
          planned.needsReview = true;
        }
      }
      planContacts(entry.excelRow, slug, planned.code, info.values, info.shifted, info.issues, matchedCode);
    }
  }

  function planAgreement(
    excelRow: number,
    slug: string,
    values: SourceValues,
    shifted: boolean,
    issues: string[],
    matchedCode: string | null,
  ): PlannedAgreement {
    const get = (header: string) => {
      if (shifted && !fieldsBeforeShift.includes(header)) return null;
      return values[header] ?? null;
    };
    const reference = cellText(get(mouList.reference));
    const signing = get(mouList.signing);
    const expiry = get(mouList.expiry);
    const startDate = parseSourceDate(signing);
    let endDate = parseSourceDate(expiry);
    if (signing !== null && startDate === null && !isPlaceholder(signing)) {
      issues.push(`Signing date "${cellText(signing)}" is not a date.`);
    }
    if (startDate && endDate && endDate < startDate) {
      issues.push(`Expiry ${endDate} is before signing ${startDate}; the expiry is not used as a date.`);
      endDate = null;
    }
    let expiryNote: string | null = null;
    const years = periodYears(get(mouList.period));
    if (!endDate && startDate && years && !OPEN_ENDED.test(cellText(expiry) ?? "")) {
      endDate = expiryFromPeriod(startDate, years);
      expiryNote = `Calculated: signed ${startDate} + ${years}-year period`;
      issues.push(`Expiry ${endDate} calculated from signing ${startDate} and the ${years}-year period.`);
    }
    const status = parseStatus(get(mouList.status));
    const statusText = cellText(get(mouList.status));
    if (statusText && !status && !shifted) issues.push(`Status "${statusText}" is not Active, Expired, or Closed.`);
    const kind = referenceKind(reference);
    let stored: AgreementFill["recordStatus"] = null;
    if (status === "active") stored = "signed";
    if (status === "closed") stored = "terminated";
    if (status === "expired") {
      if (endDate) stored = "signed";
      else issues.push('Recorded "Expired" without an expiry date, so the stored status stays "not stated".');
    }
    if (status && startDate) {
      const lapsed = endDate !== null && endDate < today;
      if (status === "active" && lapsed) issues.push(`Recorded "Active" but the expiry ${endDate} has passed.`);
      if (status === "expired" && endDate && !lapsed) issues.push(`Recorded "Expired" but the expiry ${endDate} is still ahead.`);
    }
    const programme = cellText(get(mouList.programme));
    const year = get(mouList.year);
    const renewal = get(mouList.renewalYear);
    if (renewal !== null && parseYear(renewal) === null && !shifted && !isPlaceholder(renewal)) {
      issues.push(`Renewal year "${cellText(renewal)}" is not a year.`);
    }
    return {
      code: matchedCode ?? `wb-mou-list-${excelRow}`,
      excelRow,
      institutionSlug: slug,
      existing: matchedCode !== null,
      reference: reference ?? `DOIC-REGISTER-${excelRow}`,
      title: cellText(values[mouList.name] ?? null) ?? reference ?? `MoU list row ${excelRow}`,
      type: kind === "MoA" ? "other" : "mou",
      typeLabel: kind,
      fill: { startDate, endDate, recordStatus: stored },
      details: {
        doicReference: reference,
        initiationYear: parseYear(year),
        renewalYear: parseYear(renewal),
        periodText: cellText(get(mouList.period)),
        expiryText: expiryNote ?? (expiry !== null && parseSourceDate(expiry) === null ? cellText(expiry) : null),
        recordedStatus: statusText,
        // Workbook QS values predate QS 2027; the portal reads ranks from qs-rankings-2027.ts.
        qsRanking: null,
        theRanking: cellText(get(mouList.the)),
        faculty: cellText(get(mouList.faculty)),
        department: cellText(get(mouList.department)),
        opportunities: cellText(get(mouList.opportunities)),
        programmeReference: programme,
        remarks: cellText(get(mouList.remarks)),
        documentUrl: null,
      },
      needsReview: issues.length > 0,
    };
  }

  function planContacts(
    excelRow: number,
    slug: string,
    agreementCode: string,
    values: SourceValues,
    shifted: boolean,
    issues: string[],
    matchedCode: string | null,
  ) {
    if (shifted) return;
    const formulaHeaders = new Set(Object.keys(listRowInfo.get(excelRow)?.formulas ?? {}));
    const read = (header: string) => (formulaHeaders.has(header) ? null : (values[header] ?? null));
    const original = meaningful(read(mouList.nodal));
    const revised = meaningful(read(mouList.revisedNodal));
    const current = revised ?? original;
    const emails = parseEmails(read(mouList.nodalEmail));
    const phone = parsePhone(read(mouList.nodalPhone));
    if (formulaHeaders.has(mouList.nodalPhone) || formulaHeaders.has(mouList.nodalEmail)) {
      issues.push("The nodal officer's contact cell held a formula; that value is withheld. Confirm the number with DoIC.");
    }
    if (phone.kind === "withheld") issues.push(`Nodal officer contact number withheld: ${phone.reason}.`);
    if (emails.invalid) issues.push(`Nodal officer email cell is not only valid addresses: "${emails.invalid}".`);

    const notes: string[] = [];
    if (emails.emails.length > 1) notes.push(`Also recorded: ${emails.emails.slice(1).join(", ")}`);
    if (emails.invalid) notes.push(`Email cell as recorded: ${emails.invalid}`);
    if (phone.kind === "note") notes.push(`Contact as recorded: ${phone.note}`);

    const doic = {
      name: current,
      phone: phone.kind === "phone" ? phone.phone : null,
      email: emails.emails[0] ?? null,
      note: notes.length > 0 ? notes.join(" · ") : null,
    };
    const existingContact = matchedCode ? contactByAgreement.get(matchedCode) : undefined;
    const samePerson =
      existingContact &&
      ((doic.email && existingContact.email?.toLowerCase() === doic.email) ||
        (doic.name && existingContact.name && personKey(existingContact.name) === personKey(doic.name)));
    if (existingContact && samePerson) {
      contactDuplicates.push({ code: existingContact.code, excelRow, existing: existingContact.name ?? "" });
      if ((!existingContact.phone && doic.phone) || (!existingContact.email && doic.email)) {
        contactFills.push({
          code: existingContact.code,
          excelRow,
          phone: existingContact.phone ? null : doic.phone,
          email: existingContact.email ? null : doic.email,
        });
      }
    } else if (doic.name || doic.phone || doic.email) {
      contacts.push({
        code: `wb-${excelRow}-doic`,
        excelRow,
        institutionSlug: slug,
        agreementCode,
        roleLabel: "MUJ Nodal Officer",
        ...doic,
      });
    }

    if (original && revised && personKey(original) !== personKey(revised)) {
      contacts.push({
        code: `wb-${excelRow}-earlier`,
        excelRow,
        institutionSlug: slug,
        agreementCode,
        roleLabel: "MUJ Nodal Officer (earlier)",
        name: original,
        phone: null,
        email: null,
        note: "Listed as the nodal officer before the revision recorded in the register.",
      });
    }

    const partner = meaningful(read(mouList.partner));
    const partnerEmails = parseEmails(read(mouList.partnerEmail));
    const partnerPhone = parsePhone(read(mouList.partnerPhone));
    if (formulaHeaders.has(mouList.partnerPhone) || formulaHeaders.has(mouList.partnerEmail)) {
      issues.push("The partner nodal officer's contact cell held a formula; that value is withheld.");
    }
    if (partnerPhone.kind === "withheld") issues.push(`Partner contact number withheld: ${partnerPhone.reason}.`);
    if (partnerEmails.invalid) issues.push(`Partner email cell is not only valid addresses: "${partnerEmails.invalid}".`);
    const partnerNotes: string[] = [];
    if (partnerEmails.emails.length > 1) partnerNotes.push(`Also recorded: ${partnerEmails.emails.slice(1).join(", ")}`);
    if (partnerEmails.invalid) partnerNotes.push(`Email cell as recorded: ${partnerEmails.invalid}`);
    if (partnerPhone.kind === "note") partnerNotes.push(`Contact as recorded: ${partnerPhone.note}`);
    const partnerContact = {
      name: partner,
      phone: partnerPhone.kind === "phone" ? partnerPhone.phone : null,
      email: partnerEmails.emails[0] ?? null,
      note: partnerNotes.length > 0 ? partnerNotes.join(" · ") : null,
    };
    if (partnerContact.name || partnerContact.phone || partnerContact.email) {
      contacts.push({
        code: `wb-${excelRow}-partner`,
        excelRow,
        institutionSlug: slug,
        agreementCode,
        roleLabel: "Partner Nodal Officer",
        ...partnerContact,
      });
    }
  }

  for (const [excelRow, firstRow] of duplicates) {
    const row = rows.find((candidate) => candidate.importKey === `mou-list:${excelRow}`);
    const first = rows.find((candidate) => candidate.importKey === `mou-list:${firstRow}`);
    if (row && first) {
      row.institutionSlug = first.institutionSlug;
      row.agreementCode = first.agreementCode;
    }
  }

  const agreementsByInstitution = new Map<string, PlannedAgreement[]>();
  for (const agreement of agreements) {
    const list = agreementsByInstitution.get(agreement.institutionSlug) ?? [];
    list.push(agreement);
    agreementsByInstitution.set(agreement.institutionSlug, list);
  }
  /** All agreements a university will have after the import. */
  function agreementCodesFor(slug: string) {
    const codes = new Set((existingByInstitution.get(slug) ?? []).map((agreement) => agreement.code));
    for (const agreement of agreementsByInstitution.get(slug) ?? []) codes.add(agreement.code);
    return [...codes];
  }

  // -------------------------------------------------------------------------
  // Other sheets
  // -------------------------------------------------------------------------

  function linkSheet(
    sheetName: SheetName,
    nameHeader: string,
    pickAgreement: (slug: string, values: SourceValues) => { code: string | null; note: string },
  ) {
    const sheet = sheetKeys[sheetName];
    const records = sheetRecords(workbook, sheetName);
    counts[sheet] = records.length;
    for (const record of records) {
      const { values, formulas, excelRow } = splitRecord(record);
      const issues = formulaIssues(formulas);
      const name = cellText(values[nameHeader] ?? null);
      const resolved = resolveInstitution(name, sheet, excelRow, false);
      const row: SourceRow = {
        importKey: `${sheet}:${excelRow}`,
        sheet,
        sheetName,
        excelRow,
        values,
        formulas,
        issues,
        institutionSlug: resolved.slug,
        agreementCode: null,
        matchStatus: resolved.status === "created" ? "matched" : resolved.status,
        matchNote: resolved.note,
      };
      if (resolved.slug) {
        const picked = pickAgreement(resolved.slug, values);
        row.agreementCode = picked.code;
        row.matchNote = `${resolved.note} ${picked.note}`;
      }
      rows.push(row);
    }
  }

  function onlyAgreement(slug: string) {
    const codes = agreementCodesFor(slug);
    return codes.length === 1
      ? { code: codes[0], note: `Linked to the university's only agreement, ${codes[0]}.` }
      : {
          code: null,
          note:
            codes.length === 0
              ? "The university has no agreement recorded; kept at university level."
              : `The university has ${codes.length} agreements and the row does not say which; kept at university level.`,
        };
  }

  function bySigningDate(slug: string, date: string | null) {
    if (date) {
      const sameDate = (agreementsByInstitution.get(slug) ?? []).filter((agreement) => agreement.fill.startDate === date);
      if (sameDate.length === 1) {
        return { code: sameDate[0].code, note: `Linked to ${sameDate[0].code}, signed the same day (${date}).` };
      }
    }
    return onlyAgreement(slug);
  }

  linkSheet("MoU link", "Name of University/Organization", (slug) => onlyAgreement(slug));
  linkSheet("Renewal", "Name of University/Organization", (slug, values) =>
    bySigningDate(slug, parseSourceDate(values["Signing DDMMYYYY"] ?? null)),
  );
  linkSheet("MoU Status", STATUS_NAME_COLUMN, (slug, values) =>
    bySigningDate(slug, parseSourceDate(values["MoU signing Sunita"] ?? null)),
  );

  // The MoU Status header row holds a university name in column B.
  const statusSheet = workbook.worksheets["MoU Status"];
  rows.push({
    importKey: `mou-status:${statusSheet.header_excel_row}`,
    sheet: "mou-status",
    sheetName: "MoU Status",
    excelRow: statusSheet.header_excel_row,
    values: { [STATUS_NAME_COLUMN]: STATUS_NAME_COLUMN },
    formulas: {},
    issues: [
      "The header cell of column B holds a university name instead of a column title, so this row's workflow values (if any) were overwritten by headers. Confirm with DoIC.",
    ],
    institutionSlug: null,
    agreementCode: null,
    matchStatus: "standalone",
    matchNote: "Header row: Maharashtra National Law University (MNLU) is a national collaboration (National MoUs row 22), not an international university.",
  });

  // MoU links attach to an agreement's details when the agreement is certain.
  for (const row of rows) {
    if (row.sheet !== "mou-link" || !row.agreementCode) continue;
    const url = cellText(row.values["MoU Link"] ?? null);
    const agreement = agreements.find((candidate) => candidate.code === row.agreementCode);
    if (!url || !/^https:\/\/\S+$/.test(url)) {
      if (url) row.issues.push(`"${url}" is not an https link.`);
      continue;
    }
    if (agreement && !agreement.details.documentUrl) agreement.details.documentUrl = url;
  }

  // National MoUs: standalone records (Indian partners are not in the international directory).
  const national = sheetRecords(workbook, "National MoUs");
  counts["national-mous"] = national.length;
  for (const record of national) {
    const { values, formulas, excelRow } = splitRecord(record);
    rows.push({
      importKey: `national-mous:${excelRow}`,
      sheet: "national-mous",
      sheetName: "National MoUs",
      excelRow,
      values,
      formulas,
      issues: formulaIssues(formulas),
      institutionSlug: null,
      agreementCode: null,
      matchStatus: "standalone",
      matchNote: "National collaboration; listed on its own page.",
    });
  }

  rows.sort((a, b) => a.sheet.localeCompare(b.sheet) || a.excelRow - b.excelRow);
  return {
    batch,
    sourceFile: workbook.source_file,
    counts,
    rows,
    countries: [...newCountries.values()],
    institutions: [...newInstitutions.values()],
    agreements,
    contacts,
    contactFills,
    contactDuplicates,
    proposals,
  };
}

/** Existing official agreements no register row maps to (left untouched). */
export function untouchedAgreements(plan: Plan, existing: Existing) {
  const used = new Set(plan.agreements.filter((agreement) => agreement.existing).map((agreement) => agreement.code));
  return existing.agreements.filter((agreement) => !used.has(agreement.code));
}
