import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { REMEMBER_COOKIE, rememberFromCookie, withRememberPreference } from "@/lib/supabase/remember";

/**
 * Supabase client for Server Components, Server Functions, and Route
 * Handlers. It acts as the signed-in user (session cookies), so every query
 * is subject to row level security. Create one per request.
 *
 * Returns null when Supabase is not configured.
 */
export async function createSupabaseServerClient({ remember }: { remember?: boolean } = {}) {
  const env = getSupabasePublicEnv();
  if (!env) return null;

  const cookieStore = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        const keep = remember ?? rememberFromCookie(cookieStore.get(REMEMBER_COOKIE)?.value);
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, withRememberPreference(options, keep));
          }
        } catch {
          // Server Components cannot set cookies. The proxy refreshes the
          // session before rendering, so this write can be skipped.
        }
      },
    },
  });
}
