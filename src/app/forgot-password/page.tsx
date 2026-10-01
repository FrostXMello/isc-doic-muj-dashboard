import type { Metadata } from "next";
import { AuthShell, FormNotice } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { authMessages } from "@/lib/auth/form-state";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  const { error } = await searchParams;
  const notice =
    error === "link-expired" ? <FormNotice tone="error">{authMessages.linkExpired}</FormNotice> : null;

  return (
    <AuthShell
      title="Reset your password"
      lede="Enter the email address of your DoIC portal account and we'll send you a link to set a new password."
    >
      <ForgotPasswordForm notice={notice} />
    </AuthShell>
  );
}
