# Performance Thresholds - StormCom E-commerce Platform

**Feature**: 002-harden-checkout-tenancy  
**Task**: T039 - Performance Testing Infrastructure  
**Date**: 2025-01-29  
**Status**: ✅ Implemented

---

## 1. Overview

This document defines the performance budgets and load testing thresholds for the StormCom multi-tenant e-commerce platform. All thresholds are derived from:

1. **Project Constitution** (`.specify/memory/constitution.md`)
2. **Next.js Instructions** (`.github/instructions/nextjs.instructions.md`)
3. **Industry Best Practices** (Web Vitals, Core Web Vitals)
4. **SaaS Performance Standards** (99.9% uptime, < 500ms API responses)

All thresholds are **REQUIRED** and enforced in CI/CD pipelines. Exceeding any threshold results in build failure.

---

## 2. Web Vitals (Lighthouse CI)

### 2.1 Desktop Performance Budgets

**Tested URLs** (5 critical paths):
- Homepage (`/`)
- Product List (`/products`)
- Checkout (`/checkout`)
- Dashboard (`/dashboard`)
- Product Management (`/dashboard/products`)

**Thresholds** (enforced in `lighthouserc.js`):

| Metric | Threshold | Error Level | Rationale |
|--------|-----------|-------------|-----------|
| **Largest Contentful Paint (LCP)** | < 2.0s | Error | Core Web Vital - Above-fold content must load quickly |
| **First Input Delay (FID)** | < 100ms | Error | Core Web Vital - Interactive responsiveness |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Error | Core Web Vital - Visual stability |
| **Time to Interactive (TTI)** | < 3.0s | Error | User experience - Full interactivity |
| **First Contentful Paint (FCP)** | < 1.5s | Warning | Initial render speed |
| **Total Page Weight** | < 500KB | Warning | Network performance |
| **Performance Score** | ≥ 90% | Error | Overall performance health |
| **Accessibility Score** | ≥ 90% | Error | WCAG 2.1 AA compliance |

**Lighthouse Configuration**:
```javascript
settings: {
  preset: 'desktop',
  throttling: {
    rttMs: 40,              // 40ms round-trip time
    throughputKbps: 10240,  // 10 Mbps download
    cpuSlowdownMultiplier: 1, // No CPU throttling
  }
}
```

**Why These Thresholds?**
- **LCP < 2.0s**: Google's "Good" threshold is 2.5s; we target 2.0s for competitive advantage
- **FID < 100ms**: Core Web Vital threshold (100ms is "Good", 300ms is "Poor")
- **CLS < 0.1**: Core Web Vital threshold (0.1 is "Good", 0.25 is "Poor")
- **TTI < 3.0s**: Industry standard for SaaS applications (3-5s acceptable, < 3s excellent)
- **Performance ≥ 90%**: Lighthouse "green" zone, indicating excellent optimization

### 2.2 Mobile Performance Budgets

**Tested URLs** (3 critical paths - mobile-first):
- Homepage
- Product List
- Checkout (most critical for mobile conversions)

**Thresholds** (enforced in `lighthouserc.mobile.js`):

| Metric | Threshold | Error Level | Rationale |
|--------|-----------|-------------|-----------|
| **Largest Contentful Paint (LCP)** | < 2.5s | Error | Mobile networks slower, 2.5s is Core Web Vital threshold |
| **First Input Delay (FID)** | < 100ms | Error | Same as desktop - user expectations unchanged |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Error | Same as desktop - visual stability critical |
| **Time to Interactive (TTI)** | < 3.0s | Error | Same as desktop - mobile users expect responsiveness |
| **Performance Score** | ≥ 85% | Error | Relaxed from 90% due to mobile constraints |
| **Accessibility Score** | ≥ 90% | Error | Same as desktop - no compromise on accessibility |

**Mobile Emulation Settings**:
```javascript
settings: {
  preset: 'mobile',
  throttling: {
    rttMs: 150,              // 4G network latency
    throughputKbps: 1638,    // 1.6 Mbps (4G)
    cpuSlowdownMultiplier: 4, // Simulate mid-range mobile device
  },
  screenEmulation: {
    mobile: true,
    width: 360,
    height: 640,
    deviceScaleFactor: 2,
  }
}
```

**Why Mobile Is Different?**
- **LCP relaxed to 2.5s**: Slower network (4G), weaker CPU (4x slowdown)
- **Performance score relaxed to 85%**: Mobile constraints make 90% difficult
- **Fewer URLs tested**: Focus on customer-facing critical paths

---

## 3. API Load Testing (k6)

### 3.1 Checkout Flow Load Test

**Test File**: `tests/performance/checkout-load-test.js`

**Load Pattern** (50 concurrent users, 2-minute test):
```javascript
stages: [
  { duration: '30s', target: 10 },  // Ramp-up: 0 → 10 VUs
  { duration: '30s', target: 50 },  // Spike: 10 → 50 VUs
  { duration: '1m', target: 50 },   // Sustained: 50 VUs
  { duration: '30s', target: 0 },   // Ramp-down: 50 → 0 VUs
]
```

**Endpoints Tested** (4 critical API routes):

| Endpoint | Method | Threshold (p95) | Error Level | Rationale |
|----------|--------|-----------------|-------------|-----------|
| `/api/checkout/validate` | POST | < 500ms | Error | Cart validation must be fast |
| `/api/checkout/shipping` | POST | < 500ms | Error | Shipping calculation (standard APIs) |
| `/api/checkout/payment-intent` | POST | < 500ms | Error | Stripe payment intent creation (external API) |
| `/api/checkout/complete` | POST | < 650ms | Error | **CRITICAL PATH** - Full order processing |

**Aggregate Thresholds**:

| Metric | Threshold | Error Level | Rationale |
|--------|-----------|-------------|-----------|
| **Error Rate** | < 1% | Error | 99%+ success rate required for SaaS |
| **HTTP Failures** | < 1% | Error | Network/server stability |
| **Success Rate** | > 99% | Error | Inverse of error rate |
| **Custom Metrics** |
| `checkout_errors` | Rate < 0.01 | Error | Business logic error tracking |
| `checkout_duration` | p(95) < 650ms | Error | End-to-end checkout timing |

**Why 650ms for checkout/complete?**
- **Payment provider latency**: Stripe API adds ~100-150ms
- **Database transactions**: Multi-table writes (orders, order_items, inventory updates)
- **Audit logging**: Critical path includes security logging
- **Cache invalidation**: Session updates, cart clearing
- **Total budget**: 500ms (standard API) + 150ms (Stripe + DB) = 650ms

**Test Data**:
- 3 sample products (varying prices: $29.99, $99.99, $199.99)
- 2 addresses (US, Canada - for shipping calculation)
- 1 payment method (Stripe test card `pm_card_visa`)

**Load Justification**:
- **50 VUs**: Simulates moderate traffic (50 concurrent checkouts)
- **2-minute test**: Sufficient for statistical significance (120 samples minimum)
- **Spike pattern**: Tests system under sudden load increase (Black Friday, flash sales)

### 3.2 Orders Export Load Test

**Test File**: `tests/performance/orders-export-load-test.js`

**Load Pattern** (20 concurrent users, 1.5-minute test):
```javascript
stages: [
  { duration: '20s', target: 5 },   // Ramp-up: 0 → 5 VUs
  { duration: '20s', target: 20 },  // Spike: 5 → 20 VUs
  { duration: '40s', target: 20 },  // Sustained: 20 VUs
  { duration: '20s', target: 0 },   // Ramp-down: 20 → 0 VUs
]
```

**Scenarios** (Mixed Workload):

| Scenario | Percentage | Export Type | Threshold (p95) | Rationale |
|----------|-----------|-------------|-----------------|-----------|
| **Small Export** | 70% | Streaming | < 5s | ≤10k rows, direct CSV stream |
| **Large Export** | 30% | Async Job | < 500ms | >10k rows, background job enqueue |

**Endpoints Tested**:

| Endpoint | Query Params | Response Type | Threshold | Rationale |
|----------|-------------|---------------|-----------|-----------|
| `/api/orders/export` | `limit=10000` | CSV stream | p95 < 5s | Real-time export for small datasets |
| `/api/orders/export` | `limit=50000` | JSON job ID | p95 < 500ms | Job enqueue for large datasets |

**Thresholds**:

| Metric | Threshold | Error Level | Rationale |
|--------|-----------|-------------|-----------|
| **Streaming Export Duration** | p95 < 5s | Error | CSV generation + streaming (10k rows × ~0.5ms/row) |
| **Async Enqueue Duration** | p95 < 500ms | Error | Job creation + queue insertion |
| **Error Rate** | < 2% | Error | Relaxed for resource-intensive operations |
| **Success Rate** | > 98% | Error | Inverse of error rate |
| **Custom Metrics** |
| `export_errors` | Rate < 0.02 | Error | Export-specific error tracking |
| `stream_export_duration` | p(95) < 5000ms | Error | Streaming path timing |
| `async_export_enqueue_duration` | p(95) < 500ms | Error | Async enqueue timing |
| `csv_rows_received` | > 0 | Error | CSV validation (row counting) |

**Why 5 seconds for streaming export?**
- **Database query**: 10k rows with pagination (~1-2s)
- **CSV serialization**: 10k rows × 50 columns (~2-3s)
- **Network transfer**: ~2-5MB CSV over network (~500ms-1s)
- **Total budget**: 1.5s (DB) + 2.5s (CSV) + 1s (network) = 5s

**Why 500ms for async enqueue?**
- **Job creation**: Insert into job queue table (~50-100ms)
- **Metadata validation**: Check permissions, query params (~50ms)
- **Response serialization**: Return job ID + status URL (~50ms)
- **Total budget**: 100ms (DB) + 50ms (validation) + 50ms (response) + 300ms (buffer) = 500ms

**Load Justification**:
- **20 VUs**: Lower than checkout (exports are resource-intensive)
- **70/30 split**: Realistic workload (most exports small, occasional large exports)
- **1.5-minute test**: Sufficient for statistical significance (90 samples minimum)

**CSV Validation**:
- **Headers check**: Verify CSV contains expected headers
- **Content-Type**: Ensure `text/csv; charset=utf-8`
- **Content-Disposition**: Check filename in `attachment; filename="orders-...csv"`
- **Row counting**: Parse CSV and count rows (must be > 0)

---

## 4. Infrastructure Requirements

### 4.1 k6 Installation

**Linux (Ubuntu/Debian)**:
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**macOS (Homebrew)**:
```bash
brew install k6
```

**Windows (Chocolatey)**:
```powershell
choco install k6
```

### 4.2 Lighthouse CI Installation

**Global Installation**:
```bash
npm install -g @lhci/cli@0.13.x
```

**Project Installation** (devDependencies):
```bash
npm install --save-dev @lhci/cli@0.13.0
```

### 4.3 Database Requirements

**For Export Load Tests**:
- **Minimum Dataset**: 15k orders (for testing both streaming + async scenarios)
- **Seed Command**: `node -e "require('./prisma/seed').seedLargeOrderSet()"`
- **Disk Space**: ~50MB for 15k orders with order_items, customers, products

**For Checkout Load Tests**:
- **Minimum Dataset**: Default seed data (50+ products, 5+ categories)
- **Seed Command**: `npx prisma db seed`
- **Stripe Configuration**: Test mode credentials required

---

## 5. Running Performance Tests

### 5.1 Local Development

**Lighthouse (Desktop)**:
```bash
# Start application
npm run dev

# Run Lighthouse CI (desktop)
npm run lighthouse

# Results saved to .lighthouseci/
```

**Lighthouse (Mobile)**:
```bash
# Start application
npm run dev

# Run Lighthouse CI (mobile)
npm run lighthouse:mobile

# Results saved to .lighthouseci/
```

**k6 (Checkout)**:
```bash
# Start application
npm run dev

# Run k6 checkout load test
npm run k6:checkout

# Results printed to console + JSON output
```

**k6 (Export)**:
```bash
# Start application + seed large dataset
npm run dev
node -e "require('./prisma/seed').seedLargeOrderSet()"

# Run k6 export load test
npm run k6:export

# Results printed to console + JSON output
```

**All Performance Tests**:
```bash
# Run all performance tests (Lighthouse + k6)
npm run perf
```

### 5.2 CI/CD Pipeline

**GitHub Actions Workflows**:

1. **Lighthouse CI** (`.github/workflows/lighthouse.yml`)
   - Triggered on: PR to main/develop, push to harden branches
   - Jobs: lighthouse-desktop, lighthouse-mobile, lighthouse-comment
   - Artifacts: Lighthouse reports (30-day retention)
   - PR Comments: Performance scores + budget status

2. **k6 Load Tests** (`.github/workflows/k6-load-tests.yml`)
   - Triggered on: PR to main/develop, push to harden branches, daily 2 AM UTC
   - Jobs: k6-checkout, k6-export, k6-comment
   - Artifacts: k6 JSON results (30-day retention)
   - PR Comments: Load test metrics + threshold status

**Failure Handling**:
- **Threshold Breach**: Build fails, PR blocked
- **Artifacts Uploaded**: Even on failure (for debugging)
- **PR Comment**: Always posted (success or failure)

---

## 6. Troubleshooting

### 6.1 Lighthouse Issues

**Issue**: LCP > 2.0s (desktop)
- **Diagnosis**: Check image sizes, server response times, render-blocking resources
- **Fix**: Optimize images (WebP, lazy loading), preload critical fonts, reduce JavaScript bundle

**Issue**: CLS > 0.1
- **Diagnosis**: Identify layout shifts (ads, images without dimensions, dynamic content)
- **Fix**: Reserve space for dynamic content, set image dimensions, avoid inserting content above existing content

**Issue**: Performance score < 90%
- **Diagnosis**: Run Lighthouse locally with `--view` flag to see opportunities
- **Fix**: Follow Lighthouse recommendations (code splitting, tree shaking, compression)

### 6.2 k6 Issues

**Issue**: Checkout p95 > 650ms
- **Diagnosis**: Check Stripe API latency, database query times, audit logging overhead
- **Fix**: Optimize database indexes, batch audit logs, use Stripe async webhooks for non-critical updates

**Issue**: Export streaming > 5s
- **Diagnosis**: Check database query performance, CSV serialization speed, row count
- **Fix**: Add database indexes, use database-level CSV generation (COPY TO), reduce columns exported

**Issue**: Error rate > 1% (checkout)
- **Diagnosis**: Check application logs, database connection pool, Stripe API errors
- **Fix**: Increase connection pool size, add retry logic for transient errors, validate test data

**Issue**: Error rate > 2% (export)
- **Diagnosis**: Check memory usage, database timeouts, CSV parsing errors
- **Fix**: Increase Node heap size, optimize query pagination, add timeout handling

### 6.3 CI/CD Issues

**Issue**: Lighthouse job fails with "Cannot connect to http://localhost:3000"
- **Diagnosis**: Application failed to start or not ready in time
- **Fix**: Increase wait-on timeout (default 60s), check build logs, verify environment variables

**Issue**: k6 job fails with "k6: command not found"
- **Diagnosis**: k6 not installed in CI environment
- **Fix**: Verify k6 installation steps in workflow, check apt-get update output

**Issue**: Artifacts not uploaded
- **Diagnosis**: Artifact paths incorrect, job cancelled before upload
- **Fix**: Use `if: always()` for upload step, verify artifact paths

---

## 7. Performance Budget Rationale

### 7.1 Why These Specific Thresholds?

**Business Requirements**:
- **SaaS Uptime**: 99.9% uptime (< 1% error rate)
- **Customer Retention**: Fast checkout = higher conversion rates
- **Competitive Advantage**: Faster than competitors (Shopify, BigCommerce)
- **Mobile-First**: 60%+ traffic from mobile devices

**Technical Constraints**:
- **Stripe API**: 100-150ms latency (external dependency)
- **Database**: PostgreSQL query times (indexed: < 50ms, unindexed: > 500ms)
- **Next.js**: Server Components reduce client-side JS, but SSR adds latency
- **Multi-Tenancy**: Tenant isolation adds query complexity (extra WHERE clause)

**Industry Benchmarks**:
- **Google Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **SaaS Standards**: API response time < 500ms (p95)
- **E-commerce**: Checkout completion < 1s (our target: 650ms)
- **CSV Export**: 1k rows/second (our target: 2k rows/second for streaming)

### 7.2 Trade-offs

**Desktop vs Mobile**:
- **Desktop**: Higher performance expectations (faster networks, more powerful CPUs)
- **Mobile**: Relaxed LCP (2.5s vs 2.0s), relaxed performance score (85% vs 90%)
- **Rationale**: Mobile users expect slower loading but still demand accessibility

**Streaming vs Async Export**:
- **Streaming**: Fast for small datasets (< 5s for 10k rows)
- **Async**: Instant response for large datasets (< 500ms enqueue, hours for processing)
- **Rationale**: User experience trade-off (real-time vs background processing)

**Load Test VUs**:
- **Checkout**: 50 VUs (moderate traffic, critical path)
- **Export**: 20 VUs (lower concurrency, resource-intensive)
- **Rationale**: Export consumes more memory/CPU per request

---

## 8. Maintenance

### 8.1 Threshold Updates

**When to Update**:
- **Infrastructure Changes**: Faster servers, CDN improvements
- **Feature Additions**: New checkout steps, additional validations
- **External APIs**: Stripe API latency changes, payment provider switch
- **Business Requirements**: New performance SLAs, competitive benchmarks

**How to Update**:
1. Update threshold in configuration file (`lighthouserc.js`, `*-load-test.js`)
2. Document rationale in this file (Section 7)
3. Validate locally before committing
4. Monitor CI/CD for 1 week after change

**Approval Required**:
- **Relaxing Thresholds** (< 10%): Tech Lead approval
- **Relaxing Thresholds** (≥ 10%): Engineering Manager approval
- **Tightening Thresholds**: No approval (performance improvements welcome)

### 8.2 Test Data Maintenance

**Seed Data Updates**:
- **Monthly**: Review seed data for relevance (products, prices, categories)
- **Quarterly**: Add new scenarios (payment methods, shipping zones, tax rules)
- **Annually**: Full seed data refresh (remove deprecated features)

**Large Dataset Seeding**:
- **Purpose**: Export load testing (15k+ orders)
- **Frequency**: On-demand (not in default seed)
- **Maintenance**: Update seedLargeOrderSet() function when schema changes

---

## 9. References

**Internal Documentation**:
- [Project Constitution](../../.specify/memory/constitution.md)
- [Next.js Instructions](../../.github/instructions/nextjs.instructions.md)
- [Testing Strategy](../../docs/testing-strategy.md)
- [API Routes Instructions](../../.github/instructions/api-routes.instructions.md)

**External Standards**:
- [Google Core Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)
- [k6 Documentation](https://k6.io/docs/)
- [WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/)

**Tools**:
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [k6 Load Testing](https://k6.io/)
- [Web Vitals Extension](https://chrome.google.com/webstore/detail/web-vitals/ahfhijdlegdabablpippeagghigmibma)

---

## 10. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-29 | GitHub Copilot | Initial version - T039 implementation |

---

**Last Updated**: 2025-01-29  
**Next Review**: 2025-04-29 (Quarterly)  
**Owner**: Engineering Team  
**Status**: ✅ Active
