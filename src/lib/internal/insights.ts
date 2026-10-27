import type { InsightCount, InsightItem, InsightTab } from "@/components/internal/insights-card";
import { formatDate, formatDateRange, formatRelativeDays } from "@/lib/internal/dates";
import { agreementHref } from "@/lib/internal/links";
import type { UniversityEntry } from "@/lib/internal/register-view";
import { activityStatusMeta, activityTypeLabel, agreementStatusMeta, partnershipStatusMeta } from "@/lib/internal/status";
import type { ActivityView, AgreementView, InstitutionView, ProgramAvailabilityView } from "@/lib/internal/types";

/**
 * Insights cards for a university, the Flagship Events page, and one event.
 * Pure: counts and dates of recorded rows only, nothing estimated.
 */

const eventItem = (row: ActivityView, place = true): InsightItem => ({
  id: row.id,
  title: row.title,
  meta: [
    formatDateRange(row.startDate, row.endDate),
    place ? (row.institution?.name ?? [row.city, row.country].filter(Boolean).join(", ")) : activityTypeLabel[row.type],
  ]
    .filter(Boolean)
    .join(" · "),
  href: `/internal/activities/${row.id}`,
  badge: activityStatusMeta[row.status].label,
  tone: activityStatusMeta[row.status].tone,
});

const latestFirst = (a: ActivityView, b: ActivityView) => b.startDate.localeCompare(a.startDate);
const happened = (row: ActivityView) => row.daysFromToday <= 0 && row.status !== "cancelled";

function countBy<T>(rows: readonly T[], key: (row: T) => string | null): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = key(row);
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

export function universityInsights({
  institution,
  agreements,
  entry,
  activities,
  offerings,
  today,
}: {
  institution: InstitutionView;
  agreements: readonly AgreementView[];
  entry: UniversityEntry;
  activities: readonly ActivityView[];
  offerings: readonly ProgramAvailabilityView[];
  today: string;
}): InsightTab[] {
  const partnership = partnershipStatusMeta[institution.partnershipStatus];
  const upcomingEnds = agreements
    .filter((row) => row.endDate && row.endDate >= today)
    .sort((a, b) => (a.endDate ?? "").localeCompare(b.endDate ?? ""));
  const next = upcomingEnds[0];
  const events = [...activities].sort(latestFirst);
  const lastEvent = events.find(happened);

  const tabs: InsightTab[] = [
    {
      id: "overview",
      label: "Overview",
      stats: [
        { label: "Partnership", value: partnership.label, tone: partnership.tone },
        {
          label: "MoUs",
          value: `${institution.activeAgreementCount} of ${agreements.length} active`,
          hint: agreements.length === 1 ? "1 recorded" : `${agreements.length} recorded`,
        },
        next?.endDate
          ? {
              label: "Next expiry",
              value: formatDate(next.endDate),
              hint: `Ends ${formatRelativeDays(next.daysToExpiry ?? 0)}`,
              tone: agreementStatusMeta[next.status].tone,
              href: agreementHref(next),
            }
          : { label: "Next expiry", value: "None upcoming" },
        { label: "QS 2027", value: entry.qsRankings[0] ?? "Not ranked" },
        {
          label: "Department",
          value: entry.departments.slice(0, 2).join(", ") || "Not recorded",
          hint: entry.departments.length > 2 ? `+${entry.departments.length - 2} more` : (entry.faculties.join(", ") || undefined),
        },
        {
          label: "Flagship events",
          value: String(activities.length),
          hint: lastEvent ? `Last: ${formatDate(lastEvent.startDate)}` : undefined,
          href: activities.length ? `/internal/activities?q=${encodeURIComponent(institution.name)}` : undefined,
        },
      ],
    },
  ];

  if (agreements.length > 0) {
    tabs.push({
      id: "timeline",
      label: "Timeline",
      timeline: {
        today,
        bars: agreements
          .filter((row) => row.startDate)
          .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))
          .map((row) => ({
            id: row.id,
            label: row.typeLabel ?? row.title,
            meta: `${formatDateRange(row.startDate, row.endDate)} · ${agreementStatusMeta[row.status].label}`,
            start: row.startDate as string,
            end: row.endDate,
            href: agreementHref(row),
            tone: agreementStatusMeta[row.status].tone,
          })),
        undated: agreements
          .filter((row) => !row.startDate)
          .map((row) => ({ id: row.id, title: row.reference, meta: "", href: agreementHref(row) })),
      },
    });
  }

  tabs.push({
    id: "events",
    label: "Events",
    highlights: events.filter(happened).slice(0, 6).map((row) => ({ ...eventItem(row, false), badge: activityTypeLabel[row.type] })),
    items: events.filter((row) => !happened(row) && row.status !== "cancelled").slice(0, 3).map((row) => eventItem(row, false)),
    empty: "No flagship events recorded with this university yet.",
  });

  if (offerings.length > 0) {
    tabs.push({
      id: "programmes",
      label: "Programmes",
      items: offerings.map((row) => ({
        id: row.id,
        title: row.program.name,
        meta: [row.duration, row.intake].filter(Boolean).join(" · ") || "Details not recorded",
        href: `/internal/programs/${row.id}`,
      })),
    });
  }
  return tabs;
}

export function eventsInsights(activities: readonly ActivityView[], today: string): InsightTab[] {
  const thisYear = today.slice(0, 4);
  const sorted = [...activities].sort(latestFirst);
  const top = (counts: Map<string, number>, limit: number) =>
    [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);

  const byYear: InsightCount[] = [...countBy(activities, (row) => row.startDate.slice(0, 4))]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([label, count]) => ({ label, count }));
  const byType: InsightCount[] = top(countBy(activities, (row) => row.type), 10).map(([type, count]) => ({
    label: activityTypeLabel[type as ActivityView["type"]],
    count,
    href: `/internal/activities?type=${type}`,
  }));
  const names = new Map(activities.flatMap((row) => (row.institution ? [[row.institution.id, row.institution.name] as const] : [])));
  const byPartner: InsightCount[] = top(countBy(activities, (row) => row.institution?.id ?? null), 6).map(([id, count]) => ({
    label: names.get(id) ?? id,
    count,
    href: `/internal/universities/${id}`,
  }));
  const byCountry = countBy(activities, (row) => row.country);

  return [
    {
      id: "highlights",
      label: "Highlights",
      stats: [
        { label: "Events", value: String(activities.length), href: "/internal/activities" },
        { label: `In ${thisYear}`, value: String(activities.filter((row) => row.startDate.startsWith(thisYear)).length) },
        {
          label: "Upcoming",
          value: String(activities.filter((row) => row.daysFromToday > 0 && row.status !== "cancelled").length),
          href: "/internal/activities?when=upcoming",
        },
        { label: "Countries", value: String(byCountry.size) },
      ],
      highlights: sorted.filter(happened).slice(0, 8).map((row) => ({ ...eventItem(row), badge: activityTypeLabel[row.type] })),
      empty: "No flagship events recorded yet.",
    },
    { id: "years", label: "By year", counts: byYear },
    { id: "types", label: "By type", counts: byType },
    ...(byPartner.length > 0 ? [{ id: "partners", label: "Partners", counts: byPartner }] : []),
  ];
}

export function eventInsights(activity: ActivityView, all: readonly ActivityView[]): InsightTab[] {
  const others = all.filter((row) => row.id !== activity.id);
  const samePartner = activity.institution ? others.filter((row) => row.institution?.id === activity.institution?.id) : [];
  const sameCountry = others.filter((row) => row.country === activity.country);
  const related = [...new Map([...samePartner, ...sameCountry].map((row) => [row.id, row])).values()].sort(latestFirst);

  return [
    {
      id: "context",
      label: "In context",
      stats: [
        {
          label: activity.daysFromToday > 0 ? "Starts" : "Took place",
          value: formatRelativeDays(activity.daysFromToday),
          hint: formatDateRange(activity.startDate, activity.endDate),
          tone: activityStatusMeta[activity.status].tone,
        },
        ...(activity.institution
          ? [
              {
                label: "With this university",
                value: `${samePartner.length + 1} event${samePartner.length ? "s" : ""}`,
                hint: activity.institution.name,
                href: `/internal/universities/${activity.institution.id}`,
              },
            ]
          : []),
        { label: `In ${activity.country}`, value: `${sameCountry.length + 1} event${sameCountry.length ? "s" : ""}` },
      ],
      highlights: related.filter(happened).slice(0, 5).map((row) => ({ ...eventItem(row), badge: "Related event" })),
      items: related.filter((row) => !happened(row) && row.status !== "cancelled").slice(0, 3).map((row) => eventItem(row)),
    },
  ];
}
