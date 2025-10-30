/**
 * PaymentMethodSelector: Stripe Elements payment form
 */

'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentMethodSelectorProps {
  onComplete: (paymentMethodId: string) => void;
  onBack: () => void;
}

function PaymentForm({ onComplete, onBack }: PaymentMethodSelectorProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Submit payment element
      const { error } = await elements.submit();
      if (error) {
        setErrorMessage(error.message ?? 'Payment failed');
        setIsProcessing(false);
        return;
      }

      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        elements,
      });

      if (paymentMethodError) {
        setErrorMessage(paymentMethodError.message ?? 'Payment failed');
        setIsProcessing(false);
        return;
      }

      onComplete(paymentMethod!.id);
    } catch (error) {
      setErrorMessage('An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Payment Method</h2>

      {/* Stripe Payment Element */}
      <div className="p-4 border border-gray-300 rounded-md">
        <PaymentElement />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Continue to Review'}
        </button>
      </div>
    </form>
  );
}

export function PaymentMethodSelector(props: PaymentMethodSelectorProps) {
  // In production, fetch client secret from API
  // For now, we'll pass a mock client secret
  const clientSecret = 'pi_mock_secret_123';

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm {...props} />
    </Elements>
  );
}
