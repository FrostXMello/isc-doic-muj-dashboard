import type { Metadata } from "next";
import { UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/internal/forms/register-forms";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { ReadOnlySourceNotice, requireManage } from "@/components/internal/ui/manage-action";
import { getInstitution } from "@/lib/internal/data/institutions";
import { agreementTypeLabel } from "@/lib/internal/status";

export const metadata: Metadata = { title: "Add contact" };

type Props = { params: Promise<{ id: string }> };

export default async function NewContactPage({ params }: Props) {
  const access = await requireManage("institutions:update");
  const { id } = await params;
  const record = await getInstitution(id);
  if (!record) notFound();
  const backHref = `/internal/universities/${id}#contacts`;

  return (
    <div className="space-y-6">
      <DetailHeader backHref={backHref} backLabel="Back to the university" eyebrow={record.institution.name} title="Add contact" />
      {access === "static" ? (
        <ReadOnlySourceNotice />
      ) : (
        <DetailSection title="Contact" icon={UserRound}>
          <ContactForm
            university={id}
            cancelHref={backHref}
            agreements={record.agreements
              .filter(({ role }) => role === "lead")
              .map(({ agreement }) => ({
                id: agreement.id,
                label: `${agreement.reference} · ${agreement.typeLabel ?? agreementTypeLabel[agreement.type]}`,
              }))}
            initial={{ code: null, roleLabel: "", name: null, phone: null, email: null, sourceNote: null, agreementCode: null }}
          />
        </DetailSection>
      )}
    </div>
  );
}
