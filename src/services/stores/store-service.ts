import { z } from 'zod';
import { StoreStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '@/lib/constants';
import type { Store, Prisma } from '@prisma/client';

/**
 * Store Service
 * 
 * Provides CRUD operations for stores with multi-tenant isolation,
 * validation, and business logic enforcement.
 * 
 * @module services/stores/store-service
 */

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Base store settings schema (stored as JSON)
 */
export const StoreSettingsSchema = z.object({
  // Email notifications
  orderNotifications: z.boolean().default(true),
  customerNotifications: z.boolean().default(true),
  
  // Order settings
  autoAcceptOrders: z.boolean().default(false),
  requireEmailVerification: z.boolean().default(false),
  
  // Store policies
  termsOfServiceUrl: z.string().url().optional(),
  privacyPolicyUrl: z.string().url().optional(),
  refundPolicyUrl: z.string().url().optional(),
  
  // Social media
  socialMedia: z.object({
    facebook: z.string().url().optional(),
    twitter: z.string().url().optional(),
    instagram: z.string().url().optional(),
    linkedin: z.string().url().optional(),
  }).optional(),
  
  // Advanced settings
  maintenanceMode: z.boolean().default(false),
  maintenanceMessage: z.string().optional(),
}).strict();

/**
 * Create store input schema
 */
export const CreateStoreSchema = z.object({
  name: z.string()
    .min(2, 'Store name must be at least 2 characters')
    .max(100, 'Store name must not exceed 100 characters')
    .trim(),
  slug: z.string()
    .min(2, 'Store slug must be at least 2 characters')
    .max(100, 'Store slug must not exceed 100 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
    .trim(),
  domain: z.string()
    .regex(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i, 'Invalid domain format')
    .optional()
    .nullable(),
  email: z.string()
    .email('Invalid email address')
    .trim(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164)')
    .optional()
    .nullable(),
  address: z.string()
    .max(500, 'Address must not exceed 500 characters')
    .optional()
    .nullable(),
  taxId: z.string()
    .max(50, 'Tax ID must not exceed 50 characters')
    .optional()
    .nullable(),
  timezone: z.string().default('UTC'),
  currency: z.string().length(3, 'Currency must be ISO 4217 code').default('USD'),
  language: z.string().length(2, 'Language must be ISO 639-1 code').default('en'),
  logoUrl: z.string().url().optional().nullable(),
  faviconUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').default('#000000'),
  settings: StoreSettingsSchema.default({}),
}).strict();

/**
 * Update store input schema (all fields optional, including nested settings)
 */
export const UpdateStoreSchema = z.object({
  name: z.string()
    .min(2, 'Store name must be at least 2 characters')
    .max(100, 'Store name must not exceed 100 characters')
    .trim()
    .optional(),
  slug: z.string()
    .min(2, 'Store slug must be at least 2 characters')
    .max(100, 'Store slug must not exceed 100 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
    .trim()
    .optional(),
  domain: z.string()
    .regex(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i, 'Invalid domain format')
    .optional()
    .nullable(),
  email: z.string()
    .email('Invalid email address')
    .trim()
    .optional(),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164)')
    .optional()
    .nullable(),
  address: z.string()
    .max(500, 'Address must not exceed 500 characters')
    .optional()
    .nullable(),
  taxId: z.string()
    .max(50, 'Tax ID must not exceed 50 characters')
    .optional()
    .nullable(),
  timezone: z.string().optional(),
  currency: z.string().length(3, 'Currency must be ISO 4217 code').optional(),
  language: z.string().length(2, 'Language must be ISO 639-1 code').optional(),
  logoUrl: z.string().url().optional().nullable(),
  faviconUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  settings: StoreSettingsSchema.partial().optional(),
});

/**
 * Query parameters for listing stores
 */
export const ListStoresQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  search: z.string().optional(),
  status: z.nativeEnum(StoreStatus).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).strict();

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Use z.input for input types (before defaults) and explicit types for output
export type CreateStoreInputRaw = z.input<typeof CreateStoreSchema>;
export type UpdateStoreInputRaw = z.input<typeof UpdateStoreSchema>;
export type ListStoresQueryRaw = z.input<typeof ListStoresQuerySchema>;

// Explicit output types with defaults applied (for service functions)
export type CreateStoreInput = Omit<CreateStoreInputRaw, 'timezone' | 'currency' | 'language' | 'primaryColor' | 'settings'> & {
  timezone: string;
  currency: string;
  language: string;
  primaryColor: string;
  settings: {
    orderNotifications: boolean;
    customerNotifications: boolean;
    autoAcceptOrders: boolean;
    requireEmailVerification: boolean;
    maintenanceMode: boolean;
    termsOfServiceUrl?: string;
    privacyPolicyUrl?: string;
    refundPolicyUrl?: string;
    socialMedia?: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      linkedin?: string;
    };
    maintenanceMessage?: string;
  };
};

export type UpdateStoreInput = Partial<CreateStoreInput>;

export type ListStoresQuery = {
  page: number;
  perPage: number;
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  search?: string;
  status?: StoreStatus;
};

export type StoreSettings = CreateStoreInput['settings'];

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Create a new store
 * 
 * @param data - Store creation data
 * @param userId - ID of user creating the store (becomes owner)
 * @returns Created store
 * @throws {ApiError} If slug/domain already exists
 */
export async function createStore(
  data: CreateStoreInput,
  userId: string
): Promise<Store> {
  // Validate uniqueness
  const existingStore = await prisma.store.findFirst({
    where: {
      OR: [
        { slug: data.slug },
        ...(data.domain ? [{ domain: data.domain }] : []),
      ],
      deletedAt: null,
    },
  });

  if (existingStore) {
    if (existingStore.slug === data.slug) {
      throw new AppError('A store with this slug already exists', 400, 'SLUG_EXISTS');
    }
    if (data.domain && existingStore.domain === data.domain) {
      throw new AppError('A store with this domain already exists', 400, 'DOMAIN_EXISTS');
    }
  }

  // Get OWNER role ID
  const ownerRole = await prisma.role.findUnique({
    where: { slug: 'OWNER' },
  });

  if (!ownerRole) {
    throw new AppError('OWNER role not found. Run seed script first.', 500, 'ROLE_NOT_FOUND');
  }

  // Create store with owner assignment
  const store = await prisma.store.create({
    data: {
      ...data,
      status: StoreStatus.TRIAL,
      users: {
        create: {
          userId,
          roleId: ownerRole.id,
        },
      },
    },
    include: {
      users: {
        where: { userId },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return store;
}

/**
 * Get a store by ID
 * 
 * @param storeId - Store ID
 * @returns Store or null if not found
 */
export async function getStore(storeId: string): Promise<Store | null> {
  return prisma.store.findUnique({
    where: { id: storeId, deletedAt: null },
    include: {
      subscription: true,
      users: {
        where: { isActive: true },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

/**
 * Get a store by slug
 * 
 * @param slug - Store slug
 * @returns Store or null if not found
 */
export async function getStoreBySlug(slug: string): Promise<Store | null> {
  return prisma.store.findUnique({
    where: { slug, deletedAt: null },
  });
}

/**
 * List stores with pagination and filtering
 * 
 * Super admins see all stores. Regular users see only their stores.
 * 
 * @param query - Query parameters
 * @param options - Additional options (userId for filtering, isSuperAdmin flag)
 * @returns Paginated store list
 */
export async function listStores(
  query: ListStoresQuery,
  options?: { userId?: string; isSuperAdmin?: boolean }
): Promise<{ stores: Store[]; total: number; page: number; perPage: number; totalPages: number }> {
  const { page, perPage, search, status, sortBy, sortOrder } = query;
  const { userId, isSuperAdmin = false } = options || {};

  // Build where clause
  const where: Prisma.StoreWhereInput = {
    deletedAt: null,
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { slug: { contains: search } },
        { email: { contains: search } },
        ...(search.match(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i)
          ? [{ domain: { equals: search } }]
          : []),
      ],
    }),
    // Filter by user's stores (unless super admin)
    ...(!isSuperAdmin && userId && {
      users: {
        some: {
          userId,
          isActive: true,
        },
      },
    }),
  };

  // Execute queries in parallel
  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { [sortBy]: sortOrder },
      include: {
        subscription: { select: { status: true, plan: { select: { slug: true } } } },
        users: {
          where: { isActive: true },
          select: { role: true, user: { select: { name: true, email: true } } },
          take: 5, // Limit to prevent over-fetching
        },
      },
    }),
    prisma.store.count({ where }),
  ]);

  return {
    stores,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

/**
 * Update a store
 * 
 * @param storeId - Store ID
 * @param data - Update data
 * @returns Updated store
 * @throws {ApiError} If store not found or slug/domain conflict
 */
export async function updateStore(
  storeId: string,
  data: UpdateStoreInput
): Promise<Store> {
  // Check store exists
  const existingStore = await prisma.store.findUnique({
    where: { id: storeId, deletedAt: null },
  });

  if (!existingStore) {
    throw new AppError('Store not found', 404, 'STORE_NOT_FOUND');
  }

  // Check uniqueness if slug or domain is being updated
  if (data.slug || data.domain) {
    const conflictingStore = await prisma.store.findFirst({
      where: {
        id: { not: storeId },
        OR: [
          ...(data.slug ? [{ slug: data.slug }] : []),
          ...(data.domain ? [{ domain: data.domain }] : []),
        ],
        deletedAt: null,
      },
    });

    if (conflictingStore) {
      if (data.slug && conflictingStore.slug === data.slug) {
        throw new AppError('A store with this slug already exists', 400, 'SLUG_EXISTS');
      }
      if (data.domain && conflictingStore.domain === data.domain) {
        throw new AppError('A store with this domain already exists', 400, 'DOMAIN_EXISTS');
      }
    }
  }

  // Merge settings if provided
  const updateData = {
    ...data,
    ...(data.settings && {
      settings: {
        ...(existingStore.settings as object),
        ...data.settings,
      },
    }),
  };

  return prisma.store.update({
    where: { id: storeId },
    data: updateData,
    include: {
      subscription: true,
      users: {
        where: { isActive: true },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

/**
 * Delete a store (soft delete)
 * 
 * @param storeId - Store ID
 * @returns Deleted store
 * @throws {ApiError} If store not found
 */
export async function deleteStore(storeId: string): Promise<Store> {
  const store = await prisma.store.findUnique({
    where: { id: storeId, deletedAt: null },
  });

  if (!store) {
    throw new AppError('Store not found', 404, 'STORE_NOT_FOUND');
  }

  // Soft delete (set deletedAt timestamp)
  return prisma.store.update({
    where: { id: storeId },
    data: { deletedAt: new Date() },
  });
}

/**
 * Check if user has access to store
 * 
 * Super admins have access to all stores. Regular users must be assigned.
 * 
 * @param storeId - Store ID
 * @param userId - User ID
 * @param isSuperAdmin - Whether user is super admin
 * @returns True if user has access
 */
export async function checkStoreAccess(
  storeId: string,
  userId: string,
  isSuperAdmin: boolean = false
): Promise<boolean> {
  if (isSuperAdmin) {
    return true;
  }

  const userStore = await prisma.userStore.findFirst({
    where: {
      storeId,
      userId,
      isActive: true,
    },
  });

  return userStore !== null;
}

/**
 * Get store statistics
 * 
 * @param storeId - Store ID
 * @returns Store statistics
 */
export async function getStoreStats(storeId: string): Promise<{
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
}> {
  const [totalProducts, totalOrders, totalCustomers, revenueData] = await Promise.all([
    prisma.product.count({ where: { storeId, deletedAt: null } }),
    prisma.order.count({ where: { storeId, deletedAt: null } }),
    prisma.customer.count({ where: { storeId, deletedAt: null } }),
    prisma.order.aggregate({
      where: { storeId, status: { in: ['DELIVERED'] }, deletedAt: null },
      _sum: { total: true },
    }),
  ]);

  return {
    totalProducts,
    totalOrders,
    totalCustomers,
    totalRevenue: revenueData._sum?.total?.toNumber() || 0,
  };
}
