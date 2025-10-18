# StormCom - Copilot Instructions

StormCom is a comprehensive multi-tenant e-commerce SaaS platform built with Next.js 15.5.5, TypeScript 5.9.3, and Prisma ORM. This file provides guidance for GitHub Copilot Coding Agent to work effectively with this codebase.

## Project Overview

- **Purpose**: Multi-tenant e-commerce management system for managing stores, products, orders, customers, and marketing campaigns
- **Architecture**: Next.js App Router with React Server Components, Prisma ORM, PostgreSQL/SQLite
- **Development Methodology**: Spec-Driven Development using GitHub Specs Kit
- **Target**: SaaS platform enabling businesses to run complete online stores

## Repository Structure

Current documentation-first structure:

```
StormCom/
├── .github/
│   ├── copilot-instructions.md        # Copilot guidance (this file)
│   └── instructions/                  # Area-specific coding rules
├── .specify/
│   └── memory/
│       └── constitution.md            # Project constitution & standards
├── docs/
│   ├── analysis/                      # SRS and analysis docs
│   ├── audit/                         # UI audit HTML snapshots
│   ├── references/                    # Legacy documentation
│   └── spec-kit-docs/                 # Spec Kit guides
├── specs/
│   └── 001-multi-tenant-ecommerce/
│       ├── spec.md                    # Feature specification
│       ├── plan.md                    # Implementation plan
│       ├── data-model.md              # Database schema
│       ├── quickstart.md              # Local setup (spec phase)
│       ├── research.md                # Technical decisions
│       ├── tasks.md                   # Task breakdown
│       └── contracts/
│           ├── openapi.yaml           # OpenAPI 3.1 spec
│           └── README.md              # API documentation
└── README.md
```

Planned source code structure (per plan) will introduce `src/`, `prisma/`, and `tests/` during implementation.

## Tech Stack & Versions

### Core Framework
- **Next.js**: 15.5.5 (App Router only, NO Pages Router)
- **React**: 19.x (Server Components by default)
- **TypeScript**: 5.9.3 (strict mode enabled)
- **Node.js**: 18.x or higher

### Styling & UI
- **Tailwind CSS**: 4.1.14 (utility-first, NO CSS-in-JS)
- **Radix UI** + **shadcn/ui**: Accessible component primitives

### Database & ORM
- **Prisma**: Latest stable (type-safe ORM)
- **SQLite**: Local development only (file: `./prisma/dev.db`)
- **PostgreSQL**: Production (Vercel Postgres)

### Authentication
- **NextAuth.js**: v5 (authentication & sessions)
- **bcrypt**: Password hashing

### Testing
- **Vitest**: 3.2.4 (unit/integration tests)
- **Playwright**: 1.56.0 with MCP (E2E tests)
- **Testing Library**: React component testing

### Deployment
- **Vercel**: Serverless deployment platform

## Development Workflow

### Building & Running

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Initialize database (development)
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
# Visit http://localhost:3000

# Build for production
npm run build

# Start production server
npm run start
```

### Database Commands

```bash
# Sync schema to database (development only)
npm run db:push

# Create a migration (production workflow)
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with initial data
npm run db:seed
```

### Testing

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Run ESLint (check for issues)
npm run lint

# Run ESLint with auto-fix
npm run lint -- --fix

# Run Prettier (format code)
npm run format

# TypeScript type checking
npm run type-check
```

## Code Standards

### TypeScript Requirements

- **Strict Mode**: All code MUST use `strict: true` in tsconfig.json
- **No `any` types**: Except when interfacing with untyped third-party libraries (must be documented)
- **Explicit return types**: For all exported functions and class methods
- **Type guards**: Use proper type narrowing for runtime type safety
- **Modern features**: Use TypeScript 5.9+ features (const type parameters, satisfies operator)

### Naming Conventions

- **Variables/Functions**: `camelCase` (e.g., `getUserById`, `productList`)
- **Components/Types/Classes**: `PascalCase` (e.g., `ProductCard`, `UserProfile`, `OrderStatus`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`, `API_ENDPOINT`)
- **Files**: Match the primary export (e.g., `ProductCard.tsx`, `use-cart.ts`)

### File Organization

- **Group by feature**, not by type
- **Co-locate** related files (component + styles + tests in same directory)
- **Use barrel exports** (`index.ts`) for clean imports
- **Maximum depth**: ≤ 4 folder levels
- **File size**: Maximum 300 lines (refactor if exceeded)
- **Function size**: Maximum 50 lines (extract smaller functions)

### React Components

**Server Components by Default**:
- All components are Server Components unless explicitly marked with `'use client'`
- Use Client Components only for:
  - Event handlers (onClick, onChange, etc.)
  - Browser APIs (window, document, localStorage)
  - React hooks (useState, useEffect, useContext, custom hooks)
  - Third-party libraries that require client-side JavaScript

**Component Structure**:
```typescript
// Server Component (default)
export default function ProductList({ storeId }: Props) {
  const products = await getProducts(storeId);
  return <div>...</div>;
}

// Client Component (when needed)
'use client';

export default function ProductForm({ onSubmit }: Props) {
  const [name, setName] = useState('');
  return <form>...</form>;
}
```

### API Design

**RESTful Conventions**:
- `GET /api/resource` - List resources (with pagination)
- `GET /api/resource/[id]` - Get single resource
- `POST /api/resource` - Create resource
- `PUT /api/resource/[id]` - Update resource (full replacement)
- `PATCH /api/resource/[id]` - Update resource (partial)
- `DELETE /api/resource/[id]` - Delete resource (soft delete)

**Response Format**:
```typescript
// Success
{ 
  data: T, 
  message?: string,
  meta?: { page: number, total: number, perPage: number }
}

// Error
{ 
  error: { 
    code: string,       // VALIDATION_ERROR, NOT_FOUND, UNAUTHORIZED
    message: string,    // Human-readable message
    details?: any       // Validation errors (dev only)
  } 
}
```

**HTTP Status Codes**:
- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Database Guidelines

### Prisma Schema Conventions

- **Primary keys**: `id String @id @default(cuid())`
- **Timestamps**: All tables include `createdAt`, `updatedAt`
- **Soft deletes**: Use `deletedAt DateTime?` for user data
- **Multi-tenancy**: All tenant-scoped tables include `storeId String`
- **Naming**: Snake_case in database, auto-mapped to camelCase in TypeScript
- **Indexes**: Add compound indexes for common queries: `@@index([storeId, createdAt])`
- **Unique constraints**: `@@unique([storeId, email])`, `@@unique([storeId, slug])`

### Working with Migrations

1. **Make schema changes** in `prisma/schema.prisma`
2. **Create migration**: `npx prisma migrate dev --name descriptive-name`
3. **Never edit** migration files manually
4. **Test migrations** on staging before production
5. **Backup database** before running migrations in production

### Query Best Practices

- **Select only needed fields**: Use `select: { id: true, name: true }`
- **Avoid N+1 queries**: Use `include` carefully, prefer joins
- **Paginate large results**: Use `take` and `skip` parameters
- **Add indexes**: On foreign keys and frequently queried columns
- **Use transactions**: For multi-step operations that must succeed/fail together

## Testing Requirements

### Test Coverage Goals

- **Business logic** (`src/services/`, `src/lib/`): Minimum 80% coverage
- **Utility functions**: 100% coverage
- **Critical paths**: 100% E2E coverage (auth, checkout, orders, payments)
- **API routes**: 100% integration test coverage

### Test Structure

- **Unit tests**: Co-located with source files in `__tests__/` subdirectory
- **Integration tests**: In `tests/integration/`
- **E2E tests**: In `tests/e2e/` using Playwright
- **Use AAA pattern**: Arrange, Act, Assert
- **Descriptive names**: Use `it('should...')` format
- **Mock external dependencies**: Database, APIs, third-party services
- **Clean up**: Reset state and close connections after tests

## Security Requirements

### Authentication & Authorization

- **NextAuth.js v5** for all authentication
- **JWT sessions** with HTTP-only cookies
- **bcrypt** password hashing (cost factor: 12)
- **Role-Based Access Control (RBAC)** with granular permissions
- **Multi-tenant isolation** via Prisma middleware (auto-inject storeId)

### Input Validation

- **Zod schemas** for all user inputs (client + server validation)
- **Sanitize HTML** content (use DOMPurify)
- **Validate file uploads** (type, size, content)
- **Rate limiting** on API routes (100 req/min per IP)

### Data Protection

- **Environment variables** for all secrets (never commit to git)
- **HTTPS only** (enforced by Vercel)
- **Encrypted database** at rest (managed by Vercel Postgres)
- **GDPR compliance**: Support data export, deletion, consent management

## Performance Guidelines

### Frontend Performance

- **Server Components first**: Minimize client-side JavaScript (target: <200KB initial bundle)
- **Dynamic imports**: Use `next/dynamic` for heavy components
- **Image optimization**: Use Next.js `<Image>` component (automatic WebP, lazy loading)
- **Code splitting**: Automatic by route, but consider manual splits for large pages

### Backend Performance

- **Connection pooling**: Prisma default (5 connections per serverless function)
- **Query optimization**: Select only needed fields, use indexes
- **Caching**: 5-minute TTL for analytics/reports
- **Database indexes**: On all foreign keys and frequently queried columns

### Performance Budgets

- **Page Load (LCP)**: < 2.0s (desktop), < 2.5s (mobile)
- **First Input Delay (FID)**: < 100ms
- **API Response (p95)**: < 500ms
- **Database Query (p95)**: < 100ms

## Accessibility Standards

- **WCAG 2.1 Level AA** compliance required
- **Keyboard navigation**: All interactive elements must be keyboard accessible
- **ARIA labels**: Proper labels and roles on all components
- **Color contrast**: ≥ 4.5:1 ratio for text
- **Focus indicators**: Visible on all interactive elements
- **Semantic HTML**: Use HTML5 semantic elements
- **Alt text**: Required for all images
- **Screen reader tested**: Test with NVDA, JAWS, or VoiceOver

## Common Pitfalls to Avoid

1. **DO NOT use Pages Router** - Only use App Router
2. **DO NOT use `any` type** - Use proper TypeScript types
3. **DO NOT use CSS-in-JS** - Use Tailwind CSS only
4. **DO NOT use client components unnecessarily** - Default to Server Components
5. **DO NOT skip multi-tenant checks** - Always filter by storeId
6. **DO NOT commit secrets** - Use environment variables
7. **DO NOT skip tests** - Write tests for all new features
8. **DO NOT use raw SQL** - Use Prisma Client only
9. **DO NOT use Redux/Zustand** - Use React Server Components + hooks
10. **DO NOT exceed file/function size limits** - Refactor when approaching limits

## Key Documentation References

- **Project Standards (Constitution)**: `.specify/memory/constitution.md`
- **Feature Specification**: `specs/001-multi-tenant-ecommerce/spec.md`
- **Implementation Plan**: `specs/001-multi-tenant-ecommerce/plan.md`
- **Database Schema**: `specs/001-multi-tenant-ecommerce/data-model.md`
- **API Contracts**: `specs/001-multi-tenant-ecommerce/contracts/openapi.yaml`
- **SRS Analysis**: `docs/analysis/ecommerce_complete_srs.md`

## Working with Copilot

When Copilot Coding Agent works on tasks in this repository:

1. **Always read** the project constitution and specifications first
2. **Follow the tech stack** strictly (no substitutions without discussion)
3. **Write tests** before or alongside implementation
4. **Validate changes** with linting, type checking, and tests before committing
5. **Update documentation** when adding new features or changing behavior
6. **Use descriptive commit messages** following Conventional Commits format
7. **Keep changes focused** - one feature/fix per pull request
8. **Respect security requirements** - never bypass authentication or tenant isolation
9. **Optimize for performance** - follow performance budgets and best practices
10. **Ensure accessibility** - all UI changes must meet WCAG 2.1 Level AA standards

### Copilot Coding Agent best practices

- Start with context: read `.specify/memory/constitution.md` and `specs/001-multi-tenant-ecommerce/spec.md` before editing.
- Plan first: create a todo list, outline edits, and prefer minimal, focused patches. Preserve existing style and public APIs.
- Use the repo instructions: respect `.github/instructions/*` applyTo rules when editing files.
- Validate early and often: after changes, run lint, type-check, and tests; update docs when behavior changes.
- Be explicit: add types, avoid `any`, keep functions <50 lines and files <300 lines (refactor when needed).
- Security & tenancy: never bypass auth; always enforce `storeId` filtering and soft-deletes in queries.
- Tests alongside code: add unit/integration/E2E tests for new behavior; use AAA and mock external deps.
- Documentation hygiene: update README and spec references when paths/structures change.
- Commit well: use Conventional Commits and small, reviewable PRs.

## Getting Help

- **Documentation**: Start with `README.md` and `docs/`
- **Constitution**: `.specify/memory/constitution.md`
- **Specifications**: `specs/001-multi-tenant-ecommerce/`
- **Issues**: Check existing GitHub issues for context and discussions
- **Demo**: Reference demo at https://ecom-demo.workdo.io/ for UI/UX guidance
