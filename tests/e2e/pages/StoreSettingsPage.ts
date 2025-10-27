/**
 * Page Object Model for Store Settings Page
 * 
 * Provides selectors and methods for interacting with the store settings form
 * including basic info, address, localization, and theme settings.
 */

import { Page, Locator, expect } from '@playwright/test';

export class StoreSettingsPage {
  readonly page: Page;
  
  // Form section headings
  readonly basicInfoSection: Locator;
  readonly addressSection: Locator;
  readonly localizationSection: Locator;
  readonly themeSection: Locator;
  
  // Basic information fields
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly descriptionTextarea: Locator;
  readonly phoneInput: Locator;
  readonly websiteInput: Locator;
  readonly logoUpload: Locator;
  readonly logoPreview: Locator;
  readonly removeLogoButton: Locator;
  
  // Address fields
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly postalCodeInput: Locator;
  readonly countrySelect: Locator;
  
  // Localization fields
  readonly currencySelect: Locator;
  readonly timezoneSelect: Locator;
  readonly localeSelect: Locator;
  
  // Theme fields
  readonly primaryColorInput: Locator;
  readonly primaryColorPicker: Locator;
  readonly secondaryColorInput: Locator;
  readonly secondaryColorPicker: Locator;
  readonly accentColorInput: Locator;
  readonly accentColorPicker: Locator;
  readonly fontFamilySelect: Locator;
  
  // Action buttons
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly resetButton: Locator;
  
  // Error messages
  readonly nameError: Locator;
  readonly emailError: Locator;
  readonly descriptionError: Locator;
  readonly phoneError: Locator;
  readonly websiteError: Locator;
  readonly addressError: Locator;
  readonly cityError: Locator;
  readonly stateError: Locator;
  readonly postalCodeError: Locator;
  readonly countryError: Locator;
  readonly currencyError: Locator;
  readonly timezoneError: Locator;
  readonly localeError: Locator;
  readonly primaryColorError: Locator;
  readonly secondaryColorError: Locator;
  readonly accentColorError: Locator;
  readonly logoError: Locator;
  readonly formError: Locator;
  
  // Success/status messages
  readonly successMessage: Locator;
  readonly savingIndicator: Locator;
  readonly unsavedChanges: Locator;
  
  // Character counters
  readonly descriptionCharCount: Locator;
  
  // Upload progress
  readonly logoUploadProgress: Locator;
  readonly logoUploading: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Section headings
    this.basicInfoSection = page.locator('h3').filter({ hasText: /basic.*information/i });
    this.addressSection = page.locator('h3').filter({ hasText: /address/i });
    this.localizationSection = page.locator('h3').filter({ hasText: /localization/i });
    this.themeSection = page.locator('h3').filter({ hasText: /theme.*settings/i });
    
    // Basic info fields
    this.nameInput = page.locator('input#name');
    this.emailInput = page.locator('input#email');
    this.descriptionTextarea = page.locator('textarea#description');
    this.phoneInput = page.locator('input#phone');
    this.websiteInput = page.locator('input#website');
    this.logoUpload = page.locator('input#logo[type="file"]');
    this.logoPreview = page.locator('[data-testid="logo-preview"]');
    this.removeLogoButton = page.locator('button').filter({ hasText: /remove.*logo/i });
    
    // Address fields
    this.addressInput = page.locator('input#address');
    this.cityInput = page.locator('input#city');
    this.stateInput = page.locator('input#state');
    this.postalCodeInput = page.locator('input#postalCode');
    this.countrySelect = page.locator('select#country');
    
    // Localization fields
    this.currencySelect = page.locator('select#currency');
    this.timezoneSelect = page.locator('select#timezone');
    this.localeSelect = page.locator('select#locale');
    
    // Theme fields
    this.primaryColorInput = page.locator('input#primaryColor[type="text"]');
    this.primaryColorPicker = page.locator('input#primaryColor[type="color"]');
    this.secondaryColorInput = page.locator('input#secondaryColor[type="text"]');
    this.secondaryColorPicker = page.locator('input#secondaryColor[type="color"]');
    this.accentColorInput = page.locator('input#accentColor[type="text"]');
    this.accentColorPicker = page.locator('input#accentColor[type="color"]');
    this.fontFamilySelect = page.locator('select#fontFamily');
    
    // Action buttons
    this.submitButton = page.locator('button[type="submit"]');
    this.cancelButton = page.locator('button').filter({ hasText: /cancel/i });
    this.resetButton = page.locator('button').filter({ hasText: /reset/i });
    
    // Error messages
    this.nameError = page.locator('#name-error');
    this.emailError = page.locator('#email-error');
    this.descriptionError = page.locator('#description-error');
    this.phoneError = page.locator('#phone-error');
    this.websiteError = page.locator('#website-error');
    this.addressError = page.locator('#address-error');
    this.cityError = page.locator('#city-error');
    this.stateError = page.locator('#state-error');
    this.postalCodeError = page.locator('#postalCode-error');
    this.countryError = page.locator('#country-error');
    this.currencyError = page.locator('#currency-error');
    this.timezoneError = page.locator('#timezone-error');
    this.localeError = page.locator('#locale-error');
    this.primaryColorError = page.locator('#primaryColor-error');
    this.secondaryColorError = page.locator('#secondaryColor-error');
    this.accentColorError = page.locator('#accentColor-error');
    this.logoError = page.locator('#logo-error');
    this.formError = page.locator('[role="alert"]').first();
    
    // Status messages
    this.successMessage = page.locator('[data-testid="success-message"]');
    this.savingIndicator = page.locator('[data-testid="saving"]');
    this.unsavedChanges = page.locator('[data-testid="unsaved-changes"]');
    
    // Character counters
    this.descriptionCharCount = page.locator('[data-testid="description-char-count"]');
    
    // Upload indicators
    this.logoUploadProgress = page.locator('[data-testid="upload-progress"]');
    this.logoUploading = page.locator('[data-testid="logo-uploading"]');
  }

  /**
   * Navigate to store settings page
   * @param storeId - Store ID
   */
  async goto(storeId: string): Promise<void> {
    await this.page.goto(`/dashboard/stores/${storeId}/settings`);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /store.*settings/i })).toBeVisible();
    await expect(this.submitButton).toBeVisible();
    await expect(this.nameInput).toBeVisible();
  }

  /**
   * Fill basic information section
   * @param name - Store name
   * @param description - Store description
   * @param phone - Phone number
   * @param website - Website URL
   */
  async fillBasicInfo(
    name: string,
    description?: string,
    phone?: string,
    website?: string
  ): Promise<void> {
    await this.nameInput.fill(name);
    
    if (description !== undefined) {
      await this.descriptionTextarea.fill(description);
    }
    
    if (phone !== undefined) {
      await this.phoneInput.fill(phone);
    }
    
    if (website !== undefined) {
      await this.websiteInput.fill(website);
    }
  }

  /**
   * Fill address information
   * @param address - Street address
   * @param city - City
   * @param state - State/Province
   * @param postalCode - Postal/ZIP code
   * @param country - Country code
   */
  async fillAddress(
    address?: string,
    city?: string,
    state?: string,
    postalCode?: string,
    country?: string
  ): Promise<void> {
    if (address !== undefined) {
      await this.addressInput.fill(address);
    }
    
    if (city !== undefined) {
      await this.cityInput.fill(city);
    }
    
    if (state !== undefined) {
      await this.stateInput.fill(state);
    }
    
    if (postalCode !== undefined) {
      await this.postalCodeInput.fill(postalCode);
    }
    
    if (country !== undefined) {
      await this.countrySelect.selectOption(country);
    }
  }

  /**
   * Fill localization settings
   * @param currency - Currency code
   * @param timezone - Timezone
   * @param locale - Locale code
   */
  async fillLocalization(
    currency?: string,
    timezone?: string,
    locale?: string
  ): Promise<void> {
    if (currency !== undefined) {
      await this.currencySelect.selectOption(currency);
    }
    
    if (timezone !== undefined) {
      await this.timezoneSelect.selectOption(timezone);
    }
    
    if (locale !== undefined) {
      await this.localeSelect.selectOption(locale);
    }
  }

  /**
   * Fill theme settings
   * @param primaryColor - Primary color hex
   * @param secondaryColor - Secondary color hex
   * @param accentColor - Accent color hex
   * @param fontFamily - Font family selection
   */
  async fillThemeSettings(
    primaryColor?: string,
    secondaryColor?: string,
    accentColor?: string,
    fontFamily?: string
  ): Promise<void> {
    if (primaryColor !== undefined) {
      await this.primaryColorInput.fill(primaryColor);
      await this.primaryColorPicker.fill(primaryColor);
    }
    
    if (secondaryColor !== undefined) {
      await this.secondaryColorInput.fill(secondaryColor);
      await this.secondaryColorPicker.fill(secondaryColor);
    }
    
    if (accentColor !== undefined) {
      await this.accentColorInput.fill(accentColor);
      await this.accentColorPicker.fill(accentColor);
    }
    
    if (fontFamily !== undefined) {
      await this.fontFamilySelect.selectOption(fontFamily);
    }
  }

  /**
   * Upload store logo
   * @param filePath - Path to logo file
   */
  async uploadLogo(filePath: string): Promise<void> {
    await this.logoUpload.setInputFiles(filePath);
    
    // Wait for upload to complete
    await expect(this.logoUploading).not.toBeVisible({ timeout: 10000 });
    await expect(this.logoPreview).toBeVisible();
  }

  /**
   * Remove current logo
   */
  async removeCurrentLogo(): Promise<void> {
    await this.removeLogoButton.click();
    await expect(this.logoPreview).not.toBeVisible();
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Cancel changes and go back
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Reset form to original values
   */
  async reset(): Promise<void> {
    await this.resetButton.click();
  }

  /**
   * Clear a specific field
   * @param fieldName - Name of field to clear
   */
  async clearField(fieldName: string): Promise<void> {
    const field = this.page.locator(`input#${fieldName}, textarea#${fieldName}, select#${fieldName}`);
    await field.clear();
  }

  /**
   * Get name field error message
   * @returns Name error locator
   */
  getNameError(): Locator {
    return this.nameError;
  }

  /**
   * Get email field error message
   * @returns Email error locator
   */
  getEmailError(): Locator {
    return this.emailError;
  }

  /**
   * Get country field error message
   * @returns Country error locator
   */
  getCountryError(): Locator {
    return this.countryError;
  }

  /**
   * Get form-level error message
   * @returns Form error locator
   */
  getFormError(): Locator {
    return this.formError;
  }

  /**
   * Get success message
   * @returns Success message locator
   */
  getSuccessMessage(): Locator {
    return this.successMessage;
  }

  /**
   * Check if form is in saving state
   * @returns True if form is saving
   */
  async isSaving(): Promise<boolean> {
    return await this.savingIndicator.isVisible();
  }

  /**
   * Check if form has unsaved changes
   * @returns True if there are unsaved changes
   */
  async hasUnsavedChanges(): Promise<boolean> {
    return await this.unsavedChanges.isVisible();
  }

  /**
   * Check if submit button is disabled
   * @returns True if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Check if submit button shows loading state
   * @returns True if submit button is loading
   */
  async isSubmitLoading(): Promise<boolean> {
    const text = await this.submitButton.textContent();
    return text?.includes('Updating') || text?.includes('Saving') || text?.includes('...') || false;
  }

  /**
   * Get description character count
   * @returns Character count text
   */
  async getDescriptionCharacterCount(): Promise<string> {
    return await this.descriptionCharCount.textContent() || '';
  }

  /**
   * Verify all required sections are visible
   */
  async verifyFormSections(): Promise<void> {
    await expect(this.basicInfoSection).toBeVisible();
    await expect(this.addressSection).toBeVisible();
    await expect(this.localizationSection).toBeVisible();
    await expect(this.themeSection).toBeVisible();
  }

  /**
   * Verify form validation with empty required fields
   */
  async verifyRequiredFieldValidation(): Promise<void> {
    // Clear required fields
    await this.nameInput.clear();
    await this.emailInput.clear();
    await this.countrySelect.selectOption('');
    
    // Try to submit
    await this.submit();
    
    // Verify validation errors appear
    await expect(this.nameError).toBeVisible();
    await expect(this.emailError).toBeVisible();
    await expect(this.countryError).toBeVisible();
  }

  /**
   * Test color input validation
   * @param colorField - Color field name
   * @param invalidColor - Invalid color value
   */
  async testColorValidation(colorField: string, invalidColor: string): Promise<void> {
    const colorInput = this.page.locator(`input#${colorField}[type="text"]`);
    const colorError = this.page.locator(`#${colorField}-error`);
    
    await colorInput.fill(invalidColor);
    await colorInput.blur();
    
    await expect(colorError).toBeVisible();
  }

  /**
   * Test phone number validation
   * @param invalidPhone - Invalid phone number
   */
  async testPhoneValidation(invalidPhone: string): Promise<void> {
    await this.phoneInput.fill(invalidPhone);
    await this.phoneInput.blur();
    
    await expect(this.phoneError).toBeVisible();
  }

  /**
   * Test website URL validation
   * @param invalidWebsite - Invalid website URL
   */
  async testWebsiteValidation(invalidWebsite: string): Promise<void> {
    await this.websiteInput.fill(invalidWebsite);
    await this.websiteInput.blur();
    
    await expect(this.websiteError).toBeVisible();
  }

  /**
   * Verify keyboard navigation works correctly
   */
  async verifyKeyboardNavigation(): Promise<void> {
    // Focus name input
    await this.nameInput.focus();
    await expect(this.nameInput).toBeFocused();
    
    // Tab through form fields
    await this.page.keyboard.press('Tab');
    await expect(this.emailInput).toBeFocused();
    
    await this.page.keyboard.press('Tab');
    await expect(this.descriptionTextarea).toBeFocused();
  }

  /**
   * Submit form using Enter key
   */
  async submitWithEnter(): Promise<void> {
    await this.submitButton.focus();
    await this.page.keyboard.press('Enter');
  }

  /**
   * Fill complete valid form for testing
   * @param options - Form data options
   */
  async fillValidForm(options: {
    name?: string;
    description?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    currency?: string;
    timezone?: string;
    locale?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
  } = {}): Promise<void> {
    const {
      name = 'Updated Test Store',
      description = 'Updated test store description',
      phone = '+1-555-123-4567',
      website = 'https://updated.example.com',
      address = '456 Updated Street',
      city = 'Updated City',
      state = 'UP',
      postalCode = '54321',
      country = 'US',
      currency = 'USD',
      timezone = 'UTC',
      locale = 'en',
      primaryColor = '#FF6B6B',
      secondaryColor = '#4ECDC4',
      accentColor = '#45B7D1',
      fontFamily = 'poppins',
    } = options;

    await this.fillBasicInfo(name, description, phone, website);
    await this.fillAddress(address, city, state, postalCode, country);
    await this.fillLocalization(currency, timezone, locale);
    await this.fillThemeSettings(primaryColor, secondaryColor, accentColor, fontFamily);
  }

  /**
   * Wait for form to auto-save (if applicable)
   */
  async waitForAutoSave(): Promise<void> {
    // Wait for auto-save indicator to appear and disappear
    try {
      await expect(this.savingIndicator).toBeVisible({ timeout: 2000 });
      await expect(this.savingIndicator).not.toBeVisible({ timeout: 5000 });
    } catch {
      // Auto-save might complete too quickly to detect
    }
  }

  /**
   * Verify theme color previews are updated
   * @param primaryColor - Expected primary color
   * @param secondaryColor - Expected secondary color  
   * @param accentColor - Expected accent color
   */
  async verifyColorPreviews(
    primaryColor?: string,
    secondaryColor?: string,
    accentColor?: string
  ): Promise<void> {
    if (primaryColor) {
      await expect(this.primaryColorPicker).toHaveValue(primaryColor);
    }
    
    if (secondaryColor) {
      await expect(this.secondaryColorPicker).toHaveValue(secondaryColor);
    }
    
    if (accentColor) {
      await expect(this.accentColorPicker).toHaveValue(accentColor);
    }
  }
}