// src/app/(dashboard)/orders/[id]/page.tsx
// Order Details Dashboard Page - Comprehensive order view with all related information

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Section, Container, Flex, Heading, Text, Card, Badge, Button } from '@radix-ui/themes';
import { 
  ArrowLeftIcon, 
  FileTextIcon, 
  CalendarIcon, 
  PersonIcon,
  EnvelopeClosedIcon,
  HomeIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  ClockIcon
} from '@radix-ui/react-icons';
import { UpdateOrderStatusForm } from '@/components/orders/update-status-form';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type OrderStatus = 
  | 'PENDING' 
  | 'PAID' 
  | 'PROCESSING' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELED' 
  | 'REFUNDED' 
  | 'PAYMENT_FAILED';

type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

interface OrderDetailsPageProps {
  params: { id: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    product: {
      id: string;
      name: string;
      sku: string | null;
    };
    variant: {
      id: string;
      name: string;
      sku: string | null;
    } | null;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: PaymentStatus;
    method: string | null;
    transactionId: string | null;
    gateway: string | null;
    createdAt: string;
  }>;
  shippingAddress: {
    id: string;
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string | null;
  } | null;
  billingAddress: {
    id: string;
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string | null;
  } | null;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  shippingMethod: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<OrderDetailsPageProps['params']> 
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order ${id} | Dashboard`,
    description: 'View and manage order details',
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

async function getOrder(orderId: string): Promise<Order | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/orders/${orderId}`, {
      headers: {
        Cookie: `next-auth.session-token=${session.user.id}`, // TODO: Use proper session token
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function getOrderStatusBadge(status: OrderStatus) {
  const badges: Record<OrderStatus, { label: string; color: 'gray' | 'blue' | 'green' | 'red' | 'amber' }> = {
    PENDING: { label: 'Pending', color: 'gray' },
    PAID: { label: 'Paid', color: 'green' },
    PROCESSING: { label: 'Processing', color: 'blue' },
    SHIPPED: { label: 'Shipped', color: 'blue' },
    DELIVERED: { label: 'Delivered', color: 'green' },
    CANCELED: { label: 'Canceled', color: 'red' },
    REFUNDED: { label: 'Refunded', color: 'amber' },
    PAYMENT_FAILED: { label: 'Payment Failed', color: 'red' },
  };

  const { label, color } = badges[status];
  return <Badge color={color} size="2">{label}</Badge>;
}

function getPaymentStatusBadge(status: PaymentStatus) {
  const badges: Record<PaymentStatus, { label: string; color: 'gray' | 'green' | 'red' | 'amber' }> = {
    PENDING: { label: 'Pending', color: 'gray' },
    PAID: { label: 'Paid', color: 'green' },
    FAILED: { label: 'Failed', color: 'red' },
    REFUNDED: { label: 'Refunded', color: 'amber' },
  };

  const { label, color } = badges[status];
  return <Badge color={color} size="2">{label}</Badge>;
}

function formatAddress(address: Order['shippingAddress']) {
  if (!address) return <Text size="2" color="gray">N/A</Text>;
  
  return (
    <Flex direction="column" gap="1">
      <Text size="2" weight="medium">{address.fullName}</Text>
      <Text size="2" color="gray">{address.line1}</Text>
      {address.line2 && <Text size="2" color="gray">{address.line2}</Text>}
      <Text size="2" color="gray">
        {address.city}, {address.state} {address.postalCode}
      </Text>
      <Text size="2" color="gray">{address.country}</Text>
      {address.phone && <Text size="2" color="gray">Phone: {address.phone}</Text>}
    </Flex>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default async function OrderDetailsPage({ 
  params 
}: { 
  params: Promise<OrderDetailsPageProps['params']> 
}) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/orders" className="text-muted-foreground hover:text-foreground">
              ← Back to Orders
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              Order {order.orderNumber}
            </h1>
            {getOrderStatusBadge(order.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Generate Invoice Button */}
          <a 
            href={`/api/orders/${order.id}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            📄 Generate Invoice
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium text-center">Quantity</th>
                    <th className="pb-3 font-medium text-right">Unit Price</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4">
                        <div className="space-y-1">
                          <p className="font-medium">{item.product.name}</p>
                          {item.variant && (
                            <p className="text-sm text-muted-foreground">
                              Variant: {item.variant.name}
                            </p>
                          )}
                          {(item.product.sku || item.variant?.sku) && (
                            <p className="text-xs text-muted-foreground font-mono">
                              SKU: {item.variant?.sku || item.product.sku}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-center">{item.quantity}</td>
                      <td className="py-4 text-right">{formatPrice(item.unitPrice)}</td>
                      <td className="py-4 text-right font-medium">
                        {formatPrice(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t">
                  <tr>
                    <td colSpan={3} className="pt-4 text-right">Subtotal:</td>
                    <td className="pt-4 text-right">{formatPrice(order.subtotal)}</td>
                  </tr>
                  {order.discountAmount > 0 && (
                    <tr>
                      <td colSpan={3} className="pt-2 text-right text-success">Discount:</td>
                      <td className="pt-2 text-right text-success">
                        -{formatPrice(order.discountAmount)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="pt-2 text-right">Tax:</td>
                    <td className="pt-2 text-right">{formatPrice(order.taxAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="pt-2 text-right">Shipping:</td>
                    <td className="pt-2 text-right">{formatPrice(order.shippingAmount)}</td>
                  </tr>
                  <tr className="text-lg font-bold">
                    <td colSpan={3} className="pt-4 text-right">Total:</td>
                    <td className="pt-4 text-right">{formatPrice(order.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Payment Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
            {order.payments.length > 0 ? (
              <div className="space-y-4">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {formatPrice(payment.amount)}
                      </span>
                      {getPaymentStatusBadge(payment.status)}
                    </div>
                    {payment.method && (
                      <p className="text-sm">Method: {payment.method}</p>
                    )}
                    {payment.gateway && (
                      <p className="text-sm">Gateway: {payment.gateway}</p>
                    )}
                    {payment.transactionId && (
                      <p className="text-sm font-mono text-muted-foreground">
                        Transaction ID: {payment.transactionId}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(payment.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No payment information available</p>
            )}
          </Card>

          {/* Shipping Information */}
          {order.shippingMethod || order.trackingNumber && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
              <div className="space-y-3">
                {order.shippingMethod && (
                  <div>
                    <p className="text-sm text-muted-foreground">Shipping Method</p>
                    <p className="font-medium">{order.shippingMethod}</p>
                  </div>
                )}
                {order.trackingNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tracking Number</p>
                    {order.trackingUrl ? (
                      <a 
                        href={order.trackingUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-mono text-primary hover:underline"
                      >
                        {order.trackingNumber}
                      </a>
                    ) : (
                      <p className="font-mono">{order.trackingNumber}</p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Admin Notes */}
          {order.adminNote && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Admin Notes</h2>
              <p className="text-sm whitespace-pre-wrap">{order.adminNote}</p>
            </Card>
          )}
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Update Order Status */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Update Status</h2>
            <UpdateOrderStatusForm orderId={order.id} currentStatus={order.status} />
          </Card>

          {/* Customer Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Customer</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{order.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{order.customer.email}</p>
              </div>
              {order.customer.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.customer.phone}</p>
                </div>
              )}
              <Link 
                href={`/customers/${order.customer.id}`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}
              >
                View Customer Details
              </Link>
            </div>
          </Card>

          {/* Shipping Address */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            {formatAddress(order.shippingAddress)}
          </Card>

          {/* Billing Address */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Billing Address</h2>
            {formatAddress(order.billingAddress)}
          </Card>
        </div>
      </div>
    </div>
  );
}
