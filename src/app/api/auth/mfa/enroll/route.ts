import { NextRequest, NextResponse } from 'next/server';
import { setupMFA } from '@/services/mfa-service';
import { getSession } from '@/lib/session-storage';

/**
 * POST /api/auth/mfa/enroll
 * MFA enrollment endpoint - generates TOTP secret and backup codes
 * 
 * Request: Requires sessionId cookie
 * 
 * Response:
 * - 200: {data: {secret, qrCodeUrl, backupCodes}}
 * - 401: {error: {code: 'UNAUTHORIZED', message}}
 * - 500: {error: {code: 'INTERNAL_ERROR', message}}
 */

export async function POST(request: NextRequest) {
  try {
    // Get session ID from cookie
    const sessionId = request.cookies.get('sessionId')?.value;

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
    const result = await setupMFA(session.userId, ipAddress, userAgent);

    return NextResponse.json({
      data: {
        secret: result.secret,
        qrCodeUrl: result.qrCodeUrl,
        backupCodes: result.backupCodes,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/mfa/enroll error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during MFA enrollment',
        },
      },
      { status: 500 }
    );
  }
}
