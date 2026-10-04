import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { buildDashboardInput, computeDashboard } from "@/lib/internal/analytics";
import { canAccessPath } from "@/lib/auth/roles";
import { officialDataset, type Dataset } from "@/lib/internal/data/dataset";
import { createViews } from "@/lib/internal/data/views";
import type { Activity, Agreement, Institution } from "@/lib/internal/types";

const today = "2026-10-04";
const provenance = { sourceUrl: null, sourceTitle: null, sourceCheckedOn: null, verification: "unverified" } as const;

function institution(id: string): Institution {
  return {
    ...provenance,
    id,
    name: id,
    normalizedName: null,
    country: "France",
    countryId: "france",
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

function agreement(id: string, extra: Partial<Agreement> = {}): Agreement {
  return {
    ...provenance,
    id,
    reference: id,
    institutionId: "uni-a",
    title: id,
    type: "mou",
    typeLabel: null,
    recordStatus: "not-stated",
    startDate: null,
    endDate: null,
    renewal: null,
    collaborationAreas: [],
    sourceSection: null,
    notes: null,
    source: "official",
    ...extra,
  };
}

function activity(id: string, startDate: string, recordStatus: Activity["recordStatus"]): Activity {
  return {
    ...provenance,
    id,
    title: id,
    type: "event",
    startDate,
    endDate: null,
    institutionId: null,
    country: "France",
    city: null,
    recordStatus,
    summary: "",
    participants: null,
    agreementId: null,
    source: "official",
  };
}

function dashboard(overrides: Partial<Dataset> = {}) {
  const data: Dataset = {
    institutions: [institution("uni-a"), institution("uni-b")],
    agreements: [agreement("mou-1", { partnerInstitutionIds: ["uni-b"] }), agreement("mou-2")],
    programs: [],
    availability: [],
    opportunities: [],
    documents: [],
    documentLinks: [],
    activities: [
      activity("done", "2024-03-01", "completed"),
      activity("overdue-old", "2024-05-01", "planned"),
      activity("overdue-new", "2025-05-01", "confirmed"),
      activity("later", "2026-12-01", "planned"),
      activity("soon", "2026-10-10", "confirmed"),
      activity("dropped", "2026-11-01", "cancelled"),
    ],
    ...overrides,
  };
  return computeDashboard(buildDashboardInput(createViews(data), today));
}

describe("dashboard activities", () => {
  it("summarises total, upcoming, overdue, and completed", () => {
    const { activities } = dashboard();
    assert.equal(activities.total, 6);
    assert.equal(activities.completed.length, 1);
    assert.equal(activities.cancelled, 1);
    assert.equal(activities.upcoming.length, 2);
    assert.equal(activities.overdue.length, 2);
  });

  it("lists the soonest upcoming, the most recent overdue, and the latest completed first", () => {
    const { activities } = dashboard();
    assert.deepEqual(activities.upcoming.map((row) => row.id), ["soon", "later"]);
    assert.deepEqual(activities.overdue.map((row) => row.id), ["overdue-new", "overdue-old"]);
    assert.ok(activities.overdue.every((row) => row.status === "needs-update"));
    assert.deepEqual(activities.completed.map((row) => row.id), ["done"]);
  });

  it("handles no activities", () => {
    const { activities } = dashboard({ activities: [] });
    assert.deepEqual(
      [activities.total, activities.upcoming.length, activities.overdue.length, activities.completed.length],
      [0, 0, 0, 0],
    );
  });
});

describe("dashboard totals, MoU records, and regions", () => {
  it("counts each record once, including multi-party MoUs", () => {
    const { totals } = dashboard();
    assert.deepEqual(totals, { universities: 2, mous: 2, programmes: 0, opportunities: 0, documents: 0 });
  });

  it("reports missing MoU details as missing and lists no invented statuses", () => {
    const { mous } = dashboard();
    assert.equal(mous.total, 2);
    assert.deepEqual(
      mous.completeness.map((row) => [row.key, row.recorded]),
      [["status", 0], ["end-date", 0], ["type", 2]],
    );
    assert.deepEqual(mous.byStatus, []);
  });

  it("lists only statuses that are recorded", () => {
    const { mous } = dashboard({
      agreements: [
        agreement("live", { recordStatus: "signed", startDate: "2024-01-01", endDate: "2028-01-01" }),
        agreement("ended", { recordStatus: "signed", startDate: "2020-01-01", endDate: "2025-01-01" }),
        agreement("unknown", { type: "not-stated" }),
      ],
    });
    assert.deepEqual(mous.byStatus, [
      { status: "active", count: 1 },
      { status: "expired", count: 1 },
    ]);
    assert.deepEqual(mous.completeness.map((row) => row.recorded), [2, 2, 2]);
  });

  it("flags only record gaps that exist, each with a link", () => {
    const { attention } = dashboard({ institutions: [institution("uni-a"), institution("uni-b"), institution("lonely")] });
    assert.deepEqual(attention.map((row) => [row.key, row.count]), [["no-mou", 1]]);
    assert.equal(attention[0].href, "/internal/universities?coverage=without");
  });

  it("groups universities by region and country without double counting", () => {
    const { regions } = dashboard();
    assert.deepEqual(regions.byRegion, [{ region: "Europe", universities: 2 }]);
    assert.deepEqual(regions.topCountries, [{ country: "France", universities: 2 }]);
  });

  it("matches the official dataset", () => {
    const d = computeDashboard(buildDashboardInput(createViews(officialDataset), today));
    assert.equal(d.totals.universities, officialDataset.institutions.length);
    assert.equal(d.totals.mous, officialDataset.agreements.length);
    assert.equal(d.totals.documents, officialDataset.documents.length);
    assert.equal(d.activities.total, officialDataset.activities.length);
    assert.equal(d.regions.byRegion.reduce((sum, row) => sum + row.universities, 0), d.totals.universities);
  });
});

describe("dashboard page", () => {
  const page = readFileSync("src/app/internal/page.tsx", "utf8");

  it("is limited to internal roles", () => {
    assert.equal(canAccessPath("/internal", ["student"]), false);
    assert.equal(canAccessPath("/internal", []), false);
    for (const role of ["leadership", "isc_team", "doic_admin"] as const) {
      assert.equal(canAccessPath("/internal", [role]), true);
    }
  });

  it("orders snapshot, then activities beside MoU records, then the rest", () => {
    const order = ["snapshot-heading", "activities-heading", "mou-heading", "regions-heading"].map((marker) =>
      page.indexOf(`id="${marker}"`),
    );
    assert.ok(order.every((index) => index > 0), "all sections present");
    assert.deepEqual([...order].sort((a, b) => a - b), order);
  });

  it("splits the second row 65/35 on desktop and stacks it on mobile", () => {
    assert.match(page, /grid-cols-1 [^"]*lg:grid-cols-\[minmax\(0,13fr\)_minmax\(18rem,7fr\)\]/);
  });

  it("links activities to their records and keeps at most two charts", () => {
    assert.match(page, /href=\{`\/internal\/activities\/\$\{activity\.id\}`\}/);
    const charts = (page.match(/<figure|<Breakdown/g) ?? []).length;
    assert.ok(charts <= 2, `found ${charts} charts`);
    assert.doesNotMatch(page, /Filter|ColumnChart|Recent updates/);
  });

  it("keeps analytics off the section pages", () => {
    for (const file of [
      "src/app/internal/universities/page.tsx",
      "src/app/internal/activities/page.tsx",
      "src/app/internal/programs/opportunities-panel.tsx",
      "src/app/internal/programs/programs-panel.tsx",
      "src/app/internal/documents/documents-panel.tsx",
    ]) {
      assert.doesNotMatch(readFileSync(file, "utf8"), /StatCard|Breakdown|computeDashboard/, file);
    }
  });
});
