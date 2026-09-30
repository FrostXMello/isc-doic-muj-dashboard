"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/** Supabase client for Client Components. Returns null when not configured. */
export function createSupabaseBrowserClient() {
  const env = getSupabasePublicEnv();
  return env ? createBrowserClient(env.url, env.key) : null;
}
