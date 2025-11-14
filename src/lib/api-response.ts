// src/lib/api-response.ts
// Standardized API Response Formatting for StormCom
// Ensures consistent response structure across all API routes
// Updated for FR-008, FR-021: Standardized responses with X-Request-Id header

import { NextResponse } from 'next/server';
import { getRequestId } from './request-context';
import { BaseError, isBaseError, normalizeError } from './errors';

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Success response format (FR-008)
 * Format: { data, meta?, message? }
 * NO success: true flag
 */
export interface SuccessResponse<T = unknown> {
  data: T;
  message?: string;
  meta?: PaginationMeta | Record<string, unknown>;
}

/**
 * Error response format (FR-008)
 * Format: { error: { code, message, details? } }
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Create a success response with X-Request-Id header (FR-021)
 */
export function successResponse<T>(
  data: T,
  options?: {
    message?: string;
    meta?: PaginationMeta | Record<string, unknown>;
    status?: number;
  }
): NextResponse<SuccessResponse<T>> {
  const response: SuccessResponse<T> = {
    data,
    ...(options?.message && { message: options.message }),
    ...(options?.meta && { meta: options.meta }),
  };

  return NextResponse.json(response, {
    status: options?.status || 200,
    headers: {
      'X-Request-Id': getRequestId(),
    },
  });
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    perPage: number;
    total: number;
  },
  options?: {
    message?: string;
    status?: number;
  }
): NextResponse<SuccessResponse<T[]>> {
  const totalPages = Math.ceil(pagination.total / pagination.perPage);

  const meta: PaginationMeta = {
    page: pagination.page,
    perPage: pagination.perPage,
    total: pagination.total,
    totalPages,
    hasNextPage: pagination.page < totalPages,
    hasPreviousPage: pagination.page > 1,
  };

  return successResponse(data, {
    message: options?.message,
    meta,
    status: options?.status || 200,
  });
}

/**
 * Create a created (201) response
 */
export function createdResponse<T>(
  data: T,
  message?: string
): NextResponse<SuccessResponse<T>> {
  return successResponse(data, {
    message: message || 'Resource created successfully',
    status: 201,
  });
}

/**
 * Create a no content (204) response with X-Request-Id header
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { 
    status: 204,
    headers: {
      'X-Request-Id': getRequestId(),
    },
  });
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  perPage: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.min(
    100, // Maximum 100 items per page
    Math.max(1, parseInt(searchParams.get('perPage') || '10', 10))
  );
  const skip = (page - 1) * perPage;

  return { page, perPage, skip };
}

/**
 * Parse sort parameters from URL search params
 */
export function parseSortParams(
  searchParams: URLSearchParams,
  allowedFields: string[],
  defaultField = 'createdAt',
  defaultOrder: 'asc' | 'desc' = 'desc'
): {
  field: string;
  order: 'asc' | 'desc';
} {
  const sortBy = searchParams.get('sortBy') || defaultField;
  const sortOrder = searchParams.get('sortOrder') || defaultOrder;

  // Validate sortBy is in allowed fields
  const field = allowedFields.includes(sortBy) ? sortBy : defaultField;
  const order = sortOrder === 'asc' ? 'asc' : 'desc';

  return { field, order };
}

/**
 * Parse filter parameters from URL search params
 */
export function parseFilterParams(
  searchParams: URLSearchParams,
  allowedFilters: string[]
): Record<string, string> {
  const filters: Record<string, string> = {};

  for (const filter of allowedFilters) {
    const value = searchParams.get(filter);
    if (value) {
      filters[filter] = value;
    }
  }

  return filters;
}

/**
 * Parse search query parameter
 */
export function parseSearchParam(searchParams: URLSearchParams): string | null {
  return searchParams.get('q') || searchParams.get('search') || null;
}

/**
 * Create Prisma orderBy object from sort params
 */
export function createOrderBy(
  field: string,
  order: 'asc' | 'desc'
): Record<string, 'asc' | 'desc'> {
  return { [field]: order };
}

/**
 * Create Prisma where clause from filters
 */
export function createWhereClause(
  filters: Record<string, string | number | boolean>,
  searchFields?: string[],
  searchQuery?: string | null
): Record<string, unknown> {
  const where: Record<string, unknown> = { ...filters };

  // Add search conditions if provided
  if (searchQuery && searchFields && searchFields.length > 0) {
    where.OR = searchFields.map(field => ({
      [field]: {
        contains: searchQuery,
        mode: 'insensitive', // Case-insensitive search
      },
    }));
  }

  return where;
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(page: number, perPage: number): void {
  if (page < 1) {
    throw new Error('Page must be >= 1');
  }
  if (perPage < 1 || perPage > 100) {
    throw new Error('perPage must be between 1 and 100');
  }
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  page: number,
  perPage: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / perPage);

  return {
    page,
    perPage,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Create an error response with X-Request-Id header (FR-008, FR-021)
 * Integrates with typed error classes from ./errors.ts
 */
export function errorResponse(
  error: unknown | string,
  statusCode?: number,
  options?: {
    code?: string;
    details?: unknown;
  }
): NextResponse<ErrorResponse> {
  // Handle different error input types
  let normalizedError: BaseError;
  
  if (typeof error === 'string') {
    // String message with optional status code
    normalizedError = {
      code: options?.code || getErrorCodeFromStatus(statusCode || 500),
      message: error,
      httpStatus: statusCode || 500,
      details: options?.details,
    } as BaseError;
  } else if (isBaseError(error)) {
    // Already a BaseError instance
    normalizedError = error;
  } else {
    // Unknown error type - normalize it
    normalizedError = normalizeError(error);
  }

  const responseBody: ErrorResponse = {
    error: {
      code: normalizedError.code,
      message: normalizedError.message,
      ...(normalizedError.details ? { details: normalizedError.details } : {}),
    },
  };

  const headers: HeadersInit = {
    'X-Request-Id': getRequestId(),
  };

  // Add Retry-After header for rate limit errors
  if (normalizedError.code === 'RATE_LIMIT_EXCEEDED' && normalizedError.details) {
    const details = normalizedError.details as { retryAfter?: number };
    if (details.retryAfter) {
      headers['Retry-After'] = String(details.retryAfter);
    }
  }

  return NextResponse.json(responseBody, { 
    status: normalizedError.httpStatus,
    headers,
  });
}

/**
 * Get error code from HTTP status
 */
function getErrorCodeFromStatus(status: number): string {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'ALREADY_EXISTS';
    case 422:
      return 'UNPROCESSABLE_ENTITY';
    case 429:
      return 'RATE_LIMIT_EXCEEDED';
    case 500:
      return 'INTERNAL_ERROR';
    default:
      return 'ERROR';
  }
}

/**
 * Create an unauthorized (401) response
 */
export function unauthorizedResponse(
  message = 'Unauthorized'
): NextResponse<ErrorResponse> {
  return errorResponse(message, 401);
}

/**
 * Create a forbidden (403) response
 */
export function forbiddenResponse(
  message = 'Insufficient permissions to access this resource'
): NextResponse<ErrorResponse> {
  return errorResponse(message, 403);
}

/**
 * Create a not found (404) response
 */
export function notFoundResponse(
  message = 'Resource not found'
): NextResponse<ErrorResponse> {
  return errorResponse(message, 404);
}

/**
 * Create a bad request (400) response
 */
export function badRequestResponse(
  message: string,
  details?: unknown
): NextResponse<ErrorResponse> {
  return errorResponse(message, 400, { details });
}

/**
 * Create a validation error (400) response
 */
export function validationErrorResponse(
  message = 'Validation failed',
  details?: unknown
): NextResponse<ErrorResponse> {
  return errorResponse(message, 400, {
    code: 'VALIDATION_ERROR',
    details,
  });
}

/**
 * Create an unprocessable entity (422) response
 */
export function unprocessableEntityResponse(
  message: string
): NextResponse<ErrorResponse> {
  return errorResponse(message, 422);
}

/**
 * Create an internal server error (500) response
 */
export function internalServerErrorResponse(
  message = 'Internal server error',
  details?: unknown
): NextResponse<ErrorResponse> {
  return errorResponse(message, 500, { details });
}

/**
 * Common API response helpers
 */
export const apiResponse = {
  // Success responses
  success: successResponse,
  created: createdResponse,
  noContent: noContentResponse,
  paginated: paginatedResponse,

  // Error responses
  error: errorResponse,
  unauthorized: unauthorizedResponse,
  forbidden: forbiddenResponse,
  notFound: notFoundResponse,
  badRequest: badRequestResponse,
  validationError: validationErrorResponse,
  unprocessableEntity: unprocessableEntityResponse,
  internalServerError: internalServerErrorResponse,
};
