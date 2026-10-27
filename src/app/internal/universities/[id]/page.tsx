import type { Metadata } from "next";
import { BookMarked, BookOpen, CalendarDays, ChevronDown, FileText, FolderOpen, Globe, Link2, Lock, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { AgreementCard } from "@/components/internal/agreement-card";
import {
  ActivityStatusBadge,
  AvailabilityBadge,
  DocumentStatusBadge,
  PartnershipBadge,
} from "@/components/internal/badges";
import { SuccessNotice } from "@/components/internal/forms/form-fields";
import { InsightsCard } from "@/components/internal/insights-card";
import { DetailHeader, DetailSection, KeyValueList, LinkedList } from "@/components/internal/ui/detail";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { canManage, ManageLink } from "@/components/internal/ui/manage-action";
import Link from "next/link";
import { NotRecorded } from "@/components/internal/ui/page-header";
import { VerificationBadge } from "@/components/internal/ui/provenance";
import { UniversityProvenance } from "@/components/internal/university-provenance";
import {
  ContactRows,
  Facts,
  OfficerList,
  RegisterNotice,
  UniversityRegisterRows,
} from "@/components/internal/university-register";
import { SourceBadge } from "@/components/internal/ui/source-badge";
import { getInstitution } from "@/lib/internal/data/institutions";
import { formatDateRange } from "@/lib/internal/dates";
import { universityInsights } from "@/lib/internal/insights";
import { readParam, type SearchParamsRecord } from "@/lib/internal/query";
import { documentTypeLabel, sourceMeta } from "@/lib/internal/status";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParamsRecord>;
};

const notices: Record<string, string> = {
  "university-created": "University added. You can now record its MoUs.",
  "university-updated": "University details saved.",
  "agreement-created": "MoU added.",
  "agreement-updated": "MoU saved.",
  "agreement-deleted": "MoU deleted.",
  "register-updated": "Register details saved.",
  "contact-created": "Contact added.",
  "contact-updated": "Contact saved.",
  "contact-deleted": "Contact deleted.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const record = await getInstitution(id);
  return { title: record?.institution.name ?? "University not found" };
}

export default async function UniversityDetailPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const record = await getInstitution(id);
  if (!record) notFound();

  const { today, institution, agreements, offerings, opportunities, activities, documents, peers, contactAccess, register, entry } =
    record;
  const registerByAgreement = new Map(entry.agreements.map((item) => [item.agreement.id, item]));
  const registerRows = [
    ...entry.agreements.flatMap(({ rows }) => [...rows.list, ...rows.status, ...rows.renewal, ...rows.link]),
    ...entry.universityRows,
  ];
  const openAgreement = readParam(query, "agreement");
  const notice = notices[readParam(query, "notice") ?? ""];
  const insights = universityInsights({
    institution,
    agreements: agreements.map(({ agreement }) => agreement),
    entry,
    activities,
    offerings,
    today,
  });
  const summary = [
    `${institution.activeAgreementCount} of ${agreements.length} MoU${agreements.length === 1 ? "" : "s"} active`,
    entry.qsRankings[0] ? `QS ${entry.qsRankings[0]}` : null,
    activities.length ? `${activities.length} event${activities.length === 1 ? "" : "s"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <DetailHeader
        backHref="/internal/universities"
        backLabel="All universities"
        eyebrow={institution.region}
        title={institution.name}
        subtitle={[institution.city, institution.country].filter(Boolean).join(" · ")}
        badges={
          <>
            <PartnershipBadge status={institution.partnershipStatus} />
            <VerificationBadge status={institution.verification} />
          </>
        }
        actions={
          <>
            <ManageLink
              permission="institutions:update"
              href={`/internal/universities/${institution.id}/edit`}
              label="Edit university"
              icon="edit"
            />
            <ManageLink
              permission="agreements:create"
              href={`/internal/universities/${institution.id}/agreements/new`}
              label="Add MoU"
              icon="add"
              variant="primary"
            />
          </>
        }
      />

      {notice ? <SuccessNotice>{notice}</SuccessNotice> : null}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-start-3 lg:row-start-1">
          <InsightsCard compact tabs={insights} subtitle={summary} />
        </div>

        <div className="min-w-0 space-y-6 lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <DetailSection
            title={`MoUs (${agreements.length})`}
            icon={FileText}
            description="Open a MoU for its dates, scope, department, and register details."
          >
            {agreements.length > 0 ? (
              <div>
                {agreements.map((item) => (
                  <AgreementCard
                    key={item.agreement.id}
                    entry={item}
                    universityId={institution.id}
                    today={today}
                    open={openAgreement === item.agreement.id || agreements.length === 1}
                    register={registerByAgreement.get(item.agreement.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                title="No MoUs recorded"
                action={
                  <ManageLink
                    permission="agreements:create"
                    href={`/internal/universities/${institution.id}/agreements/new`}
                    label="Add the first MoU"
                    icon="add"
                    size="sm"
                  />
                }
              />
            )}
          </DetailSection>
        </div>

        <div className="min-w-0 space-y-6 lg:col-start-3 lg:row-start-2">
          <DetailSection
            id="contacts"
            title="Nodal officers"
            icon={contactAccess.state === "granted" ? UserRound : Lock}
            description="Internal only; do not publish."
            action={
              <ManageLink
                permission="institutions:update"
                href={`/internal/universities/${institution.id}/contacts/new`}
                label="Add"
                icon="add"
                size="sm"
              />
            }
          >
            {contactAccess.state === "restricted" ? (
              <p className="px-6 pb-5 text-[13px] text-fg-faint">
                {contactAccess.reason === "static-source"
                  ? "Contacts are stored only in the access-controlled database."
                  : "Your account does not hold an internal DoIC role."}
              </p>
            ) : (
              <div className="space-y-4 px-6 pb-5 text-[13px]">
                <div>
                  <p className="mb-1.5 text-[11px] font-medium tracking-[0.14em] text-fg-faint uppercase">DoIC nodal officer</p>
                  <OfficerList officers={entry.officers} />
                </div>
                {entry.earlierOfficers.length > 0 ? (
                  <div>
                    <p className="mb-1.5 text-[11px] font-medium tracking-[0.14em] text-fg-faint uppercase">Earlier nodal officer</p>
                    <OfficerList officers={entry.earlierOfficers} />
                  </div>
                ) : null}
                {entry.universityContacts.length > 0 ? <ContactRows contacts={entry.universityContacts} /> : null}
                <ManageContacts universityId={institution.id} contacts={contactAccess.contacts.filter((row) => row.institutionId === institution.id)} />
              </div>
            )}
          </DetailSection>

          {institution.note ? (
            <DetailSection title="Review note">
              <p className="px-6 pb-5 text-[13px] leading-relaxed text-muted-foreground">{institution.note}</p>
            </DetailSection>
          ) : null}
        </div>
      </div>

      <details className="group portal-surface overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-4 hover:bg-overlay [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium text-foreground">More details</span>
            <span className="block text-[12px] text-muted-foreground">
              Events, programmes, register rows, profile, documents, sources, and other universities in {institution.country}
            </span>
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-fg-dim transition-transform group-open:rotate-180 group-open:text-muj-fg motion-reduce:transition-none"
            aria-hidden
          />
        </summary>

        <div className="grid grid-cols-1 gap-6 border-t border-hairline bg-overlay-subtle p-4 sm:p-6 lg:grid-cols-2">
          <DetailSection id="events" title={`Flagship events (${activities.length})`} icon={CalendarDays}>
            <LinkedList
              emptyTitle="No events recorded"
              items={activities.map((activity) => ({
                key: activity.id,
                href: `/internal/activities/${activity.id}`,
                title: activity.title,
                meta: formatDateRange(activity.startDate, activity.endDate),
                badge: <ActivityStatusBadge status={activity.status} />,
              }))}
            />
          </DetailSection>

          <DetailSection title={`Programme offerings (${offerings.length})`} icon={BookOpen}>
            <LinkedList
              emptyTitle="No programme offerings recorded"
              items={offerings.map((offering) => ({
                key: offering.id,
                href: `/internal/programs/${offering.id}`,
                title: offering.program.name,
                meta: [offering.duration, offering.intake].filter(Boolean).join(" · ") || "Details not recorded",
                badge: <AvailabilityBadge availability={offering.availability} />,
              }))}
            />
            {opportunities.length > 0 ? (
              <p className="border-t border-hairline px-6 py-3 text-[12px] text-muted-foreground">
                {opportunities.length} application {opportunities.length === 1 ? "call references" : "calls reference"} this university.
              </p>
            ) : null}
          </DetailSection>

          <DetailSection title="DoIC MoU register" icon={BookMarked}>
            <div className="space-y-4 px-6 pb-5">
              <RegisterNotice register={register} />
              <Facts
                items={[
                  entry.theRankings.length > 0 ? { label: "THE ranking", value: entry.theRankings.join(" · ") } : null,
                  entry.faculties.length > 0 ? { label: "Faculty", value: entry.faculties.join(" · ") } : null,
                  entry.departments.length > 0 ? { label: "Department", value: entry.departments.join(" · ") } : null,
                ]}
              />
              {entry.universityRows.length > 0 ? (
                <UniversityRegisterRows rows={entry.universityRows} />
              ) : register.state === "granted" ? (
                <p className="text-[12px] text-fg-faint">Every register row for this university is shown with its MoU.</p>
              ) : null}
            </div>
          </DetailSection>

          <DetailSection title="Institution profile" icon={Globe}>
            <KeyValueList
              items={[
                { label: "Country", value: institution.country },
                { label: "Region", value: institution.region },
                ...(institution.normalizedName && institution.normalizedName !== institution.name
                  ? [{ label: "Corrected spelling", value: institution.normalizedName }]
                  : []),
                { label: "City", value: institution.city ?? <NotRecorded /> },
                { label: "Website", value: institution.website ?? <NotRecorded /> },
                { label: "On public site", value: institution.isPublic ? "Yes" : "No" },
                { label: "Record source", wide: true, value: sourceMeta[institution.source].label },
              ]}
            />
          </DetailSection>

          <DetailSection title="Provenance" icon={Link2}>
            <UniversityProvenance institution={institution} rows={registerRows} register={register} />
          </DetailSection>

          <DetailSection title="University documents" icon={FolderOpen}>
            <LinkedList
              emptyTitle="No documents linked"
              emptyDescription="Agreement documents are listed with each MoU."
              items={documents.map((doc) => ({
                key: doc.id,
                href: `/internal/documents/${doc.id}`,
                title: doc.title,
                meta: documentTypeLabel[doc.type],
                badge: <DocumentStatusBadge status={doc.status} />,
              }))}
            />
          </DetailSection>

          <DetailSection title={`Also in ${institution.country}`} className="lg:col-span-2">
            <LinkedList
              emptyTitle="No other universities in this country"
              items={peers.map((peer) => ({
                key: peer.id,
                href: `/internal/universities/${peer.id}`,
                title: peer.name,
                badge: <SourceBadge source={peer.source} />,
              }))}
            />
          </DetailSection>
        </div>
      </details>
    </div>
  );
}

/** Every contact with its edit link, for roles that may edit them. */
async function ManageContacts({
  universityId,
  contacts,
}: {
  universityId: string;
  contacts: readonly { id: string; roleLabel: string; name: string | null; agreementId: string | null }[];
}) {
  if (contacts.length === 0 || !(await canManage("institutions:update"))) return null;
  return (
    <details className="group rounded-xl border border-line">
      <summary className="cursor-pointer list-none px-3 py-2 text-[12px] text-fg-subtle hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        Edit contacts ({contacts.length})
      </summary>
      <ul className="divide-y divide-hairline border-t border-hairline">
        {contacts.map((contact) => (
          <li key={contact.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-foreground">{contact.name ?? "Name not recorded"}</span>
              <span className="block text-[11px] text-fg-faint">
                {contact.roleLabel}
                {contact.agreementId ? ` · ${contact.agreementId}` : ""}
              </span>
            </span>
            <Link
              href={`/internal/universities/${universityId}/contacts/${contact.id}/edit`}
              className="shrink-0 text-[12px] text-muj-fg hover:text-foreground"
              aria-label={`Edit ${contact.roleLabel} ${contact.name ?? ""}`.trim()}
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
