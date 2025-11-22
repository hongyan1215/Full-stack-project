import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure API routes work properly on Vercel
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
