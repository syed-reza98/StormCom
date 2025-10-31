// src/app/(dashboard)/subscription/billing/page.tsx
// Billing page - Current plan, usage, and payment history

import { Suspense } from 'react';
import { db } from '@/lib/db';
import { SubscriptionService } from '@/services/subscription-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarIcon, CreditCardIcon, DownloadIcon, RefreshCwIcon } from 'lucide-react';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ storeId?: string; success?: string; canceled?: string }>;
}

async function BillingContent({ storeId }: { storeId: string }) {
  // Get store details
  const store = await db.store.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      name: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      subscriptionEndsAt: true,
      createdAt: true,
    },
  });

  if (!store) {
    return <div>Store not found</div>;
  }

  // Get usage stats
  const usageStats = await SubscriptionService.getUsageStats(storeId);
  const isActive = await SubscriptionService.isSubscriptionActive(storeId);
  const planDetails = SubscriptionService.getPlanDetails(store.subscriptionPlan);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing & Usage</h1>
          <p className="text-muted-foreground">
            Manage your subscription and monitor usage
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/subscription/plans?storeId=${storeId}`}>
            <Button variant="outline">
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Change Plan
            </Button>
          </Link>
          <Button variant="outline" disabled>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
        </div>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan: {planDetails.name}
                <Badge variant={getStatusVariant(store.subscriptionStatus)}>
                  {store.subscriptionStatus}
                </Badge>
              </CardTitle>
              <CardDescription>
                ${planDetails.price}/month • Started {store.createdAt.toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">${planDetails.price}</div>
              <div className="text-sm text-muted-foreground">per month</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {store.subscriptionStatus === SubscriptionStatus.TRIAL
                  ? `Trial ends: ${store.trialEndsAt?.toLocaleDateString()}`
                  : store.subscriptionStatus === SubscriptionStatus.CANCELED
                  ? `Ends: ${store.subscriptionEndsAt?.toLocaleDateString()}`
                  : `Next billing: ${store.subscriptionEndsAt?.toLocaleDateString()}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Status: {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {store.subscriptionStatus === SubscriptionStatus.TRIAL && store.trialEndsAt && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border">
              <div className="text-sm font-medium text-blue-900">
                Free Trial Active
              </div>
              <div className="text-sm text-blue-700">
                Your trial ends on {store.trialEndsAt.toLocaleDateString()}. 
                Upgrade now to continue without interruption.
              </div>
              <Link href={`/subscription/plans?storeId=${storeId}`}>
                <Button size="sm" className="mt-2">
                  Upgrade Now
                </Button>
              </Link>
            </div>
          )}

          {store.subscriptionStatus === SubscriptionStatus.CANCELED && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border">
              <div className="text-sm font-medium text-red-900">
                Subscription Canceled
              </div>
              <div className="text-sm text-red-700">
                Your subscription will end on {store.subscriptionEndsAt?.toLocaleDateString()}.
                You can reactivate anytime before then.
              </div>
              <Link href={`/subscription/plans?storeId=${storeId}`}>
                <Button size="sm" className="mt-2">
                  Reactivate
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Stats */}
      {usageStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Usage</CardTitle>
              <CardDescription>
                {usageStats.productCount} of{' '}
                {store.subscriptionPlan === SubscriptionPlan.ENTERPRISE
                  ? 'unlimited'
                  : planDetails.productLimit}{' '}
                products used
              </CardDescription>
            </CardHeader>
            <CardContent>
              {store.subscriptionPlan !== SubscriptionPlan.ENTERPRISE ? (
                <>
                  <Progress
                    value={usageStats.percentageOfProductLimit}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{usageStats.productCount} used</span>
                    <span>{planDetails.productLimit} limit</span>
                  </div>
                  {usageStats.isProductLimitExceeded && (
                    <div className="mt-2 text-sm text-red-600">
                      ⚠️ Product limit exceeded. Please upgrade your plan.
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-2xl font-bold text-green-600">∞</div>
                  <div className="text-sm text-muted-foreground">Unlimited products</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Usage</CardTitle>
              <CardDescription>
                {usageStats.orderCountThisMonth} of{' '}
                {store.subscriptionPlan === SubscriptionPlan.ENTERPRISE
                  ? 'unlimited'
                  : planDetails.orderLimit}{' '}
                orders this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              {store.subscriptionPlan !== SubscriptionPlan.ENTERPRISE ? (
                <>
                  <Progress
                    value={usageStats.percentageOfOrderLimit}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{usageStats.orderCountThisMonth} used</span>
                    <span>{planDetails.orderLimit} limit</span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Resets in {usageStats.daysUntilReset} days
                  </div>
                  {usageStats.isOrderLimitExceeded && (
                    <div className="mt-2 text-sm text-red-600">
                      ⚠️ Monthly order limit exceeded. Please upgrade your plan.
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-2xl font-bold text-green-600">∞</div>
                  <div className="text-sm text-muted-foreground">Unlimited orders</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan Features</CardTitle>
          <CardDescription>
            What's included in your {planDetails.name} plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {planDetails.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment History Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View your past invoices and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CreditCardIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Payment history will appear here once billing is active.</p>
            <p className="text-sm">Invoices are sent via email and stored securely.</p>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Subscription */}
      {store.subscriptionPlan !== SubscriptionPlan.FREE && 
       store.subscriptionStatus !== SubscriptionStatus.CANCELED && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Cancel Subscription</CardTitle>
            <CardDescription>
              Cancel your subscription and downgrade to the free plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              If you cancel, your subscription will remain active until the end of your current billing period,
              then you'll be automatically downgraded to the free plan.
            </p>
            <CancelSubscriptionButton storeId={storeId} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CancelSubscriptionButton({ storeId }: { storeId: string }) {
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      const response = await fetch(`/api/subscriptions/${storeId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelAtPeriodEnd: true,
          reason: 'User requested cancellation',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Reload page to show updated status
        window.location.reload();
      } else {
        console.error('Error canceling subscription:', data.error);
        alert('Failed to cancel subscription. Please try again.');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    }
  };

  return (
    <Button variant="destructive" onClick={handleCancel}>
      Cancel Subscription
    </Button>
  );
}

function getStatusVariant(status: SubscriptionStatus): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' {
  switch (status) {
    case SubscriptionStatus.ACTIVE:
      return 'success';
    case SubscriptionStatus.TRIAL:
      return 'default';
    case SubscriptionStatus.PAST_DUE:
      return 'warning';
    case SubscriptionStatus.CANCELED:
    case SubscriptionStatus.PAUSED:
      return 'destructive';
    default:
      return 'secondary';
  }
}

export default async function BillingPage({ searchParams }: PageProps) {
  // TODO: Implement proper authentication when auth system is ready
  // const session = await getSessionFromCookies();
  // if (!session) {
  //   redirect('/login');
  // }

  const resolvedSearchParams = await searchParams;
  const storeId = resolvedSearchParams.storeId;

  if (!storeId) {
    return <div>Store ID is required</div>;
  }

  return (
    <div>
      <Suspense fallback={<div>Loading billing information...</div>}>
        <BillingContent storeId={storeId} />
      </Suspense>
    </div>
  );
}