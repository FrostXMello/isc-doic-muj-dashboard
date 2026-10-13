import type { Metadata } from "next";
import { BookOpen, ClipboardList } from "lucide-react";
import { RecordForm } from "@/components/internal/forms/record-form";
import { offeringGroups, programGroups } from "@/components/internal/forms/specs";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { ReadOnlySourceNotice, requireManage } from "@/components/internal/ui/manage-action";
import { saveOffering, saveProgram } from "@/lib/internal/content-actions";
import { programTypeOptions } from "@/lib/internal/content-forms";
import { listEditOptions } from "@/lib/internal/data/editable";
import { readParam, type SearchParamsProp } from "@/lib/internal/query";

export const metadata: Metadata = { title: "New offering" };

export default async function NewProgramOrOfferingPage({ searchParams }: SearchParamsProp) {
  const query = await searchParams;
  const programme = readParam(query, "type") === "programme";
  const access = await requireManage("programs:create");
  const header = (
    <DetailHeader
      backHref="/internal/programs"
      backLabel="Programmes"
      title={programme ? "New programme" : "New offering"}
      subtitle={programme ? "A programme type DoIC runs." : "A programme offered with one partner university."}
    />
  );
  if (access === "static") {
    return (
      <div className="space-y-6">
        {header}
        <ReadOnlySourceNotice />
      </div>
    );
  }

  const options = await listEditOptions();
  const program = readParam(query, "program");
  const institution = readParam(query, "institution");

  if (programme) {
    const used = new Set(options.programs.map((row) => row.value));
    const available = programTypeOptions.filter((type) => !used.has(type));
    return (
      <div className="space-y-6">
        {header}
        <DetailSection title="Programme" icon={BookOpen}>
          {available.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Every programme type already has a record"
              description="Edit an existing programme instead. New types need a database change."
            />
          ) : (
            <RecordForm
              action={saveProgram}
              groups={programGroups(true, available)}
              initial={{ isPublished: false, sortOrder: 100, verification: "needs-review" }}
              submitLabel="Add programme"
              cancelHref="/internal/programs"
            />
          )}
        </DetailSection>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {header}
      <DetailSection title="Offering" icon={ClipboardList}>
        <RecordForm
          action={saveOffering}
          groups={offeringGroups(options)}
          initial={{ program, institution, isPublished: false, verification: "needs-review" }}
          submitLabel="Add offering"
          cancelHref="/internal/programs"
        />
      </DetailSection>
    </div>
  );
}
