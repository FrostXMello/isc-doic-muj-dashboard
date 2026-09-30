import type { Metadata } from "next";
import { BookOpen, CalendarDays, FileText, FolderOpen, Globe, Handshake } from "lucide-react";
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
import { SourceBadge } from "@/components/internal/ui/source-badge";
import { getInstitution } from "@/lib/internal/data/institutions";
import { formatDate, formatDateRange } from "@/lib/internal/dates";
import type { IdParamsProp } from "@/lib/internal/query";
import { agreementTypeLabel, documentTypeLabel, sourceMeta } from "@/lib/internal/status";

export async function generateMetadata({ params }: IdParamsProp): Promise<Metadata> {
  const { id } = await params;
  const record = await getInstitution(id);
  return { title: record?.institution.name ?? "University not found" };
}

export default async function UniversityDetailPage({ params }: IdParamsProp) {
  const { id } = await params;
  const record = await getInstitution(id);
  if (!record) notFound();

  const { institution, agreements, offerings, opportunities, activities, documents, peers } =
    record;
  const isDirectory = institution.source === "directory";

  return (
    <div className="space-y-6">
      <DetailHeader
        backHref="/internal/universities"
        backLabel="All universities"
        eyebrow={institution.region}
        title={institution.name}
        subtitle={`${institution.city} · ${institution.country}`}
        badges={
          <>
            <PartnershipBadge status={institution.partnershipStatus} />
            <SourceBadge source={institution.source} />
          </>
        }
        actions={
          <>
            <PlaceholderAction label="Edit" icon="edit" reason={unavailableReasons.editing} />
            <PlaceholderAction
              label="New agreement"
              icon="add"
              variant="primary"
              reason={unavailableReasons.editing}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailSection title="Partnership" icon={Handshake}>
            <KeyValueList
              items={[
                {
                  label: "Relationship status",
                  value: <PartnershipBadge status={institution.partnershipStatus} />,
                },
                {
                  label: "Agreements recorded",
                  value: institution.agreementCount
                    ? `${institution.agreementCount} (${institution.activeAgreementCount} active)`
                    : "None recorded",
                },
                {
                  label: "Next expiry",
                  value: institution.nextExpiry ? formatDate(institution.nextExpiry) : <NotRecorded />,
                },
                {
                  label: "Programme offerings",
                  value: institution.offeringCount || "None recorded",
                },
                {
                  label: "Note",
                  wide: true,
                  value: isDirectory
                    ? "No agreement, programme, or activity is recorded for this institution. The public directory does not publish partnership status, and none is inferred here."
                    : "Fictional sample institution. Linked records demonstrate the portal workflow only.",
                },
              ]}
            />
          </DetailSection>

          <DetailSection
            title="Agreements"
            icon={FileText}
            description="Status is derived from each agreement's stored state and dates."
          >
            <LinkedList
              emptyTitle="No agreements recorded"
              emptyDescription="Absence of a record means not recorded — not that no relationship exists."
              items={agreements.map((agreement) => ({
                key: agreement.id,
                href: `/internal/mous/${agreement.id}`,
                title: agreement.title,
                meta: `${agreement.reference} · ${agreementTypeLabel[agreement.type]} · ${formatDateRange(agreement.startDate, agreement.endDate)}`,
                badge: (
                  <AgreementStatusBadge
                    status={agreement.status}
                    daysToExpiry={agreement.daysToExpiry}
                  />
                ),
              }))}
            />
          </DetailSection>

          <DetailSection title="Programme offerings" icon={BookOpen}>
            <LinkedList
              emptyTitle="No programme offerings recorded"
              items={offerings.map((offering) => ({
                key: offering.id,
                href: `/internal/programs/${offering.id}`,
                title: offering.program.name,
                meta: [offering.duration, offering.intake].filter(Boolean).join(" · ") || "Details not recorded",
                badge: <AvailabilityBadge availability={offering.availability} />,
              }))}
            />
            {opportunities.length > 0 && (
              <p className="border-t border-white/[0.06] px-5 py-3 text-[12px] text-muted-foreground">
                {opportunities.length} application{" "}
                {opportunities.length === 1 ? "call references" : "calls reference"} this
                institution.
              </p>
            )}
          </DetailSection>

          <DetailSection title="Activities" icon={CalendarDays}>
            <LinkedList
              emptyTitle="No activities recorded"
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
          <DetailSection title="Institution profile" icon={Globe}>
            <KeyValueList
              className="sm:grid-cols-1"
              items={[
                { label: "Country", value: institution.country },
                { label: "Region", value: institution.region },
                { label: "City", value: institution.city },
                { label: "Website", value: institution.website ?? <NotRecorded /> },
                {
                  label: "Coordinates",
                  value:
                    institution.latitude !== null && institution.longitude !== null ? (
                      <span>
                        {institution.latitude.toFixed(2)}, {institution.longitude.toFixed(2)}
                        <span className="block text-[12px] text-[#6b7c96]">
                          Country pin only — not a checked campus location.
                        </span>
                      </span>
                    ) : (
                      <NotRecorded />
                    ),
                },
                { label: "Record source", value: sourceMeta[institution.source].description },
              ]}
            />
          </DetailSection>

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

          {institution.note && (
            <DetailSection title="Country note" description="Illustrative copy from the public site">
              <p className="px-5 py-4 text-[13px] leading-relaxed text-muted-foreground">
                {institution.note}
              </p>
            </DetailSection>
          )}

          <DetailSection title={`Also in ${institution.country}`}>
            <LinkedList
              emptyTitle="No other institutions in this country"
              items={peers.map((peer) => ({
                key: peer.id,
                href: `/internal/universities/${peer.id}`,
                title: peer.name,
                badge: <SourceBadge source={peer.source} />,
              }))}
            />
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
