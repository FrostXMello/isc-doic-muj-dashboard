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
 * - MoU completeness: how many MoUs have a status, an end date, and an
 *   agreement type recorded. Missing values are reported as missing, never
 *   filled in; statuses are listed only where recorded.
 * - Regions: universities by the region of their country, each counted once.
 */

import type { Views } from "@/lib/internal/data/views";
import { agreementStatusMeta } from "@/lib/internal/status";
import type {
  ActivityView,
  AgreementStatus,
  AgreementView,
  DocumentView,
  InstitutionView,
  OpportunityView,
  Program,
} from "@/lib/internal/types";
import { officialRegions } from "@/lib/official/countries";

export type DashboardInput = {
  today: string;
  institutions: readonly InstitutionView[];
  agreements: readonly AgreementView[];
  programs: readonly Program[];
  opportunities: readonly OpportunityView[];
  activities: readonly ActivityView[];
  documents: readonly DocumentView[];
};

/** Builds the record views the dashboard needs from one dataset load. */
export function buildDashboardInput(views: Views, today: string): DashboardInput {
  const { data } = views;
  return {
    today,
    institutions: data.institutions.map((row) => views.toInstitutionView(row, today)),
    agreements: data.agreements.map((row) => views.toAgreementView(row, today)),
    programs: data.programs,
    opportunities: data.opportunities.map((row) => views.toOpportunityView(row, today)),
    activities: data.activities.map((row) => views.toActivityView(row, today)),
    documents: data.documents.map(views.toDocumentView),
  };
}

const recordedMouStatuses = (Object.keys(agreementStatusMeta) as AgreementStatus[]).filter(
  (status) => status !== "not-stated",
);

export function computeDashboard(input: DashboardInput) {
  const { activities, agreements, institutions, opportunities, documents } = input;

  const upcoming = activities
    .filter((row) => row.daysFromToday >= 0 && (row.status === "planned" || row.status === "confirmed"))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const overdue = activities
    .filter((row) => row.status === "needs-update")
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  const completed = activities
    .filter((row) => row.status === "completed")
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const byStatus = recordedMouStatuses
    .map((status) => ({ status, count: agreements.filter((row) => row.status === status).length }))
    .filter((row) => row.count > 0);

  const attention = [
    {
      key: "directory",
      label: "Universities awaiting review",
      count: institutions.filter((row) => row.source === "directory").length,
      href: "/internal/universities?source=directory",
    },
    {
      key: "no-mou",
      label: "Universities with no MoU",
      count: institutions.filter((row) => row.agreementCount === 0).length,
      href: "/internal/universities?coverage=without",
    },
    {
      key: "no-deadline",
      label: "Opportunities without a deadline",
      count: opportunities.filter((row) => row.deadline === null).length,
      href: "/internal/programs?tab=opportunities",
    },
    {
      key: "unlinked",
      label: "Documents not linked to a record",
      count: documents.filter((row) => row.links.length === 0).length,
      href: "/internal/documents?linked=unlinked",
    },
  ].filter((row) => row.count > 0);

  const byCountry = new Map<string, number>();
  for (const row of institutions) byCountry.set(row.country, (byCountry.get(row.country) ?? 0) + 1);

  return {
    today: input.today,
    totals: {
      universities: institutions.length,
      mous: agreements.length,
      programmes: input.programs.length,
      opportunities: opportunities.length,
      documents: documents.length,
    },
    activities: {
      total: activities.length,
      completed,
      upcoming,
      overdue,
      cancelled: activities.filter((row) => row.status === "cancelled").length,
    },
    mous: {
      total: agreements.length,
      completeness: [
        { key: "status", label: "Status", recorded: agreements.filter((row) => row.status !== "not-stated").length },
        { key: "end-date", label: "End date", recorded: agreements.filter((row) => row.endDate !== null).length },
        { key: "type", label: "Agreement type", recorded: agreements.filter((row) => row.type !== "not-stated").length },
      ],
      /** Only statuses that are recorded on at least one MoU. */
      byStatus,
    },
    attention,
    regions: {
      byRegion: officialRegions
        .map((region) => ({ region, universities: institutions.filter((row) => row.region === region).length }))
        .filter((row) => row.universities > 0)
        .sort((a, b) => b.universities - a.universities),
      countries: byCountry.size,
      topCountries: [...byCountry.entries()]
        .map(([country, universities]) => ({ country, universities }))
        .sort((a, b) => b.universities - a.universities || a.country.localeCompare(b.country))
        .slice(0, 5),
    },
  };
}

export type DashboardData = ReturnType<typeof computeDashboard>;
