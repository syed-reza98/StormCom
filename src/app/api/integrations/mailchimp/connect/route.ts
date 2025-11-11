/**
 * POST /api/integrations/mailchimp/connect
 * 
 * Mailchimp OAuth connection endpoint. Exchanges authorization code for access token
 * and saves encrypted configuration to database.
 * 
 * Request Body:
 * - code: string (Mailchimp authorization code from OAuth callback)
 * - state: string (storeId for CSRF validation)
 * 
 * Response:
 * - 200: { data: { config } } - Configuration saved successfully
 * - 400: { error: { code, message } } - Invalid input
 * - 401: { error: { code, message } } - Not authenticated
 * - 500: { error: { code, message } } - Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { IntegrationService } from '@/services/integration-service';

const connectSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession();
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // 2. Validate input
    const body = await request.json();
    const validation = connectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { code, state } = validation.data;

    // 3. CSRF validation (state should match storeId)
    if (state !== session.user.storeId) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_STATE',
            message: 'State parameter does not match session',
          },
        },
        { status: 400 }
      );
    }

    // 4. Exchange code for access token
    const accessToken = await IntegrationService.exchangeMailchimpCode(code);

    // 5. Get Mailchimp API URL from metadata endpoint
    const apiUrl = await IntegrationService.getMailchimpApiUrl(accessToken);

    // 6. Save configuration with encrypted credentials
    const config = await IntegrationService.saveMailchimpConfig(
      session.user.storeId,
      accessToken,
      apiUrl
    );

    return NextResponse.json({
      data: {
        config: {
          id: config.id,
          platform: config.platform,
          apiUrl: config.apiUrl,
          syncCustomers: config.syncCustomers,
          isActive: config.isActive,
          lastSyncAt: config.lastSyncAt,
        },
      },
      message: 'Mailchimp connected successfully',
    });
  } catch (error) {
    console.error('POST /api/integrations/mailchimp/connect error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to connect Mailchimp';

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}
