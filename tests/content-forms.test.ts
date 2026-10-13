import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { auditChanges } from "@/lib/internal/audit";
import {
  checkDocumentFile,
  documentObjectPath,
  isDocumentObjectPath,
  newRecordCode,
  parseActivityForm,
  parseDocumentForm,
  parseOfferingForm,
  parseOpportunityForm,
  parseProgramForm,
  parseSettingsForm,
  safeFileName,
} from "@/lib/internal/content-forms";
import { buildExport, csvCell, toCsv } from "@/lib/internal/csv";
import { staticDataset } from "@/lib/internal/data/dataset";
import { SLUG_PATTERN } from "@/lib/internal/record-forms";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

const errorsOf = (result: { ok: boolean; state?: { fieldErrors?: Record<string, string> } }) =>
  Object.keys(result.ok ? {} : (result.state?.fieldErrors ?? {})).sort();

describe("record form validation (server side)", () => {
  it("accepts a valid programme and rejects unknown types and bad orders", () => {
    const ok = parseProgramForm(form({ type: "student-exchange", name: "Exchange", description: "Semester abroad.", sortOrder: "5", isPublished: "on" }));
    assert.ok(ok.ok);
    if (ok.ok) assert.equal(ok.value.isPublished, true);
    assert.deepEqual(errorsOf(parseProgramForm(form({ type: "made-up", name: "", description: "x", sortOrder: "-1" }))), ["name", "sortOrder", "type"]);
  });

  it("checks offering keys, states, and window order", () => {
    assert.deepEqual(
      errorsOf(
        parseOfferingForm(
          form({ program: "student-exchange", institution: "Bad Slug!", agreement: "x y", availability: "maybe", applicationStart: "2026-05-01", applicationEnd: "2026-04-01" }),
        ),
      ),
      ["agreement", "applicationEnd", "availability", "institution"],
    );
    assert.ok(parseOfferingForm(form({ program: "student-exchange", institution: "ofc-tokyo" })).ok);
  });

  it("requires a deadline before a call can be published", () => {
    const base = { title: "Call", program: "student-exchange", summary: "Who and how.", recordStatus: "published" };
    assert.deepEqual(errorsOf(parseOpportunityForm(form(base))), ["deadline"]);
    assert.ok(parseOpportunityForm(form({ ...base, deadline: "2026-12-01" })).ok);
    assert.ok(parseOpportunityForm(form({ ...base, recordStatus: "draft" })).ok);
    assert.deepEqual(errorsOf(parseOpportunityForm(form({ ...base, recordStatus: "open" }))), ["recordStatus"]);
  });

  it("requires an activity's country and start date, in order", () => {
    assert.deepEqual(
      errorsOf(parseActivityForm(form({ title: "Visit", type: "delegation", recordStatus: "planned", summary: "x", endDate: "2026-01-01" }))),
      ["country", "startDate"],
    );
    assert.deepEqual(
      errorsOf(parseActivityForm(form({ title: "Visit", type: "delegation", recordStatus: "planned", summary: "x", country: "japan", startDate: "2026-02-01", endDate: "2026-01-01" }))),
      ["endDate"],
    );
  });

  it("validates document links and official URLs", () => {
    assert.deepEqual(
      errorsOf(parseDocumentForm(form({ title: "Report", type: "report", status: "final", externalUrl: "javascript:alert(1)", linkProgram: "nope" }))),
      ["externalUrl", "linkProgram"],
    );
    const ok = parseDocumentForm(form({ title: "Report", type: "report", status: "final", linkInstitution: "ofc-tokyo" }));
    assert.ok(ok.ok);
    if (ok.ok) assert.deepEqual(ok.value.links, { institutionSlug: "ofc-tokyo", agreementCode: null, programType: null });
  });

  it("limits settings to a valid email and a short note", () => {
    assert.deepEqual(errorsOf(parseSettingsForm(form({ accessContactEmail: "not-an-email", accessContactNote: "x".repeat(301) }))), [
      "accessContactEmail",
      "accessContactNote",
    ]);
    const ok = parseSettingsForm(form({ accessContactEmail: "doic@jaipur.manipal.edu", accessContactNote: "" }));
    assert.ok(ok.ok);
    if (ok.ok) assert.equal(ok.value.accessContactNote, null);
  });

  it("makes record codes that are valid URL keys", () => {
    for (let i = 0; i < 50; i++) assert.match(newRecordCode("opp"), SLUG_PATTERN);
  });
});

describe("document files", () => {
  const id = "0b7d6f1e-1c2a-4b3c-9d4e-5f6a7b8c9d0e";

  it("accepts only the bucket's types and size", () => {
    assert.equal(checkDocumentFile({ size: 1000, type: "application/pdf" }), null);
    assert.ok(checkDocumentFile({ size: 0, type: "application/pdf" }));
    assert.ok(checkDocumentFile({ size: 26 * 1024 * 1024, type: "application/pdf" }));
    assert.ok(checkDocumentFile({ size: 1000, type: "text/html" }));
    assert.ok(checkDocumentFile({ size: 1000, type: "image/svg+xml" }));
  });

  it("builds storage paths that match the bucket's path rule and can't escape the document folder", () => {
    const path = documentObjectPath(id, "../../Annual Report é 2026.pdf", 1700000000000);
    assert.equal(path, `documents/${id}/1700000000000-Annual-Report-e-2026.pdf`);
    assert.match(path, /^documents\/[0-9a-f-]{36}\/[^/]+$/);
    assert.ok(isDocumentObjectPath(id, path));
    assert.equal(isDocumentObjectPath(id, `documents/${id}/../x.pdf`), false);
    assert.equal(isDocumentObjectPath(id, `documents/0b7d6f1e-1c2a-4b3c-9d4e-000000000000/x.pdf`), false);
    assert.equal(isDocumentObjectPath("not-a-uuid", `documents/not-a-uuid/x.pdf`), false);
    assert.equal(safeFileName("///"), "file");
  });
});

describe("CSV export", () => {
  it("quotes separators and neutralises spreadsheet formulas", () => {
    assert.equal(csvCell('a,"b"'), '"a,""b"""');
    assert.equal(csvCell("=HYPERLINK(\"x\")"), "\"'=HYPERLINK(\"\"x\"\")\"");
    assert.equal(csvCell("+1"), "'+1");
    assert.equal(csvCell("@cmd"), "'@cmd");
    assert.equal(csvCell(null), "");
    assert.equal(toCsv(["A", "B"], [[1, true]]), "A,B\r\n1,true\r\n");
  });

  it("exports one row per record and never contact details", () => {
    const data = staticDataset(false);
    const csv = buildExport("universities", data);
    assert.equal(csv.trimEnd().split("\r\n").length, data.institutions.length + 1);
    assert.doesNotMatch(buildExport("universities", data).split("\r\n")[0], /email|phone|contact/i);
  });
});

describe("audit history", () => {
  it("shows changed fields only, ignores timestamps, and redacts secrets", () => {
    const changes = auditChanges(
      { name: "Old", city: "Tokyo", updated_at: "1", password: "x" },
      { name: "New", city: "Tokyo", updated_at: "2", password: "y" },
    );
    assert.deepEqual(changes, [
      { field: "name", before: "Old", after: "New" },
      { field: "password", before: "[redacted]", after: "[redacted]" },
    ]);
    assert.deepEqual(auditChanges(null, { role: "isc_team" }), [{ field: "role", before: null, after: "isc_team" }]);
  });
});
