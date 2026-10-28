import type { Metadata } from "next";
import { Download, FileText, Link2 } from "lucide-react";
import { buttonClass } from "@/components/internal/ui/button-styles";
import { notFound } from "next/navigation";
import { DocumentStatusBadge } from "@/components/internal/badges";
import { DetailHeader, DetailSection, KeyValueList, LinkedList } from "@/components/internal/ui/detail";
import { NotRecorded } from "@/components/internal/ui/page-header";
import { ManageLink } from "@/components/internal/ui/manage-action";
import { SourceLink } from "@/components/internal/ui/provenance";
import { SourceBadge } from "@/components/internal/ui/source-badge";
import { getDocument } from "@/lib/internal/data/documents";
import { formatDate } from "@/lib/internal/dates";
import type { IdParamsProp, SearchParamsProp } from "@/lib/internal/query";
import { RecordNotice } from "@/components/internal/ui/record-notice";
import { documentTypeLabel } from "@/lib/internal/status";
import type { DocumentLinkView } from "@/lib/internal/types";

export async function generateMetadata({ params }: IdParamsProp): Promise<Metadata> {
  const { id } = await params;
  const doc = await getDocument(id);
  return { title: doc?.title ?? "Document not found" };
}

const linkKindLabel: Record<DocumentLinkView["kind"], string> = {
  institution: "University",
  agreement: "Agreement",
  program: "Programme",
  availability: "Programme offering",
};

export default async function DocumentDetailPage({ params, searchParams }: IdParamsProp & SearchParamsProp) {
  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) notFound();

  return (
    <div className="space-y-6">
      <DetailHeader
        backHref="/internal/documents"
        backLabel="All documents"
        eyebrow={documentTypeLabel[doc.type]}
        title={doc.title}
        badges={
          <>
            <DocumentStatusBadge status={doc.status} />
            <SourceBadge source={doc.source} />
          </>
        }
        actions={
          <>
            {doc.storageKey ? (
              <a href={`/internal/documents/${doc.id}/file`} target="_blank" rel="noopener" className={buttonClass("primary")}>
                <Download className="size-3.5" aria-hidden />
                Open file
              </a>
            ) : null}
            <ManageLink permission="documents:update" href={`/internal/documents/${doc.id}/edit`} label={doc.storageKey ? "Edit" : "Edit or upload file"} icon="edit" />
          </>
        }
      />
      <RecordNotice query={await searchParams} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailSection title="Document details" icon={FileText}>
            <KeyValueList
              items={[
                { label: "Type", value: documentTypeLabel[doc.type] },
                { label: "Last updated", value: formatDate(doc.updatedOn) },
                {
                  label: "Official link",
                  wide: true,
                  value: doc.url ? <SourceLink url={doc.url} title={doc.url} /> : <NotRecorded />,
                },
                ...(doc.url && !doc.publiclyAccessible
                  ? [{ label: "Access", value: "Requires sign-in on the official site" }]
                  : []),
                ...(!doc.url && !doc.storageKey ? [{ label: "File", value: "No file uploaded yet" }] : []),
                { label: "Description", wide: true, value: doc.description ?? <NotRecorded /> },
              ]}
            />
          </DetailSection>
        </div>

        <DetailSection title="Attached to" icon={Link2}>
          <LinkedList
            emptyTitle="Not linked to any record"
            emptyDescription="Standalone documents such as policies may have no link."
            items={doc.links.map((link) => ({
              key: link.id,
              href: link.href,
              title: link.label,
              meta: linkKindLabel[link.kind],
            }))}
          />
        </DetailSection>
      </div>
    </div>
  );
}
