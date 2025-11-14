'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const notificationSettingsSchema = z.object({
  emailEnabled: z.boolean().default(true),
  pushEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  
  orderUpdates: z.enum(['all', 'important', 'off']).default('all'),
  productAlerts: z.enum(['all', 'important', 'off']).default('important'),
  promotions: z.enum(['all', 'important', 'off']).default('off'),
  accountActivity: z.enum(['all', 'important', 'off']).default('important'),
  
  frequency: z.enum(['realtime', 'hourly', 'daily', 'weekly']).default('realtime'),
  quietHoursEnabled: z.boolean().default(false),
  quietHoursStart: z.string().default('22:00'),
  quietHoursEnd: z.string().default('08:00'),
});

type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

interface NotificationSettingsPanelProps {
  initialSettings?: Partial<NotificationSettingsFormData>;
  onSave?: (settings: NotificationSettingsFormData) => Promise<void>;
}

export default function NotificationSettingsPanel({
  initialSettings,
  onSave,
}: NotificationSettingsPanelProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      orderUpdates: 'all',
      productAlerts: 'important',
      promotions: 'off',
      accountActivity: 'important',
      frequency: 'realtime',
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      ...initialSettings,
    },
  });

  const handleSubmit = async (data: NotificationSettingsFormData) => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(data);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const notificationTypes = [
    {
      id: 'orderUpdates',
      label: 'Order Updates',
      description: 'Notifications about your orders (shipped, delivered, etc.)',
      icon: Bell,
    },
    {
      id: 'productAlerts',
      label: 'Product Alerts',
      description: 'Stock updates, price changes, and new arrivals',
      icon: Bell,
    },
    {
      id: 'promotions',
      label: 'Promotions & Offers',
      description: 'Special deals, discounts, and marketing emails',
      icon: Bell,
    },
    {
      id: 'accountActivity',
      label: 'Account Activity',
      description: 'Login attempts, password changes, and security alerts',
      icon: Bell,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Manage how you receive notifications and updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Notification Channels */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Notification Channels</h3>
              
              <FormField
                control={form.control}
                name="emailEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Notifications
                      </FormLabel>
                      <FormDescription>
                        Receive notifications via email
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

              <FormField
                control={form.control}
                name="pushEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Push Notifications
                      </FormLabel>
                      <FormDescription>
                        Receive browser push notifications
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

              <FormField
                control={form.control}
                name="smsEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div className="space-y-0.5">
                      <FormLabel className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        SMS Notifications
                      </FormLabel>
                      <FormDescription>
                        Receive notifications via text message
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

            {/* Notification Categories */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Notification Categories</h3>
              
              {notificationTypes.map((type) => (
                <FormField
                  key={type.id}
                  control={form.control}
                  name={type.id as keyof NotificationSettingsFormData}
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="space-y-0.5 flex-1">
                        <FormLabel className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </FormLabel>
                        <FormDescription>{type.description}</FormDescription>
                      </div>
                      <FormControl>
                        <Select value={field.value as string} onValueChange={field.onChange}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="important">Important</SelectItem>
                            <SelectItem value="off">Off</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <Separator />

            {/* Notification Frequency */}
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notification Frequency</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly Digest</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Digest</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How often you want to receive grouped notifications
                  </FormDescription>
                </FormItem>
              )}
            />

            <Separator />

            {/* Quiet Hours */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="quietHoursEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div className="space-y-0.5">
                      <FormLabel>Quiet Hours</FormLabel>
                      <FormDescription>
                        Pause non-urgent notifications during specific hours
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

              {form.watch('quietHoursEnabled') && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <FormField
                    control={form.control}
                    name="quietHoursStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <input
                            type="time"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quietHoursEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <input
                            type="time"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
