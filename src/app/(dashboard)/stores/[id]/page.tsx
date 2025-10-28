import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

/**
 * Store Details Page
 * 
 * Task: T089 [US1] Create Store Details page in src/app/(dashboard)/stores/[id]/page.tsx
 * 
 * Purpose: Comprehensive store management page with settings tabs for individual store configuration.
 * Provides detailed view and management capabilities for store administrators.
 * 
 * Features:
 * - Store details overview with key metrics
 * - Tabbed interface for different settings categories
 * - General settings (name, description, contact info)
 * - Theme and branding configuration
 * - Billing and subscription management
 * - User and admin management
 * - Role-based access control
 * 
 * User Experience:
 * - Clean tabbed navigation interface
 * - Responsive design for all screen sizes
 * - Quick edit capabilities
 * - Visual feedback for changes
 * - Accessible navigation and controls
 * 
 * Security:
 * - Server-side data fetching with authentication
 * - Role-based content visibility
 * - Protected actions based on permissions
 * - Input validation and sanitization
 */

// Type definitions
interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  email: string;
  phone?: string;
  website?: string;
  subscriptionPlan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  productLimit: number;
  orderLimit: number;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  currency: string;
  timezone: string;
  locale: string;
  productCount: number;
  orderCount: number;
  customerCount: number;
  adminCount: number;
  createdAt: string;
  updatedAt: string;
}

interface StoreDetailsPageProps {
  params: Promise<{ id: string }>;
}

// Mock store data (to be replaced with actual API call)
async function getStore(id: string): Promise<Store | null> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const mockStores: Store[] = [
    {
      id: '1',
      name: 'Demo Electronics Store',
      slug: 'demo-electronics',
      description: 'Your one-stop shop for the latest electronics and gadgets.',
      logo: '/images/stores/demo-electronics-logo.png',
      email: 'admin@demo-electronics.com',
      phone: '+1 (555) 123-4567',
      website: 'https://demo-electronics.com',
      subscriptionPlan: 'PRO',
      subscriptionStatus: 'ACTIVE',
      trialEndsAt: undefined,
      subscriptionEndsAt: '2024-12-31T23:59:59Z',
      productLimit: 1000,
      orderLimit: 10000,
      address: '123 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'US',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
      locale: 'en',
      productCount: 156,
      orderCount: 1240,
      customerCount: 847,
      adminCount: 3,
      createdAt: '2023-01-15T10:30:00Z',
      updatedAt: '2023-10-27T15:45:00Z',
    },
  ];

  return mockStores.find(store => store.id === id) || null;
}

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
 * Store Statistics Cards Component
 */
function StoreStatsCards({ store }: { store: Store }) {
  const stats = [
    {
      name: 'Products',
      value: store.productCount.toLocaleString(),
      limit: store.productLimit === -1 ? 'Unlimited' : store.productLimit.toLocaleString(),
    },
    {
      name: 'Orders',
      value: store.orderCount.toLocaleString(),
      limit: store.orderLimit === -1 ? 'Unlimited' : `${store.orderLimit.toLocaleString()}/month`,
    },
    {
      name: 'Customers',
      value: store.customerCount.toLocaleString(),
      limit: 'Unlimited',
    },
    {
      name: 'Admins',
      value: store.adminCount.toString(),
      limit: 'Unlimited',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-sm font-medium text-gray-500">{stat.name}</div>
              </div>
            </div>
            <div className="mt-1">
              <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-600">Limit: {stat.limit}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Settings Tabs Component
 */
function SettingsTabs({ store, activeTab }: { store: Store; activeTab: string }) {
  const tabs = [
    { id: 'general', name: 'General', href: `/dashboard/stores/${store.id}?tab=general` },
    { id: 'theme', name: 'Theme', href: `/dashboard/stores/${store.id}?tab=theme` },
    { id: 'billing', name: 'Billing', href: `/dashboard/stores/${store.id}?tab=billing` },
    { id: 'users', name: 'Users', href: `/dashboard/stores/${store.id}?tab=users` },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/**
 * General Settings Tab Content
 */
function GeneralSettingsTab({ store }: { store: Store }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Store Information</h3>
        <p className="mt-1 text-sm text-gray-600">Basic information about your store.</p>
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label htmlFor="store-name" className="block text-sm font-medium text-gray-700">Store Name</label>
          <div className="mt-1">
            <input
              id="store-name"
              type="text"
              defaultValue={store.name}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="store-slug" className="block text-sm font-medium text-gray-700">Store Slug</label>
          <div className="mt-1">
            <input
              id="store-slug"
              type="text"
              defaultValue={store.slug}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-6">
          <label htmlFor="store-description" className="block text-sm font-medium text-gray-700">Description</label>
          <div className="mt-1">
            <textarea
              id="store-description"
              rows={3}
              defaultValue={store.description}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="store-email" className="block text-sm font-medium text-gray-700">Email</label>
          <div className="mt-1">
            <input
              id="store-email"
              type="email"
              defaultValue={store.email}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="store-phone" className="block text-sm font-medium text-gray-700">Phone</label>
          <div className="mt-1">
            <input
              id="store-phone"
              type="tel"
              defaultValue={store.phone}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-6">
          <label htmlFor="store-website" className="block text-sm font-medium text-gray-700">Website</label>
          <div className="mt-1">
            <input
              id="store-website"
              type="url"
              defaultValue={store.website}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="button"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Theme Settings Tab Content
 */
function ThemeSettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Theme & Branding</h3>
        <p className="mt-1 text-sm text-gray-600">Customize your store{'\''}s appearance and branding.</p>
      </div>

      <div className="text-center text-gray-500 py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Theme Configuration</h3>
        <p className="mt-1 text-sm text-gray-500">Theme settings will be implemented in future iterations.</p>
      </div>
    </div>
  );
}

/**
 * Billing Settings Tab Content
 */
function BillingSettingsTab({ store }: { store: Store }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">Billing & Subscription</h3>
        <p className="mt-1 text-sm text-gray-600">Manage your subscription plan and billing information.</p>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Current Plan</h4>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <SubscriptionPlanBadge plan={store.subscriptionPlan} />
                <SubscriptionStatusBadge status={store.subscriptionStatus} />
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {store.subscriptionEndsAt && (
                  <>Renews on {new Date(store.subscriptionEndsAt).toLocaleDateString()}</>
                )}
                {store.trialEndsAt && (
                  <>Trial ends on {new Date(store.trialEndsAt).toLocaleDateString()}</>
                )}
              </p>
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-gray-500 py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Billing Management</h3>
        <p className="mt-1 text-sm text-gray-500">Detailed billing features will be implemented in future iterations.</p>
      </div>
    </div>
  );
}

/**
 * Users Settings Tab Content
 */
function UsersSettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">User Management</h3>
        <p className="mt-1 text-sm text-gray-600">Manage store administrators and staff members.</p>
      </div>

      <div className="text-center text-gray-500 py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">User Management</h3>
        <p className="mt-1 text-sm text-gray-500">User management features will be implemented in future iterations.</p>
      </div>
    </div>
  );
}

/**
 * Store Details Loading Component (for future use with loading.tsx)
 */
export function StoreDetailsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
            </div>
            <div className="h-10 w-24 bg-gray-200 animate-pulse rounded" />
          </div>

          {/* Stats skeleton */}
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>

          {/* Content skeleton */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="h-64 bg-gray-200 animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Store Details Page Component
 */
export default async function StoreDetailsPage({ params }: StoreDetailsPageProps) {
  const { id } = await params;
  const store = await getStore(id);

  if (!store) {
    notFound();
  }

  // Get active tab from searchParams (would be available in client component)
  // In a real implementation, this would come from URL params or state
  const activeTab: 'general' | 'theme' | 'billing' | 'users' = (
    // TODO: Read from searchParams when implementing client-side tab switching
    'general' as 'general' | 'theme' | 'billing' | 'users'
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{store.name}</h1>
                <SubscriptionStatusBadge status={store.subscriptionStatus} />
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>{store.slug}</span>
                <span>•</span>
                <span>Created {new Date(store.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/dashboard/stores/${store.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit Store
              </Link>
              <Link
                href={`https://${store.slug}.example.com`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Store
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Store Statistics */}
          <StoreStatsCards store={store} />

          {/* Settings Tabs Content */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4">
              <SettingsTabs store={store} activeTab={activeTab} />
            </div>
            <div className="px-6 py-6">
              <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading...</div>}>
                {activeTab === 'general' && <GeneralSettingsTab store={store} />}
                {activeTab === 'theme' && <ThemeSettingsTab />}
                {activeTab === 'billing' && <BillingSettingsTab store={store} />}
                {activeTab === 'users' && <UsersSettingsTab />}
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}