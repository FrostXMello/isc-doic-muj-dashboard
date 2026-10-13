import type { Metadata } from "next";
import { FileText, Upload } from "lucide-react";
import { notFound } from "next/navigation";
import { DocumentFileUpload } from "@/components/internal/forms/document-file-upload";
import { RecordForm } from "@/components/internal/forms/record-form";
import { documentGroups } from "@/components/internal/forms/specs";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { canManage, ReadOnlySourceNotice, requireManage } from "@/components/internal/ui/manage-action";
import { ArchiveSection, DeleteSection } from "@/components/internal/ui/manage-sections";
import { deleteDocument, saveDocument } from "@/lib/internal/content-actions";
import { listEditOptions, loadDocumentForEdit } from "@/lib/internal/data/editable";
import type { IdParamsProp } from "@/lib/internal/query";

export const metadata: Metadata = { title: "Edit document" };

export default async function EditDocumentPage({ params }: IdParamsProp) {
  const access = await requireManage("documents:update");
  const { id } = await params;
  const backHref = `/internal/documents/${id}`;
  if (access === "static") {
    return (
      <div className="space-y-6">
        <DetailHeader backHref={backHref} backLabel="Document" title="Edit document" />
        <ReadOnlySourceNotice />
      </div>
    );
  }
  const doc = await loadDocumentForEdit(id);
  if (!doc) notFound();
  const linked = (pick: (link: EditableLink) => string | undefined) => doc.links.map(pick).find(Boolean);

  return (
    <div className="space-y-6">
      <DetailHeader backHref={backHref} backLabel={doc.title} title="Edit document" subtitle={doc.title} />
      <DetailSection title="Document" icon={FileText}>
        <RecordForm
          action={saveDocument}
          groups={documentGroups(await listEditOptions())}
          hidden={{ existing: doc.code }}
          initial={{
            title: doc.title,
            type: doc.document_type,
            status: doc.status,
            revisedOn: doc.revised_on,
            description: doc.description,
            externalUrl: doc.external_url,
            publiclyAccessible: doc.publicly_accessible,
            linkInstitution: linked((link) => link.institution?.slug),
            linkAgreement: linked((link) => link.agreement?.code),
            linkProgram: linked((link) => link.program?.program_type),
            verification: doc.verification,
            sourceUrl: doc.source_url,
          }}
          submitLabel="Save document"
          cancelHref={backHref}
        />
      </DetailSection>
      {(await canManage("documents:upload")) ? (
        <DetailSection
          title="File"
          icon={Upload}
          description={doc.storage_path ? `Stored: ${doc.storage_path.split("/").pop()}` : "No file stored yet."}
        >
          <DocumentFileUpload documentId={doc.id} code={doc.code} hasFile={Boolean(doc.storage_path)} />
        </DetailSection>
      ) : null}
      <ArchiveSection
        resource="documents"
        kind="document"
        recordKey={doc.code}
        archived={doc.status === "archived"}
        noun="document"
        archivedMeans="archived; restoring returns it as a draft"
      />
      <DeleteSection
        resource="documents"
        action={deleteDocument}
        recordKey={doc.code}
        noun="document"
        name={`${doc.title} and its stored files`}
        description="Removes the record, its links, and every stored version of its file."
      />
    </div>
  );
}

type EditableLink = NonNullable<Awaited<ReturnType<typeof loadDocumentForEdit>>>["links"][number];
