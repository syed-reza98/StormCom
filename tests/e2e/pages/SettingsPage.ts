import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for User Settings page
 * Represents the settings dashboard for password changes, profile updates
 * Used in: permissions.spec.ts (T066), session-invalidation.spec.ts (T070)
 * 
 * Routes covered: /settings, /settings/password, /settings/profile
 */
export class SettingsPage {
  readonly page: Page;

  // Page structure elements
  readonly pageTitle: Locator;
  readonly settingsNavigation: Locator;
  readonly passwordTab: Locator;
  readonly profileTab: Locator;
  readonly securityTab: Locator;
  readonly preferencesTab: Locator;

  // Password change section
  readonly passwordSection: Locator;
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly changePasswordButton: Locator;
  readonly passwordChangeSuccessMessage: Locator;
  readonly passwordChangeErrorMessage: Locator;

  // Password requirements
  readonly passwordRequirements: Locator;
  readonly lengthRequirement: Locator;
  readonly uppercaseRequirement: Locator;
  readonly numberRequirement: Locator;
  readonly specialCharRequirement: Locator;

  // Profile section elements
  readonly profileSection: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly updateProfileButton: Locator;

  // Security section elements
  readonly securitySection: Locator;
  readonly mfaStatusIndicator: Locator;
  readonly enableMfaButton: Locator;
  readonly disableMfaButton: Locator;
  readonly viewBackupCodesButton: Locator;
  readonly regenerateBackupCodesButton: Locator;

  // Session management
  readonly activeSessionsSection: Locator;
  readonly sessionsList: Locator;
  readonly revokeAllSessionsButton: Locator;
  readonly revokeSessionButtons: Locator;

  // Account preferences
  readonly preferencesSection: Locator;
  readonly themeSelector: Locator;
  readonly languageSelector: Locator;
  readonly timezoneSelector: Locator;
  readonly emailNotificationsCheckbox: Locator;
  readonly smsNotificationsCheckbox: Locator;

  // Form validation and feedback
  readonly fieldErrors: Locator;
  readonly successMessages: Locator;
  readonly errorMessages: Locator;
  readonly loadingSpinner: Locator;

  // Navigation and actions
  readonly saveChangesButton: Locator;
  readonly cancelButton: Locator;
  readonly backToDashboardButton: Locator;

  // Accessibility elements
  readonly skipToContentLink: Locator;
  readonly formFieldLabels: Locator;

  constructor(page: Page) {
    this.page = page;

    // Page structure elements
    this.pageTitle = page.locator('h1', { hasText: 'Settings' });
    this.settingsNavigation = page.locator('[data-testid="settings-navigation"]');
    this.passwordTab = page.locator('[data-testid="password-tab"]');
    this.profileTab = page.locator('[data-testid="profile-tab"]');
    this.securityTab = page.locator('[data-testid="security-tab"]');
    this.preferencesTab = page.locator('[data-testid="preferences-tab"]');

    // Password change section
    this.passwordSection = page.locator('[data-testid="password-section"]');
    this.currentPasswordInput = page.locator('[data-testid="current-password-input"]');
    this.newPasswordInput = page.locator('[data-testid="new-password-input"]');
    this.confirmPasswordInput = page.locator('[data-testid="confirm-password-input"]');
    this.changePasswordButton = page.locator('[data-testid="change-password-button"]');
    this.passwordChangeSuccessMessage = page.locator('[data-testid="password-change-success"]');
    this.passwordChangeErrorMessage = page.locator('[data-testid="password-change-error"]');

    // Password requirements
    this.passwordRequirements = page.locator('[data-testid="password-requirements"]');
    this.lengthRequirement = page.locator('[data-testid="length-requirement"]');
    this.uppercaseRequirement = page.locator('[data-testid="uppercase-requirement"]');
    this.numberRequirement = page.locator('[data-testid="number-requirement"]');
    this.specialCharRequirement = page.locator('[data-testid="special-char-requirement"]');

    // Profile section elements
    this.profileSection = page.locator('[data-testid="profile-section"]');
    this.firstNameInput = page.locator('[data-testid="first-name-input"]');
    this.lastNameInput = page.locator('[data-testid="last-name-input"]');
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.phoneInput = page.locator('[data-testid="phone-input"]');
    this.updateProfileButton = page.locator('[data-testid="update-profile-button"]');

    // Security section elements
    this.securitySection = page.locator('[data-testid="security-section"]');
    this.mfaStatusIndicator = page.locator('[data-testid="mfa-status-indicator"]');
    this.enableMfaButton = page.locator('[data-testid="enable-mfa-button"]');
    this.disableMfaButton = page.locator('[data-testid="disable-mfa-button"]');
    this.viewBackupCodesButton = page.locator('[data-testid="view-backup-codes-button"]');
    this.regenerateBackupCodesButton = page.locator('[data-testid="regenerate-backup-codes-button"]');

    // Session management
    this.activeSessionsSection = page.locator('[data-testid="active-sessions-section"]');
    this.sessionsList = page.locator('[data-testid="sessions-list"]');
    this.revokeAllSessionsButton = page.locator('[data-testid="revoke-all-sessions-button"]');
    this.revokeSessionButtons = page.locator('[data-testid="revoke-session-button"]');

    // Account preferences
    this.preferencesSection = page.locator('[data-testid="preferences-section"]');
    this.themeSelector = page.locator('[data-testid="theme-selector"]');
    this.languageSelector = page.locator('[data-testid="language-selector"]');
    this.timezoneSelector = page.locator('[data-testid="timezone-selector"]');
    this.emailNotificationsCheckbox = page.locator('[data-testid="email-notifications-checkbox"]');
    this.smsNotificationsCheckbox = page.locator('[data-testid="sms-notifications-checkbox"]');

    // Form validation and feedback
    this.fieldErrors = page.locator('[data-testid="field-error"]');
    this.successMessages = page.locator('[data-testid="success-message"]');
    this.errorMessages = page.locator('[data-testid="error-message"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');

    // Navigation and actions
    this.saveChangesButton = page.locator('[data-testid="save-changes-button"]');
    this.cancelButton = page.locator('[data-testid="cancel-button"]');
    this.backToDashboardButton = page.locator('[data-testid="back-to-dashboard-button"]');

    // Accessibility elements
    this.skipToContentLink = page.locator('[data-testid="skip-to-content"]');
    this.formFieldLabels = page.locator('label');
  }

  /**
   * Navigate to the settings page
   */
  async goto(): Promise<void> {
    await this.page.goto('/settings');
  }

  /**
   * Wait for the page to load completely
   */
  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: 'visible' });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Check if user has access to settings page (validates permissions)
   */
  async hasAccess(): Promise<boolean> {
    try {
      await this.pageTitle.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if page shows 403 Forbidden error
   */
  async isForbidden(): Promise<boolean> {
    const url = this.page.url();
    const content = await this.page.textContent('body');
    return url.includes('403') || content?.includes('403') || content?.includes('Forbidden') || false;
  }

  /**
   * Navigate to password change tab
   */
  async navigateToPasswordTab(): Promise<void> {
    await this.passwordTab.click();
    await this.passwordSection.waitFor({ state: 'visible' });
  }

  /**
   * Navigate to profile tab
   */
  async navigateToProfileTab(): Promise<void> {
    await this.profileTab.click();
    await this.profileSection.waitFor({ state: 'visible' });
  }

  /**
   * Navigate to security tab
   */
  async navigateToSecurityTab(): Promise<void> {
    await this.securityTab.click();
    await this.securitySection.waitFor({ state: 'visible' });
  }

  /**
   * Navigate to preferences tab
   */
  async navigateToPreferencesTab(): Promise<void> {
    await this.preferencesTab.click();
    await this.preferencesSection.waitFor({ state: 'visible' });
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.navigateToPasswordTab();
    
    await this.currentPasswordInput.fill(currentPassword);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(newPassword);
    
    await this.changePasswordButton.click();
  }

  /**
   * Wait for password change to complete successfully
   */
  async waitForPasswordChangeSuccess(): Promise<void> {
    await this.passwordChangeSuccessMessage.waitFor({ state: 'visible' });
  }

  /**
   * Wait for password change error
   */
  async waitForPasswordChangeError(): Promise<string> {
    await this.passwordChangeErrorMessage.waitFor({ state: 'visible' });
    return await this.passwordChangeErrorMessage.textContent() || '';
  }

  /**
   * Check if password requirements are displayed
   */
  async arePasswordRequirementsVisible(): Promise<boolean> {
    return await this.passwordRequirements.isVisible();
  }

  /**
   * Get the status of password requirements
   */
  async getPasswordRequirementStatus(): Promise<{
    length: boolean;
    uppercase: boolean;
    number: boolean;
    specialChar: boolean;
  }> {
    const lengthMet = await this.lengthRequirement.getAttribute('data-met') === 'true';
    const uppercaseMet = await this.uppercaseRequirement.getAttribute('data-met') === 'true';
    const numberMet = await this.numberRequirement.getAttribute('data-met') === 'true';
    const specialCharMet = await this.specialCharRequirement.getAttribute('data-met') === 'true';

    return {
      length: lengthMet,
      uppercase: uppercaseMet,
      number: numberMet,
      specialChar: specialCharMet
    };
  }

  /**
   * Update profile information
   */
  async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }): Promise<void> {
    await this.navigateToProfileTab();

    if (profileData.firstName !== undefined) {
      await this.firstNameInput.fill(profileData.firstName);
    }
    if (profileData.lastName !== undefined) {
      await this.lastNameInput.fill(profileData.lastName);
    }
    if (profileData.email !== undefined) {
      await this.emailInput.fill(profileData.email);
    }
    if (profileData.phone !== undefined) {
      await this.phoneInput.fill(profileData.phone);
    }

    await this.updateProfileButton.click();
  }

  /**
   * Get current MFA status
   */
  async getMfaStatus(): Promise<'enabled' | 'disabled'> {
    await this.navigateToSecurityTab();
    const statusText = await this.mfaStatusIndicator.textContent();
    return statusText?.toLowerCase().includes('enabled') ? 'enabled' : 'disabled';
  }

  /**
   * Get list of active sessions
   */
  async getActiveSessions(): Promise<Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>> {
    await this.navigateToSecurityTab();
    await this.sessionsList.waitFor({ state: 'visible' });

    const sessions = [];
    const sessionElements = await this.sessionsList.locator('[data-testid="session-item"]').all();

    for (const sessionElement of sessionElements) {
      const id = await sessionElement.getAttribute('data-session-id') || '';
      const device = await sessionElement.locator('[data-testid="session-device"]').textContent() || '';
      const location = await sessionElement.locator('[data-testid="session-location"]').textContent() || '';
      const lastActive = await sessionElement.locator('[data-testid="session-last-active"]').textContent() || '';
      const current = await sessionElement.locator('[data-testid="current-session-indicator"]').isVisible();

      sessions.push({
        id,
        device: device.trim(),
        location: location.trim(),
        lastActive: lastActive.trim(),
        current
      });
    }

    return sessions;
  }

  /**
   * Revoke all sessions except current
   */
  async revokeAllSessions(): Promise<void> {
    await this.navigateToSecurityTab();
    await this.revokeAllSessionsButton.click();
    
    // Wait for confirmation dialog and confirm
    const confirmButton = this.page.locator('[data-testid="confirm-revoke-sessions"]');
    await confirmButton.click();
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.navigateToSecurityTab();
    
    const sessionElement = this.sessionsList.locator(`[data-session-id="${sessionId}"]`);
    const revokeButton = sessionElement.locator('[data-testid="revoke-session-button"]');
    
    await revokeButton.click();
    
    // Wait for confirmation dialog and confirm
    const confirmButton = this.page.locator('[data-testid="confirm-revoke-session"]');
    await confirmButton.click();
  }

  /**
   * Update account preferences
   */
  async updatePreferences(preferences: {
    theme?: 'light' | 'dark' | 'auto';
    language?: string;
    timezone?: string;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
  }): Promise<void> {
    await this.navigateToPreferencesTab();

    if (preferences.theme) {
      await this.themeSelector.selectOption(preferences.theme);
    }
    if (preferences.language) {
      await this.languageSelector.selectOption(preferences.language);
    }
    if (preferences.timezone) {
      await this.timezoneSelector.selectOption(preferences.timezone);
    }
    if (preferences.emailNotifications !== undefined) {
      const isChecked = await this.emailNotificationsCheckbox.isChecked();
      if (isChecked !== preferences.emailNotifications) {
        await this.emailNotificationsCheckbox.click();
      }
    }
    if (preferences.smsNotifications !== undefined) {
      const isChecked = await this.smsNotificationsCheckbox.isChecked();
      if (isChecked !== preferences.smsNotifications) {
        await this.smsNotificationsCheckbox.click();
      }
    }

    await this.saveChangesButton.click();
  }

  /**
   * Cancel any pending changes
   */
  async cancelChanges(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Navigate back to dashboard
   */
  async backToDashboard(): Promise<void> {
    await this.backToDashboardButton.click();
  }

  /**
   * Validate accessibility of the settings page
   */
  async validateAccessibility(): Promise<void> {
    // Check page title is present
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageTitle).toHaveText('Settings');

    // Check navigation tabs are accessible
    await expect(this.settingsNavigation).toBeVisible();
    
    // Check all tabs have proper ARIA attributes
    await expect(this.passwordTab).toHaveAttribute('role', 'tab');
    await expect(this.profileTab).toHaveAttribute('role', 'tab');
    await expect(this.securityTab).toHaveAttribute('role', 'tab');
    await expect(this.preferencesTab).toHaveAttribute('role', 'tab');

    // Check form fields have proper labels
    const labels = await this.formFieldLabels.all();
    for (const label of labels) {
      await expect(label).toHaveAttribute('for');
    }

    // Check skip to content link exists
    await expect(this.skipToContentLink).toBeVisible();
  }

  /**
   * Validate that form fields show proper validation errors
   */
  async validateFormValidation(): Promise<void> {
    // Check that error messages are properly associated with fields
    const fieldErrors = await this.fieldErrors.all();
    for (const error of fieldErrors) {
      await expect(error).toBeVisible();
      await expect(error).toHaveAttribute('role', 'alert');
    }
  }

  /**
   * Get all current field validation errors
   */
  async getFieldErrors(): Promise<string[]> {
    const errors = await this.fieldErrors.all();
    const errorTexts = [];
    
    for (const error of errors) {
      const text = await error.textContent();
      if (text) {
        errorTexts.push(text.trim());
      }
    }
    
    return errorTexts;
  }

  /**
   * Get success messages displayed on the page
   */
  async getSuccessMessages(): Promise<string[]> {
    const messages = await this.successMessages.all();
    const messageTexts = [];
    
    for (const message of messages) {
      const text = await message.textContent();
      if (text) {
        messageTexts.push(text.trim());
      }
    }
    
    return messageTexts;
  }

  /**
   * Check if the page is in a loading state
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete(): Promise<void> {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Helper object for password change form operations
   */
  get changePasswordForm() {
    return {
      currentPasswordInput: this.currentPasswordInput,
      newPasswordInput: this.newPasswordInput,
      confirmPasswordInput: this.confirmPasswordInput,
      submitButton: this.changePasswordButton,

      /**
       * Clear all password form fields
       */
      clearForm: async (): Promise<void> => {
        await this.currentPasswordInput.clear();
        await this.newPasswordInput.clear();
        await this.confirmPasswordInput.clear();
      },

      /**
       * Change password with current and new password
       */
      changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        await this.currentPasswordInput.clear();
        await this.currentPasswordInput.fill(currentPassword);
        
        await this.newPasswordInput.clear();
        await this.newPasswordInput.fill(newPassword);
        
        await this.confirmPasswordInput.clear();
        await this.confirmPasswordInput.fill(newPassword);

        await this.changePasswordButton.click();
        await this.page.waitForTimeout(1000);

        // Wait for success message
        const successMessage = this.page.locator('[data-testid="password-changed-success"], text=/password.*changed|updated/i');
        if (await successMessage.isVisible()) {
          await successMessage.waitFor({ state: 'hidden', timeout: 5000 });
        }
      }
    };
  }
}