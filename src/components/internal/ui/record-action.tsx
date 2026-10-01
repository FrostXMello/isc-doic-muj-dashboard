import "server-only";
import type { ComponentProps } from "react";
import { PlaceholderAction } from "@/components/internal/ui/placeholder-action";
import { getAuthContext } from "@/lib/auth/session";
import { type Permission, portalRoleOf, roleAllows } from "@/lib/internal/permissions";

/**
 * A write action (create, edit, upload) shown only to roles allowed to perform
 * it, so Leadership sees a read-only portal. RLS remains the real boundary.
 */
export async function RecordAction({
  permission,
  ...props
}: ComponentProps<typeof PlaceholderAction> & { permission: Permission }) {
  const auth = await getAuthContext();
  const role = auth.state === "signed-in" ? portalRoleOf(auth.roles) : null;
  if (!role || !roleAllows(role, permission)) return null;
  return <PlaceholderAction {...props} />;
}
