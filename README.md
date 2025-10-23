# StormCom - Multi-Tenant E-commerce SaaS Platform

**A comprehensive full-stack e-commerce management system built with Next.js 16 (Including Next.js MCP Server), TypeScript, Prisma ORM, and Spec-Driven Development**

[![Next.js](https://img.shields.io/badge/Next.js-16.0.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-Latest-2D3748?logo=prisma)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.14-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3.2.4-6E46D6?logo=vitest)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-1.56.0-00A36B?logo=playwright)](https://playwright.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com/)

---

## 🎯 Overview

**StormCom** is a comprehensive multi-tenant e-commerce SaaS platform enabling mid-market businesses to manage complete online stores with robust capabilities for product management, order processing, customer engagement, and marketing automation.

Built using **Spec-Driven Development** methodology with [GitHub Specs Kit](https://github.com/github/spec-kit), ensuring high-quality, maintainable, and well-tested code following strict constitutional standards.

**Current Status**: Phase 1 Complete - Specification & Planning phase finished. Design System implementation ready. Implementation begins with Phase 2 foundational tasks.

### Key Capabilities

- 🏪 **Multi-Tenant Architecture** - Complete tenant isolation via Prisma middleware with automatic storeId filtering
- 📦 **Product Management** - Variants, categories, brands, attributes, media, inventory tracking
- 🛒 **Order Processing** - Complete lifecycle (pending → processing → shipped → delivered), returns workflow
- 👥 **Customer CRM** - Profiles, analytics, wishlists, purchase history, loyalty tracking
- 📊 **Analytics & Reports** - Sales trends, inventory insights, customer analytics with export capability
- 🎯 **Marketing Tools** - Coupons (volume/value/tiered), flash sales, email newsletters, abandoned cart recovery
- 📝 **Content Management** - Pages, blog posts, menus, FAQs, dynamic content blocks
- 🏪 **POS (Point of Sale)** - In-store transactions, offline support, stock sync
- 🔐 **Enterprise Security** - NextAuth.js v4+ with TOTP MFA, OIDC/SAML SSO, RBAC (predefined roles), bcrypt password hashing
- ⚡ **Performance** - Server Components (70% less JS), optimized queries, <2s LCP, 99.9% uptime SLA
- ♿ **Accessibility** - WCAG 2.1 Level AA compliance, keyboard navigation, semantic HTML
- 🎨 **Design System** - Token-driven Tailwind CSS v4, dark mode, per-tenant branding with CSS variable injection

---

## 🛠️ Tech Stack (Current Versions)

### Framework & Language
- **Next.js** `16` - App Router with React Server Components (RSC-first architecture)
- **TypeScript** `5.9.3` - Strict mode enforced for type safety
- **React** `19.x` - Latest React features with Server Components

### UI & Design System
- **Tailwind CSS** `4.1.14` - Utility-first styling with semantic CSS variables for theming
- **Radix UI** - Accessible component primitives (unstyled)
- **shadcn/ui** - Copy-in component library built on Radix UI
- **Storybook** - Component specs, accessibility testing, and a11y verification
- **lucide-react** - Consistent icon set
- **Framer Motion** - Enter/exit animations and interactive transitions

### Database & ORM
- **Prisma** - Type-safe ORM with automatic migrations
- **SQLite** - Local development (file: `./prisma/dev.db`)
- **PostgreSQL** - Production database on Vercel Postgres
- **Connection Pooling** - Serverless-optimized via Prisma

### Authentication & Security
- **NextAuth.js** `v4+` - Modern authentication with JWT sessions
- **bcrypt** - Password hashing (cost factor 12)
- **TOTP (RFC 6238)** - MFA via authenticator apps with backup codes
- **OIDC/SAML** - Enterprise SSO support
- **Zod** - Runtime schema validation for all inputs

### Forms & Validation
- **React Hook Form** - Form state management
- **Zod** - TypeScript-first schema validation
- **Zod Error Handling** - Automated server-side validation

### Testing Framework
- **Vitest** `3.2.4` - Unit and integration tests
- **Testing Library** - React component testing
- **Playwright** `1.56.0` - E2E testing with MCP support
- **Coverage** - Vitest with c8/istanbul (target: 80% business logic, 100% utils & API routes)

### Backend Services
- **Resend** - Transactional emails with React Email templates
- **Vercel Blob** - File storage for product images, invoices, backups
- **Inngest** - Background jobs, cron scheduling, webhooks with auto-retries
- **Vercel KV** - Redis-compatible serverless for sessions, rate limiting, caching
- **PostgreSQL FTS** - Full-text search with pg_trgm (Phase 1), Algolia (Phase 2 optional)
- **Sentry** - Error tracking, performance monitoring, session replay
- **Vercel Analytics** - Web Vitals and performance metrics

### Payment Processing
- **Stripe** - International payments (credit cards, digital wallets)
- **SSLCOMMERZ** - Bangladesh payments (high priority)
- **bKash** - Bangladesh mobile payments (optional Phase 2)

### Development Tools
- **ESLint** - Code quality and style consistency
- **Prettier** - Automatic code formatting
- **Next.js** - Incremental Static Regeneration (ISR), Server Actions, API Routes

### Deployment
- **Vercel** - Serverless hosting with Edge Network, CDN, and automatic deployments
- **PostgreSQL** - Vercel Postgres for managed database
- **GitHub Actions** - CI/CD pipelines for testing and deployment

---

## � Project Metrics

| Metric | Count |
|--------|-------|
| **User Stories** | 12 (P0: 1, P1: 3, P2: 3, P3: 5) |
| **Functional Requirements** | 132+ |
| **Database Models** | 42+ |
| **API Endpoints** | 100+ |
| **Design System Tokens** | 30+ (colors, typography, spacing, radii, z-index) |
| **Accessibility Standards** | WCAG 2.1 Level AA |
| **Target Scalability** | 10K products, 1M orders/year, 250K customers per store |

---

## 📁 Project Structure

### Documentation-First Phase (Current)

```
StormCom/
├── .github/
│   ├── copilot-instructions.md        # Copilot coding guidance with tech stack rules
│   └── instructions/                  # File-specific coding standards
│       ├── api-routes.instructions.md
│       ├── components.instructions.md
│       ├── database.instructions.md
│       ├── documentation.instructions.md
│       └── testing.instructions.md
│
├── .specify/
│   ├── memory/
│   │   └── constitution.md            # Project constitution: standards, requirements, constraints
│   └── scripts/
│       └── powershell/                # SpecKit automation scripts
│
├── docs/                              # 📚 Comprehensive documentation
│   ├── analysis/
│   │   ├── ecommerce_complete_srs.md  # System Requirements Specification
│   │   └── *.md                       # Analysis and research documents
│   ├── audit/                         # UI audit HTML snapshots and wireframes
│   ├── references/                    # Legacy/reference documentation
│   └── spec-kit-docs/                 # GitHub Specs Kit guides
│
├── specs/                             # Feature specifications (Spec-Driven Development)
│   └── 001-multi-tenant-ecommerce/
│       ├── spec.md                    # 1042 lines - Complete feature specification with edge cases
│       ├── plan.md                    # 489 lines - Implementation plan with 3-phase design system
│       ├── data-model.md              # 2106 lines - 42+ Prisma models with ER diagram
│       ├── tasks.md                   # 707 lines - Executable task breakdown by user story
│       ├── quickstart.md              # 210 lines - Local development setup guide
│       ├── research.md                # Phase 0 technical decision documentation
│       ├── contracts/
│       │   ├── openapi.yaml           # OpenAPI 3.1 specification (100+ endpoints)
│       │   └── README.md              # API design decisions and patterns
│       ├── checklists/                # Quality validation checklists
│       │   ├── requirements.md
│       │   ├── authentication-requirements.md
│       │   ├── ux.md
│       │   └── *.md                   # Gap analysis and remediation
│       ├── ANALYSIS_REPORT.md
│       ├── CHECKLIST_IMPLEMENTATION_STATUS.md
│       └── SUMMARY_IMPLEMENTATION_GUIDE.md
│
├── prisma/
│   ├── schema.prisma                  # (To be generated from data-model.md)
│   ├── migrations/                    # Database migrations
│   └── seed.ts                        # Seeding script with test data
│
├── src/                               # Source code (scaffolding in progress)
│   ├── app/                           # Next.js App Router
│   │   ├── (admin)/                   # Admin dashboard routes
│   │   ├── (storefront)/              # Customer-facing storefront
│   │   ├── (auth)/                    # Authentication flows
│   │   ├── api/                       # API Route Handlers
│   │   ├── layout.tsx
│   │   ├── globals.css                # Design system tokens
│   │   └── providers.tsx
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui base components
│   │   ├── admin/                     # Admin-specific components
│   │   ├── storefront/                # Storefront-specific components
│   │   └── shared/                    # Shared components
│   │
│   ├── services/                      # Business logic layer
│   │   ├── stores/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── auth/
│   │   └── ...
│   │
│   ├── lib/                           # Utilities and configuration
│   │   ├── auth.ts                    # NextAuth.js configuration
│   │   ├── prisma.ts                  # Prisma client singleton
│   │   ├── validation/                # Zod schemas
│   │   ├── middleware/                # Custom middleware
│   │   ├── constants.ts               # App constants (roles, statuses)
│   │   ├── errors.ts                  # Error handling
│   │   └── ...
│   │
│   ├── hooks/                         # Custom React hooks
│   ├── types/                         # TypeScript type definitions
│   ├── actions/                       # Next.js Server Actions
│   └── ...
│
├── tests/
│   ├── unit/                          # Unit tests (Vitest)
│   ├── integration/                   # Integration tests
│   ├── e2e/                           # E2E tests (Playwright)
│   ├── fixtures/                      # Test data and mocks
│   └── setup.ts
│
├── public/                            # Static assets
├── .env.example                       # Environment variables template
├── .eslintrc.mjs                      # ESLint configuration
├── .prettierrc                        # Prettier configuration
├── next.config.ts                     # Next.js configuration
├── tailwind.config.ts                 # Tailwind CSS with design tokens
├── tsconfig.json                      # TypeScript strict mode enabled
├── vitest.config.ts                   # Vitest configuration
├── playwright.config.ts               # Playwright configuration
├── package.json                       # Dependencies and scripts
└── README.md                          # This file
```

### Implementation Phase (Planned)

Once Phase 2 foundational tasks begin, the `src/`, `prisma/`, and `tests/` directories will be populated with:
- Full Next.js App Router structure with typed route handlers
- Prisma schema with 42+ models reflecting the data-model.md specification
- Comprehensive test suites (unit, integration, E2E) with 80%+ coverage
- API Route Handlers implementing OpenAPI 3.1 specification

---

## 🚀 Quick Start

### Phase 1: Explore the Specification

This repository is in the **Spec-Driven Development** phase. Start by exploring the comprehensive documentation:

1. **Read the Constitution** (Project Standards)
   ```bash
   cat .specify/memory/constitution.md
   ```
   Covers: TypeScript strict mode, WCAG 2.1 AA accessibility, code quality, testing standards, multi-tenant isolation, security requirements.

2. **Review the Feature Specification**
   ```bash
   cat specs/001-multi-tenant-ecommerce/spec.md  # 1042 lines
   ```
   Complete feature requirements, user stories, acceptance criteria, design system, edge cases (CHK001-CHK091).

3. **Study the Implementation Plan**
   ```bash
   cat specs/001-multi-tenant-ecommerce/plan.md  # 489 lines
   ```
   Technical roadmap, 3-phase design system plan, performance budgets, scalability targets.

4. **Examine the Database Schema**
   ```bash
   cat specs/001-multi-tenant-ecommerce/data-model.md  # 2106 lines
   ```
   42+ Prisma models with ERD, relationships, indexes, constraints for multi-tenant isolation.

5. **Review the API Contracts**
   ```bash
   cat specs/001-multi-tenant-ecommerce/contracts/openapi.yaml  # 100+ endpoints
   ```
   OpenAPI 3.1 specification with request/response schemas, authentication, rate limiting.

6. **View the Task Breakdown**
   ```bash
   cat specs/001-multi-tenant-ecommerce/tasks.md  # 707 lines
   ```
   Executable tasks organized by user story with acceptance criteria.

### Phase 2: Local Development Setup (Upcoming)

Once the codebase is scaffolded, follow the quickstart guide:

```bash
# See detailed setup instructions
cat specs/001-multi-tenant-ecommerce/quickstart.md
```

Setup steps will include:
1. Clone repository
2. Install dependencies (`npm install`)
3. Configure environment (`.env.local` from `.env.example`)
4. Initialize database (`npx prisma db push`, `npx prisma db seed`)
5. Start development server (`npm run dev`)

---

## 📋 Available Commands

### Development & Setup (Planned)

```bash
# Installation and setup
npm install                  # Install all dependencies
npm run setup               # Run all setup tasks

# Development server
npm run dev                 # Start Next.js dev server (http://localhost:3000)
npm run build               # Build for production
npm run start               # Start production server

# Database
npm run db:push             # Sync Prisma schema to database (dev)
npm run db:studio           # Open Prisma Studio GUI
npm run db:migrate          # Create and apply migration (production)
npm run db:seed             # Seed database with test data
npm run db:reset            # Reset database (dev only - destructive!)

# Code Quality
npm run lint                # Run ESLint (check for issues)
npm run lint:fix            # Auto-fix ESLint issues
npm run format              # Format code with Prettier
npm run type-check          # TypeScript strict mode check
npm run validate            # Run all validation (lint, type-check, format)

# Testing
npm run test                # Run Vitest unit/integration tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Generate coverage report
npm run test:ui             # Open Vitest UI
npm run test:e2e            # Run Playwright E2E tests
npm run test:e2e:ui         # Run E2E tests with UI
npm run test:all            # Run all tests (unit + E2E)
npm run test:debug          # Run tests with debugging

# Storybook & Components
npm run storybook           # Start Storybook on http://localhost:6006
npm run storybook:build     # Build Storybook for static hosting
npm run storybook:a11y      # Run a11y checks on all stories

# Project Documentation
npm run docs:generate       # Generate API docs from OpenAPI spec
npm run docs:serve          # Serve documentation locally

---

## ✨ Feature Roadmap

### User Stories by Priority

**P0: Foundation (Phase 0 - US0)**
- ✅ Authentication & Authorization - Login, Register, Logout with WCAG 2.1 AA compliance

**P1: Core E-commerce (Phase 1-2 - US1-3)**
- 📋 Store Management - Multi-tenant setup, branding, settings
- 📋 Product Catalog - Variants, categories, brands, attributes, inventory
- 📋 Checkout & Payments - Cart, orders, Stripe/SSLCOMMERZ/bKash integration

**P2: Customer & Marketing (Phase 3-5 - US4-6)**
- 📋 Customer Management - CRM, profiles, wishlists, reviews
- 📋 Marketing Campaigns - Coupons, flash sales, email newsletters
- 📋 Analytics & Reporting - Sales insights, inventory, customer analytics

**P3: Advanced Features (Phase 6-10 - US7-11)**
- 📋 Content Management - Pages, blogs, menus, FAQs
- 📋 Shipping & Logistics - Zones, methods, tracking, integrations
- 📋 Point of Sale - In-store transactions, offline mode
- 📋 Staff & Permissions - Team management, role-based access
- 📋 External Integrations - WooCommerce/Shopify sync, webhooks

### Feature Completeness (Phase 1)

| Feature | Status | Details |
|---------|--------|---------|
| **Data Model** | ✅ Complete | 42+ Prisma models with full ER diagram |
| **API Specification** | ✅ Complete | OpenAPI 3.1 with 100+ endpoints |
| **Design System** | ✅ Complete | Token-driven with 3-phase implementation plan |
| **Authentication** | 📋 Planned | NextAuth v4+, TOTP MFA, OIDC/SAML SSO |
| **Multi-tenant Isolation** | 📋 Planned | Prisma middleware, automatic storeId filtering |
| **RBAC & Permissions** | 📋 Planned | 4 predefined roles (SUPER_ADMIN, STORE_ADMIN, STAFF, CUSTOMER) |

---

## 📚 Documentation

The project is documented comprehensively following the Spec-Driven Development methodology:

### Core Specifications
- **Feature Specification** (`spec.md`) - 1042 lines covering all 132+ functional requirements, 12 user stories, edge cases (CHK001-CHK091), design system, and accessibility standards
- **Implementation Plan** (`plan.md`) - 489 lines with 3-phase design system roadmap, technical context, performance budgets, and scalability targets
- **Database Schema** (`data-model.md`) - 2106 lines defining 42+ Prisma models with relationships, indexes, and multi-tenant constraints
- **API Specification** (`contracts/openapi.yaml`) - OpenAPI 3.1 with 100+ endpoints, request/response schemas, authentication, pagination, rate limiting
- **Tasks Breakdown** (`tasks.md`) - 707 lines of executable tasks organized by user story with acceptance criteria and dependencies

### Project Standards
- **Project Constitution** (`.specify/memory/constitution.md`) - Core principles covering code quality, testing, UX consistency, performance, security, and compliance
- **Coding Guidelines** (`.github/instructions/`) - File-specific standards for API routes, components, database, documentation, and testing
- **Copilot Instructions** (`.github/copilot-instructions.md`) - AI coding agent guidance with tech stack rules and development workflow

### Analysis & Reference
- **SRS Analysis** (`docs/analysis/ecommerce_complete_srs.md`) - Comprehensive System Requirements Specification
- **UI/UX Checklists** (`specs/001-multi-tenant-ecommerce/checklists/ux.md`) - Accessibility, responsive design, and interaction patterns
- **Quality Validation Reports** (`specs/001-multi-tenant-ecommerce/checklists/`) - Implementation status, requirements validation, gap analysis

### Getting Started with Docs

```bash
# Read the project constitution (required!)
cat .specify/memory/constitution.md

# Read the feature specification
cat specs/001-multi-tenant-ecommerce/spec.md

# Explore the data model
cat specs/001-multi-tenant-ecommerce/data-model.md

# Review the implementation plan
cat specs/001-multi-tenant-ecommerce/plan.md

# Check the API specification
cat specs/001-multi-tenant-ecommerce/contracts/openapi.yaml

# View available tasks
cat specs/001-multi-tenant-ecommerce/tasks.md
```

---

## 🔧 Development Workflow

### Spec-Driven Development with GitHub Spec Kit

StormCom uses [GitHub Spec Kit](https://github.com/github/spec-kit) to manage specifications and generate implementation artifacts:

```bash
# Install uv package manager (once)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install specify-cli
uv tool install --from git+https://github.com/github/spec-kit.git specify-cli

# Verify installation
specify check
```

**Spec Kit Commands Used in StormCom**:
```bash
# Generate implementation plan from spec
specify plan

# Break down specifications into executable tasks
specify tasks

# Validate specification quality
specify validate

# Update or amend existing specs
specify amend
```

For detailed setup and usage, refer to:
- `docs/SPEC_KIT_SETUP.md` - Installation instructions
- `docs/SPEC_KIT_USAGE.md` - StormCom-specific workflow
- `docs/SPEC_KIT_QUICK_REFERENCE.md` - Command reference

---

## 🚢 Deployment

### Vercel (Recommended)

Deployment is optimized for Vercel's serverless platform:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "feat: new feature"
   git push origin 001-multi-tenant-ecommerce
   ```

2. **Import in Vercel Dashboard**
   - Connect GitHub repository
   - Select `001-multi-tenant-ecommerce` branch
   - Vercel auto-detects Next.js configuration

3. **Configure Environment Variables**
   - Set `DATABASE_URL` to Vercel Postgres connection string
   - Add `NEXTAUTH_SECRET` (use `openssl rand -base64 32`)
   - Configure payment gateway keys (Stripe, SSLCOMMERZ)
   - Set email service keys (Resend API key)

4. **Automatic Deployment**
   - Each commit triggers CI/CD pipeline
   - Runs linting, type-checking, tests
   - Deploys to preview/production URL on success

**Environment Variables Reference**:
```
DATABASE_URL                # Vercel Postgres connection string
NEXTAUTH_SECRET            # Random 32+ character string
NEXTAUTH_URL               # https://yourdomain.com
RESEND_API_KEY             # Transactional email service
VERCEL_BLOB_READ_WRITE_TOKEN # File storage token
STRIPE_SECRET_KEY          # Stripe payment gateway
SSLCOMMERZ_STORE_ID        # Bangladesh payment gateway
SENTRY_AUTH_TOKEN          # Error tracking service
```

For full setup details, see `specs/001-multi-tenant-ecommerce/plan.md`.

---

## 🤝 Contributing

### Before You Start

1. **Read the Constitution** - `.specify/memory/constitution.md`
2. **Review the Spec** - `specs/001-multi-tenant-ecommerce/spec.md`
3. **Understand the Plan** - `specs/001-multi-tenant-ecommerce/plan.md`
4. **Check the Guidelines** - `.github/instructions/`

### Development Workflow

```bash
# 1. Create feature branch from 001-multi-tenant-ecommerce
git checkout -b feature/your-feature 001-multi-tenant-ecommerce

# 2. Make changes following constitution and guidelines
# - Write tests first (TDD approach)
# - Run validation: npm run validate
# - Keep file size < 300 lines, functions < 50 lines

# 3. Run quality checks
npm run lint:fix             # Fix linting issues
npm run format              # Format with Prettier
npm run type-check          # TypeScript strict mode
npm run test                # Run tests with coverage
npm run test:e2e            # Run E2E tests

# 4. Commit with conventional commits
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update README"

# 5. Push and create Pull Request
git push origin feature/your-feature
```

### Pull Request Requirements

- ✅ All tests passing (unit, integration, E2E)
- ✅ Code coverage > 80% for business logic
- ✅ TypeScript strict mode (no `any` types)
- ✅ Linting and formatting pass
- ✅ Documentation updated
- ✅ Accessibility (WCAG 2.1 AA) verified
- ✅ Constitution compliance verified

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## � Support & Resources

### Documentation Links

- **GitHub Repository**: https://github.com/syed-reza98/StormCom
- **Demo Application**: https://ecom-demo.workdo.io/ (Reference for UI/UX)
- **Spec-Driven Development**: https://github.com/github/spec-kit

### Key Contacts

| Role | Email |
|------|-------|
| Super Admin (Development) | `admin@stormcom.io` |
| **Note** | Default credentials - CHANGE IN PRODUCTION |

### Performance Targets

- **Page Load (LCP)**: <2.0s desktop, <2.5s mobile
- **API Response (p95)**: <500ms
- **Database Query (p95)**: <100ms
- **Uptime SLA**: 99.9% (≈43 minutes downtime/month)
- **Bundle Size**: <200KB gzipped initial load

### Accessibility & Quality Standards

- **WCAG 2.1 Level AA** - Full compliance required
- **Code Coverage**: 80% business logic, 100% utilities, 100% API routes
- **TypeScript Strict Mode**: All code
- **Testing**: Unit + Integration (Vitest) + E2E (Playwright)

---

## 🎓 Learning Resources

### Understanding the Project

1. **Start here**: `.specify/memory/constitution.md` - Project principles and constraints
2. **Then read**: `specs/001-multi-tenant-ecommerce/spec.md` - Complete feature specification
3. **Next**: `specs/001-multi-tenant-ecommerce/plan.md` - Implementation roadmap
4. **Deep dive**: `specs/001-multi-tenant-ecommerce/data-model.md` - Database architecture
5. **API**: `specs/001-multi-tenant-ecommerce/contracts/openapi.yaml` - REST API specification

### Technical Stack Learning

- **Next.js 16 with App Router**: https://nextjs.org/docs
- **TypeScript Strict Mode**: https://www.typescriptlang.org/tsconfig
- **Prisma ORM**: https://www.prisma.io/docs
- **Tailwind CSS v4**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/docs
- **shadcn/ui**: https://ui.shadcn.com/
- **NextAuth.js v4+**: https://next-auth.js.org/
- **Vitest**: https://vitest.dev/
- **Playwright**: https://playwright.dev/

### WCAG 2.1 AA Accessibility

- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Practices**: https://www.w3.org/WAI/ARIA/apg/
- **Accessibility Testing**: https://www.w3.org/test-evaluate/

---

## 🗺️ Project Roadmap

### Phase 1: Specification & Planning ✅ COMPLETE
- ✅ Feature specification (1042 lines, 132+ requirements)
- ✅ Implementation plan (489 lines, 3-phase design system)
- ✅ Database schema (2106 lines, 42+ models)
- ✅ API specification (OpenAPI 3.1, 100+ endpoints)
- ✅ Tasks breakdown (707 lines, executable tasks)

### Phase 2: Foundation (Current - In Progress)
- 📋 Design system implementation (Tailwind v4, tokens, Storybook)
- 📋 Authentication setup (NextAuth.js v4+, TOTP MFA, OIDC/SAML)
- 📋 Multi-tenant middleware (Prisma auto-injection)
- 📋 RBAC implementation (4 predefined roles)
- 📋 API wrapper & rate limiting (Vercel KV)

### Phase 3+: Feature Implementation (Planned)
- 📋 Store management & onboarding
- 📋 Product catalog & inventory
- 📋 Order processing & checkout
- 📋 Customer CRM & analytics
- 📋 Marketing tools & campaigns
- 📋 Content management system
- 📋 Shipping & logistics
- 📋 Point of Sale system

---

**Built with ❤️ using Next.js 16 (Including), TypeScript 5.9, Prisma, and Spec-Driven Development**
