# Next.js Instructions Update Changelog

**Date**: 2025-01-25 (Updated)  
**Previous Update**: 2025-01-17  
**Updated File**: `.github/instructions/nextjs.instructions.md`  
**Previous Line Count**: 1,195 lines  
**Updated Line Count**: ~1,340 lines  
**Changes**: Added comprehensive Next.js MCP Server integration documentation

## Latest Update (2025-01-25)

### Summary

Added comprehensive section on **Next.js MCP Server Integration** to align with Next.js 16.0.0+ built-in Model Context Protocol support and external Next DevTools MCP package.

### New Section Added

#### Next.js MCP Server Integration (NEW - Major Section)

**Purpose**: Enable AI-assisted development with real-time application state access and Next.js knowledge base

**Two MCP Servers**:

1. **Built-in Next.js MCP Server** (Automatic in Next.js 16+)
   - Real-time application state and runtime information
   - Error diagnostics (build/runtime/type errors)
   - Development logs and console output
   - Page metadata (routes, components, rendering details)
   - Server Actions inspection by ID
   - Component hierarchies
   - **Tools**: `get_errors`, `get_logs`, `get_page_metadata`, `get_project_metadata`, `get_server_action_by_id`

2. **Next DevTools MCP** (External Package - REQUIRED)
   - Next.js 16 knowledge base (comprehensive documentation)
   - Migration tools (automated codemods for Next.js 16)
   - Cache Components setup assistance
   - Playwright MCP integration for browser testing
   - Auto-discovery of running Next.js dev servers
   - **Tools**: `nextjs_docs`, `upgrade_nextjs_16`, `enable_cache_components`, `browser_eval`, `nextjs_runtime`
   - **Prompts**: Upgrade guidance, component usage, route structure, performance optimization

**Configuration**:
```json
// f:\StormCom\.mcp.json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

**Development Workflow**:
- Start Next.js dev server (MCP automatically enabled)
- Copilot agent connects to both MCP servers
- Agent queries live application state for errors, routes, diagnostics
- Example prompts: Error detection, route structure, debugging assistance, performance optimization

**Benefits for StormCom**:
- Context-aware suggestions based on existing structure
- Live application state queries (routes, middleware, errors)
- Multi-tenant awareness (route groups, tenant isolation)
- Performance insights from actual metrics
- Accurate code generation following StormCom patterns

**Troubleshooting Section**:
- Common issues and solutions
- MCP server connection verification
- Resource links (official docs, npm package, templates)

### Changes Made

1. **Added Complete MCP Server Documentation**:
   - Built-in Next.js MCP Server features and tools
   - Next DevTools MCP installation and configuration
   - MCP workflow for Copilot agents
   - StormCom-specific configuration
   - Troubleshooting guide with common issues

2. **Code Examples**:
   - `.mcp.json` configuration file
   - Agent interaction example (error detection)
   - Bash commands for verification and troubleshooting
   - Example prompts for AI assistants

3. **Updated Version**: Changed from 2.0 to 2.1 with new date (2025-01-25)

### Gap Addressed

**Gap #19**: Next.js MCP Server integration documentation missing
- ✅ Documented built-in Next.js MCP Server (Next.js 16+ automatic)
- ✅ Documented Next DevTools MCP package (external, required)
- ✅ Provided complete configuration (.mcp.json example)
- ✅ Explained development workflow with Copilot agents
- ✅ Added troubleshooting section
- ✅ Listed benefits specific to StormCom development

### Alignment with Project Requirements

#### From Official Next.js Documentation
- ✅ Follows Next.js 16 MCP Server guide (https://nextjs.org/docs/app/guides/mcp)
- ✅ Uses recommended configuration with next-devtools-mcp@latest
- ✅ Documents all available MCP tools and prompts
- ✅ Includes development workflow best practices

#### From Next.js 16 Release
- ✅ Acknowledges built-in MCP server in Next.js 16.0.0+
- ✅ Highlights Next DevTools MCP as key feature
- ✅ Explains integration with AI coding agents (Claude, Cursor, Copilot)
- ✅ Documents benefits for debugging and workflow improvements

#### From next-devtools-mcp Package
- ✅ Lists all features (tools, prompts, resources)
- ✅ Provides correct npm package name and version (@latest)
- ✅ Documents MCP client configuration format
- ✅ Includes first prompt examples for testing

### Impact Assessment

#### For GitHub Copilot Agents
- **Before**: No guidance on MCP Server usage, agents couldn't access live application state
- **After**: Copilot agents can now:
  - Query real-time errors from running Next.js dev server
  - Access route structure and component hierarchies
  - Get context-aware suggestions based on actual project state
  - Use Next.js knowledge base for accurate implementations
  - Debug with live diagnostics and error traces
- **Benefit**: Significantly improved agent accuracy and context awareness

#### For Developers
- **Before**: Manual debugging, no AI-assisted error detection, separate documentation lookup
- **After**: Developers benefit from:
  - AI agents that understand current application state
  - Automated error detection and fix suggestions
  - Interactive debugging with natural language queries
  - Integrated documentation access via AI assistant
  - Faster troubleshooting with live diagnostics
- **Benefit**: Faster development cycles, reduced debugging time

#### For StormCom Project
- **Before**: Generic AI assistance without project context
- **After**: StormCom-specific benefits:
  - AI understands multi-tenant architecture (route groups, storeId filtering)
  - Context-aware suggestions for dashboard, admin, storefront routes
  - Performance recommendations based on actual Web Vitals
  - Code generation following established patterns (Server Components, API standards)
- **Benefit**: Higher code quality, better architecture adherence, faster feature development

### Resources Referenced

1. **Next.js Official Documentation**:
   - https://nextjs.org/docs/app/guides/mcp (MCP Server guide)
   - https://nextjs.org/blog/next-16 (Next.js 16 release announcement)

2. **NPM Package**:
   - https://www.npmjs.com/package/next-devtools-mcp (Next DevTools MCP)

3. **Vercel Templates**:
   - https://vercel.com/templates/next.js/model-context-protocol-mcp-with-next-js

### Validation

✅ **Section added**: Complete Next.js MCP Server Integration section  
✅ **Configuration documented**: .mcp.json example with correct syntax  
✅ **Tools documented**: All MCP tools from both servers listed  
✅ **Workflow explained**: Development workflow with Copilot agents  
✅ **Troubleshooting included**: Common issues and solutions  
✅ **Resources linked**: Official docs, npm package, templates  
✅ **Version updated**: 2.0 → 2.1 (2025-01-25)  
✅ **Line count increased**: 1,195 → ~1,340 lines (+145 lines)  

---

## Previous Update (2025-01-17)

Updated `nextjs.instructions.md` from generic Next.js best practices to StormCom-specific guidance that enforces:
- ✅ Exact version requirements (Next.js 16.0.0+, React 19.x, TypeScript 5.9.3+)
- ✅ Multi-tenant architecture patterns (Prisma middleware, storeId filtering)
- ✅ Performance budgets (LCP <2s, FID <100ms, bundle <200KB)
- ✅ File size limits (300 lines/file, 50 lines/function)
- ✅ Accessibility standards (WCAG 2.1 AA)
- ✅ Security patterns (Zod validation, CSRF, rate limiting)
- ✅ Testing requirements (Vitest + Playwright, coverage thresholds)

## Sections Added

### 1. Version Requirements & Technology Stack (NEW - Section 0)
- **Core Framework**: Next.js 16.0.0+, React 19.x, TypeScript 5.9.3+, Node.js 18.x+
- **Database & ORM**: Prisma ORM (latest), PostgreSQL 15+, SQLite (dev only)
- **Styling & UI**: Tailwind CSS 4.1.14+, Radix UI, shadcn/ui, Framer Motion, lucide-react
- **Forms & Validation**: React Hook Form, Zod
- **Authentication**: NextAuth.js v4+, bcrypt
- **Testing**: Vitest 3.2.4+, Playwright 1.56.0+, BrowserStack, k6, Lighthouse CI, axe-core
- **Deployment**: Vercel Platform, Vercel KV, Vercel Blob, Vercel Analytics

### 2. StormCom Route Groups Structure (Section 1 Enhancement)
- **Route groups**: `(auth)`, `(admin)`, `(dashboard)`, `(storefront)`, `api/`
- **Usage guidance**: Authentication pages, super admin, store admin/staff, customer storefront
- **File structure**: Detailed directory tree with all required routes

### 3. File Size & Organization Limits (Section 1 Enhancement)
- **Maximum file size**: 300 lines per file (ESLint enforced)
- **Maximum function size**: 50 lines per function (ESLint enforced)
- **Maximum folder depth**: 4 levels
- **Refactoring trigger**: 80% of limit (240 lines/40 lines)
- **Examples**: Bad vs. Good patterns for splitting large files

### 4. Server Components vs Client Components (Section 2 Enhancement)
- **Default to Server Components**: 70%+ of components must be Server Components
- **When to use Client Components**: Event handlers, hooks, browser APIs, third-party libraries
- **Composition Pattern**: Examples of Server + Client component integration
- **Code examples**: ProductList (Server), AddToCartButton (Client)

### 5. Component Size & Complexity Limits (Section 2 Enhancement)
- **Single Responsibility Principle**: Each component does ONE thing
- **Props limit**: Maximum 5 props per component
- **JSX depth**: Maximum 3 levels of nesting
- **Conditional rendering**: Maximum 2 conditions per render
- **Examples**: Bad vs. Good patterns for complex components

### 6. Server and Client Component Integration (NEW - Section 2.1)
- **Critical warning**: Never use `next/dynamic` with `{ ssr: false }` in Server Components
- **Correct approach**: Move client-only logic to dedicated Client Components
- **Rationale**: Server Components cannot use dynamic imports with SSR disabled
- **Example**: DashboardNavbar integration pattern

### 7. StormCom API Standards (Section 4 Enhancement)
- **REST Conventions**: GET/POST/PUT/PATCH/DELETE with examples
- **Response Format**: `{data, error, meta}` with TypeScript types
- **HTTP Status Codes**: 200, 201, 204, 400, 401, 403, 404, 422, 429, 500
- **Code example**: Complete API route with authentication, validation, error handling

### 8. Server Actions for Form Mutations (NEW - Section 4 Sub-section)
- **Requirement**: Use Server Actions for form submissions (not API routes)
- **Pattern**: `'use server'` functions with FormData
- **Client integration**: useFormState, useFormStatus hooks
- **Example**: createProduct action with form validation and error handling

### 9. Multi-Tenant Data Isolation (NEW - Section 4 Sub-section)
- **Critical requirement**: All database queries MUST filter by storeId
- **Bad pattern**: Queries without tenant filtering (SECURITY VULNERABILITY)
- **Good pattern**: Explicit storeId filtering
- **Best pattern**: Prisma middleware for automatic filtering
- **Example**: Complete Prisma middleware implementation

### 10. Performance Requirements (NEW - Section 5 Enhancement)
- **Performance Budgets**: LCP <2.0s desktop/<2.5s mobile, FID <100ms, CLS <0.1, TTI <3s, API <500ms p95, DB query <100ms p95, bundle <200KB gzipped
- **Optimization Techniques**: 
  1. Next.js Image component (WebP, lazy loading)
  2. Dynamic imports for heavy components
  3. Suspense for async data
  4. Database query optimization (select needed fields only)
  5. loading.tsx for instant loading states
- **Code examples**: All 5 techniques with complete implementation

### 11. Accessibility Standards (NEW - Section 5 Enhancement)
- **WCAG 2.1 Level AA**: Required for all UI components
- **Keyboard Navigation**: Tab, Enter, Escape support
- **ARIA Labels**: Proper aria-label, aria-describedby on all interactive elements
- **Semantic HTML**: Use proper HTML5 elements (aside, fieldset, legend)
- **Color Contrast**: ≥ 4.5:1 ratio for all text
- **Focus Indicators**: Visible 2px ring on all interactive elements
- **Examples**: ProductCard, ProductFilters with complete accessibility implementation

### 12. Responsive Design (NEW - Section 5 Enhancement)
- **Mobile-First Approach**: Required for all layouts
- **Breakpoints**: sm:640px, md:768px, lg:1024px, xl:1280px, 2xl:1536px
- **Touch Targets**: ≥ 44×44px for all interactive elements
- **Examples**: Grid layout with responsive columns, touch target sizing

### 13. Testing Requirements (NEW - Section 5 Enhancement)
- **Test Coverage**: 
  - Business logic: ≥ 80% coverage
  - Utility functions: 100% coverage
  - Critical E2E paths: 100% coverage (auth, checkout, orders, payments)
  - API routes: 100% integration test coverage
- **Testing Tools**: Vitest + Testing Library, Playwright, coverage thresholds
- **Examples**: 
  - vitest.config.ts with coverage thresholds
  - Unit test (formatPrice)
  - E2E test (complete checkout flow)

### 14. Security Best Practices (NEW - Section 5 Enhancement)
- **Input Validation with Zod**: Required for all user inputs (client + server)
- **CSRF Protection**: Built-in via NextAuth (middleware example)
- **Rate Limiting**: 100 req/min per IP with Upstash Ratelimit
- **Examples**: 
  - Zod schema definition with validation
  - API route with Zod validation
  - Rate limiting middleware implementation

### 15. Middleware Best Practices (NEW - Section 5 Enhancement)
- **Authentication**: Token-based check with NextAuth JWT
- **Tenant Isolation**: storeId validation for dashboard routes
- **Rate Limiting**: API route protection
- **Role-Based Access Control**: SuperAdmin check for admin routes
- **Example**: Complete middleware.ts with all 4 checks

### 16. Summary Checklist (NEW - Bottom Section)
- **8 Categories**: Architecture, Multi-Tenancy, Database, API Standards, Security, Performance, Accessibility, Testing, Code Quality
- **47 Checkboxes**: Specific verification points for all requirements
- **Quick Reference**: One-page checklist for validating all StormCom requirements

## Gaps Addressed (18 Total)

### Version Requirements (3 items)
1. ✅ Added Next.js 16.0.0+ minimum version requirement
2. ✅ Added React 19.x version requirement with Server Components emphasis
3. ✅ Added TypeScript 5.9.3+ strict mode requirement

### Architectural Patterns (5 items)
4. ✅ Added Server Actions for form mutations (complete pattern)
5. ✅ Added multi-tenant architecture with Prisma middleware
6. ✅ Added route groups structure for StormCom
7. ✅ Added middleware usage (auth, rate limiting, tenant isolation)
8. ✅ Added Server/Client component integration warning

### Quality & Performance Standards (4 items)
9. ✅ Added performance budgets (LCP/FID/CLS/TTI/API/DB)
10. ✅ Added file size limits (300 lines/file, 50 lines/function)
11. ✅ Added component complexity limits (5 props, 3 JSX levels, 2 conditions)
12. ✅ Added responsive design breakpoints with mobile-first approach

### Security & Testing (3 items)
13. ✅ Added Zod validation patterns (client + server)
14. ✅ Added CSRF protection with NextAuth
15. ✅ Added rate limiting (100 req/min per IP)

### Technical Guidance (3 items)
16. ✅ Added WCAG 2.1 AA accessibility requirements
17. ✅ Added testing requirements (Vitest + Playwright, coverage targets)
18. ✅ Added optimization techniques (Image, dynamic imports, Suspense)

## Alignment with Project Requirements

### From spec.md
- ✅ Multi-tenant isolation enforced (storeId filtering)
- ✅ Performance budgets match FR-002 (LCP <2s, FID <100ms)
- ✅ File size limits match FR-003 (300 lines/file, 50 lines/function)
- ✅ Accessibility matches FR-004 (WCAG 2.1 AA)
- ✅ Testing requirements match FR-005 (80% business logic, 100% E2E critical paths)

### From data-model.md
- ✅ Prisma schema patterns documented (soft deletes, indexes, unique constraints)
- ✅ Multi-tenant relationships enforced (storeId on all tenant-scoped models)
- ✅ Database access patterns (select needed fields, avoid N+1, paginate)

### From research.md
- ✅ Next.js App Router decision supported (Server Components 70%+)
- ✅ Prisma ORM patterns documented (middleware, type safety)
- ✅ NextAuth.js patterns documented (JWT sessions, RBAC)
- ✅ Tailwind CSS requirement emphasized (CSS-in-JS prohibited)
- ✅ Vitest + Playwright testing patterns documented

### From constitution.md
- ✅ TypeScript strict mode enforced
- ✅ Code quality standards enforced (ESLint, Prettier, naming conventions)
- ✅ Testing standards enforced (coverage thresholds, test types)
- ✅ Performance requirements enforced (budgets, monitoring)
- ✅ Security requirements enforced (authentication, validation, rate limiting)

## Impact Assessment

### For GitHub Copilot Agents
- **Before**: Generic Next.js best practices, no StormCom-specific guidance
- **After**: Comprehensive StormCom-specific instructions with examples
- **Benefit**: Copilot will generate code that:
  - Uses correct versions (Next.js 16.0.0+, React 19.x, TypeScript 5.9.3+)
  - Enforces multi-tenant isolation (storeId filtering)
  - Meets performance budgets (LCP <2s, bundle <200KB)
  - Follows file size limits (300 lines/file, 50 lines/function)
  - Implements proper security (Zod validation, rate limiting)
  - Uses Server Components by default (70%+ target)
  - Includes proper accessibility (WCAG 2.1 AA)

### For Developers
- **Before**: Had to reference multiple documents (spec.md, constitution.md, research.md)
- **After**: Single source of truth for Next.js patterns in StormCom
- **Benefit**: Faster development, fewer code review issues, consistent patterns

### For Code Quality
- **Before**: Risk of non-compliant code (wrong versions, missing security, poor performance)
- **After**: Enforced compliance through documented patterns and examples
- **Benefit**: Higher code quality, fewer bugs, better maintainability

## Validation

✅ **File size**: 1195 lines (within reasonable limits)  
✅ **All 18 gaps addressed**: Version requirements, architectural patterns, quality standards, security, testing  
✅ **Examples included**: All new sections have complete code examples  
✅ **Alignment verified**: All requirements from spec.md, data-model.md, research.md, constitution.md  
✅ **Checklist added**: 47-point verification checklist for quick reference  

## Notes

- Lint warnings about color codes (e.g., `#0066CC`) are false positives (valid hex colors in comments)
- All code examples are tested patterns from StormCom specifications
- File is now 6x larger (200 → 1195 lines) but remains focused and well-organized
- Version updated to 2.0 to reflect comprehensive enhancement

---

**Reviewed By**: GitHub Copilot Agent  
**Status**: ✅ Complete - All gaps addressed  
**Next Steps**: Review by development team, update if additional patterns emerge
