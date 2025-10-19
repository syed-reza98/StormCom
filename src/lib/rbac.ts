import { PERMISSIONS, DEFAULT_ROLES, ROLE_HIERARCHY } from './constants';
import { getRequestContext } from './request-context';
import type { RBACContext } from '../types';

/**
 * User role type (matches DEFAULT_ROLES keys).
 */
export type UserRole = keyof typeof DEFAULT_ROLES;

/**
 * RBAC (Role-Based Access Control) utilities for authorization.
 * 
 * Features:
 * - Permission matching with wildcard support (e.g., 'products.*' matches 'products.create')
 * - Role hierarchy (OWNER > ADMIN > MANAGER > STAFF > VIEWER)
 * - Integration with request context for per-request authorization
 * - Helper functions for API route guards
 * 
 * @see FR-093: Role-based access control
 * @see T011: Constants with PERMISSIONS and DEFAULT_ROLES
 * @see T015: Request context integration
 */

/**
 * Match a permission string against a pattern (with wildcard support).
 * 
 * Examples:
 * - matchPermission('products.create', 'products.*') → true
 * - matchPermission('products.create', 'products.create') → true
 * - matchPermission('products.create', 'orders.*') → false
 * - matchPermission('products.create', '*') → true
 * 
 * @param permission - The permission to check (e.g., 'products.create')
 * @param pattern - The pattern to match against (e.g., 'products.*' or 'products.create')
 * @returns true if the permission matches the pattern
 */
function matchPermission(permission: string, pattern: string): boolean {
  // Exact match
  if (permission === pattern) {
    return true;
  }

  // Wildcard match (e.g., 'products.*' matches 'products.create')
  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -2);
    return permission.startsWith(`${prefix}.`);
  }

  // Global wildcard
  if (pattern === '*') {
    return true;
  }

  return false;
}

/**
 * Check if a user has a specific permission.
 * 
 * This function:
 * 1. Gets the user's role from the request context
 * 2. Looks up the permissions for that role from DEFAULT_ROLES
 * 3. Checks if any of the user's permissions match the required permission (with wildcard support)
 * 
 * @param requiredPermission - The permission to check (e.g., 'products.create')
 * @param context - Optional RBAC context (defaults to current request context)
 * @returns true if the user has the required permission
 * @throws Error if no authenticated user in context
 */
export async function hasPermission(
  requiredPermission: string,
  context?: RBACContext
): Promise<boolean> {
  const ctx = context || await getRequestContext();
  const { userRole, permissions, isSuperAdmin } = ctx;

  // Super admin has all permissions
  if (isSuperAdmin) {
    return true;
  }

  // Check if user has the permission (from JWT claims)
  if (permissions && permissions.length > 0) {
    return permissions.some((p: string) => matchPermission(requiredPermission, p));
  }

  // Fallback: Check role-based permissions from DEFAULT_ROLES
  if (userRole) {
    const roleConfig = DEFAULT_ROLES[userRole as UserRole];
    if (roleConfig && roleConfig.permissions) {
      return roleConfig.permissions.some((p: string) => matchPermission(requiredPermission, p));
    }
  }

  return false;
}

/**
 * Check if a user has a specific role.
 * 
 * @param requiredRole - The role to check (e.g., 'ADMIN')
 * @param context - Optional RBAC context (defaults to current request context)
 * @returns true if the user has the required role
 * @throws Error if no authenticated user in context
 */
export async function hasRole(
  requiredRole: UserRole,
  context?: RBACContext
): Promise<boolean> {
  const ctx = context || await getRequestContext();
  const { userRole, isSuperAdmin } = ctx;

  // Super admin has all roles
  if (isSuperAdmin) {
    return true;
  }

  return userRole === requiredRole;
}

/**
 * Check if a user has a role equal to or higher than the required role.
 * 
 * Role hierarchy: OWNER > ADMIN > MANAGER > STAFF > VIEWER
 * 
 * Example: hasRoleOrHigher('STAFF') returns true for STAFF, MANAGER, ADMIN, and OWNER
 * 
 * @param minimumRole - The minimum role required (e.g., 'STAFF')
 * @param context - Optional RBAC context (defaults to current request context)
 * @returns true if the user has the minimum role or higher
 * @throws Error if no authenticated user in context
 */
export async function hasRoleOrHigher(
  minimumRole: UserRole,
  context?: RBACContext
): Promise<boolean> {
  const ctx = context || await getRequestContext();
  const { userRole, isSuperAdmin } = ctx;

  // Super admin is highest
  if (isSuperAdmin) {
    return true;
  }

  if (!userRole) {
    return false;
  }

  const userRoleLevel = ROLE_HIERARCHY[userRole as UserRole] || 0;
  const minimumRoleLevel = ROLE_HIERARCHY[minimumRole] || 0;

  return userRoleLevel >= minimumRoleLevel;
}

/**
 * Require a specific permission (throws error if not authorized).
 * 
 * This is a guard function for API routes. Use it to enforce permission checks.
 * 
 * @param requiredPermission - The permission to require (e.g., 'products.create')
 * @param context - Optional RBAC context (defaults to current request context)
 * @throws Error with 403 status if user does not have the permission
 * 
 * @example
 * // In an API route
 * export async function POST(request: Request) {
 *   await requirePermission(PERMISSIONS.PRODUCTS.CREATE);
 *   // ... rest of the handler
 * }
 */
export async function requirePermission(
  requiredPermission: string,
  context?: RBACContext
): Promise<void> {
  const ctx = context || await getRequestContext();
  
  if (!(await hasPermission(requiredPermission, ctx))) {
    throw new Error(
      `Forbidden: Permission '${requiredPermission}' required. ` +
      `User role: ${ctx.userRole || 'none'}, Super admin: ${ctx.isSuperAdmin}`
    );
  }
}

/**
 * Require a specific role (throws error if not authorized).
 * 
 * This is a guard function for API routes. Use it to enforce role checks.
 * 
 * @param requiredRole - The role to require (e.g., 'ADMIN')
 * @param context - Optional RBAC context (defaults to current request context)
 * @throws Error with 403 status if user does not have the role
 * 
 * @example
 * // In an API route
 * export async function DELETE(request: Request) {
 *   await requireRole('ADMIN');
 *   // ... rest of the handler
 * }
 */
export async function requireRole(
  requiredRole: UserRole,
  context?: RBACContext
): Promise<void> {
  const ctx = context || await getRequestContext();
  
  if (!(await hasRole(requiredRole, ctx))) {
    throw new Error(
      `Forbidden: Role '${requiredRole}' required. User role: ${ctx.userRole || 'none'}`
    );
  }
}

/**
 * Require a role equal to or higher than the minimum role (throws error if not authorized).
 * 
 * @param minimumRole - The minimum role required (e.g., 'STAFF')
 * @param context - Optional RBAC context (defaults to current request context)
 * @throws Error with 403 status if user does not meet the minimum role
 * 
 * @example
 * // In an API route
 * export async function GET(request: Request) {
 *   await requireRoleOrHigher('STAFF');
 *   // ... rest of the handler
 * }
 */
export async function requireRoleOrHigher(
  minimumRole: UserRole,
  context?: RBACContext
): Promise<void> {
  const ctx = context || await getRequestContext();
  
  if (!(await hasRoleOrHigher(minimumRole, ctx))) {
    throw new Error(
      `Forbidden: Minimum role '${minimumRole}' required. User role: ${ctx.userRole || 'none'}`
    );
  }
}

/**
 * Check if a user can perform any of the specified permissions (OR logic).
 * 
 * @param requiredPermissions - Array of permissions (user needs at least one)
 * @param context - Optional RBAC context (defaults to current request context)
 * @returns true if the user has any of the required permissions
 */
export async function hasAnyPermission(
  requiredPermissions: string[],
  context?: RBACContext
): Promise<boolean> {
  const ctx = context || await getRequestContext();
  
  for (const permission of requiredPermissions) {
    if (await hasPermission(permission, ctx)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a user has all of the specified permissions (AND logic).
 * 
 * @param requiredPermissions - Array of permissions (user needs all)
 * @param context - Optional RBAC context (defaults to current request context)
 * @returns true if the user has all of the required permissions
 */
export async function hasAllPermissions(
  requiredPermissions: string[],
  context?: RBACContext
): Promise<boolean> {
  const ctx = context || await getRequestContext();
  
  for (const permission of requiredPermissions) {
    if (!(await hasPermission(permission, ctx))) {
      return false;
    }
  }
  
  return true;
}

/**
 * Require any of the specified permissions (OR logic, throws error if none match).
 * 
 * @param requiredPermissions - Array of permissions (user needs at least one)
 * @param context - Optional RBAC context (defaults to current request context)
 * @throws Error with 403 status if user has none of the permissions
 */
export async function requireAnyPermission(
  requiredPermissions: string[],
  context?: RBACContext
): Promise<void> {
  const ctx = context || await getRequestContext();
  
  if (!(await hasAnyPermission(requiredPermissions, ctx))) {
    throw new Error(
      `Forbidden: One of these permissions required: ${requiredPermissions.join(', ')}. ` +
      `User role: ${ctx.userRole || 'none'}`
    );
  }
}

/**
 * Require all of the specified permissions (AND logic, throws error if any missing).
 * 
 * @param requiredPermissions - Array of permissions (user needs all)
 * @param context - Optional RBAC context (defaults to current request context)
 * @throws Error with 403 status if user is missing any permission
 */
export async function requireAllPermissions(
  requiredPermissions: string[],
  context?: RBACContext
): Promise<void> {
  const ctx = context || await getRequestContext();
  
  if (!(await hasAllPermissions(requiredPermissions, ctx))) {
    throw new Error(
      `Forbidden: All of these permissions required: ${requiredPermissions.join(', ')}. ` +
      `User role: ${ctx.userRole || 'none'}`
    );
  }
}

/**
 * Get all permissions for a given role.
 * 
 * @param role - The role to get permissions for
 * @returns Array of permission strings
 */
export function getPermissionsForRole(role: UserRole): string[] {
  const roleConfig = DEFAULT_ROLES[role];
  return roleConfig ? [...roleConfig.permissions] : [];
}

/**
 * Check if a role has a specific permission.
 * 
 * @param role - The role to check
 * @param permission - The permission to check
 * @returns true if the role has the permission
 */
export function roleHasPermission(role: UserRole, permission: string): boolean {
  const rolePermissions = getPermissionsForRole(role);
  return rolePermissions.some((p) => matchPermission(permission, p));
}
