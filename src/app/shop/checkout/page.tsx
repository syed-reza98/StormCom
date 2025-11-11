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
import { Section, Container, Flex, Heading, Text, Card } from '@radix-ui/themes';
import { CheckCircledIcon, RocketIcon, LockClosedIcon, FileTextIcon } from '@radix-ui/react-icons';
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

  const stepIcons = [RocketIcon, LockClosedIcon, FileTextIcon];

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
    <Section size="2">
      <Container size="3">
        <Flex direction="column" gap="6">
          {/* Page Header */}
          <Flex direction="column" gap="2">
            <Heading size="8">Secure Checkout</Heading>
            <Text size="3" color="gray">
              Complete your order in 3 simple steps
            </Text>
          </Flex>

          {/* Checkout Steps */}
          <Card>
            <Flex align="center" justify="between" gap="4">
              {steps.map((step, index) => {
                const StepIcon = stepIcons[index];
                return (
                  <Flex key={step.id} align="center" style={{ flex: 1 }}>
                    <Flex direction="column" align="center" gap="2" style={{ flex: 1 }}>
                      <Flex
                        align="center"
                        justify="center"
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor:
                            currentStep === index
                              ? 'var(--teal-9)'
                              : step.completed
                              ? 'var(--green-9)'
                              : 'var(--gray-4)',
                          color: currentStep === index || step.completed ? 'white' : 'var(--gray-11)',
                        }}
                      >
                        {step.completed ? (
                          <CheckCircledIcon width="20" height="20" />
                        ) : (
                          <StepIcon width="20" height="20" />
                        )}
                      </Flex>
                      <Text
                        size="2"
                        weight="medium"
                        style={{
                          color:
                            currentStep === index
                              ? 'var(--teal-11)'
                              : step.completed
                              ? 'var(--green-11)'
                              : 'var(--gray-11)',
                        }}
                      >
                        {step.title}
                      </Text>
                    </Flex>
                    {index < steps.length - 1 && (
                      <div
                        style={{
                          height: '2px',
                          flex: 1,
                          margin: '0 16px',
                          backgroundColor: step.completed ? 'var(--green-9)' : 'var(--gray-6)',
                        }}
                      />
                    )}
                  </Flex>
                );
              })}
            </Flex>
          </Card>

          {/* Step Content */}
          <Card size="3">
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
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}
