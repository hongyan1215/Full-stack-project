import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  turbopack: {
    root: "/Users/hongyan/wp1141/hw5",
    resolveAlias: {
      "@ui": "../../packages/ui",
      "@utils": "../../packages/utils",
      "@db": "../../packages/db",
      "@config": "../../packages/config",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "res.cloudinary.com" }
    ],
  },
  allowedDevOrigins: ["192.168.1.111"],
  transpilePackages: ["@ui/shared", "@utils/shared", "@db/client", "@config/shared"],
};

export default nextConfig;


