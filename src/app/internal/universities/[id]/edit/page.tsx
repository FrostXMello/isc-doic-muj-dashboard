import type { Metadata } from "next";
import { ChevronDown, FileText, GraduationCap, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgreementForm } from "@/components/internal/forms/agreement-form";
import { SuccessNotice } from "@/components/internal/forms/form-fields";
import { DeleteRecordForm } from "@/components/internal/forms/delete-record-form";
import { AgreementDetailsForm, ContactForm } from "@/components/internal/forms/register-forms";
import { UniversityForm } from "@/components/internal/forms/university-form";
import { RegisterNotice } from "@/components/internal/university-register";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { canManage, ManageLink, ReadOnlySourceNotice, requireManage } from "@/components/internal/ui/manage-action";
import { listCountryOptions } from "@/lib/internal/data/form-options";
import { getInstitution, listInstitutionOptions } from "@/lib/internal/data/institutions";
import { formatDateRange } from "@/lib/internal/dates";
import { readParam, type SearchParamsRecord } from "@/lib/internal/query";
import { deleteInstitution } from "@/lib/internal/record-actions";
import { agreementTypeLabel } from "@/lib/internal/status";
import { qs2027ForInstitution } from "@/lib/official/qs-rankings-2027";

export const metadata: Metadata = { title: "Edit university" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<SearchParamsRecord> };

/** A collapsed panel holding one record's forms. */
function EditPanel({ title, meta, open, children }: { title: string; meta: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group border-t border-hairline">
      <summary className="portal-row-marker flex cursor-pointer list-none items-start gap-3 px-6 py-4 hover:bg-overlay [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium [overflow-wrap:anywhere] text-foreground">{title}</span>
          <span className="mt-0.5 block text-[12px] [overflow-wrap:anywhere] text-muted-foreground">{meta}</span>
        </span>
        <ChevronDown
          className="mt-0.5 size-4 shrink-0 text-fg-dim transition-transform group-open:rotate-180 group-open:text-muj-fg motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      <div className="bg-overlay-subtle pb-2">{children}</div>
    </details>
  );
}

function PanelHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-6 pt-4 text-[11px] font-medium tracking-[0.14em] text-fg-faint uppercase">{children}</p>
  );
}

export default async function EditUniversityPage({ params, searchParams }: Props) {
  const access = await requireManage("institutions:update");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const record = await getInstitution(id);
  if (!record) notFound();
  const { institution, agreements, register, contactAccess } = record;
  const backHref = `/internal/universities/${institution.id}`;

  if (access === "static") {
    return (
      <div className="space-y-6">
        <DetailHeader backHref={backHref} backLabel={institution.name} title="Edit university" subtitle={institution.name} />
        <ReadOnlySourceNotice />
      </div>
    );
  }

  const [countries, institutionOptions, canEditAgreements, canDelete] = await Promise.all([
    listCountryOptions(),
    listInstitutionOptions(),
    canManage("agreements:update"),
    canManage("institutions:delete"),
  ]);
  const lead = agreements.filter(({ role }) => role === "lead");
  const partnerOf = agreements.filter(({ role }) => role === "partner");
  const detailsFor = (agreementId: string) =>
    register.state === "granted" ? register.details.get(agreementId) : undefined;
  const publishedQs = qs2027ForInstitution(institution.id)?.rank ?? null;
  const contacts =
    contactAccess.state === "granted" ? contactAccess.contacts.filter((row) => row.institutionId === institution.id) : [];
  const agreementChoices = lead.map(({ agreement }) => ({
    id: agreement.id,
    label: `${agreement.reference} · ${agreement.typeLabel ?? agreementTypeLabel[agreement.type]}`,
  }));
  const contactNote = (contactId: string) =>
    register.state === "granted" ? (register.contactNotes.get(contactId) ?? null) : null;

  return (
    <div className="space-y-6">
      <DetailHeader
        backHref={backHref}
        backLabel={institution.name}
        title="Edit university"
        subtitle={institution.name}
      />

      {readParam(query, "notice") === "university-created" ? (
        <SuccessNotice>University added. Add its MoUs and contacts below.</SuccessNotice>
      ) : null}

      <DetailSection
        id="details"
        title="University details"
        icon={GraduationCap}
              >
        <UniversityForm
          cancelHref={backHref}
          countries={countries}
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
            sourceTitle: institution.sourceTitle,
            sourceCheckedOn: institution.sourceCheckedOn,
            latitude: institution.latitude,
            longitude: institution.longitude,
          }}
        />
      </DetailSection>

      <DetailSection
        id="mous"
        title={`MoUs & register details (${lead.length})`}
        icon={FileText}
        description="Open a MoU to edit its dates, status, and register details."
        action={
          <ManageLink
            permission="agreements:create"
            href={`/internal/universities/${institution.id}/agreements/new`}
            label="Add MoU"
            icon="add"
            size="sm"
          />
        }
      >
        {lead.length === 0 ? (
          <p className="border-t border-hairline px-6 py-4 text-[13px] text-fg-faint">No MoUs are recorded under this university.</p>
        ) : !canEditAgreements ? (
          <p className="border-t border-hairline px-6 py-4 text-[13px] text-fg-faint">Your role can&apos;t edit MoUs.</p>
        ) : (
          lead.map(({ agreement }) => {
            const details = detailsFor(agreement.id);
            return (
              <EditPanel
                key={agreement.id}
                title={agreement.title}
                meta={`${agreement.reference} · ${agreement.typeLabel ?? agreementTypeLabel[agreement.type]} · ${formatDateRange(agreement.startDate, agreement.endDate)}`}
                open={lead.length === 1}
              >
                <PanelHeading>Agreement</PanelHeading>
                <AgreementForm
                  cancelHref={backHref}
                  institutions={institutionOptions}
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
                <div className="border-t border-hairline">
                  <PanelHeading>DoIC register details</PanelHeading>
                  {register.state === "granted" ? (
                    <AgreementDetailsForm
                      code={agreement.id}
                      lead={agreement.institutionId}
                      cancelHref={backHref}
                      publishedQs={publishedQs}
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
                    <div className="px-6 pt-2 pb-4">
                      <RegisterNotice register={register} />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 border-t border-hairline px-6 py-3 text-[12px]">
                  <Link
                    href={`/internal/universities/${institution.id}/agreements/${agreement.id}/edit`}
                    className="text-muj-fg hover:text-foreground"
                  >
                    Open on its own page (and delete)
                  </Link>
                </div>
              </EditPanel>
            );
          })
        )}
        {partnerOf.length > 0 ? (
          <div className="border-t border-hairline px-6 py-4 text-[12px] text-fg-subtle">
            <p className="mb-1.5">Also a partner on these MoUs, which are edited under their lead university:</p>
            <ul className="space-y-1">
              {partnerOf.map(({ agreement }) => (
                <li key={agreement.id}>
                  <Link
                    href={`/internal/universities/${agreement.institutionId}/edit#mous`}
                    className="text-muj-fg [overflow-wrap:anywhere] hover:text-foreground"
                  >
                    {agreement.reference} · {agreement.institution?.name ?? agreement.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DetailSection>

      <DetailSection
        id="contacts"
        title={`Nodal officers & contacts (${contacts.length})`}
        icon={UserRound}
        description="Internal only; never shown on the public site."
      >
        {contactAccess.state === "restricted" ? (
          <p className="border-t border-hairline px-6 py-4 text-[13px] text-fg-faint">
            Contacts are stored only in the access-controlled database.
          </p>
        ) : (
          <>
            {contacts.map((contact) => (
              <EditPanel
                key={contact.id}
                title={contact.name ?? "Name not recorded"}
                meta={[contact.roleLabel, contact.agreementId].filter(Boolean).join(" · ")}
              >
                <ContactForm
                  university={institution.id}
                  cancelHref={backHref}
                  agreements={agreementChoices}
                  initial={{
                    code: contact.id,
                    roleLabel: contact.roleLabel,
                    name: contact.name,
                    phone: contact.phone,
                    email: contact.email,
                    sourceNote: contactNote(contact.id),
                    agreementCode: contact.agreementId,
                  }}
                />
                <div className="border-t border-hairline px-6 py-3 text-[12px]">
                  <Link
                    href={`/internal/universities/${institution.id}/contacts/${contact.id}/edit`}
                    className="text-muj-fg hover:text-foreground"
                  >
                    Open on its own page (and delete)
                  </Link>
                </div>
              </EditPanel>
            ))}
            <EditPanel title="Add a contact" meta="DoIC nodal officer, partner nodal officer, or another contact">
              <ContactForm
                university={institution.id}
                cancelHref={backHref}
                agreements={agreementChoices}
                initial={{
                  code: null,
                  roleLabel: "",
                  name: null,
                  phone: null,
                  email: null,
                  sourceNote: null,
                  agreementCode: null,
                }}
              />
            </EditPanel>
          </>
        )}
      </DetailSection>

      {canDelete ? (
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
    </div>
  );
}
