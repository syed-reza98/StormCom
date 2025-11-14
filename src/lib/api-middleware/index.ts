/**
 * API Middleware Pipeline
 * 
 * Composable middleware chain for API routes providing:
 * - Request ID propagation (X-Request-Id header)
 * - Authentication enforcement
 * - Rate limiting (per IP/user)
 * - Request validation (Zod schemas)
 * - Request/response logging
 * - Error handling and standardization
 * 
 * Usage:
 * ```typescript
 * import { createApiHandler } from '@/lib/api-middleware';
 * 
 * export const GET = createApiHandler(
 *   [authMiddleware(), rateLimitMiddleware()],
 *   async (request, context) => {
 *     // Handler logic
 *     return successResponse(data);
 *   }
 * );
 * ```
 * 
 * @module api-middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  runWithContext, 
  generateRequestId, 
  updateContext,
  getRequestId,
} from '@/lib/request-context';
import { 
  errorResponse, 
  validationErrorResponse,
  unauthorizedResponse,
} from '@/lib/api-response';
import { checkSimpleRateLimit } from '@/lib/simple-rate-limit';

/**
 * Middleware context passed through the chain
 */
export interface MiddlewareContext {
  /** Original request object */
  request: NextRequest;
  /** Dynamic route parameters (await params in Next.js 16) */
  params?: Record<string, string>;
  /** Authenticated user session */
  session?: {
    user: {
      id: string;
      email: string;
      storeId?: string;
      role?: string;
    };
  };
  /** Resolved store ID for multi-tenant context */
  storeId?: string;
  /** Validated request body */
  body?: unknown;
  /** Custom metadata from middleware */
  metadata?: Record<string, unknown>;
}

/**
 * Middleware function signature
 */
export type Middleware = (
  context: MiddlewareContext,
  next: () => Promise<NextResponse>
) => Promise<NextResponse>;

/**
 * API route handler signature
 */
export type ApiHandler = (
  request: NextRequest,
  context: MiddlewareContext
) => Promise<NextResponse>;

/**
 * Create an API handler with middleware chain
 * 
 * @param middlewares - Array of middleware functions to apply
 * @param handler - Final route handler
 * @returns NextJS route handler function
 */
export function createApiHandler(
  middlewares: Middleware[],
  handler: ApiHandler
): (request: NextRequest, routeContext: { params: Promise<Record<string, string>> }) => Promise<NextResponse> {
  return async (request: NextRequest, routeContext: { params: Promise<Record<string, string>> }) => {
    // Extract and await params (Next.js 16 requirement)
    const params = await routeContext.params;

    // Initialize request context with correlation ID
    const requestId = request.headers.get('x-request-id') || generateRequestId();
    
    return runWithContext({ requestId }, async () => {
      // Create middleware context
      const context: MiddlewareContext = {
        request,
        params,
      };

      // Build middleware chain with handler at the end
      let index = 0;

      const next = async (): Promise<NextResponse> => {
        if (index < middlewares.length) {
          const middleware = middlewares[index++];
          return middleware(context, next);
        }
        // Execute final handler
        return handler(request, context);
      };

      try {
        return await next();
      } catch (error) {
        // Global error handling
        console.error('[API Middleware] Unhandled error:', error);
        return errorResponse(error);
      }
    });
  };
}

/**
 * Request ID middleware
 * Ensures X-Request-Id header is present and propagates through context
 */
export function requestIdMiddleware(): Middleware {
  return async (_context, next) => {
    // Request ID already set by createApiHandler
    const response = await next();
    
    // Ensure response includes X-Request-Id header
    if (!response.headers.get('x-request-id')) {
      response.headers.set('x-request-id', getRequestId());
    }
    
    return response;
  };
}

/**
 * Authentication middleware
 * Enforces valid session and populates context.session
 * 
 * @param options - Configuration options
 */
export function authMiddleware(options?: {
  /** Require specific role */
  requiredRole?: string;
}): Middleware {
  return async (context, next) => {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return unauthorizedResponse('Authentication required');
    }

    // Check role requirement
    if (options?.requiredRole && session.user.role !== options.requiredRole) {
      return errorResponse('Insufficient permissions', 403, {
        code: 'FORBIDDEN',
      });
    }

    // Populate context
    context.session = session;

    // Update request context with user info
    updateContext({
      userId: session.user.id,
      userRole: session.user.role,
      storeId: session.user.storeId,
    });

    return next();
  };
}

/**
 * Rate limiting middleware
 * Uses simple in-memory rate limiter (100 req/min per IP)
 * 
 * @param options - Configuration options
 */
export function rateLimitMiddleware(options?: {
  /** Requests per minute (default: 100) */
  limit?: number;
}): Middleware {
  return async (context, next) => {
    const ip = context.request.ip || 
               context.request.headers.get('x-forwarded-for')?.split(',')[0] || 
               'unknown';
    
    const identifier = context.session?.user?.id 
      ? `user:${context.session.user.id}` 
      : `ip:${ip}`;

    const result = await checkSimpleRateLimit(identifier);

    if (!result.success) {
      return errorResponse('Too many requests', 429, {
        code: 'RATE_LIMIT_EXCEEDED',
        details: {
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        },
      });
    }

    // Add rate limit headers to response
    const response = await next();
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.reset.toString());

    return response;
  };
}

/**
 * Request validation middleware
 * Validates request body against Zod schema
 * 
 * @param schema - Zod schema to validate against
 */
export function validationMiddleware<T>(schema: ZodSchema<T>): Middleware {
  return async (context, next) => {
    try {
      // Parse request body
      const body = await context.request.json();
      
      // Validate with Zod
      const result = schema.safeParse(body);

      if (!result.success) {
        return validationErrorResponse('Validation failed', result.error.flatten());
      }

      // Store validated body in context
      context.body = result.data;

      return next();
    } catch (error) {
      if (error instanceof SyntaxError) {
        return validationErrorResponse('Invalid JSON in request body');
      }
      throw error;
    }
  };
}

/**
 * Logging middleware
 * Logs request and response details
 * 
 * @param options - Configuration options
 */
export function loggingMiddleware(options?: {
  /** Include request body in logs (default: false) */
  logBody?: boolean;
  /** Include response body in logs (default: false) */
  logResponse?: boolean;
}): Middleware {
  return async (context, next) => {
    const startTime = Date.now();
    const { method, url } = context.request;
    const requestId = getRequestId();

    // Log request
    console.log(`[${requestId}] ${method} ${url} - Request started`);

    if (options?.logBody && context.body) {
      console.log(`[${requestId}] Request body:`, context.body);
    }

    try {
      const response = await next();
      const duration = Date.now() - startTime;

      // Log response
      console.log(
        `[${requestId}] ${method} ${url} - ${response.status} (${duration}ms)`
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `[${requestId}] ${method} ${url} - Error (${duration}ms)`,
        error
      );
      throw error;
    }
  };
}

/**
 * Tenant scoping middleware
 * Ensures storeId is present and updates context
 * 
 * @param options - Configuration options
 */
export function tenantMiddleware(options?: {
  /** Allow requests without storeId (default: false) */
  optional?: boolean;
}): Middleware {
  return async (context, next) => {
    // Get storeId from session
    const storeId = context.session?.user?.storeId;

    if (!storeId && !options?.optional) {
      return errorResponse('Store context required', 400, {
        code: 'MISSING_STORE_CONTEXT',
      });
    }

    if (storeId) {
      context.storeId = storeId;
      updateContext({ storeId });
    }

    return next();
  };
}

/**
 * CORS middleware
 * Adds CORS headers to response
 * 
 * @param options - CORS configuration
 */
export function corsMiddleware(options?: {
  /** Allowed origins (default: * in dev, specific in prod) */
  origin?: string | string[];
  /** Allowed methods (default: GET, POST, PUT, PATCH, DELETE) */
  methods?: string[];
  /** Allowed headers */
  headers?: string[];
  /** Allow credentials (default: true) */
  credentials?: boolean;
}): Middleware {
  return async (context, next) => {
    const response = await next();

    // Set CORS headers
    const origin = Array.isArray(options?.origin) 
      ? options.origin[0] 
      : options?.origin || '*';
    
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set(
      'Access-Control-Allow-Methods', 
      options?.methods?.join(', ') || 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      options?.headers?.join(', ') || 'Content-Type, Authorization, X-Request-Id'
    );
    
    if (options?.credentials !== false) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  };
}

/**
 * Common middleware stacks for different route types
 */
export const middlewareStacks = {
  /** Public API routes (no auth, with rate limiting) */
  public: [
    requestIdMiddleware(),
    rateLimitMiddleware(),
    loggingMiddleware(),
  ],

  /** Authenticated API routes (auth + rate limiting) */
  authenticated: [
    requestIdMiddleware(),
    authMiddleware(),
    tenantMiddleware(),
    rateLimitMiddleware(),
    loggingMiddleware(),
  ],

  /** Admin API routes (auth + role check) */
  admin: [
    requestIdMiddleware(),
    authMiddleware({ requiredRole: 'Admin' }),
    tenantMiddleware(),
    rateLimitMiddleware(),
    loggingMiddleware(),
  ],

  /** Super admin API routes (cross-tenant access) */
  superAdmin: [
    requestIdMiddleware(),
    authMiddleware({ requiredRole: 'SuperAdmin' }),
    rateLimitMiddleware(),
    loggingMiddleware(),
  ],
};

/**
 * Re-export commonly used functions
 */
export {
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  successResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
} from '@/lib/api-response';
