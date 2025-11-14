/**
 * Cache Tag Registry
 * 
 * Semantic cache tags for Next.js cache invalidation via revalidateTag()
 * Used with Cache Components and unstable_cache for fine-grained control.
 * 
 * @module cache-tags
 * @see https://nextjs.org/docs/app/api-reference/functions/revalidateTag
 */

/**
 * Cache tag categories
 */
export const CacheTagCategory = {
  PRODUCT: 'product',
  CATEGORY: 'category',
  PAGE: 'page',
  ORDER: 'order',
  CUSTOMER: 'customer',
  INVENTORY: 'inventory',
} as const;

export type CacheTagCategory = typeof CacheTagCategory[keyof typeof CacheTagCategory];

/**
 * Generate a cache tag for a specific entity
 * Format: {entity}:{id}
 * 
 * @param category - Entity category
 * @param id - Entity ID
 * @returns Cache tag string
 * 
 * @example
 * cacheTag('product', '123') // 'product:123'
 */
export function cacheTag(category: CacheTagCategory, id: string): string {
  return `${category}:${id}`;
}

/**
 * Generate a cache tag for a list of entities
 * Format: {entity}:list:store:{storeId}
 * 
 * @param category - Entity category
 * @param storeId - Store ID for multi-tenant isolation
 * @returns Cache tag string
 * 
 * @example
 * cacheListTag('product', 'store-123') // 'product:list:store:store-123'
 */
export function cacheListTag(category: CacheTagCategory, storeId: string): string {
  return `${category}:list:store:${storeId}`;
}

/**
 * Generate a cache tag for entity count
 * Format: {entity}:count:store:{storeId}
 * 
 * @param category - Entity category
 * @param storeId - Store ID
 * @returns Cache tag string
 */
export function cacheCountTag(category: CacheTagCategory, storeId: string): string {
  return `${category}:count:store:${storeId}`;
}

/**
 * Generate cache tags for a product
 * Includes individual tag and list/count tags for the store
 * 
 * @param productId - Product ID
 * @param storeId - Store ID
 * @returns Array of cache tags to invalidate
 */
export function productCacheTags(productId: string, storeId: string): string[] {
  return [
    cacheTag(CacheTagCategory.PRODUCT, productId),
    cacheListTag(CacheTagCategory.PRODUCT, storeId),
    cacheCountTag(CacheTagCategory.PRODUCT, storeId),
  ];
}

/**
 * Generate cache tags for a category
 * 
 * @param categoryId - Category ID
 * @param storeId - Store ID
 * @returns Array of cache tags to invalidate
 */
export function categoryCacheTags(categoryId: string, storeId: string): string[] {
  return [
    cacheTag(CacheTagCategory.CATEGORY, categoryId),
    cacheListTag(CacheTagCategory.CATEGORY, storeId),
    cacheCountTag(CacheTagCategory.CATEGORY, storeId),
  ];
}

/**
 * Generate cache tags for a page
 * 
 * @param pageId - Page ID
 * @param storeId - Store ID
 * @returns Array of cache tags to invalidate
 */
export function pageCacheTags(pageId: string, storeId: string): string[] {
  return [
    cacheTag(CacheTagCategory.PAGE, pageId),
    cacheListTag(CacheTagCategory.PAGE, storeId),
    cacheCountTag(CacheTagCategory.PAGE, storeId),
  ];
}

/**
 * Generate cache tags for inventory changes
 * Invalidates product and inventory-related caches
 * 
 * @param productId - Product ID
 * @param storeId - Store ID
 * @returns Array of cache tags to invalidate
 */
export function inventoryCacheTags(productId: string, storeId: string): string[] {
  return [
    cacheTag(CacheTagCategory.PRODUCT, productId),
    cacheTag(CacheTagCategory.INVENTORY, productId),
    cacheListTag(CacheTagCategory.PRODUCT, storeId),
  ];
}

/**
 * Cache tag naming conventions for documentation
 * 
 * Entity tag:     {entity}:{id}                  - Specific entity instance
 * List tag:       {entity}:list:store:{storeId}  - List of entities per store
 * Count tag:      {entity}:count:store:{storeId} - Entity count per store
 * Relation tag:   {parent}:{parentId}:{child}    - Related entities (future)
 */
export const CACHE_TAG_CONVENTIONS = {
  entity: '{category}:{id}',
  list: '{category}:list:store:{storeId}',
  count: '{category}:count:store:{storeId}',
  relation: '{parent}:{parentId}:{child}',
} as const;
