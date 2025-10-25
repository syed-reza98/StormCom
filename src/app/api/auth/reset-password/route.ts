import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resetPassword } from '@/services/auth-service';

/**
 * POST /api/auth/reset-password
 * Password reset completion endpoint
 * 
 * Request Body:
 * - token: string (reset token from email)
 * - password: string (new password, min 8 chars)
 * 
 * Response:
 * - 200: {data: {message}}
 * - 400: {error: {code: 'VALIDATION_ERROR' | 'INVALID_TOKEN' | 'PASSWORD_REUSED', message}}
 * - 500: {error: {code: 'INTERNAL_ERROR', message}}
 */

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validation = resetPasswordSchema.safeParse(body);
    
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
      await resetPassword({
        token: validation.data.token,
        newPassword: validation.data.password,
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        data: {
          message: 'Password reset successful. You can now login with your new password.',
        },
      });
    } catch (error: unknown) {
      // Handle service errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage === 'INVALID_TOKEN' || errorMessage === 'TOKEN_EXPIRED') {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_TOKEN',
              message: 'Invalid or expired reset token. Please request a new password reset.',
            },
          },
          { status: 400 }
        );
      }
      
      if (errorMessage === 'PASSWORD_REUSED') {
        return NextResponse.json(
          {
            error: {
              code: 'PASSWORD_REUSED',
              message: 'Password cannot be one of your last 5 passwords. Please choose a different password.',
            },
          },
          { status: 400 }
        );
      }
      
      // Re-throw unexpected errors to outer catch block
      throw error;
    }
  } catch (error) {
    console.error('POST /api/auth/reset-password error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
