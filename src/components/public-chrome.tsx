"use client";

import { Navbar } from "@/components/navbar/navbar";
import { Footer } from "@/components/footer/footer";
import { usePathname } from "next/navigation";

/**
 * Conditionally renders the public site chrome (Navbar + Footer).
 *
 * Pages under /internal use the PortalShell layout instead, so we
 * suppress the public navigation and footer on those routes.
 */
export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInternal = pathname.startsWith("/internal");

  if (isInternal) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
