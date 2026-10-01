import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, primaryActionClass, secondaryActionClass } from "@/components/auth/auth-shell";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { defaultDestination } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Access pending",
  robots: { index: false, follow: false },
};

export default async function AccessPendingPage() {
  const auth = await requireUser();
  if (auth.roles.length > 0) redirect(defaultDestination(auth.roles));

  return (
    <AuthShell
      title="Access pending"
      lede={
        <>
          <p>Your account is authenticated, but portal access has not yet been assigned.</p>
          <p className="mt-3">
            Please contact the Directorate of International Collaborations / International Student
            Cell for access.
          </p>
        </>
      }
    >
      <div className="space-y-3">
        {auth.email ? (
          <p className="mb-5 text-[13px] text-muted-foreground">
            Signed in as <span className="text-fg-soft">{auth.email}</span>
          </p>
        ) : null}
        <Link href="/" className={primaryActionClass}>
          Back to DoIC Home
        </Link>
        <SignOutButton className={secondaryActionClass} />
      </div>
    </AuthShell>
  );
}
