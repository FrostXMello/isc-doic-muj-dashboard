"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import {
  describedBy,
  Field,
  FormStatus,
  SubmitButton,
  valueOf,
} from "@/components/internal/forms/form-fields";
import { checkboxClass } from "@/components/internal/ui/button-styles";
import type { RecordFormState } from "@/lib/internal/record-forms";
import { cn } from "@/lib/utils";

export type FieldOption = { value: string; label: string };

type Common = { name: string; label: string; hint?: string; wide?: boolean };

export type FieldSpec =
  | (Common & {
      kind: "text" | "url" | "date" | "number" | "email";
      required?: boolean;
      maxLength?: number;
      min?: number;
      max?: number;
      placeholder?: string;
    })
  | (Common & { kind: "textarea"; rows?: number; maxLength?: number; required?: boolean })
  | (Common & { kind: "select"; options: readonly FieldOption[]; placeholder?: string; required?: boolean })
  | (Common & { kind: "checkbox" });

export type FieldGroup = { title?: string; fields: readonly FieldSpec[] };

/**
 * Create/edit form for one record, described by field specs. The server
 * action validates everything again and row level security decides the
 * write; submitted values are echoed back so nothing is lost on an error.
 */
export function RecordForm({
  action,
  groups,
  initial,
  hidden,
  submitLabel,
  cancelHref,
}: {
  action: (state: RecordFormState, formData: FormData) => Promise<RecordFormState>;
  groups: readonly FieldGroup[];
  initial: Readonly<Record<string, string | boolean | number | null | undefined>>;
  hidden?: Readonly<Record<string, string>>;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState<RecordFormState, FormData>(action, {});
  const id = useId();
  const errors = state.fieldErrors ?? {};
  const fieldId = (name: string) => `${id}-${name}`;

  const textValue = (name: string) => {
    const stored = initial[name];
    return valueOf(state, name, stored === null || stored === undefined || typeof stored === "boolean" ? null : String(stored));
  };
  const checked = (name: string) => (state.values ? state.values[name] === "on" : initial[name] === true);

  function control(spec: FieldSpec) {
    const fid = fieldId(spec.name);
    const error = errors[spec.name];
    switch (spec.kind) {
      case "checkbox":
        return (
          <div key={spec.name} className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-[13px] text-foreground">
              <input type="checkbox" name={spec.name} defaultChecked={checked(spec.name)} className={checkboxClass} />
              {spec.label}
            </label>
            {spec.hint ? <p className="mt-1 text-[12px] text-fg-faint">{spec.hint}</p> : null}
          </div>
        );
      case "textarea":
        return (
          <Field key={spec.name} id={fid} label={spec.label} error={error} hint={spec.hint} className="sm:col-span-2">
            <textarea
              {...describedBy(fid, error, Boolean(spec.hint), "py-2")}
              name={spec.name}
              rows={spec.rows ?? 3}
              maxLength={spec.maxLength}
              required={spec.required}
              defaultValue={textValue(spec.name)}
            />
          </Field>
        );
      case "select":
        return (
          <Field key={spec.name} id={fid} label={spec.label} error={error} hint={spec.hint} className={cn(spec.wide && "sm:col-span-2")}>
            <select
              {...describedBy(fid, error, Boolean(spec.hint), "h-9")}
              name={spec.name}
              required={spec.required}
              defaultValue={textValue(spec.name)}
            >
              {spec.placeholder !== undefined ? <option value="">{spec.placeholder}</option> : null}
              {spec.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        );
      default:
        return (
          <Field key={spec.name} id={fid} label={spec.label} error={error} hint={spec.hint} className={cn(spec.wide && "sm:col-span-2")}>
            <input
              {...describedBy(fid, error, Boolean(spec.hint), "h-9")}
              name={spec.name}
              type={spec.kind}
              inputMode={spec.kind === "url" ? "url" : spec.kind === "number" ? "numeric" : undefined}
              required={spec.required}
              maxLength={spec.maxLength}
              min={spec.min}
              max={spec.max}
              placeholder={spec.placeholder ?? (spec.kind === "url" ? "https://" : undefined)}
              defaultValue={textValue(spec.name)}
            />
          </Field>
        );
    }
  }

  return (
    <form action={formAction} className="space-y-6 px-4 sm:px-6 pt-2 pb-6" aria-busy={pending} noValidate>
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <FormStatus state={state} />

      {groups.map((group, index) => (
        <fieldset key={group.title ?? index} className="space-y-4">
          {group.title ? (
            <legend className="text-[11px] font-medium tracking-[0.14em] text-fg-faint uppercase">{group.title}</legend>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">{group.fields.map(control)}</div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
        <Link href={cancelHref} className="inline-flex min-h-10 items-center justify-center px-3 text-[13px] text-fg-subtle hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}
