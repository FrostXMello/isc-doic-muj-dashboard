import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type EventParticipant, participantInsights, uniquePeople } from "@/lib/internal/participants";

const person = (id: string, name: string, extra: Partial<EventParticipant> = {}): EventParticipant => ({
  id,
  name,
  email: null,
  gender: null,
  category: null,
  institution: null,
  partnerId: null,
  country: null,
  course: null,
  mode: null,
  qualification: null,
  ...extra,
});

const rows = [
  person("1", "Asha Rao", { institution: "Manipal University Jaipur", country: "India", course: "A", gender: "Female", category: "Student" }),
  person("2", "Ms. Asha Rao", { institution: "Manipal University Jaipur", country: "India", course: "B", gender: "Female", category: "Student" }),
  person("3", "Ion Popescu", { institution: "Partner U", partnerId: "ofc-partner", country: "Romania", course: "A", gender: "Male" }),
  person("4", "Kiran Das", { institution: "Other College", course: "A" }),
];

describe("participants", () => {
  it("counts a person once across courses and titles", () => {
    assert.equal(uniquePeople(rows).length, 3);
  });

  it("summarises people, institutions, and international participants", () => {
    const [summary] = participantInsights(rows);
    const stat = (label: string) => summary.stats?.find((row) => row.label === label);
    assert.equal(stat("Participants")?.value, "3");
    assert.equal(stat("Participants")?.hint, "4 course enrolments");
    assert.equal(stat("Institutions")?.value, "3");
    assert.equal(stat("From MUJ")?.value, "1");
    assert.equal(stat("International")?.value, "1");
    assert.equal(stat("International")?.hint, "1 from partner universities");
  });

  it("counts enrolments per course and lists missing values last", () => {
    const tabs = participantInsights(rows);
    assert.deepEqual(tabs.find((tab) => tab.id === "courses")?.counts, [
      { label: "A", count: 3 },
      { label: "B", count: 1 },
    ]);
    assert.deepEqual(tabs.find((tab) => tab.id === "countries")?.counts?.at(-1), { label: "Not recorded", count: 1 });
  });

  it("has no tabs without participants", () => {
    assert.deepEqual(participantInsights([]), []);
  });
});
