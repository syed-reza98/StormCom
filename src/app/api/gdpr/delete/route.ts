// src/app/api/gdpr/delete/route.ts
// GDPR Account Deletion API Endpoint
// POST /api/gdpr/delete - Create account deletion request

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createdResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-response';
import { getSessionFromRequest } from '@/lib/session-storage';
import { gdprService } from '@/services/gdpr-service';

/**
 * Request schema for account deletion
 */
const deletionRequestSchema = z.object({
  storeId: z.string().optional(),
  confirmation: z.literal('DELETE_MY_ACCOUNT'), // Require explicit confirmation
});

/**
 * POST /api/gdpr/delete
 * 
 * Create an account deletion request for the authenticated user.
 * 
 * **GDPR Article 17**: Right to erasure ("right to be forgotten")
 * 
 * **Warning**: This action is irreversible. Personal data will be anonymized.
 * Order history will be preserved for legal/financial compliance.
 * 
 * @param request - Next.js request object
 * @returns GdprRequest with PENDING status
 * 
 * @example
 * ```typescript
 * // Request
 * POST /api/gdpr/delete
 * Body: {
 *   confirmation: "DELETE_MY_ACCOUNT",
 *   storeId?: "store-123"
 * }
 * 
 * // Response
 * {
 *   data: {
 *     id: "req-456",
 *     userId: "user-789",
 *     type: "DELETE",
 *     status: "PENDING",
 *     createdAt: "2025-01-26T00:00:00Z"
 *   },
 *   message: "Account deletion request created. Your account will be permanently deleted."
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSessionFromRequest(request);
    if (!session) {
      return unauthorizedResponse();
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = deletionRequestSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse('Invalid request body', validation.error.errors);
    }

    const { storeId } = validation.data;

    // Extract metadata for audit trail
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create deletion request
    const deletionRequest = await gdprService.createDeletionRequest(
      session.userId,
      storeId,
      {
        ipAddress,
        userAgent,
      }
    );

    return createdResponse(
      deletionRequest,
      'Account deletion request created. Your account will be permanently deleted within 30 days.'
    );
  } catch (error: any) {
    // Handle duplicate request error
    if (error.message.includes('already pending')) {
      return errorResponse(error.message, 409, { code: 'DUPLICATE_REQUEST' });
    }

    // Log and return generic error
    console.error('[GDPR Delete] Error creating deletion request:', error);
    return errorResponse(
      'Failed to create account deletion request. Please try again later.',
      500
    );
  }
}
