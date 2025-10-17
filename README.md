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

```
StormCom/
├── docs/                          # 📚 Documentation
│   ├── specifications/            # Spec-Driven Development
│   │   ├── 001-stormcom-platform/
│   │   │   ├── spec.md           # Feature specifications
│   │   │   ├── plan.md           # Implementation plan
│   │   │   ├── data-model.md     # Database schema
│   │   │   └── api-contracts.md  # API documentation
│   │   └── .speckit/
│   │       └── constitution.md   # Project standards
│   ├── analysis/                  # Original SRS analysis
│   └── references/                # Legacy documentation
│
├── src/
│   ├── app/                       # Next.js App Router
│   ├── components/                # React components
│   ├── lib/                       # Utilities & config
│   ├── services/                  # Business logic
│   ├── hooks/                     # Custom hooks
│   └── types/                     # TypeScript types
│
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── migrations/                # Migrations
│   └── seed.ts                    # Seed data
│
└── tests/                         # Test files
```

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/syed-reza98/StormCom.git
cd StormCom

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Initialize database
npx prisma db push
npx prisma db seed

# Start development
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

**Default Login:**
- Email: `admin@example.com`
- Password: `admin123`

---

## 📋 Commands

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
- **Specifications**: `docs/specifications/001-stormcom-platform/spec.md`
- **Implementation Plan**: `docs/specifications/001-stormcom-platform/plan.md`
- **Database Schema**: `docs/specifications/001-stormcom-platform/data-model.md`
- **Project Standards**: `.specify/memory/constitution.md`
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

See `docs/specifications/001-stormcom-platform/plan.md` for details.

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
**Demo Reference**: https://ecom-demo.workdo.io/

---

**Built with ❤️ using Next.js 15, TypeScript 5.9, and Prisma**
