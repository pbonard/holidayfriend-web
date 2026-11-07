import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // the Dockerfile runs the small server this creates
  output: 'standalone',
  // only for local development, in the cluster the gateway routes these before they reach next
  // same origin for the browser: the backend has no cors and its refresh_token cookie stays first party
  rewrites() {
    const holidayFriendApiUrl = process.env.HOLIDAYFRIEND_API_URL;
    if (!holidayFriendApiUrl) {
      return [];
    }
    return [
      {
        source: '/auth/:path*',
        destination: `${holidayFriendApiUrl}/auth/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${holidayFriendApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
