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
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] leading-4 font-medium tracking-[0.1em] whitespace-nowrap uppercase",
        sample ? "bg-sample/[0.1] text-sample-fg" : "bg-overlay text-fg-subtle",
        className,
      )}
    >
      {sample && <FlaskConical className="size-3" aria-hidden />}
      {meta.label}
    </span>
  );
}

/** Page-level note about where records come from and what is not recorded. */
export function DataNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="dash-rise flex gap-3 border-l-2 border-muj/70 py-1 pl-4" style={{ animationDelay: "80ms" }}>
      <Info className="mt-0.5 size-4 shrink-0 text-muj-fg" aria-hidden />
      <p className="max-w-4xl text-[13px] leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
