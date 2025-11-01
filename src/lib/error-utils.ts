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
