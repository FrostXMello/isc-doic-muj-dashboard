"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type AdminNavLink = { href: string; label: string };

/** Section links for Administration; the server passes only those the role may open. */
export function AdminNav({ links }: { links: readonly AdminNavLink[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Administration sections" className="-mx-1 overflow-x-auto">
      <ul className="flex min-w-max gap-1 border-b border-hairline px-1">
        {links.map((link) => {
          const active = link.href === "/internal/admin" ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex h-10 items-center border-b-2 px-3 text-[13px] transition-colors",
                  active
                    ? "border-muj font-medium text-foreground"
                    : "border-transparent text-fg-subtle hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
