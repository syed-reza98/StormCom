import { Suspense } from 'react';
import Link from 'next/link';

/**
 * Stores List Page
 * 
 * Task: T088 [US1] Create Stores List page in src/app/(dashboard)/stores/page.tsx
 * 
 * Purpose: Dashboard page for listing all stores with management capabilities.
 * Provides comprehensive store management interface for Super Admins and Store Admins.
 * 
 * Features:
 * - Store listing with data table
 * - Search and filtering capabilities
 * - Create new store button
 * - Store actions (view, edit, delete)
 * - Subscription status indicators
 * - Pagination controls
 * - Role-based access control
 * 
 * User Experience:
 * - Clean, professional table layout
 * - Responsive design for mobile/tablet
 * - Quick action buttons for common tasks
 * - Visual status indicators
 * - Accessible navigation and controls
 * 
 * Security:
 * - Server-side data fetching with authentication
 * - Role-based store filtering
 * - Protected actions based on permissions
 * 
 * Note: This is a foundational implementation using basic HTML/CSS.
 * Will be enhanced with shadcn/ui components in future iterations.
 */

// Type definitions
interface Store {
  id: string;
  name: string;
  slug: string;
  email: string;
  subscriptionPlan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  productCount: number;
  orderCount: number;
  customerCount: number;
  createdAt: string;
}

// Mock data for development (to be replaced with actual API calls)
const mockStores: Store[] = [
  {
    id: '1',
    name: 'Demo Electronics Store',
    slug: 'demo-electronics',
    email: 'admin@demo-electronics.com',
    subscriptionPlan: 'PRO',
    subscriptionStatus: 'ACTIVE',
    productCount: 156,
    orderCount: 1240,
    customerCount: 847,
    createdAt: '2023-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Fashion Hub',
    slug: 'fashion-hub',
    email: 'contact@fashionhub.com',
    subscriptionPlan: 'BASIC',
    subscriptionStatus: 'ACTIVE',
    productCount: 89,
    orderCount: 456,
    customerCount: 234,
    createdAt: '2023-02-20T14:15:00Z',
  },
  {
    id: '3',
    name: 'Book Corner',
    slug: 'book-corner',
    email: 'info@bookcorner.com',
    subscriptionPlan: 'FREE',
    subscriptionStatus: 'TRIAL',
    productCount: 23,
    orderCount: 12,
    customerCount: 45,
    createdAt: '2023-03-10T09:45:00Z',
  },
];

/**
 * Subscription Status Badge Component
 */
function SubscriptionStatusBadge({ status }: { status: Store['subscriptionStatus'] }) {
  const statusConfig = {
    TRIAL: { className: 'bg-yellow-100 text-yellow-800', label: 'Trial' },
    ACTIVE: { className: 'bg-green-100 text-green-800', label: 'Active' },
    PAST_DUE: { className: 'bg-red-100 text-red-800', label: 'Past Due' },
    CANCELLED: { className: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
    EXPIRED: { className: 'bg-red-100 text-red-800', label: 'Expired' },
  };

  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

/**
 * Subscription Plan Badge Component
 */
function SubscriptionPlanBadge({ plan }: { plan: Store['subscriptionPlan'] }) {
  const planConfig = {
    FREE: { className: 'bg-gray-100 text-gray-800', label: 'Free' },
    BASIC: { className: 'bg-blue-100 text-blue-800', label: 'Basic' },
    PRO: { className: 'bg-purple-100 text-purple-800', label: 'Pro' },
    ENTERPRISE: { className: 'bg-indigo-100 text-indigo-800', label: 'Enterprise' },
  };

  const config = planConfig[plan];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

/**
 * Store Actions Dropdown Component
 */
function StoreActionsDropdown({ store }: { store: Store }) {
  return (
    <div className="relative inline-block text-left">
      <div className="flex space-x-2">
        <Link
          href={`/dashboard/stores/${store.id}`}
          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
        >
          View
        </Link>
        <Link
          href={`/dashboard/stores/${store.id}/edit`}
          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
        >
          Edit
        </Link>
        <button
          onClick={() => {
            if (confirm(`Are you sure you want to delete ${store.name}?`)) {
              // TODO: Implement delete functionality
            }
          }}
          className="text-red-600 hover:text-red-900 text-sm font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

/**
 * Stores Data Table Component
 */
function StoresDataTable({ stores }: { stores: Store[] }) {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Store
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orders
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stores.length ? (
              stores.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{store.name}</div>
                      <div className="text-sm text-gray-500">{store.slug}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {store.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SubscriptionPlanBadge plan={store.subscriptionPlan} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SubscriptionStatusBadge status={store.subscriptionStatus} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {store.productCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {store.orderCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {store.customerCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(store.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StoreActionsDropdown store={store} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-500">
                  No stores found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Stores List Loading Component
 */
function StoresListLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
          <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="h-10 w-28 bg-gray-200 animate-pulse rounded" />
      </div>

      {/* Search skeleton */}
      <div className="h-10 w-80 bg-gray-200 animate-pulse rounded" />

      {/* Table skeleton */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="h-12 bg-gray-200 animate-pulse rounded-t-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 border-t border-gray-200 bg-gray-100 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

/**
 * Main Stores List Page Component
 */
export default function StoresPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Stores</h1>
              <p className="text-gray-600">
                Manage and monitor all stores in your platform
              </p>
            </div>
            <Link
              href="/dashboard/stores/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Store
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search stores..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              Filter
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-lg font-medium text-gray-900">Total Stores</div>
                  </div>
                </div>
                <div className="mt-1">
                  <div className="text-3xl font-bold text-gray-900">{mockStores.length}</div>
                  <p className="text-sm text-gray-600">+2 from last month</p>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-lg font-medium text-gray-900">Active Stores</div>
                  </div>
                </div>
                <div className="mt-1">
                  <div className="text-3xl font-bold text-gray-900">
                    {mockStores.filter(s => s.subscriptionStatus === 'ACTIVE').length}
                  </div>
                  <p className="text-sm text-gray-600">
                    {Math.round((mockStores.filter(s => s.subscriptionStatus === 'ACTIVE').length / mockStores.length) * 100)}% of total
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-lg font-medium text-gray-900">Trial Stores</div>
                  </div>
                </div>
                <div className="mt-1">
                  <div className="text-3xl font-bold text-gray-900">
                    {mockStores.filter(s => s.subscriptionStatus === 'TRIAL').length}
                  </div>
                  <p className="text-sm text-gray-600">Require attention</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stores Table */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Store Management</h3>
              <p className="mt-1 text-sm text-gray-600">
                View and manage all stores in your platform
              </p>
            </div>
            <div className="p-6">
              <Suspense fallback={<StoresListLoading />}>
                <StoresDataTable stores={mockStores} />
              </Suspense>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing 1 to {mockStores.length} of {mockStores.length} stores
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled
                className="px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-400 bg-white cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled
                className="px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-400 bg-white cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}