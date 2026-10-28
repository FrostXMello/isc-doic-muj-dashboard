import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  Folder,
  Download,
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
import { buttonClass } from "@/components/internal/ui/button-styles";
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
import {
  countryFolders,
  findFolder,
  folderCounts,
  inCountry,
  type DocumentFolder,
} from "@/lib/internal/document-folders";
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
  if (doc.storageKey) {
    return (
      <a href={`/internal/documents/${doc.id}/file`} target="_blank" rel="noopener" className={buttonClass("secondary", "sm")}>
        <Download className="size-3.5" aria-hidden />
        Open file
      </a>
    );
  }
  return <span className="text-[12px] text-fg-faint">No file</span>;
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
  const folder = reportsOnly ? undefined : findFolder(readParam(params, "folder"));
  const fixedType = reportsOnly ? ("report" as const) : folder?.type;
  const q = readParam(params, "q");
  const status = readEnumParam(params, "status", documentStatuses);
  const linked = readEnumParam(params, "linked", documentLinkFilters);
  const type = fixedType ?? readEnumParam(params, "type", documentTypes);
  const [matched, scope, mode] = await Promise.all([
    listDocuments({ q, type, status, linked }),
    listDocuments({ type: fixedType }),
    getDataMode(),
  ]);
  const filtering = Boolean(q || status || linked || (!folder && type));
  const byCountry = folder?.type === "agreement";
  const country = byCountry ? readParam(params, "sub") : undefined;
  const rows = (country ? matched.filter((doc) => inCountry(doc, country)) : matched).sort((a, b) =>
    folder ? a.title.localeCompare(b.title) : 0,
  );
  const all = country ? scope.filter((doc) => inCountry(doc, country)) : scope;
  const view: "folders" | "countries" | "list" = reportsOnly
    ? "list"
    : !folder
      ? filtering
        ? "list"
        : "folders"
      : byCountry && !country && !filtering
        ? "countries"
        : "list";

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
        mode.sampleData ? (
          <DataNotice>
            <strong className="font-medium">Sample</strong> document rows have no file and are shown because INTERNAL_SAMPLE_DATA is on.
          </DataNotice>
        ) : null
      )}

      {folder ? <FolderTrail folder={folder} country={country} /> : null}

      <FilterBar
        searchPlaceholder={
          reportsOnly
            ? "Search report title"
            : folder
              ? `Search ${folder.label.toLowerCase()}`
              : "Search all documents"
        }
        noun={reportsOnly ? { singular: "report", plural: "reports" } : { singular: "document", plural: "documents" }}
        resultCount={rows.length}
        totalCount={all.length}
        selects={[
          ...(reportsOnly || folder
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

      {view === "folders" ? (
        <FolderGrid
          items={folderCounts(all).map((item) => ({
            key: item.type,
            href: `${SECTION}?folder=${item.type}`,
            label: item.label,
            description: item.description,
            count: item.count,
          }))}
        />
      ) : view === "countries" ? (
        <FolderGrid
          items={countryFolders(all).map((item) => ({
            key: item.country,
            href: `${SECTION}?folder=agreement&sub=${encodeURIComponent(item.country)}`,
            label: item.country,
            count: item.count,
          }))}
        />
      ) : (
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
      )}
    </div>
  );
}

const SECTION = "/internal/documents";

function FolderTrail({ folder, country }: { folder: DocumentFolder; country?: string }) {
  const crumbs = [
    { label: "All folders", href: SECTION },
    { label: folder.label, href: country ? `${SECTION}?folder=${folder.type}` : null },
    ...(country ? [{ label: country, href: null }] : []),
  ];
  return (
    <nav aria-label="Folder" className="flex flex-wrap items-center gap-1.5 text-[13px]">
      {crumbs.map((crumb, index) => (
        <span key={crumb.label} className="inline-flex items-center gap-1.5">
          {index > 0 ? <ChevronRight className="size-3.5 text-fg-faint" aria-hidden /> : null}
          {crumb.href ? (
            <Link href={crumb.href} className="text-muted-foreground hover:text-foreground">
              {index === 0 ? <Folder className="mr-1 inline size-3.5 align-[-2px]" aria-hidden /> : null}
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground" aria-current="page">
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

function FolderGrid({
  items,
}: {
  items: { key: string; href: string; label: string; description?: string; count: number }[];
}) {
  if (items.length === 0) {
    return (
      <div className="portal-surface">
        <EmptyState icon={SearchX} title="No documents here yet" />
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            className="group portal-surface flex h-full items-start gap-3 p-4 transition-colors hover:border-muj/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muj/[0.1] text-muj-fg transition-transform group-hover:-rotate-3 motion-reduce:transition-none"
              aria-hidden
            >
              <Folder className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-medium text-foreground group-hover:text-muj-fg">{item.label}</span>
              {item.description ? (
                <span className="mt-0.5 block text-[12px] text-muted-foreground">{item.description}</span>
              ) : null}
              <span className="mt-1 block text-[12px] text-fg-faint tabular-nums">
                {item.count} {item.count === 1 ? "document" : "documents"}
              </span>
            </span>
            <ChevronRight
              className="mt-0.5 size-4 shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5 group-hover:text-muj-fg motion-reduce:transition-none"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
