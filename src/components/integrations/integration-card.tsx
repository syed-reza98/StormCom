/**
 * Integration Card Component
 * 
 * Displays integration details, connection status, sync actions,
 * and recent sync history.
 * 
 * Client Component - handles connect/disconnect/sync actions.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

type Integration = {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: any;
  features: string[];
  authUrl: string | null;
};

type IntegrationCardProps = {
  integration: Integration;
  storeId: string;
};

export function IntegrationCard({ integration, storeId }: IntegrationCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [shopDomain, setShopDomain] = useState('');
  const [showShopifyModal, setShowShopifyModal] = useState(false);

  const isConnected = !!integration.config;
  const lastSync = integration.config?.lastSyncAt;

  // Handle OAuth connection
  const handleConnect = () => {
    if (integration.id === 'shopify') {
      // Shopify requires shop domain input
      setShowShopifyModal(true);
    } else if (integration.authUrl) {
      // Redirect to OAuth URL
      window.location.href = integration.authUrl;
    }
  };

  // Handle Shopify shop domain submission
  const handleShopifyConnect = () => {
    if (!shopDomain.trim()) {
      alert('Please enter your Shopify shop domain');
      return;
    }

    // Validate shop domain format
    if (!/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shopDomain)) {
      alert('Invalid shop domain. Use format: your-store.myshopify.com');
      return;
    }

    // Redirect to Shopify OAuth
    const authUrl = `https://${shopDomain}/admin/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_SHOPIFY_API_KEY}&scope=read_products,write_products,read_orders,read_customers&redirect_uri=${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/shopify/connect&state=${storeId}`;
    window.location.href = authUrl;
  };

  // Handle disconnection
  const handleDisconnect = async () => {
    if (!confirm(`Disconnect ${integration.name}? This will remove all sync settings.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/integrations/${integration.id}/disconnect`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to disconnect');
      }

      router.refresh();
    } catch (error: any) {
      console.error('Disconnect error:', error);
      alert(error.message || 'Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  // Handle sync action
  const handleSync = async () => {
    try {
      setSyncLoading(true);
      let response;

      if (integration.id === 'shopify') {
        response = await fetch('/api/integrations/shopify/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}), // Sync all products
        });
      } else if (integration.id === 'mailchimp') {
        response = await fetch('/api/integrations/mailchimp/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}), // Sync all customers
        });
      }

      if (!response || !response.ok) {
        const error = response ? await response.json() : { error: { message: 'No response' } };
        throw new Error(error.error?.message || 'Sync failed');
      }

      const result = await response.json();
      alert(result.message || 'Sync completed successfully');
      router.refresh();
    } catch (error: any) {
      console.error('Sync error:', error);
      alert(error.message || 'Sync failed');
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{integration.icon}</div>
              <div>
                <CardTitle>{integration.name}</CardTitle>
                <CardDescription>{integration.description}</CardDescription>
              </div>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connected' : 'Not Connected'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Features */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Features</h4>
            <ul className="space-y-1">
              {integration.features.map((feature) => (
                <li key={feature} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Connection Info */}
          {isConnected && (
            <div className="pt-4 border-t">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform</span>
                  <span className="font-medium capitalize">{integration.config.platform}</span>
                </div>
                {lastSync && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Sync</span>
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(lastSync), { addSuffix: true })}
                    </span>
                  </div>
                )}
                {integration.config.apiUrl && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">API Server</span>
                    <span className="font-medium text-xs truncate max-w-[200px]">
                      {integration.config.apiUrl}
                    </span>
                  </div>
                )}
              </div>

              {/* Recent Sync Logs */}
              {integration.config.syncLogs?.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-3">Recent Syncs</h4>
                  <div className="space-y-2">
                    {integration.config.syncLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between text-xs p-2 rounded bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                            {log.status}
                          </Badge>
                          <span className="text-muted-foreground">
                            {log.recordsSynced || 0} synced
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          {!isConnected ? (
            <Button onClick={handleConnect} disabled={loading} className="w-full">
              {loading ? 'Connecting...' : `Connect ${integration.name}`}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSync}
                disabled={syncLoading}
                variant="default"
                className="flex-1"
              >
                {syncLoading ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button
                onClick={handleDisconnect}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      {/* Shopify Shop Domain Modal */}
      {showShopifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Connect Shopify Store</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your Shopify shop domain (e.g., your-store.myshopify.com)
            </p>
            <input
              type="text"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              placeholder="your-store.myshopify.com"
              className="w-full px-3 py-2 border rounded-md mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <Button onClick={handleShopifyConnect} className="flex-1">
                Continue
              </Button>
              <Button
                onClick={() => {
                  setShowShopifyModal(false);
                  setShopDomain('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
