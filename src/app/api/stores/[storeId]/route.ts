import { createApiHandler } from '@/lib/api-wrapper';
import * as storeService from '@/services/stores/store-service';
import { PERMISSIONS } from '@/lib/constants';
import { z } from 'zod';

/**
 * Route params schema
 */
const ParamsSchema = z.object({
  storeId: z.string().cuid(),
});

/**
 * GET /api/stores/[storeId]
 * 
 * Get store by ID
 * 
 * @permissions stores.view
 * @params storeId
 * @returns Store details
 */
export const GET = createApiHandler<unknown, unknown, { storeId: string }>(
  async ({ params: paramsPromise }) => {
    // ParamsSchema validation ensures params is defined
    const params = await paramsPromise;
    const store = await storeService.getStore(params!.storeId);
    
    if (!store) {
      return {
        error: {
          code: 'STORE_NOT_FOUND',
          message: 'Store not found',
        },
        statusCode: 404,
      };
    }

    return { data: store };
  },
  {
    paramsSchema: ParamsSchema,
    permission: PERMISSIONS.STORES.VIEW,
    requireAuth: true,
    requireStore: true,
    rateLimit: true,
  }
);

/**
 * PATCH /api/stores/[storeId]
 * 
 * Update store
 * 
 * @permissions stores.update
 * @params storeId
 * @body UpdateStoreInput
 * @returns Updated store
 */
export const PATCH = createApiHandler<storeService.UpdateStoreInput, unknown, { storeId: string }>(
  async ({ params: paramsPromise, body }) => {
    // ParamsSchema and bodySchema validation ensures params and body are defined and validated
    const params = await paramsPromise;
    const validatedBody = body! as storeService.UpdateStoreInput;
    const store = await storeService.updateStore(params!.storeId, validatedBody);
    return { data: store, message: 'Store updated successfully' };
  },
  {
    paramsSchema: ParamsSchema,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bodySchema: storeService.UpdateStoreSchema as any,
    permission: PERMISSIONS.STORES.UPDATE,
    requireAuth: true,
    requireStore: true,
    rateLimit: true,
  }
);

/**
 * DELETE /api/stores/[storeId]
 * 
 * Delete store (soft delete)
 * 
 * @permissions stores.delete
 * @params storeId
 * @returns Success message
 */
export const DELETE = createApiHandler(
  async ({ params }) => {
    // ParamsSchema validation ensures params is defined
    await storeService.deleteStore(params!.storeId);
    return { data: null, message: 'Store deleted successfully' };
  },
  {
    paramsSchema: ParamsSchema,
    permission: PERMISSIONS.STORES.DELETE,
    requireAuth: true,
    requireStore: true,
    rateLimit: true,
  }
);
