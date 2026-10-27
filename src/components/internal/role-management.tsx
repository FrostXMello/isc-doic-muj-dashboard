import { UserPlus, Users } from "lucide-react";
import { CreateUserForm } from "@/components/internal/create-user-form";
import { DetailSection } from "@/components/internal/ui/detail";
import { FilterBar } from "@/components/internal/ui/filter-bar";
import { type ManagedUser, UserRoleRow } from "@/components/internal/user-role-row";
import { appRoles, roleLabels, type AppRole } from "@/lib/auth/roles";
import { getAuthContext } from "@/lib/auth/session";
import {
  type AccountStatus,
  accountStatuses,
  filterAccounts,
  loadAccountDirectory,
} from "@/lib/internal/data/accounts";
import { assignableRoles, can, canManageAccount, rolesForNewAccount } from "@/lib/internal/permissions";
import { isAccountAdminConfigured } from "@/lib/supabase/admin";

const statusLabels: Record<AccountStatus, string> = {
  active: "Active",
  "no-access": "No access assigned",
  deactivated: "Deactivated",
};

/**
 * Account directory for administrators. Reads and role changes run as the
 * signed-in administrator, so RLS on profiles and user_roles (and the guard
 * trigger) is what actually allows them; the controls shown here only mirror
 * the same rules from src/lib/internal/permissions.ts.
 */
export async function RoleManagement({ filters }: { filters: { q?: string; role?: AppRole; status?: AccountStatus } }) {
  const auth = await getAuthContext();
  if (auth.state !== "signed-in" || !can(auth.roles, "users:read")) return null;
  const actor = { id: auth.userId, roles: auth.roles };

  const directory = await loadAccountDirectory();
  const accountAdmin = isAccountAdminConfigured();
  const newAccountRoles = rolesForNewAccount(auth.roles);

  const rows: ManagedUser[] = filterAccounts(directory?.accounts ?? [], filters).map((account) => ({
    ...account,
    isSelf: account.id === auth.userId,
    assignable: assignableRoles(actor, account),
    manageable: canManageAccount(actor, account),
  }));

  return (
    <>
      {can(auth.roles, "users:manage") ? (
        <DetailSection
          title="Create account"
          icon={UserPlus}
          description="Creates a confirmed email and password account; share the temporary password through a secure channel. Public sign-up is closed and administrator accounts can't be self-registered."
        >
          {accountAdmin ? (
            <CreateUserForm allowedRoles={newAccountRoles} />
          ) : (
            <p className="px-4 sm:px-6 pt-1 pb-6 text-[13px] text-muted-foreground">
              Account creation unavailable: the server has no Supabase secret key configured (SUPABASE_SECRET_KEY).
            </p>
          )}
        </DetailSection>
      ) : null}

      <DetailSection
        title="Accounts"
        icon={Users}
        description="Grant or remove roles within your authority. Locked roles can only be changed by a Super admin; nobody changes their own. Passwords are never shown: you can only set a new one."
      >
        {directory === null ? (
          <p className="px-4 sm:px-6 pt-1 pb-6 text-[13px] text-danger-fg">Couldn&apos;t load accounts. Refresh the page to try again.</p>
        ) : (
          <>
            <div className="px-4 sm:px-6 pb-4">
              <FilterBar
                searchPlaceholder="Search by name or email"
                selects={[
                  { name: "role", label: "Role", allLabel: "All roles", options: appRoles.map((role) => ({ value: role, label: roleLabels[role] })) },
                  {
                    name: "status",
                    label: "Status",
                    allLabel: "All statuses",
                    options: accountStatuses.map((status) => ({ value: status, label: statusLabels[status] })),
                  },
                ]}
                resultCount={rows.length}
                totalCount={directory.accounts.length}
                noun={{ singular: "account", plural: "accounts" }}
              />
              {!directory.signInStatusAvailable ? (
                <p className="mt-2 text-[12px] text-fg-faint">Sign-in history is unavailable without the server&apos;s Supabase secret key.</p>
              ) : null}
            </div>
            {rows.length === 0 ? (
              <p className="px-4 sm:px-6 pt-1 pb-6 text-[13px] text-muted-foreground">No accounts match.</p>
            ) : (
              <ul className="divide-y divide-hairline border-t border-hairline">
                {rows.map((user) => (
                  <UserRoleRow
                    key={user.id}
                    user={user}
                    accountAdmin={accountAdmin && can(auth.roles, "users:manage")}
                    deactivationAvailable={directory.deactivationAvailable}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </DetailSection>
    </>
  );
}
