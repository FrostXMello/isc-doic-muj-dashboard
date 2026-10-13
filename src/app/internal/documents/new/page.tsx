import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { RecordForm } from "@/components/internal/forms/record-form";
import { documentGroups } from "@/components/internal/forms/specs";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { ReadOnlySourceNotice, requireManage } from "@/components/internal/ui/manage-action";
import { saveDocument } from "@/lib/internal/content-actions";
import { listEditOptions } from "@/lib/internal/data/editable";
import { readParam, type SearchParamsProp } from "@/lib/internal/query";

export const metadata: Metadata = { title: "New document" };

export default async function NewDocumentPage({ searchParams }: SearchParamsProp) {
  const access = await requireManage("documents:create");
  const query = await searchParams;
  return (
    <div className="space-y-6">
      <DetailHeader
        backHref="/internal/documents"
        backLabel="Documents"
        title="New document"
        subtitle="Record the document first; you can upload its file on the next page."
      />
      {access === "static" ? (
        <ReadOnlySourceNotice />
      ) : (
        <DetailSection title="Document" icon={FileText}>
          <RecordForm
            action={saveDocument}
            groups={documentGroups(await listEditOptions())}
            initial={{
              type: readParam(query, "type") === "report" ? "report" : undefined,
              status: "draft",
              linkInstitution: readParam(query, "institution"),
              linkAgreement: readParam(query, "agreement"),
              linkProgram: readParam(query, "program"),
              verification: "needs-review",
            }}
            submitLabel="Add document"
            cancelHref="/internal/documents"
          />
        </DetailSection>
      )}
    </div>
  );
}
