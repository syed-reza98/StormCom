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
  const session = await getServerSession(authOptions);
  
  // For now, SUPER_ADMIN also goes to /products
  // TODO: Create a proper admin dashboard for SUPER_ADMIN
  // For SUPER_ADMIN: Show cross-tenant analytics, store list, system settings
  
  redirect('/products');
}
