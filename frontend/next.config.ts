import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/ai/:path*",
        destination: "http://localhost:8000/ai/:path*",
      },
    ];
  },
};

export default nextConfig;
