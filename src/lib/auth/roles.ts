import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/internal/permissions";

/**
 * Role resolution for portal routing. Roles come only from public.user_roles,
 * read with the signed-in user's session (RLS lets every user read their own
 * grants). Never derive access from email, user_metadata, local storage, or
 * query parameters.
 *
 * Shared by the proxy and server code, so it must not import server-only
 * modules.
 */

export type { AppRole };

export const appRoles = ["doic_admin", "isc_team", "leadership", "student"] as const satisfies
  readonly AppRole[];

/** Highest-priority first. */
const rolePriority: readonly AppRole[] = appRoles;

export const internalRoles: readonly AppRole[] = ["doic_admin", "isc_team", "leadership"];

export const roleLabels: Record<AppRole, string> = {
  doic_admin: "DoIC admin",
  isc_team: "ISC team",
  leadership: "Leadership",
  student: "Student",
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (appRoles as readonly string[]).includes(value);
}

export const portalHome = {
  internal: "/internal",
  student: "/student-portal",
  pending: "/access-pending",
} as const;

export function primaryRole(roles: readonly AppRole[]): AppRole | null {
  return rolePriority.find((role) => roles.includes(role)) ?? null;
}

export function hasInternalRole(roles: readonly AppRole[]) {
  return roles.some((role) => internalRoles.includes(role));
}

/** Where a user lands after signing in when no (allowed) `next` path is given. */
export function defaultDestination(roles: readonly AppRole[]): string {
  if (hasInternalRole(roles)) return portalHome.internal;
  if (roles.includes("student")) return portalHome.student;
  return portalHome.pending;
}

export type PortalArea = "internal" | "student";

export function portalAreaFor(pathname: string): PortalArea | null {
  if (pathname === "/internal" || pathname.startsWith("/internal/")) return "internal";
  if (pathname === "/student-portal" || pathname.startsWith("/student-portal/")) return "student";
  return null;
}

/** Internal roles may use both portals; students only the student portal. */
export function canAccessArea(area: PortalArea, roles: readonly AppRole[]) {
  if (area === "internal") return hasInternalRole(roles);
  return hasInternalRole(roles) || roles.includes("student");
}

export function canAccessPath(pathname: string, roles: readonly AppRole[]) {
  const area = portalAreaFor(pathname);
  return area ? canAccessArea(area, roles) : true;
}

/** Access level shown in account menus, e.g. "DoIC admin" or "No access assigned". */
export function accessLevelLabel(roles: readonly AppRole[]) {
  const role = primaryRole(roles);
  return role ? roleLabels[role] : "No access assigned";
}

export class RoleLookupError extends Error {
  constructor() {
    super("Could not load portal roles");
    this.name = "RoleLookupError";
  }
}

/**
 * Reads the caller's own role grants. `userId` must come from a verified
 * session (getUser / getClaims). Admins and leadership can read every grant,
 * so the user filter is required, not just a convenience.
 */
export async function fetchUserRoles(supabase: SupabaseClient, userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new RoleLookupError();
  return (data ?? []).map((row) => row.role).filter(isAppRole);
}
