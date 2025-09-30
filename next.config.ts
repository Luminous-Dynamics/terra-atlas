import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Disable image optimization for now
  images: {
    unoptimized: true,
  },
  // Ensure pages directory is included
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;
