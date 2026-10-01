import { type AppRole, canAccessPath, defaultDestination } from "@/lib/auth/roles";

/** Pages that must never be a post-sign-in destination (they redirect or loop). */
const authPages = ["/login", "/forgot-password", "/reset-password", "/access-pending", "/unauthorized", "/auth"];

const PROBE_ORIGIN = "http://next.invalid";

/**
 * Returns `raw` as a same-origin relative path, or null. Accepts only paths
 * that start with a single "/"; rejects protocol-relative ("//host"),
 * backslashes (browsers treat "/\host" as "//host"), absolute URLs, and
 * control characters.
 */
export function safeNextPath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 512) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw.includes("\\")) return null;
  for (let i = 0; i < raw.length; i += 1) {
    const code = raw.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return null;
  }

  let url: URL;
  try {
    url = new URL(raw, PROBE_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PROBE_ORIGIN) return null;

  const path = url.pathname;
  if (authPages.some((page) => path === page || path.startsWith(`${page}/`))) return null;
  return `${path}${url.search}`;
}

/** The `next` path when the user's roles allow it, otherwise their default portal. */
export function destinationFor(roles: readonly AppRole[], rawNext: unknown): string {
  const next = safeNextPath(rawNext);
  if (next && roles.length > 0 && canAccessPath(new URL(next, PROBE_ORIGIN).pathname, roles)) {
    return next;
  }
  return defaultDestination(roles);
}
