import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the MFA Challenge page
 * Path: /mfa/challenge
 * 
 * Handles TOTP verification during login: code entry, backup code usage,
 * error handling, and navigation.
 */
export class MFAChallengePage {
  readonly page: Page;

  // Header locators
  readonly heading: Locator;
  readonly description: Locator;
  readonly shieldIcon: Locator;

  // Form locators
  readonly codeInput: Locator;
  readonly codeError: Locator;
  readonly submitButton: Locator;

  // Error state locators
  readonly serverErrorAlert: Locator;

  // Toggle locators
  readonly toggleBackupCodeButton: Locator;

  // Info box locators
  readonly infoBox: Locator;
  readonly infoMessage: Locator;

  // Navigation locators
  readonly backToLoginLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.heading = page.locator('h1:has-text("Two-Factor Authentication")');
    this.description = page.locator('p.text-sm.text-gray-600').first();
    this.shieldIcon = page.locator('svg').filter({ has: page.locator('path[d*="M9 12.75L11.25 15"]') });

    // Form fields
    this.codeInput = page.locator('input#code');
    this.codeError = page.locator('#code-error');
    this.submitButton = page.locator('button[type="submit"]');

    // Error messages
    this.serverErrorAlert = page.locator('[role="alert"]');

    // Toggle backup code
    this.toggleBackupCodeButton = page.locator('button:has-text("Use")');

    // Info box
    this.infoBox = page.locator('.bg-blue-50.border-blue-200');
    this.infoMessage = page.locator('.text-blue-700');

    // Navigation
    this.backToLoginLink = page.locator('a:has-text("Back to Login")');
  }

  /**
   * Navigate to the MFA challenge page
   */
  async goto(): Promise<void> {
    await this.page.goto('/mfa/challenge');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if page is in TOTP mode (default)
   * @returns True if using authenticator app mode
   */
  async isTOTPMode(): Promise<boolean> {
    const descriptionText = await this.description.textContent();
    return descriptionText?.includes('authenticator app') || false;
  }

  /**
   * Check if page is in backup code mode
   * @returns True if using backup code mode
   */
  async isBackupCodeMode(): Promise<boolean> {
    const descriptionText = await this.description.textContent();
    return descriptionText?.includes('backup codes') || false;
  }

  /**
   * Toggle between TOTP and backup code modes
   */
  async toggleBackupCodeMode(): Promise<void> {
    await this.toggleBackupCodeButton.click();
    // Wait for UI to update
    await this.page.waitForTimeout(200);
  }

  /**
   * Switch to backup code mode (if not already)
   */
  async switchToBackupCodeMode(): Promise<void> {
    if (!(await this.isBackupCodeMode())) {
      await this.toggleBackupCodeMode();
    }
  }

  /**
   * Switch to TOTP mode (if not already)
   */
  async switchToTOTPMode(): Promise<void> {
    if (await this.isBackupCodeMode()) {
      await this.toggleBackupCodeMode();
    }
  }

  /**
   * Enter verification code (TOTP or backup code)
   * @param code - 6-digit TOTP code or 10-character backup code
   */
  async enterCode(code: string): Promise<void> {
    await this.codeInput.fill(code);
  }

  /**
   * Submit the verification form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete verification flow (enter code + submit)
   * @param code - 6-digit TOTP code or 10-character backup code
   */
  async verifyCode(code: string): Promise<void> {
    await this.enterCode(code);
    await this.submit();
  }

  /**
   * Submit form using Enter key (accessibility test)
   */
  async submitWithEnter(): Promise<void> {
    await this.codeInput.press('Enter');
  }

  /**
   * Wait for successful verification and redirect to dashboard
   * @param timeout - Optional timeout in milliseconds (default: 10000)
   */
  async waitForSuccessfulVerification(timeout = 10000): Promise<void> {
    await this.page.waitForURL('/dashboard', { timeout });
  }

  /**
   * Click "Back to Login" link
   */
  async backToLogin(): Promise<void> {
    await this.backToLoginLink.click();
    await this.page.waitForURL('/login');
  }

  /**
   * Check if submit button is in loading state
   * @returns True if button shows loading state
   */
  async isLoading(): Promise<boolean> {
    const buttonText = await this.submitButton.textContent();
    return buttonText?.includes('Verifying...') || false;
  }

  /**
   * Check if submit button is disabled
   * @returns True if button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
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
   * Get the code validation error text
   * @returns Error message text or null if not visible
   */
  async getCodeErrorText(): Promise<string | null> {
    try {
      return await this.codeError.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Check if code input has ARIA invalid attribute
   * @returns True if field is marked invalid
   */
  async isCodeInputInvalid(): Promise<boolean> {
    const ariaInvalid = await this.codeInput.getAttribute('aria-invalid');
    return ariaInvalid === 'true';
  }

  /**
   * Get the info message text
   * @returns Info message text
   */
  async getInfoMessage(): Promise<string | null> {
    try {
      return await this.infoMessage.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Get the current input mode attribute (numeric for TOTP, text for backup codes)
   * @returns Input mode value
   */
  async getInputMode(): Promise<string | null> {
    return await this.codeInput.getAttribute('inputMode');
  }

  /**
   * Get the current maxLength attribute (6 for TOTP, 10 for backup codes)
   * @returns Max length value
   */
  async getMaxLength(): Promise<number> {
    const maxLength = await this.codeInput.getAttribute('maxLength');
    return maxLength ? parseInt(maxLength, 10) : 0;
  }

  /**
   * Get the current placeholder text
   * @returns Placeholder text
   */
  async getPlaceholder(): Promise<string | null> {
    return await this.codeInput.getAttribute('placeholder');
  }

  /**
   * Verify accessibility attributes are correctly set
   */
  async verifyAccessibility(): Promise<void> {
    // Check code input label association
    await this.page.locator('label[for="code"]').waitFor({ state: 'visible' });

    // Check code input has autocomplete attribute
    const autocomplete = await this.codeInput.getAttribute('autocomplete');
    if (autocomplete !== 'one-time-code') {
      throw new Error('Code input missing autocomplete="one-time-code"');
    }

    // Check submit button has accessible label
    const submitLabel = await this.submitButton.getAttribute('aria-label');
    if (!submitLabel) {
      throw new Error('Submit button missing aria-label');
    }

    // Check loading state disables button
    if (await this.isLoading()) {
      const isDisabled = await this.submitButton.isDisabled();
      if (!isDisabled) {
        throw new Error('Submit button should be disabled during verification');
      }
    }

    // Check code input has autofocus
    const autoFocus = await this.codeInput.getAttribute('autoFocus');
    if (!autoFocus) {
      throw new Error('Code input missing autofocus attribute');
    }
  }

  /**
   * Verify keyboard navigation works correctly
   */
  async verifyKeyboardNavigation(): Promise<void> {
    // Focus code input
    await this.codeInput.focus();
    await this.page.keyboard.press('Tab');

    // Should focus submit button
    await this.page.waitForTimeout(100);
    await this.page.keyboard.press('Tab');

    // Should focus toggle backup code button
    await this.page.waitForTimeout(100);
    await this.page.keyboard.press('Tab');

    // Should focus back to login link
    await this.page.waitForTimeout(100);
  }

  /**
   * Clear the code input field
   */
  async clearCode(): Promise<void> {
    await this.codeInput.clear();
  }

  /**
   * Get the current code input value
   * @returns Current input value
   */
  async getCodeValue(): Promise<string> {
    return (await this.codeInput.inputValue()) || '';
  }

  /**
   * Complete TOTP verification flow
   * @param totpCode - 6-digit TOTP code
   */
  async verifyWithTOTP(totpCode: string): Promise<void> {
    await this.switchToTOTPMode();
    await this.verifyCode(totpCode);
    await this.waitForSuccessfulVerification();
  }

  /**
   * Complete backup code verification flow
   * @param backupCode - 10-character backup code
   */
  async verifyWithBackupCode(backupCode: string): Promise<void> {
    await this.switchToBackupCodeMode();
    await this.verifyCode(backupCode);
    await this.waitForSuccessfulVerification();
  }
}
