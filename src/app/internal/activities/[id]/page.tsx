import type { Metadata } from "next";
import { agreementHref } from "@/lib/internal/links";
import { CalendarDays, FileText, FolderOpen, GraduationCap, Link2 } from "lucide-react";
import { notFound } from "next/navigation";
import { ActivityStatusBadge, DocumentStatusBadge } from "@/components/internal/badges";
import { DetailHeader, DetailSection, KeyValueList, LinkedList } from "@/components/internal/ui/detail";
import { NotRecorded } from "@/components/internal/ui/page-header";
import { unavailableReasons } from "@/components/internal/ui/placeholder-action";
import { RecordAction } from "@/components/internal/ui/record-action";
import { provenanceItems, VerificationBadge } from "@/components/internal/ui/provenance";
import { SourceBadge } from "@/components/internal/ui/source-badge";
import { getActivity } from "@/lib/internal/data/activities";
import { formatDateRange, formatRelativeDays } from "@/lib/internal/dates";
import type { IdParamsProp } from "@/lib/internal/query";
import { activityTypeLabel, documentTypeLabel } from "@/lib/internal/status";
import type { ActivityView } from "@/lib/internal/types";

export async function generateMetadata({ params }: IdParamsProp): Promise<Metadata> {
  const { id } = await params;
  const record = await getActivity(id);
  return { title: record?.activity.title ?? "Activity not found" };
}

function statusExplanation(activity: ActivityView) {
  switch (activity.status) {
    case "needs-update":
      return "The date has passed but the activity is still marked planned or confirmed. Record the outcome or cancellation.";
    case "planned":
      return "Planned; details are not yet confirmed.";
    case "confirmed":
      return "Confirmed with the participants.";
    case "completed":
      return "Completed.";
    case "cancelled":
      return "Cancelled.";
  }
}

export default async function ActivityDetailPage({ params }: IdParamsProp) {
  const { id } = await params;
  const record = await getActivity(id);
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
            <ActivityStatusBadge status={activity.status} />
            <SourceBadge source={activity.source} />
            <VerificationBadge status={activity.verification} />
          </>
        }
        actions={
          <RecordAction
            permission="activities:update"
            label="Update outcome"
            icon="edit"
            reason={unavailableReasons.editing}
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailSection title="Activity details" icon={CalendarDays}>
            <KeyValueList
              items={[
                { label: "Type", value: activityTypeLabel[activity.type] },
                {
                  label: "Status",
                  value: (
                    <span className="space-y-1">
                      <ActivityStatusBadge status={activity.status} />
                      <span className="block text-[12px] text-muted-foreground">
                        {statusExplanation(activity)}
                      </span>
                    </span>
                  ),
                },
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
              <p className="px-6 py-4 text-[13px] text-muted-foreground">
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
              <p className="px-6 py-4 text-[13px] text-muted-foreground">No agreement linked.</p>
            )}
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
