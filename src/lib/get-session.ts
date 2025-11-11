// src/lib/get-session.ts
// Server-side session utilities for NextAuth.js v4.24.13
// Use these helpers in Server Components and API Route Handlers

import { getServerSession as nextAuthGetServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

/**
 * Get the current user session in Server Components or API Routes
 * Returns null if not authenticated
 * 
 * @example
 * ```typescript
 * // In a Server Component
 * export default async function DashboardPage() {
 *   const session = await getSession();
 *   if (!session) redirect('/login');
 *   return <div>Welcome {session.user.name}</div>;
 * }
 * 
 * // In an API Route
 * export async function GET(request: NextRequest) {
 *   const session = await getSession();
 *   if (!session) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   // ... rest of handler
 * }
 * ```
 */
export async function getSession(): Promise<Session | null> {
  return await nextAuthGetServerSession(authOptions);
}

/**
 * Get the current user session or throw an error if not authenticated
 * Use this in protected routes where authentication is required
 * 
 * @throws {Error} If user is not authenticated
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const session = await requireSession();
 *   // session is guaranteed to be non-null here
 *   return NextResponse.json({ user: session.user });
 * }
 * ```
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  
  return session;
}

/**
 * Get the current user from the session
 * Returns null if not authenticated
 * 
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * if (!user) redirect('/login');
 * console.log(user.email); // Type-safe access to user properties
 * ```
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Check if the current user has a specific role
 * 
 * @param requiredRole - The role to check (e.g., 'SUPER_ADMIN', 'STORE_ADMIN')
 * @returns true if the user has the required role, false otherwise
 * 
 * @example
 * ```typescript
 * export default async function AdminPage() {
 *   const isAdmin = await hasRole('SUPER_ADMIN');
 *   if (!isAdmin) return <div>Access Denied</div>;
 *   return <div>Admin Dashboard</div>;
 * }
 * ```
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === requiredRole;
}

/**
 * Check if the current user has access to a specific store
 * Super Admins have access to all stores
 * 
 * @param storeId - The store ID to check access for
 * @returns true if the user has access, false otherwise
 * 
 * @example
 * ```typescript
 * export default async function StoreSettingsPage({ params }: { params: { storeId: string } }) {
 *   const hasAccess = await hasStoreAccess(params.storeId);
 *   if (!hasAccess) return <div>Access Denied</div>;
 *   return <div>Store Settings</div>;
 * }
 * ```
 */
export async function hasStoreAccess(storeId: string): Promise<boolean> {
  const user = await getCurrentUser();
  
  if (!user) return false;
  
  // Super Admins have access to all stores
  if (user.role === 'SUPER_ADMIN') return true;
  
  // Check if user's storeId matches the requested storeId
  return user.storeId === storeId;
}
