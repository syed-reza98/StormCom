import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as storeService from '@/services/stores/store-service';
import type { Store } from '@prisma/client';

export const metadata: Metadata = {
  title: 'Stores | StormCom',
  description: 'Manage all stores',
};

export default async function StoresListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/login');
  }

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const search = params.search || '';
  const status = params.status as 'ACTIVE' | 'TRIAL' | 'TRIAL_EXPIRED' | 'SUSPENDED' | 'CLOSED' | undefined;

  const isSuperAdmin = session.user.stores?.some(
    (s) => s.roleName === 'SUPER_ADMIN'
  );

  if (!isSuperAdmin) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Only super admins can view all stores.
          </p>
        </div>
      </div>
    );
  }

  const result = await storeService.listStores(
    { page, perPage: 20, search, status, sortBy: 'createdAt', sortOrder: 'desc' },
    { userId: session.user.id, isSuperAdmin }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stores</h1>
          <p className="text-muted-foreground mt-1">
            Manage all stores in the system
          </p>
        </div>
        <a
          href="/settings/stores/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Store
        </a>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search stores..."
          defaultValue={search}
          className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Slug</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {result.stores.map((store: Store) => (
              <tr key={store.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 text-sm font-medium">{store.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{store.slug}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      store.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : store.status === 'TRIAL'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {store.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(store.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <a
                    href={`/settings/stores/${store.id}`}
                    className="text-primary hover:underline"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, result.total)} of {result.total}
        </div>
        <div className="flex gap-2">
          {page > 1 && (
            <a
              href={`?page=${page - 1}${search ? `&search=${search}` : ''}`}
              className="rounded-md border px-3 py-1 hover:bg-accent"
            >
              Previous
            </a>
          )}
          {page < result.totalPages && (
            <a
              href={`?page=${page + 1}${search ? `&search=${search}` : ''}`}
              className="rounded-md border px-3 py-1 hover:bg-accent"
            >
              Next
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
