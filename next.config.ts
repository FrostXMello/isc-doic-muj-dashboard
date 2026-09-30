import type { NextConfig } from "next";

/**
 * Partner pages from the earlier illustrative directory whose institutions are
 * not on the official MUJ partner page. Temporary (307), so the URLs can come
 * back if DoIC confirms a partnership. Kept in sync with
 * legacyDirectoryInstitutions by scripts/check-data-quality.ts.
 */
export const retiredPartnerSlugs = [
  "university-of-birmingham",
  "lancaster-university",
  "macquarie-university",
  "boston-university",
  "university-of-massachusetts",
  "technical-university-of-munich",
  "lmu-munich",
  "university-of-wollongong-in-dubai",
  "middlesex-university-dubai",
  "national-university-of-singapore",
  "singapore-management-university",
  "sciences-po",
  "waseda-university",
  "university-of-toronto",
  "university-of-amsterdam",
  "yonsei-university",
];

const nextConfig: NextConfig = {
  // Dev resources are blocked when the browser host is not the one Next
  // inferred. 127.0.0.1 is how this environment opens the site.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  redirects() {
    return retiredPartnerSlugs.map((slug) => ({
      source: `/partners/${slug}`,
      destination: "/partners",
      permanent: false,
    }));
  },
};

export default nextConfig;
