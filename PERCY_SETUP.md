# Percy Visual Regression - Quick Setup Guide

## ✅ Installation Complete

Percy has been successfully integrated into StormCom with:

- **Dependencies**: `@percy/cli@1.29.3`, `@percy/playwright@1.0.6` ✅
- **Configuration**: `.percy.yml` with 0.1% threshold ✅
- **Tests**: 20+ snapshots across 3 viewports (60+ visual comparisons) ✅
- **CI/CD**: GitHub Actions workflow ready ✅
- **Documentation**: Comprehensive guide in `docs/percy-visual-regression.md` ✅

## 🚀 Next Steps to Enable Percy

### Step 1: Create Percy Account & Get Token

1. Go to https://percy.io and create a free account
2. Create a new project named "StormCom"
3. Copy your `PERCY_TOKEN` from the project settings

### Step 2: Add Token to GitHub Repository

1. Go to your GitHub repository: **CodeStorm-Hub/StormCom**
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add secret:
   - **Name**: `PERCY_TOKEN`
   - **Value**: `your_token_from_percy_io`
5. Click **Add secret**

### Step 3: Enable Percy in Branch Protection

1. Go to **Settings** → **Branches** → **main** → **Edit**
2. Enable **Require status checks to pass before merging**
3. Search for and add: `percy-visual-tests`
4. Click **Save changes**

**Note**: Percy status check will only appear after running at least once on a PR.

### Step 4: Test Percy Locally (Optional)

Before enabling CI, test Percy locally:

```powershell
# Add token to .env.local
echo "PERCY_TOKEN=your_percy_token_here" >> .env.local

# Start Next.js dev server
npm run dev

# In a new terminal, run Percy tests
npm run test:percy:local
```

This creates a Percy build and uploads snapshots to the Percy dashboard.

### Step 5: Create Baseline Snapshots

Once PERCY_TOKEN is added to GitHub:

```powershell
# Ensure you're on the main branch
git checkout main
git pull

# Create a test PR or push to main
git push origin main
```

The GitHub Actions workflow will automatically:
- Run Percy visual tests on every PR
- Compare new snapshots to baseline (main branch)
- Post results as a PR comment
- Create required status check

## 📊 Percy Workflow

### On Every Pull Request

1. Percy captures 60+ snapshots (20 pages × 3 viewports)
2. Compares snapshots to baseline (main branch)
3. Flags visual differences > 0.1% threshold
4. Posts Percy dashboard link in PR comment
5. Requires manual approval for visual changes

### Approving Visual Changes

1. Click Percy dashboard link in PR comment
2. Review visual diffs in Percy UI
3. Click **Approve** or **Reject** for each change
4. Once approved, Percy status check passes
5. PR can be merged

## 🎯 Test Coverage

Percy captures snapshots for:

### Storefront (Guest) - 8 snapshots
- Homepage (hero, featured products)
- Product list (grid, filters)
- Product detail (image gallery, add to cart)
- Shopping cart (items, totals, checkout button)
- Checkout (shipping form, payment, order review)
- Category page (product grid, filters)
- Search results (query results)
- Empty states (cart, search)

### Dashboard (Authenticated) - 7 snapshots
- Dashboard overview (metrics, charts)
- Product list (table, actions)
- Product editor (form, image upload)
- Order list (table, filters)
- Order details (items, customer, status)
- Customer list (table, search)
- Settings (store configuration)

### Admin (Super Admin) - 2 snapshots
- Admin dashboard (all stores)
- Store management (list, create)

### Responsive Tests - 3 snapshots
- Mobile menu (navigation)
- Tablet product grid (responsive layout)
- Desktop full page (wide layout)

**Total**: 20 pages × 3 viewports = **60+ visual comparisons** per Percy run

## 🔧 Local Testing Commands

```powershell
# Run Percy tests (requires PERCY_TOKEN in .env.local)
npm run test:percy

# Run Percy with verbose logging (for debugging)
npm run test:percy:local

# Update baseline snapshots (run on main branch)
npm run percy:baseline
```

## 📖 Full Documentation

For detailed information, see:
- **Percy Documentation**: `docs/percy-visual-regression.md`
- **Completion Report**: `specs/002-harden-checkout-tenancy/artifacts/T043-PERCY-VISUAL-REGRESSION-COMPLETION.md`

## 💰 Cost Considerations

Percy free tier includes:
- **5,000 snapshots/month**
- **Unlimited team members**
- **Unlimited projects**

Current usage estimate:
- **60 snapshots per PR** (20 pages × 3 viewports)
- **~83 PRs/month** within free tier
- **Average PR volume**: ~20-40 PRs/month (well within limit)

If you exceed free tier, consider:
- Using Percy only on critical PRs (manual trigger)
- Reducing viewport count (test only mobile + desktop)
- Upgrading to paid plan ($149/month for 25,000 snapshots)

## 🐛 Troubleshooting

### Percy Token Not Working

**Error**: `Error: Missing Percy token`

**Solution**:
```powershell
# Verify token is set in GitHub Secrets
# Or add to .env.local for local testing
echo "PERCY_TOKEN=your_token_here" >> .env.local
```

### Snapshots Are Inconsistent

**Error**: Percy reports differences on every run

**Solution**:
- Ensure dynamic content is hidden via `percyCSS` in test
- Wait for network idle before capturing: `await page.waitForLoadState('networkidle')`
- Use seeded test data (consistent on every run)

### Percy Status Check Not Appearing

**Error**: GitHub branch protection can't find Percy status

**Solution**:
- Percy must run at least once before status check appears
- Merge a PR with Percy enabled first
- Then add status check requirement

## ✨ Benefits

Percy visual regression testing provides:

1. **Catch Visual Bugs**: Detect unintended CSS changes, layout shifts, responsive issues
2. **Cross-Browser Testing**: Snapshots rendered in Chrome (Percy Cloud)
3. **Prevent Regressions**: Ensure UI changes don't break existing pages
4. **Design Review**: Visual diffs for stakeholder approval
5. **Documentation**: Historical record of UI evolution
6. **Confidence**: Deploy with confidence that UI is correct

## 🎉 Ready to Go!

Percy is fully configured and ready to use. Complete Steps 1-3 above to enable Percy in your CI/CD pipeline.

**Questions?** See `docs/percy-visual-regression.md` or ask for help!
