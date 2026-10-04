"use client";

import { AccountMenu } from "@/components/auth/account-menu";
import { SignOutButton, signOutClass } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { AccountSummary } from "@/lib/auth/session";
import { internalBreadcrumbs, navTitle } from "@/lib/internal-nav";
import { cn } from "@/lib/utils";
import { Menu, ChevronRight } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

export function Topbar({
  account,
  onMobileMenuToggle,
}: {
  account: AccountSummary | null;
  onMobileMenuToggle: () => void;
}) {
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  const breadcrumbs = internalBreadcrumbs(pathname, tab);
  const pageTitle = navTitle(pathname, tab);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-line bg-surface/80 px-4 backdrop-blur-sm sm:px-6">
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={onMobileMenuToggle}
        className="rounded-lg p-2 text-fg-subtle transition-colors hover:bg-overlay hover:text-foreground lg:hidden"
        aria-label="Toggle navigation"
      >
        <Menu className="size-5" />
      </button>

      {/* Breadcrumbs — desktop */}
      <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 lg:flex">
        {breadcrumbs.map((crumb, idx) => (
          <span key={`${idx}-${crumb.href}`} className="flex items-center gap-1.5">
            {idx > 0 && (
              <ChevronRight className="size-3.5 text-fg-dim" aria-hidden />
            )}
            {idx === breadcrumbs.length - 1 ? (
              <span aria-current="page" className="text-[13px] font-medium tracking-[0.01em] text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-[13px] tracking-[0.01em] text-fg-subtle transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Page title — mobile */}
      <p className="min-w-0 truncate font-display text-[15px] tracking-[-0.02em] text-foreground lg:hidden">
        {pageTitle}
      </p>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle className="mr-1" />

        {account ? (
          <>
            <AccountMenu account={account} variant="internal" />
            <SignOutButton className={cn(signOutClass, "ml-1")} />
          </>
        ) : null}
      </div>
    </header>
  );
}
