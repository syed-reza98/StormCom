/**
 * CheckoutService: Cart validation, shipping calculation, and order creation
 * 
 * Handles checkout flow:
 * - Validates cart items and stock availability
 * - Calculates shipping costs based on address and items
 * - Creates orders with order items and payment records
 * - Handles order number generation and multi-tenant isolation
 */

import { db } from '@/lib/db';
import type { Decimal } from '@prisma/client/runtime/library';

/**
 * Cart item structure for checkout validation
 */
export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
}

/**
 * Shipping address for calculation
 */
export interface ShippingAddress {
  country: string;
  state?: string;
  city: string;
  postalCode: string;
  address1: string;
  address2?: string;
}

/**
 * Shipping option returned by calculation
 */
export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  estimatedDays: string;
}

/**
 * Validated cart result with product details
 */
export interface ValidatedCart {
  isValid: boolean;
  errors: string[];
  items: ValidatedCartItem[];
  subtotal: number;
}

export interface ValidatedCartItem {
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  sku: string;
  image?: string;
  price: number;
  quantity: number;
  availableStock: number;
  subtotal: number;
}

/**
 * Order creation input
 */
export interface CreateOrderInput {
  storeId: string;
  customerId?: string;
  userId?: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  shippingMethod: string;
  shippingCost: number;
  discountCode?: string;
  customerNote?: string;
  ipAddress?: string;
}

/**
 * Created order result
 */
export interface CreatedOrder {
  id: string;
  orderNumber: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: string;
  items: {
    id: string;
    productName: string;
    variantName?: string;
    sku: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
}

/**
 * Validate cart items and check stock availability
 */
export async function validateCart(
  storeId: string,
  items: CartItem[]
): Promise<ValidatedCart> {
  const errors: string[] = [];
  const validatedItems: ValidatedCartItem[] = [];
  let subtotal = 0;

  // Validate each cart item
  for (const item of items) {
    // Fetch product with variant
    const product = await db.product.findFirst({
      where: {
        id: item.productId,
        storeId,
        isPublished: true,
        deletedAt: null,
      },
      include: {
        variants: item.variantId
          ? {
              where: { id: item.variantId },
            }
          : false,
      },
    });

    if (!product) {
      errors.push(`Product ${item.productId} not found or unavailable`);
      continue;
    }

    // Check variant if specified
    const variant = item.variantId
      ? (product.variants as any)?.[0]
      : undefined;
    if (item.variantId && !variant) {
      errors.push(`Variant ${item.variantId} not found for product ${product.name}`);
      continue;
    }

    // Determine stock and price
    const availableStock = variant?.stock ?? product.inventoryQty;
    const price = variant?.price ?? product.price;
    const trackInventory = variant?.trackInventory ?? product.trackInventory;

    // Validate quantity
    if (item.quantity <= 0) {
      errors.push(`Invalid quantity for ${product.name}`);
      continue;
    }

    // Check stock only if inventory tracking is enabled
    if (trackInventory && item.quantity > availableStock) {
      errors.push(
        `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`
      );
      continue;
    }

    // Calculate item subtotal
    const itemSubtotal = price * item.quantity;
    subtotal += itemSubtotal;

    // Add validated item
    validatedItems.push({
      productId: product.id,
      variantId: variant?.id,
      productName: product.name,
      variantName: variant?.name,
      sku: variant?.sku ?? product.sku,
      image: product.thumbnailUrl ?? undefined,
      price,
      quantity: item.quantity,
      availableStock,
      subtotal: itemSubtotal,
    });
  }

  return {
    isValid: errors.length === 0 && validatedItems.length > 0,
    errors,
    items: validatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
  };
}

/**
 * Calculate shipping options based on address and cart weight
 */
export async function calculateShipping(
  storeId: string,
  shippingAddress: ShippingAddress,
  cartItems: CartItem[]
): Promise<ShippingOption[]> {
  // TODO: Integrate with real shipping API (e.g., Shippo, EasyPost)
  // For now, return mock shipping options based on country

  const isDomestic = shippingAddress.country === 'US';
  const totalWeight = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const options: ShippingOption[] = [
    {
      id: 'standard',
      name: isDomestic ? 'Standard Shipping' : 'International Standard',
      description: isDomestic ? '5-7 business days' : '10-15 business days',
      cost: isDomestic ? 5.99 : 15.99,
      estimatedDays: isDomestic ? '5-7 days' : '10-15 days',
    },
    {
      id: 'express',
      name: isDomestic ? 'Express Shipping' : 'International Express',
      description: isDomestic ? '2-3 business days' : '5-7 business days',
      cost: isDomestic ? 12.99 : 29.99,
      estimatedDays: isDomestic ? '2-3 days' : '5-7 days',
    },
  ];

  // Add free shipping for domestic orders over $50
  if (isDomestic && totalWeight > 0) {
    const cartSubtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    if (cartSubtotal >= 50) {
      options.push({
        id: 'free',
        name: 'Free Shipping',
        description: '7-10 business days',
        cost: 0,
        estimatedDays: '7-10 days',
      });
    }
  }

  return options;
}

/**
 * Calculate tax amount based on address and subtotal
 */
export function calculateTax(
  shippingAddress: ShippingAddress,
  subtotal: number
): number {
  // TODO: Integrate with real tax API (e.g., TaxJar, Avalara)
  // For now, use simple state-based tax rates

  const stateTaxRates: Record<string, number> = {
    CA: 0.0725, // California
    NY: 0.08, // New York
    TX: 0.0625, // Texas
    FL: 0.06, // Florida
    // Add more states as needed
  };

  const taxRate = stateTaxRates[shippingAddress.state ?? ''] ?? 0;
  return Math.round(subtotal * taxRate * 100) / 100;
}

/**
 * Generate unique order number for store
 */
export async function generateOrderNumber(storeId: string): Promise<string> {
  // Get count of orders for this store to generate sequential number
  const orderCount = await db.order.count({
    where: { storeId },
  });

  // Format: ORD-XXXXX (e.g., ORD-00001, ORD-00042)
  const orderNum = (orderCount + 1).toString().padStart(5, '0');
  return `ORD-${orderNum}`;
}

/**
 * Create order with items and payment record
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<CreatedOrder> {
  // Validate cart first
  const validated = await validateCart(input.storeId, input.items);
  if (!validated.isValid) {
    throw new Error(`Cart validation failed: ${validated.errors.join(', ')}`);
  }

  // Calculate totals
  const subtotal = validated.subtotal;
  const taxAmount = calculateTax(input.shippingAddress, subtotal);
  const shippingAmount = input.shippingCost;
  const discountAmount = 0; // TODO: Apply discount code
  const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

  // Generate order number
  const orderNumber = await generateOrderNumber(input.storeId);

  // Create addresses first
  const shippingAddressRecord = await db.address.create({
    data: {
      storeId: input.storeId,
      type: 'SHIPPING',
      firstName: 'Customer', // TODO: Get from customer record
      lastName: 'Name',
      country: input.shippingAddress.country,
      state: input.shippingAddress.state,
      city: input.shippingAddress.city,
      postalCode: input.shippingAddress.postalCode,
      address1: input.shippingAddress.address1,
      address2: input.shippingAddress.address2,
      isDefault: false,
    },
  });

  const billingAddressRecord = input.billingAddress
    ? await db.address.create({
        data: {
          storeId: input.storeId,
          type: 'BILLING',
          firstName: 'Customer',
          lastName: 'Name',
          country: input.billingAddress.country,
          state: input.billingAddress.state,
          city: input.billingAddress.city,
          postalCode: input.billingAddress.postalCode,
          address1: input.billingAddress.address1,
          address2: input.billingAddress.address2,
          isDefault: false,
        },
      })
    : shippingAddressRecord;

  // Create order with items in transaction
  const order = await db.$transaction(async (tx) => {
    // Create order
    const newOrder = await tx.order.create({
      data: {
        storeId: input.storeId,
        customerId: input.customerId,
        userId: input.userId,
        orderNumber,
        status: 'PENDING',
        shippingAddressId: shippingAddressRecord.id,
        billingAddressId: billingAddressRecord.id,
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount,
        totalAmount,
        discountCode: input.discountCode,
        paymentStatus: 'PENDING',
        shippingMethod: input.shippingMethod,
        shippingStatus: 'PENDING',
        customerNote: input.customerNote,
        ipAddress: input.ipAddress,
      },
    });

    // Create order items
    const orderItems = await Promise.all(
      validated.items.map((item) =>
        tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName,
            sku: item.sku,
            image: item.image,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
            taxAmount: 0, // TODO: Calculate per-item tax
            discountAmount: 0,
            totalAmount: item.subtotal,
          },
        })
      )
    );

    // Reduce inventory for each item
    for (const item of validated.items) {
      if (item.variantId) {
        // Update variant stock
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      } else {
        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            inventoryQty: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    return { ...newOrder, items: orderItems };
  });

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    subtotal: Number(order.subtotal),
    taxAmount: Number(order.taxAmount),
    shippingAmount: Number(order.shippingAmount),
    discountAmount: Number(order.discountAmount),
    totalAmount: Number(order.totalAmount),
    status: order.status,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      variantName: item.variantName ?? undefined,
      sku: item.sku,
      price: Number(item.price),
      quantity: item.quantity,
      subtotal: Number(item.subtotal),
    })),
  };
}
