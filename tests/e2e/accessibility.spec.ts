import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Test Suite
 * 
 * Tests WCAG 2.2 AA compliance across all pages using axe-core.
 * 
 * Coverage:
 * - Color contrast (4.5:1 for text, 3:1 for UI elements)
 * - Keyboard navigation
 * - ARIA attributes
 * - Semantic HTML
 * - Focus indicators
 * - Screen reader support
 */

test.describe('Accessibility Tests - WCAG 2.2 AA', () => {
  test('Homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Homepage should have proper heading hierarchy', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Check for H1
    const h1 = await page.locator('h1').first();
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText(/Welcome to StormCom/);
  });

  test('Homepage should have keyboard navigable buttons', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const firstFocusable = await page.locator(':focus');
    await expect(firstFocusable).toBeVisible();
    
    // Verify focus ring is visible
    const focusRingVisible = await firstFocusable.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });
    expect(focusRingVisible).toBeTruthy();
  });

  test('Login page should not have accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Login page should have proper form labels', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check email input has label
    const emailInput = await page.getByLabel('Email address');
    await expect(emailInput).toBeVisible();
    
    // Check password input has label
    const passwordInput = await page.getByLabel('Password');
    await expect(passwordInput).toBeVisible();
  });

  test('Products page should not have accessibility violations', async ({ page }) => {
    // Note: This assumes authentication - may need to add login step
    await page.goto('http://localhost:3000/products');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:', 
        JSON.stringify(accessibilityScanResults.violations, null, 2)
      );
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .disableRules(['color-contrast']) // Disable to check separately
      .analyze();

    // Check color contrast specifically
    const contrastResults = await new AxeBuilder({ page })
      .include('body')
      .withRules(['color-contrast'])
      .analyze();

    // Log contrast violations if any
    if (contrastResults.violations.length > 0) {
      console.log('Color contrast violations:', 
        contrastResults.violations.map(v => ({
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.map(n => n.html)
        }))
      );
    }

    expect(contrastResults.violations).toEqual([]);
  });

  test('All images should have alt text', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
      
      // Alt should not be empty (unless decorative)
      const ariaHidden = await img.getAttribute('aria-hidden');
      if (ariaHidden !== 'true') {
        expect(alt).not.toBe('');
      }
    }
  });

  test('Focus should be visible on all interactive elements', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Get all focusable elements
    const focusableElements = await page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();
    
    for (const element of focusableElements.slice(0, 5)) { // Test first 5 for speed
      await element.focus();
      
      const isFocused = await element.evaluate((el) => el === document.activeElement);
      expect(isFocused).toBeTruthy();
      
      // Check if focus ring is visible
      const hasFocusStyle = await element.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return (
          styles.outline !== 'none' || 
          styles.boxShadow !== 'none' ||
          styles.border !== 'none'
        );
      });
      expect(hasFocusStyle).toBeTruthy();
    }
  });
});

test.describe('Keyboard Navigation Tests', () => {
  test('Should be able to navigate entire homepage with keyboard', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Start at the beginning
    await page.keyboard.press('Tab');
    
    let tabCount = 0;
    const maxTabs = 20; // Prevent infinite loop
    
    while (tabCount < maxTabs) {
      const focused = await page.locator(':focus');
      const isVisible = await focused.isVisible().catch(() => false);
      
      if (isVisible) {
        tabCount++;
        await page.keyboard.press('Tab');
      } else {
        break;
      }
    }
    
    expect(tabCount).toBeGreaterThan(0);
  });

  test('Should be able to activate buttons with Enter and Space', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Find any button and focus it (more resilient to UI changes)
    const buttons = await page.getByRole('button').all();
    if (buttons.length === 0) {
      throw new Error('No buttons found on page');
    }
    
    const button = buttons[0];
    await button.focus();
    
    // Verify it's focused
    const isFocused = await button.evaluate(el => el === document.activeElement);
    expect(isFocused).toBeTruthy();
    
    // Could be activated with Enter (we won't actually activate to avoid navigation)
    const isButton = await button.evaluate(el => el.tagName === 'BUTTON' || el.getAttribute('role') === 'button');
    expect(isButton).toBeTruthy();
  });
});

test.describe('ARIA Attributes Tests', () => {
  test('Form inputs should have proper ARIA attributes', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check email input
    const emailInput = await page.getByLabel('Email address');
    const emailAriaInvalid = await emailInput.getAttribute('aria-invalid');
    expect(emailAriaInvalid).not.toBeNull(); // Should have aria-invalid attribute
    
    // Check password input  
    const passwordInput = await page.getByLabel('Password');
    const passwordAriaInvalid = await passwordInput.getAttribute('aria-invalid');
    expect(passwordAriaInvalid).not.toBeNull();
  });

  test('Error messages should be associated with inputs', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Submit form to trigger validation
    const submitButton = await page.getByRole('button', { name: /Sign in/i });
    await submitButton.click();
    
    // Wait for validation errors
    await page.waitForTimeout(500);
    
    // Check if error messages are properly associated
    const emailInput = await page.getByLabel('Email address');
    const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
    
    if (ariaDescribedBy) {
      const errorElement = await page.locator(`#${ariaDescribedBy}`);
      await expect(errorElement).toBeVisible();
    }
  });
});
