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
        "group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-white/10 px-1 py-6 transition-[background-color,box-shadow] duration-300 hover:bg-white/[0.025] hover:shadow-[inset_2px_0_0_#9ec9d4] sm:grid-cols-[4.5rem_2.5rem_minmax(0,1fr)_auto] sm:gap-x-6 sm:px-4 sm:py-8",
        className,
      )}
    >
      <span className="font-mono text-[12px] tracking-[0.16em] text-[#7f93ab] transition-colors duration-300 group-hover:text-[#d7e4fb]">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="hidden size-10 items-center justify-center border border-white/10 text-[#b7c8de] transition-colors duration-300 group-hover:border-[#9ec9d4]/50 group-hover:text-[#e7eef8] sm:flex">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2.5 font-display text-[1.28rem] leading-tight tracking-[-0.03em] text-foreground sm:text-[1.55rem]">
          <Icon className="size-4 shrink-0 text-[#b7c8de] sm:hidden" aria-hidden="true" />
          {title}
        </span>
        <span className="mt-1.5 block max-w-xl text-sm leading-relaxed text-muted-foreground">
          {summary}
        </span>
      </span>
      <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.12em] text-[#8ea0b8] uppercase transition-colors duration-300 group-hover:text-[#d7e4fb]">
        <span className="hidden sm:inline">View</span>
        <ArrowRight
          className="size-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1"
          aria-hidden="true" />
      </span>
    </Link>
  );
}
