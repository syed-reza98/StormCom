import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/services/auth-service';
import { getSession } from '@/lib/session-storage';

/**
 * POST /api/auth/logout
 * User logout endpoint with session invalidation
 * 
 * Request: Requires sessionId cookie
 * 
 * Response:
 * - 200: {data: {message}}
 * - 401: {error: {code: 'UNAUTHORIZED', message}}
 * - 500: {error: {code: 'INTERNAL_ERROR', message}}
 */

export async function POST(request: NextRequest) {
  try {
    // Get session ID from cookie (must match login API: 'session-id')
    const sessionId = request.cookies.get('session-id')?.value;

    if (!sessionId) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        },
        { status: 401 }
      );
    }

    // Get session to retrieve userId
    const session = await getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired session',
          },
        },
        { status: 401 }
      );
    }

    // Extract client metadata
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Call service layer
    await logout(sessionId, session.userId, ipAddress, userAgent);

    // Clear session cookie
    const response = NextResponse.json({
      data: {
        message: 'Logout successful',
      },
    });

    response.cookies.delete('session-id');

    return response;
  } catch (error) {
    console.error('POST /api/auth/logout error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during logout',
        },
      },
      { status: 500 }
    );
  }
}
