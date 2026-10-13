import { EXPIRY_WARNING_DAYS } from "@/lib/internal/dates";
import { agreementStatusMeta, type Tone } from "@/lib/internal/status";
import type { AgreementStatus } from "@/lib/internal/types";

/**
 * The expiry shown for a university in the list.
 *
 * Rules:
 *  - Only an end date stored on the agreement is used. An expiry is never
 *    worked out from a signing date plus a period.
 *  - The nearest end date among agreements in force (active or expiring
 *    soon) wins; "expiring soon" means within EXPIRY_WARNING_DAYS, today
 *    included.
 *  - Otherwise the most recent end date that has passed is shown.
 *  - An agreement whose register record disagrees with its dates (recorded
 *    "Active" after its end date, a renewal year after the end date, or
 *    recorded "Expired" while still in force) is flagged for review rather
 *    than presented as settled.
 */

export type ExpiryAgreement = {
  id: string;
  status: AgreementStatus;
  endDate: string | null;
  daysToExpiry: number | null;
  /** Status word as written in the DoIC register, if any. */
  recordedStatus?: string | null;
  renewalYear?: number | null;
};

export type ExpirySummary =
  | {
      kind: "dated";
      agreementId: string;
      endDate: string;
      status: AgreementStatus;
      label: string;
      tone: Tone;
      days: number;
      /** Other agreements recorded for the same university. */
      others: number;
      review: string | null;
    }
  | { kind: "open-ended"; others: number }
  | { kind: "none"; others: number };

const IN_FORCE: ReadonlySet<AgreementStatus> = new Set(["active", "expiring-soon"]);

/** Why the register and the dates disagree, or null when they agree. */
export function expiryConflict(agreement: ExpiryAgreement): string | null {
  const recorded = agreement.recordedStatus?.trim().toLowerCase() ?? null;
  const endYear = agreement.endDate ? Number(agreement.endDate.slice(0, 4)) : null;
  if (agreement.status === "expired") {
    if (agreement.renewalYear && endYear && agreement.renewalYear >= endYear) {
      return `The register records a renewal in ${agreement.renewalYear}; confirm the renewed term and update the end date.`;
    }
    if (recorded === "active") {
      return "The register records this agreement as Active, but its end date has passed. Confirm whether it was renewed.";
    }
  }
  if (IN_FORCE.has(agreement.status) && (recorded === "expired" || recorded === "closed")) {
    return `The register records this agreement as ${agreement.recordedStatus?.trim()}, but its end date is still ahead.`;
  }
  return null;
}

export function summarizeExpiry(agreements: readonly ExpiryAgreement[]): ExpirySummary {
  const dated = agreements.filter(
    (agreement): agreement is ExpiryAgreement & { endDate: string; daysToExpiry: number } =>
      agreement.endDate !== null &&
      agreement.daysToExpiry !== null &&
      (IN_FORCE.has(agreement.status) || agreement.status === "expired"),
  );
  const live = dated.filter((agreement) => IN_FORCE.has(agreement.status)).sort((a, b) => a.endDate.localeCompare(b.endDate));
  const ended = dated
    .filter((agreement) => agreement.status === "expired")
    .sort((a, b) => b.endDate.localeCompare(a.endDate));
  const shown = live[0] ?? ended[0];
  const others = Math.max(0, agreements.length - 1);

  if (!shown) {
    const openEnded = agreements.some((agreement) => agreement.status === "active" && agreement.endDate === null);
    return { kind: openEnded ? "open-ended" : "none", others };
  }
  const meta = agreementStatusMeta[shown.status];
  return {
    kind: "dated",
    agreementId: shown.id,
    endDate: shown.endDate,
    status: shown.status,
    label: meta.label,
    tone: meta.tone,
    days: shown.daysToExpiry,
    others,
    review: expiryConflict(shown),
  };
}

/** Sort key: soonest expiry first, then past expiries, then undated. */
export function expirySortKey(summary: ExpirySummary) {
  if (summary.kind !== "dated") return [2, 0] as const;
  return summary.status === "expired" ? ([1, -summary.days] as const) : ([0, summary.days] as const);
}

export const EXPIRY_LEGEND: readonly { label: string; tone: Tone; description: string }[] = [
  { label: "Active", tone: "positive", description: "in force" },
  { label: "Expiring soon", tone: "warning", description: `ends within ${EXPIRY_WARNING_DAYS} days` },
  { label: "Expired", tone: "danger", description: "end date has passed" },
];
