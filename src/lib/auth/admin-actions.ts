"use server";

import { revalidatePath } from "next/cache";
import { MIN_ADMIN_PASSWORD_LENGTH, type RoleChangeState } from "@/lib/auth/form-state";
import { type AppRole, isAppRole, roleLabels } from "@/lib/auth/roles";
import { getAuthContext } from "@/lib/auth/session";
import { getSupabaseAdminAuth } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const notPermitted: RoleChangeState = { error: "Only DoIC admins can change portal access." };
const accountsUnavailable: RoleChangeState = {
  error: "Account management is unavailable: the server has no Supabase secret key configured.",
};

async function isDoicAdmin() {
  const auth = await getAuthContext();
  return auth.state === "signed-in" && auth.roles.includes("doic_admin") ? auth : null;
}

function readPassword(formData: FormData): string | RoleChangeState {
  const password = formData.get("password");
  if (typeof password !== "string" || password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    return { error: `Use a password of at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.` };
  }
  if (password.length > 72) return { error: "Use a password of at most 72 characters." };
  return password;
}

/**
 * Creates a confirmed email + password account and grants the chosen roles.
 * The Auth Admin API is used only for the account itself; role grants run
 * through the admin's own session, so user_roles RLS still decides them.
 */
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

  if (!(await isDoicAdmin())) return notPermitted;
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

  if (roles.length > 0) {
    const supabase = await createSupabaseServerClient();
    const { error: grantError } = supabase
      ? await supabase.from("user_roles").insert(roles.map((role) => ({ user_id: data.user.id, role })))
      : { error: true };
    if (grantError) {
      revalidatePath("/internal/settings");
      return { error: `Account created for ${email}, but its roles couldn't be granted. Grant them below.` };
    }
  }

  revalidatePath("/internal/settings");
  return {
    message: `Account created for ${email}${roles.length ? ` with ${roles.map((role) => roleLabels[role]).join(", ")}` : " with no access yet"}.`,
  };
}

export async function resetUserPassword(
  _state: RoleChangeState,
  formData: FormData,
): Promise<RoleChangeState> {
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !UUID_PATTERN.test(userId)) return { error: "Unknown user." };
  const password = readPassword(formData);
  if (typeof password !== "string") return password;

  const auth = await isDoicAdmin();
  if (!auth) return notPermitted;
  if (userId === auth.userId) return { error: "Change your own password with Forgot password on the sign-in page." };
  const admin = getSupabaseAdminAuth();
  if (!admin) return accountsUnavailable;

  const { error } = await admin.updateUserById(userId, { password });
  if (error) {
    if (error.code === "user_not_found") return { error: "That account no longer exists." };
    if (error.code === "weak_password") return { error: "That password is too weak. Choose a stronger one." };
    return { error: "Couldn't set the password. Please try again." };
  }
  return { message: "Password updated. Share it with the user through a secure channel." };
}

export async function deleteUserAccount(
  _state: RoleChangeState,
  formData: FormData,
): Promise<RoleChangeState> {
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !UUID_PATTERN.test(userId)) return { error: "Unknown user." };
  if (formData.get("confirm") !== "on") return { error: "Tick the confirmation box to delete this account." };

  const auth = await isDoicAdmin();
  if (!auth) return notPermitted;
  if (userId === auth.userId) return { error: "You can't delete your own account." };
  const admin = getSupabaseAdminAuth();
  if (!admin) return accountsUnavailable;

  const { error } = await admin.deleteUser(userId);
  if (error && error.code !== "user_not_found") return { error: "Couldn't delete the account. Please try again." };

  revalidatePath("/internal/settings");
  return { message: "Account deleted." };
}

/**
 * Grants or revokes one role. Runs as the signed-in admin, so the user_roles
 * RLS policies are the real boundary: only doic_admin may write, and an admin
 * cannot remove their own doic_admin grant. The checks here only give clear
 * messages; they do not replace RLS.
 */
export async function changeUserRole(
  _state: RoleChangeState,
  formData: FormData,
): Promise<RoleChangeState> {
  const userId = formData.get("userId");
  const role = formData.get("role");
  const intent = formData.get("intent");

  if (typeof userId !== "string" || !UUID_PATTERN.test(userId)) return { error: "Unknown user." };
  if (!isAppRole(role)) return { error: "Unknown role." };
  if (intent !== "grant" && intent !== "revoke") return { error: "Unknown change." };

  const auth = await getAuthContext();
  if (auth.state !== "signed-in" || !auth.roles.includes("doic_admin")) return notPermitted;

  if (intent === "revoke" && role === "doic_admin" && userId === auth.userId) {
    return { error: "You can't remove your own DoIC admin access. Ask another DoIC admin." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return notPermitted;

  if (intent === "grant") {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error && error.code !== "23505") {
      if (error.code === "42501") return notPermitted;
      if (error.code === "23503") return { error: "That account no longer exists." };
      return { error: "Couldn't update access. Please try again." };
    }
  } else {
    // RLS turns a disallowed delete into "zero rows", so ask for the rows back.
    const { data, error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role)
      .select("role");
    if (error) return { error: "Couldn't update access. Please try again." };
    if (!data || data.length === 0) {
      return { error: `Couldn't remove ${roleLabels[role]}; it may already be removed.` };
    }
  }

  revalidatePath("/internal/settings");
  return {
    message: intent === "grant" ? `${roleLabels[role]} granted.` : `${roleLabels[role]} removed.`,
  };
}
