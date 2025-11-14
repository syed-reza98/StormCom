/**
 * Server-Side Store Resolution Helper
 * 
 * Resolves store from request headers (set by proxy) and initializes request context.
 * Use this in API routes and Server Components to establish multi-tenant context.
 * 
 * @module resolve-from-headers
 */

import { headers } from 'next/headers';
import { resolveStore } from './resolve-store';
import { runWithContext, generateRequestId, type RequestContext } from '@/lib/request-context';
import { NotFoundError } from '@/lib/errors';

/**
 * Resolve store from request headers and run function with context
 * 
 * Usage in API routes:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withStoreContext(async (storeId) => {
 *     const products = await db.product.findMany({
 *       where: { storeId, deletedAt: null }
 *     });
 *     return NextResponse.json({ data: products });
 *   });
 * }
 * ```
 * 
 * Usage in Server Components:
 * ```typescript
 * export default async function ProductsPage() {
 *   const products = await withStoreContext(async (storeId) => {
 *     return await db.product.findMany({
 *       where: { storeId, deletedAt: null }
 *     });
 *   });
 *   return <ProductList products={products} />;
 * }
 * ```
 * 
 * @param fn - Function to execute with store context
 * @returns Result of the function
 * @throws NotFoundError if store cannot be resolved from host
 */
export async function withStoreContext<T>(
  fn: (storeId: string) => Promise<T>
): Promise<T> {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  
  if (!host) {
    throw new NotFoundError('Store', 'No host header present');
  }

  // Resolve store from host
  const resolved = await resolveStore(host);

  // Create request context
  const context: RequestContext = {
    requestId: headersList.get('x-request-id') || generateRequestId(),
    storeId: resolved.storeId,
  };

  // Run function with context
  return runWithContext(context, () => fn(resolved.storeId));
}

/**
 * Get resolved store information from request headers (without context)
 * Use this when you only need store info without setting up full context.
 * 
 * @returns Resolved store information
 * @throws NotFoundError if store cannot be resolved
 */
export async function getResolvedStore() {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  
  if (!host) {
    throw new NotFoundError('Store', 'No host header present');
  }

  return await resolveStore(host);
}
