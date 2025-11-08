// src/hooks/use-session.ts
// Client-side session hooks for NextAuth.js v4.24.13
// Re-exports NextAuth hooks with type safety

'use client';

export { useSession, signIn, signOut } from 'next-auth/react';

import { useSession as useNextAuthSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Custom hook for authentication with type-safe session access
 * 
 * @example
 * ```typescript
 * 'use client';
 * 
 * export function ProfileButton() {
 *   const { user, isAuthenticated, isLoading } = useAuth();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!isAuthenticated) return <div>Please log in</div>;
 *   
 *   return <div>Welcome {user.name}</div>;
 * }
 * ```
 */
export function useAuth() {
  const { data: session, status } = useNextAuthSession();
  
  return {
    user: session?.user ?? null,
    session,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    status,
  };
}

/**
 * Custom hook for role-based access control
 * 
 * @param requiredRole - The role required to access the component
 * @returns Object with hasRole boolean and user data
 * 
 * @example
 * ```typescript
 * 'use client';
 * 
 * export function AdminPanel() {
 *   const { hasRole, isLoading } = useRole('SUPER_ADMIN');
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!hasRole) return <div>Access Denied</div>;
 *   
 *   return <div>Admin Panel</div>;
 * }
 * ```
 */
export function useRole(requiredRole: string) {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  return {
    hasRole: isAuthenticated && user?.role === requiredRole,
    user,
    isLoading,
    isAuthenticated,
  };
}

/**
 * Custom hook for store-specific access control
 * Super Admins have access to all stores
 * 
 * @param storeId - The store ID to check access for
 * @returns Object with hasAccess boolean and user data
 * 
 * @example
 * ```typescript
 * 'use client';
 * 
 * export function StoreSettings({ storeId }: { storeId: string }) {
 *   const { hasAccess, isLoading } = useStoreAccess(storeId);
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!hasAccess) return <div>Access Denied</div>;
 *   
 *   return <div>Store Settings for {storeId}</div>;
 * }
 * ```
 */
export function useStoreAccess(storeId: string) {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  const hasAccess =
    isAuthenticated &&
    (user?.role === 'SUPER_ADMIN' || user?.storeId === storeId);
  
  return {
    hasAccess,
    user,
    isLoading,
    isAuthenticated,
  };
}

/**
 * Custom hook for protected routes with automatic redirect
 * Redirects to login page if user is not authenticated
 * 
 * @param redirectTo - Optional URL to redirect after login (default: current page)
 * 
 * @example
 * ```typescript
 * 'use client';
 * 
 * export default function ProtectedPage() {
 *   const { user, isLoading } = useRequireAuth();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   
 *   // User is guaranteed to be authenticated here
 *   return <div>Welcome {user.name}</div>;
 * }
 * ```
 */
export function useRequireAuth(redirectTo?: string) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const checkAuth = useCallback(() => {
    if (!isLoading && !isAuthenticated) {
      const callbackUrl = redirectTo || window.location.pathname;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [isLoading, isAuthenticated, redirectTo, router]);
  
  // Check auth on mount and when status changes
  if (!isLoading && !isAuthenticated) {
    checkAuth();
  }
  
  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
