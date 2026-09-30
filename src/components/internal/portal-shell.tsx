"use client";

import { Sidebar } from "@/components/internal/sidebar";
import { Topbar } from "@/components/internal/topbar";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";

const COLLAPSED_KEY = "portal-sidebar-collapsed";
const collapsedListeners = new Set<() => void>();

function subscribeCollapsed(listener: () => void) {
  collapsedListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    collapsedListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readCollapsed() {
  return localStorage.getItem(COLLAPSED_KEY) === "true";
}

/**
 * PortalShell — the main layout wrapper for all /internal/* pages.
 *
 * Provides:
 * - Collapsible sidebar (persisted in localStorage)
 * - Responsive mobile drawer overlay
 * - Top navigation bar
 * - Content area with consistent padding
 *
 * Does NOT enforce auth — that is a later stage concern.
 */
export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  // The drawer is open only on the path it was opened from, so navigating closes it.
  const [mobileOpenedAt, setMobileOpenedAt] = useState<string | null>(null);
  const mobileOpen = mobileOpenedAt === pathname;

  const toggleCollapsed = useCallback(() => {
    localStorage.setItem(COLLAPSED_KEY, String(!readCollapsed()));
    collapsedListeners.forEach((listener) => listener());
  }, []);

  const closeMobile = useCallback(() => setMobileOpenedAt(null), []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen, closeMobile]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#070b14]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={closeMobile}
            aria-hidden
          />
          {/* Drawer */}
          <div className="relative z-10 h-full w-[280px] animate-[slideIn_0.25s_ease-out]">
            <Sidebar collapsed={false} onToggle={closeMobile} />
            <button
              onClick={closeMobile}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-[#8a9ab4] transition-colors hover:bg-white/[0.04] hover:text-foreground"
              aria-label="Close navigation"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMobileMenuToggle={() => setMobileOpenedAt(mobileOpen ? null : pathname)} />
        <main id="main" className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
