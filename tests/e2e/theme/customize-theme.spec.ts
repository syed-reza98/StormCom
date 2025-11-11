/**
 * Theme Customization E2E Test
 * 
 * Tests theme customization workflow including:
 * - Accessing theme editor
 * - Changing colors, fonts, and layout
 * - Saving theme changes
 * - Verifying changes on storefront
 * - Resetting theme to defaults
 * 
 * @module tests/e2e/theme/customize-theme.spec
 */

import { test, expect } from '@playwright/test';

test.describe('Theme Customization', () => {
  test.beforeEach(async ({ page }) => {
    // Login as store owner
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should access theme editor from settings', async ({ page }) => {
    // Navigate to theme settings
    await page.goto('/settings/theme');

    // Verify page loaded
    await expect(page.locator('h1')).toContainText('Theme Customization');
    await expect(page.locator('text=Customize your store')).toBeVisible();

    // Verify tabs are present
    await expect(page.locator('button[role="tab"]:has-text("Colors")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Typography")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Layout")')).toBeVisible();

    // Verify preview panel
    await expect(page.locator('text=Live Preview')).toBeVisible();
  });

  test('should change primary color', async ({ page }) => {
    await page.goto('/settings/theme');

    // Click Colors tab
    await page.click('button[role="tab"]:has-text("Colors")');

    // Change primary color
    const primaryColorInput = page.locator('input[type="color"]#primaryColor');
    await primaryColorInput.fill('#FF0000'); // Red

    // Verify preview updated
    const previewHeading = page.locator('text=Preview Heading');
    await expect(previewHeading).toHaveCSS('color', 'rgb(255, 0, 0)');

    // Verify save button is enabled
    await expect(page.locator('button:has-text("Save Changes")')).toBeEnabled();
  });

  test('should apply color palette preset', async ({ page }) => {
    await page.goto('/settings/theme');

    // Click Colors tab
    await page.click('button[role="tab"]:has-text("Colors")');

    // Apply Forest Green palette
    await page.click('button:has-text("Forest Green")');

    // Verify colors changed
    const primaryColorInput = page.locator('input[type="text"]').first();
    await expect(primaryColorInput).toHaveValue('#10B981');

    // Verify save button is enabled
    await expect(page.locator('button:has-text("Save Changes")')).toBeEnabled();
  });

  test('should change typography settings', async ({ page }) => {
    await page.goto('/settings/theme');

    // Click Typography tab
    await page.click('button[role="tab"]:has-text("Typography")');

    // Change body font
    await page.click('button[id="fontFamily"]');
    await page.click('text=Roboto');

    // Change heading font
    await page.click('button[id="headingFont"]');
    await page.click('text=Montserrat');

    // Change font size
    await page.click('button[id="fontSize"]');
    await page.click('text=18px (Large)');

    // Verify save button is enabled
    await expect(page.locator('button:has-text("Save Changes")')).toBeEnabled();
  });

  test('should change layout settings', async ({ page }) => {
    await page.goto('/settings/theme');

    // Click Layout tab
    await page.click('button[role="tab"]:has-text("Layout")');

    // Change maximum width
    await page.click('button[id="layoutWidth"]');
    await page.click('text=1536px (Large)');

    // Change border radius
    await page.click('button[id="borderRadius"]');
    await page.click('text=1rem (Extra Large)');

    // Verify save button is enabled
    await expect(page.locator('button:has-text("Save Changes")')).toBeEnabled();
  });

  test('should save theme changes', async ({ page }) => {
    await page.goto('/settings/theme');

    // Change primary color
    await page.click('button[role="tab"]:has-text("Colors")');
    const primaryColorInput = page.locator('input[type="color"]#primaryColor');
    await primaryColorInput.fill('#9333EA'); // Purple

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Wait for success toast
    await expect(page.locator('text=Theme saved')).toBeVisible();

    // Reload page
    await page.reload();

    // Verify changes persisted
    await expect(primaryColorInput).toHaveValue('#9333EA');

    // Verify save button is disabled (no unsaved changes)
    await expect(page.locator('button:has-text("Save Changes")')).toBeDisabled();
  });

  test('should reset theme to defaults', async ({ page }) => {
    await page.goto('/settings/theme');

    // Change primary color
    await page.click('button[role="tab"]:has-text("Colors")');
    const primaryColorInput = page.locator('input[type="color"]#primaryColor');
    await primaryColorInput.fill('#FF0000');

    // Save changes
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Theme saved')).toBeVisible();

    // Reset theme
    await page.click('button:has-text("Reset")');

    // Wait for success toast
    await expect(page.locator('text=Theme reset')).toBeVisible();

    // Verify primary color reset to default (#3B82F6)
    await expect(primaryColorInput).toHaveValue('#3B82F6');
  });

  test('should validate color format', async ({ page }) => {
    await page.goto('/settings/theme');

    // Change primary color to invalid format
    await page.click('button[role="tab"]:has-text("Colors")');
    const primaryColorTextInput = page.locator('input[type="text"]').first();
    await primaryColorTextInput.fill('invalid-color');

    // Try to save
    await page.click('button:has-text("Save Changes")');

    // Verify error toast appears
    await expect(page.locator('text=Invalid').or(page.locator('text=Failed'))).toBeVisible();
  });

  test('should show live preview of changes', async ({ page }) => {
    await page.goto('/settings/theme');

    // Get initial preview button color
    const primaryButton = page.locator('button:has-text("Primary Button")');
    const initialColor = await primaryButton.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );

    // Change primary color
    await page.click('button[role="tab"]:has-text("Colors")');
    await page.locator('input[type="color"]#primaryColor').fill('#22C55E'); // Green

    // Verify preview button color changed (without saving)
    const newColor = await primaryButton.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(newColor).not.toBe(initialColor);
    expect(newColor).toContain('34, 197, 94'); // RGB of #22C55E
  });

  test('should change theme mode', async ({ page }) => {
    await page.goto('/settings/theme');

    // Click Typography tab (theme mode is in typography tab)
    await page.click('button[role="tab"]:has-text("Typography")');

    // Change to dark mode
    await page.click('button[id="mode"]');
    await page.click('text=Dark');

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Wait for success toast
    await expect(page.locator('text=Theme saved')).toBeVisible();

    // Reload and verify
    await page.reload();
    await page.click('button[role="tab"]:has-text("Typography")');
    const modeSelect = page.locator('button[id="mode"]');
    await expect(modeSelect).toContainText('Dark');
  });
});
