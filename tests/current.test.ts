import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isRetiredAgreement, isRetiredRow, retireStaleAgreements } from "@/lib/internal/data/current";
import type { Dataset } from "@/lib/internal/data/dataset";
import type { Agreement, Institution } from "@/lib/internal/types";

const provenance = { sourceUrl: null, sourceTitle: null, sourceCheckedOn: null, verification: "unverified" } as const;
const today = "2026-10-27";

function institution(id: string): Institution {
  return {
    ...provenance,
    id,
    name: id,
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
  };
}

function agreement(id: string, institutionId: string, extra: Partial<Agreement> = {}): Agreement {
  return {
    ...provenance,
    id,
    reference: id.toUpperCase(),
    institutionId,
    title: id,
    type: "mou",
    typeLabel: null,
    recordStatus: "signed",
    startDate: "2021-01-01",
    endDate: "2029-12-31",
    renewal: null,
    collaborationAreas: [],
    sourceSection: null,
    notes: null,
    source: "official",
    ...extra,
  };
}

function dataset(agreements: Agreement[], extra: Partial<Dataset> = {}): Dataset {
  return {
    institutions: ["uni-a", "uni-b", "uni-c", "uni-d"].map(institution),
    agreements,
    programs: [],
    availability: [],
    opportunities: [],
    documents: [],
    documentLinks: [],
    activities: [],
    ...extra,
  };
}

describe("MoUs that ended before this year", () => {
  it("keeps active MoUs and those that ended this year; retires earlier ones", () => {
    assert.equal(isRetiredAgreement(agreement("a", "uni-a"), today), false);
    assert.equal(isRetiredAgreement(agreement("a", "uni-a", { endDate: "2026-01-01" }), today), false);
    assert.equal(isRetiredAgreement(agreement("a", "uni-a", { endDate: "2025-12-31" }), today), true);
    assert.equal(isRetiredAgreement(agreement("a", "uni-a", { endDate: null, recordStatus: "not-stated" }), today), false);
    assert.equal(isRetiredAgreement(agreement("a", "uni-a", { endDate: null, recordStatus: "terminated" }), today), true);
    assert.equal(isRetiredAgreement(agreement("a", "uni-a", { endDate: "2026-03-01", recordStatus: "terminated" }), today), false);
  });

  it("retires a university whose MoUs all ended before this year", () => {
    const data = dataset([
      agreement("old-a", "uni-a", { endDate: "2024-06-30" }),
      agreement("old-b", "uni-b", { endDate: "2023-01-01" }),
      agreement("new-b", "uni-b", { endDate: "2026-05-01" }),
      agreement("old-c", "uni-c", { endDate: "2022-01-01" }),
      agreement("undated-c", "uni-c", { startDate: null, endDate: null, recordStatus: "not-stated" }),
      agreement("undated-d", "uni-d", { startDate: null, endDate: null, recordStatus: "not-stated" }),
    ], {
      documentLinks: [
        { id: "l1", documentId: "d1", institutionId: "uni-c", agreementId: null, availabilityId: null, programId: null },
        { id: "l2", documentId: "d1", institutionId: null, agreementId: "old-b", availabilityId: null, programId: null },
        { id: "l3", documentId: "d1", institutionId: "uni-b", agreementId: null, availabilityId: null, programId: null },
      ],
    });
    const { data: current, retired } = retireStaleAgreements(data, today);
    // An undated, unstated agreement neither keeps uni-c nor survives it; uni-d has nothing old, so it stays.
    assert.deepEqual(current.agreements.map((a) => a.id), ["new-b", "undated-d"]);
    assert.deepEqual([...retired.institutions].sort(), ["uni-a", "uni-c"]);
    assert.deepEqual(current.institutions.map((i) => i.id), ["uni-b", "uni-d"]);
    assert.deepEqual(current.documentLinks.map((l) => l.id), ["l3"]);
    assert.equal(isRetiredRow(retired, { institutionId: "uni-b", agreementId: "old-b" }), true);
    assert.equal(isRetiredRow(retired, { institutionId: "uni-a", agreementId: null }), true);
    assert.equal(isRetiredRow(retired, { institutionId: "uni-b", agreementId: "new-b" }), false);
  });

  it("keeps only universities the register names, plus ones added in the portal", () => {
    const data: Dataset = {
      ...dataset([agreement("a1", "ofc-listed"), agreement("a2", "ofc-unlisted"), agreement("a3", "added-x7k2")]),
      institutions: ["ofc-listed", "ofc-unlisted", "dir-unlisted", "added-x7k2"].map(institution),
    };
    const register = { listed: new Set(["ofc-listed"]), agreements: new Set<string>(), expired: new Set<string>() };
    const { data: current } = retireStaleAgreements(data, today, register);
    assert.deepEqual(current.institutions.map((i) => i.id), ["ofc-listed", "added-x7k2"]);
    assert.deepEqual(current.agreements.map((a) => a.id), ["a1", "a3"]);
  });

  it("retires undated MoUs the register records as expired, and undated repeats of a register MoU", () => {
    const undated = { startDate: null, endDate: null, recordStatus: "not-stated" } as const;
    const data: Dataset = {
      ...dataset([
        agreement("wb-1", "ofc-a"),
        agreement("ofc-repeat", "ofc-a", undated),
        agreement("wb-2", "ofc-b", undated),
        agreement("ofc-only", "ofc-c", undated),
      ]),
      institutions: ["ofc-a", "ofc-b", "ofc-c"].map(institution),
    };
    const register = {
      listed: new Set(["ofc-a", "ofc-b", "ofc-c"]),
      agreements: new Set(["wb-1", "wb-2"]),
      expired: new Set(["wb-2"]),
    };
    const { data: current, retired } = retireStaleAgreements(data, today, register);
    assert.deepEqual(current.agreements.map((a) => a.id), ["wb-1", "ofc-only"]);
    assert.deepEqual(current.institutions.map((i) => i.id), ["ofc-a", "ofc-c"]);
    assert.equal(retired.institutions.has("ofc-a"), false);
  });
});
