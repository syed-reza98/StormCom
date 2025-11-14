/**
 * Order Confirmation Page: Shows order details after successful checkout
 */

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Section, Container, Flex, Heading, Text, Card, Button, Badge } from '@radix-ui/themes';
import { CheckCircledIcon, EnvelopeClosedIcon, CalendarIcon, HomeIcon, FileTextIcon } from '@radix-ui/react-icons';
import { db } from '@/lib/db';

interface OrderConfirmationPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationPageProps) {
  const { id } = await params;

  // Fetch order details
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              images: true,
            },
          },
          variant: {
            select: {
              name: true,
            },
          },
        },
      },
      shippingAddress: true,
      customer: {
        select: { email: true },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <Section size="2">
      <Container size="3">
        <Flex direction="column" gap="6">
          {/* Success Message */}
          <Card style={{ backgroundColor: 'var(--green-3)', borderColor: 'var(--green-7)' }}>
            <Flex align="center" gap="4">
              <Flex
                align="center"
                justify="center"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--green-9)',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                <CheckCircledIcon width="32" height="32" />
              </Flex>
              <Flex direction="column" gap="1">
                <Heading size="7" style={{ color: 'var(--green-11)' }}>
                  Order Confirmed!
                </Heading>
                <Flex align="center" gap="2">
                  <EnvelopeClosedIcon width="16" height="16" style={{ color: 'var(--green-11)' }} />
                  <Text size="3" style={{ color: 'var(--green-11)' }}>
                    Confirmation sent to {order.customer?.email ?? 'your email'}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Card>

          {/* Order Details */}
          <Card size="3">
            <Flex direction="column" gap="4">
              <Heading size="5">Order Details</Heading>
              
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Text size="2" color="gray">Order Number:</Text>
                  <Text size="3" weight="medium">{order.orderNumber}</Text>
                </Flex>
                <Flex justify="between" align="center">
                  <Flex align="center" gap="2">
                    <CalendarIcon width="16" height="16" style={{ color: 'var(--gray-11)' }} />
                    <Text size="2" color="gray">Order Date:</Text>
                  </Flex>
                  <Text size="3" weight="medium">{order.createdAt.toLocaleDateString()}</Text>
                </Flex>
                <Flex justify="between" align="center">
                  <Text size="2" color="gray">Payment Status:</Text>
                  <Badge
                    color={order.paymentStatus === 'PAID' ? 'green' : 'amber'}
                    size="2"
                  >
                    {order.paymentStatus}
                  </Badge>
                </Flex>
              </Flex>
            </Flex>
          </Card>

          {/* Order Items */}
          <Card size="3">
            <Flex direction="column" gap="4">
              <Heading size="5">Order Items</Heading>
              
              <Flex direction="column" gap="4">
                {order.items.map((item) => (
                  <Flex key={item.id} align="center" gap="4" style={{ paddingBottom: '16px', borderBottom: '1px solid var(--gray-6)' }}>
                    <div className="w-16 h-16 bg-gray-200 rounded-md shrink-0 relative">
                      {(item.product?.images as string[] | null)?.[0] ? (
                        <Image
                          src={(item.product!.images as string[])[0]}
                          alt={item.productName}
                          fill
                          className="object-cover rounded-md"
                        />
                      ) : (
                        <Flex align="center" justify="center" className="w-full h-full">
                          <Text size="1" color="gray">No image</Text>
                        </Flex>
                      )}
                    </div>
                    <Flex direction="column" gap="1" style={{ flex: 1 }}>
                      <Text size="3" weight="medium">{item.productName}</Text>
                      {item.variantName && (
                        <Text size="2" color="gray">{item.variantName}</Text>
                      )}
                      <Text size="2" color="gray">Qty: {item.quantity}</Text>
                    </Flex>
                    <Flex direction="column" gap="1" align="end">
                      <Text size="3" weight="medium">${Number((item as any).totalAmount ?? item.subtotal).toFixed(2)}</Text>
                      <Text size="2" color="gray">${Number((item as any).price).toFixed(2)} each</Text>
                    </Flex>
                  </Flex>
                ))}
              </Flex>
            </Flex>
          </Card>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <Card size="3">
              <Flex direction="column" gap="4">
                <Flex align="center" gap="2">
                  <HomeIcon width="20" height="20" style={{ color: 'var(--teal-11)' }} />
                  <Heading size="5">Shipping Address</Heading>
                </Flex>
                <Flex direction="column" gap="1">
                  <Text size="3">{`${order.shippingAddress.firstName ?? ''} ${order.shippingAddress.lastName ?? ''}`.trim()}</Text>
                  <Text size="2" color="gray">{order.shippingAddress.address1}</Text>
                  {order.shippingAddress.address2 && <Text size="2" color="gray">{order.shippingAddress.address2}</Text>}
                  <Text size="2" color="gray">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                  </Text>
                  <Text size="2" color="gray">{order.shippingAddress.country}</Text>
                  {order.shippingAddress.phone && <Text size="2" color="gray">Phone: {order.shippingAddress.phone}</Text>}
                </Flex>
              </Flex>
            </Card>
          )}

          {/* Order Summary */}
          <Card size="3">
            <Flex direction="column" gap="4">
              <Heading size="5">Order Summary</Heading>
              
              <Flex direction="column" gap="2">
                <Flex justify="between">
                  <Text size="2" color="gray">Subtotal</Text>
                  <Text size="3">${Number(order.subtotal).toFixed(2)}</Text>
                </Flex>
                <Flex justify="between">
                  <Text size="2" color="gray">Shipping</Text>
                  <Text size="3">${Number(order.shippingAmount).toFixed(2)}</Text>
                </Flex>
                <Flex justify="between">
                  <Text size="2" color="gray">Tax</Text>
                  <Text size="3">${Number(order.taxAmount).toFixed(2)}</Text>
                </Flex>
                {order.discountAmount > 0 && (
                  <Flex justify="between" style={{ color: 'var(--green-11)' }}>
                    <Text size="2">Discount</Text>
                    <Text size="3">-${Number(order.discountAmount).toFixed(2)}</Text>
                  </Flex>
                )}
                <div style={{ borderTop: '1px solid var(--gray-6)', paddingTop: '8px', marginTop: '8px' }}>
                  <Flex justify="between">
                    <Text size="4" weight="bold">Total</Text>
                    <Text size="4" weight="bold">${Number(order.totalAmount).toFixed(2)}</Text>
                  </Flex>
                </div>
              </Flex>
            </Flex>
          </Card>

          {/* Actions */}
          <Flex justify="center" gap="4" style={{ marginTop: '32px' }}>
            <Link href="/">
              <Button variant="outline" size="3">
                <HomeIcon width="16" height="16" />
                Continue Shopping
              </Button>
            </Link>
            <Link href={`/orders/${order.id}`}>
              <Button variant="solid" size="3">
                <FileTextIcon width="16" height="16" />
                View Order Details
              </Button>
            </Link>
          </Flex>
        </Flex>
      </Container>
    </Section>
  );
}
