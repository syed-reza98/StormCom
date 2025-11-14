// src/app/(dashboard)/brands/new/page.tsx
// Create New Brand Page - Uses BrandFormRefactored component

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BrandFormRefactored } from '@/components/brands/brand-form-refactored';
import { getCurrentUser } from '@/lib/get-current-user';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Create Brand | Dashboard',
  description: 'Add a new brand to your store',
};

// ============================================================================
// SERVER COMPONENT
// ============================================================================

export default async function CreateBrandPage() {
  // Get current user and verify authentication
  const user = await getCurrentUser();
  
  if (!user?.storeId) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create New Brand</h1>
        <p className="text-muted-foreground">
          Add a new brand to organize your products by manufacturer
        </p>
      </div>

      {/* Brand Form Card */}
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Brand Information</CardTitle>
          <CardDescription>
            Fill in the details below to create a new brand. Brands help customers identify product manufacturers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrandFormRefactored
            onSubmit={async (data) => {
              'use server';
              // This will be handled by a Server Action
              console.log('Creating brand:', data);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
