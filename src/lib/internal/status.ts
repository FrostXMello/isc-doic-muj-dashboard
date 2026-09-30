import {
  DEADLINE_WARNING_DAYS,
  EXPIRY_WARNING_DAYS,
  daysBetween,
} from "@/lib/internal/dates";
import type {
  Activity,
  ActivityStatus,
  ActivityType,
  Agreement,
  AgreementStatus,
  AgreementType,
  AvailabilityState,
  DocumentStatus,
  DocumentType,
  Opportunity,
  OpportunityStatus,
  PartnershipStatus,
  ProgramType,
  RecordSource,
  VerificationStatus,
} from "@/lib/internal/types";

export type Tone = "positive" | "warning" | "danger" | "info" | "neutral" | "muted";

type StatusMeta = { label: string; tone: Tone };

/** Builds select options from an ordered key list and a label or meta map. */
export function optionsFrom<K extends string>(
  keys: readonly K[],
  labels: Record<K, string | StatusMeta>,
) {
  return keys.map((key) => {
    const entry = labels[key];
    return { value: key, label: typeof entry === "string" ? entry : entry.label };
  });
}

export function deriveAgreementStatus(agreement: Agreement, today: string): AgreementStatus {
  switch (agreement.recordStatus) {
    case "draft":
    case "under-review":
    case "terminated":
    case "not-stated":
      return agreement.recordStatus;
    case "signed": {
      if (agreement.startDate && daysBetween(today, agreement.startDate) > 0) {
        return "pending-start";
      }
      if (agreement.endDate) {
        const remaining = daysBetween(today, agreement.endDate);
        if (remaining < 0) return "expired";
        if (remaining <= EXPIRY_WARNING_DAYS) return "expiring-soon";
      }
      return "active";
    }
  }
}

export function deriveOpportunityStatus(
  opportunity: Opportunity,
  today: string,
): OpportunityStatus {
  if (opportunity.recordStatus !== "published") return opportunity.recordStatus;
  if (opportunity.opensOn && daysBetween(today, opportunity.opensOn) > 0) return "upcoming";
  if (opportunity.deadline) {
    const remaining = daysBetween(today, opportunity.deadline);
    if (remaining < 0) return "closed";
    if (remaining <= DEADLINE_WARNING_DAYS) return "closing-soon";
  }
  return "open";
}

export function deriveActivityStatus(activity: Activity, today: string): ActivityStatus {
  const last = activity.endDate ?? activity.startDate;
  if (
    (activity.recordStatus === "planned" || activity.recordStatus === "confirmed") &&
    daysBetween(today, last) < 0
  ) {
    return "needs-update";
  }
  return activity.recordStatus;
}

/**
 * Summarises an institution's agreements into one relationship status.
 * Rows without a stated status say nothing about activity, so an institution
 * whose rows are all `not-stated` is only "listed", never "active".
 */
export function derivePartnershipStatus(all: readonly AgreementStatus[]): PartnershipStatus {
  if (all.length === 0) return "not-recorded";
  const statuses = all.filter((status) => status !== "not-stated");
  if (statuses.length === 0) return "listed";
  if (statuses.includes("expiring-soon")) return "renewal-due";
  if (statuses.includes("active")) return "active";
  if (
    statuses.includes("pending-start") ||
    statuses.includes("draft") ||
    statuses.includes("under-review")
  ) {
    return "in-progress";
  }
  return "lapsed";
}

export const agreementStatusMeta: Record<AgreementStatus, StatusMeta> = {
  draft: { label: "Draft", tone: "muted" },
  "under-review": { label: "Under review", tone: "info" },
  "pending-start": { label: "Signed · not started", tone: "info" },
  active: { label: "Active", tone: "positive" },
  "expiring-soon": { label: "Expiring soon", tone: "warning" },
  expired: { label: "Expired", tone: "danger" },
  terminated: { label: "Terminated", tone: "neutral" },
  "not-stated": { label: "Status not stated", tone: "muted" },
};

export const agreementTypeLabel: Record<AgreementType, string> = {
  mou: "Memorandum of Understanding",
  "student-exchange": "Student Exchange Agreement",
  "agreement-of-cooperation": "Agreement of Cooperation",
  addendum: "Addendum",
  "academic-agreement": "Academic Agreement",
  "research-collaboration": "Research collaboration",
  "dual-degree": "Dual degree agreement",
  other: "Other agreement",
  "not-stated": "Type not stated",
};

export const partnershipStatusMeta: Record<PartnershipStatus, StatusMeta> = {
  active: { label: "Active agreement", tone: "positive" },
  "renewal-due": { label: "Renewal due", tone: "warning" },
  "in-progress": { label: "Agreement in progress", tone: "info" },
  lapsed: { label: "Agreement lapsed", tone: "danger" },
  listed: { label: "Listed on official page", tone: "info" },
  "not-recorded": { label: "No agreement recorded", tone: "muted" },
};

export const verificationMeta: Record<VerificationStatus, StatusMeta & { description: string }> = {
  unverified: {
    label: "Unverified",
    tone: "muted",
    description: "Not yet checked against a source.",
  },
  "source-imported": {
    label: "Source-imported",
    tone: "info",
    description: "Copied from the linked official page; not confirmed against the signed document.",
  },
  "needs-review": {
    label: "Needs review",
    tone: "warning",
    description: "The source is unclear, conflicting, or missing; DoIC staff should confirm.",
  },
  verified: {
    label: "Verified",
    tone: "positive",
    description: "Confirmed by DoIC staff against the signed document.",
  },
};

export const availabilityMeta: Record<AvailabilityState | "not-recorded", StatusMeta> = {
  open: { label: "Open", tone: "positive" },
  closed: { label: "Closed", tone: "neutral" },
  suspended: { label: "Suspended", tone: "danger" },
  "not-recorded": { label: "Not recorded", tone: "muted" },
};

export const programTypeLabel: Record<ProgramType, string> = {
  "student-exchange": "Student Exchange",
  "semester-exchange": "Semester Exchange",
  "pathway-programs": "Pathway Programs",
  "academic-visits": "Academic Visits",
  "dual-degree": "Dual Degree",
  "summer-winter-school": "Summer/Winter School",
};

export const opportunityStatusMeta: Record<OpportunityStatus, StatusMeta> = {
  draft: { label: "Draft", tone: "muted" },
  upcoming: { label: "Opens soon", tone: "info" },
  open: { label: "Open", tone: "positive" },
  "closing-soon": { label: "Closing soon", tone: "warning" },
  closed: { label: "Closed", tone: "neutral" },
  archived: { label: "Archived", tone: "muted" },
};

export const documentTypeLabel: Record<DocumentType, string> = {
  agreement: "Agreement",
  brochure: "Brochure",
  "programme-guide": "Programme guide",
  policy: "Policy",
  report: "Report",
  form: "Form",
  newsletter: "Newsletter",
  other: "Other",
};

export const documentStatusMeta: Record<DocumentStatus, StatusMeta> = {
  draft: { label: "Draft", tone: "muted" },
  "under-review": { label: "Under review", tone: "info" },
  final: { label: "Final", tone: "positive" },
  archived: { label: "Archived", tone: "neutral" },
};

export const activityTypeLabel: Record<ActivityType, string> = {
  "inbound-visit": "Inbound visit",
  "outbound-visit": "Outbound visit",
  delegation: "Delegation",
  event: "Event",
  "virtual-meeting": "Virtual meeting",
};

export const activityStatusMeta: Record<ActivityStatus, StatusMeta> = {
  planned: { label: "Planned", tone: "info" },
  confirmed: { label: "Confirmed", tone: "positive" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
  "needs-update": { label: "Needs update", tone: "warning" },
};

export const sourceMeta: Record<RecordSource, { label: string; description: string }> = {
  directory: {
    label: "Earlier directory",
    description:
      "A name from this platform's earlier illustrative directory that is not on the official MUJ partner page. Hidden from the public site until DoIC confirms it.",
  },
  "programme-catalogue": {
    label: "Programme catalogue",
    description: "Derived from the programme categories published on the public site.",
  },
  sample: {
    label: "Sample data",
    description:
      "Fictional placeholder record for demonstrating the workflow. Not a DoIC record.",
  },
  official: {
    label: "Official MUJ source",
    description:
      "Taken from an official MUJ Internationalization page (linked on the record) or entered by DoIC staff.",
  },
};
