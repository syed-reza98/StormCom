/**
 * OrderReview: Review order before completing checkout
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { ShippingAddress } from '@/services/checkout-service';

interface OrderReviewProps {
  shippingAddress: ShippingAddress;
  paymentMethodId: string;
  onComplete: (orderId: string) => void;
  onBack: () => void;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export function OrderReview({ shippingAddress, onComplete, onBack }: OrderReviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);

  // Load cart items and calculate totals
  useEffect(() => {
    // In production, fetch from cart API
    // Mock data for now
    const mockItems: CartItem[] = [
      { id: '1', name: 'Product 1', price: 29.99, quantity: 2, image: '/placeholder.jpg' },
      { id: '2', name: 'Product 2', price: 49.99, quantity: 1, image: '/placeholder.jpg' },
    ];

    const mockSubtotal = mockItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const mockShipping = 5.99;
    const mockTax = mockSubtotal * 0.08; // 8% tax

    setCartItems(mockItems);
    setSubtotal(mockSubtotal);
    setShippingCost(mockShipping);
    setTaxAmount(mockTax);
  }, []);

  const total = subtotal + shippingCost + taxAmount;

  const handlePlaceOrder = async () => {
    setIsSubmitting(true);

    try {
      // Call checkout complete API
      const response = await fetch('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: 'mock-store-id', // Get from context
          customerId: 'mock-customer-id', // Get from session
          items: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          shippingAddress,
          subtotal,
          taxAmount,
          shippingCost,
          discountAmount: 0,
          shippingMethod: 'standard',
          paymentMethod: 'CREDIT_CARD',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message ?? 'Failed to place order');
      }

      onComplete(data.data.id);
    } catch (error) {
      console.error('Order placement failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to place order');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>

      {/* Order Items */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Order Items</h3>
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-4 border-b">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center relative">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover rounded-md" />
                ) : (
                  <span className="text-gray-400 text-xs">No image</span>
                )}
              </div>
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
              </div>
            </div>
            <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Shipping Address */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Shipping Address</h3>
        <div className="p-4 bg-gray-50 rounded-md">
          <p>{shippingAddress.fullName}</p>
          <p>{shippingAddress.address1}</p>
          {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
          <p>
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
          </p>
          <p>{shippingAddress.country}</p>
          {shippingAddress.phone && <p>Phone: {shippingAddress.phone}</p>}
        </div>
      </div>

      {/* Order Summary */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
        <div className="space-y-2 p-4 bg-gray-50 rounded-md">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>${shippingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}
