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
 * GET /api/stores/[storeId]/stats
 * 
 * Get store statistics (products, orders, customers, revenue)
 * 
 * @permissions stores.view
 * @params storeId
 * @returns Store statistics
 */
export const GET = createApiHandler<unknown, unknown, { storeId: string }>(
  async ({ params: paramsPromise }) => {
    // ParamsSchema validation ensures params is defined
    const params = await paramsPromise;
    const stats = await storeService.getStoreStats(params!.storeId);
    return { data: stats };
  },
  {
    paramsSchema: ParamsSchema,
    permission: PERMISSIONS.STORES.VIEW,
    requireAuth: true,
    requireStore: true,
    rateLimit: true,
  }
);
