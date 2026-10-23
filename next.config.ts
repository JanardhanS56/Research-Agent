import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Allow SSE streaming from API routes
  },
};

export default nextConfig;
