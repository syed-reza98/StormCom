# Production Deployment Checklist - Phase 3

**Feature**: 002 - Harden Checkout Tenancy  
**Phase**: Production Migration Phase 3 - Vercel KV Deployment  
**Date**: 2025-01-30

---

## Pre-Deployment Checklist

### Code Readiness
- [x] **Phase 1 Complete**: Idempotency infrastructure implemented
- [x] **Phase 2 Complete**: Response format standardized  
- [x] **Type-check passing**: Zero new TypeScript errors (77 pre-existing only)
- [ ] **Unit tests passing**: `npm run test -- src/lib/idempotency`
- [ ] **Integration tests reviewed**: Known test failures documented
- [ ] **Git branch clean**: All changes committed to `002-harden-checkout-tenancy`

### Vercel Account Setup
- [ ] **Vercel account created**: Pro or Enterprise plan active
- [ ] **Billing enabled**: Payment method added
- [ ] **StormCom project created**: Project exists in Vercel dashboard
- [ ] **GitHub integration configured**: Auto-deploy on push enabled (optional)

### Environment Variables (Local)
- [x] **`.env.local` configured**: Development environment ready
- [x] **Database connection**: SQLite dev.db working
- [x] **NextAuth configured**: Session authentication working
- [ ] **Dev server running**: `npm run dev` starts without errors

---

## Vercel KV Setup Checklist

### Step 1: Create KV Database
- [ ] Navigate to Vercel Dashboard → Storage
- [ ] Click **Create Database**
- [ ] Select **KV** (Redis)
- [ ] Database name: `stormcom-idempotency-cache`
- [ ] Region: **Washington, D.C., USA (iad1)**
- [ ] Click **Create**

### Step 2: Connect to Project
- [ ] Select **StormCom** project from dropdown
- [ ] Click **Connect**
- [ ] Verify environment variables auto-populated:
  - [ ] `KV_URL`
  - [ ] `KV_REST_API_URL`
  - [ ] `KV_REST_API_TOKEN`
  - [ ] `KV_REST_API_READ_ONLY_TOKEN`

### Step 3: Configure KV Settings (Optional)
- [ ] Max Memory Policy: `allkeys-lru`
- [ ] Max Memory: `100MB`
- [ ] Persistence: Enabled
- [ ] Eviction: Enabled

---

## Production Environment Configuration

### Environment Variables (Vercel Dashboard)
Navigate to: Vercel Dashboard → Settings → Environment Variables

#### Required Variables (Check "Production" scope)
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` (PostgreSQL connection string)
- [ ] `NEXTAUTH_SECRET` (generate new 32+ char secret)
- [ ] `NEXTAUTH_URL` (https://stormcom.vercel.app)
- [ ] `KV_URL` (auto-populated - verify exists)
- [ ] `KV_REST_API_URL` (auto-populated - verify exists)
- [ ] `KV_REST_API_TOKEN` (auto-populated - verify exists)
- [ ] `KV_REST_API_READ_ONLY_TOKEN` (auto-populated - verify exists)

#### Payment Gateway (Production Keys)
- [ ] `STRIPE_SECRET_KEY` (sk_live_***)
- [ ] `STRIPE_PUBLISHABLE_KEY` (pk_live_***)
- [ ] `STRIPE_WEBHOOK_SECRET` (whsec_***)

#### Email Service
- [ ] `RESEND_API_KEY` (production key)
- [ ] `RESEND_FROM_EMAIL` (verified domain)

#### External Integrations (Optional)
- [ ] `SHOPIFY_API_KEY`
- [ ] `SHOPIFY_API_SECRET`
- [ ] `MAILCHIMP_CLIENT_ID`
- [ ] `MAILCHIMP_CLIENT_SECRET`

### Verify Environment Variable Scopes
- [ ] All KV_* variables checked for **Production** environment
- [ ] All KV_* variables checked for **Preview** environment (optional)
- [ ] No KV_* variables checked for **Development** (uses in-memory cache)

---

## Deployment Checklist

### Option A: Automatic Deployment via GitHub

#### Step 1: Push to GitHub
```powershell
# Verify current branch
git branch  # Should show: * 002-harden-checkout-tenancy

# Stage all changes
git add .

# Commit Phase 3 setup
git commit -m "feat(deployment): Add Vercel KV production deployment configuration"

# Push to GitHub
git push origin 002-harden-checkout-tenancy
```

**Checklist**:
- [ ] Changes pushed to `002-harden-checkout-tenancy` branch
- [ ] Vercel detected push (check dashboard for new deployment)
- [ ] Preview deployment started

#### Step 2: Verify Preview Deployment
- [ ] Preview URL generated: `https://stormcom-002-harden-*.vercel.app`
- [ ] Build succeeded (green checkmark in Vercel dashboard)
- [ ] No build errors in logs
- [ ] Deployment logs show: "Vercel KV configured - using distributed cache"

#### Step 3: Test Preview Deployment
```powershell
# Set preview URL
$env:PRODUCTION_URL = "https://stormcom-002-harden-*.vercel.app"

# Get session token from browser (login to preview deployment first)
$env:SESSION_TOKEN = "<your-session-token>"

# Run verification script
npx tsx scripts/verify-production-idempotency.ts
```

**Checklist**:
- [ ] All 3 verification tests passed
- [ ] Cache hit rate ≥ 80% (if metrics endpoint available)
- [ ] No errors in verification output

#### Step 4: Promote to Production
- [ ] Create Pull Request: `002-harden-checkout-tenancy` → `main`
- [ ] PR description includes Phase 3 summary
- [ ] Request code review (optional)
- [ ] Merge PR to `main` branch
- [ ] Vercel auto-deploys to production: `https://stormcom.vercel.app`

### Option B: Manual Deployment via CLI

#### Step 1: Install Vercel CLI
```powershell
npm install -g vercel
vercel login
```

**Checklist**:
- [ ] Vercel CLI installed
- [ ] Logged in to Vercel account
- [ ] Current directory: `f:\stromcom4test\StormCom`

#### Step 2: Deploy to Preview
```powershell
vercel
# Follow prompts:
# - Link to existing project? Yes
# - Select project: StormCom
# - Override settings? No
```

**Checklist**:
- [ ] Preview deployment successful
- [ ] Preview URL displayed in terminal
- [ ] Build logs show no errors

#### Step 3: Test Preview
- [ ] Run verification script (see Option A, Step 3)
- [ ] All tests passed

#### Step 4: Deploy to Production
```powershell
vercel --prod
```

**Checklist**:
- [ ] Production deployment successful
- [ ] Production URL: `https://stormcom.vercel.app`
- [ ] No deployment errors

---

## Post-Deployment Verification

### Deployment Health Check
Navigate to: Vercel Dashboard → Deployments → <latest deployment>

- [ ] **Status**: Ready (green checkmark)
- [ ] **Build Duration**: < 5 minutes
- [ ] **Build Logs**: No errors or warnings
- [ ] **Deployment Logs**: Show "Vercel KV configured"
- [ ] **Function Logs**: No errors in first 5 minutes

### KV Connection Verification
Navigate to: Vercel Dashboard → Storage → stormcom-idempotency-cache

- [ ] **Status**: Active
- [ ] **Connected Projects**: StormCom listed
- [ ] **Storage Usage**: < 10 MB (initial)
- [ ] **Commands**: > 0 (indicates cache activity)

### Functional Testing

#### Test 1: Manual Idempotency Test
```powershell
$domain = "https://stormcom.vercel.app"
$idempotencyKey = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"

# First request
curl -X PUT "$domain/api/orders/test-id/status" `
  -H "Content-Type: application/json" `
  -H "Idempotency-Key: $idempotencyKey" `
  -H "Cookie: next-auth.session-token=<your-token>" `
  -d '{"status": "PROCESSING"}'

# Second request (should return cached)
curl -X PUT "$domain/api/orders/test-id/status" `
  -H "Content-Type: application/json" `
  -H "Idempotency-Key: $idempotencyKey" `
  -H "Cookie: next-auth.session-token=<your-token>" `
  -d '{"status": "PROCESSING"}'
```

**Checklist**:
- [ ] First request: HTTP 200, valid response
- [ ] Second request: HTTP 200, identical response
- [ ] Responses match exactly (cached result)

#### Test 2: Automated Verification
```powershell
$env:PRODUCTION_URL = "https://stormcom.vercel.app"
$env:SESSION_TOKEN = "<your-session-token>"
npx tsx scripts/verify-production-idempotency.ts
```

**Checklist**:
- [ ] Test 1 passed: Duplicate requests cached
- [ ] Test 2 passed: Different keys allowed
- [ ] Test 3 passed: Missing keys rejected
- [ ] All tests passed (exit code 0)

#### Test 3: End-to-End User Flow
- [ ] Login to production site
- [ ] Create test order
- [ ] Update order status
- [ ] Verify no duplicate status updates in database
- [ ] Check KV metrics for cache hits

---

## Monitoring Setup

### Week 1 Monitoring Plan

#### Daily Checks (Days 1-7)
- [ ] **Cache Hit Rate**: Check Vercel Dashboard → Storage → Metrics
  - Target: ≥ 80%
  - If < 50%: Investigate client idempotency key usage
- [ ] **Error Logs**: Check Vercel Dashboard → Deployments → Function Logs
  - Filter for: "idempotency", "KV", "cache"
  - Expected: Zero errors related to caching
- [ ] **KV Usage**: Check Storage → stormcom-idempotency-cache → Metrics
  - Storage: Should stabilize < 100 MB after 24 hours
  - Commands: Should grow linearly with traffic
- [ ] **API Response Times**: Check Vercel Analytics
  - Baseline: Record current p95 latency
  - Monitor: Should not increase > 10ms after KV deployment

#### Weekly Review (End of Week 1)
- [ ] Cache hit rate trend: Stable or improving?
- [ ] Total duplicate operations prevented: Calculate from cache hits
- [ ] KV costs: Within Pro plan limits?
- [ ] User-reported issues: Any idempotency-related complaints?

### Ongoing Monitoring (Monthly)

#### Monthly KV Health Check
Navigate to: Vercel Dashboard → Storage → stormcom-idempotency-cache

- [ ] **Storage Usage**: < 100 MB (within free tier)
- [ ] **Daily Commands**: < 100K/day (within free tier)
- [ ] **Latency (p95)**: < 10ms
- [ ] **Evictions**: 0 (keys should expire via TTL)
- [ ] **Cache Hit Rate**: ≥ 80%

#### Monthly Cost Review
Navigate to: Vercel Dashboard → Billing

- [ ] **KV Storage Cost**: $0 (if < 100 MB)
- [ ] **KV Commands Cost**: $0 (if < 100K/day)
- [ ] **Total Vercel Cost**: ~$20/month (Pro plan base)
- [ ] **Cost Anomalies**: Investigate any unexpected charges

---

## Rollback Plan

### Scenario 1: Deployment Fails

**Symptoms**: Build errors, deployment failed status

**Action**:
- [ ] Review build logs in Vercel dashboard
- [ ] Fix errors in code
- [ ] Redeploy via `git push` or `vercel --prod`

### Scenario 2: KV Not Working

**Symptoms**: Logs show "Vercel KV not configured - using in-memory cache"

**Action**:
- [ ] Verify KV environment variables in Vercel Dashboard
- [ ] Check variable scopes (Production enabled?)
- [ ] Trigger redeployment: `vercel --prod`
- [ ] **Fallback**: Application still works (uses in-memory cache)

### Scenario 3: Performance Degradation

**Symptoms**: API latency increased > 100ms after deployment

**Action**:
- [ ] Check KV latency in Storage → Metrics
- [ ] If KV latency > 50ms: Check Vercel status page
- [ ] **Emergency Rollback**:
  - [ ] Vercel Dashboard → Deployments → <previous deployment>
  - [ ] Click "Promote to Production"
  - [ ] Monitor recovery

### Scenario 4: Data Corruption

**Symptoms**: Duplicate operations detected despite idempotency

**Action**:
- [ ] **STOP**: Immediately rollback to previous deployment
- [ ] Flush KV cache: Storage → Data → Flush All
- [ ] Investigate root cause:
  - [ ] Check TTL configuration
  - [ ] Verify cache key generation
  - [ ] Review recent code changes
- [ ] Do NOT redeploy until issue identified

---

## Success Criteria

**Phase 3 is complete when ALL criteria are met**:

### Technical Criteria
- [x] Idempotency infrastructure implemented (Phase 1)
- [x] Response format standardized (Phase 2)
- [ ] Vercel KV database created and connected
- [ ] Production deployment successful (no errors)
- [ ] Deployment logs show "Vercel KV configured"
- [ ] All 3 verification tests passing

### Performance Criteria
- [ ] Cache hit rate ≥ 80% (after 24 hours)
- [ ] Cache lookup latency (p95) < 10ms
- [ ] API response time increase < 10ms
- [ ] Zero idempotency-related errors in logs

### Business Criteria
- [ ] Zero duplicate operations detected in production
- [ ] KV usage within Pro plan limits
- [ ] Cost ≤ $20/month (Pro plan base)
- [ ] No user-reported issues related to idempotency

---

## Sign-Off

### Deployment Team
- [ ] **Developer**: Code changes reviewed and tested
- [ ] **QA**: Verification tests passed
- [ ] **DevOps**: Vercel KV configured and deployed
- [ ] **Product**: Success criteria met

### Production Approval
- [ ] **Engineering Lead**: Approved for production
- [ ] **CTO**: Deployment authorized
- [ ] **Deployment Date**: _______________
- [ ] **Deployed By**: _______________

---

## Next Steps After Phase 3

### Phase 4 (Optional): LOW Severity Fixes
- [ ] Add OPTIONS handlers to 67 public API routes
- [ ] Only required if cross-origin API access needed
- [ ] Estimated effort: 2-3 hours

### Future Enhancements
- [ ] Add cache metrics endpoint for monitoring
- [ ] Implement cache compression for large payloads
- [ ] Add cache warming for frequently accessed keys
- [ ] Set up alerts for cache hit rate < 80%
- [ ] Migrate to Redis Cluster for high-traffic scenarios (> 1M req/day)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-30  
**Status**: Ready for Deployment
