import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Admin Dashboard (SUPER_ADMIN only)
 *
 * URL: /admin/dashboard
 * Group: (admin) - separate from (dashboard) tenant-scoped routes
 */
export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    redirect('/products');
  }

  return (
    <main className="p-6 md:p-10">
      <section className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Cross-tenant overview and system administration.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <h2 className="font-medium">Total Stores</h2>
            <p className="text-3xl font-semibold mt-2">—</p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-medium">Active Users</h2>
            <p className="text-3xl font-semibold mt-2">—</p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-medium">System Health</h2>
            <p className="text-3xl font-semibold mt-2">—</p>
          </div>
        </div>
      </section>
    </main>
  );
}
