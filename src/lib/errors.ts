/**
 * API Error Handling Utilities
 *
 * Provides standardized error classes and error handler for API routes.
 * All errors extend AppError for consistent error responses.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(
      message || `${service} service unavailable`,
      503,
      'EXTERNAL_SERVICE_ERROR'
    );
    this.name = 'ExternalServiceError';
  }
}

/**
 * Error Handler for API Routes
 *
 * Converts errors to standardized response format:
 * { error: { code, message, details? } }
 *
 * @param error - Error object
 * @returns Response object with error details
 */
export function handleApiError(error: unknown): {
  statusCode: number;
  body: {
    error: {
      code: string;
      message: string;
      details?: any;
    };
  };
} {
  // Known AppError
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details && process.env.NODE_ENV === 'development'
            ? { details: error.details }
            : {}),
        },
      },
    };
  }

  // Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: any };

    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return {
        statusCode: 409,
        body: {
          error: {
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
            message: 'Resource already exists',
            ...(process.env.NODE_ENV === 'development'
              ? { details: prismaError.meta }
              : {}),
          },
        },
      };
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      return {
        statusCode: 404,
        body: {
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found',
          },
        },
      };
    }
  }

  // Unknown error
  console.error('Unexpected error:', error);

  return {
    statusCode: 500,
    body: {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && error instanceof Error
          ? { details: error.message }
          : {}),
      },
    },
  };
}
