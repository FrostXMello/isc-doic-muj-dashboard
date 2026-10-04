import type { Metadata } from "next";
import { PageHeader } from "@/components/internal/ui/page-header";
import { unavailableReasons } from "@/components/internal/ui/placeholder-action";
import { RecordAction } from "@/components/internal/ui/record-action";
import { SectionTabs } from "@/components/internal/ui/section-tabs";
import { resolveTab } from "@/lib/internal-nav";
import { listOpportunities } from "@/lib/internal/data/opportunities";
import { listPrograms } from "@/lib/internal/data/programs";
import { DEADLINE_WARNING_DAYS } from "@/lib/internal/dates";
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
  const [programs, opportunities] = await Promise.all([listPrograms(), listOpportunities()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programs"
        description={
          tab === "opportunities"
            ? `Opportunities are the application calls published under a programme; each one belongs to exactly one programme and inherits its audience. Status is derived from opening and deadline dates; calls within ${DEADLINE_WARNING_DAYS} days of the deadline are flagged.`
            : "Programme types from MUJ's official Internationalization pages, grouped by who they are for. Open a programme to see its offerings and opportunities. A programme is not assumed to be available at an institution unless the source names it."
        }
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
        counts={{ programs: programs.length, opportunities: opportunities.length }}
        keep={{ audience: readEnumParam(params, "audience", programAudiences) }}
      />

      <div key={tab} data-tab-panel={tab}>
        {tab === "opportunities" ? <OpportunitiesPanel params={params} /> : <ProgramsPanel params={params} />}
      </div>
    </div>
  );
}
