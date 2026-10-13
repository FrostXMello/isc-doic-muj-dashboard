import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role access, kept to two narrow uses: the Auth Admin API (account
 * creation, password resets, sign-in bans, deletion) and appending account
 * events to the audit log. It bypasses row level security, so callers must
 * be server actions that have already checked the caller's authority over
 * the target account. Never use it to read or write other tables, and never
 * expose the key: SUPABASE_SECRET_KEY must not have a NEXT_PUBLIC_ prefix.
 */
function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function getSupabaseAdminAuth(): SupabaseClient["auth"]["admin"] | null {
  return serviceClient()?.auth.admin ?? null;
}

export function isAccountAdminConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

export type SignInStatus = { lastSignInAt: string | null; signInBlocked: boolean };

/**
 * Last sign-in and whether sign-in is blocked, per account. Only these two
 * facts leave this function: never tokens, factors, or identities. Callers
 * must have checked `users:read`.
 */
export async function listSignInStatus(): Promise<Map<string, SignInStatus> | null> {
  const admin = getSupabaseAdminAuth();
  if (!admin) return null;
  const status = new Map<string, SignInStatus>();
  const now = Date.now();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.listUsers({ page, perPage: 1000 });
    if (error) return null;
    for (const user of data.users) {
      status.set(user.id, {
        lastSignInAt: user.last_sign_in_at ?? null,
        signInBlocked: Boolean(user.banned_until && Date.parse(user.banned_until) > now),
      });
    }
    if (data.users.length < 1000) break;
  }
  return status;
}

export type AccountEvent =
  | "account-created"
  | "account-deleted"
  | "account-deactivated"
  | "account-reactivated"
  | "password-set";

const eventAction: Record<AccountEvent, "INSERT" | "UPDATE" | "DELETE"> = {
  "account-created": "INSERT",
  "account-deleted": "DELETE",
  "account-deactivated": "UPDATE",
  "account-reactivated": "UPDATE",
  "password-set": "UPDATE",
};

/**
 * Appends an Auth event to the audit log. `actorId` must come from the
 * verified session. Details must never contain passwords or tokens.
 */
export async function recordAccountEvent(
  actorId: string,
  targetId: string,
  event: AccountEvent,
  details: { email?: string | null; roles?: readonly string[] } = {},
): Promise<boolean> {
  const client = serviceClient();
  if (!client) return false;
  const summary = { event, ...details };
  const { error } = await client.from("audit_logs").insert({
    actor_id: actorId,
    table_name: "auth.users",
    record_id: targetId,
    action: eventAction[event],
    old_data: eventAction[event] === "DELETE" ? summary : null,
    new_data: eventAction[event] === "DELETE" ? null : summary,
  });
  if (error) console.error("Audit log write failed:", error.code);
  return !error;
}
