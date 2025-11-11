import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, CSRF_CONFIG } from '@/lib/csrf';

/**
 * GET /api/csrf-token
 * 
 * Generates and returns a CSRF token for client-side use.
 * The token is returned both in the response body and as a cookie.
 * 
 * **Usage**:
 * 1. Client requests a token from this endpoint
 * 2. Token is returned in JSON response and set as a cookie
 * 3. Client includes token in subsequent state-changing requests
 *    - Via 'x-csrf-token' header (recommended for AJAX)
 *    - Or via 'csrf-token' cookie (for form submissions)
 * 
 * **Response Format**:
 * ```json
 * {
 *   "csrfToken": "abc123:1234567890:def456"
 * }
 * ```
 * 
 * @see src/lib/csrf.ts
 * @see specs/001-multi-tenant-ecommerce/spec.md (Security Requirements)
 */
export async function GET(_request: NextRequest) {
  try {
    // Generate a new CSRF token
    const csrfToken = await generateCsrfToken();

    // Create response with token
    const response = NextResponse.json(
      {
        csrfToken,
        expiresIn: CSRF_CONFIG.ttl, // 24 hours in milliseconds
      },
      { status: 200 }
    );

    // Set CSRF token as HTTP-only cookie
    response.cookies.set({
      name: CSRF_CONFIG.cookieName,
      value: csrfToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection via SameSite
      path: '/',
      maxAge: CSRF_CONFIG.ttl / 1000, // Convert ms to seconds
    });

    return response;
  } catch (error) {
    console.error('[CSRF] Token generation failed:', error);

    return NextResponse.json(
      {
        error: {
          code: 'CSRF_TOKEN_GENERATION_FAILED',
          message: 'Failed to generate CSRF token',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/csrf-token
 * 
 * CORS preflight handler
 */
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
