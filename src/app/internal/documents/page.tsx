import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { DocumentStatusBadge } from "@/components/internal/badges";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { FilterBar } from "@/components/internal/ui/filter-bar";
import { PageHeader } from "@/components/internal/ui/page-header";
import {
  PlaceholderAction,
  unavailableReasons,
} from "@/components/internal/ui/placeholder-action";
import { RecordAction } from "@/components/internal/ui/record-action";
import { ResourceCard, ResourceTable } from "@/components/internal/ui/resource-table";
import { SourceLink } from "@/components/internal/ui/provenance";
import { DataNotice, SourceBadge } from "@/components/internal/ui/source-badge";
import { getDataMode } from "@/lib/internal/data/context";
import {
  documentLinkFilters,
  documentStatuses,
  documentTypes,
  listDocuments,
  type DocumentLinkFilter,
} from "@/lib/internal/data/documents";
import { formatDate } from "@/lib/internal/dates";
import { readEnumParam, readParam, type SearchParamsProp } from "@/lib/internal/query";
import { documentStatusMeta, documentTypeLabel, optionsFrom } from "@/lib/internal/status";
import type { DocumentView } from "@/lib/internal/types";

export const metadata: Metadata = { title: "Documents" };

const linkFilterLabel: Record<DocumentLinkFilter, string> = {
  institution: "Linked to a university",
  agreement: "Linked to an agreement",
  program: "Linked to a programme",
  availability: "Linked to an offering",
  unlinked: "Not linked",
};

function FileCell({ doc }: { doc: DocumentView }) {
  if (doc.url) {
    return (
      <span className="flex flex-col items-start gap-0.5 text-[12px]">
        <SourceLink url={doc.url} title="Official link" />
        {!doc.publiclyAccessible && <span className="text-warning-fg">Not publicly accessible</span>}
      </span>
    );
  }
  return (
    <PlaceholderAction label="View" icon="view" size="sm" reason={unavailableReasons.storage} />
  );
}

function LinkSummary({ doc }: { doc: DocumentView }) {
  if (doc.links.length === 0) return <span className="text-fg-faint">Not linked</span>;
  const [first, ...rest] = doc.links;
  return (
    <span className="text-[12px]">
      {first.label}
      {rest.length > 0 && <span className="text-fg-faint"> +{rest.length} more</span>}
    </span>
  );
}

export default async function DocumentsPage({ searchParams }: SearchParamsProp) {
  const params = await searchParams;

  const [rows, all, mode] = await Promise.all([
    listDocuments({
      q: readParam(params, "q"),
      type: readEnumParam(params, "type", documentTypes),
      status: readEnumParam(params, "status", documentStatuses),
      linked: readEnumParam(params, "linked", documentLinkFilters),
    }),
    listDocuments(),
    getDataMode(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Official DoIC documents published on MUJ's pages, linked at their official URLs. File storage for internal copies is not connected yet."
        actions={
          <RecordAction
            permission="documents:upload"
            label="Upload document"
            icon="upload"
            variant="primary"
            reason={unavailableReasons.storage}
          />
        }
      />

      <DataNotice>
        Official documents link to the file on jaipur.manipal.edu; the link was checked on the
        source review date, and rows marked <em>Not publicly accessible</em> did not open without
        signing in (or returned an error). No copies are stored here.
        {mode.sampleData ? (
          <>
            {" "}
            <strong className="font-medium">Sample</strong> document rows have no file and are
            shown because INTERNAL_SAMPLE_DATA is on.
          </>
        ) : null}
      </DataNotice>

      <FilterBar
        searchPlaceholder="Search title or linked record"
        noun={{ singular: "document", plural: "documents" }}
        resultCount={rows.length}
        totalCount={all.length}
        selects={[
          {
            name: "type",
            label: "Type",
            allLabel: "All types",
            options: optionsFrom(documentTypes, documentTypeLabel),
          },
          {
            name: "status",
            label: "Status",
            allLabel: "All statuses",
            options: optionsFrom(documentStatuses, documentStatusMeta),
          },
          {
            name: "linked",
            label: "Related to",
            allLabel: "Any relation",
            options: optionsFrom(documentLinkFilters, linkFilterLabel),
          },
        ]}
      />

      <ResourceTable<DocumentView>
        caption="Documents"
        rows={rows}
        getKey={(row) => row.id}
        getHref={(row) => `/internal/documents/${row.id}`}
        getRowLabel={(row) => row.title}
        empty={
          <EmptyState
            icon={SearchX}
            title="No documents match these filters"
            description="Try a different search term or clear the filters."
          />
        }
        columns={[
          {
            key: "title",
            header: "Document",
            cell: (row) => (
              <span className="flex flex-col items-start gap-1">
                <span className="font-medium">{row.title}</span>
                <SourceBadge source={row.source} />
              </span>
            ),
          },
          { key: "type", header: "Type", cell: (row) => documentTypeLabel[row.type] },
          { key: "related", header: "Related to", cell: (row) => <LinkSummary doc={row} /> },
          { key: "status", header: "Status", cell: (row) => <DocumentStatusBadge status={row.status} /> },
          {
            key: "updated",
            header: "Updated",
            className: "whitespace-nowrap",
            cell: (row) => formatDate(row.updatedOn, "—"),
          },
          {
            key: "file",
            header: "File",
            interactive: true,
            cell: (row) => <FileCell doc={row} />,
          },
        ]}
        renderCard={(row) => (
          <ResourceCard
            title={row.title}
            subtitle={documentTypeLabel[row.type]}
            badges={<DocumentStatusBadge status={row.status} />}
            meta={[
              { label: "Related to", value: <LinkSummary doc={row} /> },
              { label: "Updated", value: formatDate(row.updatedOn, "—") },
              { label: "File", value: <FileCell doc={row} /> },
            ]}
          />
        )}
      />
    </div>
  );
}
