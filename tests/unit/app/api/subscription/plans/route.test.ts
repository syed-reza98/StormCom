// tests/unit/app/api/subscription/plans/route.test.ts
// Unit tests for subscription plans API route

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/subscription/plans/route';
import { getSessionFromRequest } from '@/lib/auth-helpers';
import { SubscriptionService } from '@/services/subscription-service';

// Mock dependencies
vi.mock('@/lib/auth-helpers', () => ({
  getSessionFromRequest: vi.fn(),
}));

vi.mock('@/services/subscription-service', () => ({
  SubscriptionService: {
    getPlanDetails: vi.fn(),
    getUsageStatistics: vi.fn(),
    SUBSCRIPTION_PLANS: {
      FREE: {
        name: 'Free',
        price: 0,
        features: ['Basic features'],
        limits: { products: 10, orders: 100 },
      },
      BASIC: {
        name: 'Basic',
        price: 29,
        features: ['All Free features', 'Advanced analytics'],
        limits: { products: 100, orders: 1000 },
      },
      PRO: {
        name: 'Pro',
        price: 99,
        features: ['All Basic features', 'Priority support'],
        limits: { products: 1000, orders: 10000 },
      },
    },
  },
}));

const mockGetSessionFromRequest = getSessionFromRequest as MockedFunction<typeof getSessionFromRequest>;
const mockGetPlanDetails = SubscriptionService.getPlanDetails as MockedFunction<any>;
const mockGetUsageStatistics = SubscriptionService.getUsageStatistics as MockedFunction<any>;

describe('/api/subscription/plans GET', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest('http://localhost:3000/api/subscription/plans');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return all subscription plans successfully', async () => {
    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    mockGetPlanDetails.mockResolvedValue({
      plan: 'BASIC',
      limits: { products: 100, orders: 1000 },
      status: 'ACTIVE',
    });

    mockGetUsageStatistics.mockResolvedValue({
      products: { current: 25, limit: 100, percentage: 25 },
      orders: { current: 150, limit: 1000, percentage: 15 },
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('plans');
    expect(data.data).toHaveProperty('currentPlan');
    expect(data.data).toHaveProperty('usage');

    // Check plans structure
    expect(data.data.plans).toHaveLength(3);
    expect(data.data.plans[0]).toMatchObject({
      id: 'FREE',
      name: 'Free',
      price: 0,
      features: expect.arrayContaining(['Basic features']),
      limits: { products: 10, orders: 100 },
    });

    // Check current plan
    expect(data.data.currentPlan).toMatchObject({
      plan: 'BASIC',
      limits: { products: 100, orders: 1000 },
      status: 'ACTIVE',
    });

    // Check usage statistics
    expect(data.data.usage).toMatchObject({
      products: { current: 25, limit: 100, percentage: 25 },
      orders: { current: 150, limit: 1000, percentage: 15 },
    });
  });

  it('should return 401 when user is not authenticated', async () => {
    mockGetSessionFromRequest.mockResolvedValue(null);

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toMatchObject({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  });

  it('should handle missing storeId in session', async () => {
    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: null,
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: {
        code: 'MISSING_STORE_ID',
        message: 'Store ID is required',
      },
    });
  });

  it('should handle SubscriptionService errors gracefully', async () => {
    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    mockGetPlanDetails.mockRejectedValue(new Error('Database connection failed'));

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toMatchObject({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch subscription plans',
      },
    });
  });

  it('should handle usage statistics fetch failure', async () => {
    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    mockGetPlanDetails.mockResolvedValue({
      plan: 'BASIC',
      limits: { products: 100, orders: 1000 },
      status: 'ACTIVE',
    });

    mockGetUsageStatistics.mockRejectedValue(new Error('Usage calculation failed'));

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toMatchObject({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch subscription plans',
      },
    });
  });

  it('should return empty usage when current plan is not found', async () => {
    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    mockGetPlanDetails.mockResolvedValue(null);
    mockGetUsageStatistics.mockResolvedValue({
      products: { current: 0, limit: 0, percentage: 0 },
      orders: { current: 0, limit: 0, percentage: 0 },
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.currentPlan).toBeNull();
    expect(data.data.usage).toMatchObject({
      products: { current: 0, limit: 0, percentage: 0 },
      orders: { current: 0, limit: 0, percentage: 0 },
    });
  });

  it('should include correct plan pricing information', async () => {
    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    mockGetPlanDetails.mockResolvedValue({
      plan: 'FREE',
      limits: { products: 10, orders: 100 },
      status: 'ACTIVE',
    });

    mockGetUsageStatistics.mockResolvedValue({
      products: { current: 5, limit: 10, percentage: 50 },
      orders: { current: 25, limit: 100, percentage: 25 },
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    const freePlan = data.data.plans.find((p: any) => p.id === 'FREE');
    const basicPlan = data.data.plans.find((p: any) => p.id === 'BASIC');
    const proPlan = data.data.plans.find((p: any) => p.id === 'PRO');

    expect(freePlan.price).toBe(0);
    expect(basicPlan.price).toBe(29);
    expect(proPlan.price).toBe(99);
  });

  it('should include feature lists for all plans', async () => {
    mockGetSessionFromRequest.mockResolvedValue({
      userId: 'user-123',
      storeId: 'store-123',
    });

    mockGetPlanDetails.mockResolvedValue({
      plan: 'PRO',
      limits: { products: 1000, orders: 10000 },
      status: 'ACTIVE',
    });

    mockGetUsageStatistics.mockResolvedValue({
      products: { current: 500, limit: 1000, percentage: 50 },
      orders: { current: 2000, limit: 10000, percentage: 20 },
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    
    data.data.plans.forEach((plan: any) => {
      expect(plan).toHaveProperty('features');
      expect(Array.isArray(plan.features)).toBe(true);
      expect(plan.features.length).toBeGreaterThan(0);
    });
  });
});