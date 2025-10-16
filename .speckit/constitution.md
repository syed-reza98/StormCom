# Project Constitution: EcommerceGo SaaS

**Project**: EcommerceGo SaaS Multi-Tenant E-commerce Platform  
**Tech Stack**: Next.js 15 + TypeScript + Prisma + SQLite/PostgreSQL  
**Created**: 2025-10-16  
**Version**: 1.0

---

## 1. Core Principles

### 1.1 Code Quality Standards

**TypeScript Strict Mode**
- All code MUST use TypeScript with `strict: true`
- No `any` types except when interfacing with untyped libraries
- Explicit return types for all functions
- Proper type guards and narrowing

**Code Style**
- ESLint rules strictly enforced
- Prettier for automatic formatting
- Consistent naming conventions
- Maximum 300 lines per file

### 1.2 Testing Standards

**Test Coverage Requirements**
- Minimum 80% coverage for business logic
- 100% coverage for utilities
- E2E tests for critical paths
- Integration tests for all API routes

### 1.3 User Experience

**Performance Budgets**
- Page load (LCP) < 2 seconds
- First Input Delay < 100ms
- API response p95 < 500ms

**Accessibility**
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Semantic HTML

---

## 2. Architecture Constraints

### 2.1 Required Technologies
- ✅ Next.js 15+ (App Router only)
- ✅ TypeScript 5.3+
- ✅ Prisma ORM
- ✅ SQLite (local) / PostgreSQL (production)
- ✅ shadcn/ui components
- ✅ TailwindCSS

### 2.2 Prohibited
- ❌ No Redux/MobX
- ❌ No CSS-in-JS
- ❌ No GraphQL
- ❌ No MongoDB

---

## 3. Security

- NextAuth.js for authentication
- RBAC for authorization
- Input validation with Zod
- Multi-tenant data isolation
- No sensitive data in logs

---

## 4. Database

- Prisma schema with SQLite/PostgreSQL
- Migrations for all schema changes
- Indexes on foreign keys
- Audit timestamps (createdAt, updatedAt)

---

## 5. API Design

- RESTful conventions
- Standardized error responses
- Pagination for list endpoints
- Rate limiting

---

For complete details, see full constitution in repository.
