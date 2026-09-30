/**
 * Permission vocabulary for future role-based access control.
 *
 * NOT ENFORCED. There is no authentication in this stage; every visitor to
 * /internal sees everything. The types exist so that pages and actions can be
 * annotated now and gated later without renaming things.
 */

export type PortalRole = "viewer" | "editor" | "admin";

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
