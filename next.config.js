/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  eslint: {
    // ESLint checks enabled during builds
    ignoreDuringBuilds: false,
  },
  typescript: {
    // TypeScript type checking enabled during builds
    ignoreBuildErrors: false,
  },
  // Disable image optimization for now
  images: {
    unoptimized: true,
  },
  // Ensure pages directory is included
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Skip static generation for problematic routes
  experimental: {
    skipMiddlewareUrlNormalize: true,
    skipTrailingSlashRedirect: true,
  },
  // Generate 404 at runtime instead of build time
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
};

module.exports = nextConfig;
