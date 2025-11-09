import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "res.cloudinary.com" }
    ],
  },
  transpilePackages: ["@ui/shared", "@utils/shared", "@db/client", "@config/shared"],
};

export default nextConfig;


