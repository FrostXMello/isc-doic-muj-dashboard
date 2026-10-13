import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { notFound } from "next/navigation";
import { RecordForm } from "@/components/internal/forms/record-form";
import { opportunityGroups } from "@/components/internal/forms/specs";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { ReadOnlySourceNotice, requireManage } from "@/components/internal/ui/manage-action";
import { ArchiveSection, DeleteSection } from "@/components/internal/ui/manage-sections";
import { deleteOpportunity, saveOpportunity } from "@/lib/internal/content-actions";
import { listEditOptions, loadOpportunityForEdit } from "@/lib/internal/data/editable";
import type { IdParamsProp } from "@/lib/internal/query";

export const metadata: Metadata = { title: "Edit call" };

export default async function EditOpportunityPage({ params }: IdParamsProp) {
  const access = await requireManage("opportunities:update");
  const { id } = await params;
  const backHref = `/internal/opportunities/${id}`;
  if (access === "static") {
    return (
      <div className="space-y-6">
        <DetailHeader backHref={backHref} backLabel="Call" title="Edit call" />
        <ReadOnlySourceNotice />
      </div>
    );
  }
  const call = await loadOpportunityForEdit(id);
  if (!call) notFound();

  return (
    <div className="space-y-6">
      <DetailHeader backHref={backHref} backLabel={call.title} title="Edit call" subtitle={call.title} />
      <DetailSection title="Call" icon={Compass}>
        <RecordForm
          action={saveOpportunity}
          groups={opportunityGroups(await listEditOptions())}
          hidden={{ existing: call.code }}
          initial={{
            title: call.title,
            program: call.program?.program_type,
            offering: call.availability?.code,
            institution: call.institution?.slug,
            opensOn: call.opens_on,
            deadline: call.deadline,
            recordStatus: call.record_status,
            summary: call.summary,
            verification: call.verification,
            sourceUrl: call.source_url,
          }}
          submitLabel="Save call"
          cancelHref={backHref}
        />
      </DetailSection>
      <ArchiveSection
        resource="opportunities"
        kind="opportunity"
        recordKey={call.code}
        archived={call.record_status === "archived"}
        noun="call"
        archivedMeans="archived and hidden from students; restoring returns it as a draft"
      />
      <DeleteSection
        resource="opportunities"
        action={deleteOpportunity}
        recordKey={call.code}
        noun="call"
        name={call.title}
        description="Refused while student applications reference the call. Archive it instead."
      />
    </div>
  );
}
