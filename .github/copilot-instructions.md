# StormCom - Copilot Instructions

StormCom is a comprehensive multi-tenant e-commerce SaaS platform built with Next.js 16 (Including Next.js MCP Server), TypeScript 5.9.3, and Prisma ORM. This file provides guidance for GitHub Copilot Coding Agent to work effectively with this codebase.

## Project Overview

- **Purpose**: Multi-tenant e-commerce management system for managing stores, products, orders, customers, and marketing campaigns
- **Architecture**: Next.js App Router with React Server Components, Prisma ORM, PostgreSQL/SQLite
- **Development Methodology**: Spec-Driven Development using GitHub Specs Kit (documentation-first approach)
- **Development Phase**: Phase 1 Complete (Specification), Phase 2 Foundation (in progress - no src/ code yet)
- **Target**: SaaS platform enabling businesses to run complete online stores with 99.9% uptime SLA

## Critical Reading Order (For New Agents)

**REQUIRED**: Read these files in order before making code changes:

1. `.specify/memory/constitution.md` - Project standards (300 line files, 50 line functions, 80%+ coverage)
2. `specs/001-multi-tenant-ecommerce/spec.md` - Complete feature specification (1,720 lines)
3. `.github/instructions/` - Area-specific coding rules (read based on file type you're editing)
4. This file - Cross-cutting patterns and workflows

## Repository Structure

Current documentation-first structure:

```
StormCom/
├── .github/
│   ├── copilot-instructions.md        # Copilot guidance (this file)
│   ├── copilot/                       # Copilot customizations
│   │   ├── chatmodes/                 # Custom chat modes
│   │   ├── instructions/              # Instruction files
│   │   ├── prompts/                   # Reusable prompts
│   │   ├── collections/               # File collections
│   │   └── tests/validate.js          # Validation script
│   └── instructions/                  # Area-specific coding rules
│       ├── api-routes.instructions.md
│       ├── components.instructions.md
│       ├── database.instructions.md
│       ├── documentation.instructions.md
│       ├── nextjs.instructions.md     # Next.js best practices + MCP
│       └── testing.instructions.md
├── .specify/
│   └── memory/
│       └── constitution.md            # Project constitution & standards
├── .mcp.json                          # MCP Server configuration
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

## Area-Specific Instructions (CRITICAL)

**Before editing ANY file**, check if it matches patterns in `.github/instructions/`:

| File Pattern | Instruction File | Key Rules |
|-------------|------------------|-----------|
| `src/app/api/**/route.ts`, `src/app/**/actions.ts` | `api-routes.instructions.md` | REST conventions, Zod validation, multi-tenant isolation |
| `src/components/**/*.tsx`, `src/app/**/page.tsx` | `components.instructions.md` | Server Components default, Client only for interactivity |
| `prisma/schema.prisma`, `prisma/migrations/**` | `database.instructions.md` | Prisma conventions, soft deletes, multi-tenant indexes |
| `**/*.md`, `docs/**` | `documentation.instructions.md` | Markdown style, link conventions |
| `**` (all files) | `nextjs.instructions.md` | Next.js 16 App Router, MCP Server, performance budgets |
| `**/*.test.ts`, `**/*.spec.ts`, `tests/**` | `testing.instructions.md` | 80%+ coverage, AAA pattern, co-location |

**Workflow**: Always read relevant instruction file(s) BEFORE editing to ensure compliance with area-specific standards.

## Spec-Driven Development Workflow

**CRITICAL**: StormCom follows documentation-first development using GitHub Specs Kit.

### Development Phases

1. **Specification Phase** (✅ Complete)
   - Write comprehensive feature specs in `specs/001-multi-tenant-ecommerce/spec.md`
   - Define data models, API contracts, user stories, acceptance criteria
   - Create OpenAPI specifications in `contracts/openapi.yaml`
   - Establish performance budgets and accessibility standards

2. **Planning Phase** (✅ Complete)
   - Generate implementation plan: `specify plan`
   - Break down into tasks: `specify tasks`
   - Define milestones and dependencies in `plan.md`, `tasks.md`

3. **Implementation Phase** (🔄 In Progress - Phase 2 Foundation)
   - Read specs FIRST before writing code
   - Implement features following spec requirements
   - Validate against spec: `specify validate`
   - Update specs if requirements change: `specify amend`

4. **Validation Phase** (Continuous)
   - Run Copilot customizations validator: `node .github/copilot/tests/validate.js`
   - Or via npm: `npm --prefix .github/copilot run validate`
   - Ensure chatmodes, instructions, prompts comply with standards

### Key Commands

```bash
# Spec Kit commands (when available)
specify plan          # Generate implementation plan
specify tasks         # Break down into actionable tasks
specify validate      # Validate code against spec
specify amend         # Update spec with requirement changes

# Copilot customizations validation
node .github/copilot/tests/validate.js
npm --prefix .github/copilot run validate
```

### Documentation-First Principle

**Before implementing ANY feature**:
1. Check if spec exists in `specs/001-multi-tenant-ecommerce/spec.md`
2. Read relevant sections (user stories, data model, API contracts)
3. Follow specified patterns (multi-tenant, authentication, validation)
4. If spec unclear/missing, ask user to clarify BEFORE coding
5. Update docs when behavior changes

## Tech Stack & Versions

### Core Framework
- **Next.js**: 16.0.0 (App Router only, NO Pages Router)
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
- **NextAuth.js**: v4+ (authentication & sessions)
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

- **NextAuth.js v4** for all authentication
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

---

## Next.js MCP Server Integration (REQUIRED)

**CRITICAL**: Next.js 16.0.0+ includes built-in Model Context Protocol (MCP) server support for AI-assisted development. StormCom REQUIRES both MCP servers for optimal Copilot agent experience.

### 1. Built-in Next.js MCP Server (Automatic in Next.js 16+)

The Next.js MCP server is **automatically enabled** in development and provides:

- **Real-time Application State**: Access live runtime information and internal state
- **Error Diagnostics**: Retrieve build errors, runtime errors, and type errors from dev server
- **Development Logs**: Access console output and server logs
- **Page Metadata**: Query page metadata, routes, and rendering details
- **Server Actions**: Inspect Server Actions by ID for debugging
- **Component Hierarchies**: Understand component structure and relationships

**Available Tools**:
- `get_errors`: Retrieve current build/runtime/type errors
- `get_logs`: Access development server logs
- `get_page_metadata`: Get page routes, components, rendering info
- `get_project_metadata`: Retrieve project structure and configuration
- `get_server_action_by_id`: Look up Server Actions for debugging

**Verification**:
```bash
# Start dev server (MCP enabled automatically in Next.js 16+)
npm run dev

# MCP server runs within Next.js dev server
# No additional configuration needed
```

### 2. Next DevTools MCP (External Package - REQUIRED)

**Installation**:
```bash
# Create .mcp.json at project root
# f:\StormCom\.mcp.json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

**Features**:
- **Next.js Knowledge Base**: Query comprehensive Next.js 16 documentation and best practices
- **Migration Tools**: Automated codemods for upgrading to Next.js 16
- **Cache Components Guide**: Setup assistance for Cache Components and PPR
- **Browser Testing**: Playwright MCP integration for E2E testing
- **Dev Server Discovery**: Automatically connects to running Next.js dev servers

**Available Tools**:
- `nextjs_docs`: Search Next.js documentation with natural language queries
- `upgrade_nextjs_16`: Run automated codemods for Next.js 16 migration
- `enable_cache_components`: Setup Cache Components configuration
- `browser_eval`: Execute Playwright commands for browser testing
- `nextjs_runtime`: Query running dev server for routes, errors, diagnostics

**Available Prompts**:
- "Help me upgrade my Next.js app to version 16"
- "When should I use 'use client' in App Router?"
- "What's the structure of my Next.js routes?"
- "Explain Cache Components and how to use them"
- "How do I optimize performance in Next.js 16?"

### 3. MCP Workflow for Copilot Agents

**Development Workflow**:
```bash
# 1. Start Next.js dev server (MCP enabled automatically)
npm run dev

# 2. Copilot agent connects to MCP servers automatically via .mcp.json

# 3. Agent can now query live application state
# Example prompts:
# - "What errors are currently in my application?"
# - "Show me the structure of my dashboard routes"
# - "Help me debug this Server Action error"
# - "Optimize this page for performance"
```

**Example Agent Interaction**:
```typescript
// User: "What errors are currently in my application?"

// Agent Action:
// 1. Calls get_errors tool from Next.js MCP server
// 2. Retrieves build errors, runtime errors, type errors
// 3. Analyzes errors and provides actionable fixes

// Agent Response:
// "Found 2 errors in your application:
// 
// 1. Type Error in app/dashboard/products/page.tsx:42
//    Property 'storeId' is missing in type 'Product'
//    Fix: Add storeId to Product type definition
//
// 2. Runtime Error in app/api/orders/route.ts:28
//    Cannot read property 'id' of undefined
//    Fix: Add null check before accessing order.id"
```

**Benefits for StormCom Development**:
- **Context-Aware Suggestions**: Agent recommends features based on existing structure
- **Live Application State**: Query current routes, middleware, errors during development
- **Multi-Tenant Awareness**: Agent understands route groups and tenant isolation patterns
- **Performance Insights**: Get recommendations based on actual performance metrics
- **Accurate Implementations**: Generate code following StormCom patterns and conventions

### 4. Configuration for StormCom

**Required Files**:
```bash
# f:\StormCom\.mcp.json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}

# No configuration needed for built-in Next.js MCP server
# Automatically enabled in Next.js 16+ development mode
```

**Verification Checklist**:
- [ ] Next.js 16.0.0+ installed
- [ ] `.mcp.json` created at project root
- [ ] `npm run dev` starts without errors
- [ ] Copilot agent can query MCP servers
- [ ] Test prompt: "What's the structure of my Next.js routes?"

### 5. Troubleshooting MCP Connection

**Common Issues**:
```bash
# Issue: MCP server not connecting
# Solution 1: Verify Next.js version
npm list next
# Should be 16.0.0 or higher

# Solution 2: Restart dev server
npm run dev

# Solution 3: Check .mcp.json syntax
cat .mcp.json
# Ensure valid JSON format

# Solution 4: Verify Copilot agent MCP configuration
# Check agent settings for .mcp.json path
```

**Resources**:
- [Next.js MCP Documentation](https://nextjs.org/docs/app/guides/mcp)
- [Next DevTools MCP Package](https://www.npmjs.com/package/next-devtools-mcp)
- [Vercel MCP Template](https://vercel.com/templates/next.js/model-context-protocol-mcp-with-next-js)
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16)

---

## Getting Help

- **Documentation**: Start with `README.md` and `docs/`
- **Constitution**: `.specify/memory/constitution.md`
- **Specifications**: `specs/001-multi-tenant-ecommerce/`
- **Issues**: Check existing GitHub issues for context and discussions
- **Demo**: Reference demo at https://ecom-demo.workdo.io/ for UI/UX guidance
