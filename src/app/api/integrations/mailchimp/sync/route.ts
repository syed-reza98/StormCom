/**
 * POST /api/integrations/mailchimp/sync
 * 
 * Sync customers to Mailchimp mailing list.
 * 
 * Request Body:
 * - customerIds: string[] (optional - if not provided, syncs all customers)
 * 
 * Response:
 * - 200: { data: { synced, failed } } - Sync completed
 * - 400: { error: { code, message } } - Invalid input or Mailchimp not configured
 * - 401: { error: { code, message } } - Not authenticated
 * - 500: { error: { code, message } } - Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { IntegrationService } from '@/services/integration-service';
import { db } from '@/lib/db';

const syncSchema = z.object({
  customerIds: z.array(z.string()).optional(),
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
    const validation = syncSchema.safeParse(body);

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

    const { customerIds } = validation.data;

    // 3. Check if Mailchimp is configured
    const config = await IntegrationService.getConfig(
      session.user.storeId,
      'mailchimp'
    );

    if (!config) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_CONFIGURED',
            message: 'Mailchimp not configured for this store',
          },
        },
        { status: 400 }
      );
    }

    // 4. Fetch customers to sync
    const customers = await db.customer.findMany({
      where: {
        storeId: session.user.storeId,
        deletedAt: null,
        ...(customerIds && { id: { in: customerIds } }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (customers.length === 0) {
      return NextResponse.json({
        data: { synced: 0, failed: 0 },
        message: 'No customers to sync',
      });
    }

    // 5. Sync to Mailchimp
    const result = await IntegrationService.syncCustomersToMailchimp(
      session.user.storeId,
      customers
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'SYNC_FAILED',
            message: result.error || 'Failed to sync customers',
          },
        },
        { status: 500 }
      );
    }

    // 6. Update last sync timestamp
    await db.externalPlatformConfig.update({
      where: { id: config.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      data: {
        synced: result.synced || 0,
        failed: 0,
      },
      message: `Successfully synced ${result.synced} customers to Mailchimp`,
    });
  } catch (error) {
    console.error('POST /api/integrations/mailchimp/sync error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to sync customers';

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
