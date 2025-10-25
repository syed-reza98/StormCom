// src/lib/api-response.ts
// Standardized API Response Formatting for StormCom
// Ensures consistent response structure across all API routes

import { NextResponse } from 'next/server';

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
 * Success response format
 */
export interface SuccessResponse<T = unknown> {
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  options?: {
    message?: string;
    meta?: PaginationMeta;
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
 * Create a no content (204) response
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
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
 * Common API response helpers
 */
export const apiResponse = {
  success: successResponse,
  created: createdResponse,
  noContent: noContentResponse,
  paginated: paginatedResponse,
};
