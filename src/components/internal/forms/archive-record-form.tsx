"use client";

import { Archive, ArchiveRestore } from "lucide-react";
import { useActionState } from "react";
import { FormStatus, SubmitButton } from "@/components/internal/forms/form-fields";
import { archiveRecord } from "@/lib/internal/content-actions";
import type { RecordFormState } from "@/lib/internal/record-forms";

/** Archive or restore a record: the reversible alternative to deleting it. */
export function ArchiveRecordForm({
  kind,
  recordKey,
  archived,
  archiveLabel,
  restoreLabel,
}: {
  kind: "opportunity" | "document" | "activity" | "offering" | "programme";
  recordKey: string;
  archived: boolean;
  archiveLabel: string;
  restoreLabel: string;
}) {
  const [state, action, pending] = useActionState<RecordFormState, FormData>(archiveRecord, {});
  return (
    <form action={action} className="space-y-3 px-6 pt-1 pb-6" aria-busy={pending}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="existing" value={recordKey} />
      <input type="hidden" name="intent" value={archived ? "restore" : "archive"} />
      <FormStatus state={state} />
      <SubmitButton pending={pending}>
        {archived ? <ArchiveRestore className="size-3.5" aria-hidden /> : <Archive className="size-3.5" aria-hidden />}
        {archived ? restoreLabel : archiveLabel}
      </SubmitButton>
    </form>
  );
}
