import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth/next-path";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const otpTypes: readonly EmailOtpType[] = ["recovery", "invite", "email", "signup", "email_change"];

/**
 * Landing point for links in Supabase auth emails. Handles both the PKCE
 * `?code=` redirect (default email templates) and the `?token_hash=&type=`
 * pattern (custom templates), then continues to `next`.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type");
  const rawNext = params.get("next");
  const isRecovery = rawNext === "/reset-password" || type === "recovery" || type === "invite";
  const destination = isRecovery ? "/reset-password" : (safeNextPath(rawNext) ?? "/login");
  const failure = isRecovery ? "/forgot-password?error=link-expired" : "/login?notice=link-expired";

  const supabase = await createSupabaseServerClient();
  const code = params.get("code");
  const tokenHash = params.get("token_hash");

  let ok = false;
  if (supabase && !params.get("error")) {
    try {
      if (code) {
        ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
      } else if (tokenHash && otpTypes.includes(type as EmailOtpType)) {
        ok = !(await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash }))
          .error;
      }
    } catch {
      ok = false;
    }
  }

  return NextResponse.redirect(new URL(ok ? destination : failure, request.url));
}
