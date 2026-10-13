import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { RecordForm } from "@/components/internal/forms/record-form";
import { opportunityGroups } from "@/components/internal/forms/specs";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { ReadOnlySourceNotice, requireManage } from "@/components/internal/ui/manage-action";
import { saveOpportunity } from "@/lib/internal/content-actions";
import { listEditOptions } from "@/lib/internal/data/editable";
import { readParam, type SearchParamsProp } from "@/lib/internal/query";

export const metadata: Metadata = { title: "New call" };

export default async function NewOpportunityPage({ searchParams }: SearchParamsProp) {
  const access = await requireManage("opportunities:create");
  const query = await searchParams;
  const backHref = "/internal/programs?tab=opportunities";
  return (
    <div className="space-y-6">
      <DetailHeader
        backHref={backHref}
        backLabel="Calls"
        title="New call"
        subtitle="An application window for a programme. Saved as a draft until you publish it."
      />
      {access === "static" ? (
        <ReadOnlySourceNotice />
      ) : (
        <DetailSection title="Call" icon={Compass}>
          <RecordForm
            action={saveOpportunity}
            groups={opportunityGroups(await listEditOptions())}
            initial={{
              program: readParam(query, "program"),
              offering: readParam(query, "offering"),
              institution: readParam(query, "institution"),
              recordStatus: "draft",
              verification: "needs-review",
            }}
            submitLabel="Add call"
            cancelHref={backHref}
          />
        </DetailSection>
      )}
    </div>
  );
}
