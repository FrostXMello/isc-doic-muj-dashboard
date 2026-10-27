/**
 * Exports the non-personal part of the DoIC MoU register plan to
 * src/lib/internal/data/register-snapshot.json, which the portal overlays on
 * its dataset until the register import has run on the database.
 *
 *   npm run db:mou:snapshot
 *
 * Contains dates, statuses, faculty, department, scope, programme notes, and
 * the register's source rows without their personal columns. Nodal officers,
 * contact details, and remarks stay in data/private/ and the import SQL.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { todayISO } from "@/lib/internal/dates";
import { type CellValue, fieldsBeforeShift, hasShiftedColumns, mouList } from "@/lib/internal/workbook/source";
import { loadExisting } from "./mou-workbook/existing";
import { buildPlan, type Workbook } from "./mou-workbook/plan";

const PERSONAL_TEXT = /[\w.+-]+@[\w-]+\.[\w.]+|\b(dr|prof|mr|mrs|ms)\.?\s+[A-Z]/i;
const PHONE = /^\+?[\d\s()-]{10,}$/;
const looksPersonal = (value: string) =>
  PERSONAL_TEXT.test(value) || (PHONE.test(value.trim()) && (value.match(/\d/g) ?? []).length >= 10);

const workbook = JSON.parse(readFileSync("data/private/mou_details_structured.json", "utf8")) as Workbook;
const plan = buildPlan(workbook, loadExisting(), todayISO());

const flagged: string[] = [];
const clean = (code: string, field: string, value: string | null) => {
  if (value && looksPersonal(value)) {
    flagged.push(`${code} ${field}: ${value.slice(0, 80)}`);
    return null;
  }
  return value;
};

/** Columns that name or reach a person; never exported. */
const PERSONAL_COLUMNS = new Set<string>([
  mouList.nodal,
  mouList.revisedNodal,
  mouList.nodalEmail,
  mouList.nodalPhone,
  mouList.partner,
  mouList.partnerEmail,
  mouList.partnerPhone,
  mouList.remarks,
  "Nodal officer Contact number Sunita",
]);

const rows = plan.rows
  .filter((row) => row.institutionSlug && row.sheet !== "national-mous")
  .map((row) => {
    const values: Record<string, CellValue> = {};
    const shifted = row.sheet === "mou-list" && hasShiftedColumns(row.values);
    for (const [header, value] of Object.entries(row.values)) {
      if (PERSONAL_COLUMNS.has(header)) continue;
      if (shifted && !fieldsBeforeShift.includes(header)) continue;
      if (typeof value === "string" && looksPersonal(value)) {
        flagged.push(`${row.importKey} ${header}: ${value.slice(0, 80)}`);
        continue;
      }
      values[header] = value;
    }
    return {
      importKey: row.importKey,
      sheet: row.sheet,
      excelRow: row.excelRow,
      values,
      formulas: Object.fromEntries(Object.entries(row.formulas).filter(([header]) => header in values)),
      institutionId: row.institutionSlug,
      agreementId: row.agreementCode,
      matchStatus: row.matchStatus,
    };
  });

const snapshot = {
  source: plan.sourceFile,
  batch: plan.batch,
  countries: plan.countries,
  /** Every university a register row (any sheet) is matched to. */
  listedInstitutions: [...new Set(plan.rows.flatMap((row) => (row.institutionSlug ? [row.institutionSlug] : [])))].sort(),
  institutions: plan.institutions.map(({ slug, name, normalizedName, countryId, excelRow }) => ({
    slug,
    name,
    normalizedName,
    countryId,
    excelRow,
  })),
  agreements: plan.agreements.map((a) => ({
    code: a.code,
    existing: a.existing,
    excelRow: a.excelRow,
    institutionSlug: a.institutionSlug,
    reference: a.reference,
    title: a.title,
    type: a.type,
    typeLabel: a.typeLabel,
    needsReview: a.needsReview,
    startDate: a.fill.startDate,
    endDate: a.fill.endDate,
    recordStatus: a.fill.recordStatus,
    details: {
      doicReference: a.details.doicReference,
      initiationYear: a.details.initiationYear,
      renewalYear: a.details.renewalYear,
      periodText: a.details.periodText,
      expiryText: a.details.expiryText,
      recordedStatus: a.details.recordedStatus,
      theRanking: a.details.theRanking,
      faculty: clean(a.code, "faculty", a.details.faculty),
      department: clean(a.code, "department", a.details.department),
      opportunities: clean(a.code, "opportunities", a.details.opportunities),
      programmeReference: clean(a.code, "programme", a.details.programmeReference),
    },
  })),
  rows,
};

writeFileSync("src/lib/internal/data/register-snapshot.json", `${JSON.stringify(snapshot, null, 1)}\n`);
console.log(
  `Wrote ${snapshot.agreements.length} agreements and ${snapshot.institutions.length} new universities to src/lib/internal/data/register-snapshot.json`,
);
if (flagged.length > 0) console.log(`Left out ${flagged.length} values that look personal:\n${flagged.join("\n")}`);
