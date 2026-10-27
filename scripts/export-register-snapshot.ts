/**
 * Exports the non-personal part of the DoIC MoU register plan to
 * src/lib/internal/data/register-snapshot.json, which the portal overlays on
 * its dataset until the register import has run on the database.
 *
 *   npm run db:mou:snapshot
 *
 * Contains dates, statuses, faculty, department, scope, and programme notes
 * only. Nodal officers, contact details, remarks, and source rows stay in
 * data/private/ and the import SQL.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { todayISO } from "@/lib/internal/dates";
import { loadExisting } from "./mou-workbook/existing";
import { buildPlan, type Workbook } from "./mou-workbook/plan";

const PERSONAL = /@|\+?\d[\d\s-]{8,}\d|\b(dr|prof|mr|mrs|ms)\.?\s+[A-Z]/i;

const workbook = JSON.parse(readFileSync("data/private/mou_details_structured.json", "utf8")) as Workbook;
const plan = buildPlan(workbook, loadExisting(), todayISO());

const flagged: string[] = [];
const clean = (code: string, field: string, value: string | null) => {
  if (value && PERSONAL.test(value)) {
    flagged.push(`${code} ${field}: ${value.slice(0, 80)}`);
    return null;
  }
  return value;
};

const snapshot = {
  source: plan.sourceFile,
  batch: plan.batch,
  countries: plan.countries,
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
};

writeFileSync("src/lib/internal/data/register-snapshot.json", `${JSON.stringify(snapshot, null, 1)}\n`);
console.log(
  `Wrote ${snapshot.agreements.length} agreements and ${snapshot.institutions.length} new universities to src/lib/internal/data/register-snapshot.json`,
);
if (flagged.length > 0) console.log(`Left out ${flagged.length} values that look personal:\n${flagged.join("\n")}`);
