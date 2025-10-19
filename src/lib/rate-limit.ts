import { Redis } from '@upstash/redis';

/**
 * Rate limiting utility using Upstash Redis
 * Implements token bucket algorithm for tiered rate limiting
 */

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Rate limit tiers based on subscription plan
export const RATE_LIMITS = {
  FREE: {
    requests: 100, // requests per window
    window: 60, // seconds
  },
  STARTER: {
    requests: 500,
    window: 60,
  },
  PROFESSIONAL: {
    requests: 2000,
    window: 60,
  },
  ENTERPRISE: {
    requests: 10000,
    window: 60,
  },
} as const;

export type RateLimitTier = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

/**
 * Check rate limit for a given identifier and tier
 * @param identifier - Unique identifier (e.g., IP address, user ID, store ID)
 * @param tier - Rate limit tier based on subscription plan
 * @returns RateLimitResult with limit information
 */
export async function rateLimit(
  identifier: string,
  tier: RateLimitTier = 'FREE'
): Promise<RateLimitResult> {
  // If Redis is not configured, allow all requests (development mode)
  if (!redis) {
    console.warn('Rate limiting is disabled (Redis not configured)');
    return {
      success: true,
      limit: RATE_LIMITS[tier].requests,
      remaining: RATE_LIMITS[tier].requests,
      reset: Date.now() + RATE_LIMITS[tier].window * 1000,
    };
  }

  const limit = RATE_LIMITS[tier].requests;
  const window = RATE_LIMITS[tier].window;
  const key = `ratelimit:${tier}:${identifier}`;

  try {
    // Use Redis INCR with EXPIRE for atomic rate limiting
    const count = await redis.incr(key);
    
    if (count === 1) {
      // First request in window, set expiration
      await redis.expire(key, window);
    }

    const ttl = await redis.ttl(key);
    const reset = Date.now() + ttl * 1000;
    const remaining = Math.max(0, limit - count);

    return {
      success: count <= limit,
      limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow request but log the issue
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Date.now() + window * 1000,
    };
  }
}

/**
 * Middleware helper to check rate limit and return headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}

/**
 * Reset rate limit for a given identifier (admin function)
 */
export async function resetRateLimit(identifier: string, tier: RateLimitTier = 'FREE'): Promise<void> {
  if (!redis) return;
  
  const key = `ratelimit:${tier}:${identifier}`;
  await redis.del(key);
}
