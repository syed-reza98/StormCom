import { NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { initializeRequestContext, getRequestContext } from './request-context';
import { checkStoreRateLimit, checkIpRateLimit, getClientIp, getRateLimitHeaders } from './rate-limit';
import { hasPermission } from './rbac';
import type { ApiResponse, ApiError } from '../types';

/**
 * Simple error handler (converts errors to ApiError format).
 */
function handleError(error: unknown): ApiError {
  if (error instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: error.message,
      statusCode: 500,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    statusCode: 500,
  };
}

/**
 * API handler options.
 */
export interface ApiHandlerOptions<TBody = any, TQuery = any, TParams = any> {
  /**
   * Zod schema for request body validation (POST/PUT/PATCH).
   */
  bodySchema?: ZodSchema<TBody>;

  /**
   * Zod schema for query parameters validation (GET).
   */
  querySchema?: ZodSchema<TQuery>;

  /**
   * Zod schema for URL parameters validation (e.g., /api/products/[id]).
   */
  paramsSchema?: ZodSchema<TParams>;

  /**
   * Required permission (enforces RBAC).
   */
  permission?: string;

  /**
   * Multiple permissions (user must have at least one).
   */
  anyPermissions?: string[];

  /**
   * Multiple permissions (user must have all).
   */
  allPermissions?: string[];

  /**
   * Require authentication (default: true).
   */
  requireAuth?: boolean;

  /**
   * Require store context (default: true for authenticated routes).
   */
  requireStore?: boolean;

  /**
   * Enable rate limiting (default: true).
   */
  rateLimit?: boolean;

  /**
   * Custom rate limit (overrides plan-based rate limit).
   */
  rateLimitOverride?: number;

  /**
   * Allow unauthenticated requests (public API).
   */
  public?: boolean;
}

/**
 * Validated API handler context.
 */
export interface ApiHandlerContext<TBody = any, TQuery = any, TParams = any> {
  /**
   * Validated request body (POST/PUT/PATCH).
   */
  body?: TBody;

  /**
   * Validated query parameters (GET).
   */
  query?: TQuery;

  /**
   * Validated URL parameters (e.g., { id: '123' }).
   */
  params?: TParams;

  /**
   * User ID (from JWT).
   */
  userId: string;

  /**
   * Store ID (from request context).
   */
  storeId: string;

  /**
   * Whether user is a super admin.
   */
  isSuperAdmin: boolean;

  /**
   * Original Next.js request object.
   */
  request: Request;
}

/**
 * API route handler function.
 */
export type ApiHandlerFunction<TBody = any, TQuery = any, TParams = any, TResponse = any> = (
  context: ApiHandlerContext<TBody, TQuery, TParams>
) => Promise<TResponse> | TResponse;

/**
 * Create a standardized API route handler.
 * 
 * This wrapper:
 * 1. Initializes request context (AsyncLocalStorage for tenant isolation)
 * 2. Validates request (body/query/params with Zod)
 * 3. Enforces authentication (requires user + store)
 * 4. Checks rate limits (per subscription plan or IP)
 * 5. Enforces RBAC permissions
 * 6. Calls your handler with validated context
 * 7. Formats response (success/error with proper HTTP status)
 * 8. Handles errors (catches and formats errors)
 * 
 * @param handler - Your API route logic
 * @param options - Validation, auth, and RBAC options
 * @returns Next.js route handler (POST/GET/PUT/DELETE)
 * 
 * @example
 * // POST /api/products
 * export const POST = createApiHandler(
 *   async ({ body, storeId }) => {
 *     const product = await createProduct(storeId, body);
 *     return { data: product };
 *   },
 *   {
 *     bodySchema: CreateProductSchema,
 *     permission: PERMISSIONS.PRODUCTS.CREATE,
 *   }
 * );
 * 
 * @example
 * // GET /api/products
 * export const GET = createApiHandler(
 *   async ({ query, storeId }) => {
 *     const products = await getProducts(storeId, query);
 *     return { data: products };
 *   },
 *   {
 *     querySchema: PaginationSchema,
 *     permission: PERMISSIONS.PRODUCTS.VIEW,
 *   }
 * );
 */
export function createApiHandler<TBody = any, TQuery = any, TParams = any, TResponse = any>(
  handler: ApiHandlerFunction<TBody, TQuery, TParams, TResponse>,
  options: ApiHandlerOptions<TBody, TQuery, TParams> = {}
): (request: Request, routeContext?: { params?: Promise<TParams> }) => Promise<NextResponse<ApiResponse<TResponse>>> {
  const {
    bodySchema,
    querySchema,
    paramsSchema,
    permission,
    anyPermissions,
    allPermissions,
    requireAuth = true,
    requireStore = true,
    rateLimit = true,
    rateLimitOverride,
    public: isPublic = false,
  } = options;

  return async (request: Request, routeContext?: { params?: Promise<TParams> }) => {
    try {
      // 1. Initialize request context (AsyncLocalStorage for tenant isolation)
      await initializeRequestContext(request);

      // 2. Get request context
      const context = await getRequestContext();
      const { userId, storeId, isSuperAdmin } = context;

      // 3. Validate authentication
      if (!isPublic && requireAuth && !userId) {
        return NextResponse.json(
          {
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required. Please log in.',
            },
          } as ApiResponse<never>,
          { status: 401 }
        );
      }

      // 4. Validate store context
      if (!isPublic && requireStore && !storeId && !isSuperAdmin) {
        return NextResponse.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'Store context required. Please select a store.',
            },
          } as ApiResponse<never>,
          { status: 403 }
        );
      }

      // 5. Rate limiting
      if (rateLimit) {
        let rateLimitResult;

        if (storeId && context.store?.planSlug) {
          // Store-based rate limit (uses subscription plan)
          const limit = rateLimitOverride || undefined;
          rateLimitResult = limit
            ? await checkStoreRateLimit(storeId, context.store.planSlug)
            : await checkStoreRateLimit(storeId, context.store.planSlug);
        } else {
          // IP-based rate limit (unauthenticated or no store)
          const clientIp = getClientIp(request);
          rateLimitResult = await checkIpRateLimit(clientIp, rateLimitOverride);
        }

        // Check if rate limit exceeded
        if (!rateLimitResult.success) {
          const headers = getRateLimitHeaders(rateLimitResult);
          return NextResponse.json<ApiResponse<never>>(
            {
              error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: `Rate limit exceeded. Try again in ${
                  rateLimitResult.reset - Math.floor(Date.now() / 1000)
                } seconds.`,
              },
            },
            {
              status: 429,
              headers: headers as HeadersInit,
            }
          );
        }
      }

      // 6. RBAC - Permission checks
      if (permission) {
        if (!(await hasPermission(permission, context))) {
          return NextResponse.json<ApiResponse<never>>(
            {
              error: {
                code: 'FORBIDDEN',
                message: `Permission denied. Required permission: ${permission}`,
              },
            },
            { status: 403 }
          );
        }
      }

      if (anyPermissions && anyPermissions.length > 0) {
        const hasAny = await Promise.all(
          anyPermissions.map((p) => hasPermission(p, context))
        ).then((results) => results.some((r) => r));

        if (!hasAny) {
          return NextResponse.json<ApiResponse<never>>(
            {
              error: {
                code: 'FORBIDDEN',
                message: `Permission denied. Required one of: ${anyPermissions.join(', ')}`,
              },
            },
            { status: 403 }
          );
        }
      }

      if (allPermissions && allPermissions.length > 0) {
        const hasAll = await Promise.all(
          allPermissions.map((p) => hasPermission(p, context))
        ).then((results) => results.every((r) => r));

        if (!hasAll) {
          return NextResponse.json<ApiResponse<never>>(
            {
              error: {
                code: 'FORBIDDEN',
                message: `Permission denied. Required all of: ${allPermissions.join(', ')}`,
              },
            },
            { status: 403 }
          );
        }
      }

      // 7. Validate request body (POST/PUT/PATCH)
      let body: TBody | undefined;
      if (bodySchema && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const rawBody = await request.json();
        const validation = bodySchema.safeParse(rawBody);

        if (!validation.success) {
          return NextResponse.json<ApiResponse<never>>(
            {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request body',
                details: validation.error.errors,
              },
            },
            { status: 400 }
          );
        }

        body = validation.data;
      }

      // 8. Validate query parameters (GET)
      let query: TQuery | undefined;
      if (querySchema) {
        const url = new URL(request.url);
        const rawQuery = Object.fromEntries(url.searchParams.entries());
        const validation = querySchema.safeParse(rawQuery);

        if (!validation.success) {
          return NextResponse.json<ApiResponse<never>>(
            {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid query parameters',
                details: validation.error.errors,
              },
            },
            { status: 400 }
          );
        }

        query = validation.data;
      }

      // 9. Validate URL parameters (e.g., /api/products/[id])
      let params: TParams | undefined;
      if (paramsSchema && routeContext?.params) {
        // Next.js 15: params are now async
        const resolvedParams = await routeContext.params;
        const validation = paramsSchema.safeParse(resolvedParams);

        if (!validation.success) {
          return NextResponse.json<ApiResponse<never>>(
            {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid URL parameters',
                details: validation.error.errors,
              },
            },
            { status: 400 }
          );
        }

        params = validation.data;
      }

      // 10. Call handler with validated context
      const result = await handler({
        body,
        query,
        params,
        userId: userId!,
        storeId: storeId!,
        isSuperAdmin,
        request,
      });

      // 11. Return success response
      return NextResponse.json<ApiResponse<TResponse>>(
        typeof result === 'object' && result !== null && 'data' in result
          ? (result as ApiResponse<TResponse>)
          : { data: result as TResponse },
        { status: 200 }
      );
    } catch (error) {
      // 12. Handle errors
      const errorResponse = handleError(error);
      return NextResponse.json<ApiResponse<never>>(
        { error: errorResponse },
        { status: errorResponse.statusCode || 500 }
      );
    }
  };
}

/**
 * Create a public API handler (no authentication required).
 * 
 * Useful for public endpoints like:
 * - Health checks
 * - Public product listings
 * - Authentication endpoints
 * 
 * @param handler - Your API route logic
 * @param options - Validation and rate limiting options (no RBAC)
 * @returns Next.js route handler
 */
export function createPublicApiHandler<TBody = any, TQuery = any, TParams = any, TResponse = any>(
  handler: ApiHandlerFunction<TBody, TQuery, TParams, TResponse>,
  options: Omit<ApiHandlerOptions<TBody, TQuery, TParams>, 'permission' | 'anyPermissions' | 'allPermissions' | 'requireAuth' | 'requireStore'> = {}
): (request: Request, routeContext?: { params?: Promise<TParams> }) => Promise<NextResponse<ApiResponse<TResponse>>> {
  return createApiHandler(handler, {
    ...options,
    public: true,
    requireAuth: false,
    requireStore: false,
  });
}
