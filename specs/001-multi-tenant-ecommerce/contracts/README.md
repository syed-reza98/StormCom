# API Contracts

This directory contains TypeScript contract definitions for all API endpoints using Zod schemas for runtime validation.

## Purpose

API contracts serve as the single source of truth for:
- Request/response schemas with runtime validation
- API endpoint paths and HTTP methods
- Authentication requirements
- Rate limiting configurations
- Request/response examples
- Error response formats

## Structure

Each contract file corresponds to a feature domain:

- **auth.contract.ts**: Authentication & session management
- **stores.contract.ts**: Store CRUD operations
- **products.contract.ts**: Product catalog management
- **orders.contract.ts**: Order lifecycle management
- **checkout.contract.ts**: Cart & checkout flow
- **customers.contract.ts**: Customer management
- **analytics.contract.ts**: Reporting & analytics

## Usage

### In API Route Handlers

```typescript
import { loginContract } from '@/specs/001-multi-tenant-ecommerce/contracts/auth.contract';

export async function POST(request: Request) {
  // Validate request body
  const body = await request.json();
  const validatedData = loginContract.requestSchema.parse(body);
  
  // Business logic...
  
  // Validate response
  return Response.json(loginContract.responseSchema.parse(result));
}
```

### In Client Components

```typescript
'use client';

import { loginContract } from '@/specs/001-multi-tenant-ecommerce/contracts/auth.contract';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(loginContract.requestSchema),
  });
  
  // Form implementation...
}
```

## Contract Format

All contracts follow this structure:

```typescript
import { z } from 'zod';

export const exampleContract = {
  // HTTP Method & Path
  method: 'POST' as const,
  path: '/api/example',
  
  // Authentication requirement
  authRequired: true,
  
  // Rate limiting tier (based on subscription plan)
  rateLimitTier: 'authenticated' as const,
  
  // Request schema
  requestSchema: z.object({
    field1: z.string(),
    field2: z.number().optional(),
  }),
  
  // Response schema
  responseSchema: z.object({
    data: z.object({
      id: z.string(),
      field1: z.string(),
    }),
    message: z.string().optional(),
  }),
  
  // Error schema
  errorSchema: z.object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    }),
  }),
};

// TypeScript types derived from schemas
export type ExampleRequest = z.infer<typeof exampleContract.requestSchema>;
export type ExampleResponse = z.infer<typeof exampleContract.responseSchema>;
export type ExampleError = z.infer<typeof exampleContract.errorSchema>;
```

## Rate Limiting Tiers

Rate limits are enforced based on subscription plan:

| Tier | Requests/Minute | Use Cases |
|------|----------------|-----------|
| **public** | 10 req/min | Unauthenticated endpoints (login, register) |
| **authenticated** | 60 req/min | Free plan users |
| **basic** | 120 req/min | Basic plan subscribers |
| **pro** | 300 req/min | Pro plan subscribers |
| **enterprise** | 1000 req/min | Enterprise plan subscribers |

## Error Codes

All error responses use standardized error codes:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed (Zod errors) |
| `UNAUTHORIZED` | 401 | Not authenticated (missing/invalid JWT) |
| `FORBIDDEN` | 403 | Not authorized (insufficient permissions) |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists (e.g., duplicate email) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | External service unavailable (circuit breaker open) |

## Validation Rules

### Common Field Validations

```typescript
// Email
z.string().email()

// Password (min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char)
z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)

// UUID
z.string().uuid()

// Slug (URL-safe)
z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

// Phone (E.164 format)
z.string().regex(/^\+[1-9]\d{1,14}$/)

// Currency amount (2 decimal places)
z.number().positive().multipleOf(0.01)

// Pagination
z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(10),
})
```

## Testing

Contracts are used in integration tests to ensure API compliance:

```typescript
import { loginContract } from '@/specs/001-multi-tenant-ecommerce/contracts/auth.contract';

describe('POST /api/auth/login', () => {
  it('should validate request schema', async () => {
    const invalidRequest = { email: 'invalid-email' }; // Missing password
    
    expect(() => loginContract.requestSchema.parse(invalidRequest))
      .toThrow(z.ZodError);
  });
  
  it('should validate response schema', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'Password123!' }),
    });
    
    const json = await response.json();
    expect(() => loginContract.responseSchema.parse(json)).not.toThrow();
  });
});
```

## Versioning

API contracts support versioning for backward compatibility:

```typescript
// v1 contract
export const loginContractV1 = { ... };

// v2 contract (with breaking changes)
export const loginContractV2 = { ... };

// API route supports both versions
export async function POST(request: Request) {
  const version = request.headers.get('X-API-Version') || 'v1';
  const contract = version === 'v2' ? loginContractV2 : loginContractV1;
  // ...
}
```

## References

- **Zod Documentation**: https://zod.dev/
- **React Hook Form**: https://react-hook-form.com/
- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Feature Spec**: `specs/001-multi-tenant-ecommerce/spec.md`
- **Data Model**: `specs/001-multi-tenant-ecommerce/data-model.md`
