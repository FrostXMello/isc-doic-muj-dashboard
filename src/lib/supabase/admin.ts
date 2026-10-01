import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Auth Admin client, for account creation, password resets, and
 * account deletion only. It bypasses row level security, so it may be used
 * solely inside server actions that have already verified the caller is a
 * doic_admin. Never use it to read or write app tables, and never expose the
 * key: SUPABASE_SECRET_KEY must not have a NEXT_PUBLIC_ prefix.
 */
export function getSupabaseAdminAuth(): SupabaseClient["auth"]["admin"] | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  }).auth.admin;
}

export function isAccountAdminConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}
