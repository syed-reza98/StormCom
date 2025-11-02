/**
 * Error Handling Utility Functions
 */

/**
 * Extract error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

/**
 * Check if error is a specific type
 */
export function isValidationError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ValidationError';
}

/**
 * Create error response
 */
export function createErrorResponse(message: string, code = 'INTERNAL_ERROR') {
  return {
    error: {
      code,
      message,
    },
  };
}

/**
 * Log error with context
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  console.error('Error:', getErrorMessage(error), context || {});
}

/**
 * Handle API errors consistently (wrapper used by routes/tests)
 */
export function handleApiError(error: unknown, options?: { log?: boolean } ) {
  if (options?.log ?? true) logError(error);
  return createErrorResponse(getErrorMessage(error));
}

/**
 * Retry helper with exponential backoff for transient operations
 */
export async function retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 200): Promise<T> {
  let attempt = 0;
  let lastError: any;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, delay * Math.pow(2, attempt)));
      attempt++;
    }
  }
  throw lastError;
}
