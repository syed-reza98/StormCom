// src/lib/simple-rate-limit.ts
// Simple IP-based rate limiting for API routes
// Used for general API protection (100 req/min) and auth endpoints (10 req/min)

/**
 * Rate limit configuration
 */
export const SIMPLE_RATE_LIMIT_CONFIG = {
  // General API endpoints: 100 requests per minute
  general: {
    limit: 100,
    windowMs: 60 * 1000, // 60 seconds
  },
  
  // Authentication endpoints: 10 requests per minute (stricter)
  auth: {
    limit: 10,
    windowMs: 60 * 1000,
  },
};

/**
 * In-memory rate limit store
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Cleanup expired entries periodically
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 60 * 1000); // Cleanup every 60 seconds
}

/**
 * Get rate limit configuration for a given pathname
 */
export function getSimpleRateLimitConfig(pathname: string): {
  limit: number;
  windowMs: number;
} {
  // Authentication endpoints: stricter limits
  if (pathname.startsWith('/api/auth/login') || 
      pathname.startsWith('/api/auth/register') ||
      pathname.startsWith('/api/auth/forgot-password')) {
    return SIMPLE_RATE_LIMIT_CONFIG.auth;
  }

  // Default: general API limits
  return SIMPLE_RATE_LIMIT_CONFIG.general;
}

/**
 * Check if a route should be rate limited
 */
export function shouldSimpleRateLimit(pathname: string): boolean {
  // Don't rate limit health check endpoints
  if (pathname === '/api/health' || pathname === '/api/status') {
    return false;
  }

  // Don't rate limit static assets
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml') {
    return false;
  }

  // Rate limit all API routes
  if (pathname.startsWith('/api/')) {
    return true;
  }

  // Don't rate limit other routes (pages, etc.)
  return false;
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  // Try to get real IP from headers (reverse proxy, CDN)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list; take the first IP
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Vercel-specific headers
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    return vercelIp.split(',')[0].trim();
  }

  // Fallback to a default (shouldn't happen in production)
  return '127.0.0.1';
}

/**
 * Rate limit result
 */
export interface SimpleRateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  retryAfter?: number; // Seconds until reset
}

/**
 * Check rate limit for a request
 */
export function checkSimpleRateLimit(
  request: Request
): SimpleRateLimitResult {
  const { pathname } = new URL(request.url);

  // Check if route should be rate limited
  if (!shouldSimpleRateLimit(pathname)) {
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }

  // Get rate limit config for this route
  const config = getSimpleRateLimitConfig(pathname);

  // Get client IP
  const ip = getClientIp(request);

  // Create rate limit key: ip:pathname
  const key = `${ip}:${pathname}`;

  // Get current time
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  } else {
    // Increment count
    entry.count++;
  }

  // Calculate reset timestamp (seconds)
  const reset = Math.ceil(entry.resetTime / 1000);

  // Calculate remaining
  const remaining = Math.max(0, config.limit - entry.count);

  // Check if limit exceeded
  if (entry.count > config.limit) {
    // Calculate retry after (seconds until window resets)
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset,
      retryAfter,
    };
  }

  return {
    success: true,
    limit: config.limit,
    remaining,
    reset,
  };
}

/**
 * Create rate limit error response
 */
export function createSimpleRateLimitError(result: SimpleRateLimitResult): Response {
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
        'Retry-After': result.retryAfter?.toString() || '60',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
      },
    }
  );
}

/**
 * Add rate limit headers to response
 */
export function addSimpleRateLimitHeaders(
  response: Response,
  result: SimpleRateLimitResult
): void {
  if (result.limit === 0) {
    return; // No rate limiting applied
  }

  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());
}
