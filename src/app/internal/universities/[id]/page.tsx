import type { Metadata } from "next";
import { BookOpen, CalendarDays, FileText, FolderOpen, Globe, Handshake, Link2 } from "lucide-react";
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

  const { institution, agreements, offerings, opportunities, activities, documents, peers, contactAccess } =
    record;
  const note =
    institution.source === "official"
      ? "Listed on MUJ's official International Collaboration and Partners page. The page gives no agreement dates or status, so none is shown or inferred."
      : institution.source === "directory"
        ? "Carried over from this platform's earlier directory; not on the official MUJ partner page. Hidden from the public site until DoIC confirms it."
        : "Fictional sample institution. Linked records demonstrate the portal workflow only.";

  return (
    <div className="space-y-6">
      <DetailHeader
        backHref="/internal/universities"
        backLabel="All universities"
        eyebrow={institution.region}
        title={institution.name}
        subtitle={[institution.city, institution.country].filter(Boolean).join(" · ")}
        badges={
          <>
            <PartnershipBadge status={institution.partnershipStatus} />
            <SourceBadge source={institution.source} />
            <VerificationBadge status={institution.verification} />
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
                  value: note,
                },
              ]}
            />
          </DetailSection>

          <DetailSection
            title="Agreements"
            icon={FileText}
            description="Rows as listed on the source. Status is derived only from stored state and dates; official rows state neither."
          >
            <LinkedList
              emptyTitle="No agreements recorded"
              emptyDescription="Absence of a record means not recorded — not that no relationship exists."
              items={agreements.map((agreement) => ({
                key: agreement.id,
                href: `/internal/mous/${agreement.id}`,
                title: agreement.title,
                meta: `${agreement.reference} · ${agreement.typeLabel ?? agreementTypeLabel[agreement.type]} · ${formatDateRange(agreement.startDate, agreement.endDate)}`,
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
              <p className="border-t border-hairline px-5 py-3 text-[12px] text-muted-foreground">
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
                ...(institution.normalizedName && institution.normalizedName !== institution.name
                  ? [{ label: "Normalised name", value: institution.normalizedName }]
                  : []),
                { label: "City", value: institution.city ?? <NotRecorded /> },
                { label: "Website", value: institution.website ?? <NotRecorded /> },
                { label: "On public site", value: institution.isPublic ? "Yes" : "No" },
                {
                  label: "Coordinates",
                  value:
                    institution.latitude !== null && institution.longitude !== null ? (
                      <span>
                        {institution.latitude.toFixed(2)}, {institution.longitude.toFixed(2)}
                        <span className="block text-[12px] text-fg-faint">
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

          <DetailSection title="Provenance" icon={Link2}>
            <KeyValueList className="sm:grid-cols-1" items={provenanceItems(institution)} />
          </DetailSection>

          <ContactsPanel access={contactAccess} institutionId={institution.id} />

          {institution.note && (
            <DetailSection title="Review note">
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
