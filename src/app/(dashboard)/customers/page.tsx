// src/app/(dashboard)/customers/page.tsx
// Customers List Dashboard Page - Customer management with data table

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomersTableRefactored } from '@/components/customers/customers-table-refactored';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { PlusIcon, UsersIcon } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Customers | Dashboard',
  description: 'Manage your customers and view customer insights',
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CustomersPageProps {
  searchParams: {
    page?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default async function CustomersPage({ 
  searchParams 
}: { 
  searchParams: Promise<CustomersPageProps['searchParams']> 
}) {
  // Get current user and verify authentication
  const user = await getCurrentUser();
  
  if (!user?.storeId) {
    redirect('/login');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const perPage = 20;
  const searchQuery = params.search || '';

  // Build where clause for filtering
  const where = {
    storeId: user.storeId,
    deletedAt: null,
    ...(searchQuery && {
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' as const } },
        { email: { contains: searchQuery, mode: 'insensitive' as const } },
      ],
    }),
  };

  // Fetch customers with order counts and total spent
  const [customers, totalCount] = await Promise.all([
    prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.customer.count({ where }),
  ]);

  // Calculate total spent for each customer
  const customersWithSpent = await Promise.all(
    customers.map(async (customer: {
      id: string;
      name: string | null;
      email: string;
      phone: string | null;
      createdAt: Date;
      orders: { id: string; total: number; createdAt: Date; }[];
      _count: { orders: number; };
    }) => {
      const orders = await prisma.order.aggregate({
        where: {
          customerId: customer.id,
          deletedAt: null,
        },
        _sum: {
          total: true,
        },
      });

      return {
        id: customer.id,
        name: customer.name || 'Guest Customer',
        email: customer.email,
        phone: customer.phone,
        ordersCount: customer._count.orders,
        totalSpent: Number(orders._sum.total || 0),
        lastOrderDate: customer.orders[0]?.createdAt.toISOString() || null,
        createdAt: customer.createdAt.toISOString(),
        isActive: true,
        isVerified: true,
      };
    })
  );

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">
              Manage your customers and view customer insights
            </p>
          </div>
        </div>
        <Link href="/dashboard/customers/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter((c: { orders: unknown[] }) => c.orders.length > 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${customersWithSpent.length > 0 
                ? (customersWithSpent.reduce((sum, c) => sum + c.totalSpent, 0) / customersWithSpent.length).toFixed(2)
                : '0.00'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            View and manage all customers across your store
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomersTableRefactored customers={customersWithSpent} />
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, totalCount)} of {totalCount} customers
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/dashboard/customers?page=${page - 1}${searchQuery ? `&search=${searchQuery}` : ''}`}>
                <Button variant="outline">Previous</Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/dashboard/customers?page=${page + 1}${searchQuery ? `&search=${searchQuery}` : ''}`}>
                <Button variant="outline">Next</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
