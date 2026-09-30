import { useSyncExternalStore } from "react";
import {
  LIGHT_QUERY,
  THEME_STORAGE_KEY,
  themeColors,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

export type { ResolvedTheme, ThemePreference } from "@/lib/theme";

const listeners = new Set<() => void>();

function isPreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isPreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function subscribePreference(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function readSystem(): ResolvedTheme {
  return window.matchMedia(LIGHT_QUERY).matches ? "light" : "dark";
}

function subscribeSystem(listener: () => void) {
  const media = window.matchMedia(LIGHT_QUERY);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribePreference, readPreference, () => "system");
}

export function useResolvedTheme(): ResolvedTheme {
  const preference = useThemePreference();
  const system = useSyncExternalStore<ResolvedTheme>(subscribeSystem, readSystem, () => "dark");
  return preference === "system" ? system : preference;
}

export function applyTheme(resolved: ResolvedTheme, preference: ThemePreference) {
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-theme-preference", preference);
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", themeColors[resolved]));
}

export function setThemePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage can be unavailable (private mode); the choice still applies for this page.
  }
  applyTheme(preference === "system" ? readSystem() : preference, preference);
  listeners.forEach((listener) => listener());
}

/** The theme currently painted, read from the DOM so canvas code agrees with CSS. */
export function readPaintedTheme(): ResolvedTheme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}
