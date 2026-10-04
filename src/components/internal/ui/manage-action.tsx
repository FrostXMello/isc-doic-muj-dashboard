import "server-only";
import { Lock, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { PlaceholderAction, unavailableReasons } from "@/components/internal/ui/placeholder-action";
import { getAuthContext } from "@/lib/auth/session";
import { resolveInternalDataSource } from "@/lib/internal/data/source";
import { type Permission, portalRoleOf, roleAllows } from "@/lib/internal/permissions";
import { cn } from "@/lib/utils";

const icons = { add: Plus, edit: Pencil } as const;

export const actionButtonClass = (variant: "primary" | "secondary", size: "sm" | "md" = "md") =>
  cn(
    "inline-flex items-center gap-1.5 rounded-lg border font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-cyan/40 focus-visible:outline-none",
    size === "sm" ? "h-8 px-2.5 text-[12px]" : "h-9 px-3 text-[13px]",
    variant === "primary"
      ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
      : "border-line bg-transparent text-muted-foreground hover:border-line-bold hover:text-foreground",
  );

async function roleAllowsCurrentUser(permission: Permission) {
  const auth = await getAuthContext();
  const role = auth.state === "signed-in" ? portalRoleOf(auth.roles) : null;
  return Boolean(role && roleAllows(role, permission));
}

/** Whether the signed-in user may perform `permission` and the portal can write. */
export async function canManage(permission: Permission) {
  return resolveInternalDataSource() === "supabase" && (await roleAllowsCurrentUser(permission));
}

/**
 * Gate for create/edit pages: roles without the permission go to
 * /unauthorized; "static" means the portal is read-only here.
 */
export async function requireManage(permission: Permission): Promise<"ok" | "static"> {
  if (!(await roleAllowsCurrentUser(permission))) redirect("/unauthorized");
  return resolveInternalDataSource() === "supabase" ? "ok" : "static";
}

export function ReadOnlySourceNotice() {
  return (
    <EmptyState
      icon={Lock}
      title="Editing isn't available on this deployment"
      description={unavailableReasons.staticSource}
    />
  );
}

/**
 * A create/edit link shown only to roles allowed to use it, so Leadership
 * sees a read-only portal. Without the Supabase source the portal cannot
 * write, so allowed roles see an explanation instead. RLS remains the real
 * boundary.
 */
export async function ManageLink({
  permission,
  href,
  label,
  icon,
  variant = "secondary",
  size = "md",
}: {
  permission: Permission;
  href: string;
  label: string;
  icon: keyof typeof icons;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
}) {
  if (!(await roleAllowsCurrentUser(permission))) return null;
  if (resolveInternalDataSource() !== "supabase") {
    return (
      <PlaceholderAction label={label} icon={icon} variant={variant} size={size} reason={unavailableReasons.staticSource} />
    );
  }
  const Icon = icons[icon];
  return (
    <Link href={href} className={actionButtonClass(variant, size)}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </Link>
  );
}
