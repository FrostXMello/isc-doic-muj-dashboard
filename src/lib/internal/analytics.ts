/**
 * Dashboard figures computed from the repository's record views.
 *
 * Pure functions: the dashboard page loads the views once and passes them in,
 * so every figure is a count of rows the signed-in user can read (RLS applies
 * upstream). Nothing is estimated or extrapolated.
 *
 * Metric definitions
 * - Activities: completed = stored as completed; upcoming = planned or
 *   confirmed with a start date today or later; overdue = planned or confirmed
 *   whose last day has passed (`needs-update`); cancelled is counted only in
 *   the total.
 * - Universities, MoUs, programmes, opportunities, documents: records, each
 *   counted once (a multi-party MoU is one MoU).
 * - MoU status: derived status of each MoU. MoUs with no recorded status
 *   (`not-stated`) are reported as "not recorded", never charted as a status.
 */

import type { Views } from "@/lib/internal/data/views";
import { agreementStatusMeta } from "@/lib/internal/status";
import type {
  ActivityView,
  AgreementStatus,
  AgreementView,
  DocumentRecord,
  Institution,
  OpportunityView,
  Program,
} from "@/lib/internal/types";

export type DashboardInput = {
  today: string;
  institutions: readonly Institution[];
  agreements: readonly AgreementView[];
  programs: readonly Program[];
  opportunities: readonly OpportunityView[];
  activities: readonly ActivityView[];
  documents: readonly DocumentRecord[];
};

/** Builds the record views the dashboard needs from one dataset load. */
export function buildDashboardInput(views: Views, today: string): DashboardInput {
  const { data } = views;
  return {
    today,
    institutions: data.institutions,
    agreements: data.agreements.map((row) => views.toAgreementView(row, today)),
    programs: data.programs,
    opportunities: data.opportunities.map((row) => views.toOpportunityView(row, today)),
    activities: data.activities.map((row) => views.toActivityView(row, today)),
    documents: data.documents,
  };
}

const chartedMouStatuses = (Object.keys(agreementStatusMeta) as AgreementStatus[]).filter(
  (status) => status !== "not-stated",
);

export function computeDashboard(input: DashboardInput) {
  const { activities, agreements } = input;

  const upcoming = activities
    .filter((row) => row.daysFromToday >= 0 && (row.status === "planned" || row.status === "confirmed"))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const overdue = activities
    .filter((row) => row.status === "needs-update")
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  const completed = activities.filter((row) => row.status === "completed").length;

  const mouStatus = chartedMouStatuses
    .map((status) => ({ status, count: agreements.filter((row) => row.status === status).length }))
    .filter((row) => row.count > 0);

  return {
    today: input.today,
    activities: {
      total: activities.length,
      completed,
      upcoming,
      overdue,
      cancelled: activities.filter((row) => row.status === "cancelled").length,
    },
    totals: {
      universities: input.institutions.length,
      mous: agreements.length,
      programmes: input.programs.length,
      opportunities: input.opportunities.length,
      documents: input.documents.length,
    },
    mous: {
      total: agreements.length,
      /** MoUs whose status is recorded; the rest are "not recorded". */
      withStatus: mouStatus.reduce((sum, row) => sum + row.count, 0),
      byStatus: mouStatus,
    },
  };
}

export type DashboardData = ReturnType<typeof computeDashboard>;
