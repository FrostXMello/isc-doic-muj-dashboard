"use client";

import { applyTheme, useResolvedTheme, useThemePreference } from "@/lib/theme-store";
import { useLayoutEffect, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Keeps <html data-theme> in step with the stored preference and, in System
 * mode, with the OS setting. The inline head script handles first paint; this
 * covers later changes, other tabs, and React resetting <html> attributes on
 * the development Strict Mode remount.
 */
export function ThemeSync() {
  const preference = useThemePreference();
  const resolved = useResolvedTheme();
  // The hydration render sees server snapshots; applying those would clobber
  // the theme the head script already set.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useLayoutEffect(() => {
    if (hydrated) applyTheme(resolved, preference);
  }, [hydrated, resolved, preference]);

  return null;
}
