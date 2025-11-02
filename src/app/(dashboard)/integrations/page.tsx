/**
 * Integrations Page
 * 
 * Displays available external platform integrations (Shopify, Mailchimp)
 * with connection status, OAuth connect buttons, and sync history.
 * 
 * Server Component - fetches integration configs and sync logs on server.
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { IntegrationCard } from '@/components/integrations/integration-card';
import { IntegrationService } from '@/services/integration-service';

export const metadata = {
  title: 'Integrations | StormCom',
  description: 'Manage external platform integrations',
};

export default async function IntegrationsPage() {
  // Authentication check
  const session = await getServerSession();
  if (!session?.user?.storeId) {
    redirect('/login');
  }

  const storeId = session.user.storeId;

  // Fetch integration configurations
  const [shopifyConfig, mailchimpConfig] = await Promise.all([
    db.externalPlatformConfig.findFirst({
      where: { storeId, platform: 'shopify' },
      include: {
        syncLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    }),
    db.externalPlatformConfig.findFirst({
      where: { storeId, platform: 'mailchimp' },
      include: {
        syncLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    }),
  ]);

  // Available integrations
  const integrations = [
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Sync products, orders, and inventory with your Shopify store',
      icon: '🛍️',
      config: shopifyConfig,
      features: ['Product export', 'Inventory sync', 'Order import'],
      authUrl: shopifyConfig
        ? null
        : IntegrationService.getShopifyAuthUrl(
            storeId,
            '' // Shop domain will be prompted in modal
          ),
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      description: 'Sync customer contacts to your Mailchimp mailing list',
      icon: '📧',
      config: mailchimpConfig,
      features: ['Customer sync', 'Email marketing', 'Audience segmentation'],
      authUrl: mailchimpConfig
        ? null
        : IntegrationService.getMailchimpAuthUrl(storeId),
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect external platforms to sync data and expand your store&apos;s capabilities
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            storeId={storeId}
          />
        ))}
      </div>

      {/* Coming Soon Section */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-6 border rounded-lg bg-muted/50">
            <div className="text-4xl mb-3">🛒</div>
            <h3 className="font-semibold mb-2">WooCommerce</h3>
            <p className="text-sm text-muted-foreground">
              Sync with WooCommerce stores
            </p>
          </div>
          <div className="p-6 border rounded-lg bg-muted/50">
            <div className="text-4xl mb-3">💳</div>
            <h3 className="font-semibold mb-2">Payment Gateways</h3>
            <p className="text-sm text-muted-foreground">
              Additional payment processors
            </p>
          </div>
          <div className="p-6 border rounded-lg bg-muted/50">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="font-semibold mb-2">Shipping Providers</h3>
            <p className="text-sm text-muted-foreground">
              Real-time shipping rates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
