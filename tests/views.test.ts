import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Dataset } from "@/lib/internal/data/dataset";
import { createViews } from "@/lib/internal/data/views";
import { agreementHref } from "@/lib/internal/links";
import type { Agreement, Institution } from "@/lib/internal/types";

const provenance = { sourceUrl: null, sourceTitle: null, sourceCheckedOn: null, verification: "unverified" } as const;

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
    startDate: "2025-01-01",
    endDate: "2029-12-31",
    renewal: null,
    collaborationAreas: [],
    sourceSection: null,
    notes: null,
    source: "official",
    ...extra,
  };
}

function dataset(agreements: Agreement[]): Dataset {
  return {
    institutions: ["uni-a", "uni-b", "uni-c"].map(institution),
    agreements,
    programs: [],
    availability: [],
    opportunities: [],
    documents: [],
    documentLinks: [],
    activities: [],
  };
}

const today = "2026-10-04";

describe("university-centric agreement views", () => {
  it("lists several MoUs under one university, each counted once", () => {
    const views = createViews(
      dataset([agreement("mou-1", "uni-a"), agreement("mou-2", "uni-a", { recordStatus: "not-stated", startDate: null, endDate: null })]),
    );
    const list = views.agreementsForInstitution("uni-a", today);
    assert.deepEqual(list.map((a) => a.id).sort(), ["mou-1", "mou-2"]);
    const view = views.toInstitutionView(institution("uni-a"), today);
    assert.equal(view.agreementCount, 2);
    assert.equal(view.activeAgreementCount, 1);
  });

  it("shows a multi-party MoU under the lead and each recorded partner", () => {
    const views = createViews(dataset([agreement("mou-3", "uni-a", { partnerInstitutionIds: ["uni-b"] })]));
    assert.deepEqual(views.agreementsForInstitution("uni-b", today).map((a) => a.id), ["mou-3"]);
    const view = views.toAgreementView(views.data.agreements[0], today);
    assert.equal(view.institution?.id, "uni-a");
    assert.deepEqual(view.partners.map((p) => p.id), ["uni-b"]);
  });

  it("never infers a relationship that is not recorded", () => {
    const views = createViews(dataset([agreement("mou-4", "uni-a")]));
    assert.deepEqual(views.agreementsForInstitution("uni-c", today), []);
    const view = views.toInstitutionView(institution("uni-c"), today);
    assert.equal(view.agreementCount, 0);
    assert.equal(view.partnershipStatus, "not-recorded");
    assert.equal(view.nextExpiry, null);
  });

  it("drops partner ids whose university is not visible instead of showing blanks", () => {
    const views = createViews(dataset([agreement("mou-5", "uni-a", { partnerInstitutionIds: ["uni-hidden"] })]));
    assert.deepEqual(views.toAgreementView(views.data.agreements[0], today).partners, []);
  });

  it("links agreements to their lead university's page", () => {
    assert.equal(
      agreementHref({ id: "ic-001", institutionId: "dir-kaznu" }),
      "/internal/universities/dir-kaznu?agreement=ic-001#agreement-ic-001",
    );
  });
});
