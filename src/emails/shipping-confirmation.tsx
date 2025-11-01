// src/emails/shipping-confirmation.tsx
// Shipping confirmation email template using React Email
// T176: Tracking number, carrier, estimated delivery, order details

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
} from '@react-email/components';
import * as React from 'react';

export interface ShippingConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery?: string;
  storeName: string;
  storeEmail?: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  trackingUrl: string;
}

export default function ShippingConfirmationEmail({
  customerName = 'Valued Customer',
  orderNumber = '[Order #]',
  trackingNumber = '[Tracking #]',
  carrier = 'Carrier',
  estimatedDelivery,
  storeName = 'Our Store',
  storeEmail,
  shippingAddress = {
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  },
  trackingUrl = '#',
}: ShippingConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerHeading}>📦 Your Order Has Shipped!</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {customerName},</Text>
            <Text style={paragraph}>
              Great news! Your order has been shipped and is on its way to you.
            </Text>

            <Section style={trackingBox}>
              <Text style={trackingInfoText}>
                <strong>Order Number:</strong> {orderNumber}
              </Text>
              <Text style={trackingInfoText}>
                <strong>Tracking Number:</strong> {trackingNumber}
              </Text>
              <Text style={trackingInfoText}>
                <strong>Carrier:</strong> {carrier}
              </Text>
              {estimatedDelivery && (
                <Text style={trackingInfoText}>
                  <strong>Estimated Delivery:</strong> {estimatedDelivery}
                </Text>
              )}
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={trackingUrl}>
                Track Your Shipment
              </Button>
            </Section>

            <Section style={shippingBox}>
              <Heading as="h3" style={boxHeading}>
                Shipping Address
              </Heading>
              <Text style={addressText}>{shippingAddress.line1}</Text>
              {shippingAddress.line2 && (
                <Text style={addressText}>{shippingAddress.line2}</Text>
              )}
              <Text style={addressText}>
                {shippingAddress.city}, {shippingAddress.state}{' '}
                {shippingAddress.postalCode}
              </Text>
              <Text style={addressText}>{shippingAddress.country}</Text>
            </Section>

            <Text style={secondaryText}>
              If you have any questions about your shipment, please contact our
              support team.
            </Text>
            <Text style={paragraph}>
              Best regards,
              <br />
              <strong>{storeName}</strong>
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              {storeName} | Powered by StormCom
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f9fafb',
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#3b82f6',
  padding: '30px',
  textAlign: 'center' as const,
  borderRadius: '10px 10px 0 0',
};

const headerHeading = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '600',
  margin: '0',
};

const content = {
  backgroundColor: '#ffffff',
  padding: '30px',
  borderRadius: '0 0 10px 10px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#1f2937',
  margin: '16px 0',
};

const trackingBox = {
  backgroundColor: '#eff6ff',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
  borderLeft: '4px solid #3b82f6',
};

const trackingInfoText = {
  margin: '5px 0',
  fontSize: '14px',
  color: '#374151',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 30px',
};

const shippingBox = {
  backgroundColor: '#f3f4f6',
  padding: '20px',
  borderRadius: '8px',
  margin: '30px 0',
};

const boxHeading = {
  fontSize: '16px',
  fontWeight: '600',
  marginTop: '0',
  marginBottom: '10px',
  color: '#374151',
};

const addressText = {
  margin: '5px 0',
  fontSize: '14px',
  color: '#1f2937',
};

const secondaryText = {
  fontSize: '14px',
  color: '#6b7280',
  marginTop: '20px',
};

const footer = {
  textAlign: 'center' as const,
  marginTop: '20px',
};

const footerText = {
  color: '#9ca3af',
  fontSize: '12px',
};
