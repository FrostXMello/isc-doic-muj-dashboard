"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useId } from "react";
import { FormStatus, SubmitButton } from "@/components/internal/forms/form-fields";
import type { RecordFormState } from "@/lib/internal/record-forms";

/** Confirmed delete for DoIC admins. The server action and RLS re-check the role. */
export function DeleteRecordForm({
  action,
  fields,
  label,
  confirmLabel,
}: {
  action: (state: RecordFormState, formData: FormData) => Promise<RecordFormState>;
  fields: Record<string, string>;
  label: string;
  confirmLabel: string;
}) {
  const [state, formAction, pending] = useActionState<RecordFormState, FormData>(action, {});
  const id = useId();

  return (
    <form action={formAction} className="space-y-3 px-6 pt-1 pb-6" aria-busy={pending}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <FormStatus state={state} />
      <label htmlFor={`${id}-confirm`} className="flex items-start gap-2 text-[13px] text-fg-soft">
        <input id={`${id}-confirm`} type="checkbox" name="confirm" required className="mt-0.5 size-4 rounded accent-[var(--danger)]" />
        {confirmLabel}
      </label>
      <SubmitButton pending={pending} tone="danger">
        <Trash2 className="size-3.5" aria-hidden />
        {label}
      </SubmitButton>
    </form>
  );
}
