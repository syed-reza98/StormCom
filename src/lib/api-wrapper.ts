/**
 * Standard API Route Wrapper
 * Provides consistent error handling, rate limiting, and tenant scoping
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext, RequestContext } from './request-context';
import { rateLimit } from './rate-limit';
import { handleApiError } from './errors';
import { clearTenantContext } from './middleware/tenantIsolation';

export interface ApiHandlerOptions {
  /** Require authentication */
  requireAuth?: boolean;
  /** Require specific role(s) */
  requireRole?: string | string[];
  /** Require store context */
  requireStore?: boolean;
  /** Enable rate limiting */
  rateLimit?: boolean;
  /** Rate limit tier (defaults to FREE) */
  rateLimitTier?: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
}

export type ApiHandler = (
  request: NextRequest,
  context: RequestContext,
  params?: any
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap API route handler with standard middleware
 */
export function apiWrapper(handler: ApiHandler, options: ApiHandlerOptions = {}) {
  return async (request: NextRequest, routeContext?: { params: any }) => {
    try {
      // 1. Rate limiting
      if (options.rateLimit !== false) {
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const tier = options.rateLimitTier || 'FREE';

        const rateLimitResult = await rateLimit(ip, tier);

        if (!rateLimitResult.success) {
          return NextResponse.json(
            {
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later.',
              },
            },
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': rateLimitResult.reset.toString(),
                'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
              },
            }
          );
        }
      }

      // 2. Get request context (handles authentication)
      const context = await getRequestContext();

      // 3. Check authentication requirement
      if (options.requireAuth && !context.isAuthenticated) {
        return NextResponse.json(
          {
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          },
          { status: 401 }
        );
      }

      // 4. Check role requirement
      if (options.requireRole) {
        const roles = Array.isArray(options.requireRole) ? options.requireRole : [options.requireRole];

        if (!context.user || !roles.includes(context.user.role)) {
          return NextResponse.json(
            {
              error: {
                code: 'FORBIDDEN',
                message: `Required role: ${roles.join(' or ')}`,
              },
            },
            { status: 403 }
          );
        }
      }

      // 5. Check store context requirement
      if (options.requireStore && !context.storeId) {
        return NextResponse.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'Store context required',
            },
          },
          { status: 403 }
        );
      }

      // 6. Execute handler
      const response = await handler(request, context, routeContext?.params);

      // 7. Clear tenant context after request
      clearTenantContext();

      return response;
    } catch (error) {
      // Clear tenant context on error
      clearTenantContext();

      // Handle errors consistently
      return handleApiError(error);
    }
  };
}

/**
 * Helper to create a standard success response
 */
export function successResponse<T>(data: T, message?: string, meta?: any): NextResponse {
  return NextResponse.json({
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  });
}

/**
 * Helper to create a standard error response
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(process.env.NODE_ENV === 'development' && details && { details }),
      },
    },
    { status }
  );
}

/**
 * Helper to create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  perPage: number,
  total: number
): NextResponse {
  return NextResponse.json({
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  });
}

/**
 * Helper to parse pagination parameters from request
 */
export function getPaginationParams(request: NextRequest): {
  page: number;
  perPage: number;
  skip: number;
  take: number;
} {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') || '10')));

  return {
    page,
    perPage,
    skip: (page - 1) * perPage,
    take: perPage,
  };
}

/**
 * Helper to parse sort parameters from request
 */
export function getSortParams(request: NextRequest): {
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
} {
  const searchParams = request.nextUrl.searchParams;
  const sortBy = searchParams.get('sortBy') || undefined;
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  return { sortBy, sortOrder };
}
