import { NextRequest, NextResponse } from 'next/server';
// This route reads cookies and therefore must opt out of prerendering.
// Force dynamic so the runtime APIs like `request.cookies` and `headers()`
// work correctly during requests.
export const dynamic = 'force-dynamic';
import { SessionService } from '@/services/session-service';
import { successResponse } from '@/lib/api-response';
import { db } from '@/lib/db';

/**
 * GET /api/auth/session
 * Validates current session and returns user data
 * 
 * @returns {User} Current authenticated user or null if session invalid
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'No session token provided' } },
        { status: 401 }
      );
    }

    // Validate session
    const session = await SessionService.getSession(sessionToken);

    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired session' } },
        { status: 401 }
      );
    }

    // Fetch user data (excluding sensitive fields)
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        storeId: true,
        mfaEnabled: true,
        mfaMethod: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    // Update session last accessed time
    await SessionService.updateSessionActivity(sessionToken);

    return NextResponse.json(
      successResponse({ user }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to validate session' } },
      { status: 500 }
    );
  }
}
