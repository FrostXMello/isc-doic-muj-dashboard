import { UserPlus, Users } from "lucide-react";
import { CreateUserForm } from "@/components/internal/create-user-form";
import { DetailSection } from "@/components/internal/ui/detail";
import { type ManagedUser, UserRoleRow } from "@/components/internal/user-role-row";
import { isAppRole } from "@/lib/auth/roles";
import { getAuthContext } from "@/lib/auth/session";
import { isAccountAdminConfigured } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function loadManagedUsers(selfId: string): Promise<ManagedUser[] | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [profiles, grants] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name").order("email"),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (profiles.error || grants.error) return null;

  const rolesByUser = new Map<string, ManagedUser["roles"]>();
  for (const grant of grants.data) {
    if (!isAppRole(grant.role)) continue;
    rolesByUser.set(grant.user_id, [...(rolesByUser.get(grant.user_id) ?? []), grant.role]);
  }

  return profiles.data.map((profile) => ({
    id: profile.id,
    name: profile.full_name?.trim() || null,
    email: profile.email,
    roles: rolesByUser.get(profile.id) ?? [],
    isSelf: profile.id === selfId,
  }));
}

/**
 * Portal access management, rendered only for doic_admin. Reads and writes
 * run as the signed-in admin, so row level security on profiles and
 * user_roles is what actually allows them.
 */
export async function RoleManagement() {
  const auth = await getAuthContext();
  if (auth.state !== "signed-in" || !auth.roles.includes("doic_admin")) return null;

  const users = await loadManagedUsers(auth.userId);
  const accountAdmin = isAccountAdminConfigured();

  return (
    <>
    <DetailSection
      title="Create account"
      icon={UserPlus}
      description="Creates a confirmed email and password account; share the temporary password through a secure channel. Public sign-up is closed, so this is how people get accounts."
    >
      {accountAdmin ? (
        <CreateUserForm />
      ) : (
        <p className="px-5 py-4 text-[13px] text-muted-foreground">
          Account creation unavailable: the server has no Supabase secret key configured
          (SUPABASE_SECRET_KEY). Create accounts in the Supabase Dashboard, then grant access below.
        </p>
      )}
    </DetailSection>
    <DetailSection
      title="Portal access"
      icon={Users}
      description="Grant or remove roles. Internal roles open the Internal Portal (DoIC admin manages access, ISC team edits, Leadership reads); Student opens the Student Portal. Accounts without a role see an access-pending page."
    >
      {users === null ? (
        <p className="px-5 py-4 text-[13px] text-danger-fg">
          Couldn&apos;t load accounts. Refresh the page to try again.
        </p>
      ) : users.length === 0 ? (
        <p className="px-5 py-4 text-[13px] text-muted-foreground">No accounts yet.</p>
      ) : (
        <ul className="divide-y divide-hairline">
          {users.map((user) => (
            <UserRoleRow key={user.id} user={user} accountAdmin={accountAdmin} />
          ))}
        </ul>
      )}
    </DetailSection>
    </>
  );
}
