import { ChevronDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  ActivityStatusBadge,
  AgreementStatusBadge,
  AvailabilityBadge,
  DocumentStatusBadge,
} from "@/components/internal/badges";
import { KeyValueList, LinkedList } from "@/components/internal/ui/detail";
import { ManageLink } from "@/components/internal/ui/manage-action";
import { NotRecorded } from "@/components/internal/ui/page-header";
import { VerificationBadge } from "@/components/internal/ui/provenance";
import { toneStyles } from "@/components/internal/ui/status-badge";
import type { UniversityAgreement } from "@/lib/internal/data/institutions";
import {
  daysBetween,
  EXPIRY_WARNING_DAYS,
  formatDate,
  formatDateRange,
  formatDuration,
  formatRelativeDays,
} from "@/lib/internal/dates";
import { agreementStatusMeta, agreementTypeLabel, documentTypeLabel } from "@/lib/internal/status";
import type { AgreementView } from "@/lib/internal/types";
import { cn } from "@/lib/utils";

export function statusExplanation(agreement: AgreementView) {
  switch (agreement.status) {
    case "active":
      return agreement.endDate
        ? `In force. Ends ${formatRelativeDays(agreement.daysToExpiry ?? 0)}.`
        : "In force with no end date recorded.";
    case "expiring-soon":
      return `Ends ${formatRelativeDays(agreement.daysToExpiry ?? 0)} — within the ${EXPIRY_WARNING_DAYS}-day renewal window.`;
    case "expired":
      return `Ended ${formatRelativeDays(agreement.daysToExpiry ?? 0)}. A renewal would be recorded as a new agreement.`;
    case "pending-start":
      return "Signed, but the start date has not been reached.";
    case "draft":
      return "Draft. Dates are set once the agreement is signed.";
    case "under-review":
      return "Under review. Dates are set once the agreement is signed.";
    case "terminated":
      return "Ended before its scheduled end date.";
    case "not-stated":
      return "The source lists this collaboration but states no status or dates. Confirm against the signed document before relying on it.";
  }
}

function TermProgress({ agreement, today }: { agreement: AgreementView; today: string }) {
  if (!agreement.startDate || !agreement.endDate) return null;
  const total = daysBetween(agreement.startDate, agreement.endDate);
  const elapsed = daysBetween(agreement.startDate, today);
  const percent = Math.max(0, Math.min(100, Math.round((elapsed / Math.max(total, 1)) * 100)));
  const tone = agreementStatusMeta[agreement.status].tone;
  return (
    <div className="border-b border-hairline px-5 py-4">
      <div className="flex justify-between text-[12px] text-muted-foreground">
        <span>{formatDate(agreement.startDate)}</span>
        <span>{formatDate(agreement.endDate)}</span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-overlay"
        role="progressbar"
        aria-label="Agreement term elapsed"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cn("h-full rounded-full", toneStyles[tone].bar)} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-[12px] text-muted-foreground">{percent}% of the term elapsed</p>
    </div>
  );
}

const renewalText = {
  automatic: "Renews automatically unless ended",
  "by-review": "Renewed after review",
} as const;

/**
 * One agreement (MoU) on its university's page: a summary row that expands to
 * the agreement's own details. University details are shown once, on the page.
 */
export async function AgreementCard({
  entry,
  universityId,
  today,
  open,
}: {
  entry: UniversityAgreement;
  universityId: string;
  today: string;
  open: boolean;
}) {
  const { agreement, role, offerings, activities, documents } = entry;
  const duration = formatDuration(agreement.startDate, agreement.endDate);
  const otherParties = [
    ...(role === "partner" && agreement.institution ? [{ ...agreement.institution, lead: true }] : []),
    ...agreement.partners.filter((p) => p.id !== universityId).map((p) => ({ ...p, lead: false })),
  ];

  return (
    <details id={`agreement-${agreement.id}`} open={open} className="group scroll-mt-24 border-b border-hairline last:border-b-0">
      <summary className="flex cursor-pointer list-none items-start gap-3 px-5 py-4 transition-colors hover:bg-overlay-subtle [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-foreground">{agreement.title}</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            <span className="font-mono">{agreement.reference}</span> ·{" "}
            {agreement.typeLabel ?? agreementTypeLabel[agreement.type]} ·{" "}
            {formatDateRange(agreement.startDate, agreement.endDate)}
            {role === "partner" ? " · additional partner" : null}
          </p>
        </div>
        <AgreementStatusBadge status={agreement.status} daysToExpiry={agreement.daysToExpiry} />
        <ChevronDown
          className="mt-0.5 size-4 shrink-0 text-fg-dim transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="border-t border-hairline bg-overlay-subtle/40">
        <KeyValueList
          items={[
            {
              label: "Type",
              value: (
                <span>
                  {agreementTypeLabel[agreement.type]}
                  {agreement.typeLabel ? (
                    <span className="block text-[12px] text-muted-foreground">
                      Stated on source: &ldquo;{agreement.typeLabel}&rdquo;
                    </span>
                  ) : null}
                </span>
              ),
            },
            {
              label: "Status",
              value: (
                <span className="space-y-1">
                  <AgreementStatusBadge status={agreement.status} />
                  <span className="block text-[12px] text-muted-foreground">{statusExplanation(agreement)}</span>
                </span>
              ),
            },
            { label: "Start date", value: formatDate(agreement.startDate, "Not stated") },
            { label: "Expiry date", value: formatDate(agreement.endDate, "Not stated") },
            { label: "Duration", value: duration ?? <NotRecorded>Not stated</NotRecorded> },
            {
              label: "Renewal",
              value: agreement.renewal ? renewalText[agreement.renewal] : <NotRecorded />,
            },
            { label: "Reference", value: <span className="font-mono">{agreement.reference}</span> },
            { label: "Verification", value: <VerificationBadge status={agreement.verification} /> },
            ...(agreement.sourceSection ? [{ label: "Listed under", value: agreement.sourceSection }] : []),
            ...(agreement.sourceUrl
              ? [
                  {
                    label: "Source",
                    value: (
                      <a
                        href={agreement.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-glow hover:text-foreground"
                      >
                        {agreement.sourceTitle ?? "Open source"}
                        <ExternalLink className="size-3" aria-hidden />
                      </a>
                    ),
                  },
                ]
              : []),
            {
              label: otherParties.length > 0 ? "Other parties" : "Parties",
              wide: true,
              value:
                otherParties.length > 0 ? (
                  <span className="flex flex-wrap gap-1.5">
                    {otherParties.map((party) => (
                      <Link
                        key={party.id}
                        href={`/internal/universities/${party.id}`}
                        className="rounded-md border border-line bg-overlay-subtle px-2 py-0.5 text-[12px] hover:border-line-bold"
                      >
                        {party.name}
                        {party.lead ? " (lead)" : ""}
                      </Link>
                    ))}
                  </span>
                ) : (
                  "This university only"
                ),
            },
            {
              label: "Collaboration areas",
              wide: true,
              value:
                agreement.collaborationAreas.length > 0 ? (
                  agreement.collaborationAreas.join(", ")
                ) : (
                  <NotRecorded />
                ),
            },
            { label: "Notes", wide: true, value: agreement.notes ?? <NotRecorded /> },
          ]}
        />
        <TermProgress agreement={agreement} today={today} />

        <div className="grid grid-cols-1 border-t border-hairline md:grid-cols-3 md:divide-x md:divide-hairline">
          <RelatedBlock title="Documents">
            <LinkedList
              emptyTitle="No documents linked"
              items={documents.map((doc) => ({
                key: doc.id,
                href: `/internal/documents/${doc.id}`,
                title: doc.title,
                meta: documentTypeLabel[doc.type],
                badge: <DocumentStatusBadge status={doc.status} />,
              }))}
            />
          </RelatedBlock>
          <RelatedBlock title="Programme offerings">
            <LinkedList
              emptyTitle="No offerings cite it"
              items={offerings.map((offering) => ({
                key: offering.id,
                href: `/internal/programs/${offering.id}`,
                title: offering.program.name,
                meta: offering.duration ?? "Duration not recorded",
                badge: <AvailabilityBadge availability={offering.availability} />,
              }))}
            />
          </RelatedBlock>
          <RelatedBlock title="Activities">
            <LinkedList
              emptyTitle="No activities linked"
              items={activities.map((activity) => ({
                key: activity.id,
                href: `/internal/activities/${activity.id}`,
                title: activity.title,
                meta: formatDateRange(activity.startDate, activity.endDate),
                badge: <ActivityStatusBadge status={activity.status} />,
              }))}
            />
          </RelatedBlock>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-hairline px-5 py-3">
          <ManageLink
            permission="agreements:update"
            href={`/internal/universities/${agreement.institutionId}/agreements/${agreement.id}/edit`}
            label="Edit MoU"
            icon="edit"
            size="sm"
          />
          {role === "partner" && agreement.institution ? (
            <Link
              href={`/internal/universities/${agreement.institution.id}`}
              className="text-[12px] text-fg-subtle hover:text-foreground"
            >
              Recorded under {agreement.institution.name}
            </Link>
          ) : null}
        </div>
      </div>
    </details>
  );
}

function RelatedBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-hairline last:border-b-0 md:border-b-0">
      <p className="px-5 pt-3 font-mono text-[10px] tracking-[0.12em] text-fg-faint uppercase">{title}</p>
      {children}
    </div>
  );
}
