import { BookOpen, Compass, FolderOpen, GraduationCap } from "lucide-react";
import {
  AudienceBadge,
  AvailabilityBadge,
  DocumentStatusBadge,
  OpportunityStatusBadge,
} from "@/components/internal/badges";
import { DetailHeader, DetailSection, KeyValueList, LinkedList } from "@/components/internal/ui/detail";
import { NotRecorded } from "@/components/internal/ui/page-header";
import { SourceBadge } from "@/components/internal/ui/source-badge";
import type { getProgram } from "@/lib/internal/data/programs";
import { formatDate } from "@/lib/internal/dates";
import { audienceMeta, documentTypeLabel } from "@/lib/internal/status";

type ProgramRecord = NonNullable<Awaited<ReturnType<typeof getProgram>>>;

export function ProgramOverview({ record }: { record: ProgramRecord }) {
  const { program, audience, offerings, opportunities, documents } = record;

  return (
    <div className="space-y-6">
      <DetailHeader
        backHref="/internal/programs"
        backLabel="All programs"
        eyebrow={`Programme · for ${audienceMeta[audience].label.toLowerCase()}`}
        title={program.name}
        badges={
          <>
            <AudienceBadge program={program.id} />
            <SourceBadge source={program.source} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailSection title="About" icon={BookOpen}>
            <KeyValueList
              items={[
                { label: "Description", wide: true, value: program.description },
                { label: "Audience", value: audienceMeta[audience].label },
                {
                  label: "Eligibility as published",
                  value: program.generalAudience ?? <NotRecorded>Not stated</NotRecorded>,
                },
              ]}
            />
          </DetailSection>

          <DetailSection
            title="Opportunities"
            icon={Compass}
            description="Application calls published under this programme."
          >
            <LinkedList
              emptyTitle="No opportunities recorded for this programme"
              items={opportunities.map((opportunity) => ({
                key: opportunity.id,
                href: `/internal/opportunities/${opportunity.id}`,
                title: opportunity.title,
                meta: [
                  opportunity.institution?.name,
                  opportunity.deadline ? `Deadline ${formatDate(opportunity.deadline)}` : "No deadline recorded",
                ]
                  .filter(Boolean)
                  .join(" · "),
                badge: <OpportunityStatusBadge status={opportunity.status} />,
              }))}
            />
          </DetailSection>
        </div>

        <div className="space-y-6">
          <DetailSection
            title="Offerings"
            icon={GraduationCap}
            description="Institutions an official page names for this programme."
          >
            <LinkedList
              emptyTitle="No offerings recorded"
              items={offerings.map((offering) => ({
                key: offering.id,
                href: `/internal/programs/${offering.id}`,
                title: offering.institution?.name ?? "Unknown institution",
                meta: offering.institution?.country,
                badge: <AvailabilityBadge availability={offering.availability} />,
              }))}
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
        </div>
      </div>
    </div>
  );
}
