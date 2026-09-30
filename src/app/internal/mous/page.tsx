import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { AgreementStatusBadge, RelativeDays } from "@/components/internal/badges";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { FilterBar } from "@/components/internal/ui/filter-bar";
import { PageHeader } from "@/components/internal/ui/page-header";
import {
  PlaceholderAction,
  unavailableReasons,
} from "@/components/internal/ui/placeholder-action";
import { ResourceCard, ResourceTable } from "@/components/internal/ui/resource-table";
import { DataNotice } from "@/components/internal/ui/source-badge";
import { StatCard } from "@/components/internal/ui/stat-card";
import {
  agreementSorts,
  agreementStatuses,
  agreementTypes,
  getAgreementFilterOptions,
  listAgreements,
} from "@/lib/internal/data/agreements";
import { EXPIRY_WARNING_DAYS, formatDate } from "@/lib/internal/dates";
import { readEnumParam, readParam, type SearchParamsProp } from "@/lib/internal/query";
import { agreementStatusMeta, agreementTypeLabel, optionsFrom } from "@/lib/internal/status";
import type { AgreementView } from "@/lib/internal/types";

export const metadata: Metadata = { title: "MOUs & Agreements" };

export default async function AgreementsPage({ searchParams }: SearchParamsProp) {
  const params = await searchParams;
  const options = await getAgreementFilterOptions();

  const [rows, all] = await Promise.all([
    listAgreements({
      q: readParam(params, "q"),
      status: readEnumParam(params, "status", agreementStatuses),
      type: readEnumParam(params, "type", agreementTypes),
      country: readEnumParam(params, "country", options.countries),
      sort: readEnumParam(params, "sort", agreementSorts),
    }),
    listAgreements(),
  ]);

  const count = (status: AgreementView["status"]) =>
    all.filter((row) => row.status === status).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="MOUs & Agreements"
        description={`Formal agreements with institutions. Status is derived from dates: agreements ending within ${EXPIRY_WARNING_DAYS} days are flagged as expiring soon.`}
        actions={
          <PlaceholderAction
            label="New agreement"
            icon="add"
            variant="primary"
            reason={unavailableReasons.editing}
          />
        }
      />

      <DataNotice>
        Every agreement here is <strong className="font-medium">sample data</strong> attached to
        a fictional &ldquo;Example &hellip;&rdquo; institution. References, dates, and areas are
        invented to exercise status tracking; no agreement of MUJ is shown.
      </DataNotice>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active" value={count("active")} accent="var(--success)" href="/internal/mous?status=active" />
        <StatCard
          label="Expiring soon"
          value={count("expiring-soon")}
          accent="var(--warning)"
          href="/internal/mous?status=expiring-soon"
        />
        <StatCard
          label="In progress"
          value={count("draft") + count("under-review") + count("pending-start")}
          hint="Draft, review, or not started"
          accent="var(--glow)"
        />
        <StatCard label="Expired" value={count("expired")} accent="var(--danger)" href="/internal/mous?status=expired" />
      </div>

      <FilterBar
        searchPlaceholder="Search reference, institution, or area"
        noun={{ singular: "agreement", plural: "agreements" }}
        resultCount={rows.length}
        totalCount={all.length}
        selects={[
          {
            name: "status",
            label: "Status",
            allLabel: "All statuses",
            options: optionsFrom(agreementStatuses, agreementStatusMeta),
          },
          {
            name: "type",
            label: "Type",
            allLabel: "All types",
            options: optionsFrom(agreementTypes, agreementTypeLabel),
          },
          {
            name: "country",
            label: "Country",
            allLabel: "All countries",
            options: options.countries.map((value) => ({ value, label: value })),
          },
          {
            name: "sort",
            label: "Sort",
            defaultValue: "expiry",
            options: [
              { value: "expiry", label: "Expiry date" },
              { value: "start", label: "Newest start" },
              { value: "institution", label: "Institution" },
            ],
          },
        ]}
      />

      <ResourceTable<AgreementView>
        caption="Agreements"
        rows={rows}
        getKey={(row) => row.id}
        getHref={(row) => `/internal/mous/${row.id}`}
        getRowLabel={(row) => `${row.reference}, ${row.institution?.name ?? ""}`}
        empty={
          <EmptyState
            icon={SearchX}
            title="No agreements match these filters"
            description="Try a different search term or clear the filters."
          />
        }
        columns={[
          {
            key: "institution",
            header: "Institution",
            cell: (row) => (
              <span>
                <span className="font-medium">{row.institution?.name ?? "Unknown institution"}</span>
                <span className="block font-mono text-[11px] text-fg-faint">{row.reference}</span>
              </span>
            ),
          },
          {
            key: "type",
            header: "Type",
            cell: (row) => agreementTypeLabel[row.type],
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => <AgreementStatusBadge status={row.status} daysToExpiry={row.daysToExpiry} />,
          },
          {
            key: "start",
            header: "Start",
            className: "whitespace-nowrap",
            cell: (row) => formatDate(row.startDate, "—"),
          },
          {
            key: "end",
            header: "Expiry / renewal",
            className: "whitespace-nowrap",
            cell: (row) => (
              <span>
                {formatDate(row.endDate, "—")}
                <span className="block text-[12px]">
                  <RelativeDays
                    days={row.daysToExpiry}
                    future="Ends"
                    past="Ended"
                    warnWithin={EXPIRY_WARNING_DAYS}
                  />
                </span>
              </span>
            ),
          },
          {
            key: "areas",
            header: "Collaboration areas",
            className: "max-w-56",
            cell: (row) => (
              <span className="line-clamp-2 text-[12px] text-muted-foreground">
                {row.collaborationAreas.join(", ") || "—"}
              </span>
            ),
          },
        ]}
        renderCard={(row) => (
          <ResourceCard
            title={row.institution?.name ?? "Unknown institution"}
            subtitle={`${row.reference} · ${agreementTypeLabel[row.type]}`}
            badges={<AgreementStatusBadge status={row.status} daysToExpiry={row.daysToExpiry} />}
            meta={[
              { label: "Start", value: formatDate(row.startDate, "—") },
              {
                label: "Expiry",
                value: (
                  <>
                    {formatDate(row.endDate, "—")}
                    <span className="block">
                      <RelativeDays
                        days={row.daysToExpiry}
                        future="Ends"
                        past="Ended"
                        warnWithin={EXPIRY_WARNING_DAYS}
                      />
                    </span>
                  </>
                ),
              },
            ]}
          />
        )}
      />
    </div>
  );
}
