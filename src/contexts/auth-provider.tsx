'use client';

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { User } from '@prisma/client';

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  checkPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: false,
  error: null,
  setUser: () => {},
  setIsLoading: () => {},
  setError: () => {},
  checkPermission: () => false,
  hasRole: () => false,
});

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component - Manages authentication state and session
 * 
 * Features:
 * - Session management with automatic refresh
 * - Role-based permission checking
 * - User state persistence across page loads
 * - Automatic session validation on mount
 * 
 * @example
 * ```tsx
 * // In app/layout.tsx or root component
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if user has a specific permission
   * For now, permissions are role-based
   * TODO: Implement granular permission system when needed
   */
  const checkPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    // SUPER_ADMIN has all permissions
    if (user.role === 'SUPER_ADMIN') return true;

    // STORE_ADMIN has store-level permissions
    if (user.role === 'STORE_ADMIN') {
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

    // STAFF has limited permissions
    if (user.role === 'STAFF') {
      const staffPermissions = [
        'products:read',
        'orders:read', 'orders:write',
        'customers:read',
        'inventory:read',
        'pos:access',
      ];
      return staffPermissions.includes(permission);
    }

    // CUSTOMER has minimal permissions
    const customerPermissions = ['account:read', 'account:write', 'orders:read'];
    return customerPermissions.includes(permission);
  }, [user]);

  /**
   * Check if user has one or more roles
   * @param role - Single role string or array of roles
   */
  const hasRole = useCallback((role: string | string[]): boolean => {
    if (!user) return false;

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }, [user]);

  /**
   * Validate session on component mount
   * Checks if user has valid session cookie and fetches user data
   */
  const validateSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        // No valid session
        setUser(null);
        return;
      }

      const data = await response.json();
      
      if (data.data?.user) {
        setUser(data.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Session validation error:', err);
      setUser(null);
      setError('Failed to validate session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initialize session on mount
   */
  useEffect(() => {
    validateSession();
  }, [validateSession]);

  /**
   * Auto-refresh session every 5 minutes
   * Keeps session alive for active users
   */
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      validateSession();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, validateSession]);

  /**
   * Listen for session changes across tabs
   * Synchronize auth state using localStorage events
   */
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth:logout') {
        setUser(null);
      } else if (event.key === 'auth:login') {
        validateSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [validateSession]);

  const value: AuthContextValue = {
    user,
    isLoading,
    error,
    setUser,
    setIsLoading,
    setError,
    checkPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
