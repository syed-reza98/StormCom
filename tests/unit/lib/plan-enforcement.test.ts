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
import { getSessionFromRequest } from '@/lib/auth-helpers';

// Mock dependencies
vi.mock('@/services/subscription-service', () => ({
  SubscriptionService: {
    canCreateProduct: vi.fn(),
    canCreateOrder: vi.fn(),
  },
}));

vi.mock('@/lib/auth-helpers', () => ({
  getSessionFromRequest: vi.fn(),
}));

const mockCanCreateProduct = SubscriptionService.canCreateProduct as MockedFunction<any>;
const mockCanCreateOrder = SubscriptionService.canCreateOrder as MockedFunction<any>;
const mockGetSessionFromRequest = getSessionFromRequest as MockedFunction<typeof getSessionFromRequest>;

describe('Plan Enforcement Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkProductCreationLimit', () => {
    it('should allow product creation when within limits', async () => {
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        storeId: 'store-123',
      });

      mockCanCreateProduct.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/products');
      const result = await checkProductCreationLimit(request);

      expect(result).toBeNull(); // No error response
      expect(mockCanCreateProduct).toHaveBeenCalledWith('store-123');
    });

    it('should block product creation when limit exceeded', async () => {
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        storeId: 'store-123',
      });

      mockCanCreateProduct.mockResolvedValue(false);

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
      mockGetSessionFromRequest.mockResolvedValue(null);

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
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        storeId: null,
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
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        storeId: 'store-123',
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
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        storeId: 'store-123',
      });

      mockCanCreateOrder.mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/orders');
      const result = await checkOrderCreationLimit(request);

      expect(result).toBeNull(); // No error response
      expect(mockCanCreateOrder).toHaveBeenCalledWith('store-123');
    });

    it('should block order creation when limit exceeded', async () => {
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        storeId: 'store-123',
      });

      mockCanCreateOrder.mockResolvedValue(false);

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
      mockGetSessionFromRequest.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/orders');
      const result = await checkOrderCreationLimit(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(401);
    });

    it('should handle service errors gracefully', async () => {
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        storeId: 'store-123',
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
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        storeId: 'store-123',
      });

      mockCanCreateProduct.mockResolvedValue(true);
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
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        storeId: 'store-123',
      });

      mockCanCreateOrder.mockResolvedValue(true);
      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
      });

      const result = await enforcePlanLimits(
        request,
        mockHandler,
        'order'
      );

      expect(mockHandler).toHaveBeenCalledWith(request);
      expect(mockCanCreateOrder).toHaveBeenCalledWith('store-123');
    });

    it('should block handler when product limit exceeded', async () => {
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        storeId: 'store-123',
      });

      mockCanCreateProduct.mockResolvedValue(false);

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
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        storeId: 'store-123',
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

      const result = await enforcePlanLimits(
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

      const result = await enforcePlanLimits(
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
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        storeId: 'store-123',
      });

      mockCanCreateProduct.mockResolvedValue(true);
      mockHandler.mockResolvedValue(NextResponse.json({ created: true }));

      const wrappedHandler = withPlanLimits(mockHandler, 'product');

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
      });

      const result = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(request);
      expect(result).toBeInstanceOf(NextResponse);
      
      const data = await result.json();
      expect(data).toMatchObject({ created: true });
    });

    it('should create a wrapped handler for order enforcement', async () => {
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        storeId: 'store-123',
      });

      mockCanCreateOrder.mockResolvedValue(true);
      mockHandler.mockResolvedValue(NextResponse.json({ created: true }));

      const wrappedHandler = withPlanLimits(mockHandler, 'order');

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
      });

      const result = await wrappedHandler(request);

      expect(mockHandler).toHaveBeenCalledWith(request);
      expect(mockCanCreateOrder).toHaveBeenCalledWith('store-123');
    });

    it('should preserve handler context and parameters', async () => {
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        storeId: 'store-123',
      });

      mockCanCreateProduct.mockResolvedValue(true);
      
      // Handler that uses parameters
      const parameterizedHandler = vi.fn((request, { params }) => {
        return NextResponse.json({ id: params.id });
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
      
      mockGetSessionFromRequest.mockRejectedValue(timeoutError);

      const request = new NextRequest('http://localhost:3000/api/products');
      const result = await checkProductCreationLimit(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(401);
    });

    it('should handle database connection errors', async () => {
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        storeId: 'store-123',
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
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        // Missing storeId
      });

      const request = new NextRequest('http://localhost:3000/api/products');
      const result = await checkProductCreationLimit(request);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(400);
    });

    it('should handle concurrent limit checks', async () => {
      mockGetSessionFromRequest.mockResolvedValue({
        userId: 'user-123',
        storeId: 'store-123',
      });

      mockCanCreateProduct.mockResolvedValue(true);
      mockCanCreateOrder.mockResolvedValue(false);

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