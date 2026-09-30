import { openDataContext } from "@/lib/internal/data/context";
import { activityStatuses, activityTypes } from "@/lib/internal/data/activities";
import { agreementStatuses, agreementTypes } from "@/lib/internal/data/agreements";
import { documentStatuses, documentTypes } from "@/lib/internal/data/documents";
import { partnershipStatuses } from "@/lib/internal/data/institutions";
import { opportunityStatuses } from "@/lib/internal/data/opportunities";
import { availabilityFilters } from "@/lib/internal/data/programs";
import type { RecordSource, VerificationStatus } from "@/lib/internal/types";
import { officialRegions } from "@/lib/official/countries";

function countBy<K extends string, T>(keys: readonly K[], rows: readonly T[], pick: (row: T) => K) {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
  for (const row of rows) counts[pick(row)] += 1;
  return counts;
}

const regions = officialRegions;
const sources: readonly RecordSource[] = ["official", "directory", "sample"];
const verifications: readonly VerificationStatus[] = [
  "source-imported",
  "needs-review",
  "unverified",
  "verified",
];

/**
 * Operational summary computed from the repository rows.
 * Every figure is a count of records in the data layer, not an official total.
 */
export async function getOperationalSummary() {
  const { today, data, views } = await openDataContext();
  const institutions = data.institutions.map((row) => views.toInstitutionView(row, today));
  const agreements = data.agreements.map((row) => views.toAgreementView(row, today));
  const opportunities = data.opportunities.map((row) => views.toOpportunityView(row, today));
  const activities = data.activities.map((row) => views.toActivityView(row, today));
  const documents = data.documents.map(views.toDocumentView);

  const byRegion = regions.map((region) => {
    const inRegion = institutions.filter((row) => row.region === region);
    return {
      region,
      institutions: inRegion.length,
      countries: new Set(inRegion.map((row) => row.country)).size,
      withAgreements: inRegion.filter((row) => row.agreementCount > 0).length,
    };
  });

  return {
    today,
    institutions: {
      total: institutions.length,
      countries: new Set(institutions.map((row) => row.country)).size,
      public: institutions.filter((row) => row.isPublic && row.source === "official").length,
      bySource: countBy(sources, institutions, (row) => row.source as (typeof sources)[number]),
      byVerification: countBy(verifications, institutions, (row) => row.verification),
      byPartnership: countBy(partnershipStatuses, institutions, (row) => row.partnershipStatus),
      byRegion,
    },
    agreements: {
      total: agreements.length,
      byStatus: countBy(agreementStatuses, agreements, (row) => row.status),
      byType: countBy(agreementTypes, agreements, (row) => row.type),
      byVerification: countBy(verifications, agreements, (row) => row.verification),
      expiringSoon: agreements
        .filter((row) => row.status === "expiring-soon")
        .sort((a, b) => (a.endDate ?? "").localeCompare(b.endDate ?? "")),
    },
    programs: {
      total: data.programs.length,
      offerings: data.availability.length,
      byProgram: data.programs.map((program) => {
        const rows = data.availability.filter((row) => row.programId === program.id);
        return {
          program,
          total: rows.length,
          byAvailability: countBy(availabilityFilters, rows, (row) => row.availability ?? "not-recorded"),
        };
      }),
      byAvailability: countBy(
        availabilityFilters,
        data.availability,
        (row) => row.availability ?? "not-recorded",
      ),
    },
    opportunities: {
      total: opportunities.length,
      byStatus: countBy(opportunityStatuses, opportunities, (row) => row.status),
      closingSoon: opportunities
        .filter((row) => row.status === "closing-soon" || row.status === "open")
        .sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999")),
    },
    activities: {
      total: activities.length,
      byStatus: countBy(activityStatuses, activities, (row) => row.status),
      byType: countBy(activityTypes, activities, (row) => row.type),
      upcoming: activities
        .filter((row) => row.daysFromToday >= 0 && row.status !== "cancelled")
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
      recent: activities
        .filter((row) => row.daysFromToday < 0)
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    },
    documents: {
      total: documents.length,
      byStatus: countBy(documentStatuses, documents, (row) => row.status),
      byType: countBy(documentTypes, documents, (row) => row.type),
      unlinked: documents.filter((row) => row.links.length === 0).length,
      withFile: documents.filter((row) => row.storageKey !== null).length,
      withLink: documents.filter((row) => row.url !== null).length,
      publiclyAccessible: documents.filter((row) => row.publiclyAccessible).length,
    },
  };
}

export type OperationalSummary = Awaited<ReturnType<typeof getOperationalSummary>>;
