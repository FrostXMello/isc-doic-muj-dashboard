import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { RecordForm } from "@/components/internal/forms/record-form";
import { activityGroups } from "@/components/internal/forms/specs";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { ReadOnlySourceNotice, requireManage } from "@/components/internal/ui/manage-action";
import { saveActivity } from "@/lib/internal/content-actions";
import { listEditOptions } from "@/lib/internal/data/editable";
import { readParam, type SearchParamsProp } from "@/lib/internal/query";

export const metadata: Metadata = { title: "Log activity" };

export default async function NewActivityPage({ searchParams }: SearchParamsProp) {
  const access = await requireManage("activities:create");
  const query = await searchParams;
  return (
    <div className="space-y-6">
      <DetailHeader
        backHref="/internal/activities"
        backLabel="Activities"
        title="Log activity"
        subtitle="A visit, delegation, event, or meeting."
      />
      {access === "static" ? (
        <ReadOnlySourceNotice />
      ) : (
        <DetailSection title="Activity" icon={CalendarDays}>
          <RecordForm
            action={saveActivity}
            groups={activityGroups(await listEditOptions())}
            initial={{
              institution: readParam(query, "institution"),
              recordStatus: "planned",
              verification: "needs-review",
            }}
            submitLabel="Log activity"
            cancelHref="/internal/activities"
          />
        </DetailSection>
      )}
    </div>
  );
}
