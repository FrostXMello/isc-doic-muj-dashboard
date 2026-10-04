import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatDuration } from "@/lib/internal/dates";
import {
  newAgreementCode,
  newInstitutionSlug,
  parseAgreementForm,
  parseInstitutionForm,
  SLUG_PATTERN,
} from "@/lib/internal/record-forms";

function form(entries: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  }
  return data;
}

const validAgreement = {
  title: "Student exchange with Example University",
  reference: "MUJ/DOIC/2026/001",
  lead: "dir-example-university",
  type: "student-exchange",
  recordStatus: "signed",
  startDate: "2026-01-01",
  endDate: "2030-12-31",
  renewal: "by-review",
  verification: "verified",
};

describe("parseAgreementForm", () => {
  it("accepts a complete agreement and keeps empty optionals as null", () => {
    const result = parseAgreementForm(form({ ...validAgreement, typeLabel: "", notes: " " }));
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.type, "student-exchange");
    assert.equal(result.value.typeLabel, null);
    assert.equal(result.value.notes, null);
    assert.deepEqual(result.value.partnerSlugs, []);
  });

  it("records missing dates and status as not stated, never invented", () => {
    const result = parseAgreementForm(
      form({ ...validAgreement, recordStatus: "not-stated", startDate: "", endDate: "", renewal: "" }),
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.startDate, null);
    assert.equal(result.value.endDate, null);
    assert.equal(result.value.renewal, null);
    assert.equal(result.value.recordStatus, "not-stated");
  });

  it("requires a title, reference, lead university, and known enums", () => {
    const result = parseAgreementForm(
      form({ ...validAgreement, title: "", reference: "", lead: "", type: "treaty", recordStatus: "active" }),
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.deepEqual(Object.keys(result.state.fieldErrors ?? {}).sort(), [
      "lead",
      "recordStatus",
      "reference",
      "title",
      "type",
    ]);
    assert.equal(result.state.values?.title, "");
  });

  it("rejects impossible dates and an end before the start", () => {
    const bad = parseAgreementForm(form({ ...validAgreement, startDate: "2026-02-30" }));
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.ok(bad.state.fieldErrors?.startDate);

    const reversed = parseAgreementForm(form({ ...validAgreement, startDate: "2027-01-01", endDate: "2026-01-01" }));
    assert.equal(reversed.ok, false);
    if (!reversed.ok) assert.ok(reversed.state.fieldErrors?.endDate);
  });

  it("deduplicates partner universities and never lists the lead as a partner", () => {
    const result = parseAgreementForm(
      form({ ...validAgreement, partners: ["dir-other", "dir-other", "dir-example-university", "dir-third"] }),
    );
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.value.partnerSlugs, ["dir-other", "dir-third"]);
  });

  it("rejects malformed partner ids and echoes the selection back", () => {
    const result = parseAgreementForm(form({ ...validAgreement, partners: ["Bad Id"] }));
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.state.fieldErrors?.partners);
    assert.deepEqual(result.state.values?.partners, ["Bad Id"]);
  });

  it("rejects source links that are not http(s)", () => {
    const result = parseAgreementForm(form({ ...validAgreement, sourceUrl: "javascript:alert(1)" }));
    assert.equal(result.ok, false);
  });
});

describe("parseInstitutionForm", () => {
  it("accepts institutional details only", () => {
    const result = parseInstitutionForm(
      form({ name: "Example University", country: "united-kingdom", website: "https://example.ac.uk", isPublic: "on" }),
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.value.isPublic, true);
    assert.equal(result.value.city, null);
    assert.equal(result.value.verification, "unverified");
  });

  it("requires a name and country and an http(s) website", () => {
    const result = parseInstitutionForm(form({ name: "", country: "", website: "example.ac.uk" }));
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.deepEqual(Object.keys(result.state.fieldErrors ?? {}).sort(), ["country", "name", "website"]);
  });
});

describe("generated keys", () => {
  it("builds readable, valid institution slugs", () => {
    const slug = newInstitutionSlug("Universität für Bodenkultur Wien", () => 0.5);
    assert.match(slug, /^universitat-fur-bodenkultur-wien-[a-z0-9]{4}$/);
    assert.match(slug, SLUG_PATTERN);
    assert.match(newInstitutionSlug("!!!", () => 0), /^university-0000$/);
  });

  it("builds valid agreement codes", () => {
    assert.match(newAgreementCode(), /^mou-[a-z0-9]{8}$/);
    assert.match(newAgreementCode(), SLUG_PATTERN);
  });
});

describe("formatDuration", () => {
  it("treats terms as inclusive of both dates", () => {
    assert.equal(formatDuration("2020-01-01", "2024-12-31"), "5 years");
    assert.equal(formatDuration("2020-01-15", "2025-01-14"), "5 years");
    assert.equal(formatDuration("2024-07-01", "2026-12-31"), "2 years 6 months");
    assert.equal(formatDuration("2026-03-01", "2026-03-10"), "10 days");
  });

  it("returns null instead of guessing when a date is missing", () => {
    assert.equal(formatDuration(null, "2026-01-01"), null);
    assert.equal(formatDuration("2026-01-01", null), null);
    assert.equal(formatDuration("2026-01-02", "2026-01-01"), null);
  });
});
