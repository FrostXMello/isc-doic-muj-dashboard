import type { InsightCount, InsightTab } from "@/components/internal/insights-card";

/**
 * Summer and winter school participants (public.event_participants), one row
 * per participant and course. Pure helpers: counting and grouping only;
 * missing values are reported as not recorded, never guessed.
 */

export type EventParticipant = {
  id: string;
  name: string;
  email: string | null;
  gender: string | null;
  category: string | null;
  institution: string | null;
  /** Partner university slug when the home institution is a partner. */
  partnerId: string | null;
  country: string | null;
  course: string | null;
  mode: string | null;
  qualification: string | null;
};

/** Where each event's list came from, shown with the list. */
export const participantSources: Record<string, string> = {
  "act-iwsmuj-2021": "Paid registrations, excluding refunds (Winter School 2021 sheet)",
  "act-iwsmuj-2022": "Complete participant list (IWSMUJ 2022 details sheet)",
  "act-issmuj-2022": "Participation certificates issued, with details from the registration list",
  "act-iwsmuj-2023": "List of participants (IWSMUJ 2023)",
  "act-issmuj-2023": "Course-wise registrations (ISSMUJ 2023 details sheet)",
  "act-issmuj-2024": "Students who cleared, from the transcripts sheet",
  "act-issmuj-2025": "Participation certificates issued, with details from registrations",
  "act-issmuj-2026": "Final course-wise student list",
};

const HOST = "Manipal University Jaipur";
const NOT_RECORDED = "Not recorded";

const personKey = (name: string) =>
  name
    .toLowerCase()
    .replace(/^(mr|ms|mrs|dr|prof)\.?\s+/, "")
    .replace(/[^a-z]/g, "");

/** Distinct people: a participant who took two courses counts once. */
export function uniquePeople(rows: readonly EventParticipant[]) {
  const seen = new Map<string, EventParticipant>();
  for (const row of rows) if (!seen.has(personKey(row.name))) seen.set(personKey(row.name), row);
  return [...seen.values()];
}

function tally(values: readonly (string | null)[], limit = 8): InsightCount[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value ?? NOT_RECORDED, (counts.get(value ?? NOT_RECORDED) ?? 0) + 1);
  const sorted = [...counts.entries()]
    .sort((a, b) => (a[0] === NOT_RECORDED ? 1 : b[0] === NOT_RECORDED ? -1 : b[1] - a[1] || a[0].localeCompare(b[0])))
    .map(([label, count]) => ({ label, count }));
  if (sorted.length <= limit) return sorted;
  const rest = sorted.slice(limit - 1).reduce((sum, row) => sum + row.count, 0);
  return [...sorted.slice(0, limit - 1), { label: `${sorted.length - limit + 1} others`, count: rest }];
}

const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : "—");

export function participantInsights(rows: readonly EventParticipant[]): InsightTab[] {
  if (rows.length === 0) return [];
  const people = uniquePeople(rows);
  const institutions = new Set(people.map((row) => row.institution).filter(Boolean));
  const countries = new Set(people.map((row) => row.country).filter(Boolean));
  const fromHost = people.filter((row) => row.institution === HOST).length;
  const international = people.filter((row) => row.country && row.country !== "India").length;
  const partners = people.filter((row) => row.partnerId).length;
  const courses = new Set(rows.map((row) => row.course).filter(Boolean));

  return [
    {
      id: "participants",
      label: "Participants",
      stats: [
        {
          label: "Participants",
          value: String(people.length),
          hint: rows.length > people.length ? `${rows.length} course enrolments` : undefined,
        },
        { label: "Institutions", value: String(institutions.size) },
        { label: "Countries", value: countries.size ? String(countries.size) : NOT_RECORDED },
        { label: "From MUJ", value: `${fromHost}`, hint: pct(fromHost, people.length) },
        { label: "From outside MUJ", value: `${people.length - fromHost}`, hint: pct(people.length - fromHost, people.length) },
        {
          label: "International",
          value: String(international),
          hint: partners ? `${partners} from partner universities` : "Outside India",
        },
      ],
    },
    { id: "institutions", label: "Institutions", counts: tally(people.map((row) => row.institution)) },
    { id: "countries", label: "Countries", counts: tally(people.map((row) => row.country)) },
    {
      id: "courses",
      label: courses.size === 1 ? "Course" : "Courses",
      counts: tally(rows.map((row) => row.course), 10),
    },
    {
      id: "profile",
      label: "Profile",
      stats: [
        ...tally(people.map((row) => row.category), 3).map((row) => ({ label: row.label, value: String(row.count), hint: pct(row.count, people.length) })),
        ...tally(people.map((row) => row.mode), 3).map((row) => ({
          label: row.label === NOT_RECORDED ? "Mode not recorded" : `${row.label} mode`,
          value: String(row.count),
        })),
      ],
      counts: tally(people.map((row) => row.gender), 4),
    },
  ];
}
