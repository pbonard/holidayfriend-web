import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // the Dockerfile runs the small server this creates
  output: 'standalone',
  // the dev server only serves its scripts and hot reload to localhost, these are the other hosts a phone opens it
  // with: this mac on the wi-fi (it can change with the network), its tailscale ip, and `tailscale serve`'s https name.
  // without them the page loads but never starts, and a form falls back to a plain GET with its fields in the url
  allowedDevOrigins: ['172.30.1.31', '100.92.105.39', '*.ts.net'],
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
