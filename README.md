# StormCom - Multi-Tenant E-commerce SaaS Platform

**A modern, full-stack e-commerce management system built with Next.js 15, TypeScript, and Prisma ORM**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-Latest-2D3748?logo=prisma)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.14-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com/)

---

## 🎯 Overview

**StormCom** is a comprehensive multi-tenant e-commerce SaaS platform that enables businesses to manage online stores, process orders, track inventory, handle customer relationships, and run marketing campaigns—all from a unified admin dashboard.

Built using **Spec-Driven Development** methodology with [GitHub Specs Kit](https://github.com/github/spec-kit), ensuring high-quality, maintainable, and well-documented code.

### Key Highlights

- 🏪 **Multi-Tenant Architecture** - Isolated data per store
- 📦 **Product Management** - Variants, categories, brands
- 🛒 **Order Processing** - Complete lifecycle management
- 👥 **Customer CRM** - Profiles, analytics, wishlists
- 📊 **Analytics & Reports** - Sales, inventory, insights
- 🎯 **Marketing Tools** - Coupons, flash sales, newsletters
- 📝 **CMS** - Pages, blogs, menus, FAQs
- 🔐 **Security** - NextAuth.js, RBAC, tenant isolation
- 🚀 **Performance** - Server Components, optimized queries

---

## 🛠️ Tech Stack (Latest Versions)

### Framework & Language
- **Next.js** `15.5.5` - App Router with React Server Components
- **TypeScript** `5.9.3` - Strict mode for type safety
- **React** `19.x` - Latest React features

### Styling & UI
- **Tailwind CSS** `4.1.14` - Utility-first styling
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Pre-built component library

### Database & ORM
- **Prisma** - Type-safe database access
- **SQLite** - Local development
- **PostgreSQL** - Production database

### Authentication
- **NextAuth.js** `v5` - Authentication and sessions
- **bcrypt** - Password hashing
- **Zod** - Runtime validation

### Testing
- **Vitest** `3.2.4` - Unit/integration testing
- **Playwright** `1.56.0` - E2E testing with MCP
- **Testing Library** - React component testing

### Deployment
- **Vercel** - Serverless platform
- **Vercel Postgres** - Managed PostgreSQL
- **Vercel Blob** - File storage

---

## 📁 Project Structure

Current repository structure (documentation-first phase):

```
StormCom/
├── .github/
│   ├── copilot-instructions.md        # Copilot coding guidance
│   └── instructions/                  # Per-area instructions
├── .specify/
│   └── memory/
│       └── constitution.md            # Project constitution & standards
├── docs/                              # 📚 Documentation
│   ├── analysis/                      # SRS and analysis docs
│   ├── audit/                         # UI audit HTML snapshots
│   ├── references/                    # Legacy/reference docs
│   └── spec-kit-docs/                 # Spec Kit guides
├── specs/                             # Feature specifications
│   └── 001-multi-tenant-ecommerce/
│       ├── spec.md                    # Feature specification
│       ├── plan.md                    # Implementation plan
│       ├── data-model.md              # Database schema
│       ├── quickstart.md              # Local setup (spec phase)
│       ├── research.md                # Technical decisions
│       ├── tasks.md                   # Task breakdown
│       └── contracts/                 # API contracts (OpenAPI)
│           ├── openapi.yaml
│           └── README.md
└── README.md
```

Planned source code structure (per spec plan) will be introduced during implementation, including `src/`, `prisma/`, and `tests/` directories.

---

## 🚀 Quick Start

This repository is currently in the specification and planning phase. To explore the project:

- Review the feature spec: `specs/001-multi-tenant-ecommerce/spec.md`
- See the plan: `specs/001-multi-tenant-ecommerce/plan.md`
- Explore the data model: `specs/001-multi-tenant-ecommerce/data-model.md`
- Read the constitution: `.specify/memory/constitution.md`

Implementation commands (install, dev server, database) will apply after the codebase is scaffolded according to the plan.

---

## 📋 Commands (planned)

The following commands are part of the implementation plan and will be available once the application source is added:

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:push      # Sync schema (dev)
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Create migration
npm run db:seed      # Seed database

# Testing
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run test:coverage # Coverage report

# Code Quality
npm run lint         # Run ESLint
npm run format       # Run Prettier
npm run type-check   # TypeScript check
```

---

## 🎯 Features

### Priority 1 (MVP)
✅ Dashboard & Analytics  
✅ Product Management  
✅ Order Processing

### Priority 2 (Important)
✅ Customer CRM  
✅ Marketing Campaigns  
✅ Reports & Analytics

### Priority 3 (Enhanced)
✅ Content Management  
✅ Shipping Configuration  
✅ Point of Sale  
✅ Staff & Permissions  
✅ Multi-Store & Themes

---

## 📚 Documentation

### Core Documentation
- **Specification**: `specs/001-multi-tenant-ecommerce/spec.md`
- **Implementation Plan**: `specs/001-multi-tenant-ecommerce/plan.md`
- **Database Schema**: `specs/001-multi-tenant-ecommerce/data-model.md`
- **API Contracts**: `specs/001-multi-tenant-ecommerce/contracts/openapi.yaml`
- **Project Standards (Constitution)**: `.specify/memory/constitution.md`
- **SRS Analysis**: `docs/analysis/ecommerce_complete_srs.md`

### Spec Kit Documentation
- **Setup Guide**: `docs/SPEC_KIT_SETUP.md` - How to install GitHub Spec Kit CLI
- **Usage Guide**: `docs/SPEC_KIT_USAGE.md` - How to use spec-kit in StormCom
- **Quick Reference**: `docs/SPEC_KIT_QUICK_REFERENCE.md` - Command cheat sheet

### Spec-Driven Development

StormCom uses [GitHub Spec Kit](https://github.com/github/spec-kit) for spec-driven development. To get started:

```bash
# Install uv package manager
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install specify-cli
uv tool install --from git+https://github.com/github/spec-kit.git specify-cli

# Check installation and available tools
specify check
```

For detailed instructions, see:
- [Setup Guide](docs/SPEC_KIT_SETUP.md) - Installation and initial setup
- [Usage Guide](docs/SPEC_KIT_USAGE.md) - Working with specifications in StormCom
- [Quick Reference](docs/SPEC_KIT_QUICK_REFERENCE.md) - Command reference

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel dashboard
3. Configure environment variables
4. Deploy automatically

See `specs/001-multi-tenant-ecommerce/plan.md` for details.

---

## 📊 Metrics

| Metric | Count |
|--------|-------|
| User Stories | 11 (P1: 3, P2: 3, P3: 5) |
| Functional Requirements | 60+ |
| Database Tables | 40+ |
| API Endpoints | 100+ |

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Run `npm run test && npm run lint`
5. Submit Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 📧 Contact

**Repository**: https://github.com/syed-reza98/StormCom  

***Super admin***: admin@stormcom.io

***Password***: admin123 (CHANGE THIS IN PRODUCTION!)

---

**Built with ❤️ using Next.js 15, TypeScript 5.9, and Prisma**
