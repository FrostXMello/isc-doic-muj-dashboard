import type { NextConfig } from "next";

/**
 * Partner pages from the earlier illustrative directory whose institutions are
 * not on the official MUJ partner page, under both /partners and
 * /student-portal/partners. Temporary (307), so the URLs can come
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
    // Retired slugs come first so they skip the generic /partners/:slug move.
    const retired = retiredPartnerSlugs.flatMap((slug) =>
      [`/partners/${slug}`, `/student-portal/partners/${slug}`].map((source) => ({
        source,
        destination: "/student-portal/partners",
        permanent: false,
      })),
    );
    const moved = [
      ["/opportunities", "/student-portal/opportunities"],
      ["/partners", "/student-portal/partners"],
      ["/partners/:slug", "/student-portal/partners/:slug"],
      ["/programs", "/student-portal/programs"],
      ["/about", "/student-portal/about"],
    ].map(([source, destination]) => ({ source, destination, permanent: true }));
    return [...retired, ...moved];
  },
};

export default nextConfig;
