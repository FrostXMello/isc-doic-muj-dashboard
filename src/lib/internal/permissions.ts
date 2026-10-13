/**
 * Explicit permission matrix for every role and protected action.
 *
 * Who may enter which portal is decided in src/lib/auth (proxy + layouts).
 * Within the Internal Portal these helpers decide what the UI offers and give
 * server actions clear early refusals. They never replace the database: row
 * level security, the user_roles guard trigger, and the private.* helpers in
 * supabase/migrations/20261005090100_admin_control.sql enforce the same
 * matrix, and tests/permissions.test.ts keeps the two in step.
 */

/** Mirrors the `public.app_role` enum. */
export type AppRole = "super_admin" | "doic_admin" | "isc_admin" | "isc_team" | "leadership" | "student";

export type ContentResource =
  | "institutions"
  | "agreements"
  | "programs"
  | "opportunities"
  | "documents"
  | "activities";

export type PortalResource = ContentResource | "reports" | "users" | "settings" | "audit";

export type PortalAction = "read" | "create" | "update" | "archive" | "delete" | "upload" | "export" | "manage";

export type Permission = `${PortalResource}:${PortalAction}`;

export const contentResources: readonly ContentResource[] = [
  "institutions",
  "agreements",
  "programs",
  "opportunities",
  "documents",
  "activities",
];

export const adminRoles: readonly AppRole[] = ["super_admin", "doic_admin", "isc_admin"];

const content = (actions: readonly PortalAction[]): Permission[] =>
  contentResources.flatMap((resource) => actions.map((action) => `${resource}:${action}` as Permission));

const reader: Permission[] = [...content(["read"]), "reports:read", "reports:export"];
const editor: Permission[] = [...reader, ...content(["create", "update", "archive"]), "documents:upload"];
const administrator: Permission[] = [
  ...editor,
  ...content(["delete"]),
  "users:read",
  "users:manage",
  "settings:read",
  "settings:update",
  "audit:read",
];

/** Every permission each role holds. Students hold none inside the Internal Portal. */
export const rolePermissions: Record<AppRole, ReadonlySet<Permission>> = {
  super_admin: new Set(administrator),
  doic_admin: new Set(administrator),
  isc_admin: new Set(administrator),
  isc_team: new Set(editor),
  leadership: new Set([...reader, "audit:read"]),
  student: new Set(),
};

/** Whether any of the user's roles grants `permission`. */
export function can(roles: readonly AppRole[], permission: Permission) {
  return roles.some((role) => rolePermissions[role].has(permission));
}

export function isAdmin(roles: readonly AppRole[]) {
  return roles.some((role) => adminRoles.includes(role));
}

/** Administration is open to administrators and, read-only, to Leadership. */
export function canOpenAdministration(roles: readonly AppRole[]) {
  return isAdmin(roles) || can(roles, "audit:read");
}

/**
 * Roles each administrator may grant or revoke on another account.
 * Mirrors private.can_assign_role.
 */
const assignable: Record<AppRole, readonly AppRole[]> = {
  super_admin: ["super_admin", "doic_admin", "isc_admin", "isc_team", "leadership", "student"],
  doic_admin: ["isc_team", "leadership", "student"],
  isc_admin: ["isc_team", "student"],
  isc_team: [],
  leadership: [],
  student: [],
};

export type Account = { id: string; roles: readonly AppRole[] };

/**
 * Whether `actor` may manage `target`'s account (deactivate, reset, delete).
 * Never oneself; accounts holding an admin role only by a super_admin.
 * Mirrors private.can_manage_account.
 */
export function canManageAccount(actor: Account, target: Account) {
  if (actor.id === target.id) return false;
  if (actor.roles.includes("super_admin")) return true;
  return isAdmin(actor.roles) && !isAdmin(target.roles);
}

/** Roles `actor` may grant to or revoke from `target`. */
export function assignableRoles(actor: Account, target: Account): AppRole[] {
  if (!canManageAccount(actor, target)) return [];
  const allowed = new Set(actor.roles.flatMap((role) => assignable[role]));
  return [...allowed];
}

export function canAssignRole(actor: Account, target: Account, role: AppRole) {
  return assignableRoles(actor, target).includes(role);
}

/** Roles `actor` may give a brand-new account. */
export function rolesForNewAccount(actorRoles: readonly AppRole[]): AppRole[] {
  return [...new Set(actorRoles.flatMap((role) => assignable[role]))];
}
