// src/lib/error-handler.ts
// Centralized Error Handling for StormCom
// Provides consistent error responses across all API routes

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * Standard error codes
 */
export enum ErrorCode {
  // Authentication Errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  MFA_REQUIRED = 'MFA_REQUIRED',
  INVALID_MFA_CODE = 'INVALID_MFA_CODE',

  // Authorization Errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  TENANT_ISOLATION_VIOLATION = 'TENANT_ISOLATION_VIOLATION',

  // Validation Errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource Errors (404, 409)
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Business Logic Errors (422)
  INSUFFICIENT_INVENTORY = 'INSUFFICIENT_INVENTORY',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  ORDER_CANNOT_BE_CANCELLED = 'ORDER_CANNOT_BE_CANCELLED',
  SUBSCRIPTION_LIMIT_REACHED = 'SUBSCRIPTION_LIMIT_REACHED',

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server Errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * Application error class
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp?: string;
    path?: string;
  };
}

/**
 * Handle Zod validation errors
 */
function handleZodError(error: ZodError): ErrorResponse {
  return {
    error: {
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation failed',
      details: error.flatten().fieldErrors,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Handle Prisma errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): ErrorResponse {
  // P2002: Unique constraint violation
  if (error.code === 'P2002') {
    const fields = (error.meta?.target as string[]) || [];
    return {
      error: {
        code: ErrorCode.ALREADY_EXISTS,
        message: `Resource already exists with the same ${fields.join(', ')}`,
        details: JSON.stringify({ fields }),
        timestamp: new Date().toISOString(),
      },
    };
  }

  // P2025: Record not found
  if (error.code === 'P2025') {
    return {
      error: {
        code: ErrorCode.NOT_FOUND,
        message: 'Resource not found',
        timestamp: new Date().toISOString(),
      },
    };
  }

  // P2003: Foreign key constraint violation
  if (error.code === 'P2003') {
    return {
      error: {
        code: ErrorCode.CONFLICT,
        message: 'Cannot perform operation due to related records',
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Generic Prisma error
  return {
    error: {
      code: ErrorCode.DATABASE_ERROR,
      message: 'Database operation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Handle application errors
 */
function handleAppError(error: AppError): ErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Handle unknown errors
 */
function handleUnknownError(error: Error): ErrorResponse {
  // Log the error for debugging
  console.error('[Error Handler] Unknown error:', error);

  return {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Main error handler - converts all errors to consistent API responses
 */
export function handleError(error: unknown, path?: string): NextResponse<ErrorResponse> {
  let errorResponse: ErrorResponse;
  let statusCode = 500;

  // Determine error type and build response
  if (error instanceof AppError) {
    errorResponse = handleAppError(error);
    statusCode = error.statusCode;
  } else if (error instanceof ZodError) {
    errorResponse = handleZodError(error);
    statusCode = 400;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    errorResponse = handlePrismaError(error);
    statusCode = error.code === 'P2025' ? 404 : error.code === 'P2002' ? 409 : 500;
  } else if (error instanceof Error) {
    errorResponse = handleUnknownError(error);
    statusCode = 500;
  } else {
    errorResponse = {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
    };
    statusCode = 500;
  }

  // Add path if provided
  if (path) {
    errorResponse.error.path = path;
  }

  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Convenience error classes for common HTTP errors
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(ErrorCode.NOT_FOUND, message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(ErrorCode.UNAUTHORIZED, message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(ErrorCode.FORBIDDEN, message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorCode.CONFLICT, message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, message, 429);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(ErrorCode.INTERNAL_ERROR, message, 500, details);
  }
}

/**
 * Create common application errors (factory functions)
 */
export const createError = {
  unauthorized: (message = 'Not authenticated'): AppError =>
    new UnauthorizedError(message),

  forbidden: (message = 'Access denied'): AppError =>
    new ForbiddenError(message),

  notFound: (resource = 'Resource'): AppError =>
    new NotFoundError(`${resource} not found`),

  alreadyExists: (resource = 'Resource'): AppError =>
    new AppError(ErrorCode.ALREADY_EXISTS, `${resource} already exists`, 409),

  validation: (message = 'Validation failed', details?: unknown): AppError =>
    new ValidationError(message, details),

  rateLimitExceeded: (message = 'Too many requests'): AppError =>
    new RateLimitError(message),

  internal: (message = 'Internal server error', details?: unknown): AppError =>
    new InternalError(message, details),

  tenantIsolation: (): AppError =>
    new AppError(
      ErrorCode.TENANT_ISOLATION_VIOLATION,
      'Attempted to access resources from another tenant',
      403
    ),

  insufficientInventory: (product: string): AppError =>
    new AppError(
      ErrorCode.INSUFFICIENT_INVENTORY,
      `Insufficient inventory for ${product}`,
      422
    ),

  subscriptionLimit: (feature: string, limit: number): AppError =>
    new AppError(
      ErrorCode.SUBSCRIPTION_LIMIT_REACHED,
      `Subscription plan limit reached for ${feature} (limit: ${limit})`,
      422
    ),
};
