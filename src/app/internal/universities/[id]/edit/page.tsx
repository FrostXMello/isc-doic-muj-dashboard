import type { Metadata } from "next";
import { GraduationCap, Trash2 } from "lucide-react";
import { notFound } from "next/navigation";
import { DeleteRecordForm } from "@/components/internal/forms/delete-record-form";
import { UniversityForm } from "@/components/internal/forms/university-form";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { canManage, ReadOnlySourceNotice, requireManage } from "@/components/internal/ui/manage-action";
import { listCountryOptions } from "@/lib/internal/data/form-options";
import { getInstitution } from "@/lib/internal/data/institutions";
import type { IdParamsProp } from "@/lib/internal/query";
import { deleteInstitution } from "@/lib/internal/record-actions";

export const metadata: Metadata = { title: "Edit university" };

export default async function EditUniversityPage({ params }: IdParamsProp) {
  const access = await requireManage("institutions:update");
  const { id } = await params;
  const record = await getInstitution(id);
  if (!record) notFound();
  const { institution, agreements } = record;
  const backHref = `/internal/universities/${institution.id}`;

  return (
    <div className="space-y-6">
      <DetailHeader backHref={backHref} backLabel={institution.name} title="Edit university" subtitle={institution.name} />
      {access === "static" ? (
        <ReadOnlySourceNotice />
      ) : (
        <>
          <DetailSection title="University details" icon={GraduationCap}>
            <UniversityForm
              cancelHref={backHref}
              countries={await listCountryOptions()}
              initial={{
                slug: institution.id,
                name: institution.name,
                normalizedName: institution.normalizedName,
                countrySlug: institution.countryId,
                city: institution.city,
                website: institution.website,
                note: institution.note,
                isPublic: institution.isPublic,
                verification: institution.verification,
                sourceUrl: institution.sourceUrl,
              }}
            />
          </DetailSection>

          {(await canManage("institutions:delete")) ? (
            <DetailSection
              title="Delete university"
              icon={Trash2}
              description={
                agreements.length > 0
                  ? `${agreements.length} MoU${agreements.length === 1 ? " is" : "s are"} linked to this university. Delete or move ${agreements.length === 1 ? "it" : "them"} first.`
                  : "Removes the university record with its contacts and document links. Activities stay, without the link."
              }
            >
              <DeleteRecordForm
                action={deleteInstitution}
                fields={{ slug: institution.id }}
                label="Delete university"
                confirmLabel={`I understand that ${institution.name} will be permanently deleted.`}
              />
            </DetailSection>
          ) : null}
        </>
      )}
    </div>
  );
}
