/**
 * Audit Middleware - Automatic audit logging for API requests
 * 
 * Provides utilities to automatically log all API mutations (POST, PUT, PATCH, DELETE)
 * with user context, IP address, and request metadata.
 * 
 * @module lib/audit-middleware
 */

import { AuditLogService } from '@/services/audit-log-service';
import type { NextRequest } from 'next/server';

/**
 * Options for audit logging
 */
export interface AuditLogOptions {
  /** Action being performed (default: HTTP method) */
  action?: string;
  /** Type of entity being affected */
  entityType: string;
  /** ID of the entity being affected */
  entityId: string;
  /** ID of the store for multi-tenant context */
  storeId?: string;
  /** ID of the user performing the action */
  userId?: string;
  /** Changes being made (for UPDATE operations) */
  changes?: Record<string, { old: unknown; new: unknown }>;
}

/**
 * Extract request metadata from NextRequest
 * 
 * @param request - Next.js request object
 * @returns Request metadata (IP address, user agent)
 */
export function extractRequestMetadata(request: NextRequest) {
  // Get IP address from headers (considering proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded 
    ? forwarded.split(',')[0].trim() 
    : request.headers.get('x-real-ip') || 'unknown';

  // Get user agent
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return {
    ipAddress,
    userAgent,
  };
}

/**
 * Map HTTP method to audit action
 * 
 * @param method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @returns Audit action (CREATE, UPDATE, DELETE)
 */
export function mapMethodToAction(method: string): string {
  const methodMap: Record<string, string> = {
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
  };

  return methodMap[method.toUpperCase()] || method.toUpperCase();
}

/**
 * Log API mutation to audit log
 * 
 * Automatically captures request metadata (IP, user agent) and logs the operation.
 * Should be called after successful API mutations.
 * 
 * @param request - Next.js request object
 * @param options - Audit log options
 * @returns Promise resolving when audit log is created
 * 
 * @example
 * ```typescript
 * // In API route handler
 * export async function POST(request: NextRequest) {
 *   const session = await getSession(request);
 *   const body = await request.json();
 *   
 *   // Create product
 *   const product = await prisma.product.create({ data: body });
 *   
 *   // Log audit trail
 *   await logAuditTrail(request, {
 *     entityType: 'Product',
 *     entityId: product.id,
 *     storeId: session.storeId,
 *     userId: session.userId,
 *   });
 *   
 *   return NextResponse.json({ data: product });
 * }
 * ```
 */
export async function logAuditTrail(
  request: NextRequest,
  options: AuditLogOptions
): Promise<void> {
  try {
    const { action, entityType, entityId, storeId, userId, changes } = options;

    // Extract request metadata
    const metadata = extractRequestMetadata(request);

    // Determine action (use provided or map from HTTP method)
    const auditAction = action || mapMethodToAction(request.method);

    // Create audit log entry
    await AuditLogService.create(auditAction, entityType, entityId, {
      storeId,
      userId,
      changes,
      metadata,
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Middleware wrapper to automatically log API mutations
 * 
 * Wraps a Next.js API route handler and automatically logs mutations.
 * Only logs POST, PUT, PATCH, DELETE requests that return 200/201 status.
 * 
 * @param handler - Original API route handler
 * @param getAuditContext - Function to extract audit context from request/response
 * @returns Wrapped handler with automatic audit logging
 * 
 * @example
 * ```typescript
 * // In API route
 * const handler = async (request: NextRequest) => {
 *   // Your route logic here
 *   const product = await createProduct(data);
 *   return NextResponse.json({ data: product });
 * };
 * 
 * export const POST = withAuditLog(handler, async (request, response) => ({
 *   entityType: 'Product',
 *   entityId: response.data.id,
 *   storeId: await getStoreId(request),
 *   userId: await getUserId(request),
 * }));
 * ```
 */
export function withAuditLog<T>(
  handler: (request: NextRequest, context?: T) => Promise<Response>,
  getAuditContext: (
    request: NextRequest,
    response: Response
  ) => Promise<Omit<AuditLogOptions, 'action'>>
) {
  return async (request: NextRequest, context?: T): Promise<Response> => {
    // Execute original handler
    const response = await handler(request, context);

    // Only log mutations (POST, PUT, PATCH, DELETE)
    const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!mutationMethods.includes(request.method)) {
      return response;
    }

    // Only log successful operations (2xx status codes)
    if (!response.ok) {
      return response;
    }

    // Extract audit context and log
    try {
      const auditContext = await getAuditContext(request, response);
      await logAuditTrail(request, auditContext);
    } catch (error) {
      // Log error but don't affect the response
      console.error('Failed to log audit trail:', error);
    }

    return response;
  };
}

/**
 * Check if request method should be audited
 * 
 * @param method - HTTP method
 * @returns True if method should be audited
 */
export function shouldAudit(method: string): boolean {
  const auditableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  return auditableMethods.includes(method.toUpperCase());
}
