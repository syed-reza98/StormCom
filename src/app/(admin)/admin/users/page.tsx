// src/app/(admin)/admin/users/page.tsx
// Admin Users Management Page - Platform-wide user management with RBAC

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { PlusIcon, UsersIcon, MoreHorizontalIcon, ShieldIcon, ShieldCheckIcon, UserIcon } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Users Management | Admin',
  description: 'Manage all users across the platform with role-based access control',
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AdminUsersPageProps {
  searchParams: {
    page?: string;
    search?: string;
    role?: string;
    storeId?: string;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default async function AdminUsersPage({ 
  searchParams 
}: { 
  searchParams: Promise<AdminUsersPageProps['searchParams']> 
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
  const roleFilter = params.role;
  const storeFilter = params.storeId;

  // Build where clause for filtering
  const where = {
    deletedAt: null,
    ...(searchQuery && {
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' as const } },
        { email: { contains: searchQuery, mode: 'insensitive' as const } },
      ],
    }),
    ...(roleFilter && {
      role: roleFilter as 'SUPER_ADMIN' | 'STORE_ADMIN' | 'STAFF' | 'CUSTOMER',
    }),
    ...(storeFilter && {
      storeId: storeFilter,
    }),
  };

  // Fetch users with store information
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        storeId: true,
        store: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.user.count({ where }),
  ]);

  // Calculate role distribution
  const roleStats = await prisma.user.groupBy({
    by: ['role'],
    where: { deletedAt: null },
    _count: true,
  });

  const totalPages = Math.ceil(totalCount / perPage);

  // Helper function to get role badge variant
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge variant="default" className="bg-purple-100 text-purple-800"><ShieldCheckIcon className="h-3 w-3 mr-1" />Super Admin</Badge>;
      case 'STORE_ADMIN':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><ShieldIcon className="h-3 w-3 mr-1" />Store Admin</Badge>;
      case 'STAFF':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><UserIcon className="h-3 w-3 mr-1" />Staff</Badge>;
      case 'CUSTOMER':
        return <Badge variant="outline"><UserIcon className="h-3 w-3 mr-1" />Customer</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
            <p className="text-muted-foreground">
              Manage all users across the platform with role-based access control
            </p>
          </div>
        </div>
        <Link href="/admin/users/new">
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        {roleStats.map((stat: { role: string; _count: number }) => (
          <Card key={stat.role}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.role.replace('_', ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat._count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage all users in the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((usr: {
                  id: string;
                  name: string | null;
                  email: string;
                  role: string;
                  isActive: boolean;
                  emailVerified: Date | null;
                  createdAt: Date;
                  lastLoginAt: Date | null;
                  storeId: string | null;
                  store: { name: string } | null;
                }) => (
                  <TableRow key={usr.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{usr.name || 'N/A'}</span>
                        {!usr.emailVerified && (
                          <Badge variant="outline" className="w-fit text-xs mt-1">
                            Unverified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {usr.email}
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(usr.role)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {usr.store?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {usr.isActive ? (
                        <Badge variant="outline" className="bg-green-50">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {usr.lastLoginAt 
                        ? formatDistanceToNow(new Date(usr.lastLoginAt), { addSuffix: true })
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(usr.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            {usr.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, totalCount)} of {totalCount} users
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/users?page=${page - 1}${searchQuery ? `&search=${searchQuery}` : ''}${roleFilter ? `&role=${roleFilter}` : ''}`}>
                <Button variant="outline">Previous</Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/users?page=${page + 1}${searchQuery ? `&search=${searchQuery}` : ''}${roleFilter ? `&role=${roleFilter}` : ''}`}>
                <Button variant="outline">Next</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
