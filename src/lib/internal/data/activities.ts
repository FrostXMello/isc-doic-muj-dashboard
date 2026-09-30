import { matchesQuery, openDataContext, uniqueSorted } from "@/lib/internal/data/context";
import type { ActivityStatus, ActivityType } from "@/lib/internal/types";

export const activityTypes: readonly ActivityType[] = [
  "inbound-visit",
  "outbound-visit",
  "delegation",
  "event",
  "virtual-meeting",
];

export const activityStatuses: readonly ActivityStatus[] = [
  "planned",
  "confirmed",
  "needs-update",
  "completed",
  "cancelled",
];

export const activityTimeframes = ["upcoming", "past"] as const;
export type ActivityTimeframe = (typeof activityTimeframes)[number];

export type ActivityFilters = {
  q?: string;
  type?: ActivityType;
  status?: ActivityStatus;
  country?: string;
  timeframe?: ActivityTimeframe;
};

export async function listActivities(filters: ActivityFilters = {}) {
  const { today, data, views } = await openDataContext();
  const rows = data.activities
    .map((row) => views.toActivityView(row, today))
    .filter(
      (row) =>
        matchesQuery(filters.q, row.title, row.summary, row.institution?.name, row.country, row.city) &&
        (!filters.type || row.type === filters.type) &&
        (!filters.status || row.status === filters.status) &&
        (!filters.country || row.country === filters.country) &&
        (!filters.timeframe ||
          (filters.timeframe === "upcoming" ? row.daysFromToday >= 0 : row.daysFromToday < 0)),
    );
  return filters.timeframe === "upcoming"
    ? rows.sort((a, b) => a.startDate.localeCompare(b.startDate))
    : rows.sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export async function getActivityFilterOptions() {
  const { data } = await openDataContext();
  return { countries: uniqueSorted(data.activities.map((row) => row.country)) };
}

export async function getActivity(id: string) {
  const { today, data, views } = await openDataContext();
  const activity = data.activities.find((row) => row.id === id);
  if (!activity) return null;
  return {
    activity: views.toActivityView(activity, today),
    documents: activity.agreementId
      ? views.documentsLinkedTo({ agreementId: activity.agreementId })
      : [],
  };
}
