import "server-only";
import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  type AppRole,
  type PortalArea,
  accessLevelLabel,
  canAccessArea,
  fetchUserRoles,
  portalHome,
} from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthContext =
  | { state: "unconfigured" }
  | { state: "signed-out" }
  | { state: "error" }
  | { state: "signed-in"; userId: string; email: string | null; roles: AppRole[] };

/** What account menus show. Only the signed-in user's own details. */
export type AccountSummary = {
  name: string | null;
  email: string | null;
  accessLevel: string;
};

/**
 * The verified user and their roles, memoised per request. Uses getUser(),
 * which validates the session with the Auth server; the cookie session alone
 * is never trusted for authorisation.
 */
export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { state: "unconfigured" };

  const { data, error } = await supabase.auth.getUser();
  if (error && isAuthRetryableFetchError(error)) return { state: "error" };
  if (error || !data.user) return { state: "signed-out" };

  try {
    const roles = await fetchUserRoles(supabase, data.user.id);
    return { state: "signed-in", userId: data.user.id, email: data.user.email ?? null, roles };
  } catch {
    return { state: "error" };
  }
});

export const getAccountSummary = cache(async (): Promise<AccountSummary | null> => {
  const auth = await getAuthContext();
  if (auth.state !== "signed-in") return null;

  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase.from("profiles").select("full_name").eq("id", auth.userId).maybeSingle()
    : { data: null };

  return {
    name: data?.full_name?.trim() || null,
    email: auth.email,
    accessLevel: accessLevelLabel(auth.roles),
  };
});

/**
 * Server-side guard for a portal area (defence in depth behind the proxy).
 * Redirects instead of rendering when the user may not see the area.
 */
export async function requirePortalAccess(area: PortalArea, path: string) {
  const auth = await getAuthContext();
  if (auth.state !== "signed-in") {
    redirect(`/login?next=${encodeURIComponent(path)}${auth.state === "error" ? "&notice=unavailable" : ""}`);
  }
  if (auth.roles.length === 0) redirect(portalHome.pending);
  if (!canAccessArea(area, auth.roles)) redirect("/unauthorized");
  return auth;
}

/** For pages that only need a verified user (e.g. /access-pending). */
export async function requireUser() {
  const auth = await getAuthContext();
  if (auth.state !== "signed-in") redirect("/login");
  return auth;
}
