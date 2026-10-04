import { StatusBadge } from "@/components/internal/ui/status-badge";
import { formatRelativeDays } from "@/lib/internal/dates";
import {
  activityStatusMeta,
  agreementStatusMeta,
  audienceMeta,
  availabilityMeta,
  documentStatusMeta,
  opportunityStatusMeta,
  partnershipStatusMeta,
  programAudience,
} from "@/lib/internal/status";
import type {
  ActivityStatus,
  AgreementStatus,
  AvailabilityState,
  DocumentStatus,
  OpportunityStatus,
  PartnershipStatus,
  ProgramType,
} from "@/lib/internal/types";

export function AgreementStatusBadge({
  status,
  daysToExpiry,
}: {
  status: AgreementStatus;
  daysToExpiry?: number | null;
}) {
  const meta = agreementStatusMeta[status];
  const title =
    daysToExpiry === null || daysToExpiry === undefined
      ? undefined
      : daysToExpiry < 0
        ? `Ended ${formatRelativeDays(daysToExpiry)}`
        : `Ends ${formatRelativeDays(daysToExpiry)}`;
  return <StatusBadge label={meta.label} tone={meta.tone} title={title} />;
}

export function PartnershipBadge({ status }: { status: PartnershipStatus }) {
  const meta = partnershipStatusMeta[status];
  return <StatusBadge label={meta.label} tone={meta.tone} />;
}

export function AvailabilityBadge({ availability }: { availability: AvailabilityState | null }) {
  const meta = availabilityMeta[availability ?? "not-recorded"];
  return <StatusBadge label={meta.label} tone={meta.tone} />;
}

export function AudienceBadge({ program }: { program: ProgramType }) {
  const meta = audienceMeta[programAudience[program]];
  return <StatusBadge label={`For ${meta.label.toLowerCase()}`} tone={meta.tone} />;
}

export function OpportunityStatusBadge({ status }: { status: OpportunityStatus }) {
  const meta = opportunityStatusMeta[status];
  return <StatusBadge label={meta.label} tone={meta.tone} />;
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const meta = documentStatusMeta[status];
  return <StatusBadge label={meta.label} tone={meta.tone} />;
}

export function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
  const meta = activityStatusMeta[status];
  return <StatusBadge label={meta.label} tone={meta.tone} />;
}

/** "Ends in 20 days" / "Ended 3 months ago" helper text for date columns. */
export function RelativeDays({
  days,
  future,
  past,
  warnWithin,
}: {
  days: number | null;
  future: string;
  past: string;
  warnWithin?: number;
}) {
  if (days === null) return null;
  const warn = warnWithin !== undefined && days >= 0 && days <= warnWithin;
  return (
    <span
      className={
        days < 0 ? "text-danger-fg/80" : warn ? "text-warning-fg" : "text-fg-faint"
      }
    >
      {days < 0 ? past : future} {formatRelativeDays(days)}
    </span>
  );
}
