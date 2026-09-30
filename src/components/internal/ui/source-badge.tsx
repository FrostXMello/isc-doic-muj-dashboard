import { FlaskConical, Info } from "lucide-react";
import { sourceMeta } from "@/lib/internal/status";
import type { RecordSource } from "@/lib/internal/types";
import { cn } from "@/lib/utils";

/** Marks where a record comes from: public directory, programme catalogue, or sample data. */
export function SourceBadge({ source, className }: { source: RecordSource; className?: string }) {
  const meta = sourceMeta[source];
  const sample = source === "sample";
  return (
    <span
      title={meta.description}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] leading-4 tracking-[0.08em] whitespace-nowrap uppercase",
        sample
          ? "border-[#c9a8f0]/25 bg-[#c9a8f0]/[0.06] text-[#d5bdf3]"
          : "border-white/10 text-[#8a9ab4]",
        className,
      )}
    >
      {sample && <FlaskConical className="size-3" aria-hidden />}
      {meta.label}
    </span>
  );
}

/** Page-level notice explaining which records are sample data. */
export function DataNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-[#c9a8f0]/20 bg-[#c9a8f0]/[0.04] px-4 py-3">
      <Info className="mt-0.5 size-4 shrink-0 text-[#d5bdf3]" aria-hidden />
      <p className="text-[13px] leading-relaxed text-[#cdbbe6]">{children}</p>
    </div>
  );
}
