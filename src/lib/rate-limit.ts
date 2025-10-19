// src/lib/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Default: 100 requests per minute per IP (see plan.md)
 */
const redis = Redis.fromEnv();

export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(100, '1 m'),
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  // identifier: IP address or user ID
  return rateLimiter.limit(identifier);
}
