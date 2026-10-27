/**
 * DoIC MoU register ("0_MoU details.xlsx"): worksheet layout and the rules for
 * reading its cells. Shared by the import script and the portal pages, so a
 * value is interpreted the same way everywhere.
 *
 * Normalisation rules (also printed in the import report):
 *  1. A blank cell is "not recorded". It is never shown as "NA" or "None".
 *  2. Placeholder text ("NA", "N/A", "None", "Nil", "-", "Not recorded") is
 *     kept exactly as written and shown as written. It never fills a typed
 *     field, and different placeholders are not merged.
 *  3. Formula cells: serial-number columns are ignored. Any other formula's
 *     computed value is withheld (never shown or typed) and flagged, because
 *     it is formula output rather than the value staff meant to record.
 *  4. Dates: ISO dates are accepted; "DD/MM/YYYY" text is read day-first (the
 *     column header says DDMMYYYY); anything else stays text only. An expiry
 *     before the signing date is not typed and is flagged.
 *  5. Status: "Active", "Expired", "Closed" (any case) are recognised;
 *     anything else is flagged and left untyped.
 *  6. Phone numbers: whole numbers and phone-shaped text are typed; other text
 *     is kept as a note; negative or fractional numbers are formula output
 *     and withheld.
 *  7. Emails: a cell may list several addresses; each valid address is kept,
 *     and invalid text is flagged and kept as a note.
 *  8. A row whose status column holds a person's name while a ranking column
 *     holds a status has shifted columns. Only the fields before the shift
 *     (reference, name, year, period, signing, expiry) are used; the rest stay
 *     in the source row for review.
 */

export const WORKBOOK_FILE = "0_MoU details.xlsx";

export const sheetKeys = {
  "MoU Status": "mou-status",
  "MoU list": "mou-list",
  "MoU link": "mou-link",
  "National MoUs": "national-mous",
  Renewal: "renewal",
} as const;

export type SheetName = keyof typeof sheetKeys;
export type SheetKey = (typeof sheetKeys)[SheetName];

export const sheetLabels: Record<SheetKey, string> = {
  "mou-status": "MoU Status",
  "mou-list": "MoU list",
  "mou-link": "MoU link",
  "national-mous": "National MoUs",
  renewal: "Renewal",
};

export type CellValue = string | number | boolean | null;
export type SourceValues = Record<string, CellValue>;

/** Exact column headers from the extraction. */
export const mouList = {
  serial: "Sr. No",
  combinedSerial: "MoU+MoA",
  universitySerial: "Univ",
  reference: "MoU refrence No DoIC/MoU or MoA/Country code/university keyword/Year of initiation_renew year/Sr.no._Sr.no.",
  name: "Name of University/Organization",
  year: "Year",
  period: "Period",
  signing: "Signing DDMMYYYY",
  expiry: "Expiry",
  renewalYear: "Renewal Year",
  qs: "QS Ranking",
  the: "THE Ranking",
  status: "Status (Active/Expired/Closed)",
  nodal: "Nodal Officers",
  revisedNodal: "Revised Nodal Offiicer",
  faculty: "Faculty",
  department: "Department",
  nodalEmail: "Email ID of Nodal Officer/s",
  nodalPhone: "Contact no. of Nodal Officer/s",
  opportunities: "Opportunities mentioned in MoU",
  partner: "Partner Nodal Officer",
  partnerEmail: "Email ID of Partner Nodal Officer",
  partnerPhone: "Contact no. of Partner Nodal Officer",
  country: "Country",
  continent: "Continent",
  programme: "Summer School or similar program",
  remarks: "Remarks",
} as const;

/** Column B's header cell holds a university name instead of a header. */
export const STATUS_NAME_COLUMN = "Maharashtra National Law University’ (MNLU), Mumbai.";

/** Display labels for column headers; unlisted headers show as recorded. */
export const fieldLabels: Record<string, string> = {
  [mouList.reference]: "DoIC reference",
  [mouList.name]: "University / organisation",
  [mouList.year]: "Year of initiation",
  [mouList.period]: "Period",
  [mouList.signing]: "Signing date",
  [mouList.expiry]: "Expiry",
  [mouList.renewalYear]: "Renewal year",
  [mouList.qs]: "QS ranking",
  [mouList.the]: "THE ranking",
  [mouList.status]: "Recorded status",
  [mouList.nodal]: "DoIC nodal officer(s)",
  [mouList.revisedNodal]: "Revised DoIC nodal officer",
  [mouList.faculty]: "Faculty",
  [mouList.department]: "Department",
  [mouList.nodalEmail]: "Nodal officer email",
  [mouList.nodalPhone]: "Nodal officer contact number",
  [mouList.opportunities]: "Opportunities mentioned in the MoU",
  [mouList.partner]: "Partner nodal officer",
  [mouList.partnerEmail]: "Partner nodal officer email",
  [mouList.partnerPhone]: "Partner nodal officer contact number",
  [mouList.country]: "Country",
  [mouList.continent]: "Continent",
  [mouList.programme]: "Summer school or similar programme",
  [mouList.remarks]: "Remarks",
  Column_AB: "Unlabelled column AB",
  [STATUS_NAME_COLUMN]: "University / organisation",
  "Nodal officer Contact number Sunita": "Nodal officer and contact number",
  "QS Ranking Sunita": "QS ranking",
  "File process Sunita": "File processing started",
  "Comments confirmed by Partner Mohit Jain": "Comments confirmed by partner",
  "Legal sign Sunita": "Legal sign-off",
  "Asst. Reg. sign Sunita": "Assistant Registrar sign-off",
  "Submitted to Finance Sunita": "Submitted to Finance",
  "Registrar sign Sunita": "Registrar sign-off",
  "Pro-Pres. Sign Sunita": "Pro-President sign-off",
  "President sign Sunita": "President sign-off",
  "MoU signing Sunita": "MoU signed",
  Photos: "Photos",
  "Share on exchadmin": "Shared on exchadmin",
  "Share on social media": "Shared on social media",
  "scan copy kept with DoIC": "Scanned copy with DoIC",
  "word file with DoIC": "Word file with DoIC",
  "Report with DoIC": "Report with DoIC",
  "MoU Link": "MoU link",
  "National Collaborations": "National collaboration",
  Column_D: "Unlabelled column D",
  Column_E: "Unlabelled column E",
  Column_F: "Unlabelled column F",
  Column_G: "Unlabelled column G",
  Column_H: "Unlabelled column H",
};

/** Serial-number columns: bookkeeping, never shown as data. */
export const serialColumns: ReadonlySet<string> = new Set([
  "Sr. No",
  "Sr no.",
  "Sr No",
  "Srl No",
  "MoU+MoA",
  "Univ",
]);

/** Columns the MoU Status sheet records as workflow milestones, in order. */
export const workflowColumns = [
  "File process Sunita",
  "Comments confirmed by Partner Mohit Jain",
  "Legal sign Sunita",
  "Asst. Reg. sign Sunita",
  "Submitted to Finance Sunita",
  "Registrar sign Sunita",
  "Pro-Pres. Sign Sunita",
  "President sign Sunita",
  "MoU signing Sunita",
  "Photos",
  "Share on exchadmin",
  "Share on social media",
  "scan copy kept with DoIC",
  "word file with DoIC",
  "Report with DoIC",
] as const;

export function fieldLabel(header: string) {
  return fieldLabels[header] ?? header;
}

// ---------------------------------------------------------------------------
// Cell rules
// ---------------------------------------------------------------------------

const PLACEHOLDERS = new Set(["na", "n/a", "n.a.", "none", "nil", "-", "--", "not recorded", "not applicable"]);

/** The cell holds placeholder text (rule 2). */
export function isPlaceholder(value: CellValue): boolean {
  return typeof value === "string" && PLACEHOLDERS.has(value.trim().toLowerCase());
}

/** Trimmed text with internal whitespace collapsed; null for blank cells. */
export function cellText(value: CellValue): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text === "" ? null : text;
}

/** Text usable for a typed field: not blank, not a placeholder. */
export function meaningful(value: CellValue): string | null {
  if (isPlaceholder(value)) return null;
  return cellText(value);
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_FIRST = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;

function validDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Rule 4. Returns an ISO date or null. */
export function parseSourceDate(value: CellValue): string | null {
  const text = cellText(value);
  if (!text) return null;
  let match = ISO_DATE.exec(text);
  if (match) {
    const [, y, m, d] = match.map(Number);
    return validDate(y, m, d) ? text : null;
  }
  match = DAY_FIRST.exec(text);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (!validDate(year, month, day)) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return null;
}

export function parseYear(value: CellValue): number | null {
  const text = cellText(value);
  if (!text || !/^\d{4}$/.test(text)) return null;
  const year = Number(text);
  return year >= 1950 && year <= 2100 ? year : null;
}

export type RecordedStatus = "active" | "expired" | "closed";

/** Rule 5. */
export function parseStatus(value: CellValue): RecordedStatus | null {
  const text = cellText(value)?.toLowerCase();
  return text === "active" || text === "expired" || text === "closed" ? text : null;
}

/** Same shape the institution_contacts.phone check accepts. */
export const PHONE_PATTERN = /^[0-9+() ,./-]{6,60}$/;

export type ParsedPhone =
  | { kind: "phone"; phone: string }
  | { kind: "note"; note: string }
  | { kind: "withheld"; reason: string }
  | { kind: "none" };

/** Rule 6. */
export function parsePhone(value: CellValue): ParsedPhone {
  if (value === null || value === undefined || isPlaceholder(value)) return { kind: "none" };
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 0) {
      return { kind: "withheld", reason: "the cell holds formula output, not a phone number" };
    }
    return { kind: "phone", phone: String(value) };
  }
  const text = cellText(value);
  if (!text) return { kind: "none" };
  if (PHONE_PATTERN.test(text) && (text.match(/\d/g)?.length ?? 0) >= 6) return { kind: "phone", phone: text };
  return { kind: "note", note: text };
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;

/** Rule 7. */
export function parseEmails(value: CellValue): { emails: string[]; invalid: string | null } {
  const text = cellText(value);
  if (!text || isPlaceholder(value)) return { emails: [], invalid: null };
  const tokens = text.split(/[\s,;/]+|\band\b/i).filter(Boolean);
  const emails = tokens.filter((token) => EMAIL.test(token)).map((token) => token.toLowerCase());
  const rest = tokens.filter((token) => !EMAIL.test(token));
  return { emails: [...new Set(emails)], invalid: rest.length > 0 ? text : null };
}

/** Rule 8: the status column holds something else while a ranking column holds a status. */
export function hasShiftedColumns(values: SourceValues): boolean {
  const status = values[mouList.status];
  if (status === undefined || status === null || parseStatus(status) !== null) return false;
  return parseStatus(values[mouList.the] ?? null) !== null || parseStatus(values[mouList.qs] ?? null) !== null;
}

/** Fields read from a shifted row; everything after them is unreliable. */
export const fieldsBeforeShift: readonly string[] = [
  mouList.reference,
  mouList.name,
  mouList.year,
  mouList.period,
  mouList.signing,
  mouList.expiry,
];

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------

/** Drops the register's "a. " / "b. " list markers and an "MoA- " prefix. */
export function stripListMarker(name: string) {
  return name.replace(/^\s*(?:[a-z]\.\s+|moa\s*-\s*)/i, "").trim();
}

/** Lower-case, accent-free, punctuation-free form for exact matching. */
export function matchKey(name: string) {
  return stripListMarker(name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’'`‘]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const HONORIFICS = /^(dr|prof|professor|mr|mrs|ms|miss|shri|smt)\.?\s+/i;

/** Person-name key: honorifics, punctuation, and case removed. */
export function personKey(name: string) {
  let text = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();
  while (HONORIFICS.test(text)) text = text.replace(HONORIFICS, "");
  return text
    .toLowerCase()
    .replace(/,?\s*phd\b/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

export type DisplayCell =
  | { kind: "value"; text: string }
  | { kind: "placeholder"; text: string }
  | { kind: "withheld" };

/** Workbook QS columns predate QS World University Rankings 2027; the portal shows only the 2027 rank. */
export const supersededColumns: ReadonlySet<string> = new Set([mouList.qs, "QS Ranking Sunita"]);

/** How a source cell is shown (rules 1–3). Null: not recorded. */
export function displayCell(header: string, values: SourceValues, formulas: Record<string, string>): DisplayCell | null {
  if (supersededColumns.has(header)) return null;
  const value = values[header];
  if (header in formulas && !serialColumns.has(header)) return { kind: "withheld" };
  if (value === null || value === undefined) return null;
  if (isPlaceholder(value)) return { kind: "placeholder", text: String(value).trim() };
  const text = typeof value === "string" ? value.trim() : String(value);
  return text === "" ? null : { kind: "value", text };
}

/** Headers to show for a source row: recorded, not serial, not internal keys. */
export function displayHeaders(values: SourceValues, formulas: Record<string, string>) {
  const headers = new Set([...Object.keys(values), ...Object.keys(formulas)]);
  return [...headers].filter(
    (header) => !serialColumns.has(header) && !supersededColumns.has(header) && !header.startsWith("_"),
  );
}
