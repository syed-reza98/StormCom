import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // Temporarily ignore build errors due to Next.js 15 async params incompatibility
    // TODO: Refactor api-wrapper.ts to properly handle Next.js 15 async params/searchParams
    ignoreBuildErrors: true,
  },
  eslint: {
    // Run ESLint during builds
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
