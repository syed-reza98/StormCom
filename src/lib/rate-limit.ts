// src/lib/rate-limit.ts
// Redis-Based Rate Limiting for StormCom API Routes
// 
// STATUS: ⏳ NOT CURRENTLY USED - Prepared for future Upstash Redis integration
// 
// This is a more advanced rate limiting implementation that uses Upstash Redis
// for persistent, distributed rate limiting with subscription plan-based tiers.
// 
// CURRENT IMPLEMENTATION: simple-rate-limit.ts (in-memory)
// 
// TO ENABLE THIS MODULE:
// 1. Set up Upstash Redis account
// 2. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env
// 3. Replace simple-rate-limit.ts imports in proxy.ts with this module
// 4. See RATE_LIMITING.md for complete migration guide

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { SubscriptionPlan } from '@prisma/client';

/**
 * Rate limit configuration by subscription plan
 */
const RATE_LIMIT_CONFIG = {
  [SubscriptionPlan.FREE]: {
    requests: 100,
    window: '1 m' as const, // 100 requests per minute
  },
  [SubscriptionPlan.BASIC]: {
    requests: 500,
    window: '1 m' as const, // 500 requests per minute
  },
  [SubscriptionPlan.PRO]: {
    requests: 2000,
    window: '1 m' as const, // 2000 requests per minute
  },
  [SubscriptionPlan.ENTERPRISE]: {
    requests: 10000,
    window: '1 m' as const, // 10,000 requests per minute
  },
  // Default for unauthenticated requests
  ANONYMOUS: {
    requests: 50,
    window: '1 m' as const, // 50 requests per minute
  },
} as const;

/**
 * Check if Redis is available
 */
function isRedisAvailable(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Create rate limiter for a specific plan
 */
function createRateLimiter(plan: SubscriptionPlan | 'ANONYMOUS') {
  if (!isRedisAvailable()) {
    // In development without Redis, allow all requests
    return null;
  }

  const config = RATE_LIMIT_CONFIG[plan];

  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
    prefix: `@stormcom/ratelimit/${plan.toLowerCase()}`,
  });
}

/**
 * Rate limiters by plan (lazy initialization)
 */
const rateLimiters: Partial<Record<SubscriptionPlan | 'ANONYMOUS', Ratelimit | null>> = {};

/**
 * Get rate limiter for a plan
 */
function getRateLimiter(plan: SubscriptionPlan | 'ANONYMOUS'): Ratelimit | null {
  if (!rateLimiters[plan]) {
    rateLimiters[plan] = createRateLimiter(plan);
  }
  return rateLimiters[plan] || null;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  identifier: string,
  plan: SubscriptionPlan | 'ANONYMOUS' = 'ANONYMOUS'
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(plan);

  // If no limiter (development mode), allow all requests
  if (!limiter) {
    return {
      success: true,
      limit: 999999,
      remaining: 999999,
      reset: Date.now() + 60000,
    };
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    return {
      success,
      limit,
      remaining,
      reset,
      retryAfter: success ? undefined : Math.ceil((reset - Date.now()) / 1000),
    };
  } catch (error) {
    console.error('[Rate Limit] Error checking rate limit:', error);
    // On error, allow the request to proceed (fail open)
    return {
      success: true,
      limit: RATE_LIMIT_CONFIG[plan].requests,
      remaining: 0,
      reset: Date.now() + 60000,
    };
  }
}

/**
 * Get identifier from request (IP address or user ID)
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  // Use userId if authenticated
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Create rate limit exceeded response
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        timestamp: new Date().toISOString(),
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        ...(result.retryAfter && {
          'Retry-After': result.retryAfter.toString(),
        }),
      },
    }
  );
}

/**
 * Middleware helper to check rate limit
 */
export async function checkRateLimitForRequest(
  request: Request,
  userId?: string,
  plan?: SubscriptionPlan
): Promise<{ success: true } | Response> {
  const identifier = getRateLimitIdentifier(request, userId);
  const result = await checkRateLimit(identifier, plan || 'ANONYMOUS');

  if (!result.success) {
    return createRateLimitResponse(result);
  }

  return { success: true };
}

/**
 * Get rate limit info for a user (for display in UI)
 */
export async function getRateLimitInfo(
  identifier: string,
  plan: SubscriptionPlan
): Promise<{
  limit: number;
  remaining: number;
  reset: Date;
  resetIn: number;
}> {
  const config = RATE_LIMIT_CONFIG[plan];
  const limiter = getRateLimiter(plan);

  if (!limiter) {
    return {
      limit: config.requests,
      remaining: config.requests,
      reset: new Date(Date.now() + 60000),
      resetIn: 60,
    };
  }

  try {
    const { limit, remaining, reset } = await limiter.limit(identifier);

    return {
      limit,
      remaining: Math.max(0, remaining),
      reset: new Date(reset),
      resetIn: Math.ceil((reset - Date.now()) / 1000),
    };
  } catch (error) {
    console.error('[Rate Limit] Error getting rate limit info:', error);
    return {
      limit: config.requests,
      remaining: 0,
      reset: new Date(Date.now() + 60000),
      resetIn: 60,
    };
  }
}

/**
 * Export rate limit configuration for documentation
 */
export { RATE_LIMIT_CONFIG };
