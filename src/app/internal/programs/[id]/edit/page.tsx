import type { Metadata } from "next";
import { BookOpen, ClipboardList } from "lucide-react";
import { notFound } from "next/navigation";
import { RecordForm } from "@/components/internal/forms/record-form";
import { offeringGroups, programGroups } from "@/components/internal/forms/specs";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { ReadOnlySourceNotice, requireManage } from "@/components/internal/ui/manage-action";
import { ArchiveSection, DeleteSection } from "@/components/internal/ui/manage-sections";
import { deleteOffering, deleteProgram, saveOffering, saveProgram } from "@/lib/internal/content-actions";
import { listEditOptions, loadOfferingForEdit, loadProgramForEdit } from "@/lib/internal/data/editable";
import type { IdParamsProp } from "@/lib/internal/query";
import { programTypeLabel } from "@/lib/internal/status";

export const metadata: Metadata = { title: "Edit programme" };

export default async function EditProgramOrOfferingPage({ params }: IdParamsProp) {
  const access = await requireManage("programs:update");
  const { id } = await params;
  const backHref = `/internal/programs/${id}`;
  if (access === "static") {
    return (
      <div className="space-y-6">
        <DetailHeader backHref={backHref} backLabel="Back" title="Edit programme" />
        <ReadOnlySourceNotice />
      </div>
    );
  }

  const program = await loadProgramForEdit(id);
  if (program) {
    return (
      <div className="space-y-6">
        <DetailHeader backHref={backHref} backLabel={program.name} title="Edit programme" subtitle={program.name} />
        <DetailSection title="Programme" icon={BookOpen}>
          <RecordForm
            action={saveProgram}
            groups={programGroups(false, [])}
            hidden={{ existing: program.program_type }}
            initial={{
              name: program.name,
              description: program.description,
              generalAudience: program.general_audience,
              isPublished: program.is_published,
              sortOrder: program.sort_order,
              verification: program.verification,
              sourceUrl: program.source_url,
            }}
            submitLabel="Save programme"
            cancelHref={backHref}
          />
        </DetailSection>
        <ArchiveSection
          resource="programs"
          kind="programme"
          recordKey={program.program_type}
          archived={!program.is_published}
          noun="programme"
          archivedMeans="unpublished and hidden from the public website"
        />
        <DeleteSection
          resource="programs"
          action={deleteProgram}
          recordKey={program.program_type}
          noun="programme"
          name={program.name}
          description="Only possible when no offering, call, or document link uses it. Archive it otherwise."
        />
      </div>
    );
  }

  const offering = await loadOfferingForEdit(id);
  if (!offering) notFound();
  const options = await listEditOptions();
  const title = programTypeLabel[offering.program?.program_type as keyof typeof programTypeLabel] ?? "Offering";

  return (
    <div className="space-y-6">
      <DetailHeader backHref={backHref} backLabel="Offering" title="Edit offering" subtitle={title} />
      <DetailSection title="Offering" icon={ClipboardList}>
        <RecordForm
          action={saveOffering}
          groups={offeringGroups(options)}
          hidden={{ existing: offering.code }}
          initial={{
            program: offering.program?.program_type,
            institution: offering.institution?.slug,
            agreement: offering.agreement?.code,
            availability: offering.availability,
            duration: offering.duration,
            intake: offering.intake,
            applicationStart: offering.application_start,
            applicationEnd: offering.application_end,
            eligibility: offering.eligibility,
            creditInformation: offering.credit_information,
            notes: offering.notes,
            isPublished: offering.is_published,
            verification: offering.verification,
            sourceUrl: offering.source_url,
          }}
          submitLabel="Save offering"
          cancelHref={backHref}
        />
      </DetailSection>
      <ArchiveSection
        resource="programs"
        kind="offering"
        recordKey={offering.code}
        archived={!offering.is_published}
        noun="offering"
        archivedMeans="unpublished and hidden from the public website"
      />
      <DeleteSection
        resource="programs"
        action={deleteOffering}
        recordKey={offering.code}
        noun="offering"
        name="this offering"
        description="Only possible when no call or document link uses it. Archive it otherwise."
      />
    </div>
  );
}
