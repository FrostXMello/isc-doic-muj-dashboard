import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell, primaryActionClass, secondaryActionClass } from "@/components/auth/auth-shell";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { defaultDestination } from "@/lib/auth/roles";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Access not permitted",
  robots: { index: false, follow: false },
};

export default async function UnauthorizedPage() {
  const auth = await requireUser();
  const home = defaultDestination(auth.roles);
  const homeLabel =
    home === "/internal" ? "Go to the Internal Portal" : home === "/student-portal" ? "Go to the Student Portal" : "Back to DoIC Home";

  return (
    <AuthShell
      title="Access not permitted"
      lede="Your account doesn't have access to that area of the DoIC portal. If you think this is a mistake, contact the Directorate of International Collaborations / International Student Cell."
    >
      <div className="space-y-3">
        <Link href={home === "/access-pending" ? "/" : home} className={primaryActionClass}>
          {homeLabel}
        </Link>
        <SignOutButton className={secondaryActionClass} />
      </div>
    </AuthShell>
  );
}
