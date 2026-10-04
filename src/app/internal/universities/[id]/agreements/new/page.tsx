import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { AgreementForm } from "@/components/internal/forms/agreement-form";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { ReadOnlySourceNotice, requireManage } from "@/components/internal/ui/manage-action";
import { getInstitution, listInstitutionOptions } from "@/lib/internal/data/institutions";
import type { IdParamsProp } from "@/lib/internal/query";

export const metadata: Metadata = { title: "Add MoU" };

export default async function NewAgreementPage({ params }: IdParamsProp) {
  const access = await requireManage("agreements:create");
  const { id } = await params;
  const record = await getInstitution(id);
  if (!record) notFound();
  const { institution } = record;
  const backHref = `/internal/universities/${institution.id}`;

  return (
    <div className="space-y-6">
      <DetailHeader
        backHref={backHref}
        backLabel={institution.name}
        title="Add MoU"
        subtitle={`Recorded under ${institution.name}. Leave dates and status as not stated unless the signed document gives them.`}
      />
      {access === "static" ? (
        <ReadOnlySourceNotice />
      ) : (
        <DetailSection title="Agreement details" icon={FileText}>
          <AgreementForm
            cancelHref={backHref}
            institutions={await listInstitutionOptions()}
            initial={{
              code: null,
              leadSlug: institution.id,
              partnerSlugs: [],
              title: "",
              reference: "",
              type: "mou",
              typeLabel: null,
              recordStatus: "not-stated",
              startDate: null,
              endDate: null,
              renewal: null,
              notes: null,
              verification: "unverified",
              sourceUrl: null,
            }}
          />
        </DetailSection>
      )}
    </div>
  );
}
