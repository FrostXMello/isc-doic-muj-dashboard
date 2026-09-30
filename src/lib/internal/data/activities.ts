import { matchesQuery, openDataContext, uniqueSorted } from "@/lib/internal/data/context";
import { activitySeed, documentsLinkedTo, toActivityView } from "@/lib/internal/data/views";
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
  const { today } = await openDataContext();
  const rows = activitySeed
    .map((row) => toActivityView(row, today))
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
  return { countries: uniqueSorted(activitySeed.map((row) => row.country)) };
}

export async function getActivity(id: string) {
  const { today } = await openDataContext();
  const activity = activitySeed.find((row) => row.id === id);
  if (!activity) return null;
  return {
    activity: toActivityView(activity, today),
    documents: activity.agreementId ? documentsLinkedTo({ agreementId: activity.agreementId }) : [],
  };
}
