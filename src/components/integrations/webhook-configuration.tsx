'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, RefreshCw, TestTube, Trash2, Webhook } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import useToast from '@/hooks/use-toast';

const webhookSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  url: z.string().url('Invalid URL').startsWith('https://', 'URL must use HTTPS'),
  events: z.array(z.string()).min(1, 'Select at least one event'),
  isActive: z.boolean().default(true),
  retryEnabled: z.boolean().default(true),
  maxRetries: z.number().int().min(0).max(10).default(3),
});

type WebhookFormData = z.infer<typeof webhookSchema>;

interface WebhookDelivery {
  id: string;
  event: string;
  status: 'success' | 'failed' | 'pending';
  statusCode?: number;
  timestamp: Date;
  responseTime?: number;
}

interface WebhookConfigurationProps {
  initialData?: Partial<WebhookFormData>;
  secretKey?: string;
  recentDeliveries?: WebhookDelivery[];
  onSave?: (data: WebhookFormData) => Promise<void>;
  onTest?: (url: string) => Promise<boolean>;
  onRegenerateSecret?: () => Promise<string>;
  onDelete?: () => Promise<void>;
}

const availableEvents = [
  { id: 'order.created', label: 'Order Created', description: 'When a new order is placed' },
  { id: 'order.updated', label: 'Order Updated', description: 'When order status changes' },
  { id: 'order.cancelled', label: 'Order Cancelled', description: 'When an order is cancelled' },
  { id: 'order.fulfilled', label: 'Order Fulfilled', description: 'When an order is shipped' },
  { id: 'product.created', label: 'Product Created', description: 'When a new product is added' },
  { id: 'product.updated', label: 'Product Updated', description: 'When product details change' },
  { id: 'product.deleted', label: 'Product Deleted', description: 'When a product is removed' },
  { id: 'inventory.low', label: 'Low Inventory', description: 'When stock falls below threshold' },
  { id: 'customer.created', label: 'Customer Created', description: 'When a new customer registers' },
  { id: 'payment.succeeded', label: 'Payment Succeeded', description: 'When payment completes' },
  { id: 'payment.failed', label: 'Payment Failed', description: 'When payment fails' },
];

export default function WebhookConfiguration({
  initialData,
  secretKey: initialSecretKey,
  recentDeliveries = [],
  onSave,
  onTest,
  onRegenerateSecret,
  onDelete,
}: WebhookConfigurationProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);
  const [secretKey, setSecretKey] = useState(initialSecretKey || '');
  const [secretVisible, setSecretVisible] = useState(false);
  const { toast } = useToast();

  const form = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: '',
      url: '',
      events: [],
      isActive: true,
      retryEnabled: true,
      maxRetries: 3,
      ...initialData,
    },
  });

  const handleSubmit = async (data: WebhookFormData) => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(data);
      toast({ title: 'Webhook saved', description: 'Your webhook configuration has been updated' });
    } catch (error) {
      console.error('Failed to save webhook:', error);
      toast({ title: 'Error', description: 'Failed to save webhook configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!onTest) return;

    const url = form.getValues('url');
    if (!url) {
      toast({ title: 'Error', description: 'Please enter a webhook URL first' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const success = await onTest(url);
      setTestResult(success ? 'success' : 'failed');
      if (success) {
        toast({ title: 'Test successful', description: 'Your webhook endpoint responded successfully' });
      } else {
        toast({ title: 'Test failed', description: 'Your webhook endpoint did not respond correctly' });
      }
    } catch (error) {
      setTestResult('failed');
      toast({ title: 'Test failed', description: 'Could not reach your webhook endpoint' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRegenerateSecret = async () => {
    if (!onRegenerateSecret) return;

    try {
      const newSecret = await onRegenerateSecret();
      setSecretKey(newSecret);
      toast({ title: 'Secret regenerated', description: 'A new webhook secret has been generated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to regenerate secret' });
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secretKey);
    toast({ title: 'Copied', description: 'Webhook secret copied to clipboard' });
  };

  const getDeliveryStatusBadge = (status: WebhookDelivery['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="bg-green-50">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            Configure webhooks to receive real-time notifications about events in your store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Webhook" {...field} />
                      </FormControl>
                      <FormDescription>
                        A friendly name to identify this webhook
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endpoint URL</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            placeholder="https://your-domain.com/webhooks"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleTest}
                          disabled={isTesting || !field.value}
                        >
                          {isTesting ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FormDescription>
                        Must be a valid HTTPS URL
                        {testResult && (
                          <span className={testResult === 'success' ? 'text-green-600' : 'text-destructive'}>
                            {' • Test '}{testResult}
                          </span>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Enable or disable this webhook
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Events */}
              <FormField
                control={form.control}
                name="events"
                render={() => (
                  <FormItem>
                    <FormLabel>Events to Subscribe</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availableEvents.map((event) => (
                        <FormField
                          key={event.id}
                          control={form.control}
                          name="events"
                          render={({ field }) => (
                            <FormItem className="flex items-start space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(event.id)}
                                  onCheckedChange={(checked) => {
                                    const value = field.value || [];
                                    field.onChange(
                                      checked
                                        ? [...value, event.id]
                                        : value.filter((v) => v !== event.id)
                                    );
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-0.5">
                                <FormLabel className="font-normal cursor-pointer">
                                  {event.label}
                                </FormLabel>
                                <FormDescription className="text-xs">
                                  {event.description}
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Retry Configuration */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="retryEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-0.5">
                        <FormLabel>Enable Retries</FormLabel>
                        <FormDescription>
                          Automatically retry failed webhook deliveries
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch('retryEnabled') && (
                  <FormField
                    control={form.control}
                    name="maxRetries"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Retries</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of times to retry failed deliveries (0-10)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Separator />

              {/* Webhook Secret */}
              {secretKey && (
                <div className="space-y-2">
                  <FormLabel>Webhook Secret</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      type={secretVisible ? 'text' : 'password'}
                      value={secretKey}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setSecretVisible(!secretVisible)}
                    >
                      {secretVisible ? '👁️' : '👁️‍🗨️'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copySecret}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRegenerateSecret}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this secret to verify webhook signatures
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Webhook'}
                </Button>
                {onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Recent Deliveries */}
      {recentDeliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Deliveries</CardTitle>
            <CardDescription>
              Latest webhook delivery attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{delivery.event}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(delivery.timestamp).toLocaleString()}
                      {delivery.responseTime && ` • ${delivery.responseTime}ms`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {delivery.statusCode && (
                      <Badge variant="outline">{delivery.statusCode}</Badge>
                    )}
                    {getDeliveryStatusBadge(delivery.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
