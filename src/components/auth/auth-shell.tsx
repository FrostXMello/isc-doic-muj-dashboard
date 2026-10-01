import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const authEyebrow = "Manipal University Jaipur / Directorate of International Collaborations";

/** Centered single-column frame shared by the sign-in and account pages. */
export function AuthShell({
  title,
  lede,
  children,
}: {
  title: string;
  lede: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="px-5 pt-32 pb-24 sm:px-8 sm:pt-36">
      <div className="mx-auto w-full max-w-md">
        <p className="text-[11px] leading-5 font-medium tracking-[0.22em] text-cyan uppercase">
          {authEyebrow}
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.1rem,6vw,2.9rem)] leading-[1.02] font-medium tracking-[-0.04em] text-foreground">
          {title}
        </h1>
        <div className="mt-4 text-[15px] leading-7 text-muted-foreground">{lede}</div>
        <div className="mt-8">{children}</div>
      </div>
    </article>
  );
}

export function FormNotice({
  tone,
  children,
  id,
}: {
  tone: "error" | "info" | "success";
  children: ReactNode;
  id?: string;
}) {
  return (
    <p
      id={id}
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "border px-3.5 py-3 text-[13px] leading-6",
        tone === "error" && "border-danger/40 bg-danger/10 text-danger-fg",
        tone === "info" && "border-line-strong bg-overlay-subtle text-fg-soft",
        tone === "success" && "border-success/40 bg-success/10 text-success-fg",
      )}
    >
      {children}
    </p>
  );
}

export const fieldLabelClass = "block text-[12px] tracking-[0.08em] text-fg-soft uppercase";

export const fieldInputClass =
  "mt-2 h-11 w-full border border-line-strong bg-card px-3.5 text-[15px] text-foreground placeholder:text-fg-faint transition-colors focus:border-cyan/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/30 aria-invalid:border-danger/60";

export const primaryActionClass =
  "inline-flex h-11 w-full items-center justify-center gap-2 border border-primary bg-primary px-4 text-[14px] font-medium tracking-[0.01em] text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-cyan/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryActionClass =
  "inline-flex h-11 w-full items-center justify-center gap-2 border border-line-bold px-4 text-[13px] tracking-[0.04em] text-fg-soft transition-colors hover:border-cyan/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-cyan/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";
