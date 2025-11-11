/**
 * Unit Tests: useCart Hook
 * 
 * Tests client-side cart state management with localStorage persistence.
 * Validates add, remove, update, clear operations and total calculations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCart, type CartItem } from '@/hooks/use-cart';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useCart Hook', () => {
  const mockCartItem: Omit<CartItem, 'quantity'> = {
    productId: 'product-1',
    productName: 'Test Product',
    productSlug: 'test-product',
    variantId: 'variant-1',
    variantName: 'Small',
    price: 29.99,
    image: 'https://example.com/image.jpg',
    maxQuantity: 10,
  };

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty cart', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPrice).toBe(0);
    });

    it('should load cart from localStorage on mount', async () => {
      const savedCart: CartItem[] = [
        {
          ...mockCartItem,
          quantity: 2,
        },
      ];
      localStorageMock.setItem('stormcom-cart', JSON.stringify(savedCart));

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
      expect(result.current.totalItems).toBe(2);
    });

    it('should handle invalid JSON in localStorage', async () => {
      localStorageMock.setItem('stormcom-cart', 'invalid-json');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.items).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load cart from localStorage:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('addItem', () => {
    it('should add new item to cart', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(mockCartItem);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      expect(result.current.items[0].productId).toBe('product-1');
      expect(result.current.items[0].quantity).toBe(1);
      expect(result.current.totalItems).toBe(1);
      expect(result.current.totalPrice).toBe(29.99);
    });

    it('should add item with custom quantity', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem({ ...mockCartItem, quantity: 3 });
      });

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(3);
      });

      expect(result.current.totalItems).toBe(3);
      expect(result.current.totalPrice).toBe(89.97);
    });

    it('should increase quantity if item already exists', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(mockCartItem);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      act(() => {
        result.current.addItem(mockCartItem);
      });

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(2);
      });

      expect(result.current.items).toHaveLength(1); // Still only one item
      expect(result.current.totalItems).toBe(2);
    });

    it('should respect maxQuantity limit', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem({ ...mockCartItem, quantity: 15, maxQuantity: 10 });
      });

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(10);
      });
    });

    it('should not exceed maxQuantity when adding existing item', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem({ ...mockCartItem, quantity: 9, maxQuantity: 10 });
      });

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(9);
      });

      act(() => {
        result.current.addItem({ ...mockCartItem, quantity: 5, maxQuantity: 10 });
      });

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(10);
      });
    });

    it('should reject item with negative price', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem({ ...mockCartItem, price: -10 });
      });

      expect(result.current.items).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid item price: must be non-negative');

      consoleErrorSpy.mockRestore();
    });

    it('should reject item with invalid maxQuantity', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem({ ...mockCartItem, maxQuantity: 0 });
      });

      expect(result.current.items).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid maxQuantity: must be positive');

      consoleErrorSpy.mockRestore();
    });

    it('should save to localStorage after adding item', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(mockCartItem);
      });

      await waitFor(() => {
        const saved = localStorageMock.getItem('stormcom-cart');
        expect(saved).not.toBeNull();
        const parsed = JSON.parse(saved!);
        expect(parsed).toHaveLength(1);
        expect(parsed[0].productId).toBe('product-1');
      });
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(mockCartItem);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      act(() => {
        result.current.removeItem('product-1', 'variant-1');
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0);
      });

      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPrice).toBe(0);
    });

    it('should only remove matching variant', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem({ ...mockCartItem, variantId: 'variant-1' });
        result.current.addItem({ ...mockCartItem, variantId: 'variant-2' });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      act(() => {
        result.current.removeItem('product-1', 'variant-1');
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].variantId).toBe('variant-2');
      });
    });

    it('should handle removing non-existent item', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.removeItem('non-existent', 'variant-1');
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(mockCartItem);
      });

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(1);
      });

      act(() => {
        result.current.updateQuantity('product-1', 5, 'variant-1');
      });

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(5);
      });

      expect(result.current.totalItems).toBe(5);
    });

    it('should enforce minimum quantity of 1', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(mockCartItem);
      });

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(1);
      });

      act(() => {
        result.current.updateQuantity('product-1', 0, 'variant-1');
      });

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(1);
      });
    });

    it('should enforce maxQuantity limit', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem({ ...mockCartItem, maxQuantity: 5 });
      });

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(1);
      });

      act(() => {
        result.current.updateQuantity('product-1', 10, 'variant-1');
      });

      await waitFor(() => {
        expect(result.current.items[0].quantity).toBe(5);
      });
    });

    it('should handle updating non-existent item', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.updateQuantity('non-existent', 5, 'variant-1');
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(mockCartItem);
        result.current.addItem({ ...mockCartItem, productId: 'product-2' });
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      act(() => {
        result.current.clearCart();
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(0);
      });

      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPrice).toBe(0);
    });

    it('should update localStorage after clearing', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(mockCartItem);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      act(() => {
        result.current.clearCart();
      });

      await waitFor(() => {
        const saved = localStorageMock.getItem('stormcom-cart');
        const parsed = JSON.parse(saved!);
        expect(parsed).toEqual([]);
      });
    });
  });

  describe('getItem', () => {
    it('should return item if exists', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(mockCartItem);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      const item = result.current.getItem('product-1', 'variant-1');
      expect(item).toBeDefined();
      expect(item?.productName).toBe('Test Product');
    });

    it('should return undefined if item not found', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      const item = result.current.getItem('non-existent', 'variant-1');
      expect(item).toBeUndefined();
    });
  });

  describe('isInCart', () => {
    it('should return true if item exists', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(mockCartItem);
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      expect(result.current.isInCart('product-1', 'variant-1')).toBe(true);
    });

    it('should return false if item not found', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      expect(result.current.isInCart('non-existent', 'variant-1')).toBe(false);
    });
  });

  describe('Total Calculations', () => {
    it('should calculate totalItems correctly', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem({ ...mockCartItem, quantity: 3 });
        result.current.addItem({ ...mockCartItem, productId: 'product-2', quantity: 2 });
      });

      await waitFor(() => {
        expect(result.current.totalItems).toBe(5);
      });
    });

    it('should calculate totalPrice correctly', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem({ ...mockCartItem, price: 29.99, quantity: 2 });
      });

      await waitFor(() => {
        expect(result.current.totalPrice).toBe(59.98);
      });
    });

    it('should round totalPrice to 2 decimal places', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem({ ...mockCartItem, price: 0.1, quantity: 3 });
      });

      await waitFor(() => {
        // Without rounding: 0.1 * 3 = 0.30000000000000004
        // With rounding: 0.30
        expect(result.current.totalPrice).toBe(0.3);
      });
    });

    it('should handle multiple items with different prices', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem({ ...mockCartItem, price: 29.99, quantity: 2 });
        result.current.addItem({ ...mockCartItem, productId: 'product-2', price: 19.95, quantity: 1 });
        result.current.addItem({ ...mockCartItem, productId: 'product-3', price: 49.50, quantity: 3 });
      });

      await waitFor(() => {
        // (29.99 * 2) + (19.95 * 1) + (49.50 * 3) = 59.98 + 19.95 + 148.50 = 228.43
        expect(result.current.totalPrice).toBe(228.43);
        expect(result.current.totalItems).toBe(6);
      });
    });
  });

  describe('LocalStorage Persistence', () => {
    it('should persist cart state to localStorage', async () => {
      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem({ ...mockCartItem, quantity: 2 });
      });

      await waitFor(() => {
        const saved = localStorageMock.getItem('stormcom-cart');
        expect(saved).not.toBeNull();
        const parsed = JSON.parse(saved!);
        expect(parsed[0].quantity).toBe(2);
      });
    });

    it('should handle localStorage quota exceeded', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const setItemSpy = vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const { result } = renderHook(() => useCart());

      await waitFor(() => {
        expect(result.current.isLoaded).toBe(true);
      });

      act(() => {
        result.current.addItem(mockCartItem);
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to save cart to localStorage:',
          expect.any(Error)
        );
      });

      setItemSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
