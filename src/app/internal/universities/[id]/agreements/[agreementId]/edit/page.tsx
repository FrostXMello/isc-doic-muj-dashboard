import type { Metadata } from "next";
import { BookMarked, FileText, Trash2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AgreementForm } from "@/components/internal/forms/agreement-form";
import { DeleteRecordForm } from "@/components/internal/forms/delete-record-form";
import { AgreementDetailsForm } from "@/components/internal/forms/register-forms";
import { RegisterNotice } from "@/components/internal/university-register";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { canManage, ReadOnlySourceNotice, requireManage } from "@/components/internal/ui/manage-action";
import { findAgreementRecord } from "@/lib/internal/data/agreements";
import { listInstitutionOptions } from "@/lib/internal/data/institutions";
import { loadRegister } from "@/lib/internal/data/register";
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
  const register = await loadRegister();
  const details = register.state === "granted" ? register.details.get(agreement.id) : undefined;

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

          <DetailSection
            id="register"
            title="DoIC register details"
            icon={BookMarked}
            description="Reference, period, rankings, faculty, opportunities, remarks, and the agreement file link from the DoIC MoU register."
          >
            {register.state === "granted" ? (
              <AgreementDetailsForm
                code={agreement.id}
                lead={agreement.institutionId}
                cancelHref={backHref}
                initial={{
                  doicReference: details?.doicReference ?? null,
                  initiationYear: details?.initiationYear ?? null,
                  renewalYear: details?.renewalYear ?? null,
                  periodText: details?.periodText ?? null,
                  expiryText: details?.expiryText ?? null,
                  recordedStatus: details?.recordedStatus ?? null,
                  qsRanking: details?.qsRanking ?? null,
                  theRanking: details?.theRanking ?? null,
                  faculty: details?.faculty ?? null,
                  department: details?.department ?? null,
                  opportunities: details?.opportunities ?? null,
                  programmeReference: details?.programmeReference ?? null,
                  remarks: details?.remarks ?? null,
                  documentUrl: details?.documentUrl ?? null,
                }}
              />
            ) : (
              <div className="px-6 pb-6">
                <RegisterNotice register={register} />
              </div>
            )}
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
