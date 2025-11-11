import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { setupMFA } from '@/services/mfa-service';

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
    // Authenticate user with NextAuth
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
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

    // Extract client metadata
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Call service layer
    const result = await setupMFA(session.user.id, ipAddress, userAgent);

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
