import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Password Reset flow
 * Handles two pages:
 * 1. Forgot Password page (/forgot-password) - Request reset
 * 2. Reset Password page (/reset-password?token=...) - Set new password
 */
export class PasswordResetPage {
  readonly page: Page;

  // ============= Forgot Password Page Locators =============

  // Forgot password header
  readonly forgotPasswordHeading: Locator;
  readonly forgotPasswordDescription: Locator;

  // Forgot password form
  readonly emailInput: Locator;
  readonly emailError: Locator;
  readonly sendResetLinkButton: Locator;

  // Forgot password success state
  readonly emailIcon: Locator;
  readonly checkEmailHeading: Locator;
  readonly checkEmailMessage: Locator;
  readonly backToLoginFromSuccessButton: Locator;
  readonly tryAgainButton: Locator;

  // ============= Reset Password Page Locators =============

  // Reset password header
  readonly resetPasswordHeading: Locator;
  readonly resetPasswordDescription: Locator;

  // Reset password form
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly passwordError: Locator;
  readonly confirmPasswordError: Locator;
  readonly passwordHelp: Locator;
  readonly resetPasswordButton: Locator;

  // Reset password success state
  readonly successIcon: Locator;
  readonly successHeading: Locator;
  readonly successMessage: Locator;
  readonly goToLoginButton: Locator;

  // Reset password error state (invalid token)
  readonly errorIcon: Locator;
  readonly invalidLinkHeading: Locator;
  readonly requestNewLinkButton: Locator;

  // ============= Common Locators =============

  readonly serverErrorAlert: Locator;
  readonly backToLoginLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Forgot password page
    this.forgotPasswordHeading = page.locator('h1:has-text("Forgot password?")');
    this.forgotPasswordDescription = page.locator('text=Enter your email address and we\'ll send you a link');
    
    this.emailInput = page.locator('input#email');
    this.emailError = page.locator('#email-error');
    this.sendResetLinkButton = page.locator('button[type="submit"]:has-text("Send reset link")');

    this.emailIcon = page.locator('svg').filter({ has: page.locator('path[d*="M21.75 6.75v10.5"]') });
    this.checkEmailHeading = page.locator('h1:has-text("Check your email")');
    this.checkEmailMessage = page.locator('text=If an account exists with');
    this.backToLoginFromSuccessButton = page.locator('a:has-text("Back to Login")').first();
    this.tryAgainButton = page.locator('button:has-text("Try again")');

    // Reset password page
    this.resetPasswordHeading = page.locator('h1:has-text("Reset your password")');
    this.resetPasswordDescription = page.locator('text=Enter your new password below');

    this.passwordInput = page.locator('input#password');
    this.confirmPasswordInput = page.locator('input#confirmPassword');
    this.passwordError = page.locator('#password-error');
    this.confirmPasswordError = page.locator('#confirmPassword-error');
    this.passwordHelp = page.locator('#password-help');
    this.resetPasswordButton = page.locator('button[type="submit"]:has-text("Reset password")');

    this.successIcon = page.locator('svg').filter({ has: page.locator('path[d*="M5 13l4 4L19 7"]') });
    this.successHeading = page.locator('h1:has-text("Password Reset Successful!")');
    this.successMessage = page.locator('text=Your password has been successfully reset');
    this.goToLoginButton = page.locator('button:has-text("Go to Login")');

    this.errorIcon = page.locator('svg').filter({ has: page.locator('path[d*="M6 18L18 6"]') });
    this.invalidLinkHeading = page.locator('h1:has-text("Invalid Reset Link")');
    this.requestNewLinkButton = page.locator('a:has-text("Request New Reset Link")');

    // Common
    this.serverErrorAlert = page.locator('[role="alert"]');
    this.backToLoginLink = page.locator('a:has-text("Back to Login")').last();
  }

  // ============= Forgot Password Page Methods =============

  /**
   * Navigate to the forgot password page
   */
  async gotoForgotPassword(): Promise<void> {
    await this.page.goto('/forgot-password');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Enter email address for password reset
   * @param email - User's email address
   */
  async enterEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Submit the forgot password form
   */
  async submitForgotPassword(): Promise<void> {
    await this.sendResetLinkButton.click();
  }

  /**
   * Complete forgot password flow (enter email + submit)
   * @param email - User's email address
   */
  async requestPasswordReset(email: string): Promise<void> {
    await this.enterEmail(email);
    await this.submitForgotPassword();
  }

  /**
   * Submit form using Enter key (accessibility test)
   */
  async submitForgotPasswordWithEnter(): Promise<void> {
    await this.emailInput.press('Enter');
  }

  /**
   * Wait for "Check your email" success message
   * @param timeout - Optional timeout in milliseconds (default: 10000)
   */
  async waitForEmailSent(timeout = 10000): Promise<void> {
    await this.checkEmailHeading.waitFor({ state: 'visible', timeout });
    await this.checkEmailMessage.waitFor({ state: 'visible', timeout });
  }

  /**
   * Check if forgot password form is in loading state
   * @returns True if button shows loading state
   */
  async isSendingResetLink(): Promise<boolean> {
    const buttonText = await this.sendResetLinkButton.textContent();
    return buttonText?.includes('Sending reset link...') || false;
  }

  /**
   * Click "Try again" button to return to forgot password form
   */
  async tryAgain(): Promise<void> {
    await this.tryAgainButton.click();
    await this.emailInput.waitFor({ state: 'visible' });
  }

  // ============= Reset Password Page Methods =============

  /**
   * Navigate to the reset password page with token
   * @param token - Reset token from email link
   */
  async gotoResetPassword(token: string): Promise<void> {
    await this.page.goto(`/reset-password?token=${token}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill the reset password form
   * @param password - New password
   * @param confirmPassword - Password confirmation
   */
  async fillResetPasswordForm(password: string, confirmPassword: string): Promise<void> {
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  /**
   * Submit the reset password form
   */
  async submitResetPassword(): Promise<void> {
    await this.resetPasswordButton.click();
  }

  /**
   * Complete reset password flow (fill form + submit)
   * @param password - New password
   * @param confirmPassword - Password confirmation
   */
  async resetPassword(password: string, confirmPassword: string): Promise<void> {
    await this.fillResetPasswordForm(password, confirmPassword);
    await this.submitResetPassword();
  }

  /**
   * Submit form using Enter key (accessibility test)
   */
  async submitResetPasswordWithEnter(): Promise<void> {
    await this.confirmPasswordInput.press('Enter');
  }

  /**
   * Wait for successful password reset
   * @param timeout - Optional timeout in milliseconds (default: 10000)
   */
  async waitForResetSuccess(timeout = 10000): Promise<void> {
    await this.successHeading.waitFor({ state: 'visible', timeout });
    await this.successMessage.waitFor({ state: 'visible', timeout });
  }

  /**
   * Check if reset password form is in loading state
   * @returns True if button shows loading state
   */
  async isResettingPassword(): Promise<boolean> {
    const buttonText = await this.resetPasswordButton.textContent();
    return buttonText?.includes('Resetting password...') || false;
  }

  /**
   * Check if reset password submit button is disabled
   * @returns True if button is disabled
   */
  async isResetPasswordDisabled(): Promise<boolean> {
    return await this.resetPasswordButton.isDisabled();
  }

  /**
   * Check if page shows invalid token error
   * @returns True if invalid link heading is visible
   */
  async hasInvalidTokenError(): Promise<boolean> {
    return await this.invalidLinkHeading.isVisible();
  }

  /**
   * Click "Request New Reset Link" button (invalid token state)
   */
  async requestNewResetLink(): Promise<void> {
    await this.requestNewLinkButton.click();
    await this.page.waitForURL('/forgot-password');
  }

  // ============= Convenience Alias Methods =============

  /**
   * Alias for gotoResetPassword() - navigate to reset password page with token
   * @param token - Reset token from email link
   */
  async gotoWithToken(token: string): Promise<void> {
    await this.gotoResetPassword(token);
  }

  /**
   * Alias for page load wait - waits for the reset password page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.resetPasswordHeading.waitFor({ state: 'visible' });
  }

  /**
   * Alias for fillResetPasswordForm() - fill new password fields
   * @param password - New password
   * @param confirmPassword - Password confirmation (defaults to password if not provided)
   */
  async fillNewPassword(password: string, confirmPassword?: string): Promise<void> {
    await this.fillResetPasswordForm(password, confirmPassword || password);
  }

  /**
   * Alias for submitResetPassword() - submit the reset password form
   */
  async submit(): Promise<void> {
    await this.submitResetPassword();
  }

  /**
   * Alias for waitForResetSuccess() - wait for successful password reset
   */
  async waitForSuccess(): Promise<void> {
    await this.waitForResetSuccess();
  }

  // ============= Navigation Methods =============

  /**
   * Click "Go to Login" button after successful reset
   */
  async goToLogin(): Promise<void> {
    await this.goToLoginButton.click();
    await this.page.waitForURL('/login');
  }

  /**
   * Click "Back to Login" link
   */
  async backToLogin(): Promise<void> {
    await this.backToLoginLink.click();
    await this.page.waitForURL('/login');
  }

  // ============= Error and Validation Methods =============

  /**
   * Get general error message from the page
   * Alias for getServerErrorText() for test compatibility
   * @returns Error message text or null if not visible
   */
  async getErrorMessage(): Promise<string | null> {
    return await this.getServerErrorText();
  }

  /**
   * Alias for passwordInput - some tests expect newPasswordInput
   */
  get newPasswordInput(): Locator {
    return this.passwordInput;
  }

  /**
   * Check if password field has an error
   * @returns True if password error is visible
   */
  async hasPasswordError(): Promise<boolean> {
    try {
      return await this.passwordError.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if confirm password field has an error
   * @returns True if confirm password error is visible
   */
  async hasConfirmPasswordError(): Promise<boolean> {
    try {
      return await this.confirmPasswordError.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get the server error alert text
   * @returns Error message text or null if not visible
   */
  async getServerErrorText(): Promise<string | null> {
    try {
      return await this.serverErrorAlert.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Get the email validation error text
   * @returns Error message text or null if not visible
   */
  async getEmailErrorText(): Promise<string | null> {
    try {
      return await this.emailError.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Get the password validation error text
   * @returns Error message text or null if not visible
   */
  async getPasswordErrorText(): Promise<string | null> {
    try {
      return await this.passwordError.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Get the confirm password validation error text
   * @returns Error message text or null if not visible
   */
  async getConfirmPasswordErrorText(): Promise<string | null> {
    try {
      return await this.confirmPasswordError.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Get the password help text
   * @returns Help text or null if not visible
   */
  async getPasswordHelpText(): Promise<string | null> {
    try {
      return await this.passwordHelp.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Check if a field has ARIA invalid attribute
   * @param field - Field name ('email', 'password', 'confirmPassword')
   * @returns True if field is marked invalid
   */
  async isFieldInvalid(field: 'email' | 'password' | 'confirmPassword'): Promise<boolean> {
    const locatorMap = {
      email: this.emailInput,
      password: this.passwordInput,
      confirmPassword: this.confirmPasswordInput,
    };
    const locator = locatorMap[field];
    const ariaInvalid = await locator.getAttribute('aria-invalid');
    return ariaInvalid === 'true';
  }

  // ============= Accessibility Methods =============

  /**
   * Verify accessibility attributes are correctly set
   * @param page - 'forgot' or 'reset' to specify which page to check
   */
  async verifyAccessibility(page: 'forgot' | 'reset'): Promise<void> {
    if (page === 'forgot') {
      // Check email input label association
      await this.page.locator('label[for="email"]').waitFor({ state: 'visible' });

      // Check email input has autocomplete attribute
      const autocomplete = await this.emailInput.getAttribute('autocomplete');
      if (autocomplete !== 'email') {
        throw new Error('Email input missing autocomplete="email"');
      }

      // Check email input has autofocus
      const autoFocus = await this.emailInput.getAttribute('autoFocus');
      if (!autoFocus) {
        throw new Error('Email input missing autofocus attribute');
      }
    } else {
      // Check password input label associations
      await this.page.locator('label[for="password"]').waitFor({ state: 'visible' });
      await this.page.locator('label[for="confirmPassword"]').waitFor({ state: 'visible' });

      // Check password input has autocomplete attribute
      const passwordAutocomplete = await this.passwordInput.getAttribute('autocomplete');
      if (passwordAutocomplete !== 'new-password') {
        throw new Error('Password input missing autocomplete="new-password"');
      }

      // Check password help text is properly associated
      const passwordAriaDescribedBy = await this.passwordInput.getAttribute('aria-describedby');
      if (!passwordAriaDescribedBy?.includes('password-help')) {
        throw new Error('Password input missing aria-describedby="password-help"');
      }
    }

    // Check submit button has accessible label
    const submitButton = page === 'forgot' ? this.sendResetLinkButton : this.resetPasswordButton;
    const submitLabel = await submitButton.getAttribute('aria-label');
    if (!submitLabel) {
      throw new Error('Submit button missing aria-label');
    }
  }

  /**
   * Verify keyboard navigation works correctly
   * @param page - 'forgot' or 'reset' to specify which page to test
   */
  async verifyKeyboardNavigation(page: 'forgot' | 'reset'): Promise<void> {
    if (page === 'forgot') {
      // Focus email input
      await this.emailInput.focus();
      await this.page.keyboard.press('Tab');

      // Should focus submit button
      await this.page.waitForTimeout(100);
      await this.page.keyboard.press('Tab');

      // Should focus back to login link
      await this.page.waitForTimeout(100);
    } else {
      // Focus password input
      await this.passwordInput.focus();
      await this.page.keyboard.press('Tab');

      // Should focus confirm password input
      await this.page.waitForTimeout(100);
      await this.page.keyboard.press('Tab');

      // Should focus submit button
      await this.page.waitForTimeout(100);
      await this.page.keyboard.press('Tab');

      // Should focus back to login link
      await this.page.waitForTimeout(100);
    }
  }

  // ============= Utility Methods =============

  /**
   * Clear all form fields
   * @param page - 'forgot' or 'reset' to specify which page to clear
   */
  async clearForm(page: 'forgot' | 'reset'): Promise<void> {
    if (page === 'forgot') {
      await this.emailInput.clear();
    } else {
      await this.passwordInput.clear();
      await this.confirmPasswordInput.clear();
    }
  }

  /**
   * Get current form values
   * @param page - 'forgot' or 'reset' to specify which page
   * @returns Object with current form values
   */
  async getFormValues(page: 'forgot' | 'reset'): Promise<Record<string, string>> {
    if (page === 'forgot') {
      return {
        email: (await this.emailInput.inputValue()) || '',
      };
    } else {
      return {
        password: (await this.passwordInput.inputValue()) || '',
        confirmPassword: (await this.confirmPasswordInput.inputValue()) || '',
      };
    }
  }
}
