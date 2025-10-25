/**
 * Page Object Model for Login Page
 * 
 * Provides selectors and methods for interacting with the login page
 * following Playwright best practices and accessibility patterns.
 */

import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  
  // Selectors
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly createAccountLink: Locator;
  readonly errorAlert: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly lockoutMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Input fields
    this.emailInput = page.locator('input#email');
    this.passwordInput = page.locator('input#password');
    
    // Buttons and links
    this.submitButton = page.locator('button[type="submit"]');
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot your password?' });
    this.createAccountLink = page.getByRole('link', { name: /create/i }).first();
    
    // Error messages
    this.errorAlert = page.locator('[role="alert"]').first();
    this.emailError = page.locator('#email-error');
    this.passwordError = page.locator('#password-error');
    this.lockoutMessage = page.locator('text=/locked until/i');
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Fill login form
   * @param email - User email
   * @param password - User password
   */
  async fillForm(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Submit login form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Login with credentials (fill + submit)
   * @param email - User email
   * @param password - User password
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillForm(email, password);
    await this.submit();
  }

  /**
   * Check if error alert is visible
   */
  async hasErrorAlert(): Promise<boolean> {
    return await this.errorAlert.isVisible();
  }

  /**
   * Get error alert text
   */
  async getErrorAlertText(): Promise<string> {
    return await this.errorAlert.textContent() || '';
  }

  /**
   * Check if email validation error is visible
   */
  async hasEmailError(): Promise<boolean> {
    return await this.emailError.isVisible();
  }

  /**
   * Get email validation error text
   */
  async getEmailErrorText(): Promise<string> {
    return await this.emailError.textContent() || '';
  }

  /**
   * Check if password validation error is visible
   */
  async hasPasswordError(): Promise<boolean> {
    return await this.passwordError.isVisible();
  }

  /**
   * Get password validation error text
   */
  async getPasswordErrorText(): Promise<string> {
    return await this.passwordError.textContent() || '';
  }

  /**
   * Check if account lockout message is visible
   */
  async hasLockoutMessage(): Promise<boolean> {
    return await this.lockoutMessage.isVisible();
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  /**
   * Click create account link
   */
  async clickCreateAccount(): Promise<void> {
    await this.createAccountLink.click();
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Check if submit button shows loading state
   */
  async isSubmitLoading(): Promise<boolean> {
    const text = await this.submitButton.textContent();
    return text?.includes('Signing in...') || false;
  }

  /**
   * Wait for navigation after successful login
   * @param expectedPath - Expected redirect path (e.g., '/dashboard')
   */
  async waitForSuccessfulLogin(expectedPath: string = '/dashboard'): Promise<void> {
    await this.page.waitForURL(`**${expectedPath}**`, { timeout: 10000 });
  }

  /**
   * Wait for MFA challenge redirect
   */
  async waitForMFARedirect(): Promise<void> {
    await this.page.waitForURL('**/mfa/challenge', { timeout: 10000 });
  }

  /**
   * Verify form accessibility (keyboard navigation)
   */
  async verifyKeyboardNavigation(): Promise<void> {
    // Focus email input
    await this.emailInput.focus();
    await expect(this.emailInput).toBeFocused();
    
    // Tab to password input
    await this.page.keyboard.press('Tab');
    await expect(this.passwordInput).toBeFocused();
    
    // Tab to forgot password link
    await this.page.keyboard.press('Tab');
    await expect(this.forgotPasswordLink).toBeFocused();
    
    // Tab to submit button
    await this.page.keyboard.press('Tab');
    await expect(this.submitButton).toBeFocused();
  }

  /**
   * Submit form using Enter key
   */
  async submitWithEnter(): Promise<void> {
    await this.passwordInput.press('Enter');
  }
}
