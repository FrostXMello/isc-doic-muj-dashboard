import Link from "next/link";
import { sectionTabs } from "@/lib/internal-nav";
import { cn } from "@/lib/utils";

/**
 * Tabs between the list pages of one sidebar section (e.g. Programs and
 * Opportunities). Each tab is a plain link to its own URL, so the browser's
 * Back/Forward, refresh and shared links behave like any other page.
 */
export function SectionTabs({
  section,
  current,
  counts,
}: {
  section: string;
  current: string;
  counts?: Readonly<Record<string, number>>;
}) {
  const tabs = sectionTabs(section);
  if (tabs.length === 0) return null;

  return (
    <nav aria-label="Section pages" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {tabs.map((tab) => {
          const active = tab.href === current;
          const count = counts?.[tab.href];
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex min-h-10 items-center gap-2 border-b-2 px-3 text-[13px] transition-colors",
                  active
                    ? "border-cyan font-medium text-foreground"
                    : "border-transparent text-fg-subtle hover:border-line-bold hover:text-foreground",
                )}
              >
                {tab.label}
                {count !== undefined ? (
                  <span className="rounded-full bg-overlay px-1.5 py-0.5 text-[11px] leading-none text-muted-foreground tabular-nums">
                    {count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
