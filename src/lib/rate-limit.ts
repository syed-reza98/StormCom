import { Redis } from '@upstash/redis';
import { API_RATE_LIMITS } from './constants';

/**
 * Rate limiting utilities using Upstash Redis.
 * 
 * Implements sliding window rate limiting per subscription plan tier.
 * 
 * @see NFR-004: Performance - API rate limiting by subscription tier
 * @see T011: API_RATE_LIMITS constants
 */

/**
 * Initialize Upstash Redis client (lazy initialization).
 */
let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        'Missing Upstash Redis environment variables: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required'
      );
    }

    redisClient = new Redis({
      url,
      token,
    });
  }

  return redisClient;
}

/**
 * Rate limit result.
 */
export interface RateLimitResult {
  success: boolean; // true if request is allowed
  limit: number; // Maximum requests allowed per minute
  remaining: number; // Requests remaining in current window
  reset: number; // Timestamp (seconds) when the window resets
}

/**
 * Get rate limit for a subscription plan.
 * 
 * @param plan - Subscription plan slug (FREE, STARTER, PROFESSIONAL, ENTERPRISE, etc.)
 * @returns Requests per minute allowed for the plan
 */
export function getRateLimitForPlan(plan: string): number {
  // Map plan to rate limit (default to FREE tier)
  const planLimits: Record<string, number> = {
    FREE: API_RATE_LIMITS.FREE,
    STARTER: API_RATE_LIMITS.STARTER,
    PROFESSIONAL: API_RATE_LIMITS.PROFESSIONAL,
    ENTERPRISE: API_RATE_LIMITS.ENTERPRISE,
  };

  return planLimits[plan.toUpperCase()] || API_RATE_LIMITS.FREE;
}

/**
 * Check rate limit for a user/store.
 * 
 * Uses a sliding window algorithm with Redis:
 * 1. Generate a unique key for the user/store + time window
 * 2. Increment the counter for this window
 * 3. Check if the counter exceeds the limit
 * 4. Return success/failure with metadata
 * 
 * @param identifier - Unique identifier (e.g., userId:storeId or IP address)
 * @param limit - Maximum requests allowed per minute
 * @param windowSeconds - Time window in seconds (default: 60)
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds = 60
): Promise<RateLimitResult> {
  try {
    const redis = getRedisClient();

    // Current timestamp (seconds)
    const now = Math.floor(Date.now() / 1000);
    
    // Window start time (aligned to window boundaries)
    const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
    
    // Redis key for this window
    const key = `ratelimit:${identifier}:${windowStart}`;

    // Increment counter and get current value
    const count = await redis.incr(key);

    // Set expiration on first increment (auto-cleanup old windows)
    if (count === 1) {
      await redis.expire(key, windowSeconds * 2); // Keep 2 windows for overlap
    }

    // Calculate remaining requests
    const remaining = Math.max(0, limit - count);

    // Reset timestamp (end of current window)
    const reset = windowStart + windowSeconds;

    return {
      success: count <= limit,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    // If Redis is unavailable, fail open (allow request but log warning)
    console.error('[Rate Limit] Redis error:', error);
    
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Math.floor(Date.now() / 1000) + 60,
    };
  }
}

/**
 * Check rate limit for a store (uses store's subscription plan).
 * 
 * @param storeId - Store ID
 * @param planSlug - Subscription plan slug (FREE, STARTER, etc.)
 * @returns Rate limit result
 */
export async function checkStoreRateLimit(
  storeId: string,
  planSlug: string
): Promise<RateLimitResult> {
  const limit = getRateLimitForPlan(planSlug);
  return checkRateLimit(`store:${storeId}`, limit);
}

/**
 * Check rate limit for an IP address (global rate limit).
 * 
 * Used for unauthenticated requests or as a fallback.
 * 
 * @param ipAddress - Client IP address
 * @param limit - Maximum requests allowed per minute (default: FREE tier)
 * @returns Rate limit result
 */
export async function checkIpRateLimit(
  ipAddress: string,
  limit = API_RATE_LIMITS.FREE
): Promise<RateLimitResult> {
  return checkRateLimit(`ip:${ipAddress}`, limit);
}

/**
 * Get client IP address from request headers.
 * 
 * Checks common headers in order:
 * 1. x-forwarded-for (most common in proxies/CDNs)
 * 2. x-real-ip (Nginx)
 * 3. cf-connecting-ip (Cloudflare)
 * 4. x-vercel-forwarded-for (Vercel)
 * 
 * @param request - Next.js Request object
 * @returns Client IP address or 'unknown'
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;

  // Check various headers (in order of preference)
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for can be a comma-separated list (client, proxy1, proxy2)
    // The first IP is the original client
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim();
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  const vercelForwardedFor = headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.trim();
  }

  return 'unknown';
}

/**
 * Enforce rate limit (throws error if exceeded).
 * 
 * This is a guard function for API routes.
 * 
 * @param identifier - Unique identifier (userId:storeId or IP)
 * @param limit - Maximum requests per minute
 * @throws Error with 429 status if rate limit exceeded
 * 
 * @example
 * // In an API route
 * export async function GET(request: Request) {
 *   const storeId = getStoreId();
 *   await enforceRateLimit(`store:${storeId}`, API_RATE_LIMITS.PROFESSIONAL);
 *   // ... rest of the handler
 * }
 */
export async function enforceRateLimit(
  identifier: string,
  limit: number
): Promise<void> {
  const result = await checkRateLimit(identifier, limit);

  if (!result.success) {
    throw new Error(
      `Rate limit exceeded: ${limit} requests per minute. ` +
      `Retry after ${result.reset - Math.floor(Date.now() / 1000)} seconds.`
    );
  }
}

/**
 * Get rate limit headers for HTTP response.
 * 
 * Returns standard rate limit headers (X-RateLimit-*).
 * 
 * @param result - Rate limit result
 * @returns Headers object
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}
