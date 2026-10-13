import type { Metadata } from "next";
import { Trash2, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { DeleteRecordForm } from "@/components/internal/forms/delete-record-form";
import { ContactForm } from "@/components/internal/forms/register-forms";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { canManage, ReadOnlySourceNotice, requireManage } from "@/components/internal/ui/manage-action";
import { getInstitution } from "@/lib/internal/data/institutions";
import { deleteContact } from "@/lib/internal/register-actions";
import { agreementTypeLabel } from "@/lib/internal/status";

export const metadata: Metadata = { title: "Edit contact" };

type Props = { params: Promise<{ id: string; contactId: string }> };

export default async function EditContactPage({ params }: Props) {
  const access = await requireManage("institutions:update");
  const { id, contactId } = await params;
  const record = await getInstitution(id);
  if (!record) notFound();
  const backHref = `/internal/universities/${id}#contacts`;
  if (access === "static") {
    return (
      <div className="space-y-6">
        <DetailHeader backHref={backHref} backLabel="Back to the university" eyebrow={record.institution.name} title="Edit contact" />
        <ReadOnlySourceNotice />
      </div>
    );
  }

  const contact =
    record.contactAccess.state === "granted"
      ? record.contactAccess.contacts.find((row) => row.id === contactId && row.institutionId === id)
      : undefined;
  if (!contact) notFound();
  const note = record.register.state === "granted" ? (record.register.contactNotes.get(contact.id) ?? null) : null;

  return (
    <div className="space-y-6">
      <DetailHeader
        backHref={backHref}
        backLabel="Back to the university"
        eyebrow={record.institution.name}
        title="Edit contact"
        subtitle={contact.roleLabel}
      />
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
          initial={{
            code: contact.id,
            roleLabel: contact.roleLabel,
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            sourceNote: note,
            agreementCode: contact.agreementId,
          }}
        />
      </DetailSection>
      {(await canManage("institutions:delete")) ? (
        <DetailSection title="Delete contact" icon={Trash2} description="The change is kept in the audit history.">
          <DeleteRecordForm
            action={deleteContact}
            fields={{ code: contact.id, university: id }}
            label="Delete contact"
            confirmLabel={`I understand that this ${contact.roleLabel} contact will be permanently deleted.`}
          />
        </DetailSection>
      ) : null}
    </div>
  );
}
