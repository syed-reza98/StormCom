import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { register } from '@/services/auth-service';

/**
 * POST /api/auth/register
 * User registration endpoint with email verification
 * 
 * Request Body:
 * - email: string (valid email format)
 * - password: string (min 8 chars, complexity requirements)
 * - name: string (min 2 chars)
 * - role: 'CUSTOMER' | 'STAFF' | 'STORE_ADMIN' (optional, defaults to CUSTOMER)
 * 
 * Response:
 * - 201: {data: {userId, email, message}}
 * - 400: {error: {code: 'VALIDATION_ERROR', message, details}}
 * - 409: {error: {code: 'EMAIL_EXISTS', message}}
 * - 500: {error: {code: 'INTERNAL_ERROR', message}}
 */

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['CUSTOMER', 'STAFF', 'STORE_ADMIN']).optional().default('CUSTOMER'),
  storeId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validation = registerSchema.safeParse(body);
    
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
      const result = await register({
        email: validation.data.email,
        password: validation.data.password,
        firstName: validation.data.firstName,
        lastName: validation.data.lastName,
        role: validation.data.role,
        storeId: validation.data.storeId,
        ipAddress,
        userAgent,
      });

      // Success response
      return NextResponse.json(
        {
          data: {
            userId: result.userId,
            email: validation.data.email,
            message: 'Registration successful. Please check your email to verify your account.',
          },
        },
        { status: 201 }
      );
    } catch (error: unknown) {
      // Handle service errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage === 'EMAIL_EXISTS') {
        return NextResponse.json(
          {
            error: {
              code: 'EMAIL_EXISTS',
              message: 'An account with this email address already exists',
            },
          },
          { status: 409 }
        );
      }
      
      // Re-throw unexpected errors to outer catch block
      throw error;
    }
  } catch (error) {
    console.error('POST /api/auth/register error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during registration',
        },
      },
      { status: 500 }
    );
  }
}
