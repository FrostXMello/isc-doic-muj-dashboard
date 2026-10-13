import "server-only";
import { type AppRole, isAppRole } from "@/lib/auth/roles";
import { listSignInStatus } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AccountStatus = "active" | "deactivated" | "no-access";

export type AccountRow = {
  id: string;
  name: string | null;
  email: string | null;
  roles: AppRole[];
  status: AccountStatus;
  lastSignInAt: string | null;
  signInBlocked: boolean;
};

type ProfileRow = { id: string; email: string | null; full_name: string | null; deactivated_at?: string | null };

export type AccountDirectory = {
  accounts: AccountRow[];
  /** False until migration 20261005090100 adds profiles.deactivated_at. */
  deactivationAvailable: boolean;
  signInStatusAvailable: boolean;
};

/**
 * Every account with its roles and status, read as the signed-in
 * administrator: RLS on profiles and user_roles decides what is visible.
 * Sign-in facts come from the Auth Admin API (see listSignInStatus).
 */
export async function loadAccountDirectory(): Promise<AccountDirectory | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const readProfiles = async (withStatus: boolean) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(withStatus ? "id, email, full_name, deactivated_at" : "id, email, full_name")
      .order("email");
    return { data: data as unknown as ProfileRow[] | null, error };
  };
  let deactivationAvailable = true;
  let profiles = await readProfiles(true);
  if (profiles.error?.code === "42703") {
    deactivationAvailable = false;
    profiles = await readProfiles(false);
  }
  const [grants, signIn] = await Promise.all([supabase.from("user_roles").select("user_id, role"), listSignInStatus()]);
  if (profiles.error || !profiles.data || grants.error) return null;

  const rolesByUser = new Map<string, AppRole[]>();
  for (const grant of grants.data) {
    if (!isAppRole(grant.role)) continue;
    rolesByUser.set(grant.user_id, [...(rolesByUser.get(grant.user_id) ?? []), grant.role]);
  }

  const accounts = profiles.data.map(
    (profile): AccountRow => {
      const roles = rolesByUser.get(profile.id) ?? [];
      const status = signIn?.get(profile.id);
      return {
        id: profile.id,
        name: profile.full_name?.trim() || null,
        email: profile.email,
        roles,
        status: profile.deactivated_at ? "deactivated" : roles.length === 0 ? "no-access" : "active",
        lastSignInAt: status?.lastSignInAt ?? null,
        signInBlocked: status?.signInBlocked ?? false,
      };
    },
  );
  return { accounts, deactivationAvailable, signInStatusAvailable: signIn !== null };
}

export const accountStatuses: readonly AccountStatus[] = ["active", "no-access", "deactivated"];

export function filterAccounts(
  accounts: readonly AccountRow[],
  filters: { q?: string; role?: AppRole; status?: AccountStatus },
) {
  const needle = filters.q?.trim().toLowerCase();
  return accounts.filter(
    (account) =>
      (!needle || account.email?.toLowerCase().includes(needle) || account.name?.toLowerCase().includes(needle)) &&
      (!filters.role || account.roles.includes(filters.role)) &&
      (!filters.status || account.status === filters.status),
  );
}
