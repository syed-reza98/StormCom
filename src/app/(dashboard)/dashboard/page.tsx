import { redirect } from 'next/navigation';

/**
 * Dashboard Root - Redirects to Products Page
 * 
 * The main dashboard functionality is distributed across specific pages:
 * - /products - Product management
 * - /orders - Order management
 * - /analytics - Business analytics
 * - /settings - Store settings
 * 
 * This route redirects to the products page as the default dashboard view.
 */
export default function DashboardPage() {
  redirect('/products');
}
