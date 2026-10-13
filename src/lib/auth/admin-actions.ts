"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { MIN_ADMIN_PASSWORD_LENGTH, type RoleChangeState } from "@/lib/auth/form-state";
import { type AppRole, isAppRole, roleLabels } from "@/lib/auth/roles";
import { getAuthContext } from "@/lib/auth/session";
import {
  type Account,
  canAssignRole,
  canManageAccount,
  isAdmin,
  rolesForNewAccount,
} from "@/lib/internal/permissions";
import { type AccountEvent, getSupabaseAdminAuth, recordAccountEvent } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Account and role management.
 *
 * Role grants and account (de)activation run through the administrator's own
 * session, so user_roles RLS, its guard trigger, and set_account_active()
 * enforce the hierarchy in the database. Auth Admin API calls (create, set
 * password, ban, delete) use the service role, so the hierarchy check here
 * is their boundary: the target's roles are always re-read on the server,
 * never taken from the form. Every change is written to the audit log.
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BAN_DURATION = "876000h";
const USERS_PATH = "/internal/admin/users";

const notAdmin: RoleChangeState = { error: "Only administrators can manage accounts." };
const outsideAuthority: RoleChangeState = {
  error:
    "That account is outside your authority. Only a Super admin manages administrator accounts, and nobody changes their own.",
};
const accountsUnavailable: RoleChangeState = {
  error: "Account management is unavailable: the server has no Supabase secret key configured.",
};
const tryAgain: RoleChangeState = { error: "Couldn't complete the change. Please try again." };

type Actor = { account: Account; supabase: SupabaseClient };

async function adminActor(): Promise<Actor | RoleChangeState> {
  const auth = await getAuthContext();
  if (auth.state !== "signed-in" || !isAdmin(auth.roles)) return notAdmin;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return notAdmin;
  return { account: { id: auth.userId, roles: auth.roles }, supabase };
}

function isState(value: unknown): value is RoleChangeState {
  return typeof value === "object" && value !== null && !("account" in value);
}

/** The target's current grants, read as the administrator (RLS lets admins read all). */
async function targetAccount(supabase: SupabaseClient, userId: string): Promise<Account | null> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) return null;
  return { id: userId, roles: (data ?? []).map((row) => row.role).filter(isAppRole) };
}

async function targetEmail(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from("profiles").select("email").eq("id", userId).maybeSingle();
  return (data?.email as string | null | undefined) ?? null;
}

function readUserId(formData: FormData): string | null {
  const userId = formData.get("userId");
  return typeof userId === "string" && UUID_PATTERN.test(userId) ? userId : null;
}

function readPassword(formData: FormData): string | RoleChangeState {
  const password = formData.get("password");
  if (typeof password !== "string" || password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    return { error: `Use a password of at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.` };
  }
  if (password.length > 72) return { error: "Use a password of at most 72 characters." };
  return password;
}

/** Resolves the actor and checks their authority over `userId`. */
async function managedTarget(userId: string): Promise<(Actor & { target: Account }) | RoleChangeState> {
  const actor = await adminActor();
  if (isState(actor)) return actor;
  const target = await targetAccount(actor.supabase, userId);
  if (!target) return tryAgain;
  if (!canManageAccount(actor.account, target)) return outsideAuthority;
  return { ...actor, target };
}

async function audited(actorId: string, targetId: string, event: AccountEvent, details?: Parameters<typeof recordAccountEvent>[3]) {
  const written = await recordAccountEvent(actorId, targetId, event, details);
  return written ? "" : " The audit entry couldn't be written; tell a Super admin.";
}

export async function createUserAccount(
  _state: RoleChangeState,
  formData: FormData,
): Promise<RoleChangeState> {
  const emailInput = formData.get("email");
  const email = typeof emailInput === "string" ? emailInput.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email) || email.length > 254) return { error: "Enter a valid email address." };

  const nameInput = formData.get("fullName");
  const fullName = typeof nameInput === "string" ? nameInput.trim().slice(0, 120) : "";

  const password = readPassword(formData);
  if (typeof password !== "string") return password;

  const roleInputs = formData.getAll("roles");
  if (!roleInputs.every(isAppRole)) return { error: "Unknown role." };
  const roles = [...new Set(roleInputs as AppRole[])];

  const actor = await adminActor();
  if (isState(actor)) return actor;
  const allowed = rolesForNewAccount(actor.account.roles);
  const refused = roles.filter((role) => !allowed.includes(role));
  if (refused.length > 0) {
    return { error: `You can't grant ${refused.map((role) => roleLabels[role]).join(", ")}.` };
  }
  const admin = getSupabaseAdminAuth();
  if (!admin) return accountsUnavailable;

  const { data, error } = await admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });
  if (error || !data.user) {
    if (error?.code === "email_exists" || error?.code === "user_already_exists") {
      return { error: "An account with this email already exists." };
    }
    if (error?.code === "weak_password") return { error: "That password is too weak. Choose a stronger one." };
    return { error: "Couldn't create the account. Please try again." };
  }

  const auditNote = await audited(actor.account.id, data.user.id, "account-created", { email, roles });

  if (roles.length > 0) {
    const { error: grantError } = await actor.supabase
      .from("user_roles")
      .insert(roles.map((role) => ({ user_id: data.user.id, role })));
    if (grantError) {
      revalidatePath(USERS_PATH);
      return { error: `Account created for ${email}, but its roles couldn't be granted. Grant them below.` };
    }
  }

  revalidatePath(USERS_PATH);
  return {
    message: `Account created for ${email}${roles.length ? ` with ${roles.map((role) => roleLabels[role]).join(", ")}` : " with no access yet"}.${auditNote}`,
  };
}

export async function resetUserPassword(
  _state: RoleChangeState,
  formData: FormData,
): Promise<RoleChangeState> {
  const userId = readUserId(formData);
  if (!userId) return { error: "Unknown user." };
  const password = readPassword(formData);
  if (typeof password !== "string") return password;

  const context = await managedTarget(userId);
  if (isState(context)) return context;
  const admin = getSupabaseAdminAuth();
  if (!admin) return accountsUnavailable;

  const { error } = await admin.updateUserById(userId, { password });
  if (error) {
    if (error.code === "user_not_found") return { error: "That account no longer exists." };
    if (error.code === "weak_password") return { error: "That password is too weak. Choose a stronger one." };
    return { error: "Couldn't set the password. Please try again." };
  }
  const auditNote = await audited(context.account.id, userId, "password-set");
  return { message: `Password updated. Share it with the user through a secure channel.${auditNote}` };
}

export async function setAccountActive(
  _state: RoleChangeState,
  formData: FormData,
): Promise<RoleChangeState> {
  const userId = readUserId(formData);
  if (!userId) return { error: "Unknown user." };
  const intent = formData.get("intent");
  if (intent !== "deactivate" && intent !== "reactivate") return { error: "Unknown change." };
  const active = intent === "reactivate";
  if (!active && formData.get("confirm") !== "on") {
    return { error: "Tick the confirmation box to deactivate this account." };
  }

  const context = await managedTarget(userId);
  if (isState(context)) return context;
  const admin = getSupabaseAdminAuth();
  if (!admin) return accountsUnavailable;

  // The database decides first: it re-checks authority and protects the last Super admin.
  const { error: rpcError } = await context.supabase.rpc("set_account_active", {
    target_user: userId,
    active,
  });
  if (rpcError) {
    if (rpcError.code === "PGRST202") {
      return { error: "Deactivation needs the latest database migration (20261005090100_admin_control)." };
    }
    if (rpcError.code === "42501") return outsideAuthority;
    if (rpcError.code === "23514") return { error: "The last active Super admin can't be deactivated." };
    return tryAgain;
  }

  const { error } = await admin.updateUserById(userId, { ban_duration: active ? "none" : BAN_DURATION });
  if (error) {
    return {
      error: active
        ? "Portal access was restored, but sign-in couldn't be re-enabled. Try again."
        : "Portal access was removed, but sign-in couldn't be blocked. Try again.",
    };
  }

  const auditNote = await audited(
    context.account.id,
    userId,
    active ? "account-reactivated" : "account-deactivated",
    { email: await targetEmail(context.supabase, userId) },
  );
  revalidatePath(USERS_PATH);
  return {
    message: active
      ? `Account reactivated; its roles apply again.${auditNote}`
      : `Account deactivated: it can't sign in and holds no access. Roles are kept for reactivation.${auditNote}`,
  };
}

export async function deleteUserAccount(
  _state: RoleChangeState,
  formData: FormData,
): Promise<RoleChangeState> {
  const userId = readUserId(formData);
  if (!userId) return { error: "Unknown user." };
  if (formData.get("confirm") !== "on") return { error: "Tick the confirmation box to delete this account." };

  const context = await managedTarget(userId);
  if (isState(context)) return context;
  if (context.target.roles.includes("super_admin")) {
    return { error: "Revoke Super admin first; the last Super admin can never be deleted." };
  }
  const admin = getSupabaseAdminAuth();
  if (!admin) return accountsUnavailable;

  const email = await targetEmail(context.supabase, userId);
  const { error } = await admin.deleteUser(userId);
  if (error && error.code !== "user_not_found") return { error: "Couldn't delete the account. Please try again." };

  const auditNote = await audited(context.account.id, userId, "account-deleted", {
    email,
    roles: context.target.roles,
  });
  revalidatePath(USERS_PATH);
  return { message: `Account deleted.${auditNote}` };
}

/**
 * Grants or revokes one role. The database enforces the same rule
 * (private.can_assign_role) and audits the change through its trigger.
 */
export async function changeUserRole(
  _state: RoleChangeState,
  formData: FormData,
): Promise<RoleChangeState> {
  const userId = readUserId(formData);
  const role = formData.get("role");
  const intent = formData.get("intent");
  if (!userId) return { error: "Unknown user." };
  if (!isAppRole(role)) return { error: "Unknown role." };
  if (intent !== "grant" && intent !== "revoke") return { error: "Unknown change." };

  const actor = await adminActor();
  if (isState(actor)) return actor;
  const target = await targetAccount(actor.supabase, userId);
  if (!target) return tryAgain;
  if (!canAssignRole(actor.account, target, role)) {
    if (userId === actor.account.id) return { error: "You can't change your own roles. Ask another administrator." };
    return {
      error: `You can't ${intent === "grant" ? "grant" : "remove"} ${roleLabels[role]} on this account. Only a Super admin manages administrator roles.`,
    };
  }

  if (intent === "grant") {
    const { error } = await actor.supabase.from("user_roles").insert({ user_id: userId, role });
    if (error && error.code !== "23505") {
      if (error.code === "42501") return outsideAuthority;
      if (error.code === "23503") return { error: "That account no longer exists." };
      return tryAgain;
    }
  } else {
    // RLS turns a disallowed delete into "zero rows", so ask for the rows back.
    const { data, error } = await actor.supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role)
      .select("role");
    if (error) {
      if (error.code === "23514") return { error: "The last active Super admin can't be removed." };
      if (error.code === "42501") return outsideAuthority;
      return tryAgain;
    }
    if (!data || data.length === 0) {
      return { error: `Couldn't remove ${roleLabels[role]}; it may already be removed.` };
    }
  }

  revalidatePath(USERS_PATH);
  return {
    message: intent === "grant" ? `${roleLabels[role]} granted.` : `${roleLabels[role]} removed.`,
  };
}
