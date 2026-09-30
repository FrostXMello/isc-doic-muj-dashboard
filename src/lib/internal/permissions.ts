/**
 * Permission vocabulary for role-based access control.
 *
 * NOT ENFORCED IN THE UI. There is no sign-in yet; every visitor to /internal
 * sees the static dataset. When INTERNAL_DATA_SOURCE=supabase, the database
 * enforces the same rules through row level security (supabase/migrations),
 * so these helpers only decide what the UI offers, never what is allowed.
 */

/** Mirrors the `public.app_role` enum. */
export type AppRole = "student" | "isc_team" | "doic_admin" | "leadership";

export type PortalRole = "viewer" | "editor" | "admin";

/** Portal capability for each staff role. Students have no portal role. */
export const portalRoleFor: Record<AppRole, PortalRole | null> = {
  student: null,
  leadership: "viewer",
  isc_team: "editor",
  doic_admin: "admin",
};

export type PortalResource =
  | "institutions"
  | "agreements"
  | "programs"
  | "opportunities"
  | "documents"
  | "activities"
  | "reports";

export type PortalAction = "read" | "create" | "update" | "delete" | "upload";

export type Permission = `${PortalResource}:${PortalAction}`;

const roleRank: Record<PortalRole, number> = { viewer: 0, editor: 1, admin: 2 };

const minimumRole: Record<PortalAction, PortalRole> = {
  read: "viewer",
  create: "editor",
  update: "editor",
  upload: "editor",
  delete: "admin",
};

/** Placeholder check describing the intended policy. Not called by any guard yet. */
export function roleAllows(role: PortalRole, permission: Permission) {
  const action = permission.split(":")[1] as PortalAction;
  return roleRank[role] >= roleRank[minimumRole[action]];
}
