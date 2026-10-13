import "server-only";
import { Archive, Trash2 } from "lucide-react";
import { ArchiveRecordForm } from "@/components/internal/forms/archive-record-form";
import { DeleteRecordForm } from "@/components/internal/forms/delete-record-form";
import { DetailSection } from "@/components/internal/ui/detail";
import { canManage } from "@/components/internal/ui/manage-action";
import type { ContentResource } from "@/lib/internal/permissions";
import type { RecordFormState } from "@/lib/internal/record-forms";

/** Reversible archive/restore, for roles with `<resource>:archive`. */
export async function ArchiveSection({
  resource,
  kind,
  recordKey,
  archived,
  noun,
  archivedMeans,
}: {
  resource: ContentResource;
  kind: "opportunity" | "document" | "activity" | "offering" | "programme";
  recordKey: string;
  archived: boolean;
  noun: string;
  archivedMeans: string;
}) {
  if (!(await canManage(`${resource}:archive`))) return null;
  return (
    <DetailSection
      title={archived ? `Restore ${noun}` : `Archive ${noun}`}
      icon={Archive}
      description={archived ? `This ${noun} is archived (${archivedMeans}).` : `Archiving marks it ${archivedMeans}. Links and history are kept, and it can be restored.`}
    >
      <ArchiveRecordForm
        kind={kind}
        recordKey={recordKey}
        archived={archived}
        archiveLabel={`Archive ${noun}`}
        restoreLabel={`Restore ${noun}`}
      />
    </DetailSection>
  );
}

/** Permanent delete behind a confirmation, for roles with `<resource>:delete`. */
export async function DeleteSection({
  resource,
  action,
  recordKey,
  noun,
  name,
  description,
}: {
  resource: ContentResource;
  action: (state: RecordFormState, formData: FormData) => Promise<RecordFormState>;
  recordKey: string;
  noun: string;
  name: string;
  description: string;
}) {
  if (!(await canManage(`${resource}:delete`))) return null;
  return (
    <DetailSection title={`Delete ${noun}`} icon={Trash2} description={description}>
      <DeleteRecordForm
        action={action}
        fields={{ existing: recordKey }}
        label={`Delete ${noun}`}
        confirmLabel={`I understand that ${name} will be permanently deleted.`}
      />
    </DetailSection>
  );
}
