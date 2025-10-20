import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as storeService from '@/services/stores/store-service';

export const metadata: Metadata = {
  title: 'Dashboard | StormCom',
  description: 'Store management dashboard',
};

/**
 * Format currency value
 */
function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Format number with commas
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/login');
  }

  const activeStoreId = session.user.activeStoreId || session.user.stores?.[0]?.storeId;
  const activeStore = session.user.stores?.find((s) => s.storeId === activeStoreId);

  // Fetch store statistics if we have an active store
  let stats = {
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
  };

  if (activeStoreId) {
    try {
      stats = await storeService.getStoreStats(activeStoreId);
    } catch (error) {
      console.error('Failed to fetch store stats:', error);
      // Continue with default stats
    }
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to {activeStore?.storeName || 'StormCom'}
        </p>
      </div>

      {!activeStoreId && (
        <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            No active store selected. Please select or create a store to view statistics.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
          <div className="mt-2 text-2xl font-bold">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            From delivered orders
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
          <div className="mt-2 text-2xl font-bold">
            {formatNumber(stats.totalOrders)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            All time
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Products</p>
          <div className="mt-2 text-2xl font-bold">
            {formatNumber(stats.totalProducts)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Active products
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Customers</p>
          <div className="mt-2 text-2xl font-bold">
            {formatNumber(stats.totalCustomers)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Total customers
          </p>
        </div>
      </div>

      {activeStoreId && stats.totalProducts === 0 && (
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Getting Started</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your store is ready! Here are some quick actions to get started:
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded border p-4">
              <h3 className="font-medium">Add Products</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first product listing
              </p>
            </div>
            <div className="rounded border p-4">
              <h3 className="font-medium">Configure Settings</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Set up shipping, taxes, and payment methods
              </p>
            </div>
            <div className="rounded border p-4">
              <h3 className="font-medium">Invite Team</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add team members to help manage your store
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
