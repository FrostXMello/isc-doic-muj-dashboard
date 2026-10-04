import type { Metadata } from "next";
import { BookOpen, CalendarClock, Compass, GraduationCap, Link2 } from "lucide-react";
import { notFound } from "next/navigation";
import { AvailabilityBadge, AudienceBadge, OpportunityStatusBadge } from "@/components/internal/badges";
import { DetailHeader, DetailSection, KeyValueList, LinkedList } from "@/components/internal/ui/detail";
import { NotRecorded } from "@/components/internal/ui/page-header";
import { unavailableReasons } from "@/components/internal/ui/placeholder-action";
import { RecordAction } from "@/components/internal/ui/record-action";
import { provenanceItems, VerificationBadge } from "@/components/internal/ui/provenance";
import { SourceBadge } from "@/components/internal/ui/source-badge";
import { getOpportunity } from "@/lib/internal/data/opportunities";
import { DEADLINE_WARNING_DAYS, formatDate, formatRelativeDays } from "@/lib/internal/dates";
import type { IdParamsProp } from "@/lib/internal/query";
import type { OpportunityView } from "@/lib/internal/types";

export async function generateMetadata({ params }: IdParamsProp): Promise<Metadata> {
  const { id } = await params;
  const record = await getOpportunity(id);
  return { title: record?.opportunity.title ?? "Opportunity not found" };
}

function statusExplanation(opportunity: OpportunityView) {
  switch (opportunity.status) {
    case "draft":
      return "Unpublished draft. Dates are optional until publication.";
    case "archived":
      return "Archived from a previous cycle.";
    case "upcoming":
      return `Published; opens on ${formatDate(opportunity.opensOn)}.`;
    case "open":
      return opportunity.daysToDeadline !== null
        ? `Accepting applications. Deadline ${formatRelativeDays(opportunity.daysToDeadline)}.`
        : "Accepting applications. No deadline recorded.";
    case "closing-soon":
      return `Deadline ${formatRelativeDays(opportunity.daysToDeadline ?? 0)} — within ${DEADLINE_WARNING_DAYS} days.`;
    case "closed":
      return `Deadline passed on ${formatDate(opportunity.deadline)}.`;
  }
}

export default async function OpportunityDetailPage({ params }: IdParamsProp) {
  const { id } = await params;
  const record = await getOpportunity(id);
  if (!record) notFound();

  const { opportunity, offering } = record;
  const { program, institution } = opportunity;

  return (
    <div className="space-y-6">
      <DetailHeader
        backHref={`/internal/programs/${program.id}`}
        backLabel={program.name}
        eyebrow={program.name}
        title={opportunity.title}
        subtitle={institution ? `${institution.name} · ${institution.country}` : "Not tied to one institution"}
        badges={
          <>
            <AudienceBadge program={program.id} />
            <OpportunityStatusBadge status={opportunity.status} />
            <SourceBadge source={opportunity.source} />
            <VerificationBadge status={opportunity.verification} />
          </>
        }
        actions={
          <RecordAction
            permission="opportunities:update"
            label="Edit call"
            icon="edit"
            reason={unavailableReasons.editing}
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailSection title="Call details" icon={Compass}>
            <KeyValueList
              items={[
                {
                  label: "Status",
                  wide: true,
                  value: (
                    <span className="space-y-1">
                      <OpportunityStatusBadge status={opportunity.status} />
                      <span className="block text-[12px] text-muted-foreground">
                        {statusExplanation(opportunity)}
                      </span>
                    </span>
                  ),
                },
                { label: "Opens", value: formatDate(opportunity.opensOn) },
                { label: "Deadline", value: formatDate(opportunity.deadline) },
                { label: "Programme type", value: program.name },
                {
                  label: "Publication",
                  value:
                    opportunity.recordStatus === "published"
                      ? "Published"
                      : opportunity.recordStatus === "draft"
                        ? "Draft"
                        : "Archived",
                },
                { label: "Summary", wide: true, value: opportunity.summary },
              ]}
            />
          </DetailSection>

          <DetailSection title="Provenance" icon={Link2}>
            <KeyValueList items={provenanceItems(opportunity)} />
          </DetailSection>

          <DetailSection
            title="Offering"
            icon={BookOpen}
            description="The institution × programme pairing this call applies to."
          >
            {offering ? (
              <>
                <LinkedList
                  emptyTitle=""
                  items={[
                    {
                      key: offering.id,
                      href: `/internal/programs/${offering.id}`,
                      title: `${offering.program.name} · ${offering.institution?.name ?? "Unknown"}`,
                      meta: offering.duration ?? "Duration not recorded",
                      badge: <AvailabilityBadge availability={offering.availability} />,
                    },
                  ]}
                />
                <KeyValueList
                  className="border-t border-hairline"
                  items={[
                    { label: "Duration", value: offering.duration ?? <NotRecorded /> },
                    { label: "Intake", value: offering.intake ?? <NotRecorded /> },
                    { label: "Eligibility", value: offering.eligibility ?? <NotRecorded>Not published</NotRecorded> },
                    {
                      label: "Credit",
                      value: offering.creditInformation ?? <NotRecorded>Not published</NotRecorded>,
                    },
                  ]}
                />
              </>
            ) : (
              <p className="px-6 py-4 text-[13px] text-muted-foreground">
                This call is not linked to a specific offering.
              </p>
            )}
          </DetailSection>
        </div>

        <div className="space-y-6">
          <DetailSection title="Timeline" icon={CalendarClock}>
            <ol className="space-y-4 px-6 py-4">
              {[
                { label: "Opens", date: opportunity.opensOn },
                { label: "Deadline", date: opportunity.deadline },
              ].map((step) => (
                <li key={step.label} className="flex gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-glow" aria-hidden />
                  <div>
                    <p className="text-[11px] font-medium tracking-[0.14em] text-muj-fg uppercase">
                      {step.label}
                    </p>
                    <p className="text-[13px] text-foreground">{formatDate(step.date)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </DetailSection>

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
              <p className="px-6 py-4 text-[13px] text-muted-foreground">
                Not tied to a single institution.
              </p>
            )}
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
