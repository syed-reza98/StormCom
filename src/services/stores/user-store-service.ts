import { z } from 'zod';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type { UserStore } from '@prisma/client';

/**
 * UserStore Service
 * 
 * Manages user-store associations (team membership).
 * Handles assignment, removal, role updates, and permission checks.
 * 
 * @module services/stores/user-store-service
 */

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for adding a user to a store
 */
export const AddUserToStoreSchema = z.object({
  userId: z.string().cuid(),
  storeId: z.string().cuid(),
  roleId: z.string().cuid(),
}).strict();

/**
 * Schema for updating user's role in a store
 */
export const UpdateUserStoreRoleSchema = z.object({
  userId: z.string().cuid(),
  storeId: z.string().cuid(),
  roleId: z.string().cuid(),
}).strict();

/**
 * Schema for removing user from store
 */
export const RemoveUserFromStoreSchema = z.object({
  userId: z.string().cuid(),
  storeId: z.string().cuid(),
}).strict();

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AddUserToStoreInput = z.output<typeof AddUserToStoreSchema>;
export type UpdateUserStoreRoleInput = z.output<typeof UpdateUserStoreRoleSchema>;
export type RemoveUserFromStoreInput = z.output<typeof RemoveUserFromStoreSchema>;

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Add a user to a store with a specific role
 * 
 * @param data - User, store, and role IDs
 * @returns Created UserStore association
 * @throws {AppError} If user already assigned or role/store not found
 */
export async function addUserToStore(
  data: AddUserToStoreInput
): Promise<UserStore> {
  // Validate store exists
  const store = await prisma.store.findUnique({
    where: { id: data.storeId, deletedAt: null },
  });

  if (!store) {
    throw new AppError('Store not found', 404, 'STORE_NOT_FOUND');
  }

  // Validate user exists
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Validate role exists
  const role = await prisma.role.findUnique({
    where: { id: data.roleId },
  });

  if (!role) {
    throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
  }

  // Check if user already assigned to store
  const existing = await prisma.userStore.findFirst({
    where: {
      userId: data.userId,
      storeId: data.storeId,
      isActive: true,
    },
  });

  if (existing) {
    throw new AppError(
      'User is already assigned to this store',
      400,
      'USER_ALREADY_ASSIGNED'
    );
  }

  // Create association
  const userStore = await prisma.userStore.create({
    data: {
      userId: data.userId,
      storeId: data.storeId,
      roleId: data.roleId,
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
          permissions: true,
        },
      },
    },
  });

  return userStore;
}

/**
 * Update a user's role in a store
 * 
 * @param data - User, store, and new role IDs
 * @returns Updated UserStore association
 * @throws {AppError} If assignment not found or role invalid
 */
export async function updateUserStoreRole(
  data: UpdateUserStoreRoleInput
): Promise<UserStore> {
  // Validate role exists
  const role = await prisma.role.findUnique({
    where: { id: data.roleId },
  });

  if (!role) {
    throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
  }

  // Find existing assignment
  const userStore = await prisma.userStore.findFirst({
    where: {
      userId: data.userId,
      storeId: data.storeId,
      isActive: true,
    },
  });

  if (!userStore) {
    throw new AppError(
      'User is not assigned to this store',
      404,
      'ASSIGNMENT_NOT_FOUND'
    );
  }

  // Update role
  const updated = await prisma.userStore.update({
    where: { id: userStore.id },
    data: { roleId: data.roleId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
          permissions: true,
        },
      },
    },
  });

  return updated;
}

/**
 * Remove a user from a store (deactivate assignment)
 * 
 * @param data - User and store IDs
 * @throws {AppError} If assignment not found or user is owner
 */
export async function removeUserFromStore(
  data: RemoveUserFromStoreInput
): Promise<void> {
  // Find existing assignment
  const userStore = await prisma.userStore.findFirst({
    where: {
      userId: data.userId,
      storeId: data.storeId,
      isActive: true,
    },
    include: {
      role: true,
    },
  });

  if (!userStore) {
    throw new AppError(
      'User is not assigned to this store',
      404,
      'ASSIGNMENT_NOT_FOUND'
    );
  }

  // Prevent removing owner
  if (userStore.role.name === 'OWNER') {
    throw new AppError(
      'Cannot remove store owner. Transfer ownership first.',
      400,
      'CANNOT_REMOVE_OWNER'
    );
  }

  // Deactivate assignment
  await prisma.userStore.update({
    where: { id: userStore.id },
    data: { isActive: false },
  });
}

/**
 * Get all users assigned to a store
 * 
 * @param storeId - Store ID
 * @returns List of UserStore associations with user and role details
 */
export async function getStoreUsers(storeId: string): Promise<UserStore[]> {
  const userStores = await prisma.userStore.findMany({
    where: {
      storeId,
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          status: true,
          createdAt: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
          permissions: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return userStores;
}

/**
 * Get all stores a user has access to
 * 
 * @param userId - User ID
 * @returns List of UserStore associations with store and role details
 */
export async function getUserStores(userId: string): Promise<UserStore[]> {
  const userStores = await prisma.userStore.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          status: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
          permissions: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return userStores;
}

/**
 * Check if a user has access to a store
 * 
 * @param userId - User ID
 * @param storeId - Store ID
 * @returns UserStore if user has access, null otherwise
 */
export async function checkUserStoreAccess(
  userId: string,
  storeId: string
): Promise<UserStore | null> {
  const userStore = await prisma.userStore.findFirst({
    where: {
      userId,
      storeId,
      isActive: true,
    },
    include: {
      role: {
        select: {
          id: true,
          name: true,
          permissions: true,
        },
      },
    },
  });

  return userStore;
}

/**
 * Transfer store ownership to another user
 * 
 * @param storeId - Store ID
 * @param fromUserId - Current owner user ID
 * @param toUserId - New owner user ID
 * @throws {AppError} If validation fails or users not found
 */
export async function transferOwnership(
  storeId: string,
  fromUserId: string,
  toUserId: string
): Promise<void> {
  // Validate store exists
  const store = await prisma.store.findUnique({
    where: { id: storeId, deletedAt: null },
  });

  if (!store) {
    throw new AppError('Store not found', 404, 'STORE_NOT_FOUND');
  }

  // Get owner role
  const ownerRole = await prisma.role.findUnique({
    where: { name: 'OWNER' },
  });

  if (!ownerRole) {
    throw new AppError('Owner role not found', 500, 'ROLE_NOT_FOUND');
  }

  // Verify current owner
  const currentOwner = await prisma.userStore.findFirst({
    where: {
      userId: fromUserId,
      storeId,
      roleId: ownerRole.id,
      isActive: true,
    },
  });

  if (!currentOwner) {
    throw new AppError(
      'Current user is not the owner of this store',
      403,
      'NOT_OWNER'
    );
  }

  // Verify new owner exists and is assigned to store
  const newOwnerAssignment = await prisma.userStore.findFirst({
    where: {
      userId: toUserId,
      storeId,
      isActive: true,
    },
  });

  if (!newOwnerAssignment) {
    throw new AppError(
      'New owner must be assigned to the store first',
      400,
      'USER_NOT_ASSIGNED'
    );
  }

  // Get admin role for demoted owner
  const adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' },
  });

  if (!adminRole) {
    throw new AppError('Admin role not found', 500, 'ROLE_NOT_FOUND');
  }

  // Transfer ownership in a transaction
  await prisma.$transaction([
    // Demote current owner to admin
    prisma.userStore.update({
      where: { id: currentOwner.id },
      data: { roleId: adminRole.id },
    }),
    // Promote new owner
    prisma.userStore.update({
      where: { id: newOwnerAssignment.id },
      data: { roleId: ownerRole.id },
    }),
  ]);
}
