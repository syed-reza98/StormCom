// src/app/(dashboard)/products/new/page.tsx
// Create New Product Page - Uses ProductFormRefactored component

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ProductFormRefactored } from '@/components/products/product-form-refactored';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Create Product | Dashboard',
  description: 'Add a new product to your store inventory',
};

// ============================================================================
// SERVER COMPONENT
// ============================================================================

export default async function CreateProductPage() {
  // Get current user and verify authentication
  const user = await getCurrentUser();
  
  if (!user?.storeId) {
    redirect('/login');
  }

  // Fetch categories and brands for the form
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      where: {
        storeId: user.storeId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.brand.findMany({
      where: {
        storeId: user.storeId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    }),
  ]);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create New Product</h1>
        <p className="text-muted-foreground">
          Add a new product to your store inventory
        </p>
      </div>

      {/* Product Form Card */}
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>
            Fill in the details below to create a new product. All required fields are marked with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductFormRefactored
            categories={categories}
            brands={brands}
            onSubmit={async (data) => {
              'use server';
              // This will be handled by a Server Action
              console.log('Creating product:', data);
            }}
            onCancel={() => {
              'use client';
              window.location.href = '/dashboard/products';
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
