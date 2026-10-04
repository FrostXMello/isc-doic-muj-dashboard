import type { Metadata } from "next";
import { PageHeader } from "@/components/internal/ui/page-header";
import { PlaceholderAction, unavailableReasons } from "@/components/internal/ui/placeholder-action";
import { RecordAction } from "@/components/internal/ui/record-action";
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
    <div className="space-y-6">
      <PageHeader
        title="Documents & Reports"
        description="Official DoIC documents, linked at their official URLs, and report documents."
        actions={
          tab === "reports" ? (
            <PlaceholderAction label="Export report" icon="download" reason={unavailableReasons.exports} />
          ) : (
            <RecordAction
              permission="documents:upload"
              label="Upload document"
              icon="upload"
              variant="primary"
              reason={unavailableReasons.storage}
            />
          )
        }
      />

      <SectionTabs section={SECTION} current={tab} />

      <div key={tab} data-tab-panel={tab}>
        <DocumentsPanel params={params} reportsOnly={tab === "reports"} />
      </div>
    </div>
  );
}
