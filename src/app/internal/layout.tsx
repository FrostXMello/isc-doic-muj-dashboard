import type { Metadata } from "next";
import { PortalShell } from "@/components/internal/portal-shell";
import { getAccountSummary, requirePortalAccess } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: {
    default: "Internal Portal",
    template: "%s · Internal Portal · DoIC MUJ",
  },
  description:
    "Staff workspace for the Directorate of International Collaborations (DoIC) at Manipal University Jaipur.",
  robots: { index: false, follow: false },
};

/**
 * Layout for /internal/* routes.
 *
 * Overrides the root layout's Navbar and Footer by wrapping children in the
 * PortalShell. The root layout still provides html/body, fonts, and globals.
 *
 * Only internal roles (doic_admin, isc_team, leadership) get past the guard;
 * the proxy applies the same rule earlier. The `robots` metadata prevents
 * search engines from indexing staff pages.
 */
export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  await requirePortalAccess("internal", "/internal");
  const account = await getAccountSummary();

  return <PortalShell account={account}>{children}</PortalShell>;
}
