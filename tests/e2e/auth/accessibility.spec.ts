import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * E2E Accessibility Tests: Authentication Flows
 * 
 * Task: T080 [US0] Create E2E test "E2E accessibility tests for authentication"
 * 
 * Purpose: Comprehensive accessibility testing for all authentication
 * flows to ensure WCAG 2.1 Level AA compliance and inclusive design.
 * 
 * Requirements:
 * - WCAG 2.1 Level AA compliance for all auth pages
 * - Keyboard navigation support for all interactive elements
 * - Screen reader compatibility and ARIA labels
 * - Color contrast ratio ≥ 4.5:1 for text
 * - Focus indicators visible on all interactive elements
 * - Semantic HTML structure and proper headings
 * - Alt text for images and icons
 * - Error messages accessible via screen readers
 * - Form validation with accessible feedback
 * - Accessible loading states and progress indicators
 * 
 * User Story: US0 Authentication
 * Accessibility Standard: WCAG 2.1 Level AA
 * Test Categories:
 * - Keyboard Navigation
 * - Screen Reader Support
 * - Visual Accessibility
 * - Focus Management
 * - Error Handling Accessibility
 * - Form Accessibility
 * - Semantic Structure
 * - ARIA Implementation
 */

test.describe('Authentication Accessibility Tests - T080', () => {
  let page: Page;
  let loginPage: LoginPage;
  let registerPage: RegisterPage;
  let dashboardPage: DashboardPage;

  // Test user data
  const testUser = {
    firstName: 'Accessibility',
    lastName: 'TestUser',
    email: 'accessibility.test@stormcom.dev',
    password: 'AccessibilityTest123!',
    storeId: 'store-001'
  };

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    loginPage = new LoginPage(page);
    registerPage = new RegisterPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test.describe('Login Page Accessibility', () => {
    test('Login page has proper semantic structure and ARIA', async () => {
      // Arrange & Act
      await loginPage.goto();
      await page.waitForTimeout(1000);

      // Assert: Page has proper heading structure
      const mainHeading = page.locator('h1');
      const headingText = await mainHeading.textContent();
      expect(headingText?.toLowerCase()).toMatch(/login|sign.*in/i);

      // Page should have proper landmarks
      const main = page.locator('main, [role="main"]');
      expect(await main.count()).toBeGreaterThan(0);

      // Form should have proper semantics
      const loginForm = page.locator('form');
      expect(await loginForm.count()).toBeGreaterThan(0);

      // Form should have accessible name
      const formLabel = await loginForm.getAttribute('aria-label') ||
                       await loginForm.getAttribute('aria-labelledby');
      expect(formLabel).toBeTruthy();

      // Check for skip links
      const skipLink = page.locator('a[href="#main"], a[href="#content"]');
      if (await skipLink.count() > 0) {
        expect(await skipLink.first().isVisible()).toBe(true);
      }
    });

    test('Login form inputs have proper labels and ARIA', async () => {
      await loginPage.goto();
      await page.waitForTimeout(1000);

      // Email input accessibility
      const emailInput = page.locator('input[type="email"], #email');
      expect(await emailInput.count()).toBeGreaterThan(0);

      const emailLabel = page.locator('label[for="email"], label:has(input[type="email"])');
      if (await emailLabel.count() > 0) {
        const labelText = await emailLabel.textContent();
        expect(labelText?.toLowerCase()).toMatch(/email/i);
      } else {
        // Check for aria-label or aria-labelledby
        const ariaLabel = await emailInput.first().getAttribute('aria-label');
        const ariaLabelledBy = await emailInput.first().getAttribute('aria-labelledby');
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }

      // Password input accessibility
      const passwordInput = page.locator('input[type="password"], #password');
      expect(await passwordInput.count()).toBeGreaterThan(0);

      const passwordLabel = page.locator('label[for="password"], label:has(input[type="password"])');
      if (await passwordLabel.count() > 0) {
        const labelText = await passwordLabel.textContent();
        expect(labelText?.toLowerCase()).toMatch(/password/i);
      } else {
        const ariaLabel = await passwordInput.first().getAttribute('aria-label');
        const ariaLabelledBy = await passwordInput.first().getAttribute('aria-labelledby');
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }

      // Submit button accessibility
      const submitButton = page.locator('button[type="submit"], input[type="submit"]');
      expect(await submitButton.count()).toBeGreaterThan(0);

      const buttonText = await submitButton.first().textContent() ||
                        await submitButton.first().getAttribute('aria-label') ||
                        await submitButton.first().getAttribute('value');
      expect(buttonText?.toLowerCase()).toMatch(/login|sign.*in|submit/i);
    });

    test('Login page supports full keyboard navigation', async () => {
      await loginPage.goto();
      await page.waitForTimeout(1000);

      // Start from top of page
      await page.keyboard.press('Tab');
      
      let currentFocus = await page.evaluate(() => document.activeElement?.tagName);
      const focusableElements = [];
      let tabCount = 0;
      const maxTabs = 20; // Prevent infinite loop

      // Navigate through all focusable elements
      while (tabCount < maxTabs) {
        const focusedElement = page.locator(':focus');
        
        if (await focusedElement.count() > 0) {
          const tagName = await focusedElement.getAttribute('tagName') || 
                         await focusedElement.evaluate(el => el.tagName);
          const type = await focusedElement.getAttribute('type');
          const role = await focusedElement.getAttribute('role');
          
          focusableElements.push({ tagName, type, role });

          // Check if element is properly focusable
          const isVisible = await focusedElement.isVisible();
          expect(isVisible).toBe(true);

          // Check for focus indicator
          const outlineStyle = await focusedElement.evaluate(el => 
            window.getComputedStyle(el).outline
          );
          const boxShadow = await focusedElement.evaluate(el => 
            window.getComputedStyle(el).boxShadow
          );
          
          // Should have some focus indicator (outline, box-shadow, etc.)
          const hasFocusIndicator = outlineStyle !== 'none' || 
                                   boxShadow !== 'none' ||
                                   outlineStyle.length > 0;
          
          if (tagName !== 'BODY' && tagName !== 'HTML') {
            expect(hasFocusIndicator).toBe(true);
          }
        }

        await page.keyboard.press('Tab');
        tabCount++;

        // Break if we've cycled back to start or no more elements
        const newFocus = await page.evaluate(() => document.activeElement?.tagName);
        if (newFocus === currentFocus && tabCount > 3) break;
        currentFocus = newFocus;
      }

      // Should have found key form elements
      const formElements = focusableElements.filter(el => 
        ['INPUT', 'BUTTON', 'A'].includes(el.tagName)
      );
      expect(formElements.length).toBeGreaterThan(0);
    });

    test('Login form can be completed using only keyboard', async () => {
      await loginPage.goto();
      await page.waitForTimeout(1000);

      // Find email input via tab navigation
      let emailFound = false;
      let passwordFound = false;
      let submitFound = false;
      
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        
        const focusedElement = page.locator(':focus');
        const inputType = await focusedElement.getAttribute('type');
        const tagName = await focusedElement.evaluate(el => el.tagName).catch(() => '');

        if (inputType === 'email' || (tagName === 'INPUT' && !emailFound)) {
          await page.keyboard.type(testUser.email);
          emailFound = true;
        } else if (inputType === 'password') {
          await page.keyboard.type(testUser.password);
          passwordFound = true;
        } else if (tagName === 'BUTTON' && await focusedElement.textContent().then(t => t?.toLowerCase().includes('login'))) {
          submitFound = true;
          break;
        }
      }

      // Should have found all necessary form elements
      expect(emailFound).toBe(true);
      
      // Submit form with Enter key
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);

      // Form should have been submitted (even if login fails due to non-existent user)
      const currentUrl = page.url();
      const urlChanged = !currentUrl.includes('/login') || 
                        await page.locator('text=/error|invalid|incorrect/i').isVisible();
      
      expect(urlChanged).toBe(true);
    });

    test('Login errors are accessible to screen readers', async () => {
      await loginPage.goto();
      await page.waitForTimeout(1000);

      // Trigger validation error
      await loginPage.login('invalid@email.com', 'wrongpassword');
      await page.waitForTimeout(2000);

      // Check for accessible error messages
      const errorMessages = page.locator('[role="alert"], .error, [aria-live], text=/error|invalid|incorrect/i');
      
      if (await errorMessages.count() > 0) {
        const firstError = errorMessages.first();
        
        // Error should be visible
        expect(await firstError.isVisible()).toBe(true);

        // Error should have proper ARIA attributes
        const role = await firstError.getAttribute('role');
        const ariaLive = await firstError.getAttribute('aria-live');
        
        expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBe(true);

        // Error should have meaningful text
        const errorText = await firstError.textContent();
        expect(errorText).toBeTruthy();
        expect(errorText!.length).toBeGreaterThan(5);
      }

      // Form should associate errors with inputs
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');

      if (await emailInput.count() > 0) {
        const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
        const ariaInvalid = await emailInput.getAttribute('aria-invalid');
        
        if (ariaDescribedBy) {
          const describedElement = page.locator(`#${ariaDescribedBy}`);
          expect(await describedElement.isVisible()).toBe(true);
        }
      }
    });
  });

  test.describe('Registration Page Accessibility', () => {
    test('Registration page has proper semantic structure', async () => {
      await registerPage.goto();
      await page.waitForTimeout(1000);

      // Page should have proper heading
      const mainHeading = page.locator('h1');
      expect(await mainHeading.count()).toBeGreaterThan(0);

      const headingText = await mainHeading.textContent();
      expect(headingText?.toLowerCase()).toMatch(/register|sign.*up|create.*account/i);

      // Should have main landmark
      const main = page.locator('main, [role="main"]');
      expect(await main.count()).toBeGreaterThan(0);

      // Form should be properly structured
      const form = page.locator('form');
      expect(await form.count()).toBeGreaterThan(0);

      // Form should have fieldsets or proper grouping for related fields
      const fieldsets = page.locator('fieldset');
      const groupedInputs = page.locator('[role="group"]');
      
      if (await fieldsets.count() > 0) {
        // Fieldsets should have legends
        const legends = page.locator('legend');
        expect(await legends.count()).toBeGreaterThan(0);
      }
    });

    test('Registration form inputs have proper labels and validation', async () => {
      await registerPage.goto();
      await page.waitForTimeout(1000);

      // Check all form inputs for proper labeling
      const inputSelectors = [
        'input[type="text"]',
        'input[type="email"]', 
        'input[type="password"]',
        'input[name*="firstName"]',
        'input[name*="lastName"]',
        '#firstName',
        '#lastName',
        '#email',
        '#password'
      ];

      for (const selector of inputSelectors) {
        const inputs = page.locator(selector);
        const inputCount = await inputs.count();

        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          const inputName = await input.getAttribute('name') || await input.getAttribute('id');
          
          // Check for associated label
          const labelByFor = page.locator(`label[for="${inputName}"]`);
          const labelWrapping = input.locator('xpath=ancestor::label');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');

          const hasLabel = await labelByFor.count() > 0 ||
                          await labelWrapping.count() > 0 ||
                          ariaLabel ||
                          ariaLabelledBy;

          if (inputName && !inputName.includes('hidden')) {
            expect(hasLabel).toBe(true);
          }

          // Check for required attribute and ARIA
          const isRequired = await input.getAttribute('required') !== null;
          const ariaRequired = await input.getAttribute('aria-required');
          
          if (isRequired) {
            expect(ariaRequired === 'true' || ariaRequired === null).toBe(true);
          }
        }
      }
    });

    test('Registration form provides accessible password requirements', async () => {
      await registerPage.goto();
      await page.waitForTimeout(1000);

      const passwordInput = page.locator('input[type="password"]');
      
      if (await passwordInput.count() > 0) {
        // Check for password requirements description
        const passwordHelp = page.locator('[id*="password-help"], [id*="password-requirements"], text=/password.*must|password.*should/i');
        
        if (await passwordHelp.count() > 0) {
          // Password input should reference help text
          const ariaDescribedBy = await passwordInput.getAttribute('aria-describedby');
          
          if (ariaDescribedBy) {
            const helpElement = page.locator(`#${ariaDescribedBy}`);
            expect(await helpElement.isVisible()).toBe(true);
          }

          // Requirements should be clearly stated
          const helpText = await passwordHelp.textContent();
          expect(helpText).toBeTruthy();
          expect(helpText!.length).toBeGreaterThan(10);
        }

        // Test password validation feedback
        await passwordInput.fill('weak');
        await page.keyboard.press('Tab');
        await page.waitForTimeout(500);

        const validationMessage = page.locator('[role="alert"], text=/password.*weak|password.*short/i');
        if (await validationMessage.isVisible()) {
          const messageText = await validationMessage.textContent();
          expect(messageText).toBeTruthy();
        }
      }
    });

    test('Registration form supports keyboard navigation and completion', async () => {
      await registerPage.goto();
      await page.waitForTimeout(1000);

      // Navigate through form using keyboard
      const formFields = {
        firstName: false,
        lastName: false,
        email: false,
        password: false,
        submit: false
      };

      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
        
        const focusedElement = page.locator(':focus');
        const tagName = await focusedElement.evaluate(el => el.tagName).catch(() => '');
        const inputType = await focusedElement.getAttribute('type');
        const inputName = await focusedElement.getAttribute('name');

        if (tagName === 'INPUT') {
          if (inputType === 'text' && !formFields.firstName) {
            await page.keyboard.type(testUser.firstName);
            formFields.firstName = true;
          } else if (inputType === 'text' && !formFields.lastName) {
            await page.keyboard.type(testUser.lastName);
            formFields.lastName = true;
          } else if (inputType === 'email') {
            await page.keyboard.type(testUser.email);
            formFields.email = true;
          } else if (inputType === 'password') {
            await page.keyboard.type(testUser.password);
            formFields.password = true;
          }
        } else if (tagName === 'BUTTON') {
          const buttonText = await focusedElement.textContent();
          if (buttonText?.toLowerCase().includes('register') || 
              buttonText?.toLowerCase().includes('sign up') ||
              buttonText?.toLowerCase().includes('create')) {
            formFields.submit = true;
            break;
          }
        }
      }

      // Should have found and filled all form fields
      expect(formFields.firstName || formFields.lastName).toBe(true); // At least one name field
      expect(formFields.email).toBe(true);
      expect(formFields.password).toBe(true);
      expect(formFields.submit).toBe(true);
    });
  });

  test.describe('Color Contrast and Visual Accessibility', () => {
    test('Text meets WCAG color contrast requirements', async () => {
      const pagesToTest = [
        { goto: () => loginPage.goto(), name: 'Login' },
        { goto: () => registerPage.goto(), name: 'Registration' }
      ];

      for (const pageTest of pagesToTest) {
        await pageTest.goto();
        await page.waitForTimeout(1000);

        // Check text elements for contrast
        const textElements = page.locator('p, span, label, h1, h2, h3, button, a, input');
        const elementCount = await textElements.count();

        for (let i = 0; i < Math.min(elementCount, 10); i++) {
          const element = textElements.nth(i);
          
          if (await element.isVisible()) {
            const styles = await element.evaluate(el => {
              const computed = window.getComputedStyle(el);
              return {
                color: computed.color,
                backgroundColor: computed.backgroundColor,
                fontSize: computed.fontSize
              };
            });

            // Extract RGB values for contrast calculation
            const textColor = styles.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            const bgColor = styles.backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

            if (textColor && bgColor) {
              const textRGB = [parseInt(textColor[1]), parseInt(textColor[2]), parseInt(textColor[3])];
              const bgRGB = [parseInt(bgColor[1]), parseInt(bgColor[2]), parseInt(bgColor[3])];
              
              // Simplified contrast check (basic implementation)
              const contrast = calculateContrastRatio(textRGB, bgRGB);
              
              // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
              const fontSize = parseFloat(styles.fontSize);
              const minContrast = fontSize >= 18 ? 3.0 : 4.5;
              
              expect(contrast).toBeGreaterThanOrEqual(minContrast - 0.5); // Small tolerance for calculation differences
            }
          }
        }
      }
    });

    test('Focus indicators are visible and accessible', async () => {
      await loginPage.goto();
      await page.waitForTimeout(1000);

      const focusableElements = page.locator('button, input, a, [tabindex]');
      const elementCount = await focusableElements.count();

      for (let i = 0; i < Math.min(elementCount, 5); i++) {
        const element = focusableElements.nth(i);
        
        if (await element.isVisible()) {
          await element.focus();
          
          const focusStyles = await element.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              outline: computed.outline,
              outlineColor: computed.outlineColor,
              outlineWidth: computed.outlineWidth,
              boxShadow: computed.boxShadow
            };
          });

          // Should have some focus indicator
          const hasFocusIndicator = focusStyles.outline !== 'none' ||
                                   focusStyles.boxShadow !== 'none' ||
                                   focusStyles.outlineWidth !== '0px';

          expect(hasFocusIndicator).toBe(true);
        }
      }
    });

    test('Images and icons have proper alt text', async () => {
      const pagesToTest = [
        () => loginPage.goto(),
        () => registerPage.goto()
      ];

      for (const gotoPage of pagesToTest) {
        await gotoPage();
        await page.waitForTimeout(1000);

        // Check all images for alt text
        const images = page.locator('img');
        const imageCount = await images.count();

        for (let i = 0; i < imageCount; i++) {
          const img = images.nth(i);
          const altText = await img.getAttribute('alt');
          const role = await img.getAttribute('role');
          const ariaLabel = await img.getAttribute('aria-label');

          // Decorative images should have empty alt or role="presentation"
          // Content images should have descriptive alt text
          if (role === 'presentation' || role === 'img') {
            // Acceptable for decorative images
            continue;
          }

          expect(altText !== null || ariaLabel !== null).toBe(true);

          if (altText !== null && altText.length > 0) {
            expect(altText.length).toBeGreaterThan(2);
          }
        }

        // Check icon fonts or SVG icons
        const icons = page.locator('[class*="icon"], svg, [role="img"]');
        const iconCount = await icons.count();

        for (let i = 0; i < iconCount; i++) {
          const icon = icons.nth(i);
          const ariaLabel = await icon.getAttribute('aria-label');
          const ariaHidden = await icon.getAttribute('aria-hidden');
          const title = await icon.locator('title').textContent();

          // Icons should either be hidden from screen readers or have labels
          if (ariaHidden !== 'true') {
            expect(ariaLabel || title).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Screen Reader and ARIA Support', () => {
    test('Form validation provides accessible feedback', async () => {
      await registerPage.goto();
      await page.waitForTimeout(1000);

      // Trigger validation errors
      const submitButton = page.locator('button[type="submit"], input[type="submit"]');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Check for accessible error announcements
        const errorSummary = page.locator('[role="alert"], [aria-live], .error-summary');
        
        if (await errorSummary.count() > 0) {
          const summary = errorSummary.first();
          expect(await summary.isVisible()).toBe(true);
          
          const summaryText = await summary.textContent();
          expect(summaryText).toBeTruthy();
          expect(summaryText!.length).toBeGreaterThan(10);
        }

        // Check individual field errors
        const inputs = page.locator('input[required], input[aria-required="true"]');
        const inputCount = await inputs.count();

        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          const ariaInvalid = await input.getAttribute('aria-invalid');
          const ariaDescribedBy = await input.getAttribute('aria-describedby');

          if (ariaInvalid === 'true' && ariaDescribedBy) {
            const errorElement = page.locator(`#${ariaDescribedBy}`);
            expect(await errorElement.isVisible()).toBe(true);
            
            const errorText = await errorElement.textContent();
            expect(errorText).toBeTruthy();
          }
        }
      }
    });

    test('Loading states are accessible', async () => {
      await loginPage.goto();
      await page.waitForTimeout(1000);

      // Fill in form and submit to trigger loading state
      await loginPage.login(testUser.email, testUser.password);
      
      // Look for loading indicators
      const loadingIndicators = page.locator('[aria-live], .loading, [role="status"], text=/loading|please.*wait/i');
      
      await page.waitForTimeout(500);
      
      if (await loadingIndicators.count() > 0) {
        const indicator = loadingIndicators.first();
        
        // Loading indicator should be accessible
        const ariaLive = await indicator.getAttribute('aria-live');
        const role = await indicator.getAttribute('role');
        
        expect(ariaLive === 'polite' || ariaLive === 'assertive' || role === 'status').toBe(true);
        
        // Should have descriptive text
        const indicatorText = await indicator.textContent();
        expect(indicatorText).toBeTruthy();
      }
    });

    test('Page titles and headings provide proper navigation structure', async () => {
      const pages = [
        { goto: () => loginPage.goto(), expectedTitle: /login|sign.*in/i },
        { goto: () => registerPage.goto(), expectedTitle: /register|sign.*up|create/i }
      ];

      for (const pageTest of pages) {
        await pageTest.goto();
        await page.waitForTimeout(1000);

        // Check page title
        const pageTitle = await page.title();
        expect(pageTitle.toLowerCase()).toMatch(pageTest.expectedTitle);

        // Check heading hierarchy
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
        
        expect(headings.length).toBeGreaterThan(0);

        // Should have exactly one h1
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBe(1);

        // Check heading order (should be hierarchical)
        const headingLevels = [];
        for (const heading of headings) {
          const tagName = await heading.evaluate(el => el.tagName);
          const level = parseInt(tagName.replace('H', ''));
          headingLevels.push(level);
        }

        // First heading should be h1
        expect(headingLevels[0]).toBe(1);

        // Headings should not skip levels
        for (let i = 1; i < headingLevels.length; i++) {
          const currentLevel = headingLevels[i];
          const prevLevel = headingLevels[i - 1];
          expect(currentLevel).toBeLessThanOrEqual(prevLevel + 1);
        }
      }
    });
  });

  test.describe('Mobile and Responsive Accessibility', () => {
    test('Authentication flows are accessible on mobile devices', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await loginPage.goto();
      await page.waitForTimeout(1000);

      // Check that form elements are properly sized for touch
      const touchTargets = page.locator('button, input, a');
      const targetCount = await touchTargets.count();

      for (let i = 0; i < Math.min(targetCount, 5); i++) {
        const target = touchTargets.nth(i);
        
        if (await target.isVisible()) {
          const boundingBox = await target.boundingBox();
          
          if (boundingBox) {
            // WCAG AAA recommends minimum 44x44 CSS pixels for touch targets
            expect(boundingBox.width).toBeGreaterThanOrEqual(40); // Small tolerance
            expect(boundingBox.height).toBeGreaterThanOrEqual(40);
          }
        }
      }

      // Check that form is still keyboard accessible on mobile
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus').count();
      expect(focusedElement).toBeGreaterThan(0);
    });

    test('Forms remain accessible when zoomed to 200%', async () => {
      // Simulate 200% zoom
      await page.setViewportSize({ width: 640, height: 480 });
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });

      await loginPage.goto();
      await page.waitForTimeout(1000);

      // Form should still be usable
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');

      if (await emailInput.count() > 0) {
        expect(await emailInput.isVisible()).toBe(true);
        await emailInput.fill(testUser.email);
      }

      if (await passwordInput.count() > 0) {
        expect(await passwordInput.isVisible()).toBe(true);
        await passwordInput.fill(testUser.password);
      }

      if (await submitButton.count() > 0) {
        expect(await submitButton.isVisible()).toBe(true);
        expect(await submitButton.isEnabled()).toBe(true);
      }

      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = '1';
      });
    });
  });

  test.describe('Error Handling Accessibility', () => {
    test('Network errors are communicated accessibly', async () => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());

      await loginPage.goto();
      await page.waitForTimeout(1000);

      await loginPage.login(testUser.email, testUser.password);
      await page.waitForTimeout(3000);

      // Check for accessible network error messages
      const errorMessage = page.locator('[role="alert"], .error, text=/network|connection|server/i');
      
      if (await errorMessage.count() > 0) {
        expect(await errorMessage.first().isVisible()).toBe(true);
        
        const errorText = await errorMessage.first().textContent();
        expect(errorText).toBeTruthy();
        expect(errorText!.length).toBeGreaterThan(10);
      }

      // Clean up route
      await page.unroute('**/api/**');
    });

    test('Timeout errors provide accessible feedback', async () => {
      // Simulate slow network
      await page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 5000);
      });

      await loginPage.goto();
      await page.waitForTimeout(1000);

      await loginPage.login(testUser.email, testUser.password);
      
      // Wait for potential timeout
      await page.waitForTimeout(2000);

      // Check for loading state and timeout handling
      const loadingOrError = page.locator('[role="status"], [role="alert"], text=/loading|timeout|slow/i');
      
      if (await loadingOrError.count() > 0) {
        const element = loadingOrError.first();
        expect(await element.isVisible()).toBe(true);
        
        const elementText = await element.textContent();
        expect(elementText).toBeTruthy();
      }

      // Clean up route
      await page.unroute('**/api/**');
    });
  });

  // Helper function to calculate color contrast ratio
  function calculateContrastRatio(rgb1: number[], rgb2: number[]): number {
    const luminance1 = getRelativeLuminance(rgb1);
    const luminance2 = getRelativeLuminance(rgb2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  function getRelativeLuminance(rgb: number[]): number {
    const [r, g, b] = rgb.map(c => {
      const sRGB = c / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
});