# 👨‍💻 StormCom Developer Onboarding Guide

Welcome to the StormCom development team! This guide will help you get set up and productive quickly.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Code Standards](#code-standards)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)
9. [Resources](#resources)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required

- **Node.js**: v18.x or higher ([Download](https://nodejs.org/))
- **npm**: v9.x or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **VS Code**: Recommended IDE ([Download](https://code.visualstudio.com/))

### Recommended VS Code Extensions

- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)
- **Prisma** (Prisma.prisma)
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
- **GitHub Copilot** (GitHub.copilot)

### Optional

- **Docker Desktop**: For containerized development ([Download](https://www.docker.com/products/docker-desktop))
- **Postman** or **Insomnia**: For API testing

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/CodeStorm-Hub/StormCom.git
cd StormCom
```

### 2. Install Dependencies

```bash
npm install
```

This will:
- Install all npm packages
- Generate Prisma Client
- Set up Git hooks

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your local configuration:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Authentication
NEXTAUTH_SECRET="your-secret-here"  # Generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Stripe (Test Mode)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Resend)
RESEND_API_KEY="re_..."

# Redis (Optional - uses in-memory for dev)
REDIS_URL="redis://localhost:6379"
```

### 4. Setup Database

```bash
# Push schema to database
npm run db:push

# Seed with test data
npm run db:seed:dev
```

This creates:
- 3 demo stores (TechHub, StyleStreet, CozyHome)
- Store admins and staff users
- 20+ products per store
- 30+ customers per store
- 15+ orders per store

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at:
- **App**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs

### 6. Login Credentials

```
Super Admin:
  Email: admin@stormcom.io
  Password: Admin@123

Store Admins:
  - admin@techhub.example.com / Admin@123
  - admin@stylestreet.example.com / Admin@123
  - admin@cozyhome.example.com / Admin@123

Store Staff:
  - staff@techhub.example.com / Staff@123
  - staff@stylestreet.example.com / Staff@123
  - staff@cozyhome.example.com / Staff@123
```

---

## Project Structure

```
StormCom/
├── .github/                    # GitHub workflows, templates
│   ├── workflows/              # CI/CD pipelines
│   ├── instructions/           # Copilot coding rules
│   └── prompts/                # Reusable prompts
├── docs/                       # Documentation
│   ├── analysis/               # SRS, specs
│   ├── audit/                  # UI audits
│   ├── database/               # Schema guides
│   └── deployment-checklist.md
├── prisma/                     # Database
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Database seed
│   └── migrations/             # Migration history
├── public/                     # Static assets
├── scripts/                    # Utility scripts
│   ├── seed-dev.ts             # Dev seed script
│   └── backup-db.ps1           # Backup script
├── specs/                      # Feature specifications
│   └── 001-multi-tenant-ecommerce/
│       ├── spec.md             # Feature spec
│       ├── plan.md             # Implementation plan
│       ├── tasks.md            # Task breakdown
│       └── contracts/          # API contracts
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes
│   │   ├── (dashboard)/        # Admin dashboard
│   │   ├── (storefront)/       # Customer storefront
│   │   ├── api/                # API routes
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── layout/             # Layout components
│   │   ├── ui/                 # Radix UI components
│   │   └── auth/               # Auth components
│   ├── contexts/               # React contexts
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilities
│   │   ├── db.ts               # Prisma client
│   │   ├── validation.ts       # Zod schemas
│   │   └── image-optimization.ts
│   ├── services/               # Business logic
│   │   ├── auth-service.ts
│   │   ├── product-service.ts
│   │   └── order-service.ts
│   └── types/                  # TypeScript types
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   └── e2e/                    # E2E tests
├── .env.example                # Environment template
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # Tailwind config
├── tsconfig.json               # TypeScript config
├── vitest.config.ts            # Vitest config
└── playwright.config.ts        # Playwright config
```

---

## Development Workflow

### Daily Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Start development server
npm run dev

# 4. Make changes, test locally

# 5. Run tests
npm run type-check
npm run lint
npm test

# 6. Commit changes
git add .
git commit -m "feat: add your feature"

# 7. Push and create PR
git push origin feature/your-feature-name
```

### Branch Naming Convention

- **Features**: `feature/short-description`
- **Bug Fixes**: `fix/short-description`
- **Documentation**: `docs/short-description`
- **Refactoring**: `refactor/short-description`

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(products): add product variant support
fix(auth): resolve login redirect issue
docs(readme): update setup instructions
test(orders): add order creation tests
```

---

## Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test auth/login.spec.ts
```

### Writing Tests

#### Unit Test Example

```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatPrice } from './utils';

describe('formatPrice', () => {
  it('should format price correctly', () => {
    expect(formatPrice(1999)).toBe('$19.99');
  });

  it('should handle zero', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });
});
```

#### E2E Test Example

```typescript
// tests/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@stormcom.io');
  await page.fill('[name="password"]', 'Admin@123');
  await page.click('[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Code Standards

### TypeScript

- **Strict Mode**: Enabled (`strict: true`)
- **No `any` types**: Use proper types
- **Explicit return types**: For all exported functions
- **Type guards**: For runtime type safety

### React Components

```typescript
// ✅ GOOD: Server Component (default)
export default async function ProductList({ storeId }: Props) {
  const products = await getProducts(storeId);
  return <div>{products.map(p => <ProductCard key={p.id} product={p} />)}</div>;
}

// ✅ GOOD: Client Component (when needed)
'use client';

export function AddToCartButton({ productId }: Props) {
  const [loading, setLoading] = useState(false);
  // ... event handlers, hooks
}
```

### File Size Limits

- **Maximum file size**: 300 lines
- **Maximum function size**: 50 lines
- **Refactor when approaching limits**

### Naming Conventions

- **Variables/Functions**: `camelCase`
- **Components/Types**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Files**: Match the primary export

---

## Common Tasks

### Database Tasks

```bash
# View database in GUI
npm run db:studio

# Create new migration
npm run db:migrate

# Apply migrations (prod)
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Generate Prisma Client
npm run db:generate

# Seed database
npm run db:seed        # Default seed
npm run db:seed:dev    # Enhanced dev seed

# Backup database
npm run db:backup
npm run db:backup -- -Compress  # Compressed backup
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
```

### Development Utilities

```bash
# View API documentation
# Visit: http://localhost:3000/api/docs

# Test Stripe webhooks locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe/checkout

# Generate test data
npm run db:seed:dev
```

---

## Troubleshooting

### Database Connection Errors

**Problem**: `Can't reach database server`

**Solution**:
```bash
# Regenerate Prisma Client
npm run db:generate

# Push schema again
npm run db:push
```

### Port Already in Use

**Problem**: `Error: Port 3000 is already in use`

**Solution**:
```bash
# Find and kill process on port 3000 (Windows)
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

### TypeScript Errors After Pull

**Problem**: Type errors after pulling latest changes

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma Client
npm run db:generate
```

### Module Not Found Errors

**Problem**: `Cannot find module '@/...'`

**Solution**:
```bash
# Check tsconfig.json paths are correct
# Restart TypeScript server in VS Code:
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

---

## Resources

### Documentation

- **Project Docs**: `/docs` directory
- **API Spec**: `/specs/001-multi-tenant-ecommerce/contracts/openapi.yaml`
- **Database Schema**: `/docs/database/schema-guide.md`
- **Deployment Guide**: `/docs/deployment-checklist.md`

### External Documentation

- [Next.js 16 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Radix UI Docs](https://www.radix-ui.com/primitives)
- [Vitest Docs](https://vitest.dev)
- [Playwright Docs](https://playwright.dev)

### Team Resources

- **Slack Channel**: #stormcom-dev
- **Project Board**: [GitHub Projects](https://github.com/CodeStorm-Hub/StormCom/projects)
- **Design System**: Figma (ask for access)
- **API Collection**: Postman workspace (ask for invite)

---

## Getting Help

### Internal Support

1. **Check documentation** first (this guide, `/docs`)
2. **Search GitHub Issues** for similar problems
3. **Ask in Slack** (#stormcom-dev channel)
4. **Create GitHub Issue** if bug/feature request

### Code Review Process

1. Create PR with clear description
2. Request review from 2+ team members
3. Address feedback and comments
4. Merge when approved and tests pass

### Best Practices for Asking Questions

✅ **Good Question**:
> "I'm trying to implement product variants but getting a TypeScript error on line 45 of `product-service.ts`: `Property 'variantId' does not exist on type 'Product'`. I've checked the Prisma schema and the field exists. Any ideas?"

❌ **Bad Question**:
> "Types not working, help!"

---

## Welcome!

You're now ready to start contributing to StormCom! 🎉

If you have questions or suggestions to improve this guide, please submit a PR or open an issue.

Happy coding! 🚀
