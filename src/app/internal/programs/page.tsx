import type { Metadata } from "next";
import { PageHeader } from "@/components/internal/ui/page-header";
import { ManageLink } from "@/components/internal/ui/manage-action";
import { RecordNotice } from "@/components/internal/ui/record-notice";
import type { SearchParamsProp } from "@/lib/internal/query";
import { ProgramsPanel } from "./programs-panel";

export const metadata: Metadata = { title: "Collaborative Programs" };

export default async function ProgramsPage({ searchParams }: SearchParamsProp) {
  const params = await searchParams;
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Mobility & exchange"
        title="Collaborative Programs"
        description="Programmes for students and faculty, and where each is offered."
        actions={
          <>
            <ManageLink permission="programs:create" href="/internal/programs/new?type=programme" label="New programme" icon="add" />
            <ManageLink permission="programs:create" href="/internal/programs/new" label="New offering" icon="add" variant="primary" />
          </>
        }
      />

      <RecordNotice query={params} />
      <ProgramsPanel params={params} />
    </div>
  );
}
