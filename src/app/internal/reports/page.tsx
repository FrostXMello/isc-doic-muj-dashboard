import type { Metadata } from "next";
import {
  BookOpen,
  CalendarDays,
  Compass,
  FileText,
  FolderOpen,
  Globe,
  GraduationCap,
  Timer,
} from "lucide-react";
import Link from "next/link";
import {
  ActivityStatusBadge,
  AgreementStatusBadge,
  OpportunityStatusBadge,
} from "@/components/internal/badges";
import { Breakdown } from "@/components/internal/ui/breakdown";
import { LinkedList } from "@/components/internal/ui/detail";
import { PageHeader, Panel, PanelHeader } from "@/components/internal/ui/page-header";
import {
  PlaceholderAction,
  unavailableReasons,
} from "@/components/internal/ui/placeholder-action";
import { DataNotice } from "@/components/internal/ui/source-badge";
import { StatCard } from "@/components/internal/ui/stat-card";
import { activityStatuses, activityTypes } from "@/lib/internal/data/activities";
import { agreementStatuses, agreementTypes } from "@/lib/internal/data/agreements";
import { documentStatuses } from "@/lib/internal/data/documents";
import { partnershipStatuses } from "@/lib/internal/data/institutions";
import { opportunityStatuses } from "@/lib/internal/data/opportunities";
import { getOperationalSummary } from "@/lib/internal/data/reports";
import { formatDate, formatRelativeDays } from "@/lib/internal/dates";
import {
  activityStatusMeta,
  activityTypeLabel,
  agreementStatusMeta,
  agreementTypeLabel,
  availabilityMeta,
  documentStatusMeta,
  opportunityStatusMeta,
  partnershipStatusMeta,
} from "@/lib/internal/status";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const summary = await getOperationalSummary();
  const { institutions, agreements, programs, opportunities, activities, documents } = summary;

  const liveAgreements = agreements.byStatus.active + agreements.byStatus["expiring-soon"];
  const openCalls = opportunities.byStatus.open + opportunities.byStatus["closing-soon"];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description={`Operational overview computed from the portal's data layer as of ${formatDate(summary.today)}.`}
        actions={
          <PlaceholderAction label="Export report" icon="download" reason={unavailableReasons.exports} />
        }
      />

      <DataNotice>
        Figures are counts of records in the portal data layer, not official DoIC statistics.
        Institution counts include the public directory&apos;s illustrative names and the
        fictional sample institutions; agreement, offering, call, document, and activity figures
        count sample data only.
      </DataNotice>

      <section aria-labelledby="overview-heading" className="space-y-3">
        <h2 id="overview-heading" className="sr-only">
          Operational overview
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Institutions" value={institutions.total} icon={GraduationCap} href="/internal/universities" />
          <StatCard label="Countries" value={institutions.countries} icon={Globe} accent="#9ec9d4" />
          <StatCard
            label="Live agreements"
            value={liveAgreements}
            icon={FileText}
            accent="#9fd8b8"
            href="/internal/mous?status=active"
          />
          <StatCard
            label="Open offerings"
            value={programs.byAvailability.open}
            icon={BookOpen}
            accent="#c5daf8"
            href="/internal/programs?availability=open"
          />
          <StatCard
            label="Open calls"
            value={openCalls}
            icon={Compass}
            accent="#e9c27d"
            href="/internal/opportunities?status=open"
          />
          <StatCard
            label="Upcoming activities"
            value={activities.upcoming.length}
            icon={CalendarDays}
            accent="#a9b6cc"
            href="/internal/activities?when=upcoming"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Partnership counts"
            icon={GraduationCap}
            description="Relationship status per institution, derived from its agreements."
          />
          <Breakdown
            rows={partnershipStatuses.map((status) => ({
              key: status,
              label: partnershipStatusMeta[status].label,
              count: institutions.byPartnership[status],
              tone: partnershipStatusMeta[status].tone,
              href: `/internal/universities?status=${status}`,
            }))}
          />
          <p className="border-t border-white/[0.06] px-5 py-3 text-[12px] text-muted-foreground">
            {institutions.bySource.directory} from the public directory ·{" "}
            {institutions.bySource.sample} sample institutions
          </p>
        </Panel>

        <Panel>
          <PanelHeader title="Network by region" icon={Globe} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[10px] tracking-[0.12em] text-[#6b7c96] uppercase">
                  <th scope="col" className="px-5 py-3 font-normal">Region</th>
                  <th scope="col" className="px-4 py-3 text-right font-normal">Institutions</th>
                  <th scope="col" className="px-4 py-3 text-right font-normal">Countries</th>
                  <th scope="col" className="px-5 py-3 text-right font-normal">With agreements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] tabular-nums">
                {institutions.byRegion.map((row) => (
                  <tr key={row.region}>
                    <th scope="row" className="px-5 py-3 font-normal text-foreground">
                      <Link
                        href={`/internal/universities?region=${encodeURIComponent(row.region)}`}
                        className="hover:text-[#d7e4fb]"
                      >
                        {row.region}
                      </Link>
                    </th>
                    <td className="px-4 py-3 text-right text-[#c3cedd]">{row.institutions}</td>
                    <td className="px-4 py-3 text-right text-[#c3cedd]">{row.countries}</td>
                    <td className="px-5 py-3 text-right text-[#c3cedd]">{row.withAgreements}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="MOU status summary"
            icon={FileText}
            description={`${agreements.total} agreements recorded`}
          />
          <Breakdown
            hideZero
            rows={agreementStatuses.map((status) => ({
              key: status,
              label: agreementStatusMeta[status].label,
              count: agreements.byStatus[status],
              tone: agreementStatusMeta[status].tone,
              href: `/internal/mous?status=${status}`,
            }))}
          />
          <div className="border-t border-white/[0.06] px-5 py-3">
            <p className="font-mono text-[10px] tracking-[0.12em] text-[#6b7c96] uppercase">By type</p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
              {agreementTypes
                .filter((type) => agreements.byType[type] > 0)
                .map((type) => (
                  <li key={type}>
                    {agreementTypeLabel[type]}:{" "}
                    <span className="text-foreground tabular-nums">{agreements.byType[type]}</span>
                  </li>
                ))}
            </ul>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Renewals due"
            icon={Timer}
            description="Agreements inside the renewal window, soonest first."
          />
          <LinkedList
            emptyTitle="No agreements are due for renewal"
            items={agreements.expiringSoon.map((agreement) => ({
              key: agreement.id,
              href: `/internal/mous/${agreement.id}`,
              title: agreement.institution?.name ?? agreement.reference,
              meta: `${agreement.reference} · ends ${formatDate(agreement.endDate)} (${formatRelativeDays(agreement.daysToExpiry ?? 0)})`,
              badge: <AgreementStatusBadge status={agreement.status} />,
            }))}
          />
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Programme summary"
            icon={BookOpen}
            description={`${programs.total} programme types · ${programs.offerings} recorded offerings`}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[10px] tracking-[0.12em] text-[#6b7c96] uppercase">
                  <th scope="col" className="px-5 py-3 font-normal">Programme</th>
                  <th scope="col" className="px-4 py-3 text-right font-normal">Offerings</th>
                  {(["open", "closed", "suspended", "not-recorded"] as const).map((key) => (
                    <th key={key} scope="col" className="px-4 py-3 text-right font-normal last:pr-5">
                      {availabilityMeta[key].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] tabular-nums">
                {programs.byProgram.map((row) => (
                  <tr key={row.program.id}>
                    <th scope="row" className="px-5 py-3 font-normal text-foreground">
                      <Link href={`/internal/programs?program=${row.program.id}`} className="hover:text-[#d7e4fb]">
                        {row.program.name}
                      </Link>
                    </th>
                    <td className="px-4 py-3 text-right text-foreground">{row.total}</td>
                    {(["open", "closed", "suspended", "not-recorded"] as const).map((key) => (
                      <td key={key} className="px-4 py-3 text-right text-[#c3cedd] last:pr-5">
                        {row.byAvailability[key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Opportunity summary"
            icon={Compass}
            description={`${opportunities.total} application calls`}
          />
          <Breakdown
            hideZero
            rows={opportunityStatuses.map((status) => ({
              key: status,
              label: opportunityStatusMeta[status].label,
              count: opportunities.byStatus[status],
              tone: opportunityStatusMeta[status].tone,
              href: `/internal/opportunities?status=${status}`,
            }))}
          />
          <div className="border-t border-white/[0.06]">
            <p className="px-5 pt-3 font-mono text-[10px] tracking-[0.12em] text-[#6b7c96] uppercase">
              Next deadlines
            </p>
            <LinkedList
              emptyTitle="No open calls"
              items={opportunities.closingSoon.slice(0, 4).map((opportunity) => ({
                key: opportunity.id,
                href: `/internal/opportunities/${opportunity.id}`,
                title: opportunity.title,
                meta: `Deadline ${formatDate(opportunity.deadline)}`,
                badge: <OpportunityStatusBadge status={opportunity.status} />,
              }))}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Activity summary"
            icon={CalendarDays}
            description={`${activities.total} activities recorded`}
          />
          <Breakdown
            hideZero
            rows={activityStatuses.map((status) => ({
              key: status,
              label: activityStatusMeta[status].label,
              count: activities.byStatus[status],
              tone: activityStatusMeta[status].tone,
              href: `/internal/activities?status=${status}`,
            }))}
          />
          <div className="border-t border-white/[0.06] px-5 py-3">
            <p className="font-mono text-[10px] tracking-[0.12em] text-[#6b7c96] uppercase">By type</p>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
              {activityTypes
                .filter((type) => activities.byType[type] > 0)
                .map((type) => (
                  <li key={type}>
                    {activityTypeLabel[type]}:{" "}
                    <span className="text-foreground tabular-nums">{activities.byType[type]}</span>
                  </li>
                ))}
            </ul>
          </div>
          <div className="border-t border-white/[0.06]">
            <p className="px-5 pt-3 font-mono text-[10px] tracking-[0.12em] text-[#6b7c96] uppercase">
              Coming up
            </p>
            <LinkedList
              emptyTitle="Nothing scheduled"
              items={activities.upcoming.slice(0, 3).map((activity) => ({
                key: activity.id,
                href: `/internal/activities/${activity.id}`,
                title: activity.title,
                meta: `${formatDate(activity.startDate)} · ${formatRelativeDays(activity.daysFromToday)}`,
                badge: <ActivityStatusBadge status={activity.status} />,
              }))}
            />
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Documents"
            icon={FolderOpen}
            description={`${documents.total} document records · ${documents.withFile} with a stored file · ${documents.unlinked} not linked to any record`}
          />
          <div className="grid grid-cols-2 divide-white/[0.06] sm:grid-cols-4 sm:divide-x">
            {documentStatuses.map((status) => (
              <Link
                key={status}
                href={`/internal/documents?status=${status}`}
                className="px-5 py-4 transition-colors hover:bg-white/[0.02]"
              >
                <p className="font-mono text-[10px] tracking-[0.12em] text-[#6b7c96] uppercase">
                  {documentStatusMeta[status].label}
                </p>
                <p className="mt-1.5 font-display text-[1.5rem] leading-none text-foreground tabular-nums">
                  {documents.byStatus[status]}
                </p>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
