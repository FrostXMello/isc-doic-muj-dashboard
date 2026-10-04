import type { Metadata } from "next";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Compass,
  FileText,
  Globe,
  GraduationCap,
  Timer,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { ActivityStatusBadge, AgreementStatusBadge } from "@/components/internal/badges";
import { LinkedList } from "@/components/internal/ui/detail";
import { PageHeader, Panel, PanelHeader } from "@/components/internal/ui/page-header";
import { DataNotice } from "@/components/internal/ui/source-badge";
import { StatCard } from "@/components/internal/ui/stat-card";
import { getDataMode } from "@/lib/internal/data/context";
import { getOperationalSummary } from "@/lib/internal/data/reports";
import { formatDate, formatRelativeDays } from "@/lib/internal/dates";
import { agreementHref } from "@/lib/internal/links";

export const metadata: Metadata = {
  title: "Dashboard",
};

function ActivityGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-hairline last:border-b-0">
      <h3 className="px-5 pt-3 font-mono text-[10px] tracking-[0.12em] text-fg-faint uppercase">{title}</h3>
      {children}
    </div>
  );
}

export default async function DashboardPage() {
  const [summary, mode] = await Promise.all([getOperationalSummary(), getDataMode()]);
  const { institutions, agreements, programs, opportunities, activities } = summary;

  const liveAgreements = agreements.byStatus.active + agreements.byStatus["expiring-soon"];
  const openCalls = opportunities.byStatus.open + opportunities.byStatus["closing-soon"];

  const needsReview =
    institutions.byVerification["needs-review"] + agreements.byVerification["needs-review"];

  const attention = [
    {
      label: "Records flagged for review",
      count: needsReview,
      href: "/internal/documents?tab=reports",
      icon: FileText,
    },
    {
      label: "Agreements expiring soon",
      count: agreements.byStatus["expiring-soon"],
      href: "/internal/universities?mouStatus=expiring-soon",
      icon: Timer,
    },
    {
      label: "Calls closing soon",
      count: opportunities.byStatus["closing-soon"],
      href: "/internal/programs?tab=opportunities&status=closing-soon",
      icon: Compass,
    },
    {
      label: "Activities needing an update",
      count: activities.byStatus["needs-update"],
      href: "/internal/activities?status=needs-update",
      icon: CalendarDays,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Overview of collaboration records · Directorate of International Collaborations · ${formatDate(summary.today)}`}
      />

      <DataNotice>
        Counts are computed from records imported from MUJ&apos;s official Internationalization
        pages (source-imported, not confirmed against signed documents), plus earlier directory
        names awaiting review.
        {mode.sampleData
          ? " Fictional sample records are included because INTERNAL_SAMPLE_DATA is on."
          : null}
      </DataNotice>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Institutions"
          value={institutions.total}
          icon={GraduationCap}
          href="/internal/universities"
          hint={`${institutions.bySource.official} official · ${institutions.bySource.directory} earlier directory${mode.sampleData ? ` · ${institutions.bySource.sample} sample` : ""}`}
        />
        <StatCard
          label="Countries"
          value={institutions.countries}
          icon={Globe}
          accent="var(--cyan)"
          href="/internal/documents?tab=reports"
          hint={`Across ${institutions.byRegion.filter((r) => r.institutions > 0).length} regions`}
        />
        <StatCard
          label="MoUs & agreements"
          value={agreements.total}
          icon={FileText}
          accent="var(--success)"
          href="/internal/universities?coverage=with"
          hint={`${agreements.byStatus["not-stated"]} with status not stated · ${liveAgreements} live`}
        />
        <StatCard
          label="Programme offerings"
          value={programs.offerings}
          icon={BookOpen}
          accent="var(--ring)"
          href="/internal/programs"
          hint={`Named on official pages · ${openCalls} open calls`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel id="activities" className="scroll-mt-24 lg:col-span-3">
          <PanelHeader
            title="Activities"
            icon={Activity}
            description={`${activities.total} recorded · ${activities.upcoming.length} upcoming · ${activities.byStatus.completed} completed`}
            action={
              <Link
                href="/internal/activities"
                className="flex items-center gap-1 text-[12px] text-fg-subtle transition-colors hover:text-foreground"
              >
                View all activities
                <ArrowUpRight className="size-3.5" />
              </Link>
            }
          />
          {activities.byStatus["needs-update"] > 0 ? (
            <Link
              href="/internal/activities?status=needs-update"
              className="flex items-center justify-between gap-3 border-b border-hairline bg-warning/5 px-5 py-2.5 text-[12px] text-warning-fg transition-colors hover:bg-warning/10"
            >
              {activities.byStatus["needs-update"]} planned{" "}
              {activities.byStatus["needs-update"] === 1 ? "activity has" : "activities have"} passed
              their date and need an update
              <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
            </Link>
          ) : null}
          <ActivityGroup title="Upcoming">
            <LinkedList
              emptyTitle="Nothing scheduled"
              emptyDescription="Upcoming visits, delegations, and events will appear here."
              items={activities.upcoming.slice(0, 5).map((activity) => ({
                key: activity.id,
                href: `/internal/activities/${activity.id}`,
                title: activity.title,
                meta: `${formatDate(activity.startDate)} · ${formatRelativeDays(activity.daysFromToday)} · ${activity.institution?.name ?? activity.country}`,
                badge: <ActivityStatusBadge status={activity.status} />,
              }))}
            />
          </ActivityGroup>
          <ActivityGroup title="Recently held">
            <LinkedList
              emptyTitle="No past activities recorded"
              items={activities.recent.slice(0, 3).map((activity) => ({
                key: activity.id,
                href: `/internal/activities/${activity.id}`,
                title: activity.title,
                meta: `${formatDate(activity.startDate)} · ${activity.institution?.name ?? activity.country}`,
                badge: <ActivityStatusBadge status={activity.status} />,
              }))}
            />
          </ActivityGroup>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader title="Needs attention" />
          <ul className="divide-y divide-hairline">
            {attention.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-overlay-subtle"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent transition-colors group-hover:bg-accent-strong">
                    <item.icon className="size-4 text-glow" />
                  </div>
                  <p className="min-w-0 flex-1 text-[13px] text-foreground">{item.label}</p>
                  <span
                    className={
                      item.count > 0
                        ? "font-display text-[1.25rem] leading-none text-warning-fg tabular-nums"
                        : "font-display text-[1.25rem] leading-none text-fg-dim tabular-nums"
                    }
                  >
                    {item.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <PanelHeader
            title="Renewals due"
            icon={Timer}
            description="Agreements ending inside the renewal window."
          />
          <LinkedList
            emptyTitle="No renewals due"
            items={agreements.expiringSoon.map((agreement) => ({
              key: agreement.id,
              href: agreementHref(agreement),
              title: agreement.institution?.name ?? agreement.reference,
              meta: `${agreement.reference} · ends ${formatDate(agreement.endDate)}`,
              badge: <AgreementStatusBadge status={agreement.status} daysToExpiry={agreement.daysToExpiry} />,
            }))}
          />
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader title="Quick links" />
          <ul className="divide-y divide-hairline">
            {[
              { label: "Browse universities", href: "/internal/universities", icon: GraduationCap },
              { label: "Open application calls", href: "/internal/programs?tab=opportunities&status=open", icon: Compass },
              { label: "Upcoming activities", href: "/internal/activities?when=upcoming", icon: CalendarDays },
              { label: "View reports", href: "/internal/documents?tab=reports", icon: TrendingUp },
            ].map((action) => (
              <li key={action.label}>
                <Link
                  href={action.href}
                  className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-overlay-subtle"
                >
                  <action.icon className="size-4 shrink-0 text-glow" />
                  <span className="text-[13px] text-foreground">{action.label}</span>
                  <ArrowUpRight className="ml-auto size-4 shrink-0 text-fg-dim transition-colors group-hover:text-fg-subtle" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Network by region"
          description="Institutions grouped by the region headings on the official partner page."
        />
        <div className="grid grid-cols-1 divide-y divide-hairline sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {institutions.byRegion.map((region) => (
            <Link
              key={region.region}
              href={`/internal/universities?region=${encodeURIComponent(region.region)}`}
              className="border-hairline px-5 py-4 transition-colors hover:bg-overlay-subtle sm:border-r sm:last:border-r-0"
            >
              <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                {region.region}
              </p>
              <p className="mt-2 font-display text-[1.6rem] leading-none font-medium tracking-[-0.03em] text-foreground tabular-nums">
                {region.institutions}
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {region.countries} {region.countries === 1 ? "country" : "countries"} ·{" "}
                {region.withAgreements} with listed rows
              </p>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
