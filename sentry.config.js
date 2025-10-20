import { nextTestSetup } from '@next/experimental-test-proxy/playwright';

/**
 * Sentry Configuration for Next.js
 * 
 * Configures Sentry error tracking and performance monitoring for both
 * client and server environments in the Next.js application.
 * 
 * Features:
 * - Automatic error capture in pages, API routes, and server components
 * - Source map upload for production debugging
 * - Performance monitoring with automatic instrumentation
 * - Multi-tenant context injection
 * 
 * Environment Variables Required:
 * - NEXT_PUBLIC_SENTRY_DSN: Sentry project DSN (public, client-side accessible)
 * - SENTRY_AUTH_TOKEN: Auth token for source map uploads (build-time only, keep secret)
 * - NEXT_PUBLIC_SENTRY_ENVIRONMENT: Environment name (production, staging, development)
 * - SENTRY_ORG: Sentry organization slug (for source maps)
 * - SENTRY_PROJECT: Sentry project slug (for source maps)
 * 
 * Source Map Upload:
 * - Automatically uploads source maps to Sentry during production builds
 * - Enables readable stack traces in production error reports
 * - Requires SENTRY_AUTH_TOKEN and SENTRY_ORG/PROJECT configured
 * 
 * Disabling Sentry:
 * - Set NEXT_PUBLIC_SENTRY_DSN to empty string or remove from .env
 * - Sentry will be disabled and all monitoring calls will be no-ops
 * 
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

const SENTRY_ORG = process.env.SENTRY_ORG;
const SENTRY_PROJECT = process.env.SENTRY_PROJECT;
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;

module.exports = {
  // Sentry Webpack Plugin configuration for source map upload
  sentry: {
    // Disable Sentry SDK initialization in this config
    // (we handle it manually in sentry.client.config.ts and sentry.server.config.ts)
    autoInstrumentServerFunctions: false,
    autoInstrumentMiddleware: false,
    
    // Source map upload configuration
    org: SENTRY_ORG,
    project: SENTRY_PROJECT,
    authToken: SENTRY_AUTH_TOKEN,
    
    // Only upload source maps in production builds
    disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
    disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',
    
    // Silent mode (reduce build output noise)
    silent: true,
    
    // Source map generation settings
    widenClientFileUpload: true, // Upload all client chunks
    hideSourceMaps: true, // Remove source maps from public build output (security)
    
    // Disable Sentry during development
    enabled: process.env.NODE_ENV === 'production',
  },
};
