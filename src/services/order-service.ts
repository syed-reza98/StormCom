/**
 * Order Service
 * 
 * Handles order management operations including:
 * - List orders with filtering, pagination, and search
 * - Get order details with full relations
 * - Update order status with state machine validation
 * - Generate invoice PDF
 * - Send tracking emails
 * 
 * @module services/order-service
 */

import { prisma } from '@/lib/db';
import { Prisma, OrderStatus, ShippingStatus } from '@prisma/client';

export type OrderListParams = {
  storeId?: string; // Optional for Super Admin (can query all stores)
  page?: number;
  perPage?: number;
  status?: OrderStatus;
  search?: string; // Search by order number or customer name
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'totalAmount' | 'orderNumber';
  sortOrder?: 'asc' | 'desc';
};

export type OrderUpdateStatusParams = {
  orderId: string;
  storeId?: string; // Optional for Super Admin
  newStatus: OrderStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  adminNote?: string;
};

/**
 * Validates if a status transition is allowed based on state machine rules
 */
function isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELED'],
    PAYMENT_FAILED: ['PAID', 'CANCELED'],
    PAID: ['PROCESSING', 'CANCELED', 'REFUNDED'],
    PROCESSING: ['SHIPPED', 'CANCELED', 'REFUNDED'],
    SHIPPED: ['DELIVERED', 'CANCELED'], // Can cancel if not delivered
    DELIVERED: ['REFUNDED'], // Can only refund after delivery
    CANCELED: [], // Terminal state
    REFUNDED: [], // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Lists orders with filtering, pagination, and search
 */
export async function listOrders(params: OrderListParams = {}) {
  const {
    storeId,
    page = 1,
    perPage = 10, // Default 10 items per page
    status,
    search,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;

  // Enforce per-page limits
  const limit = Math.min(Math.max(1, perPage), 100);
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.OrderWhereInput = {
    deletedAt: null,
  };

  // Only filter by storeId if provided (Super Admin can query all stores)
  if (storeId) {
    where.storeId = storeId;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search } },
      { customer: { firstName: { contains: search } } },
      { customer: { lastName: { contains: search } } },
      { customer: { email: { contains: search } } },
    ];
  }

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }

  // Execute query with total count
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page,
      perPage: limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Gets order details with full relations
 */
export async function getOrderById(orderId: string, storeId?: string) {
  const whereClause: Prisma.OrderWhereUniqueInput & { storeId?: string; deletedAt?: Date | null } = {
    id: orderId,
    deletedAt: null,
  };

  // Only filter by storeId if provided (Super Admin can query all stores)
  if (storeId) {
    whereClause.storeId = storeId;
  }

  const order = await prisma.order.findUnique({
    where: whereClause as any,
    include: {
      customer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variant: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
      },
      payments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      shippingAddress: true,
      billingAddress: true,
    },
  });

  return order;
}

/**
 * Updates order status with state machine validation
 */
export async function updateOrderStatus(params: OrderUpdateStatusParams) {
  const {
    orderId,
    storeId,
    newStatus,
    trackingNumber,
    trackingUrl,
    adminNote,
  } = params;

  // Get current order
  const whereClause: Prisma.OrderWhereUniqueInput & { storeId?: string; deletedAt?: Date | null } = {
    id: orderId,
    deletedAt: null,
  };

  // Only filter by storeId if provided (Super Admin can query all stores)
  if (storeId) {
    whereClause.storeId = storeId;
  }

  const order = await prisma.order.findUnique({
    where: whereClause as any,
  });

  if (!order) {
    return null;
  }

  // Validate status transition
  if (!isValidStatusTransition(order.status, newStatus)) {
    throw new Error(
      `Invalid status transition: Cannot change from ${order.status} to ${newStatus}`
    );
  }

  // Validate tracking number for SHIPPED status
  if (newStatus === OrderStatus.SHIPPED && !trackingNumber) {
    throw new Error('Tracking number is required when marking order as shipped');
  }

  // Update shipping status based on order status
  let shippingStatus = order.shippingStatus;
  if (newStatus === OrderStatus.SHIPPED) {
    shippingStatus = ShippingStatus.IN_TRANSIT;
  } else if (newStatus === OrderStatus.DELIVERED) {
    shippingStatus = ShippingStatus.DELIVERED;
  } else if (newStatus === OrderStatus.CANCELED) {
    shippingStatus = ShippingStatus.PENDING;
  }

  // Update order
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      shippingStatus,
      trackingNumber: trackingNumber || order.trackingNumber,
      trackingUrl: trackingUrl || order.trackingUrl,
      adminNote: adminNote ? `${order.adminNote || ''}\n${new Date().toISOString()}: ${adminNote}`.trim() : order.adminNote,
      fulfilledAt: newStatus === OrderStatus.DELIVERED ? new Date() : order.fulfilledAt,
      canceledAt: newStatus === OrderStatus.CANCELED ? new Date() : order.canceledAt,
    },
    include: {
      customer: true,
      user: true,
      items: true,
      payments: true,
    },
  });

  // TODO: Send notification email to customer (will be implemented in US9 Email Notifications)
  // await sendOrderStatusEmail(updatedOrder);

  return updatedOrder;
}

/**
 * Generates invoice data for an order
 * (PDF generation handled by API route using external library)
 */
export async function getInvoiceData(orderId: string, storeId?: string) {
  const whereClause: Prisma.OrderWhereUniqueInput & { storeId?: string; deletedAt?: Date | null } = {
    id: orderId,
    deletedAt: null,
  };

  // Only filter by storeId if provided (Super Admin can query all stores)
  if (storeId) {
    whereClause.storeId = storeId;
  }

  const order = await prisma.order.findUnique({
    where: whereClause as any,
    include: {
      store: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          logo: true,
        },
      },
      customer: true,
      user: true,
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      payments: true,
      shippingAddress: true,
      billingAddress: true,
    },
  });

  if (!order) {
    return null;
  }

  // Format invoice data
  return {
    // Invoice metadata
    orderNumber: order.orderNumber,
    invoiceNumber: order.orderNumber,
    invoiceDate: order.createdAt,
    dueDate: order.createdAt, // Immediate payment expected
    status: order.paymentStatus,

    // Store (seller) info
    store: {
      name: order.store.name,
      email: order.store.email,
      phone: order.store.phone,
      address: order.store.address || '',
      city: order.store.city || '',
      state: order.store.state || '',
      postalCode: order.store.postalCode || '',
      country: order.store.country,
      logo: order.store.logo,
    },
    seller: {
      name: order.store.name,
      email: order.store.email,
      phone: order.store.phone,
      address: {
        street: order.store.address || '',
        city: order.store.city || '',
        state: order.store.state || '',
        postalCode: order.store.postalCode || '',
        country: order.store.country,
      },
      logo: order.store.logo,
    },

    // Customer (buyer) info
    customer: {
      name: order.customer
        ? `${order.customer.firstName} ${order.customer.lastName}`
        : order.user?.name || 'Guest Customer',
      email: order.customer?.email || order.user?.email || '',
      phone: order.customer?.phone || order.user?.phone || '',
    },
    buyer: {
      name: order.customer
        ? `${order.customer.firstName} ${order.customer.lastName}`
        : order.user?.name || 'Guest Customer',
      email: order.customer?.email || order.user?.email || '',
      phone: order.customer?.phone || order.user?.phone || '',
      address: order.billingAddress
        ? {
            street: `${order.billingAddress.address1}${order.billingAddress.address2 ? ' ' + order.billingAddress.address2 : ''}`,
            city: order.billingAddress.city,
            state: order.billingAddress.state,
            postalCode: order.billingAddress.postalCode,
            country: order.billingAddress.country,
          }
        : null,
    },

    // Line items
    items: order.items.map((item) => ({
      description: `${item.productName}${item.variantName ? ` - ${item.variantName}` : ''}`,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.price,
      subtotal: item.subtotal,
      tax: item.taxAmount,
      discount: item.discountAmount,
      total: item.totalAmount,
    })),

    // Totals
    subtotal: order.subtotal,
    taxAmount: order.taxAmount,
    shippingAmount: order.shippingAmount,
    discountAmount: order.discountAmount,
    totalAmount: order.totalAmount,

    // Payment info
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentGateway: order.paymentGateway,

    // Shipping info
    shippingAddress: order.shippingAddress
      ? {
          name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
          street: `${order.shippingAddress.address1}${order.shippingAddress.address2 ? ' ' + order.shippingAddress.address2 : ''}`,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country,
          phone: order.shippingAddress.phone,
        }
      : null,
    shippingMethod: order.shippingMethod,
    trackingNumber: order.trackingNumber,

    // Notes
    customerNote: order.customerNote,
    adminNote: order.adminNote,
  };
}

/**
 * Exports orders to CSV format
 */
export async function exportOrdersToCSV(params: Omit<OrderListParams, 'page' | 'perPage'> = {}) {
  const { orders } = await listOrders({ ...params, page: 1, perPage: 10000 });

  const csvRows = [
    // Header row
    [
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Status',
      'Payment Status',
      'Payment Method',
      'Subtotal',
      'Tax',
      'Shipping',
      'Discount',
      'Total',
      'Items Count',
      'Created At',
    ].join(','),
  ];

  // Data rows
  for (const order of orders) {
    const customerName = order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : order.user?.name || 'Guest';
    const customerEmail = order.customer?.email || order.user?.email || '';
    
    // Handle _count which may be undefined in tests
    const itemsCount = order._count?.items ?? (order as any).items?.length ?? 0;

    csvRows.push(
      [
        order.orderNumber,
        `"${customerName}"`, // Quoted for CSV
        customerEmail,
        order.status,
        order.paymentStatus,
        order.paymentMethod || 'N/A',
        order.subtotal.toString(),
        order.taxAmount.toString(),
        order.shippingAmount.toString(),
        order.discountAmount.toString(),
        order.totalAmount.toString(),
        itemsCount.toString(),
        order.createdAt.toISOString(),
      ].join(',')
    );
  }

  return csvRows.join('\n');
}
