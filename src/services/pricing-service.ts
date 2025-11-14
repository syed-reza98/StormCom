/**
 * Server-Side Pricing Service
 * 
 * Recalculates all monetary values server-side for checkout security (FR-002).
 * NEVER trust client-submitted prices, discounts, or totals.
 * 
 * @module pricing-service
 */

import { db } from '@/lib/db';
import { ValidationError, NotFoundError } from '@/lib/errors';

/**
 * Cart item structure from client
 */
export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

/**
 * Shipping method selection
 */
export interface ShippingMethod {
  id: string;
  cost: number;
}

/**
 * Calculated pricing breakdown
 */
export interface PricingCalculation {
  /** Individual line items with unit prices */
  lineItems: LineItemCalculation[];
  /** Subtotal before discounts */
  subtotal: number;
  /** Total discount amount */
  discountTotal: number;
  /** Shipping cost */
  shippingTotal: number;
  /** Tax amount */
  taxTotal: number;
  /** Final grand total */
  grandTotal: number;
  /** Currency code */
  currency: string;
}

/**
 * Line item calculation
 */
export interface LineItemCalculation {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discountApplied: number;
  productName: string;
  sku: string;
}

/**
 * Calculate pricing for checkout
 * All monetary values calculated server-side from database
 * 
 * @param storeId - Store ID for multi-tenant isolation
 * @param items - Cart items with product/variant IDs and quantities
 * @param shippingMethod - Selected shipping method
 * @param discountCode - Optional discount code
 * @returns Complete pricing calculation
 * @throws ValidationError if items invalid or out of stock
 */
export async function calculateCheckoutPricing(
  storeId: string,
  items: CartItem[],
  shippingMethod?: ShippingMethod,
  discountCode?: string
): Promise<PricingCalculation> {
  if (!items || items.length === 0) {
    throw new ValidationError('Cart cannot be empty');
  }

  // Fetch product data from database
  const productIds = items.map(item => item.productId);
  const products = await db.product.findMany({
    where: {
      id: { in: productIds },
      storeId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      price: true,
      sku: true,
      inventoryQty: true,
    },
  });

  // Validate all products found
  if (products.length !== productIds.length) {
    const foundIds = new Set(products.map(p => p.id));
    const missingIds = productIds.filter(id => !foundIds.has(id));
    throw new NotFoundError('Product', missingIds.join(', '));
  }

  // Calculate line items
  const lineItems: LineItemCalculation[] = [];
  let subtotal = 0;
  // Currency is stored at store level, not product level
  const currency = 'USD'; // TODO: Get from store settings

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      throw new NotFoundError('Product', item.productId);
    }

    let unitPrice = product.price;
    let sku = product.sku;
    let inventoryQty = product.inventoryQty;

    // Handle variant pricing if variant selected
    if (item.variantId) {
      // TODO: Add variant support - query ProductVariant table separately
      throw new ValidationError('Product variants not yet supported');
    }

    // Validate inventory
    if (inventoryQty < item.quantity) {
      throw new ValidationError(
        `Insufficient inventory for ${product.name} (requested: ${item.quantity}, available: ${inventoryQty})`
      );
    }

    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    lineItems.push({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      discountApplied: 0, // Will be calculated below
      productName: product.name,
      sku,
    });
  }

  // Calculate discounts
  const discountTotal = await calculateDiscounts(
    storeId,
    subtotal,
    lineItems,
    discountCode
  );

  // Calculate shipping
  const shippingTotal = shippingMethod?.cost || 0;

  // Calculate tax (TODO: Implement tax calculation logic)
  const taxTotal = await calculateTax(storeId, subtotal - discountTotal, shippingTotal);

  // Calculate grand total
  const grandTotal = subtotal - discountTotal + shippingTotal + taxTotal;

  return {
    lineItems,
    subtotal,
    discountTotal,
    shippingTotal,
    taxTotal,
    grandTotal,
    currency,
  };
}

/**
 * Calculate discounts applied to order
 * 
 * @param storeId - Store ID
 * @param subtotal - Subtotal before discounts
 * @param lineItems - Line items (mutated to add discount amounts)
 * @param discountCode - Discount code
 * @returns Total discount amount
 */
async function calculateDiscounts(
  _storeId: string,
  _subtotal: number,
  _lineItems: LineItemCalculation[],
  discountCode?: string
): Promise<number> {
  if (!discountCode) {
    return 0;
  }

  // TODO: Implement discount code lookup and validation
  // For now, return 0 (will be implemented in discount service)
  return 0;
}

/**
 * Calculate tax for order
 * 
 * @param storeId - Store ID
 * @param subtotalAfterDiscount - Subtotal after discounts
 * @param shippingTotal - Shipping cost
 * @returns Tax amount
 */
async function calculateTax(
  _storeId: string,
  _subtotalAfterDiscount: number,
  _shippingTotal: number
): Promise<number> {
  // TODO: Implement tax calculation based on store settings and shipping address
  // For now, return 0 (will be implemented with tax service)
  return 0;
}

/**
 * Validate cart items have sufficient inventory
 * Used before payment validation to avoid payment holds on out-of-stock items
 * 
 * @param storeId - Store ID
 * @param items - Cart items to validate
 * @returns True if all items in stock
 * @throws ValidationError if any item out of stock
 */
export async function validateInventoryAvailability(
  storeId: string,
  items: CartItem[]
): Promise<boolean> {
  const productIds = items.map(item => item.productId);
  
  const products = await db.product.findMany({
    where: {
      id: { in: productIds },
      storeId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      inventoryQty: true,
    },
  });

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      throw new NotFoundError('Product', item.productId);
    }

    let availableQty = product.inventoryQty;
    
    if (item.variantId) {
      // TODO: Add variant support - query ProductVariant table separately
      throw new ValidationError('Product variants not yet supported');
    }

    if (availableQty < item.quantity) {
      throw new ValidationError(
        `Insufficient inventory for ${product.name}`,
        {
          productId: item.productId,
          requested: item.quantity,
          available: availableQty,
        }
      );
    }
  }

  return true;
}
