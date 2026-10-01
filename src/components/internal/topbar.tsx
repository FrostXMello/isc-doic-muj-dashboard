"use client";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { internalNav } from "@/lib/internal-nav";
import { Bell, Search, Menu, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

function getBreadcrumbs(pathname: string) {
  const crumbs: { label: string; href: string }[] = [
    { label: "Portal", href: "/internal" },
  ];

  const match = internalNav.find((item) => {
    if (item.href === "/internal") return pathname === "/internal";
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });

  if (match && match.href !== "/internal") {
    crumbs.push({ label: match.label, href: match.href });
    if (pathname !== match.href) {
      crumbs.push({ label: "Record", href: pathname });
    }
  }

  return crumbs;
}

function getPageTitle(pathname: string) {
  const match = internalNav.find((item) => {
    if (item.href === "/internal") return pathname === "/internal";
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });
  return match?.label ?? "Portal";
}

export function Topbar({
  onMobileMenuToggle,
}: {
  onMobileMenuToggle: () => void;
}) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-line bg-surface/80 px-4 backdrop-blur-sm sm:px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuToggle}
        className="rounded-lg p-2 text-fg-subtle transition-colors hover:bg-overlay hover:text-foreground lg:hidden"
        aria-label="Toggle navigation"
      >
        <Menu className="size-5" />
      </button>

      {/* Breadcrumbs — desktop */}
      <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 lg:flex">
        {breadcrumbs.map((crumb, idx) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {idx > 0 && (
              <ChevronRight className="size-3.5 text-fg-dim" aria-hidden />
            )}
            {idx === breadcrumbs.length - 1 ? (
              <span className="text-[13px] font-medium tracking-[0.01em] text-foreground">
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
      <h1 className="min-w-0 truncate font-display text-[15px] tracking-[-0.02em] text-foreground lg:hidden">
        {pageTitle}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle className="mr-1" />

        {/* Search (placeholder) */}
        <button
          className="hidden rounded-lg p-2 text-fg-faint transition-colors hover:bg-overlay hover:text-muted-foreground sm:inline-flex"
          aria-label="Search"
          title="Search — coming soon"
        >
          <Search className="size-[18px]" />
        </button>

        {/* Notifications (placeholder) */}
        <button
          className="relative hidden rounded-lg p-2 text-fg-faint transition-colors hover:bg-overlay hover:text-muted-foreground sm:inline-flex"
          aria-label="Notifications"
          title="Notifications — coming soon"
        >
          <Bell className="size-[18px]" />
          {/* Unread dot placeholder */}
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-cyan opacity-0" />
        </button>

        {/* User avatar placeholder */}
        <div
          className="ml-2 flex size-8 items-center justify-center rounded-full bg-accent text-[11px] font-medium tracking-[0.04em] text-cyan"
          aria-label="User profile — not connected"
          title="Sign-in not connected"
        >
          ISC
        </div>
      </div>
    </header>
  );
}
