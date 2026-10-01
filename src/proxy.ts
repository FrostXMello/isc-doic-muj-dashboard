import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { type AppRole, canAccessArea, fetchUserRoles, portalAreaFor, portalHome } from "@/lib/auth/roles";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Runs before the portals and auth pages render, regardless of
 * INTERNAL_DATA_SOURCE:
 *
 * - Refreshes the Supabase session, because Server Components cannot write
 *   cookies.
 * - Redirects signed-out visitors away from /student-portal and /internal to
 *   /login?next=…, users without a role to /access-pending, and students away
 *   from /internal.
 *
 * This is the fast path. Layouts repeat the check with getUser() and every
 * Server Function checks again, so the proxy is never the only guard.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const area = portalAreaFor(pathname);
  const env = getSupabasePublicEnv();

  if (!env) {
    return area ? redirectToLogin(request, `${pathname}${search}`, null) : NextResponse.next();
  }

  let response = NextResponse.next({ request });
  let cacheHeaders: Record<string, string> = {};
  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        cacheHeaders = headers;
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  const hadSession = request.cookies.getAll().some(({ name }) => isAuthCookie(name));
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims.sub === "string" ? data.claims.sub : null;

  if (!area) return response;

  // Carries refreshed or cleared session cookies onto a redirect.
  const withSession = (redirect: NextResponse) => {
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    for (const [key, value] of Object.entries(cacheHeaders)) redirect.headers.set(key, value);
    return redirect;
  };

  if (!userId) {
    return withSession(
      redirectToLogin(request, `${pathname}${search}`, hadSession ? "session-expired" : null),
    );
  }

  let roles: AppRole[];
  try {
    roles = await fetchUserRoles(supabase, userId);
  } catch {
    return withSession(redirectToLogin(request, `${pathname}${search}`, "unavailable"));
  }

  if (roles.length === 0) {
    return withSession(NextResponse.redirect(new URL(portalHome.pending, request.url)));
  }
  if (!canAccessArea(area, roles)) {
    return withSession(NextResponse.redirect(new URL("/unauthorized", request.url)));
  }
  return response;
}

function isAuthCookie(name: string) {
  return name.startsWith("sb-") && name.includes("-auth-token");
}

function redirectToLogin(request: NextRequest, next: string, notice: string | null) {
  const url = new URL("/login", request.url);
  url.searchParams.set("next", next);
  if (notice) url.searchParams.set("notice", notice);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/student-portal/:path*",
    "/internal/:path*",
    "/login",
    "/access-pending",
    "/unauthorized",
    "/reset-password",
  ],
};
