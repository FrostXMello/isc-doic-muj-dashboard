import type { Metadata } from "next";
import { BookOpen, CalendarDays, FileText, FolderOpen, GraduationCap, Link2, Timer } from "lucide-react";
import { notFound } from "next/navigation";
import {
  ActivityStatusBadge,
  AgreementStatusBadge,
  AvailabilityBadge,
  DocumentStatusBadge,
  PartnershipBadge,
} from "@/components/internal/badges";
import { DetailHeader, DetailSection, KeyValueList, LinkedList } from "@/components/internal/ui/detail";
import { NotRecorded } from "@/components/internal/ui/page-header";
import {
  PlaceholderAction,
  unavailableReasons,
} from "@/components/internal/ui/placeholder-action";
import { ContactsPanel, provenanceItems, VerificationBadge } from "@/components/internal/ui/provenance";
import { SourceBadge } from "@/components/internal/ui/source-badge";
import { toneStyles } from "@/components/internal/ui/status-badge";
import { getAgreement } from "@/lib/internal/data/agreements";
import {
  EXPIRY_WARNING_DAYS,
  daysBetween,
  formatDate,
  formatDateRange,
  formatRelativeDays,
} from "@/lib/internal/dates";
import type { IdParamsProp } from "@/lib/internal/query";
import {
  agreementStatusMeta,
  agreementTypeLabel,
  documentTypeLabel,
} from "@/lib/internal/status";
import type { AgreementView } from "@/lib/internal/types";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: IdParamsProp): Promise<Metadata> {
  const { id } = await params;
  const record = await getAgreement(id);
  return { title: record?.agreement.reference ?? "Agreement not found" };
}

function statusExplanation(agreement: AgreementView) {
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
      return "The official source lists this collaboration but states no status or dates. Confirm against the signed document before relying on it.";
  }
}

function TermProgress({ agreement, today }: { agreement: AgreementView; today: string }) {
  if (!agreement.startDate || !agreement.endDate) return null;
  const total = daysBetween(agreement.startDate, agreement.endDate);
  const elapsed = daysBetween(agreement.startDate, today);
  const percent = Math.max(0, Math.min(100, Math.round((elapsed / Math.max(total, 1)) * 100)));
  const tone = agreementStatusMeta[agreement.status].tone;
  return (
    <div className="px-5 py-4">
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
      <p className="mt-2 text-[12px] text-muted-foreground">
        {percent}% of the term elapsed · {Math.round(total / 365)}-year term
      </p>
    </div>
  );
}

export default async function AgreementDetailPage({ params }: IdParamsProp) {
  const { id } = await params;
  const record = await getAgreement(id);
  if (!record) notFound();

  const { today, agreement, institution, related, offerings, activities, documents, contactAccess } =
    record;
  const hasTerm = Boolean(agreement.startDate && agreement.endDate);

  return (
    <div className="space-y-6">
      <DetailHeader
        backHref="/internal/mous"
        backLabel="All agreements"
        eyebrow={agreement.reference}
        title={agreement.title}
        subtitle={institution ? `${institution.name} · ${institution.country}` : undefined}
        badges={
          <>
            <AgreementStatusBadge status={agreement.status} daysToExpiry={agreement.daysToExpiry} />
            <SourceBadge source={agreement.source} />
            <VerificationBadge status={agreement.verification} />
          </>
        }
        actions={
          <>
            <PlaceholderAction label="Edit" icon="edit" reason={unavailableReasons.editing} />
            <PlaceholderAction
              label="Record renewal"
              icon="add"
              variant="primary"
              reason={unavailableReasons.editing}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailSection title="Agreement details" icon={FileText}>
            <KeyValueList
              items={[
                {
                  label: "Type",
                  value: (
                    <span>
                      {agreementTypeLabel[agreement.type]}
                      <span className="block text-[12px] text-muted-foreground">
                        {agreement.typeLabel
                          ? `Stated on source: “${agreement.typeLabel}”`
                          : agreement.type === "not-stated"
                            ? "The source row does not name an agreement type."
                            : null}
                      </span>
                    </span>
                  ),
                },
                {
                  label: "Status",
                  value: (
                    <span className="space-y-1">
                      <AgreementStatusBadge status={agreement.status} />
                      <span className="block text-[12px] text-muted-foreground">
                        {statusExplanation(agreement)}
                      </span>
                    </span>
                  ),
                },
                { label: "Start date", value: formatDate(agreement.startDate, "Not stated") },
                { label: "Expiry date", value: formatDate(agreement.endDate, "Not stated") },
                {
                  label: "Renewal",
                  value:
                    agreement.renewal === "automatic"
                      ? "Renews automatically unless ended"
                      : agreement.renewal === "by-review"
                        ? "Renewed after review"
                        : <NotRecorded />,
                },
                { label: "Reference", value: <span className="font-mono">{agreement.reference}</span> },
                ...(agreement.sourceSection
                  ? [{ label: "Listed under", value: agreement.sourceSection }]
                  : []),
                {
                  label: "Collaboration areas",
                  wide: true,
                  value:
                    agreement.collaborationAreas.length > 0 ? (
                      <span className="flex flex-wrap gap-1.5">
                        {agreement.collaborationAreas.map((area) => (
                          <span
                            key={area}
                            className="rounded-md border border-line bg-overlay-subtle px-2 py-0.5 text-[12px]"
                          >
                            {area}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <NotRecorded />
                    ),
                },
                { label: "Notes", wide: true, value: agreement.notes ?? <NotRecorded /> },
              ]}
            />
          </DetailSection>

          {hasTerm && (
            <DetailSection title="Term" icon={Timer} description={statusExplanation(agreement)}>
              <TermProgress agreement={agreement} today={today} />
            </DetailSection>
          )}

          <DetailSection
            title="Programme offerings supported"
            icon={BookOpen}
            description="Offerings that cite this agreement as their basis."
          >
            <LinkedList
              emptyTitle="No offerings cite this agreement"
              items={offerings.map((offering) => ({
                key: offering.id,
                href: `/internal/programs/${offering.id}`,
                title: offering.program.name,
                meta: offering.duration ?? "Duration not recorded",
                badge: <AvailabilityBadge availability={offering.availability} />,
              }))}
            />
          </DetailSection>

          <DetailSection title="Related activities" icon={CalendarDays}>
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
          </DetailSection>
        </div>

        <div className="space-y-6">
          <DetailSection title="Institution" icon={GraduationCap}>
            {institution ? (
              <LinkedList
                emptyTitle=""
                items={[
                  {
                    key: institution.id,
                    href: `/internal/universities/${institution.id}`,
                    title: institution.name,
                    meta: [institution.city, institution.country].filter(Boolean).join(" · "),
                    badge: <PartnershipBadge status={institution.partnershipStatus} />,
                  },
                ]}
              />
            ) : (
              <p className="px-5 py-4 text-[13px] text-muted-foreground">
                The linked institution record is missing.
              </p>
            )}
          </DetailSection>

          <DetailSection title="Provenance" icon={Link2}>
            <KeyValueList className="sm:grid-cols-1" items={provenanceItems(agreement)} />
          </DetailSection>

          {institution ? (
            <ContactsPanel
              access={contactAccess}
              institutionId={institution.id}
              agreementId={agreement.id}
            />
          ) : null}

          <DetailSection title="Documents" icon={FolderOpen}>
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
          </DetailSection>

          <DetailSection title="Other agreements with this institution">
            <LinkedList
              emptyTitle="No other agreements recorded"
              items={related.map((other) => ({
                key: other.id,
                href: `/internal/mous/${other.id}`,
                title: other.title,
                meta: other.reference,
                badge: <AgreementStatusBadge status={other.status} />,
              }))}
            />
          </DetailSection>

        </div>
      </div>
    </div>
  );
}
