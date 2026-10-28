import type { Metadata } from "next";
import { BookMarked, BookOpen, CalendarDays, ChevronDown, FileText, FolderOpen, Globe, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { AgreementCard } from "@/components/internal/agreement-card";
import {
  AvailabilityBadge,
  DocumentStatusBadge,
  PartnershipBadge,
} from "@/components/internal/badges";
import { SuccessNotice } from "@/components/internal/forms/form-fields";
import { InsightsCard } from "@/components/internal/insights-card";
import { DetailHeader, DetailSection, KeyValueList, LinkedList } from "@/components/internal/ui/detail";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { ManageLink } from "@/components/internal/ui/manage-action";
import { NotRecorded } from "@/components/internal/ui/page-header";
import {
  ContactRows,
  Facts,
  RegisterNotice,
  UniversityRegisterRows,
} from "@/components/internal/university-register";
import { SourceBadge } from "@/components/internal/ui/source-badge";
import { getInstitution } from "@/lib/internal/data/institutions";
import { formatDateRange } from "@/lib/internal/dates";
import { universityInsights } from "@/lib/internal/insights";
import { readParam, type SearchParamsRecord } from "@/lib/internal/query";
import { documentTypeLabel } from "@/lib/internal/status";

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
  const signedCopies = documents.filter((doc) => doc.storageKey && doc.type === "agreement");
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
  const agreementIds = new Set(agreements.map(({ agreement }) => agreement.id));
  const unlinkedContacts =
    contactAccess.state === "granted"
      ? contactAccess.contacts
          .filter((row) => row.institutionId === institution.id && (!row.agreementId || !agreementIds.has(row.agreementId)))
          .map((row) => ({ ...row, note: register.state === "granted" ? (register.contactNotes.get(row.id) ?? null) : null }))
      : [];
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
                    signedCopies={signedCopies}
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
          {institution.note ? (
            <DetailSection title="Review note">
              <p className="px-4 sm:px-6 pb-5 text-[13px] leading-relaxed text-muted-foreground">{institution.note}</p>
            </DetailSection>
          ) : null}
        </div>
      </div>

      <details className="group portal-surface overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 sm:px-6 py-4 hover:bg-overlay [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium text-foreground">More details</span>
            <span className="block text-[12px] text-muted-foreground">
              Events, programmes, register, profile, documents, and other partners in {institution.country}
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
              <p className="border-t border-hairline px-4 sm:px-6 py-3 text-[12px] text-muted-foreground">
                {opportunities.length} application {opportunities.length === 1 ? "call references" : "calls reference"} this university.
              </p>
            ) : null}
          </DetailSection>

          <DetailSection title="DoIC MoU register" icon={BookMarked}>
            <div className="space-y-4 px-4 sm:px-6 pb-5">
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
              ]}
            />
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

          {unlinkedContacts.length > 0 ? (
            <DetailSection title="Other contacts" icon={UserRound} description="Not tied to a single MoU. Internal only." className="lg:col-span-2">
              <div className="px-4 sm:px-6 pb-5 text-[13px]">
                <ContactRows contacts={unlinkedContacts} />
              </div>
            </DetailSection>
          ) : null}

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
