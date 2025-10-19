import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getUserPermissions, hasPermission } from '@/lib/rbac';
import { getSession } from '@/lib/auth-helpers';

/**
 * Admin Layout
 * 
 * Protects all admin routes with authentication and RBAC.
 * Enforces tenant isolation for non-Super Admin users.
 * 
 * @param children - Child route components
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Check authentication
  const session = await getSession();

  if (!session?.user) {
    // Redirect to login with return URL
    redirect('/auth/login?callbackUrl=/admin/dashboard');
  }

  // Check if user has any admin permissions
    const userPermissions = await getUserPermissions(session.user.id);
    const hasAdminAccess = hasPermission(userPermissions, ['stores.view', 'stores.*']);

  if (!hasAdminAccess) {
    // User has no admin permissions
    redirect('/auth/unauthorized');
  }

  // TODO: Load user's stores and set tenant context
  // This will be implemented when tenant context management is added

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* TODO: Add admin navigation sidebar */}
      {/* TODO: Add top header with user menu and store switcher */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
