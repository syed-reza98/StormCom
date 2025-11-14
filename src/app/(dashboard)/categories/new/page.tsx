// src/app/(dashboard)/categories/new/page.tsx
// Create New Category Page - Uses CategoryFormRefactored component

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CategoryFormRefactored } from '@/components/categories/category-form-refactored';
import { getCurrentUser } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Create Category | Dashboard',
  description: 'Add a new category to organize your products',
};

// ============================================================================
// SERVER COMPONENT
// ============================================================================

export default async function CreateCategoryPage() {
  // Get current user and verify authentication
  const user = await getCurrentUser();
  
  if (!user?.storeId) {
    redirect('/login');
  }

  // Fetch all categories for parent selector (hierarchical structure)
  const categories = await prisma.category.findMany({
    where: {
      storeId: user.storeId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      parentId: true,
      level: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create New Category</h1>
        <p className="text-muted-foreground">
          Add a new category to organize your products
        </p>
      </div>

      {/* Category Form Card */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Category Information</CardTitle>
          <CardDescription>
            Fill in the details below to create a new category. Categories help organize your products and make them easier to browse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryFormRefactored
            categories={categories}
            onSubmit={async (data) => {
              'use server';
              // This will be handled by a Server Action
              console.log('Creating category:', data);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
