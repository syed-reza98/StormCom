import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyMFASetup, verifyMFALogin } from '@/services/mfa-service';
import { getSession } from '@/lib/session-storage';

/**
 * POST /api/auth/mfa/verify
 * MFA verification endpoint - verifies TOTP code during setup or login
 * 
 * Request Body:
 * - code: string (6-digit TOTP code or backup code)
 * - type: 'setup' | 'login' (verification context)
 * 
 * Response:
 * - 200: {data: {message, mfaVerified?: boolean}}
 * - 400: {error: {code: 'VALIDATION_ERROR' | 'INVALID_CODE', message}}
 * - 401: {error: {code: 'UNAUTHORIZED', message}}
 * - 500: {error: {code: 'INTERNAL_ERROR', message}}
 */

const verifyMFASchema = z.object({
  code: z.string().regex(/^\d{6}$|^[A-Za-z0-9]{10}$/, 'Invalid code format'),
  type: z.enum(['setup', 'login']),
});

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

    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validation = verifyMFASchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    // Extract client metadata
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Call appropriate service based on type
    try {
      if (validation.data.type === 'setup') {
        // Verify MFA setup
        await verifyMFASetup(
          session.userId,
          validation.data.code,
          ipAddress,
          userAgent
        );

        return NextResponse.json({
          data: {
            message: 'MFA setup verified successfully',
          },
        });
      } else {
        // Verify MFA during login
        const result = await verifyMFALogin(
          session.userId,
          validation.data.code,
          ipAddress,
          userAgent
        );

        return NextResponse.json({
          data: {
            message: 'MFA verification successful',
            mfaVerified: result.success,
          },
        });
      }
    } catch (error: unknown) {
      // Handle service errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage === 'INVALID_CODE' || errorMessage === 'CODE_EXPIRED') {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_CODE',
              message: 'Invalid or expired verification code',
            },
          },
          { status: 400 }
        );
      }
      
      // Re-throw unexpected errors to outer catch block
      throw error;
    }
  } catch (error) {
    console.error('POST /api/auth/mfa/verify error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during MFA verification',
        },
      },
      { status: 500 }
    );
  }
}
