// src/lib/csrf.ts
// CSRF (Cross-Site Request Forgery) Protection for StormCom
// Generates and validates CSRF tokens for state-changing operations

import { randomBytes, createHmac, timingSafeEqual } from 'crypto';

/**
 * CSRF configuration
 */
const CSRF_CONFIG = {
  tokenLength: 32, // 32 bytes = 256 bits
  ttl: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  headerName: 'x-csrf-token',
  cookieName: 'csrf-token',
};

/**
 * Get CSRF secret from environment
 */
function getCsrfSecret(): string {
  const secret = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CSRF_SECRET or NEXTAUTH_SECRET must be set in production');
    }
    // Use a static secret in development
    return 'development-csrf-secret-change-in-production';
  }
  
  return secret;
}

/**
 * Generate a random CSRF token
 */
export function generateCsrfToken(): string {
  // Generate random bytes
  const token = randomBytes(CSRF_CONFIG.tokenLength).toString('hex');
  
  // Get current timestamp
  const timestamp = Date.now().toString();
  
  // Create HMAC signature
  const hmac = createHmac('sha256', getCsrfSecret());
  hmac.update(`${token}:${timestamp}`);
  const signature = hmac.digest('hex');
  
  // Combine token, timestamp, and signature
  return `${token}:${timestamp}:${signature}`;
}

/**
 * Validate a CSRF token
 */
export function validateCsrfToken(token: string | null | undefined): boolean {
  if (!token) {
    return false;
  }

  try {
    // Parse token components
    const parts = token.split(':');
    if (parts.length !== 3) {
      return false;
    }

    const [tokenValue, timestamp, signature] = parts;

    // Check if token is expired
    const tokenTimestamp = parseInt(timestamp, 10);
    if (isNaN(tokenTimestamp)) {
      return false;
    }

    const now = Date.now();
    if (now - tokenTimestamp > CSRF_CONFIG.ttl) {
      return false; // Token expired
    }

    // Verify signature
    const hmac = createHmac('sha256', getCsrfSecret());
    hmac.update(`${tokenValue}:${timestamp}`);
    const expectedSignature = hmac.digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    if (expectedSignature.length !== signature.length) {
      return false;
    }

    return timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('[CSRF] Token validation error:', error);
    return false;
  }
}

/**
 * Extract CSRF token from request headers or cookies
 */
export function extractCsrfToken(
  headers: Headers,
  cookies?: Map<string, string>
): string | null {
  // Try to get from header first
  const headerToken = headers.get(CSRF_CONFIG.headerName);
  if (headerToken) {
    return headerToken;
  }

  // Fall back to cookie
  if (cookies) {
    return cookies.get(CSRF_CONFIG.cookieName) || null;
  }

  return null;
}

/**
 * Check if request requires CSRF protection
 * CSRF protection is required for:
 * - POST, PUT, PATCH, DELETE methods
 * - Non-API routes (form submissions)
 */
export function requiresCsrfProtection(
  method: string,
  pathname: string
): boolean {
  // GET, HEAD, OPTIONS don't modify state - no CSRF needed
  if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    return false;
  }

  // NextAuth routes handle their own CSRF
  if (pathname.startsWith('/api/auth/')) {
    return false;
  }

  // Webhook routes should use signature verification instead
  if (pathname.startsWith('/api/webhooks/')) {
    return false;
  }

  // All other state-changing operations require CSRF
  return true;
}

/**
 * Create CSRF error response
 */
export function createCsrfError(): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: 'CSRF_VALIDATION_FAILED',
        message: 'CSRF token validation failed',
        timestamp: new Date().toISOString(),
      },
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Middleware helper to validate CSRF token
 */
export function validateCsrfTokenFromRequest(request: Request): boolean {
  const { method, url } = request;
  const { pathname } = new URL(url);

  // Check if CSRF protection is required
  if (!requiresCsrfProtection(method, pathname)) {
    return true; // No CSRF validation needed
  }

  // Extract token from request
  const token = extractCsrfToken(request.headers);

  // Validate token
  return validateCsrfToken(token);
}

/**
 * Export CSRF configuration for use in cookies
 */
export { CSRF_CONFIG };
