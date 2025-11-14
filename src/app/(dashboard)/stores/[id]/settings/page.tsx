// src/app/(dashboard)/stores/[id]/settings/page.tsx
// Store Settings Page - Comprehensive store configuration with tabs

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StoreSettingsForm } from '@/components/stores/store-settings-form';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { SettingsIcon } from 'lucide-react';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Store Settings | Dashboard',
  description: 'Configure your store settings, payment, shipping, and more',
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface StoreSettingsPageProps {
  params: {
    id: string;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default async function StoreSettingsPage({ 
  params 
}: { 
  params: Promise<StoreSettingsPageProps['params']> 
}) {
  // Get current user and verify authentication
  const user = await getCurrentUser();
  
  if (!user?.storeId) {
    redirect('/login');
  }

  const resolvedParams = await params;

  // Fetch store data
  const store = await prisma.store.findUnique({
    where: {
      id: resolvedParams.id,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      email: true,
      phone: true,
      website: true,
      address: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
      currency: true,
      timezone: true,
      locale: true,
      theme: true,
      isActive: true,
    },
  });

  // Verify store exists and user has access
  if (!store) {
    redirect('/dashboard/stores');
  }

  // For now, allow if user owns this store or is admin
  if (user.storeId !== store.id && user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
          <p className="text-muted-foreground">
            Configure your store settings, payment, shipping, and more
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure your store's basic information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StoreSettingsForm store={store} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Settings Tab */}
        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Settings</CardTitle>
              <CardDescription>
                Configure shipping zones, rates, and fulfillment options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Shipping configuration will be available soon. Configure shipping zones, rates, and carriers.
                </p>
                {/* TODO: Add ShippingRatesTable component */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Configure payment gateways and accepted payment methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Payment gateway configuration will be available soon. Connect Stripe, PayPal, and other payment providers.
                </p>
                {/* TODO: Add PaymentMethodsCard component */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Settings Tab */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>
                Configure tax rates and rules for different regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tax configuration will be available soon. Set up tax rates based on customer location.
                </p>
                {/* TODO: Add TaxRatesTable component */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
