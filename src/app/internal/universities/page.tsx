import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { PartnershipBadge } from "@/components/internal/badges";
import { VerificationBadge } from "@/components/internal/ui/provenance";
import { getDataMode } from "@/lib/internal/data/context";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { FilterBar } from "@/components/internal/ui/filter-bar";
import { PageHeader } from "@/components/internal/ui/page-header";
import {
  PlaceholderAction,
  unavailableReasons,
} from "@/components/internal/ui/placeholder-action";
import { ResourceCard, ResourceTable } from "@/components/internal/ui/resource-table";
import { DataNotice, SourceBadge } from "@/components/internal/ui/source-badge";
import {
  getInstitutionFilterOptions,
  institutionSources,
  listInstitutions,
  partnershipStatuses,
} from "@/lib/internal/data/institutions";
import { formatDate } from "@/lib/internal/dates";
import { readEnumParam, readParam, type SearchParamsProp } from "@/lib/internal/query";
import { optionsFrom, partnershipStatusMeta, sourceMeta } from "@/lib/internal/status";
import type { InstitutionView } from "@/lib/internal/types";

export const metadata: Metadata = { title: "Universities" };

export default async function UniversitiesPage({ searchParams }: SearchParamsProp) {
  const params = await searchParams;
  const [options, mode] = await Promise.all([getInstitutionFilterOptions(), getDataMode()]);

  const [rows, all] = await Promise.all([
    listInstitutions({
      q: readParam(params, "q"),
      region: readEnumParam(params, "region", options.regions),
      country: readEnumParam(params, "country", options.countries),
      status: readEnumParam(params, "status", partnershipStatuses),
      source: readEnumParam(params, "source", institutionSources),
    }),
    listInstitutions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Universities"
        description="Institutions from MUJ's official partner page, with the collaboration rows listed for each."
        actions={
          <PlaceholderAction
            label="Add university"
            icon="add"
            variant="primary"
            reason={unavailableReasons.editing}
          />
        }
      />

      <DataNotice>
        <strong className="font-medium">Official MUJ source</strong> institutions are imported
        from the official partner page; their status is <em>Listed</em> because the page gives no
        dates or status. <strong className="font-medium">Earlier directory</strong> names are not
        on the official page and await DoIC review.
        {mode.sampleData ? (
          <>
            {" "}
            <strong className="font-medium">Sample data</strong> institutions (&ldquo;Example
            &hellip;&rdquo;) are fictional and shown because INTERNAL_SAMPLE_DATA is on.
          </>
        ) : null}
      </DataNotice>

      <FilterBar
        searchPlaceholder="Search name, country, or city"
        noun={{ singular: "institution", plural: "institutions" }}
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

      <ResourceTable<InstitutionView>
        caption="Universities"
        rows={rows}
        getKey={(row) => row.id}
        getHref={(row) => `/internal/universities/${row.id}`}
        getRowLabel={(row) => `${row.name}, ${row.country}`}
        empty={
          <EmptyState
            icon={SearchX}
            title="No institutions match these filters"
            description="Try a different search term or clear the filters."
          />
        }
        columns={[
          {
            key: "name",
            header: "Institution",
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
            key: "status",
            header: "Partnership",
            cell: (row) => <PartnershipBadge status={row.partnershipStatus} />,
          },
          {
            key: "agreements",
            header: "Rows",
            className: "tabular-nums",
            cell: (row) =>
              row.agreementCount === 0 ? (
                <span className="text-fg-faint">—</span>
              ) : row.activeAgreementCount > 0 ? (
                <span>
                  {row.activeAgreementCount} active
                  <span className="text-fg-faint"> / {row.agreementCount}</span>
                </span>
              ) : (
                <span>{row.agreementCount}</span>
              ),
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
                label: "Rows",
                value: row.agreementCount
                  ? row.activeAgreementCount
                    ? `${row.activeAgreementCount} active / ${row.agreementCount}`
                    : String(row.agreementCount)
                  : "—",
              },
              { label: "Next expiry", value: formatDate(row.nextExpiry, "—") },
            ]}
          />
        )}
      />
    </div>
  );
}
