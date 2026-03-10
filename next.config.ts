import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow builds to complete even with type errors during development
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
};

export default nextConfig;
