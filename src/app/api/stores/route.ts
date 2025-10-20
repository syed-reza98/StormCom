import { createApiHandler } from '@/lib/api-wrapper';
import * as storeService from '@/services/stores/store-service';
import { PERMISSIONS } from '@/lib/constants';

/**
 * POST /api/stores
 * 
 * Create a new store
 * 
 * @permissions stores.create
 * @body CreateStoreInput
 * @returns Created store
 */
export const POST = createApiHandler(
  async ({ body, userId }) => {
    // bodySchema validation ensures body is defined and validated with defaults
    // TypeScript doesn't see this, so we cast after validation
    const validatedBody = body! as storeService.CreateStoreInput;
    const store = await storeService.createStore(validatedBody, userId);
    return { data: store, message: 'Store created successfully' };
  },
  {
    bodySchema: storeService.CreateStoreSchema,
    permission: PERMISSIONS.STORES.CREATE,
    requireAuth: true,
    rateLimit: true,
  }
);

/**
 * GET /api/stores
 * 
 * List stores with pagination and filtering
 * 
 * Super admins see all stores. Regular users see only their stores.
 * 
 * @permissions stores.view
 * @query page, perPage, search, status, sortBy, sortOrder
 * @returns Paginated store list
 */
export const GET = createApiHandler(
  async ({ query, userId, isSuperAdmin }) => {
    // querySchema validation ensures query is defined with defaults
    const validatedQuery = query! as storeService.ListStoresQuery;
    const result = await storeService.listStores(validatedQuery, { userId, isSuperAdmin });
    return {
      data: result.stores,
      message: `Found ${result.total} stores`,
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  },
  {
    querySchema: storeService.ListStoresQuerySchema,
    permission: PERMISSIONS.STORES.VIEW,
    requireAuth: true,
    rateLimit: true,
  }
);
