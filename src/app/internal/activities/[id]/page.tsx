import type { Metadata } from "next";
import { agreementHref } from "@/lib/internal/links";
import { CalendarDays, FileText, FolderOpen, GraduationCap, Link2 } from "lucide-react";
import { notFound } from "next/navigation";
import { DocumentStatusBadge } from "@/components/internal/badges";
import { DetailHeader, DetailSection, KeyValueList, LinkedList } from "@/components/internal/ui/detail";
import { NotRecorded } from "@/components/internal/ui/page-header";
import { ManageLink } from "@/components/internal/ui/manage-action";
import { provenanceItems, VerificationBadge } from "@/components/internal/ui/provenance";
import { SourceBadge } from "@/components/internal/ui/source-badge";
import { EventFilesSection } from "@/components/internal/event-files-section";
import { InsightsCard } from "@/components/internal/insights-card";
import { getActivity, listActivities } from "@/lib/internal/data/activities";
import { eventInsights } from "@/lib/internal/insights";
import { formatDateRange, formatRelativeDays } from "@/lib/internal/dates";
import type { IdParamsProp, SearchParamsProp } from "@/lib/internal/query";
import { RecordNotice } from "@/components/internal/ui/record-notice";
import { activityTypeLabel, documentTypeLabel } from "@/lib/internal/status";

export async function generateMetadata({ params }: IdParamsProp): Promise<Metadata> {
  const { id } = await params;
  const record = await getActivity(id);
  return { title: record?.activity.title ?? "Activity not found" };
}

export default async function ActivityDetailPage({ params, searchParams }: IdParamsProp & SearchParamsProp) {
  const { id } = await params;
  const [record, all] = await Promise.all([getActivity(id), listActivities()]);
  if (!record) notFound();

  const { activity, documents } = record;
  const { institution, agreement } = activity;

  return (
    <div className="space-y-6">
      <DetailHeader
        backHref="/internal/activities"
        backLabel="All activities"
        eyebrow={activityTypeLabel[activity.type]}
        title={activity.title}
        subtitle={`${formatDateRange(activity.startDate, activity.endDate)} · ${formatRelativeDays(activity.daysFromToday)}`}
        badges={
          <>
            <SourceBadge source={activity.source} />
            <VerificationBadge status={activity.verification} />
          </>
        }
        actions={
          <ManageLink permission="activities:update" href={`/internal/activities/${id}/edit`} label="Edit event" icon="edit" />
        }
      />
      <RecordNotice query={await searchParams} />

      <InsightsCard tabs={eventInsights(activity, all)} />

      <EventFilesSection
        id="files"
        activityCode={id}
        title="Event files"
        description="The event's working folder: notesheets, budgets, brochures, certificates, photos, and reports."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailSection title="Activity details" icon={CalendarDays}>
            <KeyValueList
              items={[
                { label: "Type", value: activityTypeLabel[activity.type] },
                { label: "Dates", value: formatDateRange(activity.startDate, activity.endDate) },
                {
                  label: "Location",
                  value: [activity.city, activity.country].filter(Boolean).join(", "),
                },
                { label: "Participants", value: activity.participants ?? <NotRecorded /> },
                { label: "Country", value: activity.country },
                { label: "Summary", wide: true, value: activity.summary },
              ]}
            />
          </DetailSection>

          <DetailSection title="Provenance" icon={Link2}>
            <KeyValueList items={provenanceItems(activity)} />
          </DetailSection>

          <DetailSection title="Documents" icon={FolderOpen} description="Documents attached to the related agreement.">
            <LinkedList
              emptyTitle="No related documents"
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
              <p className="px-4 sm:px-6 py-4 text-[13px] text-muted-foreground">
                No institution recorded. Country: {activity.country}.
              </p>
            )}
          </DetailSection>

          <DetailSection title="Related agreement" icon={FileText}>
            {agreement ? (
              <LinkedList
                emptyTitle=""
                items={[
                  {
                    key: agreement.id,
                    href: agreementHref(agreement),
                    title: agreement.title,
                    meta: agreement.reference,
                  },
                ]}
              />
            ) : (
              <p className="px-4 sm:px-6 py-4 text-[13px] text-muted-foreground">No agreement linked.</p>
            )}
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
