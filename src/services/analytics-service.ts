import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db';

export interface SalesMetrics {
  totalSales: number;
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface TopProduct {
  id: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export class AnalyticsService {
  constructor(private db: PrismaClient = prisma) {}

  /**
   * Get sales metrics for a date range
   */
  async getSalesMetrics(storeId: string, dateRange: DateRange): Promise<SalesMetrics> {
    const { startDate, endDate } = dateRange;

    const orders = await this.db.order.findMany({
      where: {
        storeId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
        deletedAt: null,
      },
      select: {
        totalAmount: true,
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const orderCount = orders.length;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    return {
      totalSales: totalRevenue,
      totalRevenue,
      orderCount,
      averageOrderValue,
    };
  }

  /**
   * Get revenue data grouped by date (daily, weekly, monthly)
   */
  async getRevenueByPeriod(
    storeId: string,
    dateRange: DateRange,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<RevenueData[]> {
    const { startDate, endDate } = dateRange;

    // Get orders within date range
    const orders = await this.db.order.findMany({
      where: {
        storeId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
        deletedAt: null,
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group orders by date period
    const groupedData = new Map<string, { revenue: number; orderCount: number }>();

    orders.forEach((order) => {
      let dateKey: string;

      switch (groupBy) {
        case 'week':
          // Get start of week (Monday)
          const weekStart = new Date(order.createdAt);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
          dateKey = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          dateKey = order.createdAt.toISOString().slice(0, 7); // YYYY-MM
          break;
        default: // 'day'
          dateKey = order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      }

      const existing = groupedData.get(dateKey) || { revenue: 0, orderCount: 0 };
      groupedData.set(dateKey, {
        revenue: existing.revenue + order.totalAmount,
        orderCount: existing.orderCount + 1,
      });
    });

    // Convert to array and sort
    return Array.from(groupedData.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orderCount: data.orderCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get top-selling products for a date range
   */
  async getTopSellingProducts(
    storeId: string,
    dateRange: DateRange,
    limit: number = 10
  ): Promise<TopProduct[]> {
    const { startDate, endDate } = dateRange;

    const topProducts = await this.db.orderItem.groupBy({
      by: ['productId'],
      where: {
        productId: {
          not: null,
        },
        order: {
          storeId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: ['PROCESSING', 'SHIPPED', 'DELIVERED'],
          },
          deletedAt: null,
        },
      },
      _sum: {
        quantity: true,
        totalAmount: true,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    // Check if we have any results
    if (!topProducts || topProducts.length === 0) {
      return [];
    }

    // Get product details
    const productIds = topProducts
      .map((item) => item.productId)
      .filter((id): id is string => id !== null);
      
    const products = await this.db.product.findMany({
      where: {
        id: { in: productIds },
        storeId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return topProducts
      .map((item) => {
        if (!item.productId) return null;
        const product = productMap.get(item.productId);
        if (!product) return null;

        return {
          id: product.id,
          name: product.name,
          totalQuantity: item._sum?.quantity || 0,
          totalRevenue: item._sum?.totalAmount || 0,
          orderCount: item._count?._all || 0,
        };
      })
      .filter((item): item is TopProduct => item !== null);
  }

  /**
   * Get customer acquisition and retention metrics
   */
  async getCustomerMetrics(storeId: string, dateRange: DateRange): Promise<CustomerMetrics> {
    const { startDate, endDate } = dateRange;

    // Total customers (ever)
    const totalCustomers = await this.db.customer.count({
      where: {
        storeId,
        deletedAt: null,
      },
    });

    // New customers in period
    const newCustomers = await this.db.customer.count({
      where: {
        storeId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
    });

    // Returning customers (customers who made orders in this period and had orders before this period)
    const returningCustomerIds = await this.db.order.groupBy({
      by: ['customerId'],
      where: {
        storeId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        customerId: {
          not: null,
        },
        deletedAt: null,
      },
      having: {
        customerId: {
          _count: {
            gt: 0,
          },
        },
      },
    });

    // Check which of these customers had orders before the period
    const customerIdsWithPreviousOrders = returningCustomerIds.length > 0 ? await this.db.order.findMany({
      where: {
        storeId,
        customerId: {
          in: returningCustomerIds.map((item) => item.customerId!),
        },
        createdAt: {
          lt: startDate,
        },
        deletedAt: null,
      },
      select: {
        customerId: true,
      },
      distinct: ['customerId'],
    }) : [];

    const returningCustomerCount = customerIdsWithPreviousOrders.length;

    // Calculate retention rate (simplified - returning customers / total customers from previous period)
    const previousPeriodEnd = startDate;
    const previousPeriodStart = new Date(startDate);
    const periodLength = endDate.getTime() - startDate.getTime();
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodLength);

    const previousPeriodCustomers = await this.db.customer.count({
      where: {
        storeId,
        createdAt: {
          gte: previousPeriodStart,
          lt: previousPeriodEnd,
        },
        deletedAt: null,
      },
    });

    const customerRetentionRate = previousPeriodCustomers > 0 ? (returningCustomerCount / previousPeriodCustomers) * 100 : 0;

    return {
      totalCustomers,
      newCustomers,
      returningCustomers: returningCustomerCount,
      customerRetentionRate: Math.round(customerRetentionRate * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Get comprehensive analytics dashboard data
   */
  async getDashboardAnalytics(storeId: string, dateRange: DateRange) {
    const [salesMetrics, revenueByDay, topProducts, customerMetrics] = await Promise.all([
      this.getSalesMetrics(storeId, dateRange),
      this.getRevenueByPeriod(storeId, dateRange, 'day'),
      this.getTopSellingProducts(storeId, dateRange, 5),
      this.getCustomerMetrics(storeId, dateRange),
    ]);

    return {
      salesMetrics,
      revenueData: revenueByDay,
      topProducts,
      customerMetrics,
      dateRange,
    };
  }

  /**
   * Export sales report as CSV data
   */
  async exportSalesReport(storeId: string, dateRange: DateRange): Promise<string> {
    const orders = await this.db.order.findMany({
      where: {
        storeId,
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
        deletedAt: null,
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate CSV headers
    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Customer Email',
      'Status',
      'Total',
      'Items',
      'Item Count',
    ];

    // Generate CSV rows
    const rows = orders.map((order) => {
      const customerName = order.customer 
        ? `${order.customer.firstName} ${order.customer.lastName}`.trim()
        : 'Guest';
      const customerEmail = order.customer?.email || '';
      const itemsDescription = order.items
        .map((item) => `${item.product?.name || 'Unknown'} (${item.quantity})`)
        .join('; ');
      const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

      return [
        order.id,
        order.createdAt.toISOString().split('T')[0],
        customerName,
        customerEmail,
        order.status,
        order.totalAmount.toFixed(2),
        itemsDescription,
        itemCount.toString(),
      ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

export const analyticsService = new AnalyticsService();