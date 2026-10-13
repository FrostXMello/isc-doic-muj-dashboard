import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import type { RegisterAccess, RegisterRow } from "@/lib/internal/data/register";
import { buildUniversityEntry, matchesEntry, mergeOfficers, type ContactView } from "@/lib/internal/register-view";
import { parseAgreementDetailsForm, parseContactForm } from "@/lib/internal/register-forms";
import type { AgreementView, InstitutionContact, InstitutionView } from "@/lib/internal/types";
import {
  displayCell,
  fieldLabels,
  mouList,
  parseEmails,
  parsePhone,
  parseSourceDate,
  serialColumns,
  sheetKeys,
  workflowColumns,
} from "@/lib/internal/workbook/source";
import { loadExisting } from "../scripts/mou-workbook/existing";
import { buildPlan, type Workbook } from "../scripts/mou-workbook/plan";

const provenance = { sourceUrl: null, sourceTitle: null, sourceCheckedOn: null, verification: "unverified" } as const;

const university = {
  ...provenance,
  id: "uni",
  name: "Example University",
  normalizedName: null,
  country: "Testland",
  countryId: "testland",
  region: "Europe",
  city: null,
  latitude: null,
  longitude: null,
  website: null,
  note: null,
  isPublic: false,
  source: "official",
  partnershipStatus: "active",
  agreementCount: 2,
  activeAgreementCount: 1,
  offeringCount: 0,
  nextExpiry: null,
} satisfies InstitutionView;

function agreement(id: string, endDate: string | null, status: AgreementView["status"]): AgreementView {
  return {
    ...provenance,
    id,
    reference: `REF-${id}`,
    institutionId: "uni",
    title: `Agreement ${id}`,
    type: "mou",
    typeLabel: null,
    recordStatus: "signed",
    startDate: "2021-01-01",
    endDate,
    renewal: null,
    collaborationAreas: [],
    sourceSection: null,
    notes: null,
    source: "official",
    status,
    daysToExpiry: endDate ? 100 : null,
    institution: null,
    partners: [],
  };
}

const contact = (over: Partial<InstitutionContact>): InstitutionContact => ({
  id: "c",
  institutionId: "uni",
  agreementId: null,
  roleLabel: "MUJ Nodal Officer",
  name: null,
  phone: null,
  email: null,
  visibility: "internal",
  ...over,
});

const listRow: RegisterRow = {
  importKey: "mou-list:9",
  workbook: "test.xlsx",
  sheet: "mou-list",
  excelRow: 9,
  values: { [mouList.name]: "Example University", [mouList.continent]: "Europe", [mouList.nodalPhone]: -12 },
  formulas: { [mouList.nodalPhone]: "=91-9999" },
  issues: [],
  institutionId: "uni",
  agreementId: "a1",
  matchStatus: "matched",
  matchNote: null,
};

const register: RegisterAccess = {
  state: "granted",
  details: new Map([
    [
      "a1",
      {
        agreementId: "a1",
        doicReference: "DoIC/MoU/TL/EX/2021/7",
        initiationYear: 2021,
        renewalYear: null,
        periodText: "5 years",
        expiryText: null,
        recordedStatus: "Active",
        qsRanking: "NA",
        theRanking: "601-800",
        faculty: "FoSTA",
        department: "Physics",
        opportunities: "Student exchange",
        programmeReference: null,
        remarks: null,
        documentUrl: null,
      },
    ],
  ]),
  rows: [listRow, { ...listRow, importKey: "renewal:4", sheet: "renewal", excelRow: 4, agreementId: null, values: { Year: 2024 }, formulas: {} }],
  contactNotes: new Map([["p1", "Phone: +1 555 0100 ext. 12"]]),
};

const contacts = {
  state: "granted" as const,
  contacts: [
    contact({ id: "o1", agreementId: "a1", name: "Dr. Asha Rao", phone: "+91 98765 43210", email: "asha.rao@example.edu" }),
    contact({ id: "o2", agreementId: "a2", name: "Asha Rao", email: "asha@example.edu" }),
    contact({ id: "o3", agreementId: "a2", name: "Vikram Iyer", phone: "0141 299 9999" }),
    contact({ id: "e1", agreementId: "a1", roleLabel: "MUJ Nodal Officer (earlier)", name: "Prof. Old Officer" }),
    contact({ id: "p1", agreementId: "a1", roleLabel: "Partner Nodal Officer", name: "Jane Doe", email: "jane@partner.example" }),
    contact({ id: "x1", institutionId: "other", name: "Not Ours", phone: "123456" }),
  ],
};

describe("university entry", () => {
  const entry = buildUniversityEntry(
    university,
    [agreement("a1", "2027-01-01", "active"), agreement("a2", null, "active")],
    contacts,
    register,
  );

  it("lists every distinct DoIC officer once, merging the same person across agreements", () => {
    assert.deepEqual(
      entry.officers?.map((officer) => officer.name),
      ["Dr. Asha Rao", "Vikram Iyer"],
    );
    assert.deepEqual(entry.officers?.[0].emails, ["asha.rao@example.edu", "asha@example.edu"]);
  });

  it("keeps partner, earlier, and register details with their own agreement", () => {
    const [first, second] = entry.agreements;
    assert.equal(first.partners[0].name, "Jane Doe");
    assert.deepEqual(first.partners[0].notes, ["Phone: +1 555 0100 ext. 12"]);
    assert.equal(first.earlierOfficers[0].name, "Prof. Old Officer");
    assert.equal(first.details?.faculty, "FoSTA");
    assert.equal(first.rows.list.length, 1);
    assert.equal(second.details, null);
    assert.equal(second.partners.length, 0);
    assert.equal(entry.universityRows.length, 1, "a row without an agreement stays at university level");
  });

  it("never pulls in another university's contacts", () => {
    assert.ok(!entry.searchText.includes("not ours"));
  });

  it("searches names, countries, emails, phones, references, and register values", () => {
    for (const query of ["asha", "testland", "jane@partner.example", "REF-a2", "doic/mou/tl", "fosta", "601-800", "europe", "ext. 12"]) {
      assert.ok(matchesEntry(entry, query), query);
    }
    assert.ok(matchesEntry(entry, "9876543210"), "phone digits without spaces");
    assert.ok(!matchesEntry(entry, "nonexistent"));
  });

  it("never makes formula output searchable", () => {
    assert.ok(!entry.searchText.includes("-12"));
    assert.ok(!matchesEntry(entry, "=91-"));
  });

  it("marks contacts restricted when the user may not see them", () => {
    const restricted = buildUniversityEntry(university, [], { state: "restricted", reason: "static-source" }, register);
    assert.equal(restricted.officers, null);
  });
});

describe("officer merging", () => {
  it("merges unnamed contacts only when phone or email matches", () => {
    const rows: ContactView[] = [
      { ...contact({ id: "a", phone: "111111" }), note: null },
      { ...contact({ id: "b", phone: "111111", email: "a@b.co" }), note: null },
      { ...contact({ id: "c", phone: "222222" }), note: null },
    ];
    assert.equal(mergeOfficers(rows).length, 2);
  });
});

describe("source cell rules", () => {
  it("withholds formula output and keeps placeholders as written", () => {
    assert.deepEqual(displayCell(mouList.nodalPhone, listRow.values, listRow.formulas), { kind: "withheld" });
    assert.deepEqual(displayCell("x", { x: "N/A" }, {}), { kind: "placeholder", text: "N/A" });
    assert.equal(displayCell("x", { x: "  " }, {}), null);
  });

  it("parses day-first dates, phones, and multiple emails", () => {
    assert.equal(parseSourceDate("05/03/2019"), "2019-03-05");
    assert.equal(parseSourceDate("31/02/2019"), null);
    assert.deepEqual(parsePhone(-9000000001), { kind: "withheld", reason: "the cell holds formula output, not a phone number" });
    assert.deepEqual(parsePhone("NA"), { kind: "none" });
    assert.deepEqual(parseEmails("a@x.edu, b@y.org"), { emails: ["a@x.edu", "b@y.org"], invalid: null });
    assert.equal(parseEmails("someone@partner.example+V4:V115").invalid, "someone@partner.example+V4:V115");
  });
});

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("register forms", () => {
  it("accepts register details and rejects bad years and non-https links", () => {
    const ok = parseAgreementDetailsForm(form({ doicReference: "DoIC/MoU/X", initiationYear: "2021", documentUrl: "https://x.sharepoint.com/f" }));
    assert.ok(ok.ok && ok.value.initiationYear === 2021 && ok.value.renewalYear === null);
    const bad = parseAgreementDetailsForm(form({ initiationYear: "21", documentUrl: "http://insecure.example" }));
    assert.ok(!bad.ok && bad.state.fieldErrors?.initiationYear && bad.state.fieldErrors?.documentUrl);
  });

  it("requires a role and at least one way to reach the contact", () => {
    const empty = parseContactForm(form({ roleLabel: "MUJ Nodal Officer" }));
    assert.ok(!empty.ok && empty.state.fieldErrors?.name);
    const bad = parseContactForm(form({ roleLabel: "", phone: "ext 12", email: "not-an-email" }));
    assert.ok(!bad.ok && bad.state.fieldErrors?.roleLabel && bad.state.fieldErrors?.phone && bad.state.fieldErrors?.email);
    const ok = parseContactForm(form({ roleLabel: "Partner Nodal Officer", email: "Jane@Partner.Example", agreement: "ic-001" }));
    assert.ok(ok.ok && ok.value.email === "jane@partner.example" && ok.value.agreementCode === "ic-001");
  });
});

// The workbook itself is private (data/private, gitignored); these run only where it exists.
const STRUCTURED = "data/private/mou_details_structured.json";
const hasWorkbook = existsSync(STRUCTURED);

describe("DoIC MoU workbook (private data)", { skip: hasWorkbook ? false : "data/private workbook not present" }, () => {
  const workbook = hasWorkbook ? (JSON.parse(readFileSync(STRUCTURED, "utf8")) as Workbook) : null;

  it("maps or documents every column in all five worksheets", () => {
    const handled = new Set<string>([
      ...Object.values(mouList),
      ...Object.keys(fieldLabels),
      ...serialColumns,
      ...workflowColumns,
      "Year",
      "Period",
      "Signing DDMMYYYY",
      "Expiry",
    ]);
    const unmapped = Object.entries(workbook!.worksheets).flatMap(([sheet, data]) =>
      data.fields.filter((field) => !handled.has(field)).map((field) => `${sheet}: ${field}`),
    );
    assert.deepEqual(unmapped, []);
    assert.deepEqual(Object.keys(workbook!.worksheets).sort(), Object.keys(sheetKeys).sort());
  });

  it("keeps every source row and links every contact and agreement to one university", () => {
    const plan = buildPlan(workbook!, loadExisting(), "2026-10-13");
    const total = Object.values(workbook!.worksheets).reduce((sum, sheet) => sum + sheet.records.length, 0);
    assert.equal(plan.rows.length, total + 1, "every record plus the MoU Status header row");
    assert.equal(new Set(plan.rows.map((row) => `${row.sheet}:${row.excelRow}`)).size, plan.rows.length);

    const agreementOwner = new Map(plan.agreements.map((row) => [row.code, row.institutionSlug]));
    const existing = loadExisting();
    for (const row of existing.agreements) if (!agreementOwner.has(row.code)) agreementOwner.set(row.code, row.institutionSlug);
    for (const planned of plan.contacts) {
      assert.equal(agreementOwner.get(planned.agreementCode), planned.institutionSlug, planned.code);
    }
    for (const row of plan.rows) {
      if (row.agreementCode) assert.equal(agreementOwner.get(row.agreementCode), row.institutionSlug, `${row.sheet}:${row.excelRow}`);
    }
  });

  it("never types formula output", () => {
    const plan = buildPlan(workbook!, loadExisting(), "2026-10-13");
    const formulaPhones = new Set(
      plan.rows.flatMap((row) =>
        Object.keys(row.formulas)
          .filter((header) => header === mouList.nodalPhone || header === mouList.partnerPhone)
          .map((header) => String(row.values[header])),
      ),
    );
    for (const planned of plan.contacts) assert.ok(!planned.phone || !formulaPhones.has(planned.phone), planned.code);
  });
});
