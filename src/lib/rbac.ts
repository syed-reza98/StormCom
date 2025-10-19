/**
 * RBAC (Role-Based Access Control) Guard Utility
 * Provides permission checking and authorization
 */

import { RequestContext } from './request-context';
import prisma from './prisma';

export type Permission = string;

/**
 * Permission patterns for the application
 */
export const PERMISSIONS = {
  // Product permissions
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_ALL: 'products.*',

  // Order permissions
  ORDERS_VIEW: 'orders.view',
  ORDERS_CREATE: 'orders.create',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_DELETE: 'orders.delete',
  ORDERS_ALL: 'orders.*',

  // Customer permissions
  CUSTOMERS_VIEW: 'customers.view',
  CUSTOMERS_CREATE: 'customers.create',
  CUSTOMERS_UPDATE: 'customers.update',
  CUSTOMERS_DELETE: 'customers.delete',
  CUSTOMERS_ALL: 'customers.*',

  // Settings permissions
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_ALL: 'settings.*',

  // Reports permissions
  REPORTS_VIEW: 'reports.view',
  REPORTS_ALL: 'reports.*',

  // Staff permissions
  STAFF_VIEW: 'staff.view',
  STAFF_MANAGE: 'staff.manage',
  STAFF_ALL: 'staff.*',

  // All permissions (super admin)
  ALL: '*',
} as const;

/**
 * Check if a permission matches a required permission pattern
 * Supports wildcard matching (e.g., "products.*" matches "products.view")
 */
function permissionMatches(permission: string, required: string): boolean {
  // Exact match
  if (permission === required) return true;

  // All permissions wildcard
  if (permission === '*') return true;

  // Category wildcard (e.g., "products.*" matches "products.view")
  if (permission.endsWith('.*')) {
    const category = permission.slice(0, -2);
    return required.startsWith(category + '.');
  }

  // View-all wildcard (e.g., "*.view" matches "products.view")
  if (permission.startsWith('*.')) {
    const action = permission.slice(2);
    return required.endsWith('.' + action);
  }

  return false;
}

/**
 * Check if user has permission
 */
export function hasPermission(userPermissions: string[], required: string | string[]): boolean {
  const requiredPermissions = Array.isArray(required) ? required : [required];

  // Super admin has all permissions
  if (userPermissions.includes('*')) return true;

  // Check if user has any of the required permissions
  return requiredPermissions.some((reqPerm) =>
    userPermissions.some((userPerm) => permissionMatches(userPerm, reqPerm))
  );
}

/**
 * Get user permissions from role
 */
export async function getUserPermissions(userId: string, storeId?: string): Promise<string[]> {
  // If no storeId, user might be a super admin
  if (!storeId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.role === 'SUPER_ADMIN') {
      return ['*'];
    }

    return [];
  }

  // Get user's role for this store
  const userStore = await prisma.userStore.findFirst({
    where: {
      userId,
      storeId,
      isActive: true,
    },
    include: {
      role: true,
    },
  });

  if (!userStore || !userStore.role) {
    return [];
  }

  try {
    return JSON.parse(userStore.role.permissions);
  } catch {
    return [];
  }
}

/**
 * Check if user can perform action (with context)
 */
export async function canPerformAction(
  context: RequestContext,
  permission: string | string[]
): Promise<boolean> {
  // Super admin can do everything
  if (context.isSuperAdmin) return true;

  // Get user permissions for the current store
  if (!context.user?.id) return false;

  const permissions = await getUserPermissions(context.user.id, context.storeId);
  return hasPermission(permissions, permission);
}

/**
 * Require permission (throws error if user doesn't have it)
 */
export async function requirePermission(
  context: RequestContext,
  permission: string | string[]
): Promise<void> {
  const hasAccess = await canPerformAction(context, permission);

  if (!hasAccess) {
    const permStr = Array.isArray(permission) ? permission.join(' or ') : permission;
    throw new Error(`Forbidden: Required permission ${permStr}`);
  }
}

/**
 * Check if user owns a resource
 * Useful for customer actions on their own data
 */
export function isResourceOwner(context: RequestContext, resourceUserId: string): boolean {
  return context.user?.id === resourceUserId;
}

/**
 * Require resource ownership or permission
 */
export async function requireOwnershipOrPermission(
  context: RequestContext,
  resourceUserId: string,
  permission: string | string[]
): Promise<void> {
  if (isResourceOwner(context, resourceUserId)) {
    return; // Owner can access
  }

  await requirePermission(context, permission);
}
