'use client';

/**
 * @deprecated This hook is deprecated in favor of NextAuth.js hooks.
 * 
 * Use these instead:
 * - `import { useAuth } from '@/hooks/use-session'` for authentication state
 * - `import { signIn, signOut } from 'next-auth/react'` for login/logout
 * - `import { useRequireAuth } from '@/hooks/use-session'` for protected routes
 * 
 * This file will be removed in a future version.
 */

import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth-provider';
import { useRouter } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';
import type { Session } from 'next-auth';

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
  user: Session['user'] | null;
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
 * @deprecated Use NextAuth hooks instead: `useAuth()` from '@/hooks/use-session'
 * 
 * Custom hook for authentication operations (now wraps NextAuth)
 */
export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);
  const router = useRouter();

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { user, isLoading, error } = context;

  /**
   * Login using NextAuth signIn
   */
  const login = async (credentials: LoginCredentials) => {
    const result = await signIn('credentials', {
      redirect: false,
      email: credentials.email,
      password: credentials.password,
      mfaCode: credentials.mfaCode,
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    // Redirect based on role (after successful login)
    if (user) {
      switch (user.role) {
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
          router.push('/dashboard');
      }
    }
  };

  /**
   * Logout using NextAuth signOut
   */
  const logout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  /**
   * Register new user account (still uses custom API)
   */
  const register = async (data: RegisterData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Registration failed');
    }

    // Registration successful - redirect to login
    router.push('/login?registered=true');
  };

  /**
   * Refresh user data (no-op with NextAuth - session is automatically managed)
   */
  const refreshUser = async () => {
    // NextAuth automatically manages session refreshing
    // This is a no-op for backward compatibility
  };

  /**
   * Clear error state (no-op - NextAuth doesn't expose errors in context)
   */
  const clearError = () => {
    // No-op for backward compatibility
  };

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
