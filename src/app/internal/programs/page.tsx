import type { Metadata } from "next";
import { PageHeader } from "@/components/internal/ui/page-header";
import { unavailableReasons } from "@/components/internal/ui/placeholder-action";
import { RecordAction } from "@/components/internal/ui/record-action";
import { SectionTabs } from "@/components/internal/ui/section-tabs";
import { resolveTab } from "@/lib/internal-nav";
import { readEnumParam, readParam, type SearchParamsProp } from "@/lib/internal/query";
import { programAudiences } from "@/lib/internal/status";
import { OpportunitiesPanel } from "./opportunities-panel";
import { ProgramsPanel } from "./programs-panel";

const SECTION = "/internal/programs";

export async function generateMetadata({ searchParams }: SearchParamsProp): Promise<Metadata> {
  const tab = resolveTab(SECTION, readParam(await searchParams, "tab"));
  return { title: tab?.value === "opportunities" ? "Opportunities" : "Programs" };
}

export default async function ProgramsPage({ searchParams }: SearchParamsProp) {
  const params = await searchParams;
  const tab = resolveTab(SECTION, readParam(params, "tab"))?.value ?? "programs";
  return (
    <div className="space-y-6">
      <PageHeader
        title="Programs"
        description="Programmes for students and faculty, and the opportunities (application calls) published under them."
        actions={
          tab === "opportunities" ? (
            <RecordAction
              permission="opportunities:create"
              label="New call"
              icon="add"
              variant="primary"
              reason={unavailableReasons.editing}
            />
          ) : (
            <RecordAction
              permission="programs:create"
              label="New offering"
              icon="add"
              variant="primary"
              reason={unavailableReasons.editing}
            />
          )
        }
      />

      <SectionTabs
        section={SECTION}
        current={tab}
        keep={{ audience: readEnumParam(params, "audience", programAudiences) }}
      />

      <div key={tab} data-tab-panel={tab}>
        {tab === "opportunities" ? <OpportunitiesPanel params={params} /> : <ProgramsPanel params={params} />}
      </div>
    </div>
  );
}
