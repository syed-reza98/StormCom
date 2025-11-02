import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* Next.js 16 App Router Configuration */
  reactStrictMode: true,
  
  /* Cache Components - disabled for now to avoid incompatibilities with
   * route segment config (e.g. `export const dynamic = 'force-dynamic'`).
   * The project plans to enable Cache Components once all routes are
   * updated to the new caching primitives. See docs in .github for notes.
   */
  cacheComponents: false,
  
  /* TypeScript Configuration */
  typescript: {
    ignoreBuildErrors: false,
  },
  
  /* Image Optimization */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      // Allow placeholder images used in the demo and fixtures (e.g. placehold.co)
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  /* Security Headers */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  /* Performance Optimization */
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      'lucide-react',
      'recharts',
      'date-fns',
    ],
  },
  
  /* Compiler Optimization */
  compiler: {
    // Remove console.log statements in production (keep error and warn)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  /* Performance Optimization */
  // Enable compression for better performance
  compress: true,
  
  /* Output Optimization */
  // On Windows the standalone build copies traced files which can include
  // filenames with characters (like `:`) that are invalid on NTFS. To avoid
  // build-time copyfile errors during local development on Windows, disable
  // the `standalone` output there. It will still be used on non-Windows
  // environments (CI / Linux containers) where filenames are supported.
  output: process.platform === 'win32' ? undefined : 'standalone',
  
  // Note: swcMinify removed - it's now default in Next.js 16
};

export default nextConfig;
