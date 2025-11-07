# Rate Limiting in StormCom

## Overview

StormCom uses two different rate limiting approaches depending on the deployment environment:

1. **Simple In-Memory Rate Limiting** (`simple-rate-limit.ts`) - **Currently Active**
2. **Redis-Based Rate Limiting** (`rate-limit.ts`) - **Future Enhancement**

## Current Implementation: Simple Rate Limiting

### File: `simple-rate-limit.ts`

**Status**: ✅ **Active** - Used in production middleware (`proxy.ts`)

**Features**:
- In-memory rate limiting using JavaScript `Map`
- IP-based request tracking
- Different limits for different route types:
  - General API: 100 requests/minute
  - Auth endpoints: 10 requests/minute (stricter)
- Automatic cleanup of expired entries
- No external dependencies

**Pros**:
- Simple implementation
- No external service dependencies
- Works in all environments (local, staging, production)
- Fast (in-memory lookups)

**Cons**:
- State is lost on server restart
- Does not work across multiple server instances (horizontal scaling)
- Memory usage grows with active users

**Usage**:
```typescript
import { checkSimpleRateLimit, createSimpleRateLimitError } from '@/lib/simple-rate-limit';

const rateLimitResult = checkSimpleRateLimit(request);
if (!rateLimitResult.success) {
  return createSimpleRateLimitError(rateLimitResult);
}
```

**When to Use**:
- Single-server deployments
- Development and staging environments
- Low to medium traffic applications
- When Redis/Upstash is not available

## Future Enhancement: Redis-Based Rate Limiting

### File: `rate-limit.ts`

**Status**: ⏳ **Not Currently Used** - Prepared for future Upstash Redis integration

**Features**:
- Redis-based rate limiting using Upstash
- Subscription plan-based tiered limits:
  - FREE: 100 requests/minute
  - BASIC: 500 requests/minute
  - PRO: 2,000 requests/minute
  - ENTERPRISE: 10,000 requests/minute
- Anonymous users: 50 requests/minute
- Sliding window algorithm
- Analytics support
- Persistent across server restarts
- Works across multiple server instances

**Pros**:
- Scales horizontally (multiple servers)
- Persistent state (survives restarts)
- More accurate rate limiting
- Analytics and monitoring
- Plan-based tiered limits

**Cons**:
- Requires external Redis service (Upstash)
- Additional cost for Redis hosting
- Network latency for Redis calls
- More complex setup

**Setup Required**:
```bash
# Add to .env.local
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

**Usage** (when enabled):
```typescript
import { checkRateLimitForRequest } from '@/lib/rate-limit';

const result = await checkRateLimitForRequest(request, userId, plan);
if (result instanceof Response) {
  return result; // Rate limit exceeded
}
```

**When to Use**:
- Production deployments with high traffic
- Multi-server/horizontal scaling setups
- When subscription-based rate limiting is needed
- When persistent rate limiting state is required

## Migration Path

To migrate from simple to Redis-based rate limiting:

1. **Setup Upstash Redis**:
   - Create Upstash account
   - Create Redis database
   - Get REST URL and token

2. **Update Environment Variables**:
   ```bash
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=xxx
   ```

3. **Update Middleware** (`proxy.ts`):
   ```typescript
   // Replace:
   import { checkSimpleRateLimit } from './src/lib/simple-rate-limit';
   
   // With:
   import { checkRateLimitForRequest } from './src/lib/rate-limit';
   
   // Update rate limit check:
   const result = await checkRateLimitForRequest(request, userId, plan);
   if (result instanceof Response) {
     return result;
   }
   ```

4. **Test Thoroughly**:
   - Verify rate limits work correctly
   - Check performance impact
   - Monitor Redis usage

5. **Deploy**:
   - Deploy to staging first
   - Monitor for issues
   - Deploy to production

## Recommendation

**Current Setup (Keep as-is)**:
- Use `simple-rate-limit.ts` for now (already configured)
- It's sufficient for most use cases
- Works well with Vercel serverless functions

**Future Upgrade (When Needed)**:
- Migrate to `rate-limit.ts` when:
  - Traffic exceeds single-server capacity
  - Multi-region deployment needed
  - Plan-based rate limiting becomes a priority
  - Analytics/monitoring is required

## Files Summary

| File | Status | Purpose | Dependencies |
|------|--------|---------|-------------|
| `simple-rate-limit.ts` | ✅ Active | In-memory rate limiting | None |
| `rate-limit.ts` | ⏳ Ready | Redis-based rate limiting | Upstash Redis |
| `proxy.ts` | ✅ Active | Middleware using simple rate limiting | simple-rate-limit.ts |

## Support

For questions or issues:
- Check Upstash documentation: https://upstash.com/docs/redis
- Review Next.js middleware docs: https://nextjs.org/docs/app/building-your-application/routing/middleware
