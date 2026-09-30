import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { PartnershipBadge } from "@/components/internal/badges";
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
  const options = await getInstitutionFilterOptions();

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
        description="Institutions in the portal directory, with partnership status derived from recorded agreements."
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
        Institutions marked <strong className="font-medium">Public directory</strong> come from
        the public site&apos;s illustrative list and have no agreements recorded.{" "}
        <strong className="font-medium">Sample data</strong> institutions (&ldquo;Example
        &hellip;&rdquo;) are fictional and exist only to demonstrate agreement, programme, and
        activity workflows.
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
            cell: (row) => <span className="font-medium">{row.name}</span>,
          },
          {
            key: "location",
            header: "Location",
            cell: (row) => (
              <span>
                {row.country}
                <span className="block text-[12px] text-[#6b7c96]">{row.region}</span>
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
            header: "Agreements",
            className: "tabular-nums",
            cell: (row) =>
              row.agreementCount === 0 ? (
                <span className="text-[#6b7c96]">—</span>
              ) : (
                <span>
                  {row.activeAgreementCount} active
                  <span className="text-[#6b7c96]"> / {row.agreementCount}</span>
                </span>
              ),
          },
          {
            key: "expiry",
            header: "Next expiry",
            className: "whitespace-nowrap",
            cell: (row) =>
              row.nextExpiry ? formatDate(row.nextExpiry) : <span className="text-[#6b7c96]">—</span>,
          },
          {
            key: "source",
            header: "Source",
            cell: (row) => <SourceBadge source={row.source} />,
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
                label: "Agreements",
                value: row.agreementCount ? `${row.activeAgreementCount} active / ${row.agreementCount}` : "—",
              },
              { label: "Next expiry", value: formatDate(row.nextExpiry, "—") },
            ]}
          />
        )}
      />
    </div>
  );
}
