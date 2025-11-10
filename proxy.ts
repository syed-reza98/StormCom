import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import type { JWT } from 'next-auth/jwt';
import {
  validateCsrfTokenFromRequest,
  createCsrfError,
  requiresCsrfProtection,
} from './src/lib/csrf';
import {
  checkSimpleRateLimit,
  createSimpleRateLimitError,
  addSimpleRateLimitHeaders,
} from './src/lib/simple-rate-limit';

/**
 * Next.js 16 Proxy (formerly Middleware)
 * 
 * Unified proxy for StormCom that handles:
 * 1. Authentication via NextAuth.js (JWT sessions)
 * 2. Authorization (role-based access control)
 * 3. Multi-tenant context (storeId isolation)
 * 4. Rate limiting (100 req/min general, 10 req/min auth)
 * 5. CSRF protection for state-changing operations
 * 6. Security headers (CSP, HSTS, X-Frame-Options, etc.)
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 * @see https://nextjs.org/docs/app/guides/backend-for-frontend#proxy
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

  // X-Frame-Options: Already set in next.config.ts (DENY)
  // Removed here to avoid header conflict

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
 * Apply security headers and protections to the response
 */
/**
 * Apply security protections to the request
 * 
 * Handles multi-tenant context, rate limiting, CSRF protection, and security headers.
 * Exported for testing purposes.
 * 
 * @param request - NextRequest to protect
 * @returns NextResponse with security headers applied
 */
export async function applySecurityProtections(request: NextRequest): Promise<NextResponse> {
  const { method, url } = request;
  const { pathname } = new URL(url);

  // 0. Multi-tenant Context: Set storeId in AsyncLocalStorage for Prisma middleware
  // This must happen BEFORE any database queries
  try {
    const { setStoreIdContext } = await import('./src/lib/prisma-middleware');
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('./src/lib/auth');
    
    const session = await getServerSession(authOptions);
    if (session?.user && (session.user as any).storeId) {
      setStoreIdContext((session.user as any).storeId);
    }
  } catch (error) {
    // Best effort - if session retrieval fails, continue without context
    // Individual routes will enforce authentication as needed
    console.error('Failed to set storeId context:', error);
  }

  // 1. Rate Limiting: Check request limits
  const rateLimitResult = checkSimpleRateLimit(request);

  if (!rateLimitResult.success) {
    // Return 429 Too Many Requests
    const errorResponse = createSimpleRateLimitError(rateLimitResult);
    return NextResponse.json(
      JSON.parse(await errorResponse.text()),
      { status: errorResponse.status, headers: errorResponse.headers }
    );
  }

  // 2. CSRF Protection: Validate token for state-changing operations
  if (requiresCsrfProtection(method, pathname)) {
    // Validate CSRF token (async operation)
    const isValid = await validateCsrfTokenFromRequest(request);

    if (!isValid) {
      // Return 403 Forbidden with structured error
      const csrfError = createCsrfError();
      return NextResponse.json(
        JSON.parse(await csrfError.text()),
        { status: csrfError.status, headers: csrfError.headers }
      );
    }
  }

  // 3. Security Headers: Apply to all responses
  const response = NextResponse.next();

  // Apply all security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add rate limit headers to response
  addSimpleRateLimitHeaders(response, rateLimitResult);

  // Remove X-Powered-By header if present (extra safety)
  response.headers.delete('X-Powered-By');

  return response;
}

/**
 * Main proxy function with NextAuth integration
 * 
 * Uses NextAuth's withAuth HOC to handle authentication and authorization.
 * Delegates to applySecurityProtections for additional security layers.
 */
export default withAuth(
  async function proxy(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token as JWT & { role?: string; requiresMFA?: boolean };

    // Allow authenticated users to continue
    if (token) {
      // Check role-based access for admin routes
      if (pathname.startsWith('/admin') && token.role !== 'SuperAdmin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }

      // Check if user needs to complete MFA
      if (token.requiresMFA && !pathname.startsWith('/auth/mfa')) {
        return NextResponse.redirect(new URL('/auth/mfa/challenge', req.url));
      }

      // Apply security protections and continue
      return applySecurityProtections(req as NextRequest);
    }

    // Not authenticated - redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // This callback determines if the request is authorized
        // Return true to allow the proxy function above to run
        // Return false to redirect to the sign-in page
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
      error: '/login',
    },
  }
);

/**
 * Matcher configuration
 * 
 * Apply proxy to protected routes only (authenticated routes).
 * Public routes (login, register, static assets) are excluded.
 * 
 * Protected routes:
 * - /dashboard/* - Store admin/staff routes (requires storeId in session)
 * - /admin/* - Super admin routes (requires SuperAdmin role)
 * - /api/* - API routes (except public webhooks and auth endpoints)
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
 */
export const config = {
  matcher: [
    // Protected application routes
    '/dashboard/:path*',
    '/admin/:path*',
    
    // Protected API routes
    '/api/:path*',
  ],
};
