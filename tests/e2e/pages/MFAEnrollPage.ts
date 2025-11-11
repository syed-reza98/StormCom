import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the MFA Enrollment page
 * Path: /mfa/enroll
 * 
 * Handles TOTP enrollment flow: QR code scanning, secret copying,
 * verification code entry, and backup code display.
 */
export class MFAEnrollPage {
  readonly page: Page;

  // Loading state locators
  readonly loadingSpinner: Locator;
  readonly loadingText: Locator;

  // Setup step locators
  readonly setupHeading: Locator;
  readonly qrCodeImage: Locator;
  readonly secretCode: Locator;
  readonly copySecretButton: Locator;

  // Verify step locators
  readonly verifyHeading: Locator;
  readonly codeInput: Locator;
  readonly codeError: Locator;
  readonly submitButton: Locator;
  readonly backupCodesInfo: Locator;
  readonly cancelLink: Locator;

  // Error state locators
  readonly errorHeading: Locator;
  readonly serverErrorAlert: Locator;
  readonly backToSettingsButton: Locator;

  // Complete step locators
  readonly successIcon: Locator;
  readonly successHeading: Locator;
  readonly successMessage: Locator;
  readonly backupCodesWarning: Locator;
  readonly backupCodesDisplay: Locator;
  readonly copyBackupCodesButton: Locator;
  readonly goToDashboardButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Loading state
    this.loadingSpinner = page.locator('svg.animate-spin');
    this.loadingText = page.locator('text=Initializing MFA setup...');

    // Setup/Verify step (QR code section)
    this.setupHeading = page.locator('h1:has-text("Enable Two-Factor Authentication")');
    this.qrCodeImage = page.locator('img[alt="MFA QR Code"]');
    this.secretCode = page.locator('code').first();
    this.copySecretButton = page.locator('button:has-text("Copy Secret")');

    // Verify step (code input section)
    this.verifyHeading = page.locator('h2:has-text("Enter Verification Code")');
    this.codeInput = page.locator('input#code');
    this.codeError = page.locator('#code-error');
    this.submitButton = page.locator('button[type="submit"]:has-text("Verify")');
    this.backupCodesInfo = page.locator('text=After verification, you\'ll receive backup codes');
    this.cancelLink = page.locator('a:has-text("Cancel and go back")');

    // Error state
    this.errorHeading = page.locator('h1:has-text("Setup Failed")');
    this.serverErrorAlert = page.locator('[role="alert"]');
    this.backToSettingsButton = page.locator('a:has-text("Back to Settings")');

    // Complete step
    this.successIcon = page.locator('svg').filter({ has: page.locator('path[d*="M5 13l4 4L19 7"]') });
    this.successHeading = page.locator('h1:has-text("MFA Enabled Successfully!")');
    this.successMessage = page.locator('text=Two-factor authentication is now active on your account');
    this.backupCodesWarning = page.locator('h3:has-text("Save Your Backup Codes")');
    this.backupCodesDisplay = page.locator('.grid.grid-cols-2 > div');
    this.copyBackupCodesButton = page.locator('button:has-text("Copy All Codes")');
    this.goToDashboardButton = page.locator('button:has-text("Go to Dashboard")');
  }

  /**
   * Navigate to the MFA enrollment page
   */
  async goto(): Promise<void> {
    await this.page.goto('/mfa/enroll');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for the page to finish loading MFA setup
   * @param timeout - Optional timeout in milliseconds (default: 10000)
   */
  async waitForSetupReady(timeout = 10000): Promise<void> {
    // Wait for loading to disappear
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout });
    
    // Wait for QR code to appear (verify step)
    await this.qrCodeImage.waitFor({ state: 'visible', timeout });
  }

  /**
   * Check if page is in loading state
   * @returns True if loading spinner is visible
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  /**
   * Check if page is in error state
   * @returns True if error heading is visible
   */
  async isErrorState(): Promise<boolean> {
    return await this.errorHeading.isVisible();
  }

  /**
   * Get the secret code text for manual entry
   * @returns TOTP secret code
   */
  async getSecretCode(): Promise<string> {
    return (await this.secretCode.textContent()) || '';
  }

  /**
   * Copy the secret code to clipboard
   */
  async copySecret(): Promise<void> {
    await this.copySecretButton.click();
    // Wait for "Copied!" feedback
    await this.page.waitForTimeout(100);
  }

  /**
   * Check if secret code was copied (button shows "✓ Copied!")
   * @returns True if button shows copied state
   */
  async isSecretCopied(): Promise<boolean> {
    const buttonText = await this.copySecretButton.textContent();
    return buttonText?.includes('✓ Copied!') || false;
  }

  /**
   * Get the QR code image URL
   * @returns QR code data URL or image source
   */
  async getQRCodeUrl(): Promise<string> {
    return (await this.qrCodeImage.getAttribute('src')) || '';
  }

  /**
   * Enter the verification code from authenticator app
   * @param code - 6-digit TOTP code
   */
  async enterCode(code: string): Promise<void> {
    await this.codeInput.fill(code);
  }

  /**
   * Submit the verification code
   */
  async submitCode(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete verification flow (enter code + submit)
   * @param code - 6-digit TOTP code
   */
  async verifyCode(code: string): Promise<void> {
    await this.enterCode(code);
    await this.submitCode();
  }

  /**
   * Wait for successful verification (complete step)
   * @param timeout - Optional timeout in milliseconds (default: 10000)
   */
  async waitForVerificationSuccess(timeout = 10000): Promise<void> {
    await this.successHeading.waitFor({ state: 'visible', timeout });
    await this.backupCodesDisplay.first().waitFor({ state: 'visible', timeout });
  }

  /**
   * Check if verification is in progress (submit button disabled)
   * @returns True if button shows verifying state
   */
  async isVerifying(): Promise<boolean> {
    const buttonText = await this.submitButton.textContent();
    return buttonText?.includes('Verifying...') || false;
  }

  /**
   * Get all backup codes displayed on completion
   * @returns Array of backup codes
   */
  async getBackupCodes(): Promise<string[]> {
    const codeElements = await this.backupCodesDisplay.all();
    const codes: string[] = [];
    for (const element of codeElements) {
      const text = await element.textContent();
      if (text) codes.push(text.trim());
    }
    return codes;
  }

  /**
   * Copy all backup codes to clipboard
   */
  async copyBackupCodes(): Promise<void> {
    await this.copyBackupCodesButton.click();
    // Wait for "Copied!" feedback
    await this.page.waitForTimeout(100);
  }

  /**
   * Check if backup codes were copied (button shows "✓ Copied!")
   * @returns True if button shows copied state
   */
  async areBackupCodesCopied(): Promise<boolean> {
    const buttonText = await this.copyBackupCodesButton.textContent();
    return buttonText?.includes('✓ Copied!') || false;
  }

  /**
   * Click "Go to Dashboard" button after successful enrollment
   */
  async goToDashboard(): Promise<void> {
    await this.goToDashboardButton.click();
    await this.page.waitForURL('/dashboard');
  }

  /**
   * Click "Cancel and go back" link
   */
  async cancel(): Promise<void> {
    await this.cancelLink.click();
    await this.page.waitForURL('/dashboard/settings');
  }

  /**
   * Click "Back to Settings" button (error state)
   */
  async backToSettings(): Promise<void> {
    await this.backToSettingsButton.click();
    await this.page.waitForURL('/dashboard/settings');
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

    // Check code input has inputMode for numeric keyboards
    const inputMode = await this.codeInput.getAttribute('inputMode');
    if (inputMode !== 'numeric') {
      throw new Error('Code input missing inputMode="numeric"');
    }

    // Check submit button state during verification
    if (await this.isVerifying()) {
      const isDisabled = await this.submitButton.isDisabled();
      if (!isDisabled) {
        throw new Error('Submit button should be disabled during verification');
      }
    }
  }

  /**
   * Complete full MFA enrollment flow
   * @param totpCode - 6-digit TOTP code from authenticator app
   * @returns Backup codes array
   */
  async completeEnrollment(totpCode: string): Promise<string[]> {
    // Wait for setup to load
    await this.waitForSetupReady();

    // Verify code
    await this.verifyCode(totpCode);

    // Wait for success
    await this.waitForVerificationSuccess();

    // Get backup codes
    const backupCodes = await this.getBackupCodes();

    return backupCodes;
  }

  /**
   * Submit form using Enter key (accessibility test)
   */
  async submitWithEnter(): Promise<void> {
    await this.codeInput.press('Enter');
  }
}
