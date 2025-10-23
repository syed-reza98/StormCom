# Quickstart Guide: StormCom Local Development

**Feature**: 001-multi-tenant-ecommerce  
**Last Updated**: 2025-10-23

This guide walks you through setting up StormCom for local development in under 15 minutes.

## Prerequisites

Before starting, ensure you have:

- **Node.js**: v18.17.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **Code Editor**: VS Code recommended ([Download](https://code.visualium.com/))
- **Terminal**: PowerShell (Windows), Terminal (macOS), Bash (Linux)

**Optional but Recommended**:
- **Prisma VS Code Extension**: For schema syntax highlighting and autocomplete
- **Tailwind CSS IntelliSense**: For Tailwind class autocomplete
- **ESLint Extension**: For real-time linting feedback

## Step 1: Clone the Repository

```powershell
# Clone the repository
git clone https://github.com/your-org/StormCom.git
cd StormCom

# Checkout the feature branch
git checkout 001-multi-tenant-ecommerce
```

## Step 2: Install Dependencies

```powershell
# Install all project dependencies
npm install

# This installs:
# - Next.js 16.0.0+
# - React 19.x
# - TypeScript 5.9.3+
# - Prisma ORM
# - NextAuth.js v4+
# - Tailwind CSS 4.1.14+
# - Vitest, Playwright, and all testing tools
```

**Installation time**: ~2-3 minutes (depending on internet speed)

## Step 3: Environment Configuration

```powershell
# Copy environment template
copy .env.example .env.local

# Open .env.local in your editor
code .env.local
```

**Edit `.env.local`** with the following values:

```env
# Database (SQLite for local development)
DATABASE_URL="file:./prisma/dev.db"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
# Generate secret: openssl rand -base64 32

# Email Service (Resend - get free API key at resend.com)
RESEND_API_KEY="re_your_api_key_here"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Payment Gateways (Test Mode)
# Stripe (get test keys at stripe.com/docs/keys)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# SSLCommerz (get sandbox credentials at sslcommerz.com)
SSLCOMMERZ_STORE_ID="your_store_id"
SSLCOMMERZ_STORE_PASSWORD="your_store_password"
SSLCOMMERZ_IS_LIVE="false"

# Vercel KV (Optional for local dev - uses in-memory fallback)
# KV_URL="redis://localhost:6379"
# KV_REST_API_URL="http://localhost:8079"
# KV_REST_API_TOKEN="local_dev_token"

# Vercel Blob (Optional for local dev - uses local filesystem fallback)
# BLOB_READ_WRITE_TOKEN="vercel_blob_token"

# Feature Flags
ENABLE_REGISTRATION="true"
ENABLE_GUEST_CHECKOUT="true"
ENABLE_POS="false"
```

**Note**: For local development, you can use test/sandbox credentials. Production keys are never committed to git.

## Step 4: Database Setup

```powershell
# Generate Prisma Client from schema
npx prisma generate

# Create SQLite database and run migrations
npx prisma db push

# Seed database with initial data
npx prisma db seed
```

**What gets seeded**:
- 1 Super Admin user (`admin@stormcom.local` / `Admin123!`)
- 2 test stores (`demo-store`, `test-store`)
- 2 Store Admins (one per store)
- 3 Staff users with various permissions
- 10 sample products per store
- 5 sample orders
- Sample categories, brands, shipping zones
- Default subscription plans (Free, Basic, Pro, Enterprise)

**Database location**: `./prisma/dev.db` (SQLite file, gitignored)

## Step 5: Start Development Server

```powershell
# Start Next.js development server
npm run dev
```

**Output**:
```
▲ Next.js 16.0.0
- Local:        http://localhost:3000
- Ready in 2.5s
```

**Open your browser**: Navigate to http://localhost:3000

## Step 6: Verify Installation

### Login to Admin Dashboard

1. Navigate to http://localhost:3000/auth/login
2. **Super Admin Login**:
   - Email: `admin@stormcom.local`
   - Password: `Admin123!`
3. You should be redirected to http://localhost:3000/admin/dashboard (Super Admin cross-store dashboard)

### Login to Store Dashboard

1. Navigate to http://localhost:3000/auth/login
2. **Store Admin Login** (Demo Store):
   - Email: `admin@demo-store.local`
   - Password: `Store123!`
3. You should be redirected to http://localhost:3000/dashboard (Demo Store dashboard)

### View Customer Storefront

1. Navigate to http://localhost:3000 (or http://demo-store.localhost:3000 with host mapping)
2. You should see the Demo Store homepage with sample products
3. **Guest browsing** enabled by default
4. **Customer Login** (optional):
   - Email: `customer@demo-store.local`
   - Password: `Customer123!`

## Step 7: Database Management

### Prisma Studio (Database GUI)

```powershell
# Open Prisma Studio in browser
npm run db:studio
```

**URL**: http://localhost:5555

**Features**:
- Browse all tables and records
- Edit data directly (local dev only)
- Query data with filters
- View relationships

### Database Reset (Fresh Start)

```powershell
# Drop database, recreate, and reseed
npx prisma migrate reset
```

**Warning**: This deletes ALL data in your local database.

## Step 8: Running Tests

### Unit & Integration Tests (Vitest)

```powershell
# Run all tests once
npm run test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Coverage report**: `./coverage/index.html` (open in browser)

### E2E Tests (Playwright)

```powershell
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI (see browser actions)
npm run test:e2e:ui

# Run E2E tests for specific user story
npx playwright test tests/e2e/scenarios/us0-authentication.spec.ts
```

**Test results**: `./playwright-report/index.html` (open in browser)

### Lint & Format

```powershell
# Run ESLint (check for issues)
npm run lint

# Run ESLint with auto-fix
npm run lint -- --fix

# Format code with Prettier
npm run format

# TypeScript type checking
npm run type-check
```

## Project Structure Overview

```
StormCom/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # Login, Register, MFA
│   │   ├── (admin)/      # Super Admin dashboard
│   │   ├── (dashboard)/  # Store Admin/Staff dashboard
│   │   ├── (storefront)/ # Customer storefront
│   │   └── api/          # API Route Handlers
│   ├── components/       # React components
│   ├── lib/              # Utilities & helpers
│   ├── services/         # Business logic
│   └── types/            # TypeScript types
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Migration history
│   ├── seed.ts           # Seed data script
│   └── dev.db            # SQLite database (local)
├── tests/
│   ├── unit/             # Vitest unit tests
│   ├── integration/      # Vitest integration tests
│   └── e2e/              # Playwright E2E tests
├── .env.local            # Environment variables (gitignored)
├── package.json
└── README.md
```

## Common Commands

### Development
```powershell
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
```

### Database
```powershell
npm run db:push          # Sync schema to database (dev only)
npm run db:migrate       # Create migration (production workflow)
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed database with initial data
npx prisma migrate reset # Reset database (delete all data)
```

### Testing
```powershell
npm run test             # Run unit/integration tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run E2E tests (headless)
npm run test:e2e:ui      # Run E2E tests with UI
```

### Code Quality
```powershell
npm run lint             # Run ESLint
npm run lint -- --fix    # Fix ESLint errors
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type checking
```

## Troubleshooting

### Port 3000 Already in Use

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process by PID
taskkill /PID <PID> /F

# Or use a different port
$env:PORT=3001; npm run dev
```

### Database Connection Error

```powershell
# Delete database and recreate
Remove-Item prisma\dev.db
npx prisma db push
npx prisma db seed
```

### Prisma Client Out of Sync

```powershell
# Regenerate Prisma Client
npx prisma generate
```

### Node Modules Issues

```powershell
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### TypeScript Errors

```powershell
# Clean Next.js cache
Remove-Item -Recurse -Force .next
npm run dev
```

### Environment Variables Not Loading

1. Ensure `.env.local` exists (copy from `.env.example`)
2. Restart development server after changing `.env.local`
3. Never commit `.env.local` to git (it's gitignored)

## Next Steps

1. **Explore the codebase**: Start with `src/app/` to understand routing structure
2. **Read documentation**: Check `docs/` folder for design system, testing strategy, CI/CD
3. **Review feature spec**: Read `specs/001-multi-tenant-ecommerce/spec.md` for requirements
4. **Make changes**: Create a feature branch, make changes, run tests, commit
5. **Submit PR**: Push branch, create pull request, wait for CI/CD checks

## Test Credentials

### Super Admin
- **Email**: `admin@stormcom.local`
- **Password**: `Admin123!`
- **Access**: All stores, system settings

### Store Admin (Demo Store)
- **Email**: `admin@demo-store.local`
- **Password**: `Store123!`
- **Access**: Demo Store only

### Store Admin (Test Store)
- **Email**: `admin@test-store.local`
- **Password**: `Store123!`
- **Access**: Test Store only

### Staff (Demo Store - Full Permissions)
- **Email**: `staff@demo-store.local`
- **Password**: `Staff123!`
- **Access**: Demo Store, all modules

### Staff (Demo Store - Limited Permissions)
- **Email**: `staff-limited@demo-store.local`
- **Password**: `Staff123!`
- **Access**: Demo Store, products and orders only

### Customer (Demo Store)
- **Email**: `customer@demo-store.local`
- **Password**: `Customer123!`
- **Access**: Storefront, account pages

### Payment Test Cards (Stripe)
- **Success**: `4242 4242 4242 4242` (any future date, any CVC)
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

## Support

- **Documentation**: `docs/` folder
- **Feature Spec**: `specs/001-multi-tenant-ecommerce/spec.md`
- **Constitution**: `.specify/memory/constitution.md`
- **GitHub Issues**: [Create an issue](https://github.com/your-org/StormCom/issues/new)

---

**Estimated Setup Time**: 10-15 minutes (excluding dependency installation)

**Last Verified**: 2025-10-23 on Windows 11, Node.js 18.17.1, npm 9.8.1
