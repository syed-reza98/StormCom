// src/emails/order-confirmation.tsx
// Order confirmation email template using React Email
// T175: Responsive design with store branding, order details, items list, totals

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
  Row,
  Column,
} from '@react-email/components';

export interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  storeName: string;
  storeEmail?: string;
  orderItems: Array<{
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  orderUrl: string;
}

export default function OrderConfirmationEmail({
  customerName = 'Valued Customer',
  orderNumber = '[Order #]',
  orderDate = new Date().toLocaleDateString(),
  storeName = 'Our Store',
  storeEmail: _storeEmail,
  orderItems = [],
  subtotal = 0,
  shipping = 0,
  tax = 0,
  total = 0,
  shippingAddress = {
    line1: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  },
  orderUrl = '#',
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerHeading}>Order Confirmed! ✓</Heading>
          </Section>

          <Section style={content}>
            <Text style={paragraph}>Hi {customerName},</Text>
            <Text style={paragraph}>
              Thank you for your order! We&apos;ve received your order and are
              processing it.
            </Text>

            <Section style={orderInfoBox}>
              <Text style={orderInfoText}>
                <strong>Order Number:</strong> {orderNumber}
              </Text>
              <Text style={orderInfoText}>
                <strong>Order Date:</strong> {orderDate}
              </Text>
              <Text style={orderInfoText}>
                <strong>Store:</strong> {storeName}
              </Text>
            </Section>

            <Heading as="h2" style={sectionHeading}>
              Order Items
            </Heading>

            <Section style={table}>
              <Row style={tableHeader}>
                <Column style={tableHeaderCell}>Product</Column>
                <Column style={{ ...tableHeaderCell, textAlign: 'center' }}>
                  Quantity
                </Column>
                <Column style={{ ...tableHeaderCell, textAlign: 'right' }}>
                  Total
                </Column>
              </Row>

              {orderItems.map((item, index) => (
                <Row key={index} style={tableRow}>
                  <Column style={tableCell}>{item.productName}</Column>
                  <Column style={{ ...tableCell, textAlign: 'center' }}>
                    {item.quantity}
                  </Column>
                  <Column style={{ ...tableCell, textAlign: 'right' }}>
                    ${item.total.toFixed(2)}
                  </Column>
                </Row>
              ))}
            </Section>

            <Hr style={divider} />

            <Section style={totalsSection}>
              <Row style={totalRow}>
                <Column>Subtotal:</Column>
                <Column style={{ textAlign: 'right' }}>
                  ${subtotal.toFixed(2)}
                </Column>
              </Row>
              <Row style={totalRow}>
                <Column>Shipping:</Column>
                <Column style={{ textAlign: 'right' }}>
                  ${shipping.toFixed(2)}
                </Column>
              </Row>
              <Row style={totalRow}>
                <Column>Tax:</Column>
                <Column style={{ textAlign: 'right' }}>${tax.toFixed(2)}</Column>
              </Row>
              <Hr style={divider} />
              <Row style={grandTotalRow}>
                <Column style={grandTotalLabel}>Total:</Column>
                <Column style={{ ...grandTotalAmount, textAlign: 'right' }}>
                  ${total.toFixed(2)}
                </Column>
              </Row>
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

            <Section style={buttonContainer}>
              <Button style={button} href={orderUrl}>
                View Order Details
              </Button>
            </Section>

            <Text style={secondaryText}>
              We&apos;ll send you another email when your order ships.
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
  backgroundColor: '#10b981',
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

const orderInfoBox = {
  backgroundColor: '#f3f4f6',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
};

const orderInfoText = {
  margin: '5px 0',
  fontSize: '14px',
  color: '#374151',
};

const sectionHeading = {
  fontSize: '18px',
  color: '#374151',
  marginTop: '30px',
  marginBottom: '15px',
  fontWeight: '600',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  marginTop: '10px',
};

const tableHeader = {
  backgroundColor: '#f9fafb',
};

const tableHeaderCell = {
  padding: '10px',
  borderBottom: '2px solid #e5e7eb',
  fontSize: '14px',
  fontWeight: '600',
  color: '#374151',
};

const tableRow = {
  borderBottom: '1px solid #e5e7eb',
};

const tableCell = {
  padding: '10px',
  fontSize: '14px',
  color: '#1f2937',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const totalsSection = {
  marginTop: '20px',
};

const totalRow = {
  fontSize: '14px',
  color: '#374151',
  margin: '5px 0',
};

const grandTotalRow = {
  fontSize: '18px',
  fontWeight: '700',
  marginTop: '15px',
  paddingTop: '10px',
};

const grandTotalLabel = {
  color: '#1f2937',
};

const grandTotalAmount = {
  color: '#10b981',
  fontWeight: '700',
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 30px',
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
