import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ActivityStatusBadge } from "@/components/internal/badges";
import { Breakdown } from "@/components/internal/ui/breakdown";
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
const heading = "font-display text-[15px] font-medium tracking-[-0.02em] text-foreground";
const LIST_SIZE = 3;

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 text-[12px] text-fg-subtle transition-colors hover:text-foreground"
    >
      {children}
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

function ActivityStat({ label, value, href, tone }: { label: string; value: number; href: string; tone?: Tone }) {
  return (
    <Link href={href} className="rounded-lg px-3 py-2.5 transition-colors hover:bg-overlay-subtle">
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
  more: { count: number; href: string };
}) {
  return (
    <div className="min-w-0">
      <h3 className="px-3 text-[12px] text-muted-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="px-3 py-2.5 text-[13px] text-fg-faint">{empty}</p>
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
      {more.count > 0 ? (
        <Link href={more.href} className="mt-1 block px-3 text-[12px] text-glow hover:text-foreground">
          +{more.count} more
        </Link>
      ) : null}
    </div>
  );
}

export default async function DashboardPage() {
  const [input, mode] = await Promise.all([getDashboardInput(), getDataMode()]);
  const { totals, activities, mous, attention, regions, today } = computeDashboard(input);
  const place = (activity: ActivityView) => activity.institution?.name ?? activity.country;
  const statusRecorded = mous.completeness.find((row) => row.key === "status")?.recorded ?? 0;

  const snapshot = [
    { label: "Universities connected", value: totals.universities, href: "/internal/universities" },
    { label: "Recorded MoUs", value: totals.mous, href: "/internal/universities?coverage=with" },
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

      <section aria-labelledby="snapshot-heading" data-dashboard-section="snapshot" className="space-y-3">
        <h2 id="snapshot-heading" className={heading}>
          Collaboration snapshot
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {snapshot.map((kpi) => (
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
        </div>
      </section>

      <div
        data-dashboard-section="split"
        className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,13fr)_minmax(18rem,7fr)]"
      >
        <section aria-labelledby="activities-heading" className={cn(card, "p-4 sm:p-5")}>
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 id="activities-heading" className={heading}>
              Activities
            </h2>
            <SectionLink href="/internal/activities">View all activities</SectionLink>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1 sm:grid-cols-4">
            <ActivityStat label="Total" value={activities.total} href="/internal/activities" />
            <ActivityStat
              label="Completed"
              value={activities.completed.length}
              tone={activityStatusMeta.completed.tone}
              href="/internal/activities?status=completed"
            />
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
          </div>

          <div className="mt-4 grid grid-cols-1 gap-5 border-t border-hairline pt-4 sm:grid-cols-2">
            <ActivityList
              title="Needs an update"
              items={activities.overdue.slice(0, LIST_SIZE)}
              empty="No overdue activities."
              meta={(a) => `${formatDate(a.startDate)} · ${place(a)}`}
              more={{ count: activities.overdue.length - LIST_SIZE, href: "/internal/activities?status=needs-update" }}
            />
            <ActivityList
              title="Coming up"
              items={activities.upcoming.slice(0, LIST_SIZE)}
              empty="Nothing scheduled."
              meta={(a) => `${formatDate(a.startDate)} · ${formatRelativeDays(a.daysFromToday)} · ${place(a)}`}
              more={{ count: activities.upcoming.length - LIST_SIZE, href: "/internal/activities?when=upcoming" }}
            />
          </div>

          <div className="mt-4 border-t border-hairline pt-4">
            <ActivityList
              title="Recently completed"
              items={activities.completed.slice(0, LIST_SIZE)}
              empty="No completed activities recorded."
              meta={(a) => `${formatDate(a.startDate)} · ${place(a)}`}
              more={{ count: activities.completed.length - LIST_SIZE, href: "/internal/activities?status=completed" }}
            />
          </div>
        </section>

        <aside aria-label="MoU records and attention" className="space-y-6">
          <section aria-labelledby="mou-heading" className={cn(card, "p-4 sm:p-5")}>
            <div className="flex items-center justify-between gap-3">
              <h2 id="mou-heading" className={heading}>
                MoU records
              </h2>
              <SectionLink href="/internal/universities">Universities &amp; MoUs</SectionLink>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">How many of the {mous.total} MoUs record each detail.</p>
            <figure className="mt-4">
              <ul className="space-y-3">
                {mous.completeness.map((row) => (
                  <li key={row.key}>
                    <div className="flex items-baseline justify-between gap-3 text-[13px]">
                      <span className="text-fg-soft">{row.label}</span>
                      <span className="text-foreground tabular-nums">
                        {row.recorded}
                        <span className="text-fg-faint"> of {mous.total}</span>
                      </span>
                    </div>
                    <div aria-hidden className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-overlay">
                      <div
                        className={cn("h-full rounded-full", toneStyles.positive.bar)}
                        style={{ width: `${mous.total ? (row.recorded / mous.total) * 100 : 0}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <figcaption className="mt-3 flex items-center gap-1.5 text-[11px] text-fg-faint">
                <span className={cn("size-2 rounded-full", toneStyles.positive.dot)} aria-hidden />
                Recorded
                <span className="ml-2 size-2 rounded-full bg-overlay" aria-hidden />
                Missing
              </figcaption>
            </figure>
            {statusRecorded === 0 ? (
              <p className="mt-4 text-[12px] text-muted-foreground">
                {mous.total === 0
                  ? "No MoUs recorded yet."
                  : "No MoU has a status or end date yet, so active and expiring MoUs can't be shown."}
              </p>
            ) : (
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
                {mous.byStatus.map((row) => (
                  <li key={row.status}>
                    <Link
                      href={`/internal/universities?mouStatus=${row.status}`}
                      className="inline-flex items-center gap-1.5 hover:text-foreground"
                    >
                      <span className={cn("size-2 rounded-full", toneStyles[agreementStatusMeta[row.status].tone].dot)} aria-hidden />
                      <span className="text-muted-foreground">{agreementStatusMeta[row.status].label}</span>
                      <span className="text-foreground tabular-nums">{row.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {attention.length > 0 ? (
            <section aria-labelledby="attention-heading" className="px-1">
              <h2 id="attention-heading" className="text-[12px] text-muted-foreground">
                Records to review
              </h2>
              <ul className="mt-2 divide-y divide-hairline">
                {attention.map((row) => (
                  <li key={row.key}>
                    <Link
                      href={row.href}
                      className="flex items-center justify-between gap-3 py-2 text-[13px] text-fg-soft transition-colors hover:text-foreground"
                    >
                      {row.label}
                      <span className="text-foreground tabular-nums">{row.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>

      {regions.byRegion.length > 0 ? (
        <section aria-labelledby="regions-heading" data-dashboard-section="below" className={card}>
          <div className="flex items-center justify-between gap-3 px-5 pt-4">
            <h2 id="regions-heading" className={heading}>
              Partner universities by region
            </h2>
            <SectionLink href="/internal/universities">All universities</SectionLink>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Breakdown
              rows={regions.byRegion.map((row) => ({
                key: row.region,
                label: row.region,
                count: row.universities,
                tone: "info",
                href: `/internal/universities?region=${encodeURIComponent(row.region)}`,
              }))}
            />
            <div className="border-t border-hairline px-5 py-4 md:border-t-0 md:border-l">
              <h3 className="text-[12px] text-muted-foreground">Top countries · {regions.countries} in total</h3>
              <ol className="mt-2 space-y-1.5">
                {regions.topCountries.map((row) => (
                  <li key={row.country}>
                    <Link
                      href={`/internal/universities?country=${encodeURIComponent(row.country)}`}
                      className="flex items-baseline justify-between gap-3 text-[13px] text-fg-soft hover:text-foreground"
                    >
                      <span className="truncate">{row.country}</span>
                      <span className="text-foreground tabular-nums">{row.universities}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
