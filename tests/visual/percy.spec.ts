/**
 * Percy Visual Regression Tests
 * StormCom Multi-tenant E-commerce Platform
 * 
 * Purpose: Capture visual snapshots of critical pages for regression testing
 * Constitution requirement: Percy snapshots for all UI components with 0.1% threshold
 * 
 * Critical pages tested (from constitution):
 * - Dashboard (admin overview, analytics)
 * - Product list (catalog, filters, search)
 * - Checkout flow (cart, shipping, payment, confirmation)
 * - Admin settings (store config, user management)
 * 
 * Viewports tested (from constitution):
 * - Mobile (375px) - iPhone SE, older Android
 * - Tablet (768px) - iPad, Android tablets
 * - Desktop (1280px) - Standard laptop/desktop
 * 
 * Test execution:
 * - Local: npm run test:percy (requires PERCY_TOKEN env var)
 * - CI: Automated on every PR via GitHub Actions
 * 
 * Visual approval workflow:
 * 1. Percy captures snapshots on every PR
 * 2. Compares against baseline (main branch)
 * 3. If differences > 0.1%, flags for manual review
 * 4. Developer reviews in Percy dashboard (percy.io)
 * 5. Approves/rejects visual changes
 * 6. Approved snapshots become new baseline
 */

import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

/**
 * Test configuration
 * - Use authenticated sessions for dashboard/admin pages
 * - Use guest sessions for storefront pages
 * - Wait for network idle before capturing snapshots
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_STORE_SUBDOMAIN = 'test-store';

/**
 * Percy snapshot options
 * - widths: Defined in .percy.yml (375px, 768px, 1280px)
 * - minHeight: Defined in .percy.yml (1024px)
 * - percyCSS: Optional CSS to hide dynamic content (e.g., timestamps)
 */

// Helper to hide dynamic content that changes on every render
const PERCY_CSS = `
  /* Hide timestamps and dynamic content to prevent false positives */
  [data-testid="timestamp"],
  [data-testid="last-updated"],
  [data-testid="session-timer"] {
    visibility: hidden !important;
  }

  /* Hide animations during snapshot capture */
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`;

/**
 * Authentication helper
 * Create authenticated session for dashboard/admin tests
 */
async function loginAsStoreAdmin(page: any) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[name="email"]', 'admin@test-store.com');
  await page.fill('[name="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`);
}

test.describe('Percy Visual Regression - Storefront (Guest)', () => {
  test.beforeEach(async ({ page }) => {
    // Set subdomain context for multi-tenant testing
    await page.addInitScript(() => {
      (window as any).__STORE_SUBDOMAIN__ = 'test-store';
    });
  });

  test('Homepage - Hero and featured products', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    // Wait for product images to load
    await page.waitForSelector('img[alt*="product"]', { timeout: 10000 });
    
    await percySnapshot(page, 'Storefront - Homepage', {
      percyCSS: PERCY_CSS,
    });
  });

  test('Product List - Grid layout with filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    
    // Wait for product grid to render
    await page.waitForSelector('[data-testid="product-grid"]', { timeout: 10000 });
    
    await percySnapshot(page, 'Storefront - Product List', {
      percyCSS: PERCY_CSS,
    });
  });

  test('Product List - Filter sidebar open', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    
    // Open filter sidebar
    await page.click('[data-testid="filter-toggle"]').catch(() => {
      // Filters may be open by default on desktop
    });
    
    await page.waitForSelector('[data-testid="filter-sidebar"]', { timeout: 5000 });
    
    await percySnapshot(page, 'Storefront - Product List with Filters', {
      percyCSS: PERCY_CSS,
    });
  });

  test('Product Detail Page - Single product', async ({ page }) => {
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    
    // Click first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.waitForLoadState('networkidle');
    
    // Wait for product images and details
    await page.waitForSelector('[data-testid="product-image"]', { timeout: 10000 });
    
    await percySnapshot(page, 'Storefront - Product Detail', {
      percyCSS: PERCY_CSS,
    });
  });

  test('Shopping Cart - Empty state', async ({ page }) => {
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Storefront - Cart Empty', {
      percyCSS: PERCY_CSS,
    });
  });

  test('Shopping Cart - With items', async ({ page }) => {
    // Add product to cart first
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    
    const addToCartButton = page.locator('[data-testid="add-to-cart"]').first();
    await addToCartButton.click();
    
    // Navigate to cart
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Storefront - Cart with Items', {
      percyCSS: PERCY_CSS,
    });
  });

  test('Checkout - Shipping information', async ({ page }) => {
    // Prerequisite: Add item to cart
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="add-to-cart"]').first().click();
    
    // Go to checkout
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Checkout - Shipping Step', {
      percyCSS: PERCY_CSS,
    });
  });

  test('Checkout - Payment information', async ({ page }) => {
    // Prerequisite: Add item and fill shipping
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="add-to-cart"]').first().click();
    
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForLoadState('networkidle');
    
    // Fill shipping form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="firstName"]', 'John');
    await page.fill('[name="lastName"]', 'Doe');
    await page.fill('[name="address1"]', '123 Test St');
    await page.fill('[name="city"]', 'Test City');
    await page.fill('[name="state"]', 'TS');
    await page.fill('[name="postalCode"]', '12345');
    await page.selectOption('[name="country"]', 'US');
    
    await page.click('[data-testid="continue-to-payment"]');
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Checkout - Payment Step', {
      percyCSS: PERCY_CSS,
    });
  });
});

test.describe('Percy Visual Regression - Dashboard (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStoreAdmin(page);
  });

  test('Dashboard - Overview with analytics', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Wait for analytics widgets to load
    await page.waitForSelector('[data-testid="analytics-card"]', { timeout: 10000 });
    
    await percySnapshot(page, 'Dashboard - Overview', {
      percyCSS: PERCY_CSS,
    });
  });

  test('Dashboard - Product management', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/products`);
    await page.waitForLoadState('networkidle');
    
    // Wait for product table
    await page.waitForSelector('[data-testid="product-table"]', { timeout: 10000 });
    
    await percySnapshot(page, 'Dashboard - Products List', {
      percyCSS: PERCY_CSS,
    });
  });

  test('Dashboard - Create product form', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/products/new`);
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Dashboard - Create Product', {
      percyCSS: PERCY_CSS,
    });
  });

  test('Dashboard - Order management', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/orders`);
    await page.waitForLoadState('networkidle');
    
    // Wait for orders table
    await page.waitForSelector('[data-testid="orders-table"]', { timeout: 10000 });
    
    await percySnapshot(page, 'Dashboard - Orders List', {
      percyCSS: PERCY_CSS,
    });
  });

  test('Dashboard - Customer management', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/customers`);
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Dashboard - Customers List', {
      percyCSS: PERCY_CSS,
    });
  });

  test('Dashboard - Store settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings`);
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Dashboard - Store Settings', {
      percyCSS: PERCY_CSS,
    });
  });

  test('Dashboard - User settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/settings/users`);
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Dashboard - User Management', {
      percyCSS: PERCY_CSS,
    });
  });
});

test.describe('Percy Visual Regression - Admin (Super Admin)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as super admin
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[name="email"]', 'superadmin@stormcom.com');
    await page.fill('[name="password"]', 'Admin1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/admin/dashboard`);
  });

  test('Admin - Store overview', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Admin - Dashboard', {
      percyCSS: PERCY_CSS,
    });
  });

  test('Admin - All stores list', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/stores`);
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Admin - Stores List', {
      percyCSS: PERCY_CSS,
    });
  });
});

test.describe('Percy Visual Regression - Responsive Breakpoints', () => {
  test('Mobile Navigation - Hamburger menu open', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`${BASE_URL}`);
    await page.waitForLoadState('networkidle');
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-toggle"]');
    await page.waitForSelector('[data-testid="mobile-menu"]', { timeout: 5000 });
    
    await percySnapshot(page, 'Mobile - Navigation Menu Open', {
      percyCSS: PERCY_CSS,
      widths: [375], // Only capture mobile viewport
    });
  });

  test('Tablet Layout - Product grid', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto(`${BASE_URL}/products`);
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Tablet - Product Grid', {
      percyCSS: PERCY_CSS,
      widths: [768], // Only capture tablet viewport
    });
  });

  test('Desktop Full Width - Dashboard', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 1024 });
    
    await loginAsStoreAdmin(page);
    
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    await percySnapshot(page, 'Desktop - Dashboard Full Width', {
      percyCSS: PERCY_CSS,
      widths: [1280], // Only capture desktop viewport
    });
  });
});

/**
 * Percy snapshot naming conventions:
 * - [Context] - [Page/Component] - [State]
 * - Examples:
 *   - "Storefront - Homepage"
 *   - "Dashboard - Products List"
 *   - "Checkout - Payment Step"
 *   - "Mobile - Navigation Menu Open"
 * 
 * Percy comparison workflow:
 * 1. Baseline snapshots captured from main branch
 * 2. PR snapshots compared against baseline
 * 3. Visual differences > 0.1% flagged for review
 * 4. Developer approves/rejects in Percy dashboard
 * 5. Approved snapshots become new baseline
 * 
 * Debugging tips:
 * - If snapshots are inconsistent, check for:
 *   - Dynamic timestamps (use percyCSS to hide)
 *   - Animations (disabled via percyCSS)
 *   - Loading states (wait for networkidle)
 *   - Random content (use seeded test data)
 * - View snapshot diffs in Percy dashboard: percy.io/[org]/[project]
 * - Use Percy CLI for local testing: npx percy exec -- npm run test:percy:local
 */
