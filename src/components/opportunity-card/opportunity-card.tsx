import type { OpportunityIcon } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  ArrowRight,
  CalendarRange,
  Landmark,
  Route,
} from "lucide-react";
import Link from "next/link";

const icons = {
  exchange: ArrowLeftRight,
  semester: CalendarRange,
  pathway: Route,
  visit: Landmark,
} as const;

export function OpportunityCard({
  title,
  summary,
  href,
  icon,
  index,
  className,
}: {
  title: string;
  summary: string;
  href: "/opportunities";
  icon: OpportunityIcon;
  index: number;
  className?: string;
}) {
  const Icon = icons[icon];
  return (
    <Link
      href={href}
      className={cn(
        "group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-line px-1 py-6 transition-[background-color,box-shadow] duration-300 hover:bg-overlay-subtle hover:shadow-[inset_2px_0_0_var(--cyan)] sm:grid-cols-[4.5rem_2.5rem_minmax(0,1fr)_auto] sm:gap-x-6 sm:px-4 sm:py-8",
        className,
      )}
    >
      <span className="font-mono text-[12px] tracking-[0.16em] text-fg-subtle transition-colors duration-300 group-hover:text-primary">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="hidden size-10 items-center justify-center border border-line text-fg-soft transition-colors duration-300 group-hover:border-cyan/50 group-hover:text-foreground sm:flex">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2.5 font-display text-[1.28rem] leading-tight tracking-[-0.03em] text-foreground sm:text-[1.55rem]">
          <Icon className="size-4 shrink-0 text-fg-soft sm:hidden" aria-hidden="true" />
          {title}
        </span>
        <span className="mt-1.5 block max-w-xl text-sm leading-relaxed text-muted-foreground">
          {summary}
        </span>
      </span>
      <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.12em] text-muted-foreground uppercase transition-colors duration-300 group-hover:text-primary">
        <span className="hidden sm:inline">View</span>
        <ArrowRight
          className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1"
          aria-hidden="true" />
      </span>
    </Link>
  );
}
