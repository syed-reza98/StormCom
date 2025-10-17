# StormCom Quickstart Guide

> **Last updated:** 2025-10-18

This guide will help you set up StormCom for local development, run the app, and execute tests.

---

## Prerequisites

- **Node.js** v20.x or higher ([Download](https://nodejs.org/en/download/))
- **npm** (Preferred) or **pnpm** v8.x ([Install](https://pnpm.io/installation))
- **Git** ([Download](https://git-scm.com/downloads))
- **SQLite** (local) or **PostgreSQL** (Production/Docker)
- **Vercel CLI** (optional, for deployment)

---

## 1. Clone the Repository

```bash
git clone https://github.com/syed-reza98/StormCom.git
cd StormCom
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Copy the example environment file and edit as needed:

```bash
cp .env.example .env.local
```

**Edit `.env.local` and set the following variables:**

```
# Database

DATABASE_URL="file:./prisma/dev.db" # For SQLite (local development)

# DATABASE_URL=postgresql://stormcom:password@localhost:5432/stormcom # Or for PostgreSQL (production/Docker)

# Auth
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# File Storage (Vercel Blob)
VERCEL_BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Background Jobs (Inngest)
INNGEST_EVENT_KEY=your-inngest-key

# Payments
SSLCOMMERZ_STORE_ID=your-sslcommerz-store-id
SSLCOMMERZ_STORE_PASSWORD=your-sslcommerz-store-password
SSLCOMMERZ_SANDBOX_MODE=true

bkash_API_KEY=your-bkash-api-key
bkash_API_SECRET=your-bkash-api-secret

STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
VERCEL_ANALYTICS_ID=your-vercel-analytics-id
```

---

## 4. Set Up the Database

### Option A: Local SQLite (Recommended for quickstart)

1. Create a database named `stormcom`:
   ```sql
   CREATE DATABASE stormcom;
   CREATE USER stormcom WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE stormcom TO stormcom;
   ```
2. Update `DATABASE_URL` in `.env.local` accordingly.

### Option B: Docker PostgreSQL (Recommended)

```bash
docker run --name stormcom-db -e POSTGRES_DB=stormcom -e POSTGRES_USER=stormcom -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:16
```

---

## 5. Run Database Migrations & Seed Data

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

---

## 6. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Run Tests

### Unit & Integration Tests
```bash
npm run test
```

### E2E Tests (Playwright)
```bash
npm run test:e2e
```

---

## 8. Useful Commands

| Command                          | Description                       |
|----------------------------------|-----------------------------------|
| `npm run dev`                    | Start Next.js dev server          |
| `npm run build`                  | Build for production              |
| `npm run start`                  | Start production server           |
| `npm run prisma studio`          | Open Prisma Studio (DB GUI)       |
| `npm run db:push`                | Sync schema to DB (dev only)      |
| `npm run db:migrate`             | Create/apply DB migrations        |
| `npm run db:seed`                | Seed database with test data      |
| `npm run lint`                   | Run ESLint                        |
| `npm run format`                 | Run Prettier                      |
| `npm run type-check`             | TypeScript type checking          |
| `npm run test`                   | Run all unit/integration tests    |
| `npm run test:e2e`               | Run Playwright E2E tests          |

---

## 9. Troubleshooting

### Database Connection Errors (For PostgreSQL)
- Ensure PostgreSQL is running and credentials match `DATABASE_URL`.
- If using Docker, check `docker ps` to confirm the container is running.

### Auth Errors
- Make sure `NEXTAUTH_SECRET` is set and matches across all services.
- Check callback URLs for OAuth providers.

### Payment Gateway Issues
- Ensure SSLCOMMERZ or bKash credentials are correct.
- Use SSLCommerz/bKash test credentials in development.
- Use Stripe/PayPal test credentials in development.
- For Stripe webhooks, use the Stripe CLI to forward events:
  ```bash
  stripe listen --forward-to localhost:3000/api/payments/webhooks/stripe
  ```

### File Uploads Fail
- Ensure `VERCEL_BLOB_READ_WRITE_TOKEN` is valid.
- Check Vercel Blob dashboard for usage limits.

### Email Not Sending
- Verify `RESEND_API_KEY` is correct.
- Check Resend dashboard for errors or quota limits.

### Sentry/Analytics Not Reporting
- Confirm `SENTRY_DSN` and `VERCEL_ANALYTICS_ID` are set.

---

## 10. Deployment

- Deploy to Vercel for serverless production hosting.
- Set all environment variables in the Vercel dashboard.
- Use Vercel Postgres for production database.
- Monitor logs and analytics via Vercel and Sentry dashboards.

---

## 11. Support

- **API Docs:** See [`contracts/openapi.yaml`](./contracts/openapi.yaml)
- **API Reference:** See [`contracts/README.md`](./contracts/README.md)
- **Contact:** api@stormcom.io
- **Status:** https://status.stormcom.io

---

Happy coding! 🚀
