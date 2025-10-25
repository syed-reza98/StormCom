'use client';

import { useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/contexts/auth-provider';
import type { User } from '@prisma/client';

export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'Customer' | 'Staff' | 'StoreAdmin';
  storeId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for authentication operations
 * Provides login, logout, register, and current user state
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 * 
 * const handleLogin = async () => {
 *   try {
 *     await login({ email: 'user@example.com', password: 'password123' });
 *   } catch (error) {
 *     console.error('Login failed:', error);
 *   }
 * };
 * ```
 */
export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);
  const router = useRouter();

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { user, isLoading, error, setUser, setIsLoading, setError } = context;

  /**
   * Login with email and password
   * Optionally provide MFA code if user has MFA enabled
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      // Check if MFA is required
      if (data.data?.requiresMfa && !credentials.mfaCode) {
        // Redirect to MFA challenge page
        router.push('/mfa/challenge');
        return;
      }

      // Set user from response
      if (data.data?.user) {
        setUser(data.data.user);
        
        // Redirect based on role
        switch (data.data.user.role) {
          case 'SuperAdmin':
            router.push('/admin/dashboard');
            break;
          case 'StoreAdmin':
          case 'Staff':
            router.push('/dashboard');
            break;
          case 'Customer':
            router.push('/account');
            break;
          default:
            router.push('/');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router, setUser, setIsLoading, setError]);

  /**
   * Logout current user
   * Clears session and redirects to login page
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Logout failed');
      }

      // Clear user state
      setUser(null);
      
      // Redirect to login page
      router.push('/login');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router, setUser, setIsLoading, setError]);

  /**
   * Register new user account
   * Creates user and sends verification email
   */
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Registration failed');
      }

      // Registration successful - redirect to login with success message
      router.push('/login?registered=true');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router, setIsLoading, setError]);

  /**
   * Refresh current user data from server
   * Useful after profile updates or permission changes
   */
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        // Session expired or invalid
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh user';
      setError(errorMessage);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [setUser, setIsLoading, setError]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    register,
    refreshUser,
    clearError,
  };
}
