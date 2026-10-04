import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { PartnershipBadge } from "@/components/internal/badges";
import { SuccessNotice } from "@/components/internal/forms/form-fields";
import { VerificationBadge } from "@/components/internal/ui/provenance";
import { getDataMode } from "@/lib/internal/data/context";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { FilterBar } from "@/components/internal/ui/filter-bar";
import { ManageLink } from "@/components/internal/ui/manage-action";
import { PageHeader } from "@/components/internal/ui/page-header";
import { ResourceCard, ResourceTable } from "@/components/internal/ui/resource-table";
import { DataNotice, SourceBadge } from "@/components/internal/ui/source-badge";
import { StatCard } from "@/components/internal/ui/stat-card";
import { agreementStatuses, agreementTypes } from "@/lib/internal/data/agreements";
import {
  agreementCoverage,
  getAgreementTotals,
  getInstitutionFilterOptions,
  institutionSources,
  listInstitutions,
  partnershipStatuses,
  type UniversityRow,
} from "@/lib/internal/data/institutions";
import { EXPIRY_WARNING_DAYS, formatDate } from "@/lib/internal/dates";
import { readEnumParam, readParam, type SearchParamsProp } from "@/lib/internal/query";
import {
  agreementStatusMeta,
  agreementTypeLabel,
  optionsFrom,
  partnershipStatusMeta,
  sourceMeta,
} from "@/lib/internal/status";

export const metadata: Metadata = { title: "Universities & MoUs" };

function mouSummary(row: UniversityRow) {
  if (row.agreements.length === 0) return null;
  const types = [...new Set(row.agreements.map((a) => a.typeLabel ?? agreementTypeLabel[a.type]))];
  return types.length > 2 ? `${types.slice(0, 2).join(", ")} +${types.length - 2}` : types.join(", ");
}

function MouCount({ row }: { row: UniversityRow }) {
  if (row.agreementCount === 0) return <span className="text-fg-faint">None recorded</span>;
  return (
    <span>
      <span className="tabular-nums">
        {row.agreementCount} MoU{row.agreementCount === 1 ? "" : "s"}
        {row.activeAgreementCount > 0 ? (
          <span className="text-fg-faint"> · {row.activeAgreementCount} active</span>
        ) : null}
      </span>
      <span className="block max-w-56 truncate text-[12px] text-fg-faint">{mouSummary(row)}</span>
    </span>
  );
}

export default async function UniversitiesPage({ searchParams }: SearchParamsProp) {
  const params = await searchParams;
  const [options, mode, totals] = await Promise.all([
    getInstitutionFilterOptions(),
    getDataMode(),
    getAgreementTotals(),
  ]);

  const [rows, all] = await Promise.all([
    listInstitutions({
      q: readParam(params, "q"),
      region: readEnumParam(params, "region", options.regions),
      country: readEnumParam(params, "country", options.countries),
      status: readEnumParam(params, "status", partnershipStatuses),
      source: readEnumParam(params, "source", institutionSources),
      coverage: readEnumParam(params, "coverage", agreementCoverage),
      agreementStatus: readEnumParam(params, "mouStatus", agreementStatuses),
      agreementType: readEnumParam(params, "mouType", agreementTypes),
    }),
    listInstitutions(),
  ]);

  const withMous = all.filter((row) => row.agreementCount > 0).length;
  const deleted = readParam(params, "notice") === "university-deleted";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Universities & MoUs"
        description={`Each partner university once, with every MoU and agreement recorded for it. Where dates are recorded, agreements ending within ${EXPIRY_WARNING_DAYS} days are flagged as expiring soon.`}
        actions={
          <ManageLink
            permission="institutions:create"
            href="/internal/universities/new"
            label="Add university"
            icon="add"
            variant="primary"
          />
        }
      />

      {deleted ? <SuccessNotice>University deleted.</SuccessNotice> : null}

      <DataNotice>
        <strong className="font-medium">Official MUJ source</strong> institutions and their
        collaboration rows are imported from the official partner page, which gives no dates or
        status, so those MoUs show <em>Status not stated</em>. Only rows whose wording names an
        agreement type carry that type. <strong className="font-medium">Earlier directory</strong>{" "}
        names are not on the official page and await DoIC review.
        {mode.sampleData ? (
          <>
            {" "}
            <strong className="font-medium">Sample data</strong> institutions (&ldquo;Example
            &hellip;&rdquo;) are fictional and shown because INTERNAL_SAMPLE_DATA is on.
          </>
        ) : null}
      </DataNotice>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="Universities" value={all.length} href="/internal/universities" />
        <StatCard
          label="With MoUs"
          value={withMous}
          hint={`${all.length - withMous} with none recorded`}
          accent="var(--cyan)"
          href="/internal/universities?coverage=with"
        />
        <StatCard
          label="MoUs recorded"
          value={totals.total}
          hint="Each agreement counted once"
          accent="var(--glow)"
        />
        <StatCard
          label="Active"
          value={totals.count("active")}
          accent="var(--success)"
          href="/internal/universities?mouStatus=active"
        />
        <StatCard
          label="Expiring soon"
          value={totals.count("expiring-soon")}
          accent="var(--warning)"
          href="/internal/universities?mouStatus=expiring-soon"
        />
        <StatCard
          label="Status not stated"
          value={totals.count("not-stated")}
          hint="Listed on the official page"
          accent="var(--glow)"
          href="/internal/universities?mouStatus=not-stated"
        />
      </div>

      <FilterBar
        searchPlaceholder="Search university, country, or MoU"
        noun={{ singular: "university", plural: "universities" }}
        resultCount={rows.length}
        totalCount={all.length}
        selects={[
          {
            name: "region",
            label: "Region",
            allLabel: "All regions",
            options: options.regions.map((value) => ({ value, label: value })),
          },
          {
            name: "country",
            label: "Country",
            allLabel: "All countries",
            options: options.countries.map((value) => ({ value, label: value })),
          },
          {
            name: "coverage",
            label: "MoUs",
            allLabel: "With or without MoUs",
            options: [
              { value: "with", label: "With MoUs" },
              { value: "without", label: "No MoU recorded" },
            ],
          },
          {
            name: "mouStatus",
            label: "MoU status",
            allLabel: "Any MoU status",
            options: optionsFrom(agreementStatuses, agreementStatusMeta),
          },
          {
            name: "mouType",
            label: "MoU type",
            allLabel: "Any MoU type",
            options: optionsFrom(agreementTypes, agreementTypeLabel),
          },
          {
            name: "status",
            label: "Partnership",
            allLabel: "All partnership statuses",
            options: optionsFrom(partnershipStatuses, partnershipStatusMeta),
          },
          {
            name: "source",
            label: "Source",
            allLabel: "All sources",
            options: institutionSources.map((value) => ({
              value,
              label: sourceMeta[value].label,
            })),
          },
        ]}
      />

      <ResourceTable<UniversityRow>
        caption="Universities and their MoUs"
        rows={rows}
        getKey={(row) => row.id}
        getHref={(row) => `/internal/universities/${row.id}`}
        getRowLabel={(row) => `${row.name}, ${row.country}`}
        empty={
          <EmptyState
            icon={SearchX}
            title="No universities match these filters"
            description="Try a different search term or clear the filters."
          />
        }
        columns={[
          {
            key: "name",
            header: "University",
            cell: (row) => (
              <span className="font-medium">
                {row.name}
                {row.normalizedName && row.normalizedName !== row.name ? (
                  <span className="block text-[12px] font-normal text-fg-faint">{row.normalizedName}</span>
                ) : null}
              </span>
            ),
          },
          {
            key: "location",
            header: "Location",
            cell: (row) => (
              <span>
                {row.country}
                <span className="block text-[12px] text-fg-faint">{row.region}</span>
              </span>
            ),
          },
          {
            key: "agreements",
            header: "MoUs",
            cell: (row) => <MouCount row={row} />,
          },
          {
            key: "status",
            header: "Partnership",
            cell: (row) => <PartnershipBadge status={row.partnershipStatus} />,
          },
          {
            key: "expiry",
            header: "Next expiry",
            className: "whitespace-nowrap",
            cell: (row) =>
              row.nextExpiry ? formatDate(row.nextExpiry) : <span className="text-fg-faint">—</span>,
          },
          {
            key: "source",
            header: "Source",
            cell: (row) => (
              <span className="flex flex-col items-start gap-1">
                <SourceBadge source={row.source} />
                <VerificationBadge status={row.verification} />
              </span>
            ),
          },
        ]}
        renderCard={(row) => (
          <ResourceCard
            title={row.name}
            subtitle={`${row.country} · ${row.region}`}
            badges={
              <>
                <PartnershipBadge status={row.partnershipStatus} />
                <SourceBadge source={row.source} />
              </>
            }
            meta={[
              {
                label: "MoUs",
                value: row.agreementCount
                  ? `${row.agreementCount}${row.activeAgreementCount ? ` · ${row.activeAgreementCount} active` : ""}`
                  : "None recorded",
              },
              { label: "Next expiry", value: formatDate(row.nextExpiry, "—") },
            ]}
          />
        )}
      />
    </div>
  );
}
