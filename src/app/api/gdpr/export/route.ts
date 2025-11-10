// src/app/api/gdpr/export/route.ts
// GDPR Data Export API Endpoint
// POST /api/gdpr/export - Create data export request

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createdResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-response';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { gdprService } from '@/services/gdpr-service';

/**
 * Request schema for data export
 */
const exportRequestSchema = z.object({
  storeId: z.string().optional(),
});

/**
 * POST /api/gdpr/export
 * 
 * Create a data export request for the authenticated user.
 * 
 * **GDPR Article 15**: Right of access - data subject can request copy of personal data
 * 
 * **Response Time**: Export will be processed asynchronously. Download link expires in 7 days.
 * 
 * @param request - Next.js request object
 * @returns GdprRequest with PENDING status
 * 
 * @example
 * ```typescript
 * // Request
 * POST /api/gdpr/export
 * Body: { storeId?: "store-123" }
 * 
 * // Response
 * {
 *   data: {
 *     id: "req-123",
 *     userId: "user-456",
 *     type: "EXPORT",
 *     status: "PENDING",
 *     expiresAt: "2025-02-02T00:00:00Z",
 *     createdAt: "2025-01-26T00:00:00Z"
 *   },
 *   message: "Data export request created. You will receive an email when ready."
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = exportRequestSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse('Invalid request body', validation.error.errors);
    }

    const { storeId } = validation.data;

    // Extract metadata for audit trail
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create export request
    const exportRequest = await gdprService.createExportRequest(
      session.user.id,
      storeId,
      {
        ipAddress,
        userAgent,
      }
    );

    return createdResponse(
      exportRequest,
      'Data export request created. You will receive an email when your data is ready to download.'
    );
  } catch (error: any) {
    // Handle duplicate request error
    if (error.message.includes('already pending')) {
      return errorResponse(error.message, 409, { code: 'DUPLICATE_REQUEST' });
    }

    // Log and return generic error
    console.error('[GDPR Export] Error creating export request:', error);
    return errorResponse(
      'Failed to create data export request. Please try again later.',
      500
    );
  }
}
