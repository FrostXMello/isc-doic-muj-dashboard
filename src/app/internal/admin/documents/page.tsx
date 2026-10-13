import type { Metadata } from "next";
import { Download, FolderOpen } from "lucide-react";
import Link from "next/link";
import { DetailSection } from "@/components/internal/ui/detail";
import { buttonClass } from "@/components/internal/ui/button-styles";
import { ManageLink } from "@/components/internal/ui/manage-action";
import { requireAdministration } from "@/lib/internal/admin-access";
import { exportDatasets, exportHref, exportLabels } from "@/lib/internal/csv";
import { openDataContext } from "@/lib/internal/data/context";
import { can } from "@/lib/internal/permissions";

export const metadata: Metadata = { title: "Documents and reports" };

export default async function AdminDocumentsPage() {
  const auth = await requireAdministration("reports:read");
  const { data } = await openDataContext();
  const stored = data.documents.filter((doc) => doc.storageKey).length;
  const reports = data.documents.filter((doc) => doc.type === "report").length;

  return (
    <div className="space-y-6">
      <DetailSection
        title="Documents and reports"
        icon={FolderOpen}
        description={`${data.documents.length} documents, ${reports} of them reports; ${stored} with a stored file. Files sit in a private bucket and open through short-lived signed links.`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/internal/documents" className={buttonClass("secondary", "sm")}>
              Open library
            </Link>
            <ManageLink permission="documents:create" href="/internal/documents/new?type=report" label="New report" icon="add" size="sm" variant="primary" />
          </div>
        }
      >
        <p className="px-6 pb-6 text-[13px] text-fg-subtle">
          Upload, replace, archive, or delete files from each document&apos;s edit page. Allowed: PDF, Word, Excel,
          PowerPoint, text, CSV, PNG, and JPEG, up to 25 MB.
        </p>
      </DetailSection>

      {can(auth.roles, "reports:export") ? (
        <DetailSection
          title="Export data"
          icon={Download}
          description="CSV of the records your role can read. Contact details are never exported."
        >
          <ul className="grid gap-2 px-6 pb-6 sm:grid-cols-2 lg:grid-cols-3">
            {exportDatasets.map((dataset) => (
              <li key={dataset}>
                <a href={exportHref(dataset)} download className={buttonClass("secondary", "sm")}>
                  <Download className="size-3.5" aria-hidden />
                  {exportLabels[dataset]}
                </a>
              </li>
            ))}
          </ul>
        </DetailSection>
      ) : null}
    </div>
  );
}
