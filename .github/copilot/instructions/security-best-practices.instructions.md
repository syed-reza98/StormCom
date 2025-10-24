# Security Best Practices for StormCom

Comprehensive security guidelines for the StormCom multi-tenant e-commerce SaaS platform.

## Authentication & Authorization

### NextAuth.js v4 Implementation

```typescript
// src/lib/auth.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          storeId: user.storeId,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.storeId = user.storeId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.storeId = token.storeId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
```

### Password Security

```typescript
import bcrypt from 'bcrypt';

// Cost factor: 12 (recommended for 2025)
const BCRYPT_ROUNDS = 12;

// Hash password during registration
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

// Verify password during login
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
```

### Role-Based Access Control (RBAC)

```typescript
// src/lib/permissions.ts
export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

export enum Permission {
  MANAGE_PRODUCTS = 'MANAGE_PRODUCTS',
  MANAGE_ORDERS = 'MANAGE_ORDERS',
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.MANAGE_PRODUCTS,
    Permission.MANAGE_ORDERS,
    Permission.MANAGE_USERS,
    Permission.VIEW_ANALYTICS,
  ],
  [Role.MANAGER]: [
    Permission.MANAGE_PRODUCTS,
    Permission.MANAGE_ORDERS,
    Permission.VIEW_ANALYTICS,
  ],
  [Role.STAFF]: [Permission.MANAGE_ORDERS],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

// Middleware for protected routes
export function requirePermission(permission: Permission) {
  return async (req: Request) => {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!hasPermission(session.user.role as Role, permission)) {
      return new Response('Forbidden', { status: 403 });
    }

    return null; // Allow request to proceed
  };
}
```

## Multi-Tenant Isolation

### Prisma Middleware

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Multi-tenant isolation middleware
prisma.$use(async (params, next) => {
  // Auto-inject storeId filter for tenant isolation
  if (params.model && tenantScopedModels.includes(params.model)) {
    if (params.action.startsWith('find') || params.action.startsWith('count')) {
      params.args = params.args || {};
      params.args.where = params.args.where || {};
      
      // Get current user's storeId from context (set in API routes)
      const storeId = getCurrentStoreId();
      
      if (storeId) {
        params.args.where.storeId = storeId;
      }
    }
  }
  
  return next(params);
});

const tenantScopedModels = [
  'Product',
  'Category',
  'Order',
  'Customer',
  'User',
];
```

### API Route Protection

```typescript
// Always verify tenant isolation in API routes
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  // Always filter by storeId
  const products = await prisma.product.findMany({
    where: {
      storeId: session.user.storeId, // CRITICAL: Always include storeId
      deletedAt: null,
    },
  });

  return NextResponse.json({ data: products });
}
```

## Input Validation

### Zod Schema Validation

```typescript
import { z } from 'zod';

// Define schemas for all user inputs
export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  price: z.number().min(0, 'Price must be positive').max(999999.99),
  description: z.string().max(5000).optional(),
  categoryId: z.string().uuid().optional(),
  sku: z.string().min(1).max(100),
  quantity: z.number().int().min(0),
});

export const createProductSchema = productSchema.omit({ id: true });
export const updateProductSchema = productSchema.partial();

// Use in API routes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createProductSchema.parse(body);
    
    // Proceed with validated data
    const product = await prisma.product.create({
      data: {
        ...validatedData,
        storeId: session.user.storeId,
      },
    });
    
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid input', 
            details: error.errors 
          } 
        },
        { status: 400 }
      );
    }
    
    throw error;
  }
}
```

### HTML Sanitization

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize HTML content from users
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

// Use in components
const ProductDescription = ({ description }: { description: string }) => {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: sanitizeHtml(description),
      }}
    />
  );
};
```

## File Upload Security

```typescript
import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, 'File size must be less than 5MB')
    .refine(
      (file) => ALLOWED_IMAGE_TYPES.includes(file.type),
      'Only JPEG, PNG, and WebP images are allowed'
    ),
});

// Server-side validation
export async function validateFile(file: File) {
  // Validate type
  fileUploadSchema.parse({ file });
  
  // Additional content validation (check file magic numbers)
  const buffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(buffer);
  
  // Check JPEG magic number
  if (file.type === 'image/jpeg') {
    if (uint8[0] !== 0xff || uint8[1] !== 0xd8) {
      throw new Error('Invalid JPEG file');
    }
  }
  
  // Check PNG magic number
  if (file.type === 'image/png') {
    if (uint8[0] !== 0x89 || uint8[1] !== 0x50) {
      throw new Error('Invalid PNG file');
    }
  }
  
  return true;
}
```

## Rate Limiting

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RateLimiter } from '@/lib/rate-limiter';

const limiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});

export async function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
    
    const { success, remaining, reset } = await limiter.check(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }
  }
  
  return NextResponse.next();
}
```

## Environment Variables

```typescript
// Never commit secrets to git
// Always use environment variables

// .env.example (committed to repo)
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

// .env.local (NOT committed, added to .gitignore)
DATABASE_URL="postgresql://actual-user:actual-password@actual-host:5432/actual-db"
NEXTAUTH_SECRET="actual-secret-key-here"
NEXTAUTH_URL="https://yourdomain.com"
```

## HTTPS & Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

## GDPR Compliance

```typescript
// src/services/gdpr.ts

// Data export
export async function exportUserData(userId: string, storeId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, storeId },
    include: {
      orders: true,
      addresses: true,
      // Include all related data
    },
  });
  
  return user;
}

// Data deletion (right to be forgotten)
export async function deleteUserData(userId: string, storeId: string) {
  await prisma.$transaction([
    // Soft delete user
    prisma.user.update({
      where: { id: userId, storeId },
      data: { deletedAt: new Date() },
    }),
    // Anonymize order data
    prisma.order.updateMany({
      where: { customerId: userId, storeId },
      data: {
        customerEmail: 'deleted@example.com',
        customerName: 'Deleted User',
      },
    }),
  ]);
}

// Consent management
export async function updateConsent(userId: string, consent: Consent) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      marketingConsent: consent.marketing,
      analyticsConsent: consent.analytics,
      consentUpdatedAt: new Date(),
    },
  });
}
```

## Security Checklist

- [ ] All API routes require authentication
- [ ] All database queries filter by `storeId`
- [ ] All user inputs are validated with Zod
- [ ] Passwords are hashed with bcrypt (cost factor 12)
- [ ] JWT sessions use HTTP-only cookies
- [ ] RBAC implemented for all protected actions
- [ ] Rate limiting applied to API routes
- [ ] File uploads validated (type, size, content)
- [ ] HTML content sanitized with DOMPurify
- [ ] Secrets stored in environment variables
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] GDPR compliance (data export/deletion)
- [ ] SQL injection prevented (Prisma)
- [ ] XSS prevented (React auto-escaping + DOMPurify)
- [ ] CSRF tokens for state-changing operations

## References

- Project Constitution: `.specify/memory/constitution.md`
- Security Specification: `specs/001-multi-tenant-ecommerce/spec.md`
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- NextAuth.js: https://next-auth.js.org/
