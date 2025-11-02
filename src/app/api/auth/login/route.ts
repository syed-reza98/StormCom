import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { login } from '@/services/auth-service';

/**
 * POST /api/auth/login
 * User login endpoint with MFA support
 * 
 * Request Body:
 * - email: string (valid email format)
 * - password: string
 * 
 * Response:
 * - 200: {data: {sessionId, user: {id, email, role, storeId}, requiresMFA}}
 * - 400: {error: {code: 'VALIDATION_ERROR', message, details}}
 * - 401: {error: {code: 'INVALID_CREDENTIALS', message}}
 * - 403: {error: {code: 'ACCOUNT_LOCKED', message, metadata: {lockedUntil}}}
 * - 500: {error: {code: 'INTERNAL_ERROR', message}}
 */

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    
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
      const result = await login({
        email: validation.data.email,
        password: validation.data.password,
        ipAddress,
      });

      // Set session cookie (HttpOnly, Secure, SameSite)
      const response = NextResponse.json({
        data: {
          sessionId: result.sessionId,
          user: result.user,
          requiresMFA: result.requiresMFA,
        },
      });

      response.cookies.set('session-id', result.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    } catch (error: unknown) {
      // Handle service errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage === 'INVALID_CREDENTIALS') {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            },
          },
          { status: 401 }
        );
      }
      
      if (errorMessage.startsWith('ACCOUNT_LOCKED')) {
        // Extract lockedUntil timestamp from error message if available
        // Format: "ACCOUNT_LOCKED:2025-01-25T12:00:00Z"
        const parts = errorMessage.split(':');
        const lockedUntil = parts.length > 1 ? parts[1] : undefined;
        
        return NextResponse.json(
          {
            error: {
              code: 'ACCOUNT_LOCKED',
              message: 'Account temporarily locked due to too many failed login attempts',
              metadata: lockedUntil ? { lockedUntil } : undefined,
            },
          },
          { status: 403 }
        );
      }
      
      // Re-throw unexpected errors to outer catch block
      throw error;
    }
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during login',
        },
      },
      { status: 500 }
    );
  }
}
