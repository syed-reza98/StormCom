/**
 * Checkout Page: Multi-step checkout flow
 * 
 * Steps:
 * 1. Shipping address
 * 2. Payment method
 * 3. Order review
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShippingAddressForm } from '@/components/checkout/shipping-address-form';
import { PaymentMethodSelector } from '@/components/checkout/payment-method-selector';
import { OrderReview } from '@/components/checkout/order-review';
import type { ShippingAddress } from '@/services/checkout-service';

export interface CheckoutStep {
  id: string;
  title: string;
  completed: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);

  const steps: CheckoutStep[] = [
    { id: 'shipping', title: 'Shipping Address', completed: !!shippingAddress },
    { id: 'payment', title: 'Payment Method', completed: !!paymentMethodId },
    { id: 'review', title: 'Review Order', completed: false },
  ];

  const handleShippingComplete = (address: ShippingAddress) => {
    setShippingAddress(address);
    setCurrentStep(1);
  };

  const handlePaymentComplete = (paymentId: string) => {
    setPaymentMethodId(paymentId);
    setCurrentStep(2);
  };

  const handleOrderComplete = (orderId: string) => {
    router.push(`/orders/${orderId}/confirmation`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Checkout Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${
                      currentStep === index
                        ? 'bg-blue-600 text-white'
                        : step.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {step.completed ? '✓' : index + 1}
                </div>
                <span
                  className={`
                    mt-2 text-sm font-medium
                    ${
                      currentStep === index
                        ? 'text-blue-600'
                        : step.completed
                        ? 'text-green-500'
                        : 'text-gray-500'
                    }
                  `}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                    h-1 flex-1 mx-4
                    ${step.completed ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {currentStep === 0 && (
          <ShippingAddressForm onComplete={handleShippingComplete} />
        )}
        {currentStep === 1 && shippingAddress && (
          <PaymentMethodSelector
            onComplete={handlePaymentComplete}
            onBack={() => setCurrentStep(0)}
          />
        )}
        {currentStep === 2 && shippingAddress && paymentMethodId && (
          <OrderReview
            shippingAddress={shippingAddress}
            paymentMethodId={paymentMethodId}
            onComplete={handleOrderComplete}
            onBack={() => setCurrentStep(1)}
          />
        )}
      </div>
    </div>
  );
}
