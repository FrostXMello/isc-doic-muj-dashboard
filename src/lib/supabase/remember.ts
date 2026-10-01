import type { CookieOptions } from "@supabase/ssr";

/** Set at sign-in: "1" keeps the session across browser restarts, "0" ends it when the browser closes. */
export const REMEMBER_COOKIE = "doic-remember";
export const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Supabase writes long-lived auth cookies. Without "remember me" they must stay
 * session cookies on every write, including token refreshes, or a refresh would
 * silently turn the session persistent again.
 */
export function withRememberPreference(options: CookieOptions, remember: boolean): CookieOptions {
  if (remember) return options;
  // A zero/negative maxAge is a deletion, which must keep working.
  if (typeof options.maxAge === "number" && options.maxAge <= 0) return options;
  const sessionOnly = { ...options };
  delete sessionOnly.maxAge;
  delete sessionOnly.expires;
  return sessionOnly;
}

export function rememberFromCookie(value: string | undefined) {
  return value !== "0";
}
