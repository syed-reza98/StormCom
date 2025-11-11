// src/app/api/gdpr/consent/route.ts
// GDPR Consent Management API Endpoint
// GET /api/gdpr/consent - Get user's consent records
// POST /api/gdpr/consent - Update consent preferences

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ConsentType } from '@prisma/client';
import {
  successResponse,
  createdResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-response';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { gdprService } from '@/services/gdpr-service';

/**
 * Request schema for updating consent
 */
const updateConsentSchema = z.object({
  consentType: z.enum(['ESSENTIAL', 'ANALYTICS', 'MARKETING', 'PREFERENCES']),
  granted: z.boolean(),
  storeId: z.string().optional(),
});

/**
 * GET /api/gdpr/consent
 * 
 * Retrieve user's current consent preferences.
 * 
 * **GDPR Article 7**: Conditions for consent
 * 
 * @returns Array of consent records
 * 
 * @example
 * ```typescript
 * // Request
 * GET /api/gdpr/consent?storeId=store-123
 * 
 * // Response
 * {
 *   data: [
 *     {
 *       id: "consent-1",
 *       consentType: "ESSENTIAL",
 *       granted: true,
 *       grantedAt: "2025-01-01T00:00:00Z"
 *     },
 *     {
 *       consentType: "ANALYTICS",
 *       granted: false,
 *       revokedAt: "2025-01-15T00:00:00Z"
 *     }
 *   ]
 * }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || undefined;

    // Get consent records
    const consents = await gdprService.getConsentRecords(session.user.id, storeId);

    return successResponse(consents);
  } catch (error: any) {
    console.error('[GDPR Consent] Error retrieving consents:', error);
    return errorResponse(
      'Failed to retrieve consent records. Please try again later.',
      500
    );
  }
}

/**
 * POST /api/gdpr/consent
 * 
 * Update a consent preference for the authenticated user.
 * 
 * **GDPR Article 7**: Right to withdraw consent at any time
 * 
 * @param request - Next.js request object
 * @returns Updated consent record
 * 
 * @example
 * ```typescript
 * // Request
 * POST /api/gdpr/consent
 * Body: {
 *   consentType: "ANALYTICS",
 *   granted: false,
 *   storeId?: "store-123"
 * }
 * 
 * // Response
 * {
 *   data: {
 *     id: "consent-2",
 *     userId: "user-123",
 *     consentType: "ANALYTICS",
 *     granted: false,
 *     revokedAt: "2025-01-26T00:00:00Z"
 *   },
 *   message: "Consent preference updated successfully"
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
    const validation = updateConsentSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse('Invalid request body', validation.error.errors);
    }

    const { consentType, granted, storeId } = validation.data;

    // Extract metadata for audit trail
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Record consent
    const consent = await gdprService.recordConsent(
      session.user.id,
      consentType as ConsentType,
      granted,
      storeId,
      {
        ipAddress,
        userAgent,
      }
    );

    return createdResponse(
      consent,
      'Consent preference updated successfully'
    );
  } catch (error: any) {
    console.error('[GDPR Consent] Error updating consent:', error);
    return errorResponse(
      'Failed to update consent preference. Please try again later.',
      500
    );
  }
}
