import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requestPasswordReset } from '@/services/auth-service';

/**
 * POST /api/auth/forgot-password
 * Password reset request endpoint
 * 
 * Request Body:
 * - email: string (valid email format)
 * 
 * Response:
 * - 200: {data: {message}} (always returns success to prevent email enumeration)
 * - 400: {error: {code: 'VALIDATION_ERROR', message, details}}
 * - 429: {error: {code: 'RATE_LIMIT_EXCEEDED', message}}
 * - 500: {error: {code: 'INTERNAL_ERROR', message}}
 */

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validation = forgotPasswordSchema.safeParse(body);
    
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

    // Call service layer
    try {
      await requestPasswordReset(validation.data.email, ipAddress);

      // Always return success to prevent email enumeration
      return NextResponse.json({
        data: {
          message: 'If an account exists with this email, a password reset link has been sent.',
        },
      });
    } catch (error: unknown) {
      // Handle service errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage === 'RATE_LIMIT_EXCEEDED') {
        return NextResponse.json(
          {
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many password reset requests. Please try again later.',
            },
          },
          { status: 429 }
        );
      }
      
      // Re-throw unexpected errors to outer catch block
      throw error;
    }
  } catch (error) {
    console.error('POST /api/auth/forgot-password error:', error);
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
