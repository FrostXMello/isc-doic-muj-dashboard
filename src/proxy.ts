import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * Refreshes the Supabase auth session before Internal Portal pages render,
 * because Server Components cannot write cookies. A no-op unless
 * INTERNAL_DATA_SOURCE=supabase and Supabase is configured. The public site
 * is not matched.
 */
export async function proxy(request: NextRequest) {
  const env = getSupabasePublicEnv();
  if (process.env.INTERNAL_DATA_SOURCE !== "supabase" || !env) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ["/internal/:path*"],
};
