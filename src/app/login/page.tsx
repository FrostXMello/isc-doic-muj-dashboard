import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell, FormNotice } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { authMessages } from "@/lib/auth/form-state";
import { destinationFor, safeNextPath } from "@/lib/auth/next-path";
import { getAuthContext } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const notices: Record<string, { tone: "info" | "success" | "error"; text: string }> = {
  "session-expired": { tone: "info", text: "Your session has expired. Please sign in again." },
  "signed-out": { tone: "success", text: "You have been signed out." },
  "password-updated": {
    tone: "success",
    text: "Your password has been updated. Sign in with your new password.",
  },
  "link-expired": { tone: "error", text: "This sign-in link is invalid or has expired." },
  unavailable: { tone: "error", text: authMessages.unavailable },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : null;
  const next = safeNextPath(rawNext);

  const auth = await getAuthContext();
  if (auth.state === "signed-in") redirect(destinationFor(auth.roles, next));

  const noticeKey =
    auth.state === "unconfigured" || auth.state === "error"
      ? "unavailable"
      : typeof params.notice === "string"
        ? params.notice
        : null;
  const notice = noticeKey ? notices[noticeKey] : undefined;

  return (
    <AuthShell title="Welcome back" lede="Sign in to continue to the DoIC portal.">
      <LoginForm
        next={next}
        notice={notice ? <FormNotice tone={notice.tone}>{notice.text}</FormNotice> : null}
      />
    </AuthShell>
  );
}
