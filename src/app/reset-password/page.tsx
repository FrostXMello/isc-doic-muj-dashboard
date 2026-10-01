import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell, FormNotice, primaryActionClass } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { authMessages } from "@/lib/auth/form-state";
import { getAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

/** Reached from the reset email via /auth/callback, which signs the user in. */
export default async function ResetPasswordPage() {
  const auth = await getAuthContext();

  if (auth.state !== "signed-in") {
    return (
      <AuthShell title="Link expired" lede="We couldn't verify your password reset link.">
        <div className="space-y-6">
          <FormNotice tone="error">{authMessages.linkExpired}</FormNotice>
          <Link href="/forgot-password" className={primaryActionClass}>
            Request a new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      lede={
        <>
          Choose a new password for <span className="text-fg-soft">{auth.email}</span>. You will
          be signed out everywhere and asked to sign in again.
        </>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
