import Link from "next/link";
import { toneStyles } from "@/components/internal/ui/status-badge";
import type { Tone } from "@/lib/internal/status";
import { cn } from "@/lib/utils";

export type BreakdownRow = {
  key: string;
  label: string;
  count: number;
  tone?: Tone;
  href?: string;
};

/** Horizontal bar summary of counts. Bars are relative to the total of all rows. */
export function Breakdown({
  rows,
  hideZero = false,
  emptyLabel = "No records",
}: {
  rows: readonly BreakdownRow[];
  hideZero?: boolean;
  /** Shown instead of the bars when every row is zero. */
  emptyLabel?: string;
}) {
  const visible = hideZero ? rows.filter((row) => row.count > 0) : rows;
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return <p className="px-5 py-4 text-[13px] text-fg-faint">{emptyLabel}</p>;

  return (
    <ul className="space-y-3 px-5 py-4">
      {visible.map((row) => {
        const percent = total === 0 ? 0 : Math.round((row.count / total) * 100);
        const content = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="truncate text-fg-soft">{row.label}</span>
              <span className="shrink-0 text-foreground tabular-nums">
                {row.count}
                <span className="ml-1.5 text-[11px] text-fg-faint">{percent}%</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-overlay">
              <div
                className={cn("h-full rounded-full", toneStyles[row.tone ?? "info"].bar)}
                style={{ width: `${percent}%` }}
              />
            </div>
          </>
        );
        return (
          <li key={row.key}>
            {row.href ? (
              <Link
                href={row.href}
                className="-mx-2 block rounded-md px-2 py-1 transition-colors hover:bg-overlay-subtle"
              >
                {content}
              </Link>
            ) : (
              <div className="py-1">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
