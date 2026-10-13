import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { notFound } from "next/navigation";
import { RecordForm } from "@/components/internal/forms/record-form";
import { activityGroups } from "@/components/internal/forms/specs";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { ReadOnlySourceNotice, requireManage } from "@/components/internal/ui/manage-action";
import { ArchiveSection, DeleteSection } from "@/components/internal/ui/manage-sections";
import { deleteActivity, saveActivity } from "@/lib/internal/content-actions";
import { listEditOptions, loadActivityForEdit } from "@/lib/internal/data/editable";
import type { IdParamsProp } from "@/lib/internal/query";

export const metadata: Metadata = { title: "Edit activity" };

export default async function EditActivityPage({ params }: IdParamsProp) {
  const access = await requireManage("activities:update");
  const { id } = await params;
  const backHref = `/internal/activities/${id}`;
  if (access === "static") {
    return (
      <div className="space-y-6">
        <DetailHeader backHref={backHref} backLabel="Activity" title="Edit activity" />
        <ReadOnlySourceNotice />
      </div>
    );
  }
  const activity = await loadActivityForEdit(id);
  if (!activity) notFound();

  return (
    <div className="space-y-6">
      <DetailHeader backHref={backHref} backLabel={activity.title} title="Edit activity" subtitle={activity.title} />
      <DetailSection title="Activity" icon={CalendarDays}>
        <RecordForm
          action={saveActivity}
          groups={activityGroups(await listEditOptions())}
          hidden={{ existing: activity.code }}
          initial={{
            title: activity.title,
            type: activity.activity_type,
            recordStatus: activity.record_status,
            startDate: activity.start_date,
            endDate: activity.end_date,
            country: activity.country?.slug,
            city: activity.city,
            institution: activity.institution?.slug,
            agreement: activity.agreement?.code,
            summary: activity.summary,
            participants: activity.participants,
            verification: activity.verification,
            sourceUrl: activity.source_url,
          }}
          submitLabel="Save activity"
          cancelHref={backHref}
        />
      </DetailSection>
      <ArchiveSection
        resource="activities"
        kind="activity"
        recordKey={activity.code}
        archived={activity.record_status === "cancelled"}
        noun="activity"
        archivedMeans="cancelled; restoring returns it as planned"
      />
      <DeleteSection
        resource="activities"
        action={deleteActivity}
        recordKey={activity.code}
        noun="activity"
        name={activity.title}
        description="Removes the activity record. Cancel it instead to keep the history."
      />
    </div>
  );
}
