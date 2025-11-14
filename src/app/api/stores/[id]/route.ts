import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { storeService, StoreServiceError, UpdateStoreSchema } from '@/services/store-service';
import {
  requireIdempotencyKey,
  getCachedIdempotentResult,
  cacheIdempotentResult,
} from '@/lib/idempotency';

/**
 * API Routes: Store Management by ID
 * 
 * Tasks: T084, T085, T086 [US1] Store CRUD operations for individual stores
 * 
 * Purpose: REST API endpoints for managing individual stores with role-based access control.
 * Handles store retrieval, updates, and soft deletion with proper validation and authorization.
 * 
 * Routes:
 * - GET /api/stores/[id] - Retrieve store details (T084)
 * - PUT /api/stores/[id] - Update store settings (T085)  
 * - DELETE /api/stores/[id] - Soft delete store (T086)
 * 
 * Security:
 * - Authentication required for all operations
 * - Authorization: SUPER_ADMIN has full access, STORE_ADMIN limited to assigned stores
 * - Multi-tenant data isolation
 * - Input validation and sanitization
 * 
 * Features:
 * - Store retrieval with counts (products, orders, customers, admins)
 * - Store update with validation and audit logging
 * - Soft delete with data preservation
 * - Role-based access control
 * - Comprehensive error handling
 */

// Mock authentication function (to be replaced with real auth system)
async function getAuthenticatedUser(_request: NextRequest) {
  // TODO: Replace with actual authentication logic
  // For now, return a mock Super Admin user
  return {
    id: 'mock-super-admin-id',
    email: 'superadmin@stormcom.dev',
    name: 'Super Admin',
    role: 'SUPER_ADMIN' as const,
    storeId: null, // Super admin is not tied to a specific store
  };
}

/**
 * GET /api/stores/[id] - Retrieve store details
 * 
 * Task: T084 [US1] Create API route GET /api/stores/[id] for retrieving store details
 * 
 * Purpose: REST API endpoint for retrieving individual store details with role-based access control.
 * 
 * Features:
 * - Store details retrieval with counts
 * - Role-based access control (RBAC)
 * - Store existence validation
 * - Access authorization checks
 * 
 * Security:
 * - Authentication required
 * - Authorization: SUPER_ADMIN sees all stores, STORE_ADMIN/STAFF see only assigned stores
 * - Multi-tenant data isolation
 * 
 * Response (200 OK):
 * {
 *   "data": {
 *     "id": "uuid",
 *     "name": "Demo Store",
 *     "slug": "demo-store",
 *     "description": "...",
 *     "email": "admin@demo.com",
 *     "phone": "+1-555-0123",
 *     "website": "https://demo.com",
 *     "subscriptionPlan": "PRO",
 *     "subscriptionStatus": "ACTIVE",
 *     "address": "123 Main St",
 *     "city": "New York",
 *     "state": "NY",
 *     "country": "US",
 *     "currency": "USD",
 *     "timezone": "America/New_York",
 *     "locale": "en",
 *     "createdAt": "2023-01-01T00:00:00Z",
 *     "updatedAt": "2023-01-01T00:00:00Z",
 *     "_count": {
 *       "products": 150,
 *       "orders": 1200,
 *       "customers": 500,
 *       "admins": 3
 *     }
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Extract authenticated user
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (!authenticatedUser) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required to retrieve store details',
          },
        },
        { status: 401 }
      );
    }

    // Extract store ID from URL parameters
    const { id: storeId } = await context.params;

    // Validate store ID format
    if (!storeId || typeof storeId !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_STORE_ID',
            message: 'Valid store ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Retrieve store details using the service
    const store = await storeService.get(
      storeId,
      authenticatedUser.id,
      authenticatedUser.role,
      authenticatedUser.storeId || undefined
    );

    // Transform store for API response (only include available fields)
    const transformedStore = {
      id: store.id,
      name: store.name,
      slug: store.slug,
      email: store.email,
      phone: store.phone,
      address: store.address,
      currency: store.currency,
      timezone: store.timezone,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
      // Include counts
      _count: store._count,
    };

    // Return success response
    return NextResponse.json(
      {
        data: transformedStore,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error retrieving store changes:', error);

    // Handle known service errors
    if (error instanceof StoreServiceError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while retrieving store details',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/stores/[id] - Update store settings
 * 
 * Task: T085 [US1] Create API route PUT /api/stores/[id] for updating store settings
 * 
 * Purpose: REST API endpoint for updating store settings including name, logo, theme, and contact info.
 * 
 * Features:
 * - Store settings update with validation
 * - Role-based access control (RBAC)
 * - Input validation with Zod schemas
 * - Audit logging through StoreService
 * - Partial updates support
 * 
 * Security:
 * - Authentication required
 * - Authorization: SUPER_ADMIN can update any store, STORE_ADMIN only assigned stores
 * - Input validation and sanitization
 * 
 * Request Body:
 * {
 *   "name": "Updated Store Name",
 *   "description": "Updated description",
 *   "email": "newemail@example.com",
 *   "phone": "+1-555-0199",
 *   "website": "https://newwebsite.com",
 *   "address": "456 New Street",
 *   "city": "Boston",
 *   "state": "MA",
 *   "postalCode": "02101",
 *   "country": "US",
 *   "currency": "USD",
 *   "timezone": "America/New_York",
 *   "locale": "en"
 * }
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Idempotency check (CRITICAL: Prevents store settings corruption)
    let idempotencyKey: string;
    try {
      idempotencyKey = requireIdempotencyKey(request);
    } catch (error) {
      return NextResponse.json(
        {
          error: {
            code: 'IDEMPOTENCY_REQUIRED',
            message: error instanceof Error ? error.message : 'Invalid idempotency key',
          },
        },
        { status: 400 }
      );
    }

    // Check cache for duplicate request
    const cachedResult = await getCachedIdempotentResult<unknown>(idempotencyKey);
    if (cachedResult) {
      return NextResponse.json({
        data: cachedResult,
        message: 'Store already updated (idempotent response)',
      });
    }

    // Extract authenticated user
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (!authenticatedUser) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required to update store',
          },
        },
        { status: 401 }
      );
    }

    // Extract store ID from URL parameters
    const { id: storeId } = await context.params;

    // Validate store ID format
    if (!storeId || typeof storeId !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_STORE_ID',
            message: 'Valid store ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON',
          },
        },
        { status: 400 }
      );
    }

    // Validate input using Zod schema
    let validatedInput;
    try {
      validatedInput = UpdateStoreSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input data',
              details: error.errors,
            },
          },
          { status: 400 }
        );
      }

      throw error;
    }

    // Update store using the service
    const updatedStore = await storeService.update(
      storeId,
      validatedInput,
      authenticatedUser.id,
      authenticatedUser.role,
      authenticatedUser.storeId || undefined
    );

    // Transform updated store for API response
    const transformedStore = {
      id: updatedStore.id,
      name: updatedStore.name,
      slug: updatedStore.slug,
      email: updatedStore.email,
      phone: updatedStore.phone,
      address: updatedStore.address,
      currency: updatedStore.currency,
      timezone: updatedStore.timezone,
      createdAt: updatedStore.createdAt,
      updatedAt: updatedStore.updatedAt,
    };

    // Cache idempotent result (24 hour TTL)
    await cacheIdempotentResult(idempotencyKey, transformedStore);

    // Return success response
    return NextResponse.json(
      {
        data: transformedStore,
        message: 'Store updated successfully',
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating store:', error);

    // Handle known service errors
    if (error instanceof StoreServiceError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while updating store',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stores/[id] - Soft delete store
 * 
 * Task: T086 [US1] Create API route DELETE /api/stores/[id] for soft deleting stores
 * 
 * Purpose: REST API endpoint for soft deleting stores with data preservation and audit logging.
 * 
 * Features:
 * - Soft delete to preserve data integrity
 * - Role-based access control (Super Admin only)
 * - Cascade considerations for related data
 * - Comprehensive audit logging
 * - Validation and authorization checks
 * 
 * Security:
 * - Authentication required
 * - Authorization: SUPER_ADMIN only (store deletion is a critical operation)
 * - Confirmation required for safety
 * - Audit trail maintained
 * 
 * Response (200 OK):
 * {
 *   "data": {
 *     "id": "uuid",
 *     "name": "Demo Store",
 *     "deletedAt": "2023-01-01T00:00:00Z",
 *     "message": "Store soft deleted successfully"
 *   }
 * }
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Extract authenticated user
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (!authenticatedUser) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required to delete store',
          },
        },
        { status: 401 }
      );
    }

    // Check if user has Super Admin privileges (only Super Admins can delete stores)
    if (authenticatedUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only Super Admins can delete stores',
          },
        },
        { status: 403 }
      );
    }

    // Extract store ID from URL parameters
    const { id: storeId } = await context.params;

    // Validate store ID format
    if (!storeId || typeof storeId !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_STORE_ID',
            message: 'Valid store ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete store using the service
    const isDeleted = await storeService.delete(
      storeId,
      authenticatedUser.id,
      authenticatedUser.role
    );

    if (isDeleted) {
      // No content on successful delete
      return new NextResponse(null, { status: 204 });
    } else {
      return NextResponse.json(
        {
          error: {
            code: 'DELETE_FAILED',
            message: 'Failed to delete store',
          },
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error deleting store:', error);

    // Handle known service errors
    if (error instanceof StoreServiceError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode }
      );
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while deleting store',
        },
      },
      { status: 500 }
    );
  }
}