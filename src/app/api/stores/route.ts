import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { storeService, CreateStoreSchema, StoreServiceError } from '@/services/store-service';

/**
 * API Route: POST /api/stores
 * 
 * Task: T082 [US1] Create API route POST /api/stores for creating new stores with subdomain validation
 * 
 * Purpose: REST API endpoint for creating new stores in the multi-tenant e-commerce platform.
 * Handles store creation with proper validation, authentication, and authorization.
 * 
 * Features:
 * - Store creation with subdomain validation
 * - Role-based access control (RBAC)
 * - Input validation with Zod schemas
 * - Comprehensive error handling
 * - Audit logging through StoreService
 * - Multi-tenant data isolation
 * 
 * Security:
 * - Authentication required
 * - Authorization: SUPER_ADMIN only
 * - Input sanitization and validation
 * - Rate limiting (handled by middleware)
 * 
 * Request Body:
 * {
 *   "name": "Demo Store",
 *   "slug": "demo-store",
 *   "description": "A demo e-commerce store",
 *   "email": "admin@demo-store.com",
 *   "phone": "+1-555-0123",
 *   "website": "https://demo-store.com",
 *   "subscriptionPlan": "BASIC",
 *   "address": "123 Main St",
 *   "city": "New York",
 *   "state": "NY",
 *   "postalCode": "10001",
 *   "country": "US",
 *   "currency": "USD",
 *   "timezone": "America/New_York",
 *   "locale": "en",
 *   "ownerId": "uuid-of-store-admin"
 * }
 * 
 * Response (201 Created):
 * {
 *   "data": {
 *     "id": "uuid",
 *     "name": "Demo Store",
 *     "slug": "demo-store",
 *     "email": "admin@demo-store.com",
 *     // ... other store fields
 *   },
 *   "message": "Store created successfully"
 * }
 * 
 * Error Responses:
 * - 400: Invalid input data
 * - 401: Authentication required
 * - 403: Insufficient permissions
 * - 409: Slug already exists
 * - 500: Internal server error
 */

// Enhanced validation schema for API endpoint
const CreateStoreAPISchema = CreateStoreSchema.extend({
  // Additional API-specific validations can be added here
});

/**
 * POST /api/stores - Create a new store
 * 
 * @param request - NextRequest object
 * @returns NextResponse with created store data or error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // TODO: Extract user authentication from request
    // This will be implemented when authentication middleware is available
    // For now, we'll use mock authentication data
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (!authenticatedUser) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required to create stores',
          },
        },
        { status: 401 }
      );
    }

    // Check authorization - only SUPER_ADMIN can create stores
    if (authenticatedUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only Super Admins can create stores',
          },
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    let requestBody: any;
    try {
      requestBody = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_JSON',
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 }
      );
    }

    // Validate input against schema
    let validatedInput;
    try {
      validatedInput = CreateStoreAPISchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input data',
              changes: error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
              })),
            },
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Additional slug validation (check availability)
    const isSlugAvailable = await storeService.validateSlug(validatedInput.slug);
    if (!isSlugAvailable) {
      return NextResponse.json(
        {
          error: {
            code: 'SLUG_ALREADY_EXISTS',
            message: `Store with slug '${validatedInput.slug}' already exists`,
          },
        },
        { status: 409 }
      );
    }

    // Create the store
    const store = await storeService.create(validatedInput, authenticatedUser.id);

    // Return success response
    return NextResponse.json(
      {
        data: {
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
        },
        message: 'Store created successfully',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating store:', error);

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
          message: 'An unexpected error occurred while creating the store',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stores - List stores with pagination and filtering
 * 
 * Task: T083 [US1] Create API route GET /api/stores for listing all stores (Super Admin) or assigned stores (Store Admin)
 * 
 * Purpose: REST API endpoint for retrieving stores with filtering, pagination, and role-based access control.
 * 
 * Features:
 * - Store listing with pagination
 * - Search and filtering capabilities
 * - Role-based access control (RBAC)
 * - Sorting options
 * - Store counts and statistics
 * 
 * Security:
 * - Authentication required
 * - Authorization: SUPER_ADMIN sees all stores, STORE_ADMIN/STAFF see only assigned stores
 * - Multi-tenant data isolation
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - search: Search term for name, slug, email
 * - subscriptionPlan: Filter by subscription plan
 * - subscriptionStatus: Filter by subscription status
 * - sortBy: Sort field (name, createdAt, updatedAt)
 * - sortOrder: Sort direction (asc, desc)
 * 
 * Response (200 OK):
 * {
 *   "data": {
 *     "stores": [...],
 *     "pagination": {
 *       "page": 1,
 *       "limit": 20,
 *       "total": 150,
 *       "totalPages": 8,
 *       "hasNext": true,
 *       "hasPrev": false
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract authenticated user
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (!authenticatedUser) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required to list stores',
          },
        },
        { status: 401 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryInput = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100), // Max 100 items per page
      search: searchParams.get('search') || undefined,
      subscriptionPlan: searchParams.get('subscriptionPlan') as 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE' | undefined,
      subscriptionStatus: searchParams.get('subscriptionStatus') as 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'PAUSED' | undefined,
      sortBy: (searchParams.get('sortBy') || 'createdAt') as 'name' | 'createdAt' | 'updatedAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    // Validate query parameters
    if (queryInput.page < 1) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PAGE',
            message: 'Page number must be greater than 0',
          },
        },
        { status: 400 }
      );
    }

    if (queryInput.limit < 1) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_LIMIT',
            message: 'Limit must be greater than 0',
          },
        },
        { status: 400 }
      );
    }

    if (!['name', 'createdAt', 'updatedAt'].includes(queryInput.sortBy)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_SORT_BY',
            message: 'sortBy must be one of: name, createdAt, updatedAt',
          },
        },
        { status: 400 }
      );
    }

    if (!['asc', 'desc'].includes(queryInput.sortOrder)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_SORT_ORDER',
            message: 'sortOrder must be one of: asc, desc',
          },
        },
        { status: 400 }
      );
    }

    // Validate subscription plan filter
    if (queryInput.subscriptionPlan && 
        !['FREE', 'BASIC', 'PRO', 'ENTERPRISE'].includes(queryInput.subscriptionPlan)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_SUBSCRIPTION_PLAN',
            message: 'subscriptionPlan must be one of: FREE, BASIC, PRO, ENTERPRISE',
          },
        },
        { status: 400 }
      );
    }

    // Validate subscription status filter
    if (queryInput.subscriptionStatus && 
        !['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'PAUSED'].includes(queryInput.subscriptionStatus)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_SUBSCRIPTION_STATUS',
            message: 'subscriptionStatus must be one of: TRIAL, ACTIVE, PAST_DUE, CANCELLED, EXPIRED',
          },
        },
        { status: 400 }
      );
    }

    // List stores using the service
    const result = await storeService.list(
      queryInput,
      authenticatedUser.id,
      authenticatedUser.role,
      authenticatedUser.storeId
    );

    // Transform stores for API response (only include available fields)
    const transformedStores = result.stores.map(store => ({
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
    }));

    // Return success response
    return NextResponse.json(
      {
        data: {
          stores: transformedStores,
          pagination: result.pagination,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error listing stores:', error);

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
          message: 'An unexpected error occurred while listing stores',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Mock authentication function
 * TODO: Replace with actual authentication middleware implementation
 * This is a placeholder until the authentication system is integrated
 */
async function getAuthenticatedUser(request: NextRequest): Promise<{
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'STORE_ADMIN' | 'STAFF' | 'CUSTOMER';
  storeId?: string;
} | null> {
  // TODO: Implement actual authentication
  // This should:
  // 1. Extract JWT token from Authorization header or cookies
  // 2. Validate the token
  // 3. Decode user information
  // 4. Return user object or null if not authenticated

  // Mock implementation for development
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  // In actual implementation, validate JWT and extract user data
  // For now, return mock SUPER_ADMIN user
  return {
    id: 'mock-super-admin-id',
    email: 'superadmin@stormcom.dev',
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
  };
}