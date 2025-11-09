/**
 * Unit tests for CheckoutService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/lib/db';
import {
  validateCart,
  calculateShipping,
  calculateTax,
  generateOrderNumber,
  createOrder,
  type CartItem,
  type ShippingAddress,
  type CreateOrderInput,
} from '@/services/checkout-service';

// Mock Prisma client
vi.mock('@/lib/db', () => ({
  db: {
    product: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    productVariant: {
      findMany: vi.fn(),
    },
    order: {
      count: vi.fn(),
      create: vi.fn(),
    },
    address: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('CheckoutService - validateCart', () => {
  const storeId = 'store-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate cart with all items in stock', async () => {
    const cartItems: CartItem[] = [
      { productId: 'prod-1', quantity: 2, price: 29.99 },
      { productId: 'prod-2', quantity: 1, price: 49.99 },
    ];

    vi.mocked(db.product.findMany).mockResolvedValue([
      {
        id: 'prod-1',
        name: 'Product 1',
        slug: 'product-1',
        sku: 'SKU-1',
        price: 29.99,
        thumbnailUrl: '/images/prod-1.jpg',
        inventoryQty: 10,
        trackInventory: true,
        storeId,
        variants: [],
      } as any,
      {
        id: 'prod-2',
        name: 'Product 2',
        slug: 'product-2',
        sku: 'SKU-2',
        price: 49.99,
        thumbnailUrl: '/images/prod-2.jpg',
        inventoryQty: 5,
        trackInventory: true,
        storeId,
        variants: [],
      } as any,
    ]);

    const result = await validateCart(storeId, cartItems);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.items).toHaveLength(2);
    expect(result.subtotal).toBe(109.97); // (29.99 * 2) + (49.99 * 1)
  });

  it('should return error when product not found', async () => {
    const cartItems: CartItem[] = [
      { productId: 'invalid-prod', quantity: 1, price: 29.99 },
    ];

    vi.mocked(db.product.findMany).mockResolvedValue([]);

    const result = await validateCart(storeId, cartItems);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Product invalid-prod not found or unavailable');
    expect(result.items).toHaveLength(0);
  });

  it('should return error when insufficient stock', async () => {
    const cartItems: CartItem[] = [
      { productId: 'prod-1', quantity: 15, price: 29.99 },
    ];

    vi.mocked(db.product.findMany).mockResolvedValue([
      {
        id: 'prod-1',
        name: 'Product 1',
        slug: 'product-1',
        sku: 'SKU-1',
        price: 29.99,
        thumbnailUrl: '/images/prod-1.jpg',
        inventoryQty: 10,
        trackInventory: true,
        storeId,
        variants: [],
      } as any,
    ]);

    const result = await validateCart(storeId, cartItems);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Insufficient stock for Product 1. Available: 10, Requested: 15');
  });

  it('should validate variant stock correctly', async () => {
    const cartItems: CartItem[] = [
      { productId: 'prod-1', variantId: 'var-1', quantity: 3, price: 29.99 },
    ];

    vi.mocked(db.product.findMany).mockResolvedValue([
      {
        id: 'prod-1',
        name: 'Product 1',
        slug: 'product-1',
        sku: 'SKU-1',
        price: 29.99,
        thumbnailUrl: '/images/prod-1.jpg',
        inventoryQty: 20,
        trackInventory: true,
        storeId,
        variants: [
          {
            id: 'var-1',
            productId: 'prod-1',
            name: 'Size M',
            sku: 'SKU-1-M',
            price: 29.99,
            inventoryQty: 5,
          } as any,
        ],
      } as any,
    ]);

    const result = await validateCart(storeId, cartItems);

    expect(result.isValid).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].availableStock).toBe(5);
  });

  it('should return error when variant stock is insufficient', async () => {
    const cartItems: CartItem[] = [
      { productId: 'prod-1', variantId: 'var-1', quantity: 10, price: 29.99 },
    ];

    vi.mocked(db.product.findMany).mockResolvedValue([
      {
        id: 'prod-1',
        name: 'Product 1',
        slug: 'product-1',
        sku: 'SKU-1',
        price: 29.99,
        thumbnailUrl: '/images/prod-1.jpg',
        inventoryQty: 20,
        trackInventory: true,
        storeId,
        variants: [
          {
            id: 'var-1',
            productId: 'prod-1',
            name: 'Size M',
            sku: 'SKU-1-M',
            price: 29.99,
            inventoryQty: 5,
          } as any,
        ],
      } as any,
    ]);

    const result = await validateCart(storeId, cartItems);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Insufficient stock for Product 1. Available: 5, Requested: 10');
  });

  it('should skip stock validation when trackInventory is false', async () => {
    const cartItems: CartItem[] = [
      { productId: 'prod-1', quantity: 100, price: 29.99 },
    ];

    vi.mocked(db.product.findMany).mockResolvedValue([
      {
        id: 'prod-1',
        name: 'Product 1',
        slug: 'product-1',
        sku: 'SKU-1',
        price: 29.99,
        thumbnailUrl: '/images/prod-1.jpg',
        inventoryQty: 0,
        trackInventory: false,
        storeId,
        variants: [],
      } as any,
    ]);

    const result = await validateCart(storeId, cartItems);

    expect(result.isValid).toBe(true);
    expect(result.items).toHaveLength(1);
  });
});

describe('CheckoutService - calculateShipping', () => {
  it('should return domestic shipping options for US address', async () => {
    const address: ShippingAddress = {
      country: 'US',
      state: 'CA',
      city: 'Los Angeles',
      postalCode: '90001',
      address1: '123 Main St',
    };

    const cartItems: CartItem[] = [
      { productId: 'prod-1', quantity: 2, price: 29.99 },
    ];

    const options = await calculateShipping('store-123', address, cartItems);

    expect(options).toHaveLength(3);
    expect(options[0].id).toBe('standard');
    expect(options[0].cost).toBe(5.99);
    expect(options[1].id).toBe('express');
    expect(options[1].cost).toBe(12.99);
    expect(options[2].id).toBe('free');
    expect(options[2].cost).toBe(0);
  });

  it('should return international shipping options for non-US address', async () => {
    const address: ShippingAddress = {
      country: 'GB',
      city: 'London',
      postalCode: 'SW1A 1AA',
      address1: '10 Downing St',
    };

    const cartItems: CartItem[] = [
      { productId: 'prod-1', quantity: 1, price: 29.99 },
    ];

    const options = await calculateShipping('store-123', address, cartItems);

    expect(options).toHaveLength(2);
    expect(options[0].id).toBe('standard');
    expect(options[0].cost).toBe(15.99);
    expect(options[1].id).toBe('express');
    expect(options[1].cost).toBe(29.99);
  });

  it('should offer free shipping for orders over $50 (domestic)', async () => {
    const address: ShippingAddress = {
      country: 'US',
      state: 'NY',
      city: 'New York',
      postalCode: '10001',
      address1: '123 Broadway',
    };

    const cartItems: CartItem[] = [
      { productId: 'prod-1', quantity: 3, price: 20.00 }, // $60 total
    ];

    const options = await calculateShipping('store-123', address, cartItems);

    const freeOption = options.find(opt => opt.id === 'free');
    expect(freeOption).toBeDefined();
    expect(freeOption?.cost).toBe(0);
  });
});

describe('CheckoutService - calculateTax', () => {
  it('should calculate tax for California (7.25%)', async () => {
    const address: ShippingAddress = {
      country: 'US',
      state: 'CA',
      city: 'San Francisco',
      postalCode: '94102',
      address1: '123 Market St',
    };

    const tax = await calculateTax(address, 100);

    expect(tax).toBe(7.25);
  });

  it('should calculate tax for New York (8%)', async () => {
    const address: ShippingAddress = {
      country: 'US',
      state: 'NY',
      city: 'New York',
      postalCode: '10001',
      address1: '123 Broadway',
    };

    const tax = await calculateTax(address, 100);

    expect(tax).toBe(8);
  });

  it('should return 0 tax for international orders', async () => {
    const address: ShippingAddress = {
      country: 'GB',
      city: 'London',
      postalCode: 'SW1A 1AA',
      address1: '10 Downing St',
    };

    const tax = await calculateTax(address, 100);

    expect(tax).toBe(0);
  });

  it('should return 0 tax for states without tax rate', async () => {
    const address: ShippingAddress = {
      country: 'US',
      state: 'DE',
      city: 'Dover',
      postalCode: '19901',
      address1: '123 Main St',
    };

    const tax = await calculateTax(address, 100);

    expect(tax).toBe(0);
  });
});

describe('CheckoutService - generateOrderNumber', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate order number ORD-00001 for first order', async () => {
    vi.mocked(db.order.count).mockResolvedValue(0);

    const orderNumber = await generateOrderNumber('store-123');

    expect(orderNumber).toBe('ORD-00001');
    expect(db.order.count).toHaveBeenCalledWith({
      where: { storeId: 'store-123' },
    });
  });

  it('should generate order number ORD-00042 for 42nd order', async () => {
    vi.mocked(db.order.count).mockResolvedValue(41);

    const orderNumber = await generateOrderNumber('store-123');

    expect(orderNumber).toBe('ORD-00042');
  });

  it('should generate order number ORD-10000 for 10000th order', async () => {
    vi.mocked(db.order.count).mockResolvedValue(9999);

    const orderNumber = await generateOrderNumber('store-123');

    expect(orderNumber).toBe('ORD-10000');
  });
});

describe('CheckoutService - createOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create order with all details', async () => {
    const input: CreateOrderInput = {
      storeId: 'store-123',
      customerId: 'customer-456',
      items: [
        { productId: 'prod-1', quantity: 2, price: 29.99 },
      ],
      shippingAddress: {
        fullName: 'John Doe',
        phone: '+1234567890',
        country: 'US',
        state: 'CA',
        city: 'Los Angeles',
        postalCode: '90001',
        address1: '123 Main St',
      },
      subtotal: 59.98,
      taxAmount: 4.35,
      shippingCost: 5.99,
      discountAmount: 0,
      shippingMethod: 'standard',
      paymentMethod: 'CREDIT_CARD',
    };

    // Mock product lookup for validateCart
    vi.mocked(db.product.findFirst).mockResolvedValue({
      id: 'prod-1',
      name: 'Product 1',
      slug: 'product-1',
      price: 29.99,
      inventoryQty: 100,
      trackInventory: true,
      storeId: 'store-123',
      variants: [],
    } as any);

    // Mock address creation (outside transaction)
    vi.mocked(db.address.create).mockResolvedValue({
      id: 'addr-1',
      storeId: 'store-123',
      type: 'SHIPPING',
    } as any);

    // Mock transaction
    vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
      const mockTx = {
        order: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockResolvedValue({
            id: 'order-789',
            orderNumber: 'ORD-00001',
            storeId: 'store-123',
            customerId: 'customer-456',
          }),
        },
        orderItem: {
          create: vi.fn().mockResolvedValue({
            id: 'item-1',
            productId: 'prod-1',
            productName: 'Product 1',
            quantity: 2,
            price: 29.99,
          }),
        },
        product: {
          update: vi.fn(),
        },
        productVariant: {
          update: vi.fn(),
        },
      };
      return callback(mockTx);
    });

    const order = await createOrder(input);

    expect(order.orderNumber).toBe('ORD-00001');
    expect(order.items).toHaveLength(1);
    expect(db.$transaction).toHaveBeenCalled();
  });

  it('should create shipping and billing addresses', async () => {
    const input: CreateOrderInput = {
      storeId: 'store-123',
      customerId: 'customer-456',
      items: [{ productId: 'prod-1', quantity: 1, price: 29.99 }],
      shippingAddress: {
        fullName: 'John Doe',
        phone: '+1234567890',
        country: 'US',
        city: 'Los Angeles',
        postalCode: '90001',
        address1: '123 Main St',
      },
      billingAddress: {
        fullName: 'John Doe',
        phone: '+1234567890',
        country: 'US',
        city: 'Los Angeles',
        postalCode: '90001',
        address1: '456 Elm St',
      },
      subtotal: 29.99,
      taxAmount: 2.17,
      shippingCost: 5.99,
      discountAmount: 0,
      shippingMethod: 'standard',
      paymentMethod: 'CREDIT_CARD',
    };

    // Mock product lookup for validateCart
    vi.mocked(db.product.findFirst).mockResolvedValue({
      id: 'prod-1',
      name: 'Product 1',
      slug: 'product-1',
      price: 29.99,
      inventoryQty: 100,
      trackInventory: true,
      storeId: 'store-123',
      variants: [],
    } as any);

    // Mock address creation (outside transaction)
    let addressCreateCallCount = 0;
    (vi.mocked(db.address.create) as any).mockImplementation(async () => {
      addressCreateCallCount++;
      return {
        id: `addr-${addressCreateCallCount}`,
        storeId: 'store-123',
        type: addressCreateCallCount === 1 ? 'SHIPPING' : 'BILLING',
      } as any;
    });

    vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
      const mockTx = {
        order: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockResolvedValue({
            id: 'order-789',
            orderNumber: 'ORD-00001',
          }),
        },
        orderItem: {
          create: vi.fn().mockResolvedValue({
            id: 'item-1',
            productId: 'prod-1',
            productName: 'Product 1',
            quantity: 1,
            price: 29.99,
          }),
        },
        product: { update: vi.fn() },
        productVariant: { update: vi.fn() },
      };
      return callback(mockTx);
    });

    await createOrder(input);

    expect(addressCreateCallCount).toBe(2); // Shipping + billing
  });
});
