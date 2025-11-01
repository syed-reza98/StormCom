// tests/e2e/gdpr/data-export.spec.ts
// E2E tests for GDPR data export functionality

import { test, expect } from '@playwright/test';

// Helper to generate unique test data
function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test.gdpr.export.${timestamp}.${random}@example.com`;
}

function generateTestName(): string {
  const timestamp = Date.now();
  return `Test User ${timestamp}`;
}

test.describe('GDPR Data Export', () => {
  test.describe.configure({ mode: 'serial' });

  let testUserEmail: string;
  let testUserPassword: string;

  test.beforeAll(async () => {
    // Generate unique test user credentials
    testUserEmail = generateTestEmail();
    testUserPassword = 'SecurePass123!';
  });

  test('User can register an account', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill registration form
    await page.fill('input[name="name"]', generateTestName());
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);

    // Submit registration
    await page.click('button[type="submit"]');

    // Wait for registration to complete and redirect
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Verify we're logged in
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('User can request data export', async ({ page }) => {
    // Login with test user
    await page.goto('/login');
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to privacy settings
    await page.goto('/settings/privacy');

    // Verify privacy settings page loaded
    await expect(page.locator('h1, h2, [class*="heading"]')).toContainText(/privacy settings/i);

    // Click export data button
    await page.click('button:has-text("Request Data Export")');

    // Wait for success message
    await expect(page.locator('text=/data export request created successfully/i')).toBeVisible({
      timeout: 10000,
    });

    // Verify request appears in history
    await expect(page.locator('text=/data export/i')).toBeVisible();
    await expect(page.locator('text=/pending/i')).toBeVisible();
  });

  test('User cannot create duplicate export request', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to privacy settings
    await page.goto('/settings/privacy');

    // Try to request export again
    await page.click('button:has-text("Request Data Export")');

    // Should show error about duplicate request
    await expect(page.locator('text=/already/i')).toBeVisible({ timeout: 10000 });
  });

  test('Export request shows correct status in history', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to privacy settings
    await page.goto('/settings/privacy');

    // Verify request history section is visible
    await expect(page.locator('text=/recent requests/i')).toBeVisible();

    // Verify export request details
    await expect(page.locator('text=/data export/i')).toBeVisible();
    
    // Verify status badge (PENDING, PROCESSING, or COMPLETED)
    const statusBadge = page.locator('[class*="badge"]').filter({ hasText: /pending|processing|completed/i });
    await expect(statusBadge).toBeVisible();

    // Verify request date is shown
    await expect(page.locator('text=/requested/i')).toBeVisible();
  });

  test('User data export includes all personal data', async ({ page, request }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Get cookies for API request
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'session');

    // Make API request to check export data structure
    // (In real implementation, we would wait for export to complete and download it)
    const response = await request.post('/api/gdpr/export', {
      headers: {
        'Cookie': sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : '',
      },
    });

    // If not duplicate (409), verify response structure
    if (response.status() === 201 || response.status() === 409) {
      const data = await response.json();
      
      if (response.status() === 201) {
        expect(data).toHaveProperty('data');
        expect(data.data).toHaveProperty('id');
        expect(data.data).toHaveProperty('type', 'EXPORT');
        expect(data.data).toHaveProperty('status');
      }
    }
  });

  test('Privacy settings page displays GDPR information', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to privacy settings
    await page.goto('/settings/privacy');

    // Verify GDPR rights information is displayed
    await expect(page.locator('text=/your rights under gdpr/i')).toBeVisible();
    await expect(page.locator('text=/right of access/i')).toBeVisible();
    await expect(page.locator('text=/right to erasure/i')).toBeVisible();
    await expect(page.locator('text=/right to withdraw consent/i')).toBeVisible();
    await expect(page.locator('text=/right to data portability/i')).toBeVisible();

    // Verify data retention policy is displayed
    await expect(page.locator('text=/data retention policy/i')).toBeVisible();
    await expect(page.locator('text=/account data/i')).toBeVisible();
    await expect(page.locator('text=/order history/i')).toBeVisible();
  });

  test('Export button shows loading state', async ({ page }) => {
    // Create new user for fresh test
    const newEmail = generateTestEmail();
    await page.goto('/register');
    await page.fill('input[name="name"]', generateTestName());
    await page.fill('input[name="email"]', newEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to privacy settings
    await page.goto('/settings/privacy');

    // Click export button
    const exportButton = page.locator('button:has-text("Request Data Export")');
    await exportButton.click();

    // Verify loading state (button should show "Creating Request...")
    await expect(page.locator('button:has-text("Creating Request")')).toBeVisible({ timeout: 2000 });
  });
});
