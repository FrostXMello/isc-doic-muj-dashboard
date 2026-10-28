import type { Metadata } from "next";
import { PageHeader } from "@/components/internal/ui/page-header";
import { Download } from "lucide-react";
import { buttonClass } from "@/components/internal/ui/button-styles";
import { exportHref } from "@/lib/internal/csv";
import { RecordNotice } from "@/components/internal/ui/record-notice";
import { ManageLink } from "@/components/internal/ui/manage-action";
import { SectionTabs } from "@/components/internal/ui/section-tabs";
import { resolveTab } from "@/lib/internal-nav";
import { readParam, type SearchParamsProp } from "@/lib/internal/query";
import { DocumentsPanel } from "./documents-panel";

const SECTION = "/internal/documents";

export async function generateMetadata({ searchParams }: SearchParamsProp): Promise<Metadata> {
  const tab = resolveTab(SECTION, readParam(await searchParams, "tab"));
  return { title: tab?.value === "reports" ? "Reports" : "Documents" };
}

export default async function DocumentsPage({ searchParams }: SearchParamsProp) {
  const params = await searchParams;
  const tab = resolveTab(SECTION, readParam(params, "tab"))?.value ?? "documents";
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Library"
        title="Documents & Reports"
        description="Signed MoUs, policies, forms, newsletters, and reports."
        actions={
          tab === "reports" ? (
            <>
              <a href={exportHref("documents")} download className={buttonClass("secondary")}>
                <Download className="size-3.5" aria-hidden />
                Export CSV
              </a>
              <ManageLink permission="documents:create" href="/internal/documents/new?type=report" label="New report" icon="add" variant="primary" />
            </>
          ) : (
            <ManageLink permission="documents:create" href="/internal/documents/new" label="New document" icon="add" variant="primary" />
          )
        }
      />

      <RecordNotice query={params} />
      <SectionTabs section={SECTION} current={tab} />

      <div key={tab} data-tab-panel={tab}>
        <DocumentsPanel params={params} reportsOnly={tab === "reports"} />
      </div>
    </div>
  );
}
