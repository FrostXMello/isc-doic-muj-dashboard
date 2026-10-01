"use client";

import { AccountMenu } from "@/components/auth/account-menu";
import { SignOutButton, signOutClass } from "@/components/auth/sign-out-button";
import { isActive } from "@/components/navbar/navbar";
import type { AccountSummary } from "@/lib/auth/session";
import { studentPortalNav } from "@/lib/data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const portalHome = studentPortalNav[0].href;

export function StudentPortalNav({ account }: { account: AccountSummary | null }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  // Scroll only the row, never the page, so the active link is visible on narrow screens.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active) return;
    const { left, right } = active.getBoundingClientRect();
    const bounds = nav.getBoundingClientRect();
    if (left < bounds.left || right > bounds.right) {
      nav.scrollLeft += left - bounds.left - (bounds.width - active.offsetWidth) / 2;
    }
  }, [pathname]);

  return (
    <div className="sticky top-14 z-40 border-b border-line bg-background/94 backdrop-blur-[2px]">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 pr-5 sm:pr-8">
        <nav
          ref={navRef}
          aria-label="Student portal"
          className="flex min-w-0 flex-1 items-center gap-7 overflow-x-auto pl-5 [scrollbar-width:none] sm:pl-8 [&::-webkit-scrollbar]:hidden"
        >
          {studentPortalNav.map((item) => {
            const active =
              item.href === portalHome ? pathname === portalHome : isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 py-3 text-[13px] whitespace-nowrap tracking-[0.01em] transition-colors duration-200",
                  active
                    ? "text-foreground shadow-[inset_0_-1px_0_0_var(--cyan)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {account ? (
          <div className="flex shrink-0 items-center gap-2 border-l border-line pl-4">
            <AccountMenu account={account} variant="portal" />
            <SignOutButton className={signOutClass} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
