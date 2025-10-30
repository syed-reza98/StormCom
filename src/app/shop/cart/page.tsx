/**
 * Cart Page
 * 
 * Client Component displaying shopping cart items with quantity controls
 * and checkout button.
 */

'use client';

import { useCart } from '@/hooks/use-cart';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CartPage() {
  const {
    items,
    totalItems,
    totalPrice,
    isLoaded,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  // Loading state
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Skeleton className="h-48 mb-4" />
            <Skeleton className="h-48 mb-4" />
          </div>
          <div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        <Card className="p-12 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some products to get started
          </p>
          <Link href="/shop/products">
            <Button size="lg">
              Browse Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
        </h1>
        <Button variant="outline" onClick={clearCart}>
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={`${item.productId}-${item.variantId || 'default'}`} className="p-4">
              <div className="flex gap-4">
                {/* Product Image */}
                <Link
                  href={`/shop/products/${item.productSlug}`}
                  className="flex-shrink-0"
                >
                  <div className="relative w-24 h-24 rounded overflow-hidden bg-muted">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/shop/products/${item.productSlug}`}
                    className="font-semibold hover:text-primary transition-colors"
                  >
                    {item.productName}
                  </Link>
                  {item.variantName && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Variant: {item.variantName}
                    </p>
                  )}
                  <p className="text-lg font-bold mt-2">
                    ${item.price.toFixed(2)}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.quantity - 1,
                          item.variantId
                        )
                      }
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      -
                    </Button>
                    <span className="w-12 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.quantity + 1,
                          item.variantId
                        )
                      }
                      disabled={item.quantity >= item.maxQuantity}
                      aria-label="Increase quantity"
                    >
                      +
                    </Button>
                    <span className="text-xs text-muted-foreground ml-2">
                      Max: {item.maxQuantity}
                    </span>
                  </div>
                </div>

                {/* Item Total & Remove */}
                <div className="flex flex-col items-end justify-between">
                  <p className="text-lg font-bold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <Button size="lg" className="w-full mb-3">
              Proceed to Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Link href="/shop/products">
              <Button variant="outline" size="lg" className="w-full">
                Continue Shopping
              </Button>
            </Link>

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Secure checkout
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Free shipping on orders over $50
              </p>
              <p className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                30-day return policy
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
