import type { Metadata } from "next";
import { agreementHref } from "@/lib/internal/links";
import { BookOpen, ClipboardList, Compass, FileText, FolderOpen, GraduationCap, Link2 } from "lucide-react";
import { notFound } from "next/navigation";
import {
  AgreementStatusBadge,
  AudienceBadge,
  AvailabilityBadge,
  DocumentStatusBadge,
  OpportunityStatusBadge,
} from "@/components/internal/badges";
import { DetailHeader, DetailSection, KeyValueList, LinkedList } from "@/components/internal/ui/detail";
import { NotRecorded } from "@/components/internal/ui/page-header";
import { unavailableReasons } from "@/components/internal/ui/placeholder-action";
import { RecordAction } from "@/components/internal/ui/record-action";
import { provenanceItems, VerificationBadge } from "@/components/internal/ui/provenance";
import { SourceBadge } from "@/components/internal/ui/source-badge";
import { getOffering, getProgram } from "@/lib/internal/data/programs";
import { ProgramOverview } from "./program-overview";
import { formatDate, formatDateRange } from "@/lib/internal/dates";
import type { IdParamsProp } from "@/lib/internal/query";
import { documentTypeLabel } from "@/lib/internal/status";

export async function generateMetadata({ params }: IdParamsProp): Promise<Metadata> {
  const { id } = await params;
  const program = await getProgram(id);
  if (program) return { title: program.program.name };
  const record = await getOffering(id);
  if (!record) return { title: "Offering not found" };
  const { offering } = record;
  return { title: `${offering.program.name} · ${offering.institution?.name ?? "Offering"}` };
}

const availabilityExplanation = {
  open: "Accepting applications through the linked calls.",
  closed: "Recorded, but not currently accepting applications.",
  suspended: "Temporarily unavailable. See notes for the reason.",
  "not-recorded": "No availability state has been recorded. This does not mean the offering is open.",
} as const;

export default async function ProgramOfferingPage({ params }: IdParamsProp) {
  const { id } = await params;
  const programRecord = await getProgram(id);
  if (programRecord) return <ProgramOverview record={programRecord} />;

  const record = await getOffering(id);
  if (!record) notFound();

  const { offering, opportunities, siblings, documents } = record;
  const { program, institution, agreement } = offering;
  const availabilityKey = offering.availability ?? "not-recorded";

  return (
    <div className="space-y-6">
      <DetailHeader
        backHref={`/internal/programs/${program.id}`}
        backLabel={program.name}
        eyebrow={program.name}
        title={institution ? `${program.name} · ${institution.name}` : program.name}
        subtitle={
          institution ? [institution.city, institution.country].filter(Boolean).join(" · ") : undefined
        }
        badges={
          <>
            <AudienceBadge program={program.id} />
            <AvailabilityBadge availability={offering.availability} />
            <SourceBadge source={offering.source} />
            <VerificationBadge status={offering.verification} />
          </>
        }
        actions={
          <RecordAction
            permission="programs:update"
            label="Edit offering"
            icon="edit"
            reason={unavailableReasons.editing}
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailSection title="Availability" icon={ClipboardList}>
            <KeyValueList
              items={[
                {
                  label: "Status",
                  value: (
                    <span className="space-y-1">
                      <AvailabilityBadge availability={offering.availability} />
                      <span className="block text-[12px] text-muted-foreground">
                        {availabilityExplanation[availabilityKey]}
                      </span>
                    </span>
                  ),
                },
                { label: "Duration", value: offering.duration ?? <NotRecorded /> },
                { label: "Intake", value: offering.intake ?? <NotRecorded /> },
                {
                  label: "Application window",
                  value:
                    offering.applicationStart || offering.applicationEnd ? (
                      formatDateRange(offering.applicationStart, offering.applicationEnd)
                    ) : (
                      <NotRecorded />
                    ),
                },
                { label: "Eligibility", value: offering.eligibility ?? <NotRecorded>Not published</NotRecorded> },
                {
                  label: "Credit information",
                  value: offering.creditInformation ?? <NotRecorded>Not published</NotRecorded>,
                },
                { label: "Notes", wide: true, value: offering.notes ?? <NotRecorded /> },
              ]}
            />
          </DetailSection>

          <DetailSection title="Programme" icon={BookOpen} action={<SourceBadge source={program.source} />}>
            <div className="px-6 py-4">
              <p className="text-[14px] font-medium text-foreground">{program.name}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {program.description}
              </p>
              <p className="mt-3 text-[12px] text-fg-faint">
                General audience: {program.generalAudience ?? "not stated"}
              </p>
            </div>
          </DetailSection>

          <DetailSection title="Provenance" icon={Link2}>
            <KeyValueList items={provenanceItems(offering)} />
          </DetailSection>

          <DetailSection title="Application calls" icon={Compass}>
            <LinkedList
              emptyTitle="No application calls for this offering"
              items={opportunities.map((opportunity) => ({
                key: opportunity.id,
                href: `/internal/opportunities/${opportunity.id}`,
                title: opportunity.title,
                meta: opportunity.deadline ? `Deadline ${formatDate(opportunity.deadline)}` : "No deadline recorded",
                badge: <OpportunityStatusBadge status={opportunity.status} />,
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
                    badge: <SourceBadge source={institution.source} />,
                  },
                ]}
              />
            ) : (
              <p className="px-6 py-4 text-[13px] text-muted-foreground">Institution record missing.</p>
            )}
          </DetailSection>

          <DetailSection
            title="Supporting agreement"
            icon={FileText}
            description="An agreement may support an offering, but does not by itself create one."
          >
            {agreement ? (
              <LinkedList
                emptyTitle=""
                items={[
                  {
                    key: agreement.id,
                    href: agreementHref(agreement),
                    title: agreement.title,
                    meta: agreement.reference,
                    badge: <AgreementStatusBadge status={agreement.status} daysToExpiry={agreement.daysToExpiry} />,
                  },
                ]}
              />
            ) : (
              <p className="px-6 py-4 text-[13px] text-muted-foreground">
                No agreement is cited as the basis for this offering.
              </p>
            )}
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

          <DetailSection title={`Other ${program.name} offerings`}>
            <LinkedList
              emptyTitle="No other offerings recorded"
              items={siblings.map((sibling) => ({
                key: sibling.id,
                href: `/internal/programs/${sibling.id}`,
                title: sibling.institution?.name ?? "Unknown institution",
                meta: sibling.institution?.country,
                badge: <AvailabilityBadge availability={sibling.availability} />,
              }))}
            />
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
