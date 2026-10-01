"use server";

import { revalidatePath } from "next/cache";
import type { RoleChangeState } from "@/lib/auth/form-state";
import { isAppRole, roleLabels } from "@/lib/auth/roles";
import { getAuthContext } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const notPermitted: RoleChangeState = { error: "Only DoIC admins can change portal access." };

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
