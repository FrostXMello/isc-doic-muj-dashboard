import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ActivityStatusBadge } from "@/components/internal/badges";
import { SegmentBar } from "@/components/internal/analytics/segment-bar";
import { PageHeader } from "@/components/internal/ui/page-header";
import { DataNotice } from "@/components/internal/ui/source-badge";
import { toneStyles } from "@/components/internal/ui/status-badge";
import { computeDashboard } from "@/lib/internal/analytics";
import { getDataMode } from "@/lib/internal/data/context";
import { getDashboardInput } from "@/lib/internal/data/dashboard";
import { formatDate, formatRelativeDays } from "@/lib/internal/dates";
import { activityStatusMeta, agreementStatusMeta, type Tone } from "@/lib/internal/status";
import type { ActivityView } from "@/lib/internal/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

const card = "rounded-xl border border-line bg-card";

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[12px] text-fg-subtle transition-colors hover:text-foreground"
    >
      {children}
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

function ActivityStat({ label, value, href, tone }: { label: string; value: number; href: string; tone?: Tone }) {
  return (
    <Link href={href} className="group rounded-lg px-3 py-2.5 transition-colors hover:bg-overlay-subtle">
      <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        {tone && <span className={cn("size-2 rounded-full", toneStyles[tone].dot)} aria-hidden />}
        {label}
      </span>
      <span className="mt-1 block font-display text-[1.75rem] leading-none font-medium tracking-[-0.03em] text-foreground tabular-nums">
        {value}
      </span>
    </Link>
  );
}

function ActivityList({
  title,
  items,
  empty,
  meta,
  more,
}: {
  title: string;
  items: readonly ActivityView[];
  empty: string;
  meta: (activity: ActivityView) => string;
  more?: { count: number; href: string };
}) {
  return (
    <div className="min-w-0">
      <h3 className="px-3 text-[12px] text-muted-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="px-3 py-3 text-[13px] text-fg-faint">{empty}</p>
      ) : (
        <ul className="mt-1">
          {items.map((activity) => (
            <li key={activity.id}>
              <Link
                href={`/internal/activities/${activity.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-overlay-subtle"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-foreground">{activity.title}</span>
                  <span className="block truncate text-[12px] text-muted-foreground">{meta(activity)}</span>
                </span>
                <ActivityStatusBadge status={activity.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {more && more.count > 0 ? (
        <Link href={more.href} className="mt-1 block px-3 text-[12px] text-glow hover:text-foreground">
          +{more.count} more
        </Link>
      ) : null}
    </div>
  );
}

const LIST_SIZE = 3;

export default async function DashboardPage() {
  const [input, mode] = await Promise.all([getDashboardInput(), getDataMode()]);
  const { activities, totals, mous, today } = computeDashboard(input);
  const place = (activity: ActivityView) => activity.institution?.name ?? activity.country;

  const kpis = [
    { label: "Universities", value: totals.universities, href: "/internal/universities" },
    { label: "MoUs", value: totals.mous, href: "/internal/universities?coverage=with" },
    { label: "Programmes", value: totals.programmes, href: "/internal/programs" },
    { label: "Opportunities", value: totals.opportunities, href: "/internal/programs?tab=opportunities" },
    { label: "Documents", value: totals.documents, href: "/internal/documents" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description={`As of ${formatDate(today)}`} />

      {mode.sampleData ? (
        <DataNotice>Fictional sample records are included because INTERNAL_SAMPLE_DATA is on.</DataNotice>
      ) : null}

      <section aria-labelledby="activities-heading" className={cn(card, "p-4 sm:p-5")}>
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 id="activities-heading" className="font-display text-[15px] font-medium tracking-[-0.02em] text-foreground">
            Activities
          </h2>
          <SectionLink href="/internal/activities">All activities</SectionLink>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1 sm:grid-cols-4">
          <ActivityStat label="Total" value={activities.total} href="/internal/activities" />
          <ActivityStat
            label="Upcoming"
            value={activities.upcoming.length}
            tone={activityStatusMeta.planned.tone}
            href="/internal/activities?when=upcoming"
          />
          <ActivityStat
            label="Overdue"
            value={activities.overdue.length}
            tone={activityStatusMeta["needs-update"].tone}
            href="/internal/activities?status=needs-update"
          />
          <ActivityStat
            label="Completed"
            value={activities.completed}
            tone={activityStatusMeta.completed.tone}
            href="/internal/activities?status=completed"
          />
        </div>

        {activities.total > 0 ? (
          <div className="mt-3 px-3">
            <SegmentBar
              legend={false}
              label={`Activities by status: ${activities.upcoming.length} upcoming, ${activities.overdue.length} overdue, ${activities.completed} completed${activities.cancelled ? `, ${activities.cancelled} cancelled` : ""}.`}
              segments={[
                { key: "upcoming", label: "Upcoming", count: activities.upcoming.length, tone: activityStatusMeta.planned.tone },
                { key: "overdue", label: "Overdue", count: activities.overdue.length, tone: activityStatusMeta["needs-update"].tone },
                { key: "completed", label: "Completed", count: activities.completed, tone: activityStatusMeta.completed.tone },
                { key: "cancelled", label: "Cancelled", count: activities.cancelled, tone: activityStatusMeta.cancelled.tone },
              ]}
            />
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-1 gap-5 border-t border-hairline pt-4 md:grid-cols-2">
          <ActivityList
            title="Coming up"
            items={activities.upcoming.slice(0, LIST_SIZE)}
            empty="Nothing scheduled."
            meta={(a) => `${formatDate(a.startDate)} · ${formatRelativeDays(a.daysFromToday)} · ${place(a)}`}
            more={{ count: activities.upcoming.length - LIST_SIZE, href: "/internal/activities?when=upcoming" }}
          />
          <ActivityList
            title="Needs an update"
            items={activities.overdue.slice(0, LIST_SIZE)}
            empty="No overdue activities."
            meta={(a) => `${formatDate(a.startDate)} · ${place(a)}`}
            more={{ count: activities.overdue.length - LIST_SIZE, href: "/internal/activities?status=needs-update" }}
          />
        </div>
      </section>

      <section aria-label="Totals" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className={cn(card, "px-4 py-3.5 transition-colors hover:border-line-bold hover:bg-surface-raised")}
          >
            <span className="block text-[12px] text-muted-foreground">{kpi.label}</span>
            <span className="mt-1.5 block font-display text-[1.75rem] leading-none font-medium tracking-[-0.03em] text-foreground tabular-nums">
              {kpi.value}
            </span>
          </Link>
        ))}
      </section>

      <section aria-labelledby="mou-heading" className={cn(card, "p-4 sm:p-5")}>
        <div className="flex items-center justify-between gap-3">
          <h2 id="mou-heading" className="font-display text-[15px] font-medium tracking-[-0.02em] text-foreground">
            MoU status
          </h2>
          <SectionLink href="/internal/universities">Universities &amp; MoUs</SectionLink>
        </div>
        {mous.withStatus === 0 ? (
          <p className="mt-2 text-[13px] text-muted-foreground">
            {mous.total === 0
              ? "No MoUs recorded."
              : `Not recorded yet: none of the ${mous.total} MoUs has a status or dates.`}
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            <SegmentBar
              label="MoUs by recorded status"
              segments={mous.byStatus.map((row) => ({
                key: row.status,
                label: agreementStatusMeta[row.status].label,
                count: row.count,
                tone: agreementStatusMeta[row.status].tone,
                href: `/internal/universities?mouStatus=${row.status}`,
              }))}
            />
            {mous.total > mous.withStatus ? (
              <p className="text-[12px] text-fg-faint">
                {mous.total - mous.withStatus} of {mous.total} MoUs have no status recorded.
              </p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
