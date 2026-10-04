import Link from "next/link";
import { toneStyles } from "@/components/internal/ui/status-badge";
import type { Tone } from "@/lib/internal/status";
import { cn } from "@/lib/utils";

export type Segment = { key: string; label: string; count: number; tone: Tone; href?: string };

/**
 * One horizontal bar split into proportional segments, with a legend that
 * carries the labels and counts (the bar itself is hidden from screen readers).
 */
export function SegmentBar({
  segments,
  label,
  legend = true,
}: {
  segments: readonly Segment[];
  label: string;
  /** Omit the legend when the counts are already shown beside the bar. */
  legend?: boolean;
}) {
  const visible = segments.filter((segment) => segment.count > 0);
  const total = visible.reduce((sum, segment) => sum + segment.count, 0);
  return (
    <figure className="space-y-3">
      <div aria-hidden className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-overlay">
        {visible.map((segment) => (
          <div
            key={segment.key}
            className={cn("h-full first:rounded-l-full last:rounded-r-full", toneStyles[segment.tone].bar)}
            style={{ width: `${(segment.count / total) * 100}%` }}
          />
        ))}
      </div>
      <figcaption className="sr-only">{label}</figcaption>
      {legend && <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12px]">
        {visible.map((segment) => {
          const body = (
            <>
              <span className={cn("size-2 rounded-full", toneStyles[segment.tone].dot)} aria-hidden />
              <span className="text-muted-foreground">{segment.label}</span>
              <span className="text-foreground tabular-nums">{segment.count}</span>
            </>
          );
          return (
            <li key={segment.key}>
              {segment.href ? (
                <Link href={segment.href} className="inline-flex items-center gap-1.5 rounded hover:text-foreground">
                  {body}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5">{body}</span>
              )}
            </li>
          );
        })}
      </ul>}
    </figure>
  );
}
