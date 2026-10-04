import { CheckCircle2, LoaderCircle, TriangleAlert } from "lucide-react";
import { buttonClass, inputBaseClass } from "@/components/internal/ui/button-styles";
import type { RecordFormState } from "@/lib/internal/record-forms";
import { cn } from "@/lib/utils";

export const inputClass = cn(inputBaseClass, "mt-1.5 aria-[invalid=true]:border-danger-fg/60");
export const labelClass = "block text-[12px] font-medium tracking-[0.01em] text-fg-soft";

/** The value to show: what was just submitted, else the stored value. */
export function valueOf(state: RecordFormState, name: string, initial: string | null | undefined) {
  const submitted = state.values?.[name];
  if (typeof submitted === "string") return submitted;
  return initial ?? "";
}

export function Field({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[12px] text-danger-fg">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-[12px] text-fg-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Props that connect an input to its Field label, hint, and error. */
export function describedBy(id: string, error?: string, hint = false, className?: string) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
    className: cn(inputClass, className),
  } as const;
}

export function FormStatus({ state }: { state: RecordFormState }) {
  if (!state.error) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2.5 rounded-2xl border-l-2 border-danger bg-danger/[0.06] px-4 py-3 text-[13px] text-danger-fg"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {state.error}
    </p>
  );
}

export function SubmitButton({
  pending,
  children,
  tone = "primary",
}: {
  pending: boolean;
  children: React.ReactNode;
  tone?: "primary" | "danger";
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClass(tone)}
    >
      {pending ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function SuccessNotice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="dash-rise flex items-start gap-2.5 rounded-2xl border-l-2 border-success bg-success/[0.07] px-4 py-3 text-[13px] text-success-fg"
    >
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}
