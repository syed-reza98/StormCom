# StormCom - Copilot Agent Onboarding

**Multi-tenant e-commerce SaaS platform: Next.js 16, TypeScript 5.9.3, Prisma ORM, React 19 Server Components**

## Quick Facts
- **Size**: 295 TypeScript/React files, 42+ DB models, 100+ API endpoints
- **Stack**: Next.js 16 App Router, Prisma (SQLite dev/PostgreSQL prod), Tailwind v4.1.14, Vitest, Playwright
- **Standards**: 300 line files max, 50 line functions max, 80% test coverage, WCAG 2.1 AA, multi-tenant isolation
- **Node**: ≥20.0.0 (tested v20.19.5) | **npm**: ≥10.0.0 (tested v10.9.4)

## Critical Build Issues (Read First!)

**BEFORE ANY WORK**, understand these known issues:

1. **Build Currently FAILS**: TypeScript errors in `src/services/analytics-service.ts:384` (syntax) + Radix UI module resolution errors
2. **ESLint Broken**: `npm run lint` fails (eslint not in PATH) - use `npx eslint .` instead
3. **Vitest Not Global**: `npm run test` fails - use `npx vitest run` instead
4. **Fresh Install Required**: Always `npm install` first (~2-3 mins, peer dep warnings are safe)
5. **Prisma Auto-Generated**: Postinstall hook runs `prisma generate` - manual run only if schema changes

**First Commands** (validated workflow):
```bash
npm install                    # 2-3 mins, ignore peer warnings
npm run type-check            # Shows current 3 TypeScript errors
npx eslint .                  # Lint check (don't use npm run lint)
npm run dev                   # Starts dev server (works despite build issues)
```

## Validated Build Workflows

### Initial Setup (First Time)
```bash
npm install                           # Install deps (~2-3 min)
cp .env.example .env                  # Copy and edit: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npx prisma db push                    # Sync schema (dev.db already exists with data)
npx prisma db seed                    # Optional: re-seed test data
npm run dev                           # Start http://localhost:3000
```

### Daily Development
```bash
npm run dev                           # Dev server with Turbopack
npm run type-check                    # TypeScript strict check
npx eslint . --fix                    # Lint with auto-fix
npm run format                        # Prettier formatting
npm run db:studio                     # Prisma Studio GUI
npx vitest run                        # Unit tests (when working)
npx playwright test                   # E2E tests (requires browser install)
```

### Database Operations
```bash
npm run db:push                       # Sync schema changes (dev)
npm run db:migrate                    # Create migration (prod workflow)
npm run db:seed                       # Seed database
npx prisma studio                     # Database browser GUI
```

### Known Command Workarounds
| Broken Command | Working Alternative | Reason |
|----------------|---------------------|--------|
| `npm run lint` | `npx eslint .` | eslint not in PATH |
| `npm run test` | `npx vitest run` | vitest not in PATH |
| `npm run build` | ❌ Currently fails | See Critical Issues above |

## Architecture Quick Reference

**Multi-Tenant Isolation** (SECURITY CRITICAL):
- ALL queries MUST filter by `storeId` - Prisma middleware auto-injects for tenant tables
- Session includes `storeId` via NextAuth.js
- Route groups: `(admin)` cross-store, `(dashboard)` tenant-scoped, `(storefront)` public

**Next.js 16 Breaking Changes**:
- Route handler `params` are now Promises: `const { id } = await params` (not `params.id`)
- Server Components default (70%+ target) - `'use client'` only for events/hooks/browser APIs
- App Router only - NO Pages Router

**Database Patterns** (Prisma):
- Primary key: `id String @id @default(cuid())`
- Timestamps: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
- Soft delete: `deletedAt DateTime?` (filter in all queries: `where: { deletedAt: null }`)
- Multi-tenant: `storeId String` + `@@index([storeId, createdAt])`

**Code Quality Limits** (from `.specify/memory/constitution.md`):
- Max 300 lines per file | Max 50 lines per function (refactor if exceeded)
- NO `any` types (use `unknown` + type guards) | TypeScript strict mode REQUIRED
- Test coverage: 80% business logic, 100% utilities
- Naming: camelCase (vars), PascalCase (components/types), UPPER_SNAKE_CASE (constants)

## Project Structure

```
.github/instructions/           # File-specific coding rules (READ BEFORE EDITING)
  ├── api-routes.instructions.md      # REST patterns, Zod validation, multi-tenant
  ├── components.instructions.md      # Server vs Client components
  ├── database.instructions.md        # Prisma patterns, migrations
  └── nextjs.instructions.md          # Next.js 16 App Router, MCP

src/app/                        # Next.js App Router
  ├── (admin)/                  # Cross-store admin routes
  ├── (dashboard)/              # Tenant-scoped: products, orders, customers
  ├── (storefront)/             # Customer-facing pages
  └── api/                      # 100+ API Route Handlers

prisma/
  ├── schema.prisma             # 42+ models (DO NOT edit migrations manually)
  ├── dev.db                    # SQLite (991KB, already seeded)
  └── migrations/               # Database migrations

specs/001-multi-tenant-ecommerce/  # Spec-Driven Development docs
  ├── spec.md                   # Feature requirements (1042 lines)
  ├── data-model.md             # DB schema docs (2106 lines)
  └── contracts/openapi.yaml    # API specification

.specify/memory/constitution.md # PROJECT STANDARDS - READ FIRST
```

## CI/CD & Validation

**GitHub Workflows** (`.github/workflows/`):
- **e2e.yml**: Playwright tests on PR/push (chromium, firefox, webkit matrix, 30 min timeout)
  - Steps: `npm ci` → `prisma generate/db push` → `build` → `start` → `test`
- **copilot-setup-steps.yml**: Validation workflow (Node 20, npm 10, Playwright browsers, Prisma SQLite)

**Pre-Commit Checklist**:
```bash
npm run type-check          # TypeScript strict
npx eslint . --fix          # Lint + auto-fix
npm run format              # Prettier
npx vitest run              # Unit tests (when passing)
```

## Critical Documentation (Mandatory Reading)

**Reading Order**:
1. `.specify/memory/constitution.md` - Standards, limits, requirements (300/50 line limits, 80% coverage)
2. `.github/instructions/*.md` - File-specific rules (match pattern before editing)
3. `specs/001-multi-tenant-ecommerce/spec.md` - Feature requirements, user stories
4. `NEXT16_COMPATIBILITY_FIXES.md` - Breaking changes from Next.js 15→16

**File-Specific Instructions** (`.github/instructions/`):
- Editing `src/app/api/**/route.ts` or Server Actions? → `api-routes.instructions.md`
- Creating React components? → `components.instructions.md`
- Modifying Prisma schema? → `database.instructions.md`
- Writing tests? → `testing.instructions.md`

## Common Pitfalls & Best Practices

**NEVER**:
- ❌ Use `any` type (use proper types or `unknown` + guards)
- ❌ Skip `storeId` filtering (security vulnerability)
- ❌ Use Client Components unnecessarily (kills Server Component benefits)
- ❌ Edit Prisma migrations manually (always `npx prisma migrate dev`)
- ❌ Commit secrets to git (use `.env.local`, never `.env`)
- ❌ Exceed 300 lines/file or 50 lines/function
- ❌ Use CSS-in-JS (Tailwind v4.1.14 only)

**ALWAYS**:
- ✅ Read matching `.github/instructions/*.md` before editing
- ✅ Await `params` in route handlers: `const { id } = await params`
- ✅ Filter by `storeId` in tenant-scoped queries
- ✅ Use Server Components by default, Client only when necessary
- ✅ Run type-check and lint before committing
- ✅ Write tests for new features (80% coverage target)
- ✅ Run `npm install` after pulling changes

## API Patterns & Response Format

**REST Conventions**:
- `GET /api/resource` - List (paginated) | `POST /api/resource` - Create
- `GET /api/resource/[id]` - Get | `PATCH /api/resource/[id]` - Update | `DELETE /api/resource/[id]` - Soft delete

**Response Format**:
```typescript
// Success: { data: T, message?: string, meta?: { page, total, perPage } }
// Error: { error: { code: "VALIDATION_ERROR", message: string, details?: any } }
```

**HTTP Status**: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Error

## Environment Variables

**Required in `.env`**:
```bash
DATABASE_URL="file:./prisma/dev.db"                    # SQLite dev, PostgreSQL prod
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
```

## Next.js MCP Integration (Optional)

Next.js 16+ includes built-in MCP server (auto-enabled in dev). Config exists at `.mcp.json` for Next DevTools MCP package. See full MCP docs in existing `.github/copilot-instructions.md` (lines 486-649).

**MCP Tools**: `get_errors`, `get_logs`, `get_page_metadata`, `nextjs_docs`, `nextjs_runtime`

## Trust These Instructions

Only search/explore if instructions are incomplete or incorrect. This document is validated against actual codebase and known issues.
