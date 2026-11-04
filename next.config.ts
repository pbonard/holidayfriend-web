import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // the Dockerfile runs the small server this creates
  output: "standalone",
  // only for local development, in the cluster the gateway sends /auth to auth before it reaches next
  // same origin for the browser: the backend has no cors and its refresh_token cookie stays first party
  rewrites() {
    const authApiUrl = process.env.AUTH_API_URL;
    if (!authApiUrl) {
      return [];
    }
    return [
      {
        source: "/auth/:path*",
        destination: `${authApiUrl}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
