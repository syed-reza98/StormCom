// src/app/(admin)/admin/stores/page.tsx
// Admin Stores Management Page - Cross-store administration

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { PlusIcon, StoreIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Stores Management | Admin',
  description: 'Manage all stores across the platform',
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AdminStoresPageProps {
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default async function AdminStoresPage({ 
  searchParams 
}: { 
  searchParams: Promise<AdminStoresPageProps['searchParams']> 
}) {
  // Get current user and verify SUPER_ADMIN role
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const perPage = 20;
  const searchQuery = params.search || '';
  const statusFilter = params.status;

  // Build where clause for filtering
  const where = {
    deletedAt: null,
    ...(searchQuery && {
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' as const } },
        { slug: { contains: searchQuery, mode: 'insensitive' as const } },
        { email: { contains: searchQuery, mode: 'insensitive' as const } },
      ],
    }),
    ...(statusFilter && {
      isActive: statusFilter === 'active',
    }),
  };

  // Fetch stores with user counts
  const [stores, totalCount] = await Promise.all([
    prisma.store.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            products: true,
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
    prisma.store.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StoreIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stores Management</h1>
            <p className="text-muted-foreground">
              Manage all stores across the platform
            </p>
          </div>
        </div>
        <Link href="/dashboard/stores/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Store
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stores.filter((s: { isActive: boolean }) => s.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stores.filter((s: { isActive: boolean }) => !s.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stores Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Stores</CardTitle>
          <CardDescription>
            View and manage all stores in the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No stores found
                  </TableCell>
                </TableRow>
              ) : (
                stores.map((store: {
                  id: string;
                  name: string;
                  email: string;
                  isActive: boolean;
                  _count: { users: number; products: number; orders: number };
                  createdAt: Date;
                }) => (
                  <TableRow key={store.id}>
                    <TableCell>
                      <Link 
                        href={`/dashboard/stores/${store.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {store.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {store.email}
                    </TableCell>
                    <TableCell>
                      {store.isActive ? (
                        <Badge variant="outline" className="bg-green-50">
                          <CheckCircleIcon className="h-3 w-3 mr-1 text-green-600" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50">
                          <XCircleIcon className="h-3 w-3 mr-1 text-red-600" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{store._count.users}</TableCell>
                    <TableCell>{store._count.products}</TableCell>
                    <TableCell>{store._count.orders}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(store.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/stores/${store.id}/settings`}>
                        <Button variant="ghost" size="sm">
                          Settings
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, totalCount)} of {totalCount} stores
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/stores?page=${page - 1}${searchQuery ? `&search=${searchQuery}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}`}>
                <Button variant="outline">Previous</Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/stores?page=${page + 1}${searchQuery ? `&search=${searchQuery}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}`}>
                <Button variant="outline">Next</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
