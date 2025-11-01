import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security Middleware
 * 
 * Applies enterprise-grade security headers to all routes:
 * - Content-Security-Policy (CSP) with strict directives
 * - X-Frame-Options to prevent clickjacking
 * - X-Content-Type-Options to prevent MIME sniffing
 * - Referrer-Policy to limit referrer information leakage
 * - Permissions-Policy to restrict browser features
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 */

// CSP directives for production security
const CSP_DIRECTIVES = {
  // Default fallback for all resource types not explicitly defined
  'default-src': ["'self'"],

  // Scripts: Allow self-hosted, inline scripts with nonce, and eval for Next.js
  // Note: 'unsafe-inline' and 'unsafe-eval' required for Next.js App Router in development
  // In production, use nonces for inline scripts and remove unsafe-eval if possible
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Next.js inline scripts
    "'unsafe-eval'", // Required for Next.js RSC and hydration
    'https://vercel.live', // Vercel toolbar
    'https://va.vercel-scripts.com', // Vercel Analytics
  ],

  // Styles: Allow self-hosted, inline styles, and Google Fonts
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-jsx and Tailwind
    'https://fonts.googleapis.com',
  ],

  // Images: Allow self-hosted, data URIs, and external CDNs
  'img-src': [
    "'self'",
    'data:', // Base64 images
    'blob:', // Blob URLs for file uploads
    'https:', // All HTTPS images (product images, avatars)
  ],

  // Fonts: Allow self-hosted and Google Fonts
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],

  // Objects: Block all plugins (Flash, Java, etc.)
  'object-src': ["'none'"],

  // Media: Allow self-hosted only
  'media-src': ["'self'"],

  // Frames: Allow self-hosted only (for iframes)
  'frame-src': ["'self'"],

  // Workers: Allow self-hosted and blob URLs
  'worker-src': ["'self'", 'blob:'],

  // Child frames: Allow self-hosted only
  'child-src': ["'self'"],

  // Form actions: Allow self-hosted only
  'form-action': ["'self'"],

  // Frame ancestors: Deny all (prevent clickjacking)
  'frame-ancestors': ["'none'"],

  // Base URI: Restrict to self
  'base-uri': ["'self'"],

  // Connect: Allow self-hosted API calls and Vercel services
  'connect-src': [
    "'self'",
    'https://vercel.live', // Vercel toolbar
    'https://va.vercel-scripts.com', // Vercel Analytics
  ],

  // Upgrade insecure requests: Automatically upgrade HTTP to HTTPS
  'upgrade-insecure-requests': [],
};

/**
 * Build Content-Security-Policy header value from directives object
 */
function buildCSP(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key; // Directives like 'upgrade-insecure-requests' have no values
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Security headers to apply to all responses
 */
const SECURITY_HEADERS = {
  // Content Security Policy: Prevent XSS, clickjacking, and other injection attacks
  'Content-Security-Policy': buildCSP(),

  // Strict-Transport-Security: Force HTTPS for 1 year (31,536,000 seconds)
  // Configured in vercel.json but also set here for non-Vercel deployments
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // X-Frame-Options: Prevent clickjacking by denying all framing
  // Redundant with CSP frame-ancestors but included for older browsers
  'X-Frame-Options': 'DENY',

  // X-Content-Type-Options: Prevent MIME-type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Referrer-Policy: Limit referrer information to same-origin
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions-Policy: Restrict browser features for privacy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

  // X-DNS-Prefetch-Control: Control DNS prefetching
  'X-DNS-Prefetch-Control': 'on',

  // Remove X-Powered-By header to hide server information
  // (Next.js removes this by default, but we ensure it's gone)
};

/**
 * Middleware function
 * 
 * Applies security headers to all routes.
 * Runs on every request before reaching route handlers.
 */
export function middleware(request: NextRequest) {
  // Clone the response headers
  const response = NextResponse.next();

  // Apply all security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Remove X-Powered-By header if present (extra safety)
  response.headers.delete('X-Powered-By');

  return response;
}

/**
 * Middleware configuration
 * 
 * Apply middleware to all routes except:
 * - Next.js internal routes (_next/*)
 * - Static files in public directory
 * - Favicon and other root-level assets
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder files (robots.txt, sitemap.xml, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
