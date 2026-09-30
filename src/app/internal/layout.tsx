import type { Metadata } from "next";
import { PortalShell } from "@/components/internal/portal-shell";

export const metadata: Metadata = {
  title: {
    default: "Internal Portal",
    template: "%s · Internal Portal · DoIC MUJ",
  },
  description:
    "Staff workspace for the Directorate of International Collaboration at Manipal University Jaipur.",
  robots: { index: false, follow: false },
};

/**
 * Layout for /internal/* routes.
 *
 * Overrides the root layout's Navbar and Footer by wrapping children in the
 * PortalShell. The root layout still provides html/body, fonts, and globals.
 *
 * The `robots` metadata prevents search engines from indexing staff pages.
 * Authentication will be added in a later stage — this layout is the place
 * where an auth guard will eventually wrap the shell.
 */
export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
