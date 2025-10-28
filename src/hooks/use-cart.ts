/**
 * useCart Hook
 * 
 * Client-side cart state management using localStorage.
 * Provides add, remove, update quantity, and clear cart functionality.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  variantId?: string;
  variantName?: string;
  price: number;
  quantity: number;
  image?: string;
  maxQuantity: number;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

const CART_STORAGE_KEY = 'stormcom-cart';

/**
 * Load cart from localStorage
 */
function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
    return [];
  }
}

/**
 * Save cart to localStorage
 */
function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
}

/**
 * Calculate cart totals
 * Note: Rounds totalPrice to 2 decimal places to avoid floating point errors
 */
function calculateTotals(items: CartItem[]): { totalItems: number; totalPrice: number } {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = Math.round(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
  ) / 100;
  return { totalItems, totalPrice };
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart on mount
  useEffect(() => {
    setItems(loadCart());
    setIsLoaded(true);
  }, []);

  // Save cart whenever items change
  useEffect(() => {
    if (isLoaded) {
      saveCart(items);
    }
  }, [items, isLoaded]);

  // Calculate totals
  const { totalItems, totalPrice } = calculateTotals(items);

  /**
   * Add item to cart or increase quantity if already exists
   * Validates item data before adding
   */
  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    // Validate item data
    if (item.price < 0) {
      console.error('Invalid item price: must be non-negative');
      return;
    }
    if (item.maxQuantity <= 0) {
      console.error('Invalid maxQuantity: must be positive');
      return;
    }

    setItems((currentItems) => {
      const existingItemIndex = currentItems.findIndex(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      );

      if (existingItemIndex >= 0) {
        // Item exists, increase quantity
        const newItems = [...currentItems];
        const existingItem = newItems[existingItemIndex];
        const newQuantity = Math.min(
          existingItem.quantity + (item.quantity || 1),
          existingItem.maxQuantity
        );
        newItems[existingItemIndex] = { ...existingItem, quantity: newQuantity };
        return newItems;
      } else {
        // New item, add to cart
        return [
          ...currentItems,
          {
            ...item,
            quantity: Math.min(item.quantity || 1, item.maxQuantity),
          } as CartItem,
        ];
      }
    });
  }, []);

  /**
   * Remove item from cart
   */
  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => !(item.productId === productId && item.variantId === variantId)
      )
    );
  }, []);

  /**
   * Update item quantity
   */
  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    setItems((currentItems) => {
      const newItems = [...currentItems];
      const itemIndex = newItems.findIndex(
        (item) => item.productId === productId && item.variantId === variantId
      );

      if (itemIndex >= 0) {
        const item = newItems[itemIndex];
        const newQuantity = Math.max(1, Math.min(quantity, item.maxQuantity));
        newItems[itemIndex] = { ...item, quantity: newQuantity };
      }

      return newItems;
    });
  }, []);

  /**
   * Clear all items from cart
   */
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  /**
   * Get specific item from cart
   */
  const getItem = useCallback(
    (productId: string, variantId?: string): CartItem | undefined => {
      return items.find(
        (item) => item.productId === productId && item.variantId === variantId
      );
    },
    [items]
  );

  /**
   * Check if item is in cart
   */
  const isInCart = useCallback(
    (productId: string, variantId?: string): boolean => {
      return items.some(
        (item) => item.productId === productId && item.variantId === variantId
      );
    },
    [items]
  );

  return {
    items,
    totalItems,
    totalPrice,
    isLoaded,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItem,
    isInCart,
  };
}
