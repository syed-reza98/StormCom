# StormCom Constitution

## Core Principles

### I. Code Quality
Code must meet strict quality standards, including consistent formatting, meaningful naming conventions, and modular design. Code reviews are mandatory to ensure maintainability and adherence to project guidelines.

**TypeScript Strict Mode**
- Use TypeScript with `strict: true` in `tsconfig.json`.
- Avoid `any` types except when interfacing with untyped third-party libraries (document exceptions).
- Define explicit return types for all exported functions and class methods.
- Apply proper type guards and narrowing for runtime type safety.
- Leverage TypeScript 5.9.3+ features (e.g., const type parameters, satisfies operator).

**Code Style & Organization**
- Enforce ESLint rules (configured in `.eslintrc.json`).
- Use Prettier for automatic formatting (configured in `.prettierrc`).
- Follow naming conventions:
  - `camelCase` for variables, functions, methods.
  - `PascalCase` for components, types, interfaces, classes.
  - `UPPER_SNAKE_CASE` for constants.
- Limit files to 300 lines and functions to 50 lines (refactor if exceeded).
- Separate concerns clearly (UI, Business Logic, Data Access).

**File Organization**
- Group by feature, not by type.
- Co-locate related files (e.g., component + styles + tests).
- Use barrel exports (`index.ts`) for clean imports.
- Limit folder depth to 4 levels.

### II. Testing Standards
Testing is mandatory. All features must include unit, integration, and end-to-end tests where applicable. Achieve at least 90% code coverage, with 100% coverage for critical paths. Follow the red-green-refactor cycle.

**Test Coverage Requirements**
- **80% coverage** for business logic (`src/services/`, `src/lib/`).
- **100% coverage** for utility functions (`src/lib/utils.ts`).
- **E2E tests** for critical user paths:
  - Authentication (login, logout, session).
  - Product creation and management.
  - Order placement and processing.
  - Payment flows.
  - Admin dashboard navigation.
- **Integration tests** for all API routes (`src/app/api/**/route.ts`).

**Testing Tools**
- **Unit/Integration**: Vitest 3.2.4 + Testing Library.
- **E2E**: Playwright 1.56.0 with MCP support.
- **Coverage**: Vitest coverage (c8/istanbul).
- **Mocking**: Vitest mocking utilities + MSW for API mocking.

**Test Quality**
- Write deterministic tests (no flaky tests).
- Use meaningful test descriptions (`it('should...')`).
- Follow the AAA pattern (Arrange, Act, Assert).
- Mock external dependencies (database, APIs).
- Clean up after tests (reset state, close connections).

### III. User Experience Consistency
Ensure a seamless and intuitive user experience. All user-facing components must comply with WCAG 2.1 Level AA accessibility standards. Maintain consistency in design and interaction patterns across features.

**Performance Budgets**
- **Page Load (LCP)**: < 2.0 seconds (desktop), < 2.5 seconds (mobile).
- **First Input Delay (FID)**: < 100ms.
- **Cumulative Layout Shift (CLS)**: < 0.1.
- **Time to Interactive (TTI)**: < 3.0 seconds.
- **API Response (p95)**: < 500ms.
- **Database Query (p95)**: < 100ms.
- **JavaScript Bundle**: < 200KB initial load (gzip).

**Accessibility (WCAG 2.1 Level AA)**
- Ensure all interactive elements are keyboard accessible.
- Provide proper ARIA labels and roles.
- Maintain a color contrast ratio ≥ 4.5:1 for text.
- Make focus indicators visible on all interactive elements.
- Test with screen readers (NVDA, JAWS, VoiceOver).
- Use semantic HTML5 elements.
- Add alt text for all images.
- Include captions for videos.

**Responsive Design**
- Adopt a mobile-first approach.
- Use breakpoints: 640px (sm), 768px (md), 1024px (lg), 1280px (xl), 1536px (2xl).
- Test on real devices (e.g., iPhone, iPad, Android phones/tablets).
- Ensure touch targets are ≥ 44×44px.
- Avoid horizontal scrolling at any breakpoint.

**Loading States & Error Handling**
- Display loading skeletons for async content.
- Implement optimistic UI updates where appropriate.
- Provide clear error messages with actionable guidance.
- Use toast notifications for user actions (success, error, warning).
- Ensure graceful degradation for unsupported browsers.

### IV. Performance Requirements
Performance is a priority. All features must meet defined performance budgets: page load times under 2 seconds, API response times under 500ms (p95), and database query times under 100ms (p95). Conduct regular performance audits.

**Frontend**
- Default to Server Components (70% less JavaScript).
- Use dynamic imports for heavy components (`next/dynamic`).
- Optimize images with Next.js Image component (automatic WebP, lazy loading).
- Enable code splitting by route (automatic).
- Serve static assets via CDN (Vercel Edge Network).

**Backend**
- Use database connection pooling (Prisma default: 5 connections per function).
- Cache API responses (5-minute TTL for analytics/reports).
- Optimize Prisma queries (select only needed fields).
- Add indexes on all foreign keys and frequently queried columns.

**Monitoring**
- Use Vercel Analytics for Web Vitals.
- Leverage Vercel Speed Insights for performance metrics.
- Implement error tracking and logging.
- Monitor database query performance.


## Additional Constraints

### Required Technologies
- ✅ **Next.js** `15.5.5+` (App Router only, NO Pages Router).
- ✅ **React** `19.x` (Server Components by default).
- ✅ **TypeScript** `5.9.3+` (strict mode enabled).
- ✅ **Prisma ORM** (latest stable version).
- ✅ **SQLite** (local development only).
- ✅ **PostgreSQL** (production on Vercel Postgres).
- ✅ **Tailwind CSS** `4.1.14+` (utility-first styling).
- ✅ **Radix UI** + **shadcn/ui** (accessible component library).
- ✅ **NextAuth.js** `v5` (authentication).
- ✅ **Zod** (runtime validation).
- ✅ **React Hook Form** (form state management).
- ✅ **Vitest** `3.2.4+` (unit/integration testing).
- ✅ **Playwright** `1.56.0+` with MCP (E2E testing).
- ✅ **Vercel** (deployment platform).

### Prohibited Technologies
- ❌ **Redux/MobX/Zustand** (use React Server Components + hooks).
- ❌ **CSS-in-JS** (styled-components, emotion) - use Tailwind only.
- ❌ **GraphQL** (use REST API via Route Handlers).
- ❌ **MongoDB/NoSQL** (use PostgreSQL for relational data).
- ❌ **Pages Router** (must use App Router).
- ❌ **Class Components** (use functional components with hooks).
- ❌ **Moment.js** (use native Date or date-fns).
- ❌ **Lodash** (use native ES6+ methods or specific utilities).

### Architecture Patterns

**Server Components First**
- Default to Server Components unless explicitly marked with `'use client'`.
- Use Client Components only for event handlers, browser APIs, React hooks, and state management.
- Minimize client-side JavaScript bundle size.

**API Design**
- Follow RESTful conventions (GET, POST, PUT, DELETE, PATCH).
- Implement Route Handlers in `app/api/**/route.ts`.
- Use Server Actions for form mutations (`'use server'` functions).
- Standardize response format: `{ data: T, message?: string }` or `{ error: { code, message, details } }`.

**Database Access**
- Use Prisma Client ONLY (no raw SQL queries).
- Enforce multi-tenant middleware on all queries.
- Implement soft deletes for user data (set `deletedAt`).
- Use transactions for multi-step operations.
- Enable connection pooling for PostgreSQL.

### Database Guidelines

**Prisma Schema Conventions**
- Use snake_case for database column names (auto-mapped to camelCase in TypeScript).
- Define `id String @id @default(cuid())` for primary keys.
- Include `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` for all tables.
- Add `deletedAt DateTime?` for soft deletes.
- Include `storeId String` for all tenant-scoped tables.
- Create compound indexes for common queries: `@@index([storeId, createdAt])`.
- Define unique constraints: `@@unique([storeId, email])`, `@@unique([storeId, slug])`.

**Migrations**
- Apply schema changes via migrations (`npx prisma migrate dev`).
- Use descriptive migration names (`npx prisma migrate dev --name add-customer-table`).
- Avoid manual edits to migration files.
- Test migrations on staging before production.
- Backup database before running migrations.

**Query Optimization**
- Fetch only needed fields using `select`.
- Avoid N+1 queries; use `include` carefully.
- Paginate large result sets (`take`, `skip`).
- Add indexes on frequently queried columns.
- Use `count()` for pagination metadata.

### API Design Standards

**REST Conventions**
- `GET /api/resource` - List resources (with pagination).
- `GET /api/resource/[id]` - Get single resource.
- `POST /api/resource` - Create resource.
- `PUT /api/resource/[id]` - Update resource (full replacement).
- `PATCH /api/resource/[id]` - Update resource (partial).
- `DELETE /api/resource/[id]` - Delete resource (soft delete).

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
- `200 OK` - Successful GET, PUT, PATCH.
- `201 Created` - Successful POST.
- `204 No Content` - Successful DELETE.
- `400 Bad Request` - Validation error.
- `401 Unauthorized` - Not authenticated.
- `403 Forbidden` - Not authorized (no permission).
- `404 Not Found` - Resource not found.
- `422 Unprocessable Entity` - Semantic error.
- `429 Too Many Requests` - Rate limit exceeded.
- `500 Internal Server Error` - Server error.

**Pagination**
- Use query params: `?page=1&perPage=20`.
- Default: `perPage=10`, max: `perPage=100`.
- Include response meta: `{ page, total, perPage, totalPages }`.

### Security Requirements
Ensure all user data is encrypted at rest and in transit. Follow industry best practices for authentication and authorization, including HTTPS, secure cookies, and role-based access control.

**Authentication & Authorization**
- Use NextAuth.js v5 for authentication.
- Implement JWT sessions with HTTP-only cookies (SameSite=Lax).
- Hash passwords with bcrypt (cost factor: 12).
- Enforce Role-Based Access Control (RBAC) with granular permissions.
- Set session expiration to 30 days.
- Provide optional 2FA via TOTP.

**Input Validation**
- Validate all user inputs with Zod schemas (client + server).
- Sanitize HTML content using DOMPurify.
- Validate file uploads (type, size, content).
- Apply rate limiting on API routes (100 req/min per IP).

**Vulnerability Prevention**
- Prevent XSS with React automatic escaping + Content Security Policy headers.
- Protect against CSRF using Next.js built-in CSRF protection.
- Avoid SQL Injection with Prisma parameterized queries.
- Mitigate clickjacking with X-Frame-Options header.
- Regularly update dependencies (Dependabot).

### Compliance Standards
Ensure compliance with GDPR, CCPA, and other relevant data protection regulations. Conduct regular compliance reviews.

**Data Protection**
- Enforce multi-tenant isolation via Prisma middleware (auto-inject storeId).
- Use HTTPS only (enforced by Vercel).
- Store secrets in environment variables (never commit to git).
- Encrypt databases at rest (managed by Vercel Postgres).
- Support GDPR compliance: data export, deletion, consent management.

## Governance

This constitution supersedes all other practices. Amendments require documentation, approval, and a migration plan. All pull requests and reviews must verify compliance with the principles outlined in this document. Complexity must be justified, and runtime development guidance must be followed as outlined in the project documentation.

**Version**: 1.1.0 | **Ratified**: 2025-10-17 | **Last Amended**: 2025-10-17
