/**
 * Integration Disconnect API Route
 * 
 * DELETE /api/integrations/[platform]/disconnect
 * 
 * Removes integration configuration for a specific platform.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { IntegrationService } from '@/services/integration-service';

type RouteContext = {
  params: Promise<{
    platform: string;
  }>;
};

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { platform } = await params;
    
    // Authentication check
    const session = await getServerSession();
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Validate platform
    if (!['shopify', 'mailchimp'].includes(platform)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid platform' } },
        { status: 400 }
      );
    }

    // Find configuration
    const config = await IntegrationService.getConfig(
      session.user.storeId,
      platform
    );

    if (!config) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Configuration not found' } },
        { status: 404 }
      );
    }

    // Delete configuration
    await IntegrationService.deleteConfig(config.id);

    return NextResponse.json(
      { message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/integrations/[platform]/disconnect error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to disconnect' } },
      { status: 500 }
    );
  }
}
