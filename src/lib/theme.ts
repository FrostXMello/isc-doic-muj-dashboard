export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "doic-theme";
export const themeColors: Record<ResolvedTheme, string> = {
  dark: "#070b14",
  light: "#f6f4ef",
};

export const LIGHT_QUERY = "(prefers-color-scheme: light)";

/**
 * Runs in <head> before first paint. Stored preference wins; otherwise the
 * system preference; dark when the system reports no preference. Must stay
 * self-contained ES5 because it is inlined as a string.
 */
export const themeInitScript = `(function(){try{var d=document.documentElement,p=null;try{p=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}if(p!=="light"&&p!=="dark")p="system";var r=p==="system"?(window.matchMedia&&window.matchMedia(${JSON.stringify(LIGHT_QUERY)}).matches?"light":"dark"):p;d.setAttribute("data-theme",r);d.setAttribute("data-theme-preference",p)}catch(e){}})()`;
