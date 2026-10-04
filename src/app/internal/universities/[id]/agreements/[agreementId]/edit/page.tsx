import type { Metadata } from "next";
import { FileText, Trash2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AgreementForm } from "@/components/internal/forms/agreement-form";
import { DeleteRecordForm } from "@/components/internal/forms/delete-record-form";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { canManage, ReadOnlySourceNotice, requireManage } from "@/components/internal/ui/manage-action";
import { findAgreementRecord } from "@/lib/internal/data/agreements";
import { listInstitutionOptions } from "@/lib/internal/data/institutions";
import { agreementHref } from "@/lib/internal/links";
import { deleteAgreement } from "@/lib/internal/record-actions";

export const metadata: Metadata = { title: "Edit MoU" };

type Props = { params: Promise<{ id: string; agreementId: string }> };

export default async function EditAgreementPage({ params }: Props) {
  const access = await requireManage("agreements:update");
  const { id, agreementId } = await params;
  const agreement = await findAgreementRecord(agreementId);
  if (!agreement) notFound();
  // Edit from the lead university's URL, so the back link and redirects agree.
  if (agreement.institutionId !== id) {
    redirect(`/internal/universities/${agreement.institutionId}/agreements/${agreement.id}/edit`);
  }
  const backHref = agreementHref(agreement);

  return (
    <div className="space-y-6">
      <DetailHeader
        backHref={backHref}
        backLabel="Back to the university"
        eyebrow={agreement.reference}
        title="Edit MoU"
        subtitle={agreement.title}
      />
      {access === "static" ? (
        <ReadOnlySourceNotice />
      ) : (
        <>
          <DetailSection title="Agreement details" icon={FileText}>
            <AgreementForm
              cancelHref={backHref}
              institutions={await listInstitutionOptions()}
              initial={{
                code: agreement.id,
                leadSlug: agreement.institutionId,
                partnerSlugs: agreement.partnerInstitutionIds ?? [],
                title: agreement.title,
                reference: agreement.reference,
                type: agreement.type,
                typeLabel: agreement.typeLabel,
                recordStatus: agreement.recordStatus,
                startDate: agreement.startDate,
                endDate: agreement.endDate,
                renewal: agreement.renewal,
                notes: agreement.notes,
                verification: agreement.verification,
                sourceUrl: agreement.sourceUrl,
              }}
            />
          </DetailSection>

          {(await canManage("agreements:delete")) ? (
            <DetailSection
              title="Delete MoU"
              icon={Trash2}
              description="Removes the agreement with its partner links, contacts, and document links. The universities stay."
            >
              <DeleteRecordForm
                action={deleteAgreement}
                fields={{ code: agreement.id, lead: agreement.institutionId }}
                label="Delete MoU"
                confirmLabel={`I understand that ${agreement.reference} will be permanently deleted.`}
              />
            </DetailSection>
          ) : null}
        </>
      )}
    </div>
  );
}
