/**
 * UserStore Service
 * 
 * Handles linking users to stores and admin assignment.
 * 
 * @module services/stores/user-store-service
 */

import { prisma } from '@/lib/prisma';
import type { UserStore } from '@prisma/client';

export interface AssignUserToStoreInput {
  userId: string;
  storeId: string;
  roleId: string;
  isPrimary?: boolean;
}

/**
 * Assign a user to a store with a specific role
 * Creates UserStore link
 */
export async function assignUserToStore(
  data: AssignUserToStoreInput
): Promise<UserStore> {
  // Check if user and store exist
  const [user, store, role] = await Promise.all([
    prisma.user.findUnique({ where: { id: data.userId } }),
    prisma.store.findFirst({ where: { id: data.storeId, deletedAt: null } }),
    prisma.role.findUnique({ where: { id: data.roleId } }),
  ]);

  if (!user) throw new Error('User not found');
  if (!store) throw new Error('Store not found');
  if (!role) throw new Error('Role not found');

  // Check if assignment already exists
  const existing = await prisma.userStore.findFirst({
    where: {
      userId: data.userId,
      storeId: data.storeId,
    },
  });

  if (existing) {
    throw new Error('User is already assigned to this store');
  }

  // If this is the primary store, unset others
  if (data.isPrimary) {
    await prisma.userStore.updateMany({
      where: {
        userId: data.userId,
        isPrimary: true,
      },
      data: { isPrimary: false },
    });
  }

  // Create UserStore link
  const userStore = await prisma.userStore.create({
    data: {
      userId: data.userId,
      storeId: data.storeId,
      roleId: data.roleId,
      isPrimary: data.isPrimary || false,
    },
  });

  return userStore;
}

/**
 * Remove user from store
 */
export async function removeUserFromStore(
  userId: string,
  storeId: string
): Promise<void> {
  await prisma.userStore.deleteMany({
    where: {
      userId,
      storeId,
    },
  });
}

/**
 * Get all stores for a user
 */
export async function getUserStores(userId: string) {
  const userStores = await prisma.userStore.findMany({
    where: { userId },
    include: {
      store: {
        include: {
          subscriptionPlan: true,
        },
      },
      role: true,
    },
    orderBy: [
      { isPrimary: 'desc' },
      { createdAt: 'asc' },
    ],
  });

  return userStores;
}

/**
 * Get all users for a store
 */
export async function getStoreUsers(storeId: string) {
  const userStores = await prisma.userStore.findMany({
    where: { storeId },
    include: {
      user: true,
      role: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return userStores;
}

/**
 * Update user's role in a store
 */
export async function updateUserStoreRole(
  userId: string,
  storeId: string,
  roleId: string
): Promise<UserStore> {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new Error('Role not found');

  const userStore = await prisma.userStore.updateMany({
    where: { userId, storeId },
    data: { roleId },
  });

  if (userStore.count === 0) {
    throw new Error('User-Store assignment not found');
  }

  // Fetch and return the updated record
  const updated = await prisma.userStore.findFirst({
    where: { userId, storeId },
  });

  return updated!;
}

/**
 * Set primary store for user
 */
export async function setPrimaryStore(
  userId: string,
  storeId: string
): Promise<void> {
  // First, unset all primary stores for this user
  await prisma.userStore.updateMany({
    where: { userId, isPrimary: true },
    data: { isPrimary: false },
  });

  // Then set the new primary
  await prisma.userStore.updateMany({
    where: { userId, storeId },
    data: { isPrimary: true },
  });
}
