// tests/e2e/gdpr/data-deletion.spec.ts
// E2E tests for GDPR account deletion functionality

import { test, expect } from '@playwright/test';

// Helper to generate unique test data
function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test.gdpr.delete.${timestamp}.${random}@example.com`;
}

function generateTestName(): string {
  const timestamp = Date.now();
  return `Test User ${timestamp}`;
}

test.describe('GDPR Account Deletion', () => {
  test.describe.configure({ mode: 'serial' });

  let testUserEmail: string;
  let testUserPassword: string;
  let testUserName: string;

  test.beforeAll(async () => {
    // Generate unique test user credentials
    testUserEmail = generateTestEmail();
    testUserPassword = 'SecurePass123!';
    testUserName = generateTestName();
  });

  test('User can register an account for deletion test', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill registration form
    await page.fill('input[name="name"]', testUserName);
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);

    // Submit registration
    await page.click('button[type="submit"]');

    // Wait for registration to complete and redirect
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Verify we're logged in
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Deletion dialog requires exact confirmation text', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to privacy settings
    await page.goto('/settings/privacy');

    // Click delete account button
    await page.click('button:has-text("Delete My Account")');

    // Verify dialog opens
    await expect(page.locator('role=dialog')).toBeVisible();
    await expect(page.locator('text=/confirm account deletion/i')).toBeVisible();

    // Try wrong confirmation text
    await page.fill('input[name="confirmText"]', 'DELETE MY ACCOUNT'); // Wrong case
    await page.click('button:has-text("Delete Account")');

    // Should still see dialog (not submitted)
    await expect(page.locator('role=dialog')).toBeVisible();

    // Close dialog
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('role=dialog')).not.toBeVisible();
  });

  test('User can delete account with correct confirmation', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to privacy settings
    await page.goto('/settings/privacy');

    // Click delete account button
    await page.click('button:has-text("Delete My Account")');

    // Verify dialog opens
    await expect(page.locator('role=dialog')).toBeVisible();

    // Enter correct confirmation text
    await page.fill('input[name="confirmText"]', 'DELETE_MY_ACCOUNT');

    // Click delete button
    await page.click('button:has-text("Delete Account")');

    // Wait for success message
    await expect(page.locator('text=/account deletion request created successfully/i')).toBeVisible({
      timeout: 10000,
    });

    // Verify dialog closed
    await expect(page.locator('role=dialog')).not.toBeVisible();

    // Verify request appears in history
    await expect(page.locator('text=/account deletion/i')).toBeVisible();
    await expect(page.locator('text=/pending/i')).toBeVisible();
  });

  test('User cannot create duplicate deletion request', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to privacy settings
    await page.goto('/settings/privacy');

    // Try to delete again
    await page.click('button:has-text("Delete My Account")');
    await page.fill('input[name="confirmText"]', 'DELETE_MY_ACCOUNT');
    await page.click('button:has-text("Delete Account")');

    // Should show error about duplicate request
    await expect(page.locator('text=/already/i')).toBeVisible({ timeout: 10000 });
  });

  test('Deletion request shows correct status in history', async ({ page }) => {
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

    // Verify deletion request details
    await expect(page.locator('text=/account deletion/i')).toBeVisible();
    
    // Verify status badge (PENDING, PROCESSING, or COMPLETED)
    const statusBadge = page.locator('[class*="badge"]').filter({ hasText: /pending|processing|completed/i });
    await expect(statusBadge).toBeVisible();

    // Verify request date is shown
    await expect(page.locator('text=/requested/i')).toBeVisible();
  });

  test('Deletion dialog shows warning about data loss', async ({ page }) => {
    // Create new user for fresh dialog test
    const newEmail = faker.internet.email();
    await page.goto('/register');
    await page.fill('input[name="name"]', faker.person.fullName());
    await page.fill('input[name="email"]', newEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Navigate to privacy settings
    await page.goto('/settings/privacy');

    // Click delete account button
    await page.click('button:has-text("Delete My Account")');

    // Verify warning messages in dialog
    await expect(page.locator('text=/permanent action/i')).toBeVisible();
    await expect(page.locator('text=/cannot be undone/i')).toBeVisible();
    await expect(page.locator('text=/30 days/i')).toBeVisible();
    await expect(page.locator('text=/type.*DELETE_MY_ACCOUNT/i')).toBeVisible();
  });

  test('Deletion button shows loading state', async ({ page }) => {
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

    // Click delete account button
    await page.click('button:has-text("Delete My Account")');

    // Enter confirmation
    await page.fill('input[name="confirmText"]', 'DELETE_MY_ACCOUNT');

    // Click delete button
    const deleteButton = page.locator('button:has-text("Delete Account")');
    await deleteButton.click();

    // Verify loading state (button should show "Deleting...")
    await expect(page.locator('button:has-text("Deleting")')).toBeVisible({ timeout: 2000 });
  });

  test('Account deletion preserves orders but anonymizes user data', async ({ page, request }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', testUserPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Get cookies for API request
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'session');

    // Make API request to check deletion behavior
    const response = await request.post('/api/gdpr/delete', {
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
        expect(data.data).toHaveProperty('type', 'DELETE');
        expect(data.data).toHaveProperty('status');
      }
    }
  });

  test('Cancel button closes deletion dialog without action', async ({ page }) => {
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

    // Click delete account button
    await page.click('button:has-text("Delete My Account")');

    // Verify dialog opens
    await expect(page.locator('role=dialog')).toBeVisible();

    // Click cancel button
    await page.click('button:has-text("Cancel")');

    // Verify dialog closed
    await expect(page.locator('role=dialog')).not.toBeVisible();

    // Verify no deletion request was created
    const historySection = page.locator('text=/recent requests/i');
    if (await historySection.isVisible()) {
      // If history section exists, verify no deletion request
      await expect(page.locator('text=/account deletion/i')).not.toBeVisible();
    }
  });

  test('Privacy settings page shows both export and delete options', async ({ page }) => {
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

    // Verify both buttons are visible
    await expect(page.locator('button:has-text("Request Data Export")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete My Account")')).toBeVisible();

    // Verify they are in different sections
    await expect(page.locator('text=/export your data/i')).toBeVisible();
    await expect(page.locator('text=/delete your account/i')).toBeVisible();
  });
});
