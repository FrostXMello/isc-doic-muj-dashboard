import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "sm" | "md";

/** Portal button look, shared by links, form buttons, and placeholder actions. */
export const buttonClass = (variant: ButtonVariant = "secondary", size: ButtonSize = "md") =>
  cn(
    "inline-flex items-center justify-center gap-1.5 rounded-full border font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
    size === "sm" ? "h-8 px-3 text-[12px]" : "h-10 px-4 text-[13px]",
    variant === "primary" && "border-transparent bg-muj text-[#1a0d05] shadow-[0_8px_20px_-12px_var(--muj)] hover:brightness-110",
    variant === "secondary" &&
      "border-line-strong bg-transparent text-fg-soft hover:border-muj/60 hover:bg-muj/[0.06] hover:text-foreground",
    variant === "danger" &&
      "border-danger/40 bg-transparent text-danger-fg hover:border-danger hover:bg-danger/10",
  );

export const inputBaseClass =
  "w-full rounded-xl border border-line-strong bg-card px-3.5 text-[13px] text-foreground transition-colors placeholder:text-fg-faint hover:border-line-bold focus:border-muj/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-muj/25";

export const checkboxClass = "size-4 rounded accent-[var(--muj)]";
