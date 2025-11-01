// src/lib/csrf.ts
// CSRF (Cross-Site Request Forgery) Protection for StormCom
// Generates and validates CSRF tokens for state-changing operations
// Uses Web Crypto API for Edge Runtime compatibility

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
 * Generate random bytes using Web Crypto API
 */
function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Convert bytes to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create HMAC signature using Web Crypto API
 */
async function createHmac(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  
  return bytesToHex(new Uint8Array(signature));
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Generate a random CSRF token
 */
export async function generateCsrfToken(): Promise<string> {
  // Generate random bytes
  const tokenBytes = randomBytes(CSRF_CONFIG.tokenLength);
  const token = bytesToHex(tokenBytes);
  
  // Get current timestamp
  const timestamp = Date.now().toString();
  
  // Create HMAC signature
  const signature = await createHmac(`${token}:${timestamp}`, getCsrfSecret());
  
  // Combine token, timestamp, and signature
  return `${token}:${timestamp}:${signature}`;
}

/**
 * Validate a CSRF token
 */
export async function validateCsrfToken(token: string | null | undefined): Promise<boolean> {
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
    const expectedSignature = await createHmac(`${tokenValue}:${timestamp}`, getCsrfSecret());

    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(expectedSignature, signature);
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
export async function validateCsrfTokenFromRequest(request: Request): Promise<boolean> {
  const { method, url } = request;
  const { pathname } = new URL(url);

  // Check if CSRF protection is required
  if (!requiresCsrfProtection(method, pathname)) {
    return true; // No CSRF validation needed
  }

  // Extract token from request
  const token = extractCsrfToken(request.headers);

  // Validate token
  return await validateCsrfToken(token);
}

/**
 * Export CSRF configuration for use in cookies
 */
export { CSRF_CONFIG };
