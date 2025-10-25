import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { regenerateBackupCodes } from '@/services/mfa-service';
import { getSession } from '@/lib/session-storage';

/**
 * POST /api/auth/mfa/backup-codes
 * MFA backup codes regeneration endpoint
 * 
 * Request Body:
 * - password: string (user password for confirmation)
 * 
 * Response:
 * - 200: {data: {backupCodes}}
 * - 400: {error: {code: 'VALIDATION_ERROR', message}}
 * - 401: {error: {code: 'UNAUTHORIZED' | 'INVALID_PASSWORD', message}}
 * - 500: {error: {code: 'INTERNAL_ERROR', message}}
 */

const regenerateBackupCodesSchema = z.object({
  password: z.string().min(1, 'Password is required'),
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
    const validation = regenerateBackupCodesSchema.safeParse(body);
    
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

    // Call service layer
    try {
      const result = await regenerateBackupCodes(
        session.userId,
        validation.data.password,
        ipAddress,
        userAgent
      );

      return NextResponse.json({
        data: {
          backupCodes: result.backupCodes,
        },
      });
    } catch (error: unknown) {
      // Handle service errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage === 'INVALID_PASSWORD') {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_PASSWORD',
              message: 'Invalid password. Please try again.',
            },
          },
          { status: 401 }
        );
      }
      
      // Re-throw unexpected errors to outer catch block
      throw error;
    }
  } catch (error) {
    console.error('POST /api/auth/mfa/backup-codes error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during backup codes regeneration',
        },
      },
      { status: 500 }
    );
  }
}
