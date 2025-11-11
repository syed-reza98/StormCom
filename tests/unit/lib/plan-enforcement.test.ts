// tests/unit/lib/plan-enforcement.test.ts
// Unit tests for plan enforcement middleware and wrapper functions

import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { 
  withPlanLimits,
  enforcePlanLimits,
  checkProductCreationLimit,
  checkOrderCreationLimit 
} from '@/lib/plan-enforcement';
import { SubscriptionService } from '@/services/subscription-service';
import { getServerSession } from 'next-auth/next';

// Mock dependencies
vi.mock('@/services/subscription-service', () => ({
  SubscriptionService: {
    canCreateProduct: vi.fn(),
    canCreateOrder: vi.fn(),
  },
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

const mockCanCreateProduct = SubscriptionService.canCreateProduct as MockedFunction<any>;
const mockCanCreateOrder = SubscriptionService.canCreateOrder as MockedFunction<any>;
const mockGetServerSession = getServerSession as MockedFunction<typeof getServerSession>;

describe('Plan Enforcement Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkProductCreationLimit', () => {
    it('should allow product creation when within limits', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      mockCanCreateProduct.mockResolvedValue({ allowed: true });

      const request = new NextRequest('http://localhost:3000/api/products');
      const result = await checkProductCreationLimit(request);

      expect(result).toBeNull(); // No error response
      expect(mockCanCreateProduct).toHaveBeenCalledWith('store-123');
    });

    it('should block product creation when limit exceeded', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      mockCanCreateProduct.mockResolvedValue({ allowed: false });

      const request = new NextRequest('http://localhost:3000/api/products');
      const result = await checkProductCreationLimit(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(403);
      
      const data = await result?.json();
      expect(data).toMatchObject({
        error: {
          code: 'PLAN_LIMIT_EXCEEDED',
          message: 'Product creation limit exceeded for your current plan',
        },
      });
    });

    it('should return error when session is not found', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/products');
      const result = await checkProductCreationLimit(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(401);
      
      const data = await result?.json();
      expect(data).toMatchObject({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    });

    it('should return error when storeId is missing', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: null,
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      const request = new NextRequest('http://localhost:3000/api/products');
      const result = await checkProductCreationLimit(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(400);
      
      const data = await result?.json();
      expect(data).toMatchObject({
        error: {
          code: 'MISSING_STORE_ID',
          message: 'Store ID is required',
        },
      });
    });

    it('should handle service errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      mockCanCreateProduct.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/products');
      const result = await checkProductCreationLimit(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(500);
      
      const data = await result?.json();
      expect(data).toMatchObject({
        error: {
          code: 'PLAN_CHECK_FAILED',
          message: 'Failed to check plan limits',
        },
      });
    });
  });

  describe('checkOrderCreationLimit', () => {
    it('should allow order creation when within limits', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      mockCanCreateOrder.mockResolvedValue({ allowed: true });

      const request = new NextRequest('http://localhost:3000/api/orders');
      const result = await checkOrderCreationLimit(request);

      expect(result).toBeNull(); // No error response
      expect(mockCanCreateOrder).toHaveBeenCalledWith('store-123');
    });

    it('should block order creation when limit exceeded', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      mockCanCreateOrder.mockResolvedValue({ allowed: false });

      const request = new NextRequest('http://localhost:3000/api/orders');
      const result = await checkOrderCreationLimit(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(403);
      
      const data = await result?.json();
      expect(data).toMatchObject({
        error: {
          code: 'PLAN_LIMIT_EXCEEDED',
          message: 'Order creation limit exceeded for your current plan',
        },
      });
    });

    it('should return error when session is not found', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/orders');
      const result = await checkOrderCreationLimit(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(401);
    });

    it('should handle service errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      mockCanCreateOrder.mockRejectedValue(new Error('Service unavailable'));

      const request = new NextRequest('http://localhost:3000/api/orders');
      const result = await checkOrderCreationLimit(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(500);
    });
  });

  describe('enforcePlanLimits', () => {
    const mockHandler = vi.fn();

    beforeEach(() => {
      mockHandler.mockClear();
    });

    it('should call handler when product creation is allowed', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      mockCanCreateProduct.mockResolvedValue({ allowed: true });
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
      });

      const result = await enforcePlanLimits(
        request,
        mockHandler,
        'product'
      );

      expect(mockHandler).toHaveBeenCalledWith(request);
      expect(result).toBeInstanceOf(NextResponse);
      
      const data = await result.json();
      expect(data).toMatchObject({ success: true });
    });

    it('should call handler when order creation is allowed', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      mockCanCreateOrder.mockResolvedValue({ allowed: true });
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
      });

      await enforcePlanLimits(
        request,
        mockHandler,
        'order'
      );

      expect(mockHandler).toHaveBeenCalledWith(request);
      expect(mockCanCreateOrder).toHaveBeenCalledWith('store-123');
    });

    it('should block handler when product limit exceeded', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      mockCanCreateProduct.mockResolvedValue({ allowed: false });

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
      });

      const result = await enforcePlanLimits(
        request,
        mockHandler,
        'product'
      );

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(NextResponse);
      expect(result.status).toBe(403);
    });

    it('should handle invalid resource type', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      const request = new NextRequest('http://localhost:3000/api/invalid');

      const result = await enforcePlanLimits(
        request,
        mockHandler,
        'invalid' as any
      );

      expect(mockHandler).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(NextResponse);
      expect(result.status).toBe(400);
      
      const data = await result.json();
      expect(data).toMatchObject({
        error: {
          code: 'INVALID_RESOURCE_TYPE',
          message: 'Invalid resource type for plan enforcement',
        },
      });
    });

    it('should allow GET requests without limit checks', async () => {
      mockHandler.mockResolvedValue(NextResponse.json({ data: [] }));

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'GET',
      });

      await enforcePlanLimits(
        request,
        mockHandler,
        'product'
      );

      expect(mockHandler).toHaveBeenCalledWith(request);
      expect(mockCanCreateProduct).not.toHaveBeenCalled();
    });

    it('should allow PUT and PATCH requests without limit checks', async () => {
      mockHandler.mockResolvedValue(NextResponse.json({ updated: true }));

      const putRequest = new NextRequest('http://localhost:3000/api/products/123', {
        method: 'PUT',
      });

      const patchRequest = new NextRequest('http://localhost:3000/api/products/123', {
        method: 'PATCH',
      });

      await enforcePlanLimits(putRequest, mockHandler, 'product');
      await enforcePlanLimits(patchRequest, mockHandler, 'product');

      expect(mockHandler).toHaveBeenCalledTimes(2);
      expect(mockCanCreateProduct).not.toHaveBeenCalled();
    });

    it('should allow DELETE requests without limit checks', async () => {
      mockHandler.mockResolvedValue(NextResponse.json({ deleted: true }));

      const request = new NextRequest('http://localhost:3000/api/products/123', {
        method: 'DELETE',
      });

      await enforcePlanLimits(
        request,
        mockHandler,
        'product'
      );

      expect(mockHandler).toHaveBeenCalledWith(request);
      expect(mockCanCreateProduct).not.toHaveBeenCalled();
    });
  });

  describe('withPlanLimits', () => {
    const mockHandler = vi.fn();

    beforeEach(() => {
      mockHandler.mockClear();
    });

    it('should create a wrapped handler for product enforcement', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      mockCanCreateProduct.mockResolvedValue({ allowed: true });
      mockHandler.mockResolvedValue(NextResponse.json({ created: true }));

      const wrappedHandler = withPlanLimits(mockHandler, 'product');

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
      });

      const result = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(request, undefined);
      expect(result).toBeInstanceOf(NextResponse);
      
      const data = await result.json();
      expect(data).toMatchObject({ created: true });
    });

    it('should create a wrapped handler for order enforcement', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      mockCanCreateOrder.mockResolvedValue({ allowed: true });
      mockHandler.mockResolvedValue(NextResponse.json({ created: true }));

      const wrappedHandler = withPlanLimits(mockHandler, 'order');

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
      });

      await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(request, undefined);
      expect(mockCanCreateOrder).toHaveBeenCalledWith('store-123');
    });

    it('should preserve handler context and parameters', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      mockCanCreateProduct.mockResolvedValue({ allowed: true });
      
      // Handler that uses parameters
      const parameterizedHandler = vi.fn((_request, { params }) => {
        return Promise.resolve(NextResponse.json({ id: params.id }));
      });

      const wrappedHandler = withPlanLimits(parameterizedHandler, 'product');

      const request = new NextRequest('http://localhost:3000/api/products');
      const context = { params: { id: '123' } };

      const result = await wrappedHandler(request, context);

      expect(parameterizedHandler).toHaveBeenCalledWith(request, context);
      
      const data = await result.json();
      expect(data).toMatchObject({ id: '123' });
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle session timeout errors', async () => {
      const timeoutError = new Error('Session timeout');
      (timeoutError as any).code = 'SESSION_TIMEOUT';
      
      mockGetServerSession.mockRejectedValue(timeoutError);

      const request = new NextRequest('http://localhost:3000/api/products');
      const result = await checkProductCreationLimit(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(500); // Session errors return 500, not 401
    });

    it('should handle database connection errors', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      const dbError = new Error('Connection refused');
      (dbError as any).code = 'ECONNREFUSED';
      
      mockCanCreateProduct.mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/products');
      const result = await checkProductCreationLimit(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(500);
    });

    it('should handle malformed session data', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: null,
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
        // Missing storeId intentionally set to null to test error
      });

      const request = new NextRequest('http://localhost:3000/api/products');
      const result = await checkProductCreationLimit(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(400);
    });

    it('should handle concurrent limit checks', async () => {
      mockGetServerSession.mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        storeId: 'store-123',
        role: 'STORE_ADMIN',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        lastAccessedAt: Date.now(),
      });

      mockCanCreateProduct.mockResolvedValue({ allowed: true });
      mockCanCreateOrder.mockResolvedValue({ allowed: false });

      const productRequest = new NextRequest('http://localhost:3000/api/products');
      const orderRequest = new NextRequest('http://localhost:3000/api/orders');

      const [productResult, orderResult] = await Promise.all([
        checkProductCreationLimit(productRequest),
        checkOrderCreationLimit(orderRequest),
      ]);

      expect(productResult).toBeNull(); // Allowed
      expect(orderResult).toBeInstanceOf(NextResponse); // Blocked
      expect(orderResult?.status).toBe(403);
    });
  });
});
