'use client';

import {
  createContext,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth as useNextAuthSession } from '@/hooks/use-session';
import type { Session } from 'next-auth';

export interface AuthContextValue {
  user: Session['user'] | null;
  isLoading: boolean;
  error: string | null;
  checkPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: false,
  error: null,
  checkPermission: () => false,
  hasRole: () => false,
});

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component - Wrapper around NextAuth for authentication state
 * 
 * This component provides backward compatibility with the old AuthContext
 * while using NextAuth.js v4.24.13 under the hood.
 * 
 * Features:
 * - Session management via NextAuth JWT strategy
 * - Role-based permission checking
 * - Multi-tenant store access control
 * - Type-safe session access
 * 
 * @example
 * ```tsx
 * // In client components
 * const { user, isLoading, checkPermission, hasRole } = useContext(AuthContext);
 * 
 * // Or use the NextAuth hooks directly
 * import { useAuth, useRole, useStoreAccess } from '@/hooks/use-session';
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { user, isLoading } = useNextAuthSession();

  /**
   * Check if user has a specific permission
   * Implements role-based access control (RBAC)
   * 
   * @param permission - Permission string (e.g., 'products:write', 'orders:read')
   * @returns true if user has permission, false otherwise
   */
  const checkPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    // SuperAdmin has all permissions
    if (user.role === 'SuperAdmin') return true;

    // StoreAdmin has store-level permissions
    if (user.role === 'StoreAdmin') {
      const storePermissions = [
        'products:read', 'products:write', 'products:delete',
        'orders:read', 'orders:write', 'orders:delete',
        'customers:read', 'customers:write',
        'inventory:read', 'inventory:write',
        'marketing:read', 'marketing:write',
        'content:read', 'content:write',
        'pos:access',
        'reports:read',
        'settings:read', 'settings:write',
      ];
      return storePermissions.includes(permission);
    }

    // Staff has limited permissions
    if (user.role === 'Staff') {
      const staffPermissions = [
        'products:read',
        'orders:read', 'orders:write',
        'customers:read',
        'inventory:read',
        'pos:access',
      ];
      return staffPermissions.includes(permission);
    }

    // Customer has minimal permissions
    const customerPermissions = ['account:read', 'account:write', 'orders:read'];
    return customerPermissions.includes(permission);
  }, [user]);

  /**
   * Check if user has one or more roles
   * 
   * @param role - Single role string or array of roles
   * @returns true if user has any of the specified roles, false otherwise
   */
  const hasRole = useCallback((role: string | string[]): boolean => {
    if (!user) return false;

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }, [user]);

  const value: AuthContextValue = {
    user,
    isLoading,
    error: null, // NextAuth doesn't expose errors directly in session
    checkPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
