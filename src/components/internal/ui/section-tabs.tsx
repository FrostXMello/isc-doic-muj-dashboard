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
  keep,
}: {
  section: string;
  current: string;
  keep?: Readonly<Record<string, string | undefined>>;
}) {
  const tabs = sectionTabs(section);
  if (tabs.length === 0) return null;
  const kept = new URLSearchParams(
    Object.entries(keep ?? {}).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );

  return (
    <nav aria-label="Views" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-6 border-b border-hairline">
        {tabs.map((tab) => {
          const active = tab.value === current;
          return (
            <li key={tab.value}>
              <Link
                href={tabHref(section, tab.value, kept)}
                scroll={false}
                aria-current={active ? "page" : undefined}
                data-tab={tab.value}
                className={cn(
                  "relative -mb-px inline-flex min-h-12 items-center font-display text-[17px] tracking-[-0.025em] transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:origin-left after:rounded-full after:bg-muj after:transition-transform after:duration-300 motion-reduce:after:transition-none",
                  active
                    ? "font-medium text-foreground after:scale-x-100"
                    : "text-fg-subtle after:scale-x-0 hover:text-foreground hover:after:scale-x-40",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
