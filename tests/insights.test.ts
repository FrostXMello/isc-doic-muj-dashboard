import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Dataset } from "@/lib/internal/data/dataset";
import { createViews } from "@/lib/internal/data/views";
import { eventInsights, universityInsights } from "@/lib/internal/insights";
import { buildUniversityEntry } from "@/lib/internal/register-view";
import type { Activity, Agreement, Institution } from "@/lib/internal/types";

const today = "2026-10-27";
const provenance = { sourceUrl: null, sourceTitle: null, sourceCheckedOn: null, verification: "unverified" } as const;

const institution = (id: string, country = "France"): Institution => ({
  ...provenance,
  id,
  name: `University ${id}`,
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
});

const agreement = (id: string, extra: Partial<Agreement>): Agreement => ({
  ...provenance,
  id,
  reference: id.toUpperCase(),
  institutionId: "uni-a",
  title: id,
  type: "mou",
  typeLabel: null,
  recordStatus: "signed",
  startDate: null,
  endDate: null,
  renewal: null,
  collaborationAreas: [],
  sourceSection: null,
  notes: null,
  source: "official",
  ...extra,
});

const activity = (id: string, startDate: string, extra: Partial<Activity> = {}): Activity => ({
  ...provenance,
  id,
  title: id,
  type: "event",
  startDate,
  endDate: null,
  institutionId: "uni-a",
  country: "France",
  city: null,
  recordStatus: "completed",
  summary: "",
  participants: null,
  agreementId: null,
  source: "official",
  ...extra,
});

const data: Dataset = {
  institutions: [institution("uni-a"), institution("uni-b", "Japan")],
  agreements: [
    agreement("mou-old", { startDate: "2021-01-01", endDate: "2026-03-01" }),
    agreement("mou-new", { startDate: "2024-05-01", endDate: "2029-04-30" }),
    agreement("mou-undated", {}),
  ],
  programs: [],
  availability: [],
  opportunities: [],
  documents: [],
  documentLinks: [],
  activities: [
    activity("visit-2025", "2025-02-10", { type: "inbound-visit" }),
    activity("event-2026", "2026-06-01"),
    activity("future", "2026-12-01", { recordStatus: "planned" }),
    activity("cancelled", "2026-01-05", { recordStatus: "cancelled" }),
    activity("japan", "2026-04-01", { institutionId: "uni-b", country: "Japan" }),
  ],
};
const views = createViews(data);
const activityViews = data.activities.map((row) => views.toActivityView(row, today));

describe("university insights", () => {
  const view = views.toInstitutionView(data.institutions[0], today);
  const agreements = views.agreementsForInstitution("uni-a", today);
  const tabs = universityInsights({
    institution: view,
    agreements,
    entry: buildUniversityEntry(view, agreements, { state: "restricted", reason: "test" }, { state: "restricted", reason: "static-source" }),
    activities: activityViews.filter((row) => row.institutionId === "uni-a"),
    offerings: [],
    today,
  });

  it("shows the next expiry from recorded dates and counts MoUs", () => {
    const stats = tabs.find((tab) => tab.id === "overview")?.stats ?? [];
    assert.equal(stats.find((stat) => stat.label === "Next expiry")?.value, "30 Apr 2029");
    assert.match(stats.find((stat) => stat.label === "MoUs")?.value ?? "", /of 3 active/);
  });

  it("draws dated MoUs on the timeline and lists undated ones separately", () => {
    const timeline = tabs.find((tab) => tab.id === "timeline")?.timeline;
    assert.deepEqual(timeline?.bars.map((bar) => bar.id), ["mou-old", "mou-new"]);
    assert.deepEqual(timeline?.undated.map((item) => item.id), ["mou-undated"]);
  });

  it("highlights past events, keeps upcoming ones apart, and drops cancelled ones", () => {
    const events = tabs.find((tab) => tab.id === "events");
    assert.deepEqual(events?.highlights?.map((item) => item.id), ["event-2026", "visit-2025"]);
    assert.deepEqual(events?.items?.map((item) => item.id), ["future"]);
  });
});

describe("flagship event insights", () => {
  it("puts one event in context with its university and country", () => {
    const event = activityViews.find((row) => row.id === "event-2026");
    assert.ok(event);
    const [context] = eventInsights(event, activityViews);
    assert.equal(context.stats?.find((stat) => stat.label === "With this university")?.value, "4 events");
    assert.equal(context.highlights?.some((item) => item.id === "japan"), false);
  });
});
