import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  activeFilterCount,
  buildDashboardInput,
  computeDashboard,
  dashboardFilterOptions,
  parseDashboardFilters,
  sectionHref,
} from "@/lib/internal/analytics";
import { canAccessPath } from "@/lib/auth/roles";
import { officialDataset, type Dataset } from "@/lib/internal/data/dataset";
import { createViews } from "@/lib/internal/data/views";
import type {
  Activity,
  Agreement,
  DocumentRecord,
  Institution,
  Opportunity,
  Program,
  ProgramAvailability,
  ProgramType,
} from "@/lib/internal/types";

const today = "2026-10-04";
const provenance = { sourceUrl: null, sourceTitle: null, sourceCheckedOn: null, verification: "unverified" } as const;

function institution(id: string, country: string, extra: Partial<Institution> = {}): Institution {
  return {
    ...provenance,
    id,
    name: id,
    normalizedName: null,
    country,
    countryId: country.toLowerCase(),
    region: "Europe",
    city: null,
    latitude: null,
    longitude: null,
    website: null,
    note: null,
    isPublic: false,
    source: "official",
    ...extra,
  };
}

function agreement(id: string, institutionId: string, extra: Partial<Agreement> = {}): Agreement {
  return {
    ...provenance,
    id,
    reference: id,
    institutionId,
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

function program(id: ProgramType): Program {
  return { ...provenance, id, name: id, type: id, description: "", generalAudience: null, source: "official" };
}

function offering(id: string, programId: ProgramType, institutionId: string): ProgramAvailability {
  return {
    ...provenance,
    id,
    programId,
    institutionId,
    agreementId: null,
    availability: null,
    duration: null,
    intake: null,
    applicationStart: null,
    applicationEnd: null,
    eligibility: null,
    creditInformation: null,
    notes: null,
    source: "official",
  };
}

function opportunity(id: string, programId: ProgramType, institutionId: string | null, extra: Partial<Opportunity> = {}): Opportunity {
  return {
    ...provenance,
    id,
    title: id,
    programId,
    availabilityId: null,
    institutionId,
    opensOn: null,
    deadline: null,
    recordStatus: "published",
    summary: "",
    source: "official",
    ...extra,
  };
}

function activity(id: string, startDate: string, recordStatus: Activity["recordStatus"], country = "France"): Activity {
  return {
    ...provenance,
    id,
    title: id,
    type: "event",
    startDate,
    endDate: null,
    institutionId: null,
    country,
    city: null,
    recordStatus,
    summary: "",
    participants: null,
    agreementId: null,
    source: "official",
  };
}

function document(id: string, type: DocumentRecord["type"], extra: Partial<DocumentRecord> = {}): DocumentRecord {
  return {
    ...provenance,
    id,
    title: id,
    type,
    status: "final",
    updatedOn: null,
    storageKey: null,
    url: "https://example.invalid/doc.pdf",
    publiclyAccessible: true,
    description: null,
    source: "official",
    ...extra,
  };
}

function fixture(): Dataset {
  return {
    institutions: [
      institution("fr-1", "France"),
      institution("fr-2", "France", { source: "directory" }),
      institution("de-1", "Germany"),
    ],
    agreements: [
      // Multi-party MoU led from France with a German partner: one MoU, never two.
      agreement("mou-multi", "fr-1", { partnerInstitutionIds: ["de-1"] }),
      agreement("mou-fr", "fr-1"),
      agreement("mou-de", "de-1"),
    ],
    programs: [program("student-exchange"), program("academic-visits")],
    availability: [
      offering("off-1", "student-exchange", "fr-1"),
      offering("off-2", "academic-visits", "de-1"),
    ],
    opportunities: [
      opportunity("call-student", "student-exchange", "fr-1", { deadline: "2026-10-10" }),
      opportunity("call-faculty", "academic-visits", "de-1"),
    ],
    documents: [document("doc-report", "report"), document("doc-form", "form", { url: null })],
    documentLinks: [],
    activities: [
      activity("act-done", "2024-03-01", "completed"),
      activity("act-overdue", "2025-05-01", "planned", "Germany"),
      activity("act-next", "2026-11-01", "confirmed"),
    ],
  };
}

const input = () => buildDashboardInput(createViews(fixture()), today);

describe("dashboard metrics", () => {
  it("counts each record once, including multi-party MoUs", () => {
    const d = computeDashboard(input());
    assert.equal(d.universities.total, 3);
    assert.equal(d.universities.directory, 1);
    assert.equal(d.mous.total, 3);
    const byCountry = Object.fromEntries(d.geography.countries.map((row) => [row.country, row.mous]));
    assert.deepEqual(byCountry, { France: 2, Germany: 1 });
    const statusSum = Object.values(d.mous.byStatus).reduce((a, b) => a + b, 0);
    assert.equal(statusSum, d.mous.total);
  });

  it("reports MoU activity and expiry as not recorded, not zero, when no dates exist", () => {
    const d = computeDashboard(input());
    assert.equal(d.mous.active, null);
    assert.equal(d.mous.expired, null);
    assert.equal(d.mous.expiringSoonCount, null);
    assert.equal(d.mous.byStatus["not-stated"], 3);
  });

  it("derives active, expired, and expiring counts once dates are recorded", () => {
    const data = fixture();
    const d = computeDashboard(
      buildDashboardInput(
        createViews({
          ...data,
          agreements: [
            agreement("live", "fr-1", { recordStatus: "signed", startDate: "2024-01-01", endDate: "2028-01-01" }),
            agreement("soon", "fr-1", { recordStatus: "signed", startDate: "2024-01-01", endDate: "2026-11-01" }),
            agreement("old", "de-1", { recordStatus: "signed", startDate: "2020-01-01", endDate: "2025-01-01" }),
          ],
        }),
        today,
      ),
    );
    assert.equal(d.mous.active, 2);
    assert.equal(d.mous.expiringSoonCount, 1);
    assert.equal(d.mous.expired, 1);
    assert.deepEqual(d.mous.expiringSoon.map((row) => row.id), ["soon"]);
  });

  it("splits programmes and opportunities by audience", () => {
    const d = computeDashboard(input());
    const students = d.programs.byAudience.find((row) => row.audience === "students");
    const faculty = d.programs.byAudience.find((row) => row.audience === "faculty");
    assert.deepEqual(students, { audience: "students", programmes: 1, offerings: 1, opportunities: 1 });
    assert.deepEqual(faculty, { audience: "faculty", programmes: 1, offerings: 1, opportunities: 1 });
    assert.deepEqual(d.programs.upcomingDeadlines.map((row) => row.id), ["call-student"]);
  });

  it("classifies activities as completed, upcoming, or overdue", () => {
    const d = computeDashboard(input());
    assert.equal(d.activities.completed, 1);
    assert.deepEqual(d.activities.upcoming.map((row) => row.id), ["act-next"]);
    assert.deepEqual(d.activities.overdue.map((row) => row.id), ["act-overdue"]);
  });

  it("fills empty years between recorded ones and only offers a trend with two or more years", () => {
    const d = computeDashboard(input());
    assert.deepEqual(
      d.activities.byYear.map((row) => [row.year, row.total]),
      [["2024", 1], ["2025", 1], ["2026", 1]],
    );
    assert.equal(d.activities.trendAvailable, true);
    const single = computeDashboard(input(), { year: "2024" });
    assert.equal(single.activities.trendAvailable, false);
  });

  it("counts documents and reports, and lists data gaps", () => {
    const d = computeDashboard(input());
    assert.equal(d.documents.total, 2);
    assert.equal(d.documents.reports, 1);
    const gap = (key: string) => d.dataGaps.find((row) => row.key === key)?.count;
    assert.equal(gap("mou-status"), 3);
    assert.equal(gap("directory"), 1);
    assert.equal(gap("opportunity-deadline"), 1);
    assert.equal(gap("document-file"), 1);
  });

  it("marks recent updates unavailable without timestamps and sorts them newest first otherwise", () => {
    assert.equal(computeDashboard(input()).recentUpdates.available, false);
    const data = fixture();
    const stamped: Dataset = {
      ...data,
      institutions: data.institutions.map((row, i) => ({ ...row, updatedAt: `2026-09-0${i + 1}T10:00:00Z` })),
    };
    const d = computeDashboard(buildDashboardInput(createViews(stamped), today));
    assert.equal(d.recentUpdates.available, true);
    assert.deepEqual(d.recentUpdates.rows.map((row) => row.title), ["de-1", "fr-2", "fr-1"]);
  });
});

describe("dashboard filters", () => {
  it("narrows by country, counting a multi-party MoU for any party's country", () => {
    const d = computeDashboard(input(), { country: "Germany" });
    assert.equal(d.universities.total, 1);
    assert.deepEqual(d.mous.expiringSoon, []);
    assert.equal(d.mous.total, 2);
    assert.equal(d.programs.offerings, 1);
    assert.equal(d.activities.total, 1);
    assert.equal(d.documents.total, 2, "documents have no country and are not filtered");
  });

  it("narrows programmes, offerings, and opportunities by audience only", () => {
    const d = computeDashboard(input(), { audience: "faculty" });
    assert.equal(d.programs.programmes, 1);
    assert.equal(d.programs.offerings, 1);
    assert.equal(d.programs.opportunities, 1);
    assert.equal(d.universities.total, 3);
    assert.equal(d.activities.total, 3);
  });

  it("ignores filter values that are not in the data", () => {
    const options = dashboardFilterOptions(input());
    assert.deepEqual(options.years, ["2026", "2025", "2024"]);
    const parsed = parseDashboardFilters({ country: "Atlantis", audience: "admins", year: "1999" }, options);
    assert.deepEqual(parsed, { country: undefined, audience: undefined, year: undefined });
    assert.equal(activeFilterCount(parsed), 0);
    const valid = parseDashboardFilters({ country: "France", audience: "students", year: "2025" }, options);
    assert.equal(activeFilterCount(valid), 3);
  });

  it("carries the active filters into section links", () => {
    assert.equal(
      sectionHref("/internal/programs?tab=opportunities", { country: "Côte d'Ivoire", audience: "faculty" }, ["country", "audience"]),
      "/internal/programs?tab=opportunities&country=C%C3%B4te+d%27Ivoire&audience=faculty",
    );
    assert.equal(sectionHref("/internal/universities", {}, ["country"]), "/internal/universities");
  });
});

describe("official dataset", () => {
  it("adds up without double counting", () => {
    const d = computeDashboard(buildDashboardInput(createViews(officialDataset), today));
    assert.equal(d.universities.total, officialDataset.institutions.length);
    assert.equal(d.mous.total, officialDataset.agreements.length);
    assert.equal(d.geography.countries.reduce((sum, row) => sum + row.mous, 0), d.mous.total);
    assert.equal(d.geography.byRegion.reduce((sum, row) => sum + row.mous, 0), d.mous.total);
    assert.equal(d.programs.byAudience.reduce((sum, row) => sum + row.opportunities, 0), d.programs.opportunities);
  });
});

describe("dashboard access", () => {
  it("is limited to internal roles", () => {
    assert.equal(canAccessPath("/internal", ["student"]), false);
    assert.equal(canAccessPath("/internal", []), false);
    for (const role of ["leadership", "isc_team", "doic_admin"] as const) {
      assert.equal(canAccessPath("/internal", [role]), true);
    }
  });

  it("keeps analytics off the section pages", () => {
    for (const file of [
      "src/app/internal/universities/page.tsx",
      "src/app/internal/activities/page.tsx",
      "src/app/internal/programs/opportunities-panel.tsx",
      "src/app/internal/programs/programs-panel.tsx",
      "src/app/internal/documents/documents-panel.tsx",
    ]) {
      const source = readFileSync(file, "utf8");
      assert.doesNotMatch(source, /StatCard|Breakdown|computeDashboard/, file);
    }
  });
});
