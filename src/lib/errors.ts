/**
 * Error Class Hierarchy
 * 
 * Typed error classes for consistent error handling and HTTP status mapping.
 * All errors extend BaseError with code, HTTP status, and optional details.
 * 
 * @module errors
 */

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class BaseError extends Error {
  /** Error code for client-side handling (e.g., VALIDATION_ERROR) */
  public readonly code: string;
  
  /** HTTP status code to return */
  public readonly httpStatus: number;
  
  /** Additional error details (validation errors, debug info) */
  public readonly details?: unknown;
  
  /** Timestamp when error was created */
  public readonly timestamp: Date;

  constructor(
    code: string,
    message: string,
    httpStatus: number,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    this.timestamp = new Date();
    
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON response format
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

/**
 * Validation error (400 Bad Request)
 * Used for invalid input, schema validation failures
 */
export class ValidationError extends BaseError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

/**
 * Authentication error (401 Unauthorized)
 * Used when user is not authenticated
 */
export class AuthenticationError extends BaseError {
  constructor(message = 'Authentication required') {
    super('AUTHENTICATION_ERROR', message, 401);
  }
}

/**
 * Authorization error (403 Forbidden)
 * Used when user is authenticated but lacks permission
 */
export class AuthorizationError extends BaseError {
  constructor(message = 'Insufficient permissions') {
    super('AUTHORIZATION_ERROR', message, 403);
  }
}

/**
 * Not found error (404 Not Found)
 * Used when requested resource doesn't exist
 */
export class NotFoundError extends BaseError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super('NOT_FOUND', message, 404);
  }
}

/**
 * Conflict error (409 Conflict)
 * Used for duplicate records, concurrent modification conflicts
 */
export class ConflictError extends BaseError {
  constructor(message: string, details?: unknown) {
    super('CONFLICT', message, 409, details);
  }
}

/**
 * Rate limit error (429 Too Many Requests)
 * Used when rate limit is exceeded
 */
export class RateLimitError extends BaseError {
  public readonly retryAfter?: number;

  constructor(message = 'Too many requests', retryAfter?: number) {
    super('RATE_LIMIT_EXCEEDED', message, 429, { retryAfter });
    this.retryAfter = retryAfter;
  }
}

/**
 * Unprocessable entity error (422 Unprocessable Entity)
 * Used for semantic errors (valid syntax but invalid business logic)
 */
export class UnprocessableEntityError extends BaseError {
  constructor(message: string, details?: unknown) {
    super('UNPROCESSABLE_ENTITY', message, 422, details);
  }
}

/**
 * Internal server error (500 Internal Server Error)
 * Used for unexpected errors, system failures
 */
export class InternalError extends BaseError {
  constructor(message = 'An unexpected error occurred', details?: unknown) {
    // Don't expose internal details in production
    const safeDetails = process.env.NODE_ENV === 'development' ? details : undefined;
    super('INTERNAL_ERROR', message, 500, safeDetails);
  }
}

/**
 * Payment error (402 Payment Required)
 * Used for payment validation/processing failures
 */
export class PaymentError extends BaseError {
  constructor(message: string, details?: unknown) {
    super('PAYMENT_ERROR', message, 402, details);
  }
}

/**
 * Type guard to check if error is a BaseError
 */
export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

/**
 * Map unknown errors to BaseError instances
 * Used in catch blocks to ensure consistent error handling
 */
export function normalizeError(error: unknown): BaseError {
  if (isBaseError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalError(error.message, {
      originalError: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }

  return new InternalError('An unknown error occurred', {
    error: String(error),
  });
}
