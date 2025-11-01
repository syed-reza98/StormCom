import { Store, User, UserRole, SubscriptionPlan, SubscriptionStatus, PrismaClient } from '@prisma/client';
import { db as prisma } from '@/lib/db';
import { z } from 'zod';

// Use the shared Prisma Client singleton

/**
 * StoreService
 * 
 * Task: T081 [US1] Create StoreService with create, list, get, update, delete (soft delete), and assign admin operations
 * 
 * Purpose: Comprehensive service for managing stores in the multi-tenant e-commerce platform.
 * Handles store lifecycle operations, admin assignment, and tenant isolation.
 * 
 * Features:
 * - Store CRUD operations with soft delete
 * - Subdomain validation and uniqueness
 * - Store admin assignment and management
 * - Multi-tenant data isolation
 * - Subscription plan management
 * - Input validation with Zod schemas
 * - Comprehensive error handling
 * 
 * Security:
 * - Role-based access control (RBAC)
 * - Store admin assignment validation
 * - Soft delete to preserve data integrity
 * - Input sanitization and validation
 */

// Validation schemas
export const CreateStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(100, 'Store name too long'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .refine(slug => !slug.startsWith('-') && !slug.endsWith('-'), 'Slug cannot start or end with hyphen'),
  description: z.string().max(500, 'Description too long').optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional(),
  subscriptionPlan: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).default('FREE'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default('US'),
  currency: z.string().default('USD'),
  timezone: z.string().default('UTC'),
  locale: z.string().default('en'),
  ownerId: z.string().uuid('Invalid owner ID'), // User ID to assign as store admin
});

export const UpdateStoreSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  logo: z.string().url('Invalid logo URL').optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  subscriptionPlan: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).optional(),
  subscriptionStatus: z.enum(['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'PAUSED']).optional(),
});

export const ListStoresSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  subscriptionPlan: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).optional(),
  subscriptionStatus: z.enum(['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'PAUSED']).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const AssignAdminSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['STORE_ADMIN', 'STAFF']).default('STORE_ADMIN'),
});

// Types
export type CreateStoreInput = z.infer<typeof CreateStoreSchema>;
export type UpdateStoreInput = z.infer<typeof UpdateStoreSchema>;
export type ListStoresInput = z.infer<typeof ListStoresSchema>;
export type AssignAdminInput = z.infer<typeof AssignAdminSchema>;

export interface StoreWithCounts extends Store {
  _count: {
    products: number;
    orders: number;
    customers: number;
    admins: number;
  };
}

export interface ListStoresResult {
  stores: StoreWithCounts[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Custom errors
export class StoreServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'StoreServiceError';
  }
}

export class StoreNotFoundError extends StoreServiceError {
  constructor(storeId: string) {
    super(`Store with ID ${storeId} not found`, 'STORE_NOT_FOUND', 404);
  }
}

export class SlugAlreadyExistsError extends StoreServiceError {
  constructor(slug: string) {
    super(`Store with slug '${slug}' already exists`, 'SLUG_ALREADY_EXISTS', 409);
  }
}

export class UnauthorizedStoreAccessError extends StoreServiceError {
  constructor(storeId: string) {
    super(`Unauthorized access to store ${storeId}`, 'UNAUTHORIZED_STORE_ACCESS', 403);
  }
}

export class InvalidStoreOwnerError extends StoreServiceError {
  constructor(userId: string) {
    super(`User ${userId} cannot be assigned as store owner`, 'INVALID_STORE_OWNER', 400);
  }
}

/**
 * StoreService Class
 * Provides comprehensive store management operations
 */
export class StoreService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Create a new store with initial admin assignment
   */
  async create(input: CreateStoreInput, createdBy: string): Promise<Store> {
    // Validate input
    const validatedInput = CreateStoreSchema.parse(input);

    // Check if slug already exists
    const existingStore = await this.prisma.store.findUnique({
      where: { slug: validatedInput.slug },
    });

    if (existingStore) {
      throw new SlugAlreadyExistsError(validatedInput.slug);
    }

    // Validate owner exists and can be assigned
    const owner = await this.prisma.user.findUnique({
      where: { id: validatedInput.ownerId },
    });

    if (!owner) {
      throw new InvalidStoreOwnerError(validatedInput.ownerId);
    }

    if (owner.role === 'CUSTOMER') {
      throw new InvalidStoreOwnerError(
        `User ${validatedInput.ownerId} has CUSTOMER role and cannot be assigned as store admin`
      );
    }

    // Calculate subscription limits and trial period
    const subscriptionLimits = this.getSubscriptionLimits(validatedInput.subscriptionPlan);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

    try {
      // Create store and assign admin in transaction
      const store = await this.prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
        // Create the store
        const newStore = await tx.store.create({
          data: {
            name: validatedInput.name,
            slug: validatedInput.slug,
            description: validatedInput.description,
            email: validatedInput.email,
            phone: validatedInput.phone,
            website: validatedInput.website,
            subscriptionPlan: validatedInput.subscriptionPlan as SubscriptionPlan,
            subscriptionStatus: 'TRIAL' as SubscriptionStatus,
            trialEndsAt,
            productLimit: subscriptionLimits.productLimit,
            orderLimit: subscriptionLimits.orderLimit,
            address: validatedInput.address,
            city: validatedInput.city,
            state: validatedInput.state,
            postalCode: validatedInput.postalCode,
            country: validatedInput.country,
            currency: validatedInput.currency,
            timezone: validatedInput.timezone,
            locale: validatedInput.locale,
          },
        });

        // Assign owner as store admin
        await tx.user.update({
          where: { id: validatedInput.ownerId },
          data: {
            storeId: newStore.id,
            role: 'STORE_ADMIN' as UserRole,
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            action: 'STORE_CREATED',
            entityType: 'Store',
            entityId: newStore.id,
            storeId: newStore.id,
            userId: createdBy,
            changes: JSON.stringify({
              storeName: newStore.name,
              slug: newStore.slug,
              ownerId: validatedInput.ownerId,
              subscriptionPlan: newStore.subscriptionPlan,
            }),
          },
        });

        return newStore;
      });

      return store;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new SlugAlreadyExistsError(validatedInput.slug);
      }
      throw error;
    }
  }

  /**
   * List stores with pagination and filtering
   * Access control: SUPER_ADMIN sees all, STORE_ADMIN sees assigned stores
   */
  async list(
    input: ListStoresInput,
    __requestingUserId: string,
    requestingUserRole: UserRole,
    requestingUserStoreId?: string
  ): Promise<ListStoresResult> {
    const validatedInput = ListStoresSchema.parse(input);

    // Build where clause based on user role
    let whereClause: any = {
      deletedAt: null, // Only active stores
    };

    // Apply role-based filtering
    if (requestingUserRole === 'STORE_ADMIN' || requestingUserRole === 'STAFF') {
      if (!requestingUserStoreId) {
        throw new UnauthorizedStoreAccessError('No store assigned');
      }
      whereClause.id = requestingUserStoreId; // Only their own store
    }
    // SUPER_ADMIN can see all stores (no additional filtering)

    // Apply search filter
    if (validatedInput.search) {
      whereClause.OR = [
        { name: { contains: validatedInput.search } },
        { slug: { contains: validatedInput.search } },
        { email: { contains: validatedInput.search } },
      ];
    }

    // Apply subscription filters
    if (validatedInput.subscriptionPlan) {
      whereClause.subscriptionPlan = validatedInput.subscriptionPlan;
    }

    if (validatedInput.subscriptionStatus) {
      whereClause.subscriptionStatus = validatedInput.subscriptionStatus;
    }

    // Calculate pagination
    const offset = (validatedInput.page - 1) * validatedInput.limit;

    // Build order clause
    const orderBy: any = {};
    orderBy[validatedInput.sortBy] = validatedInput.sortOrder;

    try {
      // Get total count and stores in parallel
      const [total, stores] = await Promise.all([
        this.prisma.store.count({ where: whereClause }),
        this.prisma.store.findMany({
          where: whereClause,
          orderBy,
          skip: offset,
          take: validatedInput.limit,
          include: {
            _count: {
              select: {
                products: true,
                orders: true,
                customers: true,
                admins: true,
              },
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(total / validatedInput.limit);

      return {
        stores: stores as StoreWithCounts[],
        pagination: {
          page: validatedInput.page,
          limit: validatedInput.limit,
          total,
          totalPages,
          hasNext: validatedInput.page < totalPages,
          hasPrev: validatedInput.page > 1,
        },
      };
    } catch (error) {
      throw new StoreServiceError(
        'Failed to list stores',
        'LIST_STORES_FAILED',
        500
      );
    }
  }

  /**
   * Get store by ID with access control
   */
  async get(
    storeId: string,
    __requestingUserId: string,
    requestingUserRole: UserRole,
    requestingUserStoreId?: string
  ): Promise<StoreWithCounts> {
    // Validate store ID format
    if (!storeId || !storeId.match(/^[0-9a-f-]{36}$/i)) {
      throw new StoreServiceError('Invalid store ID format', 'INVALID_STORE_ID', 400);
    }

    // Check access permissions
    if (requestingUserRole !== 'SUPER_ADMIN') {
      if (requestingUserStoreId !== storeId) {
        throw new UnauthorizedStoreAccessError(storeId);
      }
    }

    const store = await this.prisma.store.findFirst({
      where: {
        id: storeId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            products: true,
            orders: true,
            customers: true,
            admins: true,
          },
        },
        admins: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          where: {
            deletedAt: null,
          },
        },
      },
    });

    if (!store) {
      throw new StoreNotFoundError(storeId);
    }

    return store as StoreWithCounts;
  }

  /**
   * Update store settings
   */
  async update(
    storeId: string,
    input: UpdateStoreInput,
    __requestingUserId: string,
    requestingUserRole: UserRole,
    requestingUserStoreId?: string
  ): Promise<Store> {
    // Validate input
    const validatedInput = UpdateStoreSchema.parse(input);

    // Check access permissions
    if (requestingUserRole !== 'SUPER_ADMIN') {
      if (requestingUserStoreId !== storeId) {
        throw new UnauthorizedStoreAccessError(storeId);
      }
    }

    // Verify store exists and is not deleted
    const existingStore = await this.prisma.store.findFirst({
      where: {
        id: storeId,
        deletedAt: null,
      },
    });

    if (!existingStore) {
      throw new StoreNotFoundError(storeId);
    }

    try {
      const updatedStore = await this.prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
        // Update store
        const store = await tx.store.update({
          where: { id: storeId },
          data: {
            ...validatedInput,
            // Update subscription limits if plan changed
            ...(validatedInput.subscriptionPlan && {
              ...this.getSubscriptionLimits(validatedInput.subscriptionPlan),
            }),
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            action: 'STORE_UPDATED',
            entityType: 'Store',
            entityId: storeId,
            storeId,
            userId: __requestingUserId,
            changes: JSON.stringify({
              changes: validatedInput,
              previousName: existingStore.name,
            }),
          },
        });

        return store;
      });

      return updatedStore;
    } catch (error) {
      throw new StoreServiceError(
        'Failed to update store',
        'UPDATE_STORE_FAILED',
        500
      );
    }
  }

  /**
   * Soft delete store and all associated data
   */
  async delete(
    storeId: string,
    __requestingUserId: string,
    requestingUserRole: UserRole
  ): Promise<boolean> {
    // Only SUPER_ADMIN can delete stores
    if (requestingUserRole !== 'SUPER_ADMIN') {
      throw new StoreServiceError(
        'Only Super Admins can delete stores',
        'INSUFFICIENT_PERMISSIONS',
        403
      );
    }

    // Verify store exists and is not already deleted
    const store = await this.prisma.store.findFirst({
      where: {
        id: storeId,
        deletedAt: null,
      },
    });

    if (!store) {
      throw new StoreNotFoundError(storeId);
    }

    try {
      await this.prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
        const deletedAt = new Date();

        // Soft delete the store
        await tx.store.update({
          where: { id: storeId },
          data: { deletedAt },
        });

        // Soft delete all associated users (except SUPER_ADMIN)
        await tx.user.updateMany({
          where: {
            storeId,
            role: { not: 'SUPER_ADMIN' },
            deletedAt: null,
          },
          data: { deletedAt },
        });

        // Note: Other associated data (products, orders, etc.) will be handled
        // by cascade rules or separate cleanup processes to maintain data integrity

        // Create audit log
        await tx.auditLog.create({
          data: {
            action: 'STORE_DELETED',
            entityType: 'Store',
            entityId: storeId,
            storeId,
            userId: __requestingUserId,
            changes: JSON.stringify({
              storeName: store.name,
              slug: store.slug,
              deletedAt,
            }),
          },
        });
      });

      return true;
    } catch (error) {
      throw new StoreServiceError(
        'Failed to delete store',
        'DELETE_STORE_FAILED',
        500
      );
    }
  }

  /**
   * Assign user as store admin
   */
  async assignAdmin(
    storeId: string,
    input: AssignAdminInput,
    __requestingUserId: string,
    requestingUserRole: UserRole,
    requestingUserStoreId?: string
  ): Promise<User> {
    // Validate input
    const validatedInput = AssignAdminSchema.parse(input);

    // Check permissions - only SUPER_ADMIN or store's existing STORE_ADMIN can assign admins
    if (requestingUserRole !== 'SUPER_ADMIN') {
      if (requestingUserRole !== 'STORE_ADMIN' || requestingUserStoreId !== storeId) {
        throw new UnauthorizedStoreAccessError(storeId);
      }
    }

    // Verify store exists
    const store = await this.prisma.store.findFirst({
      where: {
        id: storeId,
        deletedAt: null,
      },
    });

    if (!store) {
      throw new StoreNotFoundError(storeId);
    }

    // Verify user exists and can be assigned
    const user = await this.prisma.user.findFirst({
      where: {
        id: validatedInput.userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new InvalidStoreOwnerError(validatedInput.userId);
    }

    if (user.role === 'CUSTOMER') {
      throw new InvalidStoreOwnerError(
        `User ${validatedInput.userId} has CUSTOMER role and cannot be assigned as store admin`
      );
    }

    try {
      const updatedUser = await this.prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
        // Assign user to store
        const updated = await tx.user.update({
          where: { id: validatedInput.userId },
          data: {
            storeId,
            role: validatedInput.role as UserRole,
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            action: 'STORE_ADMIN_ASSIGNED',
            entityType: 'User',
            entityId: validatedInput.userId,
            storeId,
            userId: __requestingUserId,
            changes: JSON.stringify({
              assignedUserId: validatedInput.userId,
              assignedRole: validatedInput.role,
              storeName: store.name,
            }),
          },
        });

        return updated;
      });

      return updatedUser;
    } catch (error) {
      throw new StoreServiceError(
        'Failed to assign store admin',
        'ASSIGN_ADMIN_FAILED',
        500
      );
    }
  }

  /**
   * Remove user from store admin role
   */
  async removeAdmin(
    storeId: string,
    userId: string,
    __requestingUserId: string,
    requestingUserRole: UserRole,
    requestingUserStoreId?: string
  ): Promise<boolean> {
    // Check permissions
    if (requestingUserRole !== 'SUPER_ADMIN') {
      if (requestingUserRole !== 'STORE_ADMIN' || requestingUserStoreId !== storeId) {
        throw new UnauthorizedStoreAccessError(storeId);
      }
    }

    // Cannot remove yourself as admin
    // TODO: Fix self-removal check
    /*if (userId === _requestingUserId) {
      throw new StoreServiceError(
        'Cannot remove yourself as store admin',
        'CANNOT_REMOVE_SELF',
        400
      );
    }*/

    // Verify user is actually assigned to this store
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        storeId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new StoreServiceError(
        `User ${userId} is not assigned to store ${storeId}`,
        'USER_NOT_ASSIGNED',
        404
      );
    }

    try {
      await this.prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
        // Remove user from store (set storeId to null, role to CUSTOMER)
        await tx.user.update({
          where: { id: userId },
          data: {
            storeId: null,
            role: 'CUSTOMER' as UserRole,
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            action: 'STORE_ADMIN_REMOVED',
            entityType: 'User',
            entityId: userId,
            storeId,
            userId: __requestingUserId,
            changes: JSON.stringify({
              removedUserId: userId,
              previousRole: user.role,
            }),
          },
        });
      });

      return true;
    } catch (error) {
      throw new StoreServiceError(
        'Failed to remove store admin',
        'REMOVE_ADMIN_FAILED',
        500
      );
    }
  }

  /**
   * Get subscription limits based on plan
   */
  private getSubscriptionLimits(plan: string): { productLimit: number; orderLimit: number } {
    switch (plan) {
      case 'FREE':
        return { productLimit: 10, orderLimit: 100 };
      case 'BASIC':
        return { productLimit: 100, orderLimit: 1000 };
      case 'PRO':
        return { productLimit: 1000, orderLimit: 10000 };
      case 'ENTERPRISE':
        return { productLimit: 999999, orderLimit: 999999 }; // Effectively unlimited
      default:
        return { productLimit: 10, orderLimit: 100 };
    }
  }

  /**
   * Check if store has reached product limit
   */
  async checkProductLimit(storeId: string): Promise<{ hasReachedLimit: boolean; current: number; limit: number }> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        _count: {
          select: {
            products: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    if (!store) {
      throw new StoreNotFoundError(storeId);
    }

    return {
      hasReachedLimit: store._count.products >= store.productLimit,
      current: store._count.products,
      limit: store.productLimit,
    };
  }

  /**
   * Check if store has reached order limit for current month
   */
  async checkOrderLimit(storeId: string): Promise<{ hasReachedLimit: boolean; current: number; limit: number }> {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new StoreNotFoundError(storeId);
    }

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const currentMonthOrders = await this.prisma.order.count({
      where: {
        storeId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    return {
      hasReachedLimit: currentMonthOrders >= store.orderLimit,
      current: currentMonthOrders,
      limit: store.orderLimit,
    };
  }

  /**
   * Get store by slug (public method for storefront access)
   */
  async getBySlug(slug: string): Promise<Store | null> {
    if (!slug) {
      return null;
    }

    return this.prisma.store.findFirst({
      where: {
        slug,
        deletedAt: null,
        subscriptionStatus: { in: ['TRIAL', 'ACTIVE'] }, // Only active stores
      },
    });
  }

  /**
   * Validate subdomain availability
   */
  async validateSlug(slug: string, excludeStoreId?: string): Promise<boolean> {
    const whereClause: any = {
      slug,
      deletedAt: null,
    };

    if (excludeStoreId) {
      whereClause.id = { not: excludeStoreId };
    }

    const existingStore = await this.prisma.store.findFirst({
      where: whereClause,
    });

    return !existingStore;
  }
}

// Export singleton instance
export const storeService = new StoreService();