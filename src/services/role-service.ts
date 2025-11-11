// src/services/role-service.ts
// Role-Based Access Control Service: Permission Checking, Role Hierarchy
// Implements FR-049, FR-050 from spec.md

import { db } from '@/lib/db';

// SessionData type for compatibility (maps to NextAuth Session.user)
export type SessionData = {
  userId: string;
  role: string;
  storeId?: string | null;
  mfaVerified?: boolean;
};

/**
 * Role hierarchy (higher number = more permissions)
 * - SuperAdmin: Full system access across all stores
 * - StoreAdmin: Full access to single store
 * - Staff: Limited store access (no settings/users)
 * - Customer: Public storefront only
 */
export enum Role {
  Customer = 1,
  Staff = 2,
  StoreAdmin = 3,
  SuperAdmin = 4,
}

/**
 * Resource types in the system
 */
export enum Resource {
  Store = 'Store',
  Product = 'Product',
  Category = 'Category',
  Brand = 'Brand',
  Order = 'Order',
  Customer = 'Customer',
  Inventory = 'Inventory',
  Campaign = 'Campaign',
  Content = 'Content',
  Report = 'Report',
  Settings = 'Settings',
  User = 'User',
  Payment = 'Payment',
  Shipping = 'Shipping',
  Tax = 'Tax',
  Webhook = 'Webhook',
}

/**
 * Permission actions
 */
export enum Permission {
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Manage = 'manage', // Full CRUD + special actions
}

/**
 * Permission matrix (Role -> Resource -> Permissions)
 */
const PERMISSION_MATRIX: Record<string, Record<string, Permission[]>> = {
  // Customer: Public storefront only
  Customer: {
    [Resource.Product]: [Permission.Read],
    [Resource.Category]: [Permission.Read],
    [Resource.Brand]: [Permission.Read],
    [Resource.Order]: [Permission.Read], // Own orders only
  },

  // Staff: Products, orders, customers, inventory (no settings/users)
  Staff: {
    [Resource.Product]: [Permission.Create, Permission.Read, Permission.Update],
    [Resource.Category]: [Permission.Read],
    [Resource.Brand]: [Permission.Read],
    [Resource.Order]: [Permission.Read, Permission.Update],
    [Resource.Customer]: [Permission.Read, Permission.Update],
    [Resource.Inventory]: [Permission.Read, Permission.Update],
    [Resource.Content]: [Permission.Create, Permission.Read, Permission.Update],
  },

  // StoreAdmin: Full access to single store
  StoreAdmin: {
    [Resource.Store]: [Permission.Read, Permission.Update],
    [Resource.Product]: [Permission.Manage],
    [Resource.Category]: [Permission.Manage],
    [Resource.Brand]: [Permission.Manage],
    [Resource.Order]: [Permission.Manage],
    [Resource.Customer]: [Permission.Manage],
    [Resource.Inventory]: [Permission.Manage],
    [Resource.Campaign]: [Permission.Manage],
    [Resource.Content]: [Permission.Manage],
    [Resource.Report]: [Permission.Read],
    [Resource.Settings]: [Permission.Manage],
    [Resource.User]: [Permission.Manage], // Store users only
    [Resource.Payment]: [Permission.Manage],
    [Resource.Shipping]: [Permission.Manage],
    [Resource.Tax]: [Permission.Manage],
    [Resource.Webhook]: [Permission.Manage],
  },

  // SuperAdmin: Full system access
  SuperAdmin: {
    [Resource.Store]: [Permission.Manage],
    [Resource.Product]: [Permission.Manage],
    [Resource.Category]: [Permission.Manage],
    [Resource.Brand]: [Permission.Manage],
    [Resource.Order]: [Permission.Manage],
    [Resource.Customer]: [Permission.Manage],
    [Resource.Inventory]: [Permission.Manage],
    [Resource.Campaign]: [Permission.Manage],
    [Resource.Content]: [Permission.Manage],
    [Resource.Report]: [Permission.Manage],
    [Resource.Settings]: [Permission.Manage],
    [Resource.User]: [Permission.Manage], // All users
    [Resource.Payment]: [Permission.Manage],
    [Resource.Shipping]: [Permission.Manage],
    [Resource.Tax]: [Permission.Manage],
    [Resource.Webhook]: [Permission.Manage],
  },
};

/**
 * Check if user has permission to perform action on resource
 * Implements FR-049 (Permission Check)
 */
export function hasPermission(
  role: string,
  resource: Resource,
  permission: Permission
): boolean {
  const rolePermissions = PERMISSION_MATRIX[role]?.[resource];

  if (!rolePermissions) {
    return false;
  }

  // Permission.Manage includes all CRUD permissions
  if (rolePermissions.includes(Permission.Manage)) {
    return true;
  }

  return rolePermissions.includes(permission);
}

/**
 * Check if user role is higher than or equal to required role
 * Implements FR-050 (Role Hierarchy)
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  const userRoleLevel = Role[userRole as keyof typeof Role] || 0;
  const requiredRoleLevel = Role[requiredRole as keyof typeof Role] || 0;

  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Verify user has permission for resource in specific store
 * Implements FR-049 (Tenant-scoped Permission Check)
 */
export async function checkResourcePermission(
  session: SessionData,
  resource: Resource,
  permission: Permission,
  resourceStoreId?: string
): Promise<boolean> {
  // SuperAdmin has access to all stores
  if (session.role === 'SuperAdmin') {
    return hasPermission(session.role, resource, permission);
  }

  // For other roles, check permission AND tenant scope
  if (!hasPermission(session.role, resource, permission)) {
    return false;
  }

  // If resource has storeId, verify it matches user's storeId
  if (resourceStoreId && resourceStoreId !== session.storeId) {
    return false;
  }

  return true;
}

/**
 * Require permission (throws error if not allowed)
 */
export async function requirePermission(
  session: SessionData,
  resource: Resource,
  permission: Permission,
  resourceStoreId?: string
): Promise<void> {
  const allowed = await checkResourcePermission(session, resource, permission, resourceStoreId);

  if (!allowed) {
    throw new Error('PERMISSION_DENIED');
  }
}

/**
 * Require role (throws error if user doesn't have role)
 */
export function requireRole(session: SessionData, requiredRole: string): void {
  if (!hasRole(session.role, requiredRole)) {
    throw new Error('INSUFFICIENT_ROLE');
  }
}

/**
 * Get all permissions for user role
 */
export function getRolePermissions(role: string): Record<string, Permission[]> {
  return PERMISSION_MATRIX[role] || {};
}

/**
 * Check if user can access store
 */
export async function canAccessStore(session: SessionData, storeId: string): Promise<boolean> {
  // SuperAdmin can access all stores
  if (session.role === 'SuperAdmin') {
    return true;
  }

  // Other roles can only access their assigned store
  return session.storeId === storeId;
}

/**
 * Get user's accessible stores
 */
export async function getAccessibleStores(userId: string): Promise<string[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, storeId: true },
  });

  if (!user) {
    return [];
  }

  // SuperAdmin can access all stores
  if (user.role === 'SUPER_ADMIN') {
    const stores = await db.store.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });
    return stores.map((store) => store.id);
  }

  // Other roles can only access their assigned store
  return user.storeId ? [user.storeId] : [];
}

/**
 * Verify user is assigned to a store (except SuperAdmin)
 */
export function requireStoreAssignment(session: SessionData): void {
  if (session.role !== 'SUPER_ADMIN' && !session.storeId) {
    throw new Error('NO_STORE_ASSIGNED');
  }
}
