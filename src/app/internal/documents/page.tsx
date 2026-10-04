import type { Metadata } from "next";
import { PageHeader } from "@/components/internal/ui/page-header";
import { PlaceholderAction, unavailableReasons } from "@/components/internal/ui/placeholder-action";
import { RecordAction } from "@/components/internal/ui/record-action";
import { SectionTabs } from "@/components/internal/ui/section-tabs";
import { resolveTab } from "@/lib/internal-nav";
import { listDocuments } from "@/lib/internal/data/documents";
import { readParam, type SearchParamsProp } from "@/lib/internal/query";
import { DocumentsPanel } from "./documents-panel";
import { ReportsPanel } from "./reports-panel";

const SECTION = "/internal/documents";

export async function generateMetadata({ searchParams }: SearchParamsProp): Promise<Metadata> {
  const tab = resolveTab(SECTION, readParam(await searchParams, "tab"));
  return { title: tab?.value === "reports" ? "Reports" : "Documents" };
}

export default async function DocumentsPage({ searchParams }: SearchParamsProp) {
  const params = await searchParams;
  const tab = resolveTab(SECTION, readParam(params, "tab"))?.value ?? "documents";
  const documents = await listDocuments();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description={
          tab === "reports"
            ? "Reports: an operational overview computed from the portal's data layer."
            : "Official DoIC documents published on MUJ's pages, linked at their official URLs. File storage for internal copies is not connected yet."
        }
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

      <SectionTabs section={SECTION} current={tab} counts={{ documents: documents.length }} />

      <div key={tab} data-tab-panel={tab}>
        {tab === "reports" ? <ReportsPanel /> : <DocumentsPanel params={params} />}
      </div>
    </div>
  );
}
