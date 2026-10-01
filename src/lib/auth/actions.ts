"use server";

import { type AuthError, isAuthRetryableFetchError } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  type PasswordResetRequestState,
  type PasswordUpdateState,
  type SignInState,
  authMessages,
} from "@/lib/auth/form-state";
import { destinationFor } from "@/lib/auth/next-path";
import { fetchUserRoles } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isNetworkFailure(error: unknown) {
  if (isAuthRetryableFetchError(error)) return true;
  const status = (error as AuthError | null)?.status;
  return status === 0 || (typeof status === "number" && status >= 500);
}

function isRateLimited(error: AuthError) {
  return error.status === 429 || error.code === "over_request_rate_limit";
}

/**
 * Base URL for links in auth emails. NEXT_PUBLIC_SITE_URL wins when set;
 * otherwise the request origin. Supabase only redirects to URLs on the
 * project's allow list, so a forged Host header cannot redirect elsewhere.
 */
async function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return new URL(configured).origin;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const proto =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signIn(_state: SignInState, formData: FormData): Promise<SignInState> {
  const email = readString(formData, "email").trim();
  const password = readString(formData, "password");
  const next = readString(formData, "next");

  if (!EMAIL_PATTERN.test(email) || password.length === 0) {
    return { error: "Enter your email address and password.", email };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: authMessages.unavailable, email };

  let destination: string;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      if (error && isNetworkFailure(error)) return { error: authMessages.network, email };
      if (error && isRateLimited(error)) return { error: authMessages.rateLimited, email };
      return { error: authMessages.invalidCredentials, email };
    }
    const roles = await fetchUserRoles(supabase, data.user.id);
    destination = destinationFor(roles, next);
  } catch {
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    return { error: authMessages.network, email };
  }

  redirect(destination);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    // The refresh token may already be revoked; clear the local cookies regardless.
    if (error) await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
  }
  redirect("/login?notice=signed-out");
}

export async function requestPasswordReset(
  _state: PasswordResetRequestState,
  formData: FormData,
): Promise<PasswordResetRequestState> {
  const email = readString(formData, "email").trim();
  if (!EMAIL_PATTERN.test(email)) return { error: "Enter a valid email address.", email };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: authMessages.unavailable, email };

  try {
    const redirectTo = `${await siteOrigin()}/auth/callback?next=/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    // Any other outcome (unknown address, rate limit) gets the same answer, so
    // the form cannot be used to discover which emails have accounts.
    if (error && isNetworkFailure(error)) return { error: authMessages.network, email };
  } catch {
    return { error: authMessages.network, email };
  }

  return { sent: true };
}

export async function updatePassword(
  _state: PasswordUpdateState,
  formData: FormData,
): Promise<PasswordUpdateState> {
  const password = readString(formData, "password");
  const confirm = readString(formData, "confirm");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Use at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirm) return { error: "The passwords do not match." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: authMessages.unavailable };

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return { error: authMessages.linkExpired, expired: true };

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      if (isNetworkFailure(error)) return { error: authMessages.network };
      if (error.code === "weak_password") {
        return { error: "Choose a stronger password: mix letters, numbers, and symbols." };
      }
      if (error.code === "same_password") {
        return { error: "Choose a password different from your current one." };
      }
      if (error.code === "session_not_found" || error.code === "session_expired") {
        return { error: authMessages.linkExpired, expired: true };
      }
      return { error: "We couldn't update your password. Please try again." };
    }

    // Sign out every session so the new password is required everywhere.
    await supabase.auth.signOut();
  } catch {
    return { error: authMessages.network };
  }

  redirect("/login?notice=password-updated");
}
