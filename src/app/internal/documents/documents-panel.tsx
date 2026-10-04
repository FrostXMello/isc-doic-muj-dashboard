import {
  BookOpen,
  ClipboardList,
  FileBarChart,
  FileSignature,
  FileText,
  Newspaper,
  Scale,
  SearchX,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { DocumentStatusBadge } from "@/components/internal/badges";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { FilterBar } from "@/components/internal/ui/filter-bar";
import {
  PlaceholderAction,
  unavailableReasons,
} from "@/components/internal/ui/placeholder-action";
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
import { readEnumParam, readParam, type SearchParamsRecord } from "@/lib/internal/query";
import { documentStatusMeta, documentTypeLabel, optionsFrom } from "@/lib/internal/status";
import type { DocumentView } from "@/lib/internal/types";

const linkFilterLabel: Record<DocumentLinkFilter, string> = {
  institution: "Linked to a university",
  agreement: "Linked to an agreement",
  program: "Linked to a programme",
  availability: "Linked to an offering",
  unlinked: "Not linked",
};

const typeIcon: Record<DocumentView["type"], LucideIcon> = {
  agreement: FileSignature,
  brochure: BookOpen,
  "programme-guide": BookOpen,
  policy: Scale,
  report: FileBarChart,
  form: ClipboardList,
  newsletter: Newspaper,
  other: FileText,
};

function TypeMark({ type }: { type: DocumentView["type"] }) {
  const Icon = typeIcon[type];
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muj/[0.1] text-muj-fg transition-transform group-hover:-rotate-3 motion-reduce:transition-none"
      aria-hidden
    >
      <Icon className="size-4" />
    </span>
  );
}

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

/** Document list; `reportsOnly` limits it to report documents for the Reports tab. */
export async function DocumentsPanel({
  params,
  reportsOnly = false,
}: {
  params: SearchParamsRecord;
  reportsOnly?: boolean;
}) {
  const fixedType = reportsOnly ? ("report" as const) : undefined;
  const [rows, all, mode] = await Promise.all([
    listDocuments({
      q: readParam(params, "q"),
      type: fixedType ?? readEnumParam(params, "type", documentTypes),
      status: readEnumParam(params, "status", documentStatuses),
      linked: readEnumParam(params, "linked", documentLinkFilters),
    }),
    listDocuments({ type: fixedType }),
    getDataMode(),
  ]);

  if (reportsOnly && all.length === 0) {
    return (
      <div className="portal-surface">
      <EmptyState
        icon={FileBarChart}
        title="No reports have been added yet"
        description={
          <>
            Documents of type <em>Report</em> will be listed here. Live figures and charts are on
            the <Link href="/internal" className="text-muj-fg underline-offset-4 hover:underline">Dashboard</Link>.
          </>
        }
      />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reportsOnly ? (
        <p className="text-[13px] text-muted-foreground">
          Report documents. Live figures and charts are on the{" "}
          <Link href="/internal" className="text-muj-fg underline-offset-4 hover:underline">Dashboard</Link>.
        </p>
      ) : (
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
      )}

      <FilterBar
        searchPlaceholder={reportsOnly ? "Search report title" : "Search title or linked record"}
        noun={reportsOnly ? { singular: "report", plural: "reports" } : { singular: "document", plural: "documents" }}
        resultCount={rows.length}
        totalCount={all.length}
        selects={[
          ...(reportsOnly
            ? []
            : [
                {
                  name: "type",
                  label: "Type",
                  allLabel: "All types",
                  options: optionsFrom(documentTypes, documentTypeLabel),
                },
              ]),
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
              <span className="flex items-start gap-3">
                <TypeMark type={row.type} />
                <span className="flex min-w-0 flex-col items-start gap-1">
                  <span className="font-medium">{row.title}</span>
                  <SourceBadge source={row.source} />
                </span>
              </span>
            ),
          },
          {
            key: "type",
            header: "Type",
            cell: (row) => (
              <span className="text-[12px] font-medium tracking-[0.08em] text-fg-subtle uppercase">
                {documentTypeLabel[row.type]}
              </span>
            ),
          },
          { key: "related", header: "Related to", cell: (row) => <LinkSummary doc={row} /> },
          { key: "status", header: "Status", cell: (row) => <DocumentStatusBadge status={row.status} /> },
          {
            key: "updated",
            header: "Updated",
            className: "whitespace-nowrap",
            cell: (row) =>
              row.updatedOn ? formatDate(row.updatedOn) : <span className="text-fg-faint">Not recorded</span>,
          },
          {
            key: "file",
            header: "File",
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
              { label: "Updated", value: formatDate(row.updatedOn, "Not recorded") },
            ]}
          />
        )}
        renderCardActions={(row) => <FileCell doc={row} />}
      />
    </div>
  );
}
