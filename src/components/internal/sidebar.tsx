"use client";

import { Mark } from "@/components/brand/mark";
import { internalNav } from "@/lib/internal-nav";
import { site } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GraduationCap,
  FileText,
  BookOpen,
  Compass,
  FolderOpen,
  CalendarDays,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeft,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  GraduationCap,
  FileText,
  BookOpen,
  Compass,
  FolderOpen,
  CalendarDays,
  BarChart3,
  Settings,
};

function isActive(pathname: string, href: string) {
  if (href === "/internal") return pathname === "/internal";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-line bg-surface transition-[width] duration-300 ease-out",
        collapsed ? "w-[68px]" : "w-[260px]",
      )}
    >
      {/* Brand header */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4">
        <Link
          href="/internal"
          className="flex items-center gap-3 rounded-sm outline-offset-4"
          aria-label="Internal Portal home"
        >
          <Mark className="size-7 shrink-0 text-primary" />
          {!collapsed && (
            <span className="min-w-0 text-left">
              <span className="block font-display text-[14px] leading-none tracking-[0.14em] text-foreground">
                {site.shortName}
              </span>
              <span className="mt-1 block text-[10px] leading-none tracking-[0.02em] text-muted-foreground">
                Internal Portal
              </span>
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4" aria-label="Portal navigation">
        <ul className="flex flex-col gap-0.5">
          {internalNav.map((item) => {
            const Icon = iconMap[item.icon];
            const active = isActive(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] tracking-[0.01em] transition-all duration-200",
                    active
                      ? "bg-accent text-foreground shadow-[inset_2px_0_0_0_var(--cyan)]"
                      : "text-fg-subtle hover:bg-overlay hover:text-foreground",
                    collapsed && "justify-center px-0",
                  )}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        "size-[18px] shrink-0 transition-colors",
                        active ? "text-cyan" : "text-fg-faint group-hover:text-muted-foreground",
                      )}
                    />
                  )}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom actions */}
      <div className="shrink-0 border-t border-line p-2.5">
        <Link
          href="/"
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-fg-subtle transition-colors duration-200 hover:bg-overlay hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
          title={collapsed ? "Back to public site" : undefined}
        >
          <ArrowLeft className="size-[18px] shrink-0 text-fg-faint group-hover:text-muted-foreground" />
          {!collapsed && <span className="truncate">Back to site</span>}
        </Link>
        <button
          onClick={onToggle}
          className={cn(
            "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-fg-subtle transition-colors duration-200 hover:bg-overlay hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="size-[18px] shrink-0 text-fg-faint group-hover:text-muted-foreground" />
          ) : (
            <>
              <PanelLeftClose className="size-[18px] shrink-0 text-fg-faint group-hover:text-muted-foreground" />
              <span className="truncate">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
