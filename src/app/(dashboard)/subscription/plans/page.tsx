// src/app/(dashboard)/subscription/plans/page.tsx
// Subscription Plans page - Plan comparison and upgrade buttons

import { Suspense } from 'react';
import { db } from '@/lib/db';
import { SubscriptionService, SUBSCRIPTION_PLANS } from '@/services/subscription-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckIcon } from 'lucide-react';
import { SubscriptionPlan } from '@prisma/client';

interface PageProps {
  searchParams: Promise<{ storeId?: string }>;
}

async function SubscriptionPlansContent({ storeId }: { storeId: string }) {
  // Get store details
  const store = await db.store.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      name: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
    },
  });

  if (!store) {
    return <div>Store not found</div>;
  }

  // Get usage stats
  const usageStats = await SubscriptionService.getUsageStats(storeId);
  const recommendations = await SubscriptionService.getRecommendations(storeId);

  const plans = SubscriptionService.getAllPlans();

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg">
          Scale your e-commerce business with the right plan for your needs
        </p>
        {recommendations.recommendedPlan && (
          <div className="mt-4">
            <Badge variant={recommendations.urgency === 'high' ? 'destructive' : 'secondary'}>
              Recommendation: {recommendations.reason}
            </Badge>
          </div>
        )}
      </div>

      {/* Current Usage */}
      {usageStats && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Usage</CardTitle>
            <CardDescription>Your current plan usage statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Products</div>
                <div className="text-2xl font-bold">
                  {usageStats.productCount}
                  {store.subscriptionPlan !== SubscriptionPlan.ENTERPRISE && (
                    <span className="text-sm text-muted-foreground">
                      {' '}/ {SUBSCRIPTION_PLANS[store.subscriptionPlan].productLimit}
                    </span>
                  )}
                </div>
                {store.subscriptionPlan !== SubscriptionPlan.ENTERPRISE && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full ${
                        usageStats.isProductLimitExceeded ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{
                        width: `${Math.min(usageStats.percentageOfProductLimit, 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Orders This Month</div>
                <div className="text-2xl font-bold">
                  {usageStats.orderCountThisMonth}
                  {store.subscriptionPlan !== SubscriptionPlan.ENTERPRISE && (
                    <span className="text-sm text-muted-foreground">
                      {' '}/ {SUBSCRIPTION_PLANS[store.subscriptionPlan].orderLimit}
                    </span>
                  )}
                </div>
                {store.subscriptionPlan !== SubscriptionPlan.ENTERPRISE && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full ${
                        usageStats.isOrderLimitExceeded ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{
                        width: `${Math.min(usageStats.percentageOfOrderLimit, 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === store.subscriptionPlan;
          const isRecommended = plan.id === recommendations.recommendedPlan;

          return (
            <Card
              key={plan.id}
              className={`relative ${
                isCurrentPlan ? 'ring-2 ring-blue-500' : ''
              } ${isRecommended ? 'ring-2 ring-green-500' : ''}`}
            >
              {isCurrentPlan && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Current Plan
                </Badge>
              )}
              {isRecommended && !isCurrentPlan && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white"
                >
                  Recommended
                </Badge>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold">${plan.price}</span>
                  {plan.price > 0 && <span className="text-sm">/month</span>}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <SubscriptionActionButton
                  storeId={storeId}
                  currentPlan={store.subscriptionPlan}
                  targetPlan={plan.id}
                  isCurrentPlan={isCurrentPlan}
                />
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div>
            <h3 className="font-semibold mb-2">Can I change my plan anytime?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades,
              or at the end of your billing cycle for downgrades.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">What happens if I exceed my limits?</h3>
            <p className="text-sm text-muted-foreground">
              You&apos;ll receive notifications when approaching limits. If you exceed product limits, you&apos;ll need to
              upgrade or remove products. Order limits reset monthly.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Is there a free trial?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, all paid plans include a 14-day free trial. You can cancel anytime during the trial period
              without being charged.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">How does billing work?</h3>
            <p className="text-sm text-muted-foreground">
              Billing is monthly and automatic. You&apos;ll receive an invoice via email, and payment is processed
              through our secure payment system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubscriptionActionButton({
  storeId,
  currentPlan,
  targetPlan,
  isCurrentPlan,
}: {
  storeId: string;
  currentPlan: SubscriptionPlan;
  targetPlan: SubscriptionPlan;
  isCurrentPlan: boolean;
}) {
  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: targetPlan,
          storeId,
          successUrl: `${window.location.origin}/subscription/billing?success=true`,
          cancelUrl: `${window.location.origin}/subscription/plans?canceled=true`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to Stripe checkout
        window.location.href = data.data.sessionUrl;
      } else {
        console.error('Error creating checkout session:', data.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      // TODO: Show error toast
    }
  };

  if (isCurrentPlan) {
    return (
      <Button variant="outline" className="w-full" disabled>
        Current Plan
      </Button>
    );
  }

  if (targetPlan === SubscriptionPlan.FREE) {
    return (
      <Button variant="outline" className="w-full" disabled>
        Contact Support
      </Button>
    );
  }

  const isUpgrade = getUpgradeDirection(currentPlan, targetPlan) === 'upgrade';

  return (
    <Button
      className="w-full"
      variant={isUpgrade ? 'default' : 'outline'}
      onClick={handleUpgrade}
    >
      {isUpgrade ? 'Upgrade' : 'Downgrade'}
    </Button>
  );
}

function getUpgradeDirection(current: SubscriptionPlan, target: SubscriptionPlan): 'upgrade' | 'downgrade' {
  const planOrder = [
    SubscriptionPlan.FREE,
    SubscriptionPlan.BASIC,
    SubscriptionPlan.PRO,
    SubscriptionPlan.ENTERPRISE,
  ];

  const currentIndex = planOrder.indexOf(current);
  const targetIndex = planOrder.indexOf(target);

  return targetIndex > currentIndex ? 'upgrade' : 'downgrade';
}

export default async function SubscriptionPlansPage({ searchParams }: PageProps) {
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
      <Suspense fallback={<div>Loading subscription plans...</div>}>
        <SubscriptionPlansContent storeId={storeId} />
      </Suspense>
    </div>
  );
}