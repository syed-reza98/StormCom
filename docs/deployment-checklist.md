# 🚀 StormCom Deployment Checklist

This checklist ensures a smooth deployment to production. Complete all items before deploying.

---

## Pre-Deployment Checklist

### 1. Code Quality & Testing

- [ ] All TypeScript compilation errors resolved (`npm run type-check`)
- [ ] All ESLint errors resolved (`npm run lint`)
- [ ] All Prettier formatting applied (`npm run format`)
- [ ] Unit tests passing (`npm test`)
- [ ] Integration tests passing
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] Test coverage meets requirements (≥80% business logic)

### 2. Environment Configuration

- [ ] Production environment variables configured in Vercel:
  - [ ] `DATABASE_URL` (Vercel Postgres connection string)
  - [ ] `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
  - [ ] `NEXTAUTH_URL` (production URL, e.g., `https://stormcom.io`)
  - [ ] `VERCEL_BLOB_READ_WRITE_TOKEN` (for file uploads)
  - [ ] `STRIPE_SECRET_KEY` (production key)
  - [ ] `STRIPE_WEBHOOK_SECRET` (production webhook secret)
  - [ ] `RESEND_API_KEY` (for transactional emails)
  - [ ] `REDIS_URL` (Vercel KV connection string)
- [ ] `.env.example` updated with all required variables
- [ ] No secrets committed to git (check with `git log --all -- '*.env*'`)

### 3. Database

- [ ] Production database created (Vercel Postgres)
- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] Database seeded with initial data (stores, super admin)
- [ ] Database connection tested
- [ ] Database indexes verified for performance
- [ ] Backup strategy configured (Vercel Postgres automatic backups)

### 4. Security

- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Security headers configured in `middleware.ts`:
  - [ ] Content Security Policy (CSP)
  - [ ] HTTP Strict Transport Security (HSTS)
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
- [ ] CSRF protection enabled
- [ ] Rate limiting configured (100 req/min per IP)
- [ ] Input validation with Zod schemas (client + server)
- [ ] XSS protection (DOMPurify sanitization)
- [ ] SQL injection prevention (Prisma ORM parameterized queries)
- [ ] Authentication system tested (login, logout, password reset, MFA)
- [ ] Authorization checks in all API routes (RBAC)
- [ ] Multi-tenant isolation verified (no cross-store data leakage)

### 5. Performance

- [ ] Performance budgets met:
  - [ ] LCP < 2.0s (desktop), < 2.5s (mobile)
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
  - [ ] API response time < 500ms (p95)
- [ ] Images optimized (Next.js Image component, WebP format)
- [ ] Code splitting configured (automatic with Next.js)
- [ ] JavaScript bundle < 200KB initial load (gzipped)
- [ ] Database queries optimized (select only needed fields, indexes)
- [ ] CDN enabled (automatic with Vercel Edge Network)
- [ ] Caching strategy implemented (5min TTL for analytics/reports)

### 6. Monitoring & Observability

- [ ] Vercel Analytics enabled (`<Analytics />` in layout.tsx)
- [ ] Vercel Speed Insights enabled (`<SpeedInsights />` in layout.tsx)
- [ ] Error tracking configured (Vercel Logs)
- [ ] Performance monitoring dashboard reviewed
- [ ] Alerts configured for:
  - [ ] High error rate (>1%)
  - [ ] Slow response time (p95 > 1s)
  - [ ] Database connection failures
  - [ ] Payment processing failures

### 7. External Services

- [ ] Stripe account verified (production mode)
- [ ] Stripe webhook endpoints configured:
  - [ ] `https://yourdomain.com/api/webhooks/stripe/checkout`
  - [ ] `https://yourdomain.com/api/webhooks/stripe/subscription`
- [ ] Stripe webhook secret saved in environment variables
- [ ] Resend account verified (sending domain configured)
- [ ] Resend API key saved in environment variables
- [ ] Email templates tested in production
- [ ] Vercel KV (Redis) provisioned and connected
- [ ] Vercel Blob storage provisioned and connected

### 8. Accessibility

- [ ] WCAG 2.1 Level AA compliance verified
- [ ] Keyboard navigation tested (Tab, Enter, Escape)
- [ ] Screen reader tested (NVDA or JAWS)
- [ ] Color contrast meets standards (≥4.5:1 ratio)
- [ ] Focus indicators visible on all interactive elements
- [ ] ARIA labels present on all components
- [ ] Touch targets ≥44×44px (mobile)

### 9. Documentation

- [ ] README.md updated with:
  - [ ] Production deployment instructions
  - [ ] Environment variable documentation
  - [ ] API endpoint documentation
- [ ] API documentation generated (Swagger UI at `/api/docs`)
- [ ] Developer onboarding guide updated
- [ ] Architecture diagrams current
- [ ] Change log updated

### 10. Legal & Compliance

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent banner implemented
- [ ] GDPR compliance verified:
  - [ ] Data export functionality
  - [ ] Account deletion functionality
  - [ ] Consent management
- [ ] PCI DSS Level 1 compliance (Stripe handles card data)

---

## Deployment Process

### 1. Pre-Deployment

```bash
# Run full test suite
npm run type-check
npm run lint
npm test
npm run test:e2e

# Build for production (test locally)
npm run build
npm run start
```

### 2. Deploy to Vercel

#### Option A: Git Push (Recommended)

```bash
# Commit and push to main branch
git add .
git commit -m "chore: production deployment"
git push origin main
```

Vercel will automatically deploy from the `main` branch.

#### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### 3. Post-Deployment

- [ ] Verify deployment successful (check Vercel dashboard)
- [ ] Test production URL (homepage loads)
- [ ] Test authentication (login/logout)
- [ ] Test critical user flows:
  - [ ] User registration
  - [ ] Product browsing
  - [ ] Add to cart
  - [ ] Checkout process
  - [ ] Order placement
  - [ ] Email notifications
- [ ] Monitor error rates (first 30 minutes)
- [ ] Check performance metrics (Web Vitals)
- [ ] Verify database migrations applied
- [ ] Test Stripe webhooks (place test order)

---

## Rollback Plan

If deployment fails or critical issues are discovered:

### Option 1: Instant Rollback (Vercel)

```bash
# Via Vercel dashboard:
1. Go to Deployments
2. Find previous stable deployment
3. Click "Promote to Production"
```

### Option 2: Git Revert

```bash
# Revert last commit
git revert HEAD
git push origin main
```

### Option 3: Database Rollback

```bash
# If database migration failed, rollback:
npx prisma migrate resolve --rolled-back <migration-name>
```

---

## Emergency Contacts

- **Vercel Support**: support@vercel.com (Enterprise: priority support)
- **Stripe Support**: https://support.stripe.com
- **Resend Support**: support@resend.com
- **On-Call Engineer**: [Add contact info]

---

## Post-Deployment Monitoring

### First 24 Hours

- [ ] Monitor error rates every hour
- [ ] Check performance metrics every 2 hours
- [ ] Review user feedback/support tickets
- [ ] Monitor database performance
- [ ] Check payment processing success rate

### First Week

- [ ] Daily error rate review
- [ ] Daily performance metrics review
- [ ] Weekly infrastructure cost review
- [ ] Weekly security audit

---

## Notes

**Last Deployment**: [Date]  
**Deployed By**: [Name]  
**Version**: [Git commit SHA]  
**Issues**: [List any known issues]

---

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying)
- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/prisma-in-production)
- [Stripe Production Checklist](https://stripe.com/docs/keys#production-keys)
