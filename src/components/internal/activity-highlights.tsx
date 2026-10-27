"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type Highlight = { id: string; title: string; kind: string; when: string; place: string };

const INTERVAL_MS = 4500;

/** Recent activities in the dashboard hero, one at a time; pauses on hover or focus. */
export function ActivityHighlights({ items }: { items: readonly Highlight[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % items.length), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, items.length]);

  const item = items[index % Math.max(items.length, 1)];

  return (
    <div
      className="flex h-full min-h-[8.5rem] flex-col rounded-2xl border border-(--hero-line) bg-(--hero-line) p-4 backdrop-blur-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <p className="flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-(--hero-soft) uppercase">
        <span aria-hidden className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-(--muj) opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-(--muj)" />
        </span>
        Recent highlights
      </p>

      {item ? (
        <Link
          key={item.id}
          href={`/internal/activities/${item.id}`}
          aria-live="polite"
          className="dash-rise group mt-3 block min-w-0 flex-1 focus-visible:outline-(--hero-focus)"
        >
          <span className="block text-[11px] text-(--hero-soft)">
            {item.kind} · {item.when}
          </span>
          <span className="mt-1 line-clamp-2 text-[14px] leading-snug font-medium text-(--hero-fg)">{item.title}</span>
          <span className="mt-1 flex items-center gap-1 truncate text-[12px] text-(--hero-muted) group-hover:text-(--hero-fg)">
            <span className="truncate">{item.place}</span>
            <ArrowUpRight aria-hidden className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
        </Link>
      ) : (
        <p className="mt-3 flex-1 text-[13px] text-(--hero-muted)">No activities recorded yet.</p>
      )}

      {items.length > 1 ? (
        <div className="mt-3 flex gap-1.5" role="tablist" aria-label="Highlights">
          {items.map((entry, i) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={entry.title}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                i === index ? "w-5 bg-(--hero-fg)" : "w-2 bg-(--hero-soft)/50 hover:bg-(--hero-soft)",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
