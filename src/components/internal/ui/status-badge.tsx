import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/internal/status";

export const toneStyles: Record<Tone, { badge: string; dot: string; bar: string }> = {
  positive: {
    badge: "border-success/25 bg-success/[0.07] text-success-fg",
    dot: "bg-success",
    bar: "bg-success/70",
  },
  warning: {
    badge: "border-warning/30 bg-warning/[0.08] text-warning-fg",
    dot: "bg-warning",
    bar: "bg-warning/70",
  },
  danger: {
    badge: "border-danger/30 bg-danger/[0.07] text-danger-fg",
    dot: "bg-danger",
    bar: "bg-danger/70",
  },
  info: {
    badge: "border-glow/30 bg-glow/[0.07] text-glow-fg",
    dot: "bg-glow",
    bar: "bg-glow/70",
  },
  neutral: {
    badge: "border-line-strong bg-overlay text-fg-soft",
    dot: "bg-muted-foreground",
    bar: "bg-muted-foreground/60",
  },
  muted: {
    badge: "border-line bg-transparent text-fg-subtle",
    dot: "bg-fg-dim",
    bar: "bg-fg-dim",
  },
};

export function StatusBadge({
  label,
  tone,
  className,
  title,
}: {
  label: string;
  tone: Tone;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] leading-5 font-medium whitespace-nowrap",
        toneStyles[tone].badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", toneStyles[tone].dot)} aria-hidden />
      {label}
    </span>
  );
}
