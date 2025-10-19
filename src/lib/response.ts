/**
 * Standardized API Response Helpers
 *
 * Provides consistent response format for all API endpoints:
 * Success: { data, message?, meta? }
 * Error: { error: { code, message, details? } }
 */

import { NextResponse } from 'next/server';

/**
 * Success response helper
 *
 * @param data - Response data
 * @param message - Optional success message
 * @param meta - Optional metadata (pagination, etc.)
 * @param status - HTTP status code (default: 200)
 */
export function successResponse<T>(
  data: T,
  message?: string,
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
    totalPages?: number;
  },
  status: number = 200
) {
  return NextResponse.json(
    {
      data,
      ...(message && { message }),
      ...(meta && { meta }),
    },
    { status }
  );
}

/**
 * Created response helper (201)
 *
 * @param data - Created resource data
 * @param message - Optional success message
 */
export function createdResponse<T>(data: T, message?: string) {
  return successResponse(data, message, undefined, 201);
}

/**
 * No content response helper (204)
 * Used for DELETE operations
 */
export function noContentResponse() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Error response helper
 *
 * @param code - Error code (VALIDATION_ERROR, NOT_FOUND, etc.)
 * @param message - Error message
 * @param status - HTTP status code
 * @param details - Optional error details (dev only)
 */
export function errorResponse(
  code: string,
  message: string,
  status: number = 500,
  details?: any
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details && process.env.NODE_ENV === 'development'
          ? { details }
          : {}),
      },
    },
    { status }
  );
}

/**
 * Pagination helper
 *
 * Calculates pagination metadata
 *
 * @param page - Current page (1-indexed)
 * @param perPage - Items per page
 * @param total - Total number of items
 */
export function paginationMeta(page: number, perPage: number, total: number) {
  return {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
  };
}

/**
 * Parse pagination query params
 *
 * @param searchParams - URL search params
 * @returns Parsed page and perPage values
 */
export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  perPage: number;
  skip: number;
  take: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('perPage') || '10', 10))
  );

  return {
    page,
    perPage,
    skip: (page - 1) * perPage,
    take: perPage,
  };
}
