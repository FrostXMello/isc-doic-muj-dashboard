import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ActivityStatusBadge } from "@/components/internal/badges";
import { DataNotice } from "@/components/internal/ui/source-badge";
import { toneStyles } from "@/components/internal/ui/status-badge";
import { computeDashboard, type DashboardData } from "@/lib/internal/analytics";
import { getDataMode } from "@/lib/internal/data/context";
import { getDashboardInput } from "@/lib/internal/data/dashboard";
import { formatDate, formatRelativeDays } from "@/lib/internal/dates";
import { agreementStatusMeta } from "@/lib/internal/status";
import type { ActivityView } from "@/lib/internal/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

const LIST_SIZE = 3;
const eyebrow = "text-[11px] font-medium uppercase tracking-[0.2em]";
const sectionTitle = "font-display text-[clamp(1.5rem,2.6vw,2rem)] leading-none font-medium tracking-[-0.035em] text-foreground";

/* The hero is always ink-dark, so its accents are fixed rather than themed. */
const snapshotAccents = ["#ff8a3d", "#ffc861", "#4fd6cf", "#86b0ff", "#ff8fab"];
const ringColors: Record<string, string> = { status: "var(--reach-2)", "end-date": "var(--reach-3)", type: "var(--muj)" };
const tones = { overdue: "var(--warning)", upcoming: "var(--reach-2)", completed: "var(--success)" } as const;

const monthFormatter = new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });

function dayParts(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  return { day: date.getUTCDate(), month: monthFormatter.format(date).replace(" ", " ’") };
}

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-fg-subtle transition-colors hover:text-foreground"
    >
      {children}
      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

function NetworkMotif() {
  const nodes = [
    [430, 70],
    [560, 40],
    [640, 120],
    [520, 170],
    [700, 60],
    [610, 220],
  ];
  return (
    <svg
      aria-hidden
      viewBox="400 20 330 220"
      preserveAspectRatio="xMaxYMid meet"
      className="pointer-events-none absolute inset-y-0 right-0 -z-10 h-full w-[55%] opacity-45"
    >
      <g fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeLinecap="round">
        <path className="route-flow" d="M430 70 Q495 0 560 40" />
        <path className="route-flow" d="M560 40 Q620 60 640 120" />
        <path className="route-flow" d="M430 70 Q470 150 520 170" />
        <path className="route-flow" d="M640 120 Q690 80 700 60" />
        <path className="route-flow" d="M520 170 Q580 230 610 220" />
        <path className="route-flow" d="M640 120 Q600 190 610 220" />
      </g>
      <g fill="rgba(255,255,255,0.55)">
        {nodes.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.5" />
        ))}
      </g>
      <circle cx="700" cy="60" r="4" fill="#ff8a3d" />
      <circle cx="700" cy="60" r="10" fill="none" stroke="rgba(255,138,61,0.45)" />
    </svg>
  );
}

function Snapshot({ totals, today }: Pick<DashboardData, "totals" | "today">) {
  const metrics = [
    { label: "Universities connected", value: totals.universities, href: "/internal/universities" },
    { label: "Recorded MoUs", value: totals.mous, href: "/internal/universities?coverage=with" },
    { label: "Programmes", value: totals.programmes, href: "/internal/programs" },
    { label: "Opportunities", value: totals.opportunities, href: "/internal/programs?tab=opportunities" },
    { label: "Documents", value: totals.documents, href: "/internal/documents" },
  ];

  return (
    <section
      aria-labelledby="snapshot-heading"
      data-dashboard-section="snapshot"
      className="dash-ink relative isolate overflow-hidden rounded-[2rem] px-5 pt-7 pb-4 shadow-[0_40px_90px_-50px_rgba(11,23,51,0.9)] sm:px-9 sm:pt-9 sm:pb-7"
    >
      <NetworkMotif />
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className={cn(eyebrow, "text-[#ffb27f]")}>Manipal University Jaipur · International Collaborations</p>
          <h1 className="mt-3 font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[0.92] font-medium tracking-[-0.045em]">
            Dashboard
          </h1>
        </div>
        <p className="text-[13px] text-white/60">As of {formatDate(today)}</p>
      </div>

      <h2 id="snapshot-heading" className={cn(eyebrow, "mt-10 text-white/55")}>
        Collaboration snapshot
      </h2>
      <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((metric, index) => (
          <li
            key={metric.label}
            className={cn(
              "border-t border-white/10 lg:border-t-0 lg:border-l lg:pl-6 lg:first:border-l-0 lg:first:pl-0",
              index === metrics.length - 1 && "col-span-2 sm:col-span-1",
            )}
          >
            <Link
              href={metric.href}
              className="dash-rise group block py-5 focus-visible:outline-white lg:py-3"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span
                aria-hidden
                className="block h-1 w-7 rounded-full transition-[width] duration-300 group-hover:w-14"
                style={{ background: snapshotAccents[index] }}
              />
              <span className="mt-4 block font-display text-[clamp(2.75rem,4.6vw,4.25rem)] leading-[0.88] font-medium tracking-[-0.05em] tabular-nums">
                {metric.value}
              </span>
              <span className="mt-2.5 flex items-center gap-1 text-[13px] text-white/70 transition-colors group-hover:text-white">
                {metric.label}
                <ArrowUpRight
                  aria-hidden
                  className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActivityCount({ label, value, href, color }: { label: string; value: number; href: string; color?: string }) {
  return (
    <Link href={href} className="group block rounded-2xl py-1 transition-colors">
      <span className="block font-display text-[clamp(2.25rem,3.6vw,3rem)] leading-none font-medium tracking-[-0.045em] text-foreground tabular-nums transition-colors group-hover:text-muj-fg">
        {value}
      </span>
      <span className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <span aria-hidden className="size-2 rounded-full" style={{ background: color ?? "var(--fg-dim)" }} />
        {label}
      </span>
    </Link>
  );
}

function AgendaGroup({
  title,
  color,
  items,
  empty,
  meta,
  more,
  showStatus,
}: {
  title: string;
  color: string;
  items: readonly ActivityView[];
  empty: string;
  meta: (activity: ActivityView) => string;
  more: { count: number; href: string };
  showStatus?: boolean;
}) {
  return (
    <li className="relative pl-9">
      <span
        aria-hidden
        className="absolute top-1 left-0 size-[18px] rounded-full border-[5px] border-background"
        style={{ background: color, boxShadow: `0 0 0 1px ${color}` }}
      />
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[14px] font-medium text-foreground">{title}</h3>
        {more.count > 0 ? (
          <Link href={more.href} className="text-[12px] font-medium text-muj-fg hover:text-foreground">
            +{more.count} more
          </Link>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-[13px] text-fg-faint">{empty}</p>
      ) : (
        <ol className="mt-2 -ml-3">
          {items.map((activity) => {
            const { day, month } = dayParts(activity.startDate);
            return (
              <li key={activity.id}>
                <Link
                  href={`/internal/activities/${activity.id}`}
                  className="group grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-overlay"
                >
                  <span className="text-center leading-none">
                    <span className="block font-display text-[1.35rem] font-medium tracking-[-0.03em] text-foreground tabular-nums">
                      {day}
                    </span>
                    <span className="mt-1 block text-[10px] tracking-[0.06em] whitespace-nowrap text-fg-faint uppercase">{month}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] text-foreground transition-transform group-hover:translate-x-0.5">
                      {activity.title}
                    </span>
                    <span className="block truncate text-[12px] text-muted-foreground">{meta(activity)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {showStatus ? <ActivityStatusBadge status={activity.status} /> : null}
                    <ArrowUpRight
                      aria-hidden
                      className="size-4 text-fg-faint opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </li>
  );
}

function Activities({ activities }: Pick<DashboardData, "activities">) {
  const place = (activity: ActivityView) => activity.institution?.name ?? activity.country;
  return (
    <section aria-labelledby="activities-heading" className="dash-rise min-w-0" style={{ animationDelay: "120ms" }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={cn(eyebrow, "text-muj-fg")}>Agenda</p>
          <h2 id="activities-heading" className={cn(sectionTitle, "mt-2")}>
            Activities
          </h2>
        </div>
        <SectionLink href="/internal/activities">View all activities</SectionLink>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-hairline py-5 sm:grid-cols-4">
        <ActivityCount label="Total" value={activities.total} href="/internal/activities" />
        <ActivityCount
          label="Completed"
          value={activities.completed.length}
          color={tones.completed}
          href="/internal/activities?status=completed"
        />
        <ActivityCount
          label="Upcoming"
          value={activities.upcoming.length}
          color={tones.upcoming}
          href="/internal/activities?when=upcoming"
        />
        <ActivityCount
          label="Overdue"
          value={activities.overdue.length}
          color={tones.overdue}
          href="/internal/activities?status=needs-update"
        />
      </div>

      <ol className="relative mt-7 space-y-8 before:absolute before:top-3 before:bottom-3 before:left-[8.5px] before:w-px before:bg-gradient-to-b before:from-line-bold before:via-line before:to-transparent">
        <AgendaGroup
          title="Needs an update"
          color={tones.overdue}
          items={activities.overdue.slice(0, LIST_SIZE)}
          empty="No overdue activities."
          meta={(a) => `${place(a)} · ${formatRelativeDays(a.daysFromToday)}`}
          more={{ count: activities.overdue.length - LIST_SIZE, href: "/internal/activities?status=needs-update" }}
        />
        <AgendaGroup
          title="Coming up"
          color={tones.upcoming}
          items={activities.upcoming.slice(0, LIST_SIZE)}
          empty="Nothing scheduled."
          meta={(a) => `${place(a)} · ${formatRelativeDays(a.daysFromToday)}`}
          more={{ count: activities.upcoming.length - LIST_SIZE, href: "/internal/activities?when=upcoming" }}
          showStatus
        />
        <AgendaGroup
          title="Recently completed"
          color={tones.completed}
          items={activities.completed.slice(0, LIST_SIZE)}
          empty="No completed activities recorded."
          meta={place}
          more={{ count: activities.completed.length - LIST_SIZE, href: "/internal/activities?status=completed" }}
        />
      </ol>
    </section>
  );
}

function CompletenessRings({ mous }: Pick<DashboardData, "mous">) {
  const radii = [58, 44, 30];
  return (
    <figure className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <svg viewBox="0 0 140 140" className="size-32 shrink-0 -rotate-90" aria-hidden>
        {mous.completeness.map((row, index) => {
          const r = radii[index];
          const length = 2 * Math.PI * r;
          const share = mous.total ? row.recorded / mous.total : 0;
          return (
            <g key={row.key} fill="none" strokeWidth="9" strokeLinecap="round">
              <circle
                cx="70"
                cy="70"
                r={r}
                stroke="var(--line-strong)"
                strokeDasharray={row.recorded === 0 ? "1.5 5" : undefined}
                strokeWidth={row.recorded === 0 ? 3 : 9}
              />
              {row.recorded > 0 ? (
                <circle
                  cx="70"
                  cy="70"
                  r={r}
                  stroke={ringColors[row.key]}
                  strokeDasharray={length}
                  strokeDashoffset={length * (1 - share)}
                  className="dash-ring"
                  style={{ "--ring-length": length, animationDelay: `${200 + index * 150}ms` } as React.CSSProperties}
                />
              ) : null}
            </g>
          );
        })}
      </svg>
      <figcaption className="min-w-0 flex-1">
        <ul className="space-y-2.5">
          {mous.completeness.map((row) => (
            <li key={row.key} className="flex items-baseline gap-2.5 text-[13px]">
              <span aria-hidden className="size-2.5 shrink-0 translate-y-px rounded-full" style={{ background: ringColors[row.key] }} />
              <span className="min-w-0 flex-1 text-fg-soft">{row.label}</span>
              {row.recorded === 0 ? (
                <span className="text-fg-faint italic">none recorded</span>
              ) : (
                <span className="text-foreground tabular-nums">
                  {row.recorded}
                  <span className="text-fg-faint"> / {mous.total}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

function Insights({ mous, attention }: Pick<DashboardData, "mous" | "attention">) {
  const statusRecorded = mous.completeness.find((row) => row.key === "status")?.recorded ?? 0;
  return (
    <aside
      aria-label="MoU records and records to review"
      className="dash-rise space-y-8 rounded-[1.75rem] bg-insight p-6 sm:p-7 lg:sticky lg:top-24"
      style={{ animationDelay: "220ms" }}
    >
      <section aria-labelledby="mou-heading">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className={cn(eyebrow, "text-muj-fg")}>Insights</p>
            <h2 id="mou-heading" className="mt-2 font-display text-[1.35rem] leading-none font-medium tracking-[-0.03em] text-foreground">
              MoU records
            </h2>
          </div>
          <SectionLink href="/internal/universities">Universities &amp; MoUs</SectionLink>
        </div>

        {mous.total === 0 ? (
          <p className="mt-4 text-[13px] text-muted-foreground">No MoUs recorded yet.</p>
        ) : (
          <>
            <p className="mt-3 mb-5 text-[13px] text-muted-foreground">
              Details recorded across {mous.total} MoUs.
            </p>
            <CompletenessRings mous={mous} />
            {statusRecorded === 0 ? (
              <p className="mt-5 border-l-2 border-muj pl-3 text-[12px] leading-relaxed text-muted-foreground">
                No MoU has a status or end date yet, so active and expiring MoUs can&apos;t be shown.
              </p>
            ) : (
              <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px]">
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
          </>
        )}
      </section>

      {attention.length > 0 ? (
        <section aria-labelledby="attention-heading">
          <h2 id="attention-heading" className="text-[14px] font-medium text-foreground">
            Records to review
          </h2>
          <ul className="mt-2 divide-y divide-hairline">
            {attention.map((row) => (
              <li key={row.key}>
                <Link
                  href={row.href}
                  className="group grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-2 py-2.5 text-[13px] text-fg-soft transition-colors hover:text-foreground"
                >
                  <span className="font-display text-[1.35rem] leading-none font-medium tracking-[-0.03em] text-muj-fg tabular-nums">
                    {row.count}
                  </span>
                  {row.label}
                  <ArrowRight
                    aria-hidden
                    className="size-3.5 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  );
}

function GlobalReach({ regions }: Pick<DashboardData, "regions">) {
  const total = regions.byRegion.reduce((sum, row) => sum + row.universities, 0);
  const colorFor = (index: number) => `var(--reach-${(index % 7) + 1})`;
  const percent = (value: number) => Math.round((value / total) * 100);

  return (
    <section
      aria-labelledby="regions-heading"
      data-dashboard-section="below"
      className="dash-rise border-t border-hairline pt-10"
      style={{ animationDelay: "300ms" }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={cn(eyebrow, "text-muj-fg")}>Global reach</p>
          <h2 id="regions-heading" className={cn(sectionTitle, "mt-2")}>
            Partner universities by region
          </h2>
        </div>
        <SectionLink href="/internal/universities">All universities</SectionLink>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(15rem,1fr)] lg:gap-14">
        <figure className="min-w-0">
          <figcaption className="sr-only">
            {total} partner universities by region, out of {regions.countries} countries
          </figcaption>
          <div className="dash-grow flex h-16 w-full gap-1 overflow-hidden rounded-2xl sm:h-20">
            {regions.byRegion.map((row, index) => (
              <Link
                key={row.region}
                href={`/internal/universities?region=${encodeURIComponent(row.region)}`}
                aria-hidden
                tabIndex={-1}
                title={`${row.region}: ${row.universities}`}
                className="min-w-1.5 transition-[filter,transform] duration-200 first:rounded-l-2xl last:rounded-r-2xl hover:brightness-110 hover:saturate-125"
                style={{ flexGrow: row.universities, flexBasis: 0, background: colorFor(index) }}
              />
            ))}
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 xl:grid-cols-4">
            {regions.byRegion.map((row, index) => (
              <li key={row.region}>
                <Link
                  href={`/internal/universities?region=${encodeURIComponent(row.region)}`}
                  className="group block"
                >
                  <span className="flex items-center gap-2 text-[12px] text-muted-foreground group-hover:text-foreground">
                    <span aria-hidden className="h-2.5 w-4 rounded-full" style={{ background: colorFor(index) }} />
                    {row.region}
                  </span>
                  <span className="mt-1.5 flex items-baseline gap-2">
                    <span className="font-display text-[1.75rem] leading-none font-medium tracking-[-0.04em] text-foreground tabular-nums">
                      {row.universities}
                    </span>
                    <span className="text-[12px] text-fg-faint tabular-nums">{percent(row.universities)}%</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </figure>

        <div className="min-w-0">
          <h3 className="flex items-baseline justify-between gap-3 text-[14px] font-medium text-foreground">
            Top countries
            <span className="text-[12px] font-normal text-muted-foreground">{regions.countries} countries in total</span>
          </h3>
          <ol className="mt-3">
            {regions.topCountries.map((row, index) => (
              <li key={row.country}>
                <Link
                  href={`/internal/universities?country=${encodeURIComponent(row.country)}`}
                  className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-baseline gap-2 border-b border-hairline py-3 transition-colors hover:border-line-bold"
                >
                  <span className="font-display text-[13px] text-muj-fg tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate text-[15px] text-fg-soft transition-transform group-hover:translate-x-1 group-hover:text-foreground">
                    {row.country}
                  </span>
                  <span className="font-display text-[1.25rem] leading-none font-medium tracking-[-0.03em] text-foreground tabular-nums">
                    {row.universities}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const [input, mode] = await Promise.all([getDashboardInput(), getDataMode()]);
  const { totals, activities, mous, attention, regions, today } = computeDashboard(input);

  return (
    <div className="space-y-12 pb-6 sm:space-y-14">
      <Snapshot totals={totals} today={today} />

      {mode.sampleData ? (
        <DataNotice>Fictional sample records are included because INTERNAL_SAMPLE_DATA is on.</DataNotice>
      ) : null}

      <div
        data-dashboard-section="split"
        className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(20rem,1fr)] xl:gap-14"
      >
        <Activities activities={activities} />
        <Insights mous={mous} attention={attention} />
      </div>

      {regions.byRegion.length > 0 ? <GlobalReach regions={regions} /> : null}
    </div>
  );
}
