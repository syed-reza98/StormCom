/**
 * Request Context Management
 * 
 * Provides AsyncLocalStorage-based context propagation for:
 * - Request correlation IDs (X-Request-Id)
 * - Resolved store IDs (multi-tenant context)
 * - User session data
 * 
 * @module request-context
 */

import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

export interface RequestContext {
  /** Unique correlation ID for request tracing */
  requestId: string;
  /** Resolved store ID for multi-tenant isolation */
  storeId?: string;
  /** User ID from authenticated session */
  userId?: string;
  /** User role for authorization checks */
  userRole?: string;
}

/**
 * AsyncLocalStorage instance for request context
 * Maintains context across async operations
 */
const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Get the current request context
 * @returns Current context or undefined if not in a request scope
 */
export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

/**
 * Get the request ID from current context
 * @returns Request ID or generates a new one if not in context
 */
export function getRequestId(): string {
  const context = getRequestContext();
  return context?.requestId ?? randomUUID();
}

/**
 * Get the store ID from current context
 * @throws Error if store ID is not set (multi-tenant violation)
 */
export function getStoreId(): string {
  const context = getRequestContext();
  if (!context?.storeId) {
    throw new Error('Store ID not set in request context - multi-tenant isolation violation');
  }
  return context.storeId;
}

/**
 * Get the store ID from current context (safe variant)
 * @returns Store ID or undefined if not set
 */
export function getStoreIdSafe(): string | undefined {
  const context = getRequestContext();
  return context?.storeId;
}

/**
 * Run a function with request context
 * Used by proxy/middleware to seed context for each request
 * 
 * @param context - Initial context values
 * @param fn - Function to execute with context
 * @returns Result of the function
 */
export function runWithContext<T>(
  context: RequestContext,
  fn: () => T
): T {
  return requestContextStorage.run(context, fn);
}

/**
 * Update the current request context
 * Used to set storeId after resolution or add user info after auth
 * 
 * @param updates - Partial context updates to merge
 */
export function updateContext(updates: Partial<RequestContext>): void {
  const current = getRequestContext();
  if (!current) {
    throw new Error('Cannot update context outside of request scope');
  }
  
  // Merge updates into current context
  Object.assign(current, updates);
}

/**
 * Generate a new request ID
 * @returns UUID v4 string
 */
export function generateRequestId(): string {
  return randomUUID();
}
