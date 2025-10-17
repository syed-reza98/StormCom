# Project Constitution: StormCom

**Project**: StormCom - Multi-Tenant E-commerce SaaS Platform  
**Tech Stack**: Next.js 15.5.5 + TypeScript 5.9.3 + Prisma + SQLite/PostgreSQL  
**Created**: 2025-10-16  
**Updated**: 2025-10-17  
**Version**: 2.1

---

## 1. Core Principles

### 1.1 Code Quality Standards

**TypeScript Strict Mode**
- All code MUST use TypeScript with `strict: true` in `tsconfig.json`
- NO `any` types except when interfacing with untyped third-party libraries (must be documented)
- Explicit return types for all exported functions and class methods
- Proper type guards and narrowing for runtime type safety
- Use TypeScript 5.9.3+ features (const type parameters, satisfies operator)

**Code Style & Organization**
- ESLint rules strictly enforced (configured in `.eslintrc.json`)
- Prettier for automatic formatting (configured in `.prettierrc`)
- Consistent naming conventions:
  - `camelCase` for variables, functions, methods
  - `PascalCase` for components, types, interfaces, classes
  - `UPPER_SNAKE_CASE` for constants
- Maximum 300 lines per file (refactor if exceeded)
- Maximum 50 lines per function (extract smaller functions)
- Clear separation of concerns (UI / Business Logic / Data Access)

**File Organization**
- Group by feature, not by type
- Co-locate related files (component + styles + tests)
- Use barrel exports (`index.ts`) for clean imports
- Keep folder depth ≤ 4 levels

### 1.2 Testing Standards

**Test Coverage Requirements**
- **Minimum 80% coverage** for business logic (`src/services/`, `src/lib/`)
- **100% coverage** for utility functions (`src/lib/utils.ts`)
- **E2E tests** for all critical user paths:
  - Authentication (login, logout, session)
  - Product creation and management
  - Order placement and processing
  - Payment flows
  - Admin dashboard navigation
- **Integration tests** for all API routes (`src/app/api/**/route.ts`)

**Testing Tools**
- **Unit/Integration**: Vitest 3.2.4 + Testing Library
- **E2E**: Playwright 1.56.0 with MCP support
- **Coverage**: Vitest coverage (c8/istanbul)
- **Mocking**: Vitest mocking utilities + MSW for API mocking

**Test Quality**
- Tests must be deterministic (no flaky tests)
- Use meaningful test descriptions (`it('should...')`)
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies (database, APIs)
- Clean up after tests (reset state, close connections)

### 1.3 User Experience

**Performance Budgets**
- **Page Load (LCP)**: < 2.0 seconds (desktop), < 2.5 seconds (mobile)
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.0 seconds
- **API Response (p95)**: < 500ms
- **Database Query (p95)**: < 100ms
- **JavaScript Bundle**: < 200KB initial load (gzip)

**Accessibility (WCAG 2.1 Level AA)**
- All interactive elements keyboard accessible
- Proper ARIA labels and roles
- Color contrast ratio ≥ 4.5:1 for text
- Focus indicators visible on all interactive elements
- Screen reader tested (NVDA, JAWS, VoiceOver)
- Semantic HTML5 elements
- Alt text for all images
- Captions for videos

**Responsive Design**
- Mobile-first approach
- Breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl), 1536px (2xl)
- Test on real devices: iPhone, iPad, Android phones/tablets
- Touch targets ≥ 44×44px
- No horizontal scrolling at any breakpoint

**Loading States & Error Handling**
- Loading skeletons for async content
- Optimistic UI updates where appropriate
- Clear error messages with actionable guidance
- Toast notifications for user actions (success, error, warning)
- Graceful degradation for unsupported browsers

---

## 2. Architecture Constraints

### 2.1 Required Technologies
- ✅ **Next.js** `15.5.5+` (App Router only, NO Pages Router)
- ✅ **React** `19.x` (Server Components by default)
- ✅ **TypeScript** `5.9.3+` (strict mode enabled)
- ✅ **Prisma ORM** (latest stable version)
- ✅ **SQLite** (local development only)
- ✅ **PostgreSQL** (production on Vercel Postgres)
- ✅ **Tailwind CSS** `4.1.14+` (utility-first styling)
- ✅ **Radix UI** + **shadcn/ui** (accessible component library)
- ✅ **NextAuth.js** `v5` (authentication)
- ✅ **Zod** (runtime validation)
- ✅ **React Hook Form** (form state management)
- ✅ **Vitest** `3.2.4+` (unit/integration testing)
- ✅ **Playwright** `1.56.0+` with MCP (E2E testing)
- ✅ **Vercel** (deployment platform)

### 2.2 Prohibited Technologies
- ❌ **Redux/MobX/Zustand** (use React Server Components + hooks)
- ❌ **CSS-in-JS** (styled-components, emotion) - use Tailwind only
- ❌ **GraphQL** (use REST API via Route Handlers)
- ❌ **MongoDB/NoSQL** (use PostgreSQL for relational data)
- ❌ **Pages Router** (must use App Router)
- ❌ **Class Components** (use functional components with hooks)
- ❌ **Moment.js** (use native Date or date-fns)
- ❌ **Lodash** (use native ES6+ methods or specific utilities)

### 2.3 Architecture Patterns

**Server Components First**
- All components are Server Components unless explicitly marked with `'use client'`
- Client Components only for: event handlers, browser APIs, React hooks, state management
- Minimize client-side JavaScript bundle size

**API Design**
- RESTful conventions (GET, POST, PUT, DELETE, PATCH)
- Route Handlers in `app/api/**/route.ts`
- Server Actions for form mutations (`'use server'` functions)
- Consistent response format: `{ data: T, message?: string }` or `{ error: { code, message, details } }`

**Database Access**
- Prisma Client ONLY (no raw SQL queries)
- Multi-tenant middleware enforced on all queries
- Soft deletes for user data (set `deletedAt`)
- Transactions for multi-step operations
- Connection pooling for PostgreSQL

---

## 3. Security Requirements

**Authentication & Authorization**
- NextAuth.js v5 for authentication
- JWT sessions with HTTP-only cookies (SameSite=Lax)
- bcrypt password hashing (cost factor: 12)
- Role-Based Access Control (RBAC) with granular permissions
- Session expiration: 30 days
- Optional 2FA via TOTP

**Input Validation**
- Zod schemas for all user inputs (client + server)
- Sanitize HTML content (DOMPurify)
- Validate file uploads (type, size, content)
- Rate limiting on API routes (100 req/min per IP)

**Data Protection**
- Multi-tenant isolation via Prisma middleware (auto-inject storeId)
- HTTPS only (enforced by Vercel)
- Environment variables for secrets (never commit to git)
- Encrypted database at rest (managed by Vercel Postgres)
- GDPR compliance: data export, deletion, consent management

**Vulnerability Prevention**
- XSS: React automatic escaping + Content Security Policy headers
- CSRF: Next.js built-in CSRF protection
- SQL Injection: Prisma parameterized queries only
- Clickjacking: X-Frame-Options header
- Regular dependency updates (Dependabot)

---

## 4. Database Guidelines

**Prisma Schema Conventions**
- Snake_case for database column names (auto-mapped to camelCase in TypeScript)
- `id String @id @default(cuid())` for primary keys
- `createdAt DateTime @default(now())` for all tables
- `updatedAt DateTime @updatedAt` for all tables
- `deletedAt DateTime?` for soft deletes
- `storeId String` for all tenant-scoped tables
- Compound indexes for common queries: `@@index([storeId, createdAt])`
- Unique constraints: `@@unique([storeId, email])`, `@@unique([storeId, slug])`

**Migrations**
- All schema changes via migrations (`npx prisma migrate dev`)
- Descriptive migration names (`npx prisma migrate dev --name add-customer-table`)
- Never edit migration files manually
- Test migrations on staging before production
- Backup database before running migrations

**Query Optimization**
- Use `select` to fetch only needed fields
- Use `include` carefully (avoid N+1 queries)
- Paginate large result sets (`take`, `skip`)
- Add indexes on frequently queried columns
- Use `count()` for pagination metadata

---

## 5. API Design Standards

**REST Conventions**
- `GET /api/resource` - List resources (with pagination)
- `GET /api/resource/[id]` - Get single resource
- `POST /api/resource` - Create resource
- `PUT /api/resource/[id]` - Update resource (full replacement)
- `PATCH /api/resource/[id]` - Update resource (partial)
- `DELETE /api/resource/[id]` - Delete resource (soft delete)

**Response Format**
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
    details?: any       // Validation errors, stack trace (dev only)
  } 
}
```

**HTTP Status Codes**
- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (no permission)
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Semantic error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Pagination**
- Query params: `?page=1&perPage=20`
- Default: `perPage=10`, max: `perPage=100`
- Response meta: `{ page, total, perPage, totalPages }`

---

## 6. Performance Optimization

**Frontend**
- Server Components by default (70% less JavaScript)
- Dynamic imports for heavy components (`next/dynamic`)
- Next.js Image component for all images (automatic WebP, lazy loading)
- Code splitting by route (automatic)
- CDN for static assets (Vercel Edge Network)

**Backend**
- Database connection pooling (Prisma default: 5 connections per function)
- API response caching (5-minute TTL for analytics/reports)
- Prisma query optimization (select only needed fields)
- Indexes on all foreign keys and frequently queried columns

**Monitoring**
- Vercel Analytics for Web Vitals
- Vercel Speed Insights for performance metrics
- Error tracking and logging
- Database query performance monitoring

---

## 7. Development Workflow

**Git Workflow**
- Branch naming: `feature/add-product-crud`, `fix/order-email-bug`, `docs/update-readme`
- Commit messages: Conventional Commits format (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`)
- Pull requests required for `main` branch
- At least 1 approval required
- All checks must pass (tests, linting, build)

**Code Review**
- Check for adherence to this constitution
- Verify test coverage
- Review for security vulnerabilities
- Ensure performance best practices
- Confirm accessibility compliance

**Spec-Driven Development Tools**
- **Spec Kit CLI** installed via `uv tool install --from git+https://github.com/github/spec-kit.git specify-cli`
- **Location**: Constitution stored in `.specify/memory/constitution.md`
- **Prompts**: Spec-kit prompts in `.github/prompts/`
- Use `specify check` to verify development environment
- Use slash commands: `/speckit.constitution`, `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`
- See `docs/SPEC_KIT_SETUP.md` for installation instructions
- See `docs/SPEC_KIT_USAGE.md` for workflow guidance
- Follow specification structure in `docs/specifications/001-stormcom-platform/` for new features

---

For complete implementation details, see `docs/specifications/001-stormcom-platform/plan.md`.
