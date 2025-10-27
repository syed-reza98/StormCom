import { Metadata } from 'next';
import { Suspense } from 'react';
import { CreateStoreForm } from '@/components/stores';

export const metadata: Metadata = {
  title: 'Create New Store | StormCom Dashboard',
  description: 'Create a new store in your multi-tenant e-commerce platform',
};

/**
 * Create Store Page Component
 * 
 * Renders the form for creating a new store with validation and proper error handling.
 * Includes name, subdomain, and owner selection fields.
 */
export default function CreateStorePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create New Store</h1>
            <p className="mt-2 text-lg text-gray-600">
              Set up a new store for your e-commerce platform
            </p>
          </div>

          {/* Create Store Form */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-8">
              <Suspense
                fallback={
                  <div className="space-y-6">
                    <div className="h-20 bg-gray-200 animate-pulse rounded" />
                    <div className="h-20 bg-gray-200 animate-pulse rounded" />
                    <div className="h-20 bg-gray-200 animate-pulse rounded" />
                    <div className="h-10 bg-gray-200 animate-pulse rounded w-32" />
                  </div>
                }
              >
                <CreateStoreForm />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}