import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev resources are blocked when the browser host is not the one Next
  // inferred. 127.0.0.1 is how this environment opens the site.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
