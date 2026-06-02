import type { NextConfig } from "next";

const apiProxy = process.env.API_PROXY_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxy}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiProxy}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
