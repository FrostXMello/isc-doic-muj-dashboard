import "server-only";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { can, canOpenAdministration, type Permission } from "@/lib/internal/permissions";

export const adminSections = [
  { href: "/internal/admin", label: "Overview", permission: null },
  { href: "/internal/admin/users", label: "Users and roles", permission: "users:read" },
  { href: "/internal/admin/audit", label: "Audit history", permission: "audit:read" },
] as const satisfies readonly { href: string; label: string; permission: Permission | null }[];

/**
 * Gate for every Administration page. Signed-out users go to sign-in (via the
 * /internal layout); roles without access, or without `permission`, go to
 * /unauthorized.
 */
export async function requireAdministration(permission?: Permission) {
  const auth = await getAuthContext();
  if (auth.state !== "signed-in" || !canOpenAdministration(auth.roles)) redirect("/unauthorized");
  if (permission && !can(auth.roles, permission)) redirect("/unauthorized");
  return auth;
}

export function visibleAdminSections(roles: Parameters<typeof can>[0]) {
  return adminSections
    .filter((section) => section.permission === null || can(roles, section.permission))
    .map(({ href, label }) => ({ href, label }));
}
