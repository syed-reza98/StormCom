/**
 * Idempotency Handling for PUT/PATCH Requests
 * 
 * Provides infrastructure for idempotent API operations to prevent
 * duplicate request execution from network retries, client errors, etc.
 * 
 * PRODUCTION: Uses Vercel KV (Redis) for distributed caching
 * DEVELOPMENT: Falls back to in-memory Map
 */

import type { NextRequest } from 'next/server';

// Types
export interface IdempotencyOptions {
  ttlSeconds?: number; // Cache TTL (default: 24 hours)
}

// Constants
const CACHE_PREFIX = 'idempotency:';
const DEFAULT_TTL_SECONDS = 24 * 60 * 60; // 24 hours

// In-memory cache for development
const devCache = new Map<string, { result: unknown; expiresAt: number }>();

// Cache cleanup interval (development only)
if (process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of devCache.entries()) {
      if (value.expiresAt < now) {
        devCache.delete(key);
      }
    }
  }, 60 * 60 * 1000); // Clean up every hour
}

/**
 * Get cached idempotent result
 * 
 * @param key - Idempotency key
 * @returns Cached result or null if not found/expired
 */
export async function getCachedIdempotentResult<T>(
  key: string
): Promise<T | null> {
  const cacheKey = `${CACHE_PREFIX}${key}`;

  // Production: Use Vercel KV
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv');
      return await kv.get<T>(cacheKey);
    } catch (error) {
      console.error('KV cache get error:', error);
      return null;
    }
  }

  // Development: Use in-memory cache
  const cached = devCache.get(cacheKey);
  if (!cached) return null;

  // Check expiration
  if (cached.expiresAt < Date.now()) {
    devCache.delete(cacheKey);
    return null;
  }

  return cached.result as T;
}

/**
 * Cache idempotent result
 * 
 * @param key - Idempotency key
 * @param result - Result to cache
 * @param options - Cache options (TTL)
 */
export async function cacheIdempotentResult<T>(
  key: string,
  result: T,
  options: IdempotencyOptions = {}
): Promise<void> {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const ttlSeconds = options.ttlSeconds || DEFAULT_TTL_SECONDS;

  // Production: Use Vercel KV
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(cacheKey, result, { ex: ttlSeconds });
    } catch (error) {
      console.error('KV cache set error:', error);
    }
    return;
  }

  // Development: Use in-memory cache
  devCache.set(cacheKey, {
    result,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Require idempotency key from request
 * 
 * Extracts and validates idempotency key from request headers.
 * Throws error if missing (for strict enforcement).
 * 
 * @param request - Next.js request object
 * @returns Idempotency key
 * @throws Error if idempotency key is missing
 */
export function requireIdempotencyKey(request: NextRequest): string {
  const key = request.headers.get('idempotency-key');

  if (!key) {
    throw new Error('Idempotency-Key header required for PUT/PATCH requests');
  }

  // Validate key format (basic validation)
  if (key.length < 8 || key.length > 255) {
    throw new Error('Idempotency-Key must be between 8 and 255 characters');
  }

  return key;
}

/**
 * Get optional idempotency key from request
 * 
 * Extracts idempotency key from request headers without requiring it.
 * Use for backward compatibility or optional idempotency.
 * 
 * @param request - Next.js request object
 * @returns Idempotency key or null
 */
export function getIdempotencyKey(request: NextRequest): string | null {
  const key = request.headers.get('idempotency-key');
  
  if (!key) return null;
  
  // Validate key format
  if (key.length < 8 || key.length > 255) {
    return null;
  }
  
  return key;
}

/**
 * Clear development cache (for testing)
 * 
 * @internal
 */
export function clearDevCache(): void {
  devCache.clear();
}

/**
 * Get development cache size (for testing)
 * 
 * @internal
 */
export function getDevCacheSize(): number {
  return devCache.size;
}
