---
applyTo: "src/app/api/**/route.ts,src/app/**/actions.ts"
---

# API Routes & Server Actions Instructions

## Route Handlers (REST API)

Route handlers are defined in `route.ts` files within the `src/app/api` directory.

### File Location & Naming

```
src/app/api/
├── products/
│   ├── route.ts              # GET /api/products (list), POST /api/products (create)
│   └── [id]/
│       └── route.ts          # GET /api/products/:id, PUT/PATCH/DELETE
├── orders/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
```

### HTTP Methods

Implement the appropriate HTTP methods for each resource:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET /api/products - List products with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = Math.min(parseInt(searchParams.get('perPage') || '10'), 100);
    const storeId = session.user.storeId;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { storeId, deletedAt: null },
        take: perPage,
        skip: (page - 1) * perPage,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({
        where: { storeId, deletedAt: null },
      }),
    ]);

    return NextResponse.json({
      data: products,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch products' } },
      { status: 500 }
    );
  }
}

// POST /api/products - Create product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const productSchema = z.object({
      name: z.string().min(1),
      price: z.number().min(0),
      description: z.string().optional(),
      categoryId: z.string().optional(),
    });
    
    const validatedData = productSchema.parse(body);
    const storeId = session.user.storeId;

    const product = await prisma.product.create({
      data: {
        ...validatedData,
        storeId,
      },
    });

    return NextResponse.json(
      { data: product, message: 'Product created successfully' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
        { status: 400 }
      );
    }
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create product' } },
      { status: 500 }
    );
  }
}
```

### Dynamic Route Parameters

```typescript
// src/app/api/products/[id]/route.ts

interface RouteParams {
  params: { id: string };
}

// GET /api/products/:id - Get single product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        id: params.id,
        storeId: session.user.storeId,
        deletedAt: null,
      },
      include: {
        category: true,
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch product' } },
      { status: 500 }
    );
  }
}

// PATCH /api/products/:id - Update product
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const productSchema = z.object({
      name: z.string().min(1).optional(),
      price: z.number().min(0).optional(),
      description: z.string().optional(),
    });
    
    const validatedData = productSchema.parse(body);

    const product = await prisma.product.updateMany({
      where: {
        id: params.id,
        storeId: session.user.storeId,
        deletedAt: null,
      },
      data: validatedData,
    });

    if (product.count === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Product updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
        { status: 400 }
      );
    }
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update product' } },
      { status: 500 }
    );
  }
}

// DELETE /api/products/:id - Delete product (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const product = await prisma.product.updateMany({
      where: {
        id: params.id,
        storeId: session.user.storeId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (product.count === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 204 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete product' } },
      { status: 500 }
    );
  }
}
```

## Server Actions

Server Actions are defined in `actions.ts` files within `src/app/` and called from Client Components.

### File Location & Naming

```
src/app/
├── products/
│   ├── actions.ts           # Product-related server actions
│   └── page.tsx
├── orders/
│   ├── actions.ts
│   └── page.tsx
```

### Server Action Structure

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().min(0, 'Price must be positive'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
});

type FormState = {
  error?: string;
  success?: boolean;
};

export async function createProduct(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { error: 'Not authenticated' };
    }

    const rawData = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      description: formData.get('description') as string,
      categoryId: formData.get('categoryId') as string,
    };

    const validatedData = productSchema.parse(rawData);
    const storeId = session.user.storeId;

    await prisma.product.create({
      data: {
        ...validatedData,
        storeId,
      },
    });

    revalidatePath('/products');
    redirect('/products');
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error('Error creating product:', error);
    return { error: 'Failed to create product' };
  }
}

export async function updateProduct(
  id: string,
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { error: 'Not authenticated' };
    }

    const rawData = {
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      description: formData.get('description') as string,
    };

    const validatedData = productSchema.partial().parse(rawData);

    const result = await prisma.product.updateMany({
      where: {
        id,
        storeId: session.user.storeId,
        deletedAt: null,
      },
      data: validatedData,
    });

    if (result.count === 0) {
      return { error: 'Product not found' };
    }

    revalidatePath('/products');
    revalidatePath(`/products/${id}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error('Error updating product:', error);
    return { error: 'Failed to update product' };
  }
}

export async function deleteProduct(id: string): Promise<FormState> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { error: 'Not authenticated' };
    }

    const result = await prisma.product.updateMany({
      where: {
        id,
        storeId: session.user.storeId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return { error: 'Product not found' };
    }

    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { error: 'Failed to delete product' };
  }
}
```

## Authentication & Authorization

**Always check authentication** in API routes and server actions:

```typescript
const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json(
    { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
    { status: 401 }
  );
}
```

**Always enforce multi-tenant isolation**:

```typescript
// Good - Filtered by storeId
const products = await prisma.product.findMany({
  where: {
    storeId: session.user.storeId,
    deletedAt: null,
  },
});

// Bad - No storeId filter (security vulnerability)
const products = await prisma.product.findMany();
```

// See `.specify/memory/constitution.md` for multi-tenant standards.

## Input Validation

**Always validate input** using Zod schemas:

```typescript
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be at least 18'),
});

try {
  const validatedData = schema.parse(body);
  // Use validatedData
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } },
      { status: 400 }
    );
  }
}
```

## Error Handling

**Use consistent error format**:

```typescript
// Success response
return NextResponse.json({
  data: result,
  message: 'Operation successful',
});

// Error response
return NextResponse.json(
  {
    error: {
      code: 'ERROR_CODE',
      message: 'Human-readable message',
      details: additionalInfo, // Optional, dev only
    },
  },
  { status: 400 }
);
```

## Performance Best Practices

- **Use database transactions** for multi-step operations
- **Implement pagination** for list endpoints
- **Select only needed fields** from database
- **Add caching headers** for cacheable responses
- **Use parallel queries** with `Promise.all()` when possible

```typescript
// Good - Parallel queries
const [products, total] = await Promise.all([
  prisma.product.findMany({ where, take, skip }),
  prisma.product.count({ where }),
]);

// Bad - Sequential queries
const products = await prisma.product.findMany({ where, take, skip });
const total = await prisma.product.count({ where });
```

## Rate Limiting

Implement rate limiting for API routes to prevent abuse:

```typescript
// TODO: Implement rate limiting middleware
// Target: 100 requests per minute per IP
```

## CORS Configuration

For API routes that need to be accessed from external domains:

```typescript
import { NextResponse } from 'next/server';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```
