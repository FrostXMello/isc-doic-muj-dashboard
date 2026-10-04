import { CheckCircle2, LoaderCircle, TriangleAlert } from "lucide-react";
import type { RecordFormState } from "@/lib/internal/record-forms";
import { cn } from "@/lib/utils";

export const inputClass =
  "mt-1 w-full rounded-lg border bg-card px-3 text-[13px] text-foreground placeholder:text-fg-faint focus:border-cyan/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/30 aria-[invalid=true]:border-danger-fg/60";
export const labelClass = "block text-[12px] text-fg-soft";

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
    className: cn(inputClass, "border-line", className),
  } as const;
}

export function FormStatus({ state }: { state: RecordFormState }) {
  if (!state.error) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-danger-fg/30 bg-danger-fg/5 px-3 py-2 text-[13px] text-danger-fg"
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
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-cyan/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        tone === "primary"
          ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
          : "border-danger-fg/40 text-danger-fg hover:bg-danger-fg/10",
      )}
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
      className="flex items-start gap-2 rounded-lg border border-success-fg/30 bg-success-fg/5 px-4 py-3 text-[13px] text-success-fg"
    >
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}
