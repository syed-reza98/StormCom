# Implementation Plan: StormCom E-commerce SaaS Platform

**Branch**: `001-stormcom-platform` | **Date**: 2025-10-16 | **Spec**: [spec.md](./spec.md)  
**Project**: StormCom - Multi-Tenant E-commerce Management System

---

## Summary

Building a full-stack multi-tenant e-commerce SaaS platform using **Next.js 15.5.5**, **TypeScript 5.9.3**, **Prisma ORM** with **SQLite** (local development) and **PostgreSQL** (production), **Tailwind CSS 4.1.14** with **Radix UI**, and comprehensive testing with **Vitest 3.2.4** and **Playwright 1.56.0** with MCP support. Deployment via **Vercel**.

---

## Technical Context

**Language/Version**: TypeScript 5.9.3 (strict mode enabled)  
**Framework**: Next.js 15.5.5 (App Router) with React 19  
**Primary Dependencies**:
- **Prisma**: Latest (ORM with SQLite local, PostgreSQL production)
- **NextAuth.js**: v5 (authentication & session management)
- **Tailwind CSS**: 4.1.14 (utility-first styling)
- **Radix UI**: Latest (accessible component primitives)
- **shadcn/ui**: Latest (pre-built component library on Radix)
- **Zod**: Latest (runtime validation)
- **React Hook Form**: Latest (form state management)
- **Recharts**: Latest (data visualization)
- **React Email**: Latest (email templates)
- **Resend**: Latest (email delivery)

**Storage**: SQLite (./prisma/dev.db for local), PostgreSQL (Vercel Postgres for production), Vercel Blob (file storage)  
**Testing**: Vitest 3.2.4 + Testing Library (unit/integration), Playwright 1.56.0 with MCP (E2E)  
**Target Platform**: Web application (responsive: desktop, tablet, mobile)  
**Project Type**: Full-stack monorepo with SSR/SSG capabilities  
**Performance Goals**:
- Page load (LCP) < 2s
- API response (p95) < 500ms
- Dashboard TTI < 3s
- Database query (p95) < 100ms

**Constraints**:
- Multi-tenant data isolation (storeId in all queries)
- GDPR/PCI compliance ready
- 99.9% uptime target
- Type-safe (TypeScript strict mode, no `any` types)

**Scale/Scope**:
- 10,000+ products per store
- 100 concurrent admin users
- 10+ stores per instance
- 1,000 orders/hour peak

---

## Constitution Check

*GATE: Must pass before implementation. Re-check during code review.*

✅ **Code Quality**:
- TypeScript 5.9.3 strict mode enforced
- ESLint + Prettier configured
- Max 300 lines per file
- No `any` types except for third-party untyped libraries

✅ **Testing Standards**:
- 80% coverage for business logic (services/)
- 100% coverage for utilities (lib/)
- E2E tests for critical paths (auth, checkout, order processing)
- Integration tests for all API routes

✅ **User Experience**:
- WCAG 2.1 Level AA compliance
- Performance budgets: LCP < 2s, FID < 100ms, CLS < 0.1
- Responsive design: mobile-first approach
- Loading states and error handling

✅ **Performance**:
- Server Components by default
- Dynamic imports for heavy components
- Next.js Image component for all images
- Database query optimization with Prisma
- CDN for static assets (Vercel Edge Network)

✅ **Security**:
- NextAuth.js v5 with secure sessions
- RBAC with granular permissions
- Input validation with Zod (client + server)
- CSRF protection (Next.js built-in)
- SQL injection prevention (Prisma ORM)
- Multi-tenant isolation (Prisma middleware)

---

## Project Structure

### Documentation

```
docs/
├── specifications/
│   ├── 001-stormcom-platform/
│   │   ├── spec.md              # This feature specification
│   │   ├── plan.md              # This implementation plan
│   │   ├── data-model.md        # Database schema (create next)
│   │   └── api-contracts.md     # API documentation (create next)
│   └── .speckit/
│       └── constitution.md      # Project standards
├── analysis/                    # Original SRS analysis
└── references/                  # Legacy documentation
```

### Source Code

```
StormCom/
├── src/
│   ├── app/                     # Next.js App Router (routes ONLY)
│   │   ├── (auth)/             # Auth routes group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/        # Admin dashboard group
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── customers/
│   │   │   ├── marketing/
│   │   │   ├── reports/
│   │   │   ├── cms/
│   │   │   ├── shipping/
│   │   │   ├── staff/
│   │   │   ├── pos/
│   │   │   └── settings/
│   │   ├── api/                # API Route Handlers
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── customers/
│   │   │   ├── marketing/
│   │   │   ├── reports/
│   │   │   └── [...]/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page (redirect to dashboard)
│   │   └── error.tsx           # Global error boundary
│   │
│   ├── components/             # React components (UI layer)
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── forms/              # Reusable form components
│   │   ├── tables/             # Data table components
│   │   └── charts/             # Chart components
│   │
│   ├── lib/                    # Utilities, configs, helpers
│   │   ├── auth/
│   │   │   ├── auth.ts         # NextAuth config
│   │   │   ├── session.ts      # Session utilities
│   │   │   └── permissions.ts  # Permission checks
│   │   ├── db/
│   │   │   ├── prisma.ts       # Prisma client singleton
│   │   │   └── middleware.ts   # Multi-tenant middleware
│   │   ├── validations/        # Zod schemas
│   │   ├── utils.ts            # Utility functions
│   │   └── constants.ts        # App constants
│   │
│   ├── services/               # Business logic layer (NO UI code)
│   │   ├── products/
│   │   │   ├── productService.ts
│   │   │   ├── categoryService.ts
│   │   │   └── brandService.ts
│   │   ├── orders/
│   │   │   ├── orderService.ts
│   │   │   └── refundService.ts
│   │   ├── customers/
│   │   │   └── customerService.ts
│   │   ├── auth/
│   │   │   └── authService.ts
│   │   ├── marketing/
│   │   │   ├── couponService.ts
│   │   │   └── flashSaleService.ts
│   │   └── [...]/
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useProducts.ts
│   │   ├── useOrders.ts
│   │   ├── useCustomers.ts
│   │   └── [...].ts
│   │
│   └── types/                  # TypeScript type definitions
│       ├── api.ts              # API request/response types
│       ├── models.ts           # Database model types (from Prisma)
│       ├── auth.ts             # Auth-related types
│       └── [...].ts
│
├── prisma/
│   ├── schema.prisma           # Prisma schema (40+ models)
│   ├── migrations/             # Database migrations
│   └── seed.ts                 # Database seeding script
│
├── tests/
│   ├── unit/                   # Vitest unit tests
│   │   ├── services/
│   │   ├── lib/
│   │   └── hooks/
│   ├── integration/            # Vitest integration tests
│   │   ├── api/
│   │   └── db/
│   └── e2e/                    # Playwright E2E tests
│       ├── auth.spec.ts
│       ├── products.spec.ts
│       ├── orders.spec.ts
│       └── [...].spec.ts
│
├── public/                     # Static assets
│   ├── images/
│   └── uploads/                # Local file uploads (dev only)
│
├── .env.example                # Environment variables template
├── .env.local                  # Local environment (not committed)
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS config
├── tsconfig.json               # TypeScript config (strict mode)
├── vitest.config.ts            # Vitest config
├── playwright.config.ts        # Playwright config
├── .eslintrc.json              # ESLint config
├── .prettierrc                 # Prettier config
├── package.json                # Dependencies
└── README.md                   # Project documentation
```

**Structure Decision**: Full-stack Next.js App Router monorepo. Server Components by default, Client Components only for interactivity. Multi-tenant isolation enforced at Prisma middleware level (auto-inject storeId filter on all queries).

---

## Technical Architecture

### Frontend Architecture

**Next.js App Router Pattern**:
- **Server Components** (default): Data fetching, initial render (no JS sent to client)
- **Client Components** (`'use client'`): Interactive features, event handlers, hooks
- **Server Actions**: Form mutations (`'use server'` functions)
- **Route Groups**: `(auth)` and `(dashboard)` for logical organization
- **Parallel Routes**: For complex dashboard layouts (future enhancement)

**Component Strategy**:
- **Base**: shadcn/ui components (built on Radix UI primitives)
- **Composition**: Build feature components on top of base components
- **Patterns**: Compound components for complex UI, headless patterns for accessibility

**State Management**:
- **Server State**: React Server Components (fetch data on server, pass as props)
- **Client State**: React hooks (`useState`, `useReducer`, `useContext`)
- **Form State**: React Hook Form with Zod validation
- **URL State**: Next.js searchParams for filters, pagination, sorting
- **No Global State**: Avoid Redux/MobX (use Server Components + hooks)

### Backend Architecture

**API Design**:
- **REST API**: Next.js Route Handlers (`app/api/**/route.ts`)
- **Server Actions**: For form submissions (`'use server'` functions)
- **Middleware**: Auth, logging, error handling, rate limiting
- **Response Format**:
  ```typescript
  // Success
  { data: T, message?: string }
  
  // Error
  { error: { code: string, message: string, details?: any } }
  ```

**Database Layer**:
- **Prisma ORM**: Type-safe database access, auto-generated client
- **SQLite**: Local development (file: `./prisma/dev.db`)
- **PostgreSQL**: Production (Vercel Postgres)
- **Migrations**: Version-controlled schema changes
- **Soft Deletes**: Set `deletedAt` for products, orders, customers, content
- **Audit Timestamps**: `createdAt`, `updatedAt` on all tables

**Multi-Tenancy Strategy**:
- **Store ID**: Added to all tenant-scoped tables
- **Prisma Middleware**: Auto-inject `{ where: { storeId } }` filter on all queries
- **Session**: Includes current `storeId` (switchable in UI for super admin)
- **API Validation**: All API routes validate store access before operations
- **Database**: PostgreSQL Row Level Security (RLS) policies for additional layer

**Authentication & Authorization**:
- **NextAuth.js v5**: Credentials provider (email + password)
- **JWT Sessions**: Encrypted, HTTP-only cookies, SameSite=Lax
- **RBAC**: Role-based permissions (stored in `roles.permissions_json`)
- **Permission Check**: Middleware + API route guards + UI conditional rendering
- **Password**: bcrypt hashing (salt rounds: 12)

### Data Flow

```
User Request
    ↓
Next.js Middleware (auth check)
    ↓
Server Component / API Route Handler
    ↓
Service Layer (business logic)
    ↓
Prisma Client → Prisma Middleware (inject storeId)
    ↓
SQLite (dev) / PostgreSQL (prod) Database
    ↓
Response (JSON / RSC payload)
    ↓
Client (hydration / JSON parsing)
```

### File Upload Strategy

**Local Development**:
- Store files in `public/uploads/`
- Direct file system writes
- Path stored in database

**Production (Vercel)**:
- **Vercel Blob**: Cloud file storage
- **Presigned URLs**: For secure uploads
- **CDN**: Automatic via Vercel Edge Network
- **Image Optimization**: Next.js Image component

### Email Strategy

- **React Email**: Reusable email templates with React components
- **Resend**: Email delivery service (development & production)
- **Dev Mode**: Console logging for emails (optional)
- **Queue**: Async email sending (future: use Vercel Queues or BullMQ)

---

## Database Schema (Prisma)

### Prisma Schema Structure

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // Change to "postgresql" for production
  url      = env("DATABASE_URL")
}

// --- Authentication & Users ---

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified DateTime?
  password      String    // bcrypt hashed
  image         String?
  roleId        String
  role          Role      @relation(fields: [roleId], references: [id])
  storeId       String
  store         Store     @relation(fields: [storeId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  sessions      Session[]
  orders        Order[]   @relation("CreatedByUser")
  // ... other relations
  
  @@index([email])
  @@index([storeId])
  @@index([roleId])
}

model Role {
  id          String   @id @default(cuid())
  name        String
  permissions Json     // Array of permission strings
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id])
  users       User[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([storeId, name])
  @@index([storeId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

// --- Multi-Tenancy ---

model Store {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  domain    String?  @unique
  logo      String?
  settings  Json     // Store configuration
  ownerId   String
  status    String   @default("active") // active, inactive, suspended
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations (all tenant-scoped entities)
  users     User[]
  roles     Role[]
  products  Product[]
  orders    Order[]
  customers Customer[]
  // ... 30+ other relations
  
  @@index([slug])
  @@index([ownerId])
}

// --- Products ---

model Product {
  id            String        @id @default(cuid())
  name          String
  slug          String
  description   String?
  price         Decimal       @db.Decimal(10, 2)
  salePrice     Decimal?      @db.Decimal(10, 2)
  sku           String
  stockQuantity Int           @default(0)
  stockStatus   StockStatus   @default(IN_STOCK)
  categoryId    String?
  category      Category?     @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  brandId       String?
  brand         Brand?        @relation(fields: [brandId], references: [id], onDelete: SetNull)
  storeId       String
  store         Store         @relation(fields: [storeId], references: [id], onDelete: Cascade)
  taxStatus     String        @default("taxable") // taxable, non-taxable
  weight        Decimal?      @db.Decimal(10, 2)
  dimensions    Json?         // {length, width, height, unit}
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  deletedAt     DateTime?     // Soft delete
  
  // Relations
  images        ProductImage[]
  variants      ProductVariant[]
  labels        ProductLabel[]
  attributes    ProductAttributeValue[]
  testimonials  Testimonial[]
  questions     ProductQuestion[]
  orderItems    OrderItem[]
  wishlistItems WishlistItem[]
  
  @@unique([storeId, slug])
  @@unique([storeId, sku])
  @@index([categoryId])
  @@index([brandId])
  @@index([storeId])
  @@index([deletedAt])
}

// ... (40+ more models - see separate data-model.md for full schema)

enum StockStatus {
  IN_STOCK
  OUT_OF_STOCK
  LOW_STOCK
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

// ... (20+ more enums)
```

**Note**: Full Prisma schema with all 40+ models documented in `data-model.md`.

---

## API Structure

### REST API Endpoints

**Authentication** (`/api/auth/*`)
- `POST /api/auth/signin` - Login (email + password)
- `POST /api/auth/signout` - Logout
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

**Products** (`/api/products/*`)
- `GET /api/products` - List products (pagination, filters, search)
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Soft delete product
- `POST /api/products/:id/images` - Upload product images
- `POST /api/products/import` - Bulk import via CSV
- `GET /api/products/export` - Bulk export to CSV

**Orders** (`/api/orders/*`)
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order (admin)
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/refund` - Process refund
- `GET /api/orders/:id/invoice` - Generate invoice PDF
- `GET /api/orders/export` - Export orders to CSV

**Customers** (`/api/customers/*`)
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `GET /api/customers/:id/orders` - Get customer orders
- `GET /api/customers/export` - Export customers to CSV

**Marketing** (`/api/marketing/*`)
- `GET /api/marketing/coupons` - List coupons
- `POST /api/marketing/coupons` - Create coupon
- `POST /api/marketing/flash-sales` - Create flash sale
- `POST /api/marketing/newsletters` - Send newsletter
- `GET /api/marketing/abandoned-carts` - List abandoned carts

**Reports** (`/api/reports/*`)
- `GET /api/reports/sales` - Sales reports (filters: product, category, brand, date)
- `GET /api/reports/inventory` - Inventory reports
- `GET /api/reports/customers` - Customer analytics
- `GET /api/reports/orders` - Order status reports
- `GET /api/reports/top-sellers` - Top-selling products

**CMS** (`/api/cms/*`)
- `GET /api/cms/pages` - List pages
- `POST /api/cms/pages` - Create page
- `GET /api/cms/blogs` - List blog posts
- `POST /api/cms/blogs` - Create blog post
- `POST /api/cms/menus` - Create/update menu

**Settings** (`/api/settings/*`)
- `GET /api/settings` - Get store settings
- `PUT /api/settings` - Update store settings
- `GET /api/settings/themes` - List themes
- `PUT /api/settings/themes/:id/activate` - Activate theme

*Full API documentation in `api-contracts.md` (create next).*

---

## Security Implementation

### Authentication (NextAuth.js v5)

```typescript
// src/lib/auth/auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db/prisma"
import bcrypt from "bcrypt"
import { z } from "zod"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (!parsedCredentials.success) return null

        const { email, password } = parsedCredentials.data
        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true, store: true },
        })

        if (!user || !user.password) return null

        const passwordMatch = await bcrypt.compare(password, user.password)
        if (!passwordMatch) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roleId: user.roleId,
          storeId: user.storeId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roleId = user.roleId
        token.storeId = user.storeId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.roleId = token.roleId as string
        session.user.storeId = token.storeId as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
```

### Authorization (RBAC)

```typescript
// src/lib/auth/permissions.ts
export async function checkPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  })

  if (!user) return false

  const permissions = user.role.permissions as string[]
  return permissions.includes(permission) || permissions.includes("*")
}

// Middleware usage
export async function requirePermission(permission: string) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const hasPermission = await checkPermission(session.user.id, permission)
  if (!hasPermission) throw new Error("Forbidden")

  return session
}
```

### Multi-Tenant Isolation (Prisma Middleware)

```typescript
// src/lib/db/middleware.ts
import { PrismaClient } from "@prisma/client"

export function applyMultiTenantMiddleware(prisma: PrismaClient) {
  prisma.$use(async (params, next) => {
    // Get current storeId from context (set by API route)
    const storeId = getStoreIdFromContext()

    // List of models that are tenant-scoped
    const tenantModels = [
      "Product",
      "Order",
      "Customer",
      "Category",
      "Brand",
      // ... 30+ more models
    ]

    if (tenantModels.includes(params.model || "")) {
      if (params.action === "findMany" || params.action === "findFirst") {
        params.args.where = params.args.where || {}
        params.args.where.storeId = storeId
      }

      if (params.action === "create" || params.action === "createMany") {
        params.args.data.storeId = storeId
      }

      if (params.action === "update" || params.action === "updateMany") {
        params.args.where = params.args.where || {}
        params.args.where.storeId = storeId
      }

      if (params.action === "delete" || params.action === "deleteMany") {
        params.args.where = params.args.where || {}
        params.args.where.storeId = storeId
      }
    }

    return next(params)
  })
}
```

---

## Performance Optimizations

### Server Components Strategy
- Default to Server Components (no JS sent to client)
- Use Client Components only for:
  - Event handlers (`onClick`, `onChange`, etc.)
  - Browser APIs (`window`, `localStorage`, etc.)
  - React hooks (`useState`, `useEffect`, etc.)
  - Third-party libraries requiring client-side JS

### Code Splitting
```typescript
// Dynamic imports for heavy components
const ProductEditor = dynamic(() => import("@/components/products/ProductEditor"), {
  loading: () => <Skeleton />,
  ssr: false, // If component uses browser APIs
})
```

### Database Optimizations
- **Indexes**: All foreign keys, frequently queried columns
- **Query Optimization**: Use `select` and `include` to fetch only needed data
- **Batch Operations**: Use `createMany`, `updateMany` for bulk operations
- **Connection Pooling**: Prisma handles automatically

### Image Optimization
```typescript
import Image from "next/image"

<Image
  src={product.image}
  alt={product.name}
  width={300}
  height={300}
  quality={80}
  priority={index < 3} // Priority for above-the-fold images
/>
```

### Caching Strategy
- **Static Pages**: Pre-rendered at build time (CMS pages)
- **Dynamic Pages**: Rendered on-demand, cached for 60s
- **API Routes**: Cache responses with `revalidate` or use Redis

---

## Development Workflow

### Local Setup

```bash
# Clone repository
git clone https://github.com/syed-reza98/StormCom.git
cd StormCom

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Generate Prisma Client
npx prisma generate

# Push schema to SQLite database
npx prisma db push

# Seed database with sample data
npx prisma db seed

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### Database Management

```bash
# Open Prisma Studio (database GUI)
npx prisma studio

# Create a migration
npx prisma migrate dev --name describe-change

# Apply migrations to production
npx prisma migrate deploy

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Seed database
npx prisma db seed
```

### Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Open Vitest UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Run Prettier
npm run format

# TypeScript type check
npm run type-check

# Run all checks before commit
npm run precommit  # lint + type-check + test
```

---

## Deployment Strategy

### Vercel Deployment (Recommended)

**Prerequisites**:
- Vercel account
- GitHub repository connected

**Steps**:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "feat: implement feature X"
   git push origin main
   ```

2. **Configure Vercel**
   - Go to Vercel dashboard
   - Import GitHub repository
   - Configure build settings (auto-detected for Next.js)
   - Add environment variables from `.env.example`

3. **Environment Variables** (Vercel Dashboard)
   ```env
   DATABASE_URL=postgresql://user:pass@host:5432/db  # Vercel Postgres
   NEXTAUTH_SECRET=your-secret-generate-new
   NEXTAUTH_URL=https://your-domain.vercel.app
   RESEND_API_KEY=re_xxxxxxxxxxxx
   BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxxxxxxxxx
   ```

4. **Deploy**
   - Vercel auto-deploys on push to `main` branch
   - Preview deployments for pull requests

**Vercel Postgres Setup**:
1. Create Vercel Postgres database in dashboard
2. Copy `DATABASE_URL` to environment variables
3. Run migrations: `npx prisma migrate deploy`

**Vercel Blob Setup**:
1. Enable Vercel Blob in project settings
2. Copy `BLOB_READ_WRITE_TOKEN` to environment variables

### Docker Deployment (Alternative)

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

```bash
# Build Docker image
docker build -t stormcom .

# Run container
docker run -p 3000:3000 --env-file .env.production stormcom
```

---

## Migration from SQLite to PostgreSQL

**Development (SQLite)** → **Production (PostgreSQL)**

1. **Update `schema.prisma`**
   ```prisma
   datasource db {
     provider = "postgresql"  // Changed from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. **Update `.env.production`**
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database"
   ```

3. **Generate New Migrations**
   ```bash
   npx prisma migrate dev --name init-postgresql
   ```

4. **Deploy to Production**
   ```bash
   npx prisma migrate deploy
   ```

**SQLite → PostgreSQL Differences**:
- SQLite: `@db.Decimal(10, 2)` → PostgreSQL: Same
- SQLite: `DateTime @default(now())` → PostgreSQL: Same
- SQLite: `@unique` → PostgreSQL: Same
- Most Prisma features work identically

---

## Environment Variables

```env
# .env.example

# Database
DATABASE_URL="file:./dev.db"  # SQLite for local
# DATABASE_URL="postgresql://user:password@localhost:5432/stormcom"  # PostgreSQL

# Authentication
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="noreply@stormcom.com"

# File Storage (Production - Vercel Blob)
BLOB_READ_WRITE_TOKEN="vercel_blob_xxxxxxxxxxxx"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="StormCom"

# Analytics (Optional)
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Monitoring (Optional)
SENTRY_DSN="https://xxxx@sentry.io/xxxxx"

# Feature Flags (Optional)
NEXT_PUBLIC_ENABLE_POS="true"
NEXT_PUBLIC_ENABLE_MULTI_STORE="true"
```

---

## Next Steps

1. ✅ **Review and approve** this implementation plan
2. ⬜ **Create `data-model.md`** - Complete Prisma schema with all 40+ models
3. ⬜ **Create `api-contracts.md`** - API documentation with request/response examples
4. ⬜ **Initialize Next.js project** with TypeScript, Tailwind, Prisma
5. ⬜ **Set up project structure** following this plan
6. ⬜ **Implement authentication** (NextAuth.js v5)
7. ⬜ **Implement database** (Prisma schema, migrations, seed)
8. ⬜ **Implement MVP features** (Priority 1: Dashboard, Products, Orders)
9. ⬜ **Write tests** (unit, integration, E2E)
10. ⬜ **Deploy to Vercel** (staging environment)
11. ⬜ **Implement Priority 2 features** (Customers, Marketing, Reports)
12. ⬜ **Implement Priority 3 features** (CMS, Shipping, POS, Staff, Multi-Store)
13. ⬜ **Production deployment**

---

**Document Version**: 2.0  
**Last Updated**: 2025-10-16  
**Status**: ✅ Approved for Implementation
