// Set environment variables FIRST (before any imports)
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_secret';
process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com';

// tests/unit/lib/stripe-subscription.test.ts
// Unit tests for Stripe subscription integration

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';

// Mock Stripe module
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: vi.fn(),
        },
      },
      billingPortal: {
        sessions: {
          create: vi.fn(),
        },
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
      subscriptions: {
        retrieve: vi.fn(),
        cancel: vi.fn(),
      },
    })),
  };
});

// Mock SubscriptionService
vi.mock('@/services/subscription-service', () => ({
  SubscriptionService: {
    assignPlan: vi.fn(),
  },
}));

// Now import the functions to test (after mocks and env setup)
import { 
  createSubscriptionCheckoutSession,
  createCustomerPortalSession,
  mapStripeStatusToPrisma,
  handleStripeWebhook
} from '@/lib/stripe-subscription';
import { SubscriptionService } from '@/services/subscription-service';

const mockStripe = {
  checkout: {
    sessions: {
      create: vi.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: vi.fn(),
    },
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
  subscriptions: {
    retrieve: vi.fn(),
    cancel: vi.fn(),
  },
} as unknown as Stripe;

const mockSubscriptionService = SubscriptionService as unknown as {
  assignPlan: MockedFunction<any>;
};

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    STRIPE_SECRET_KEY: 'sk_test_mock_key',
    STRIPE_WEBHOOK_SECRET: 'whsec_mock_secret',
    NEXT_PUBLIC_BASE_URL: 'https://example.com',
  };
  vi.clearAllMocks();
});

afterEach(() => {
  process.env = originalEnv;
  vi.restoreAllMocks();
});

describe('Stripe Subscription Integration', () => {
  describe('createSubscriptionCheckoutSession', () => {
    it('should create checkout session with correct parameters', async () => {
      const mockSession = {
        id: 'cs_test_session_id',
        url: 'https://checkout.stripe.com/pay/cs_test_session_id',
      };
      
      (mockStripe.checkout.sessions.create as MockedFunction<any>).mockResolvedValue(mockSession);

      const result = await createSubscriptionCheckoutSession({
        priceId: 'price_basic_monthly',
        storeId: 'store-123',
        customerId: 'cus_customer_id',
      });

      expect(result).toEqual(mockSession);
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_basic_monthly',
            quantity: 1,
          },
        ],
        customer: 'cus_customer_id',
        success_url: 'https://example.com/subscription/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://example.com/subscription/plans?storeId=store-123',
        metadata: {
          storeId: 'store-123',
        },
        subscription_data: {
          metadata: {
            storeId: 'store-123',
          },
        },
      });
    });

    it('should handle missing customer ID', async () => {
      const mockSession = {
        id: 'cs_test_session_id',
        url: 'https://checkout.stripe.com/pay/cs_test_session_id',
      };
      
      (mockStripe.checkout.sessions.create as MockedFunction<any>).mockResolvedValue(mockSession);

      await createSubscriptionCheckoutSession({
        priceId: 'price_basic_monthly',
        storeId: 'store-123',
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: undefined,
        })
      );
    });

    it('should throw error when Stripe API fails', async () => {
      const stripeError = new Error('Stripe API Error');
      (mockStripe.checkout.sessions.create as MockedFunction<any>).mockRejectedValue(stripeError);

      await expect(
        createSubscriptionCheckoutSession({
          priceId: 'price_basic_monthly',
          storeId: 'store-123',
        })
      ).rejects.toThrow('Stripe API Error');
    });

    it('should use correct URLs with custom base URL', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://custom-domain.com';
      
      const mockSession = { id: 'cs_test', url: 'https://checkout.stripe.com/pay/cs_test' };
      (mockStripe.checkout.sessions.create as MockedFunction<any>).mockResolvedValue(mockSession);

      await createSubscriptionCheckoutSession({
        priceId: 'price_basic_monthly',
        storeId: 'store-123',
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: 'https://custom-domain.com/subscription/success?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: 'https://custom-domain.com/subscription/plans?storeId=store-123',
        })
      );
    });
  });

  describe('createCustomerPortalSession', () => {
    it('should create customer portal session', async () => {
      const mockPortalSession = {
        id: 'bps_test_portal_id',
        url: 'https://billing.stripe.com/session/bps_test_portal_id',
      };
      
      (mockStripe.billingPortal.sessions.create as MockedFunction<any>).mockResolvedValue(mockPortalSession);

      const result = await createCustomerPortalSession({
        customerId: 'cus_customer_id',
        returnUrl: 'https://example.com/subscription/billing',
      });

      expect(result).toEqual(mockPortalSession);
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_customer_id',
        return_url: 'https://example.com/subscription/billing',
      });
    });

    it('should throw error when customer ID is missing', async () => {
      await expect(
        createCustomerPortalSession({
          customerId: '',
          returnUrl: 'https://example.com/subscription/billing',
        })
      ).rejects.toThrow('Customer ID is required');
    });

    it('should throw error when return URL is missing', async () => {
      await expect(
        createCustomerPortalSession({
          customerId: 'cus_customer_id',
          returnUrl: '',
        })
      ).rejects.toThrow('Return URL is required');
    });
  });

  describe('mapStripeStatusToPrisma', () => {
    it('should map Stripe statuses to Prisma statuses correctly', () => {
      expect(mapStripeStatusToPrisma('active')).toBe(SubscriptionStatus.ACTIVE);
      expect(mapStripeStatusToPrisma('trialing')).toBe(SubscriptionStatus.TRIAL);
      expect(mapStripeStatusToPrisma('past_due')).toBe(SubscriptionStatus.PAST_DUE);
      expect(mapStripeStatusToPrisma('canceled')).toBe(SubscriptionStatus.CANCELED);
      expect(mapStripeStatusToPrisma('unpaid')).toBe(SubscriptionStatus.CANCELED);
      expect(mapStripeStatusToPrisma('incomplete')).toBe(SubscriptionStatus.TRIAL);
      expect(mapStripeStatusToPrisma('incomplete_expired')).toBe(SubscriptionStatus.CANCELED);
      expect(mapStripeStatusToPrisma('paused')).toBe(SubscriptionStatus.PAST_DUE);
    });

    it('should default to TRIAL for unknown statuses', () => {
      expect(mapStripeStatusToPrisma('unknown_status' as any)).toBe(SubscriptionStatus.TRIAL);
    });
  });

  describe('handleStripeWebhook', () => {
    const mockWebhookEvent = {
      id: 'evt_test_webhook',
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test_subscription',
          customer: 'cus_test_customer',
          status: 'active',
          metadata: {
            storeId: 'store-123',
          },
          items: {
            data: [
              {
                price: {
                  id: 'price_basic_monthly',
                  lookup_key: 'basic',
                },
              },
            ],
          },
        },
      },
    };

    beforeEach(() => {
      (mockStripe.webhooks.constructEvent as MockedFunction<any>).mockReturnValue(mockWebhookEvent);
    });

    it('should handle subscription.created event', async () => {
      mockSubscriptionService.assignPlan.mockResolvedValue({
        id: 'store-123',
        subscriptionPlan: 'BASIC',
      });

      const result = await handleStripeWebhook({
        body: 'webhook_body',
        signature: 'webhook_signature',
      });

      expect(result).toEqual({ success: true, eventType: 'customer.subscription.created' });
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        'webhook_body',
        'webhook_signature',
        'whsec_mock_secret'
      );
      expect(mockSubscriptionService.assignPlan).toHaveBeenCalledWith(
        'store-123',
        'BASIC',
        'sub_test_subscription'
      );
    });

    it('should handle subscription.updated event', async () => {
      const updatedEvent = {
        ...mockWebhookEvent,
        type: 'customer.subscription.updated',
      };
      (mockStripe.webhooks.constructEvent as MockedFunction<any>).mockReturnValue(updatedEvent);

      mockSubscriptionService.assignPlan.mockResolvedValue({
        id: 'store-123',
        subscriptionPlan: 'BASIC',
      });

      const result = await handleStripeWebhook({
        body: 'webhook_body',
        signature: 'webhook_signature',
      });

      expect(result).toEqual({ success: true, eventType: 'customer.subscription.updated' });
      expect(mockSubscriptionService.assignPlan).toHaveBeenCalled();
    });

    it('should handle subscription.deleted event', async () => {
      const deletedEvent = {
        ...mockWebhookEvent,
        type: 'customer.subscription.deleted',
        data: {
          object: {
            ...mockWebhookEvent.data.object,
            status: 'canceled',
          },
        },
      };
      (mockStripe.webhooks.constructEvent as MockedFunction<any>).mockReturnValue(deletedEvent);

      mockSubscriptionService.assignPlan.mockResolvedValue({
        id: 'store-123',
        subscriptionPlan: 'FREE',
      });

      const result = await handleStripeWebhook({
        body: 'webhook_body',
        signature: 'webhook_signature',
      });

      expect(result).toEqual({ success: true, eventType: 'customer.subscription.deleted' });
      expect(mockSubscriptionService.assignPlan).toHaveBeenCalledWith(
        'store-123',
        'FREE' // Should downgrade to FREE plan
      );
    });

    it('should handle invoice.payment_succeeded event', async () => {
      const invoiceEvent = {
        ...mockWebhookEvent,
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            subscription: 'sub_test_subscription',
            customer: 'cus_test_customer',
            metadata: {
              storeId: 'store-123',
            },
          },
        },
      };
      (mockStripe.webhooks.constructEvent as MockedFunction<any>).mockReturnValue(invoiceEvent);

      const result = await handleStripeWebhook({
        body: 'webhook_body',
        signature: 'webhook_signature',
      });

      expect(result).toEqual({ success: true, eventType: 'invoice.payment_succeeded' });
    });

    it('should handle unhandled event types gracefully', async () => {
      const unhandledEvent = {
        ...mockWebhookEvent,
        type: 'customer.created',
      };
      (mockStripe.webhooks.constructEvent as MockedFunction<any>).mockReturnValue(unhandledEvent);

      const result = await handleStripeWebhook({
        body: 'webhook_body',
        signature: 'webhook_signature',
      });

      expect(result).toEqual({ success: true, eventType: 'customer.created' });
    });

    it('should handle webhook signature verification failure', async () => {
      (mockStripe.webhooks.constructEvent as MockedFunction<any>).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        handleStripeWebhook({
          body: 'webhook_body',
          signature: 'invalid_signature',
        })
      ).rejects.toThrow('Invalid signature');
    });

    it('should handle missing store ID in subscription metadata', async () => {
      const eventWithoutStoreId = {
        ...mockWebhookEvent,
        data: {
          object: {
            ...mockWebhookEvent.data.object,
            metadata: {}, // No storeId
          },
        },
      };
      (mockStripe.webhooks.constructEvent as MockedFunction<any>).mockReturnValue(eventWithoutStoreId);

      await expect(
        handleStripeWebhook({
          body: 'webhook_body',
          signature: 'webhook_signature',
        })
      ).rejects.toThrow('Store ID not found in subscription metadata');
    });

    it('should handle price lookup key mapping correctly', async () => {
      const eventWithLookupKey = {
        ...mockWebhookEvent,
        data: {
          object: {
            ...mockWebhookEvent.data.object,
            items: {
              data: [
                {
                  price: {
                    id: 'price_pro_monthly',
                    lookup_key: 'pro',
                  },
                },
              ],
            },
          },
        },
      };
      (mockStripe.webhooks.constructEvent as MockedFunction<any>).mockReturnValue(eventWithLookupKey);

      mockSubscriptionService.assignPlan.mockResolvedValue({
        id: 'store-123',
        subscriptionPlan: 'PRO',
      });

      await handleStripeWebhook({
        body: 'webhook_body',
        signature: 'webhook_signature',
      });

      expect(mockSubscriptionService.assignPlan).toHaveBeenCalledWith(
        'store-123',
        'PRO',
        'sub_test_subscription'
      );
    });

    it('should handle missing webhook secret', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;

      await expect(
        handleStripeWebhook({
          body: 'webhook_body',
          signature: 'webhook_signature',
        })
      ).rejects.toThrow('STRIPE_WEBHOOK_SECRET is not configured');
    });
  });

  describe('Error scenarios', () => {
    it('should handle Stripe API rate limiting', async () => {
      const rateLimitError = new Error('Too many requests');
      (rateLimitError as any).type = 'StripeRateLimitError';
      
      (mockStripe.checkout.sessions.create as MockedFunction<any>).mockRejectedValue(rateLimitError);

      await expect(
        createSubscriptionCheckoutSession({
          priceId: 'price_basic_monthly',
          storeId: 'store-123',
        })
      ).rejects.toThrow('Too many requests');
    });

    it('should handle invalid price ID', async () => {
      const invalidPriceError = new Error('No such price');
      (invalidPriceError as any).type = 'StripeInvalidRequestError';
      
      (mockStripe.checkout.sessions.create as MockedFunction<any>).mockRejectedValue(invalidPriceError);

      await expect(
        createSubscriptionCheckoutSession({
          priceId: 'invalid_price_id',
          storeId: 'store-123',
        })
      ).rejects.toThrow('No such price');
    });

    it('should handle network connectivity issues', async () => {
      const networkError = new Error('Network error');
      (networkError as any).code = 'ECONNREFUSED';
      
      (mockStripe.checkout.sessions.create as MockedFunction<any>).mockRejectedValue(networkError);

      await expect(
        createSubscriptionCheckoutSession({
          priceId: 'price_basic_monthly',
          storeId: 'store-123',
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Configuration validation', () => {
    it('should throw error when STRIPE_SECRET_KEY is missing', async () => {
      delete process.env.STRIPE_SECRET_KEY;

      await expect(
        createSubscriptionCheckoutSession({
          priceId: 'price_basic_monthly',
          storeId: 'store-123',
        })
      ).rejects.toThrow('STRIPE_SECRET_KEY is required for Stripe operations');
    });

    it('should throw error when NEXT_PUBLIC_BASE_URL is missing', async () => {
      delete process.env.NEXT_PUBLIC_BASE_URL;

      await expect(
        createSubscriptionCheckoutSession({
          priceId: 'price_basic_monthly',
          storeId: 'store-123',
        })
      ).rejects.toThrow('NEXT_PUBLIC_BASE_URL is required');
    });
  });
});