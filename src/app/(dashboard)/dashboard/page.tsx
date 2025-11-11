import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Dashboard Root - Role-Based Redirect
 * 
 * SUPER_ADMIN: Shows admin dashboard (TODO: create admin dashboard page)
 * STORE_ADMIN/STAFF: Redirects to /products as default view
 * 
 * The main dashboard functionality is distributed across specific pages:
 * - /products - Product management
 * - /orders - Order management
 * - /analytics - Business analytics
 * - /settings - Store settings
 */
export default async function DashboardPage() {
  // Fetch the authenticated session (Next.js 16 App Router server component).
  // Using the session enables future role-based branching while resolving the
  // unused variable TypeScript error (TS6133).
  const session = await getServerSession(authOptions);

  // If somehow unauthenticated (proxy should normally guard this), send to login.
  if (!session?.user) {
    redirect('/login');
  }

  const { role } = session.user;

  // Role-based redirection (placeholder logic):
  // SUPER_ADMIN: eventually should redirect to a cross-tenant admin dashboard once implemented.
  // STORE_ADMIN / STAFF: default product management landing page.
  // CUSTOMER (should not normally reach /dashboard): send to products as safe default.
  if (role === 'SUPER_ADMIN') {
    redirect('/admin/dashboard');
  }

  // Default landing for tenant staff/admin.
  redirect('/products');
}
