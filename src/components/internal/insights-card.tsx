"use client";

import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { toneStyles } from "@/components/internal/ui/status-badge";
import type { Tone } from "@/lib/internal/status";
import { cn } from "@/lib/utils";

/**
 * A compact, tabbed insights card. Every value is computed on the server from
 * recorded data and passed in; the card only switches views and highlights.
 */

export type InsightStat = { label: string; value: string; hint?: string; href?: string; tone?: Tone };
export type InsightItem = { id: string; title: string; meta: string; href: string; badge?: string; tone?: Tone };
export type InsightBar = { id: string; label: string; meta: string; start: string; end: string | null; href: string; tone: Tone };
export type InsightCount = { label: string; count: number; href?: string };

export type InsightTab = {
  id: string;
  label: string;
  stats?: InsightStat[];
  /** Agreement terms drawn on one shared time axis. */
  timeline?: { bars: InsightBar[]; today: string; undated: InsightItem[] };
  /** Proportional bars, largest first. */
  counts?: InsightCount[];
  /** Featured records, one at a time with previous/next. */
  highlights?: InsightItem[];
  items?: InsightItem[];
  empty?: string;
};

const DAY = 86_400_000;
const time = (iso: string) => new Date(`${iso}T00:00:00Z`).getTime();
const year = (ms: number) => new Date(ms).getUTCFullYear();

function Stats({ stats, compact }: { stats: InsightStat[]; compact?: boolean }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-hairline", !compact && "sm:grid-cols-3")}>
      {stats.map((stat) => {
        const body = (
          <>
            <dt className="text-[10.5px] tracking-[0.08em] text-fg-faint uppercase">{stat.label}</dt>
            <dd
              className={cn(
                "mt-1 flex items-center gap-1.5 leading-tight font-medium text-foreground tabular-nums [overflow-wrap:anywhere]",
                compact ? "text-[14.5px]" : "text-[17px]",
              )}
            >
              {stat.tone ? <span aria-hidden className={cn("size-2 shrink-0 rounded-full", toneStyles[stat.tone].dot)} /> : null}
              {stat.value}
            </dd>
            {stat.hint ? <dd className="mt-0.5 text-[11.5px] text-muted-foreground [overflow-wrap:anywhere]">{stat.hint}</dd> : null}
          </>
        );
        return (
          <div key={stat.label} className="min-w-0 bg-card">
            {stat.href ? (
              <Link href={stat.href} className={cn("block h-full transition-colors hover:bg-overlay", compact ? "px-3 py-2.5" : "px-3.5 py-3")}>
                {body}
              </Link>
            ) : (
              <div className={compact ? "px-3 py-2.5" : "px-3.5 py-3"}>{body}</div>
            )}
          </div>
        );
      })}
    </dl>
  );
}

function Timeline({ bars, today, undated }: NonNullable<InsightTab["timeline"]>) {
  const [active, setActive] = useState<string | null>(null);
  const now = time(today);
  const ends = bars.map((bar) => (bar.end ? time(bar.end) : now + 365 * DAY));
  const min = Math.min(now, ...bars.map((bar) => time(bar.start)));
  const max = Math.max(now, ...ends) + 30 * DAY;
  const pos = (ms: number) => `${((ms - min) / (max - min)) * 100}%`;
  const shown = bars.find((bar) => bar.id === active) ?? null;

  return (
    <div className="space-y-3">
      {bars.length > 0 ? (
        <div className="relative pt-5">
          <div className="absolute top-0 bottom-0 w-px bg-muj/60" style={{ left: pos(now) }} aria-hidden>
            <span className="absolute -top-0.5 -translate-x-1/2 rounded-full bg-muj px-1.5 text-[10px] leading-4 whitespace-nowrap text-white">
              Today
            </span>
          </div>
          <ul className="space-y-2">
            {bars.map((bar, index) => (
              <li key={bar.id} className="relative h-6">
                <Link
                  href={bar.href}
                  onMouseEnter={() => setActive(bar.id)}
                  onFocus={() => setActive(bar.id)}
                  onMouseLeave={() => setActive(null)}
                  onBlur={() => setActive(null)}
                  onClick={(event) => {
                    if (active !== bar.id && window.matchMedia("(pointer: coarse)").matches) {
                      event.preventDefault();
                      setActive(bar.id);
                    }
                  }}
                  aria-label={`${bar.label}, ${bar.meta}`}
                  className={cn(
                    "absolute inset-y-0 rounded-full transition-[filter,transform] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    toneStyles[bar.tone].bar,
                    !bar.end && "opacity-60",
                    active === bar.id && "scale-y-110",
                  )}
                  style={{ left: pos(time(bar.start)), width: `max(0.75rem, calc(${pos(ends[index])} - ${pos(time(bar.start))}))` }}
                />
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-between text-[11px] text-fg-faint tabular-nums">
            <span>{year(min)}</span>
            <span>{year(max)}</span>
          </div>
        </div>
      ) : null}
      <p className="min-h-10 text-[12.5px] text-muted-foreground" aria-live="polite">
        {shown ? (
          <>
            <span className="font-medium text-foreground">{shown.label}</span> · {shown.meta}
          </>
        ) : bars.length > 0 ? (
          <>
            <span className="pointer-coarse:hidden">Point at a bar to see that MoU&apos;s term; select it to open the MoU.</span>
            <span className="hidden pointer-coarse:inline">Tap a bar to see that MoU&apos;s term; tap it again to open the MoU.</span>
          </>
        ) : null}
      </p>
      {undated.length > 0 ? (
        <p className="text-[12px] text-fg-faint">
          No dates recorded:{" "}
          {undated.map((item, index) => (
            <span key={item.id}>
              {index > 0 ? ", " : null}
              <Link href={item.href} className="text-muj-fg hover:text-foreground">
                {item.title}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

function Counts({ counts }: { counts: InsightCount[] }) {
  const max = Math.max(1, ...counts.map((row) => row.count));
  return (
    <ul className="space-y-2">
      {counts.map((row) => {
        const body = (
          <>
            <span className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="min-w-0 truncate text-fg-soft group-hover:text-foreground">{row.label}</span>
              <span className="font-medium text-foreground tabular-nums">{row.count}</span>
            </span>
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-overlay">
              <span
                className="dash-grow block h-full rounded-full bg-muj/70 group-hover:bg-muj"
                style={{ width: `${(row.count / max) * 100}%` }}
              />
            </span>
          </>
        );
        return (
          <li key={row.label}>
            {row.href ? (
              <Link href={row.href} className="group block">
                {body}
              </Link>
            ) : (
              <div className="group">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Highlights({ items }: { items: InsightItem[] }) {
  const [index, setIndex] = useState(0);
  const item = items[index];
  const step = (by: number) => setIndex((i) => (i + by + items.length) % items.length);
  return (
    <div className="flex items-stretch gap-2">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={items.length < 2}
        aria-label="Previous highlight"
        className="shrink-0 rounded-xl px-1.5 text-fg-subtle pointer-coarse:px-2.5 transition-colors hover:bg-overlay hover:text-foreground disabled:opacity-30"
      >
        <ChevronLeft className="size-4" />
      </button>
      <Link
        key={item.id}
        href={item.href}
        className="dash-rise group min-w-0 flex-1 rounded-xl border border-hairline bg-overlay-subtle px-4 py-3 transition-colors hover:border-line-strong"
        aria-live="polite"
      >
        <span className="flex items-center gap-1.5 text-[11px] text-fg-faint">
          <Sparkles className="size-3 text-muj-fg" aria-hidden />
          {item.badge ?? "Highlight"} · {index + 1} of {items.length}
        </span>
        <span className="mt-1 line-clamp-2 block text-[15px] leading-snug font-medium text-foreground group-hover:text-muj-fg">
          {item.title}
        </span>
        <span className="mt-1 block truncate text-[12px] text-muted-foreground">{item.meta}</span>
      </Link>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={items.length < 2}
        aria-label="Next highlight"
        className="shrink-0 rounded-xl px-1.5 text-fg-subtle pointer-coarse:px-2.5 transition-colors hover:bg-overlay hover:text-foreground disabled:opacity-30"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function Items({ items }: { items: InsightItem[] }) {
  return (
    <ul className="divide-y divide-hairline">
      {items.map((item) => (
        <li key={item.id}>
          <Link href={item.href} className="group flex items-center gap-3 py-2.5">
            {item.tone ? <span aria-hidden className={cn("size-2 shrink-0 rounded-full", toneStyles[item.tone].dot)} /> : null}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] text-foreground group-hover:text-muj-fg">{item.title}</span>
              <span className="block truncate text-[12px] text-muted-foreground">{item.meta}</span>
            </span>
            {item.badge ? <span className="shrink-0 text-[11.5px] text-fg-faint">{item.badge}</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function InsightsCard({
  title = "Insights",
  subtitle,
  tabs,
  compact = false,
  className,
}: {
  title?: string;
  subtitle?: string;
  tabs: InsightTab[];
  /** Narrow layout for a side column. */
  compact?: boolean;
  className?: string;
}) {
  const [selected, setSelected] = useState(tabs[0]?.id);
  const id = useId();
  const tab = tabs.find((row) => row.id === selected) ?? tabs[0];
  if (!tab) return null;
  const hasContent = Boolean(
    tab.stats?.length || tab.timeline?.bars.length || tab.timeline?.undated.length || tab.counts?.length || tab.highlights?.length || tab.items?.length,
  );

  return (
    <section aria-labelledby={`${id}-title`} className={cn("portal-surface relative overflow-hidden", className)}>
      {compact ? (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-(--muj) via-(--reach-2) to-(--reach-3)"
        />
      ) : null}
      <div
        className={cn(
          "flex gap-3",
          compact ? "flex-col px-4 pt-5" : "flex-wrap items-center justify-between px-5 pt-4 sm:px-6",
        )}
      >
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-muj-fg uppercase">
            <Sparkles className="size-3.5" aria-hidden />
            {title}
          </h2>
          {subtitle ? <p className="mt-1 truncate text-[12px] text-muted-foreground">{subtitle}</p> : null}
        </div>
        {tabs.length > 1 ? (
          <div
            role="tablist"
            aria-label={title}
            className={cn(
              "gap-1 rounded-full bg-overlay p-1",
              compact ? "grid auto-cols-fr grid-flow-col" : "flex flex-wrap",
            )}
          >
            {tabs.map((row) => (
              <button
                key={row.id}
                type="button"
                role="tab"
                id={`${id}-tab-${row.id}`}
                aria-selected={row.id === tab.id}
                aria-controls={`${id}-panel`}
                onClick={() => setSelected(row.id)}
                className={cn(
                  "rounded-full py-1 transition-colors pointer-coarse:py-2",
                  compact ? "px-2 text-[11.5px]" : "px-3 text-[12px]",
                  row.id === tab.id ? "bg-card text-foreground shadow-sm" : "text-fg-subtle hover:text-foreground",
                )}
              >
                {row.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div
        key={tab.id}
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${tab.id}`}
        className={cn("dash-rise space-y-4", compact ? "px-4 pt-3 pb-4" : "px-5 pt-4 pb-5 sm:px-6")}
      >
        {tab.stats?.length ? <Stats stats={tab.stats} compact={compact} /> : null}
        {tab.highlights?.length ? <Highlights items={tab.highlights} /> : null}
        {tab.timeline && (tab.timeline.bars.length || tab.timeline.undated.length) ? <Timeline {...tab.timeline} /> : null}
        {tab.counts?.length ? <Counts counts={tab.counts} /> : null}
        {tab.items?.length ? <Items items={tab.items} /> : null}
        {!hasContent ? <p className="text-[13px] text-fg-faint">{tab.empty ?? "Nothing recorded yet."}</p> : null}
      </div>
    </section>
  );
}
