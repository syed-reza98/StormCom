import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
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
 * Handles multi-tenant context preparation, rate limiting, CSRF protection, and security headers.
 * Exported for testing purposes.
 * 
 * Note: Proxy runs in Edge runtime - cannot use Prisma or AsyncLocalStorage.
 * Store resolution must happen in API routes/Server Components using resolveStore().
 * 
 * @param request - NextRequest to protect
 * @returns NextResponse with security headers applied
 */
export async function applySecurityProtections(request: NextRequest): Promise<NextResponse> {
  const { method, url } = request;
  const { pathname } = new URL(url);

  // 0. Multi-tenant Context Preparation:
  // Proxy sets X-Forwarded-Host header for API routes/Server Components to resolve storeId.
  // Actual resolution happens in server context using resolveStore() from @/lib/store/resolve-store
  // due to Edge runtime limitations (no Prisma, no AsyncLocalStorage).

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

  // Set X-Forwarded-Host for store resolution in API routes
  const host = request.headers.get('host') || '';
  response.headers.set('x-forwarded-host', host);

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
 * Main proxy function with NextAuth JWT integration (no withAuth wrapper)
 * Implements role-based access control (RBAC) and applies security protections.
 */
// Debug: indicate module has been loaded by Next.js
console.log('[PROXY] Module loaded');

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 0. Canonical Domain Redirect
  // Note: Actual canonical redirect happens in storefront Server Components via
  // checkCanonicalRedirect() from @/lib/store/canonical-redirect
  // Proxy only sets x-forwarded-host header for server-side resolution
  // (Edge runtime cannot access Prisma for StoreDomain lookup)

  // Import RBAC helpers lazily to keep edge bundle small
  const { canAccess, isPublicRoute, getDefaultRedirect } = await import('./src/lib/auth/permissions');

  // 1) Allow public routes
  if (isPublicRoute(pathname)) {
    console.log('[PROXY] Public route allowed', pathname);
    return applySecurityProtections(req);
  }

  // 2) Get JWT token (NextAuth)
  const token = (await getToken({ req, secret: process.env.NEXTAUTH_SECRET })) as (JWT & { role?: string; requiresMFA?: boolean }) | null;

  if (!token) {
    console.warn('[PROXY] Unauthenticated access blocked → /login', pathname);
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 3) Enforce MFA if required
  if (token.requiresMFA && !pathname.startsWith('/auth/mfa')) {
    return NextResponse.redirect(new URL('/auth/mfa/challenge', req.url));
  }

  // 4) Role-based default redirect when visiting /dashboard
  if (pathname === '/dashboard') {
    const defaultPath = getDefaultRedirect(token.role);
    if (defaultPath !== '/dashboard') {
      return NextResponse.redirect(new URL(defaultPath, req.url));
    }
  }

  // 5) RBAC check for protected routes
  if (!canAccess(pathname, token.role)) {
    console.warn(`[RBAC] Access denied: ${token.role} → ${pathname}`);
    return new NextResponse(
      JSON.stringify({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
          details: { pathname, userRole: token.role },
        },
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 6) Apply security protections and continue
  return applySecurityProtections(req);
}

/**
 * Matcher configuration
 * 
 * Apply proxy to all routes that require authentication or role-based access control.
 * Public routes will be allowed through by the authorized callback.
 * 
 * Protected routes:
 * - /dashboard/* - Store admin/staff routes (requires authentication + role check)
 * - /admin/* - Super admin routes (requires SUPER_ADMIN role)
 * - /products/* - Admin product management (requires authentication + role check)
 * - /orders/* - Admin order management (requires authentication + role check)
 * - /customers/* - Admin customer management (requires authentication + role check)
 * - /settings/* - Store settings (requires STORE_ADMIN role)
 * - /stores/* - Store management (requires SUPER_ADMIN role)
 * - /inventory/* - Inventory management (requires authentication + role check)
 * - /analytics/* - Analytics routes (requires authentication + role check)
 * - /account/* - Customer account routes (requires CUSTOMER role)
 * - /api/* - API routes (except public endpoints like /api/auth/* and /api/webhooks/*)
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
 */
export const config = {
  matcher: [
    // Admin routes
    '/dashboard/:path*',
    '/admin/:path*',
    
    // Store management routes (admin) - include exact paths AND wildcard paths
    '/products',
    '/products/:path*',
    '/categories',
    '/categories/:path*',
    '/attributes',
    '/attributes/:path*',
    '/brands',
    '/brands/:path*',
    '/orders',
    '/orders/:path*',
    '/customers',
    '/customers/:path*',
    '/inventory',
    '/inventory/:path*',
    '/analytics',
    '/analytics/:path*',
    '/reports',
    '/reports/:path*',
    '/marketing',
    '/marketing/:path*',
    '/coupons',
    '/coupons/:path*',
    '/pages',
    '/pages/:path*',
    '/blog',
    '/blog/:path*',
    '/pos',
    '/pos/:path*',
    '/settings',
    '/settings/:path*',
    '/stores',        // CRITICAL: Exact path for stores list
    '/stores/:path*', // Wildcard for stores sub-routes
    '/bulk-import',
    '/bulk-import/:path*',
    
    // Customer account routes
    '/account/:path*',
    
    // Protected API routes (exclude /api/auth/* and /api/webhooks/* via authorized callback)
    '/api/:path*',
  ],
};
