import Link from "next/link";
import { sectionTabs, tabHref } from "@/lib/internal-nav";
import { cn } from "@/lib/utils";

/**
 * Tabs that switch the view of one section's list page (e.g. Programs and
 * Opportunities on /internal/programs). Each tab is a link to the same page
 * with its own `tab` parameter, so Back/Forward, refresh and shared links
 * restore the view. Parameters in `keep` carry over between tabs; filters
 * that only apply to one tab are dropped.
 */
export function SectionTabs({
  section,
  current,
  counts,
  keep,
}: {
  section: string;
  current: string;
  counts?: Readonly<Record<string, number>>;
  keep?: Readonly<Record<string, string | undefined>>;
}) {
  const tabs = sectionTabs(section);
  if (tabs.length === 0) return null;
  const kept = new URLSearchParams(
    Object.entries(keep ?? {}).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );

  return (
    <nav aria-label="Views" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {tabs.map((tab) => {
          const active = tab.value === current;
          const count = counts?.[tab.value];
          return (
            <li key={tab.value}>
              <Link
                href={tabHref(section, tab.value, kept)}
                scroll={false}
                aria-current={active ? "page" : undefined}
                data-tab={tab.value}
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
