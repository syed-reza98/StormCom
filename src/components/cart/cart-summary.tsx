// src/components/cart/cart-summary.tsx
// Cart Summary Component - Display cart totals and checkout button
// Pattern: shadcn Card + Button

'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowRightIcon, TruckIcon } from 'lucide-react';
import Link from 'next/link';

interface CartSummaryProps {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
  onCheckout?: () => void;
  isLoading?: boolean;
}

export function CartSummary({
  subtotal,
  shipping,
  tax,
  discount,
  total,
  itemCount,
  onCheckout,
  isLoading = false,
}: CartSummaryProps) {
  const freeShippingThreshold = 50;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Free Shipping Progress */}
        {remainingForFreeShipping > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <TruckIcon className="h-4 w-4 text-blue-600" />
              <span className="text-blue-900">
                Add ${remainingForFreeShipping.toFixed(2)} more for free shipping
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Price Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium text-green-600">-${discount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium">
              {shipping === 0 ? (
                <Badge variant="outline" className="bg-green-50">Free</Badge>
              ) : (
                `$${shipping.toFixed(2)}`
              )}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods Icons */}
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">We accept</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">Visa</Badge>
            <Badge variant="outline" className="text-xs">Mastercard</Badge>
            <Badge variant="outline" className="text-xs">PayPal</Badge>
            <Badge variant="outline" className="text-xs">Apple Pay</Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {onCheckout ? (
          <Button 
            size="lg" 
            className="w-full" 
            onClick={onCheckout}
            disabled={isLoading || itemCount === 0}
          >
            {isLoading ? 'Processing...' : 'Proceed to Checkout'}
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Link href="/shop/checkout" className="w-full">
            <Button size="lg" className="w-full" disabled={itemCount === 0}>
              Proceed to Checkout
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
        
        <Link href="/shop/products" className="w-full">
          <Button variant="outline" size="lg" className="w-full">
            Continue Shopping
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
