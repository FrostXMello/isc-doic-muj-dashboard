"use client";

import { useEffect } from "react";

/** Tailwind's `lg` breakpoint, where the mobile menus are hidden by CSS. */
const DESKTOP_QUERY = "(min-width: 1024px)";

let lockCount = 0;
let previousOverflow = "";

function acquire() {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  lockCount += 1;
}

function release() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.body.style.overflow = previousOverflow;
}

/**
 * Locks page scrolling while `active` is true. Locks are ref-counted, so
 * overlapping overlays cannot leave the page locked, and the lock is always
 * released on unmount (including client-side navigations).
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    acquire();
    return release;
  }, [active]);
}

/**
 * Shared behaviour for mobile-only overlays (menus, drawers): locks scroll
 * while open, closes on Escape, and closes when the viewport reaches the
 * desktop breakpoint, where the overlay is hidden by CSS but would otherwise
 * keep the page locked. `onClose` must be referentially stable.
 */
export function useMobileOverlay(open: boolean, onClose: () => void) {
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onBreakpoint = () => {
      if (desktop.matches) onClose();
    };
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [open, onClose]);
}
