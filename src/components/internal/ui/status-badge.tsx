import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/internal/status";

export const toneStyles: Record<Tone, { badge: string; dot: string; bar: string }> = {
  positive: {
    badge: "border-[#9fd8b8]/25 bg-[#9fd8b8]/[0.07] text-[#b5e3c9]",
    dot: "bg-[#9fd8b8]",
    bar: "bg-[#9fd8b8]/70",
  },
  warning: {
    badge: "border-[#e9c27d]/30 bg-[#e9c27d]/[0.08] text-[#f0d29c]",
    dot: "bg-[#e9c27d]",
    bar: "bg-[#e9c27d]/70",
  },
  danger: {
    badge: "border-[#f0b4b4]/30 bg-[#f0b4b4]/[0.07] text-[#f3c4c4]",
    dot: "bg-[#f0b4b4]",
    bar: "bg-[#f0b4b4]/70",
  },
  info: {
    badge: "border-[#8eb7ee]/30 bg-[#8eb7ee]/[0.07] text-[#b3cff5]",
    dot: "bg-[#8eb7ee]",
    bar: "bg-[#8eb7ee]/70",
  },
  neutral: {
    badge: "border-white/15 bg-white/[0.04] text-[#c3cedd]",
    dot: "bg-[#a9b6cc]",
    bar: "bg-[#a9b6cc]/60",
  },
  muted: {
    badge: "border-white/10 bg-transparent text-[#8a9ab4]",
    dot: "bg-[#56657d]",
    bar: "bg-[#56657d]",
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
