import type { Metadata } from "next";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CalendarDays,
  Compass,
  FileText,
  GraduationCap,
  Handshake,
  History,
  ListChecks,
  Timer,
} from "lucide-react";
import Link from "next/link";
import {
  ActivityStatusBadge,
  AgreementStatusBadge,
  OpportunityStatusBadge,
} from "@/components/internal/badges";
import { ColumnChart } from "@/components/internal/analytics/column-chart";
import { DashboardFilters } from "@/components/internal/analytics/dashboard-filters";
import { MetricGroup } from "@/components/internal/analytics/metric-group";
import { Breakdown } from "@/components/internal/ui/breakdown";
import { LinkedList } from "@/components/internal/ui/detail";
import { PageHeader, Panel, PanelHeader } from "@/components/internal/ui/page-header";
import { DataNotice } from "@/components/internal/ui/source-badge";
import {
  activityStatusKeys,
  agreementStatusKeys,
  computeDashboard,
  dashboardFilterOptions,
  dashboardFilterScope,
  documentTypeKeys,
  parseDashboardFilters,
  sectionHref,
} from "@/lib/internal/analytics";
import { getDataMode } from "@/lib/internal/data/context";
import { getDashboardInput } from "@/lib/internal/data/dashboard";
import { formatDate, formatRelativeDays, formatTimestamp } from "@/lib/internal/dates";
import { agreementHref } from "@/lib/internal/links";
import type { SearchParamsProp } from "@/lib/internal/query";
import {
  activityStatusMeta,
  agreementStatusMeta,
  audienceMeta,
  documentTypeLabel,
  optionsFrom,
  programAudiences,
} from "@/lib/internal/status";

export const metadata: Metadata = {
  title: "Dashboard",
};

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 id={id} className="font-display text-[1.1rem] font-medium tracking-[-0.02em] text-foreground">
        {title}
      </h2>
      <p className="text-[13px] text-muted-foreground">{description}</p>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="border-t border-hairline px-5 py-3 text-[12px] leading-relaxed text-muted-foreground">{children}</p>;
}

export default async function DashboardPage({ searchParams }: SearchParamsProp) {
  const [params, input, mode] = await Promise.all([searchParams, getDashboardInput(), getDataMode()]);
  const options = dashboardFilterOptions(input);
  const filters = parseDashboardFilters(params, options);
  const d = computeDashboard(input, filters);
  const { universities, mous, geography, programs, activities, documents } = d;

  const toUniversities = (href: string) => sectionHref(href, filters, ["country"]);
  const toPrograms = (href: string) => sectionHref(href, filters, ["country", "audience"]);
  const toActivities = (href: string) => sectionHref(href, filters, ["country"]);

  const dataGaps = d.dataGaps.filter((gap) => gap.count > 0);
  const topCountries = geography.countries.filter((row) => row.mous > 0).slice(0, 8);
  const otherCountries = geography.countries.filter((row) => row.mous > 0).length - topCountries.length;

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <PageHeader
          title="Dashboard"
          description={`All DoIC analytics in one place, counted live from the records as of ${formatDate(d.today)}. Select any figure to open the records behind it.`}
        />

        <DataNotice>
          Figures count the records stored in this portal, which are imported from MUJ&apos;s official
          Internationalization pages and not yet confirmed against signed documents.{" "}
          <em>Not recorded</em> means the information needed is missing from the records, which is
          different from a count of 0.
          {mode.sampleData ? " Fictional sample records are included because INTERNAL_SAMPLE_DATA is on." : null}
        </DataNotice>

        <DashboardFilters
          values={filters}
          selects={[
            {
              name: "country",
              label: "Country",
              allLabel: "All countries",
              options: options.countries.map((value) => ({ value, label: value })),
              scope: dashboardFilterScope.country,
            },
            {
              name: "audience",
              label: "Audience",
              allLabel: "Students and faculty",
              options: optionsFrom(programAudiences, audienceMeta),
              scope: dashboardFilterScope.audience,
            },
            {
              name: "year",
              label: "Activity year",
              allLabel: "All years",
              options: options.years.map((value) => ({ value, label: value })),
              scope: dashboardFilterScope.year,
            },
          ]}
        />
      </div>

      <section aria-labelledby="overview" className="space-y-4">
        <SectionHeading
          id="overview"
          title="Overview"
          description="Headline totals. Each record is counted once."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricGroup
            title="Universities"
            icon={GraduationCap}
            href={toUniversities("/internal/universities")}
            headline={{
              label: "Partner universities",
              value: universities.total,
              hint: `In ${universities.countries} ${universities.countries === 1 ? "country" : "countries"}`,
            }}
            metrics={[
              { label: "Listed on the official MUJ page", value: universities.official },
              {
                label: "Awaiting DoIC review",
                hint: "Names from the earlier directory",
                value: universities.directory,
                href: toUniversities("/internal/universities?source=directory"),
              },
              ...(mode.sampleData ? [{ label: "Fictional sample", value: universities.sample }] : []),
              {
                label: "With at least one MoU",
                value: universities.withMous,
                href: toUniversities("/internal/universities?coverage=with"),
              },
            ]}
          />
          <MetricGroup
            title="MoUs and agreements"
            icon={Handshake}
            href={toUniversities("/internal/universities?coverage=with")}
            headline={{ label: "MoU and agreement records", value: mous.total }}
            metrics={[
              {
                label: "Active",
                hint: "Signed and within its dates",
                value: mous.active,
                href: toUniversities("/internal/universities?mouStatus=active"),
              },
              {
                label: `Expiring within ${mous.expiryWindowDays} days`,
                value: mous.expiringSoonCount,
                emphasis: "warning",
                href: toUniversities("/internal/universities?mouStatus=expiring-soon"),
              },
              {
                label: "Expired",
                value: mous.expired,
                href: toUniversities("/internal/universities?mouStatus=expired"),
              },
              {
                label: "No status or dates recorded",
                value: mous.byStatus["not-stated"],
                href: toUniversities("/internal/universities?mouStatus=not-stated"),
              },
            ]}
          />
          <MetricGroup
            title="Programmes"
            icon={BookOpen}
            href={toPrograms("/internal/programs")}
            headline={{ label: "Programme types", value: programs.programmes }}
            metrics={[
              {
                label: "Offerings",
                hint: "A programme offered with a specific university",
                value: programs.offerings,
              },
              ...programs.byAudience.map((row) => ({
                label: `Programme types for ${audienceMeta[row.audience].label.toLowerCase()}`,
                value: row.programmes,
              })),
            ]}
          />
          <MetricGroup
            title="Opportunities"
            icon={Compass}
            href={toPrograms("/internal/programs?tab=opportunities")}
            headline={{ label: "Application calls", value: programs.opportunities }}
            metrics={[
              ...programs.byAudience.map((row) => ({
                label: `For ${audienceMeta[row.audience].label.toLowerCase()}`,
                value: row.opportunities,
                href: sectionHref("/internal/programs?tab=opportunities", { ...filters, audience: row.audience }, ["country", "audience"]),
              })),
              {
                label: "Open for applications now",
                value: programs.openOpportunities,
                href: toPrograms("/internal/programs?tab=opportunities&status=open"),
              },
            ]}
          />
          <MetricGroup
            title="Documents and reports"
            icon={FileText}
            href="/internal/documents"
            headline={{ label: "Documents", value: documents.total }}
            metrics={[
              { label: "Reports available", value: documents.reports, href: "/internal/documents?tab=reports" },
              {
                label: "Not linked to any record",
                value: d.dataGaps.find((gap) => gap.key === "document-unlinked")?.count ?? 0,
                href: "/internal/documents?linked=unlinked",
              },
            ]}
          />
          <MetricGroup
            title="Activities"
            icon={Activity}
            href={toActivities("/internal/activities")}
            headline={{ label: "Visits, delegations, and events recorded", value: activities.total }}
            metrics={[
              {
                label: "Completed",
                value: activities.completed,
                href: toActivities("/internal/activities?status=completed"),
              },
              {
                label: "Upcoming",
                hint: "Planned or confirmed, today or later",
                value: activities.upcoming.length,
                href: toActivities("/internal/activities?when=upcoming"),
              },
              {
                label: "Overdue for an update",
                hint: "Planned, but the date has passed",
                value: activities.overdue.length,
                emphasis: "warning",
                href: toActivities("/internal/activities?status=needs-update"),
              },
            ]}
          />
        </div>
      </section>

      <section aria-labelledby="analytics" className="space-y-4">
        <SectionHeading
          id="analytics"
          title="Analytics"
          description="How the records break down. Bars show each group's share of the total; select a row to see those records."
        />
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <Panel>
            <PanelHeader
              level={3}
              title="MoU status"
              icon={Handshake}
              description="Derived from each MoU's recorded status and start and end dates."
            />
            <Breakdown
              hideZero
              emptyLabel="No MoUs match the current filters."
              rows={agreementStatusKeys.map((key) => ({
                key,
                label: agreementStatusMeta[key].label,
                count: mous.byStatus[key],
                tone: agreementStatusMeta[key].tone,
                href: toUniversities(`/internal/universities?mouStatus=${key}`),
              }))}
            />
            {mous.total > 0 && mous.statusRecorded === 0 ? (
              <Note>
                None of these {mous.total} MoUs has a status or dates recorded yet. The official
                partner page lists them without dates, so active, expired, and expiring figures stay{" "}
                <em>Not recorded</em> until DoIC adds them.
              </Note>
            ) : null}
          </Panel>

          <Panel>
            <PanelHeader
              level={3}
              title="Where our MoUs are"
              icon={GraduationCap}
              description="MoUs by the region and country of the lead university. Each MoU is counted once."
            />
            <Breakdown
              hideZero
              emptyLabel="No MoUs match the current filters."
              rows={geography.byRegion.map((row) => ({
                key: row.region,
                label: `${row.region} · ${row.universities} ${row.universities === 1 ? "university" : "universities"}`,
                count: row.mous,
                tone: "info",
                href: toUniversities(`/internal/universities?region=${encodeURIComponent(row.region)}`),
              }))}
            />
            {topCountries.length > 0 ? (
              <div className="border-t border-hairline px-5 py-4">
                <h4 className="mb-2 text-[12px] text-muted-foreground">Countries with the most MoUs</h4>
                <ol className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {topCountries.map((row) => (
                    <li key={row.country}>
                      <Link
                        href={`/internal/universities?country=${encodeURIComponent(row.country)}`}
                        className="flex items-baseline justify-between gap-3 rounded text-[13px] text-fg-soft hover:text-foreground"
                      >
                        <span className="truncate">{row.country}</span>
                        <span className="shrink-0 text-foreground tabular-nums">{row.mous}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
                {otherCountries > 0 ? (
                  <p className="mt-2 text-[12px] text-fg-faint">
                    and {otherCountries} more {otherCountries === 1 ? "country" : "countries"}
                  </p>
                ) : null}
              </div>
            ) : null}
          </Panel>

          <Panel>
            <PanelHeader
              level={3}
              title="Programmes and opportunities by audience"
              icon={BookOpen}
              description="Audience follows the programme: Academic Visits are for faculty, all other programmes for students."
            />
            <div className="overflow-x-auto px-5 py-4">
              <table className="w-full text-[13px]">
                <caption className="sr-only">Programmes, offerings, and opportunities by audience</caption>
                <thead>
                  <tr className="text-left text-[12px] text-muted-foreground">
                    <th scope="col" className="pb-2 font-normal">Audience</th>
                    <th scope="col" className="pb-2 text-right font-normal">Programme types</th>
                    <th scope="col" className="pb-2 text-right font-normal">Offerings</th>
                    <th scope="col" className="pb-2 text-right font-normal">Opportunities</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {programs.byAudience
                    .filter((row) => !filters.audience || row.audience === filters.audience)
                    .map((row) => (
                      <tr key={row.audience}>
                        <th scope="row" className="py-2 text-left font-normal text-fg-soft">
                          {audienceMeta[row.audience].label}
                        </th>
                        <td className="py-2 text-right tabular-nums">{row.programmes}</td>
                        <td className="py-2 text-right tabular-nums">{row.offerings}</td>
                        <td className="py-2 text-right tabular-nums">{row.opportunities}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <h4 className="border-t border-hairline px-5 pt-4 text-[12px] text-muted-foreground">
              Offerings by programme
            </h4>
            <Breakdown
              emptyLabel="No offerings match the current filters."
              rows={programs.offeringsByProgram.map((row) => ({
                key: row.program.id,
                label: row.program.name,
                count: row.offerings,
                tone: "info",
                href: `/internal/programs/${row.program.id}`,
              }))}
            />
          </Panel>

          <Panel>
            <PanelHeader
              level={3}
              title="Activities"
              icon={CalendarDays}
              description="Status of each recorded visit, delegation, or event, and how many took place each year."
            />
            <Breakdown
              hideZero
              emptyLabel="No activities match the current filters."
              rows={activityStatusKeys.map((key) => ({
                key,
                label: activityStatusMeta[key].label,
                count: activities.byStatus[key],
                tone: activityStatusMeta[key].tone,
                href: toActivities(`/internal/activities?status=${key}`),
              }))}
            />
            <h4 className="border-t border-hairline px-5 pt-4 text-[12px] text-muted-foreground">
              Activities by year of start date
            </h4>
            {activities.trendAvailable ? (
              <ColumnChart
                caption="Activities by year"
                data={activities.byYear.map((row) => ({ label: row.year, total: row.total, part: row.completed }))}
                partLabel="Completed"
                restLabel="Not completed (planned, confirmed, cancelled, or overdue)"
              />
            ) : (
              <p className="px-5 py-4 text-[13px] text-fg-faint">
                {activities.total > 0
                  ? `A yearly view needs activities in at least two different years; the current selection only covers ${activities.byYear.filter((row) => row.total > 0).map((row) => row.year).join(", ")}.`
                  : "No activities match the current filters."}
              </p>
            )}
          </Panel>

          <Panel className="lg:col-span-2">
            <PanelHeader
              level={3}
              title="Documents by category"
              icon={FileText}
              description="Every document record by its type. Documents are not tied to a country or audience, so the filters do not change this chart."
            />
            <Breakdown
              hideZero
              emptyLabel="No documents recorded."
              rows={documentTypeKeys.map((key) => ({
                key,
                label: documentTypeLabel[key],
                count: documents.byType[key],
                tone: "info",
                href: `/internal/documents?type=${key}`,
              }))}
            />
          </Panel>
        </div>
      </section>

      <section aria-labelledby="attention" className="space-y-4">
        <SectionHeading
          id="attention"
          title="Needs attention"
          description="Dates coming up, overdue updates, and records with missing details. Select an item to open it."
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel>
            <PanelHeader
              level={3}
              title="MoUs approaching expiry"
              icon={Timer}
              description={`MoUs whose end date falls within the next ${mous.expiryWindowDays} days.`}
            />
            {mous.expiringSoonCount === null ? (
              <p className="px-5 py-4 text-[13px] text-muted-foreground">
                Expiry can&apos;t be tracked yet because no MoU has a signed status and end date recorded.
                Adding dates to MoU records will list upcoming renewals here.
              </p>
            ) : (
              <LinkedList
                emptyTitle="No MoUs expire in this window"
                items={mous.expiringSoon.map((agreement) => ({
                  key: agreement.id,
                  href: agreementHref(agreement),
                  title: agreement.institution?.name ?? agreement.reference,
                  meta: `${agreement.reference} · ends ${formatDate(agreement.endDate)}`,
                  badge: <AgreementStatusBadge status={agreement.status} daysToExpiry={agreement.daysToExpiry} />,
                }))}
              />
            )}
          </Panel>

          <Panel>
            <PanelHeader
              level={3}
              title="Overdue activity updates"
              icon={AlertTriangle}
              description="Planned activities whose date has passed. Mark them completed or cancelled."
            />
            <LinkedList
              emptyTitle="No overdue activities"
              emptyDescription="Every planned activity is still in the future or has been updated."
              items={activities.overdue.slice(0, 6).map((activity) => ({
                key: activity.id,
                href: `/internal/activities/${activity.id}`,
                title: activity.title,
                meta: `${formatDate(activity.startDate)} · ${activity.institution?.name ?? activity.country}`,
                badge: <ActivityStatusBadge status={activity.status} />,
              }))}
            />
            {activities.overdue.length > 6 ? (
              <Note>
                <Link href={toActivities("/internal/activities?status=needs-update")} className="text-glow hover:text-foreground">
                  View all {activities.overdue.length} overdue activities
                </Link>
              </Note>
            ) : null}
          </Panel>

          <Panel>
            <PanelHeader
              level={3}
              title="Coming up"
              icon={CalendarClock}
              description="The next scheduled activities and application deadlines."
            />
            <h4 className="px-5 pt-3 text-[12px] text-muted-foreground">Activities</h4>
            <LinkedList
              emptyTitle="No activities scheduled"
              items={activities.upcoming.slice(0, 4).map((activity) => ({
                key: activity.id,
                href: `/internal/activities/${activity.id}`,
                title: activity.title,
                meta: `${formatDate(activity.startDate)} · ${formatRelativeDays(activity.daysFromToday)} · ${activity.institution?.name ?? activity.country}`,
                badge: <ActivityStatusBadge status={activity.status} />,
              }))}
            />
            <h4 className="border-t border-hairline px-5 pt-3 text-[12px] text-muted-foreground">
              Opportunity deadlines
            </h4>
            <LinkedList
              emptyTitle="No upcoming deadlines"
              emptyDescription="No open or upcoming call has a deadline today or later."
              items={programs.upcomingDeadlines.slice(0, 4).map((opportunity) => ({
                key: opportunity.id,
                href: `/internal/opportunities/${opportunity.id}`,
                title: opportunity.title,
                meta: `Deadline ${formatDate(opportunity.deadline)}${opportunity.daysToDeadline !== null ? ` · ${formatRelativeDays(opportunity.daysToDeadline)}` : ""}`,
                badge: <OpportunityStatusBadge status={opportunity.status} />,
              }))}
            />
          </Panel>

          <Panel>
            <PanelHeader
              level={3}
              title="Missing or incomplete records"
              icon={ListChecks}
              description="Records where a field the dashboard relies on is empty."
            />
            {dataGaps.length === 0 ? (
              <p className="px-5 py-4 text-[13px] text-muted-foreground">No gaps found in the current selection.</p>
            ) : (
              <ul className="divide-y divide-hairline">
                {dataGaps.map((gap) => (
                  <li key={gap.key}>
                    <Link
                      href={gap.href}
                      className="flex items-center justify-between gap-3 px-5 py-3 text-[13px] transition-colors hover:bg-overlay-subtle"
                    >
                      <span className="text-fg-soft">{gap.label}</span>
                      <span className="shrink-0 font-medium text-warning-fg tabular-nums">{gap.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </section>

      <section aria-labelledby="recent" className="space-y-4">
        <SectionHeading
          id="recent"
          title="Recent updates"
          description="Records most recently added or edited, by the time the database last saved them."
        />
        <Panel>
          <PanelHeader level={3} title="Latest changes" icon={History} />
          {!d.recentUpdates.available ? (
            <p className="px-5 py-4 text-[13px] text-muted-foreground">
              Edit times are only available when the portal reads from the database. This environment
              uses the bundled dataset, which has no edit history.
            </p>
          ) : (
            <LinkedList
              emptyTitle="No records match the current filters"
              items={d.recentUpdates.rows.map((row) => ({
                key: row.key,
                href: row.href,
                title: row.title,
                meta: `${row.kind} · saved ${formatTimestamp(row.updatedAt)}`,
              }))}
            />
          )}
        </Panel>
      </section>
    </div>
  );
}
