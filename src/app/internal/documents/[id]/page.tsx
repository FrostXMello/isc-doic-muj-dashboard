import type { Metadata } from "next";
import { FileQuestion, FileText, Link2, Globe } from "lucide-react";
import { notFound } from "next/navigation";
import { DocumentStatusBadge } from "@/components/internal/badges";
import { DetailHeader, DetailSection, KeyValueList, LinkedList } from "@/components/internal/ui/detail";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { NotRecorded } from "@/components/internal/ui/page-header";
import {
  PlaceholderAction,
  unavailableReasons,
} from "@/components/internal/ui/placeholder-action";
import { provenanceItems, SourceLink, VerificationBadge } from "@/components/internal/ui/provenance";
import { SourceBadge } from "@/components/internal/ui/source-badge";
import { getDocument } from "@/lib/internal/data/documents";
import { formatDate } from "@/lib/internal/dates";
import type { IdParamsProp } from "@/lib/internal/query";
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

export default async function DocumentDetailPage({ params }: IdParamsProp) {
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
            <VerificationBadge status={doc.verification} />
          </>
        }
        actions={
          <>
            <PlaceholderAction
              label="Upload internal copy"
              icon="upload"
              variant="primary"
              reason={unavailableReasons.storage}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DetailSection title="Document details" icon={FileText}>
            <KeyValueList
              items={[
                { label: "Type", value: documentTypeLabel[doc.type] },
                { label: "Status", value: <DocumentStatusBadge status={doc.status} /> },
                { label: "Last updated", value: formatDate(doc.updatedOn) },
                {
                  label: "Official link",
                  wide: true,
                  value: doc.url ? <SourceLink url={doc.url} title={doc.url} /> : <NotRecorded />,
                },
                {
                  label: "Publicly accessible",
                  value: doc.url
                    ? doc.publiclyAccessible
                      ? "Yes — opened without signing in"
                      : "No — requires sign-in or did not open"
                    : "—",
                },
                { label: "Storage", value: doc.storageKey ?? <NotRecorded>No file stored</NotRecorded> },
                { label: "Description", wide: true, value: doc.description ?? <NotRecorded /> },
              ]}
            />
          </DetailSection>

          <DetailSection title="Provenance" icon={Globe}>
            <KeyValueList items={provenanceItems(doc)} />
          </DetailSection>

          {!doc.url && (
            <DetailSection title="File preview">
              <EmptyState
                icon={FileQuestion}
                title="No file available"
                description="File storage is not connected, so there is nothing to preview. The record holds metadata only."
              />
            </DetailSection>
          )}
        </div>

        <DetailSection
          title="Attached to"
          icon={Link2}
          description="A document can be linked to several records; each link targets exactly one."
        >
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
