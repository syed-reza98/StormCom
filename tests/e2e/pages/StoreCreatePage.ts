/**
 * Page Object Model for Store Create Page
 * 
 * Provides selectors and methods for interacting with the store creation form
 * including validation, form submission, and error handling.
 */

import { Page, Locator, expect } from '@playwright/test';

export class StoreCreatePage {
  readonly page: Page;
  
  // Form selectors
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly subdomainInput: Locator;
  readonly descriptionTextarea: Locator;
  readonly phoneInput: Locator;
  readonly websiteInput: Locator;
  
  // Address selectors
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly postalCodeInput: Locator;
  readonly countrySelect: Locator;
  
  // Localization selectors
  readonly currencySelect: Locator;
  readonly timezoneSelect: Locator;
  readonly localeSelect: Locator;
  
  // Action buttons
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly saveAsDraftButton: Locator;
  
  // Error message selectors
  readonly nameError: Locator;
  readonly emailError: Locator;
  readonly subdomainError: Locator;
  readonly descriptionError: Locator;
  readonly countryError: Locator;
  readonly currencyError: Locator;
  readonly timezoneError: Locator;
  readonly localeError: Locator;
  readonly formError: Locator;
  
  // Validation indicators
  readonly subdomainAvailable: Locator;
  readonly subdomainUnavailable: Locator;
  readonly subdomainChecking: Locator;
  
  // Preview selectors
  readonly storePreview: Locator;
  readonly subdomainPreview: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Basic information
    this.nameInput = page.locator('input#name');
    this.emailInput = page.locator('input#email');
    this.subdomainInput = page.locator('input#subdomain');
    this.descriptionTextarea = page.locator('textarea#description');
    this.phoneInput = page.locator('input#phone');
    this.websiteInput = page.locator('input#website');
    
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
    
    // Buttons
    this.submitButton = page.locator('button[type="submit"]');
    this.cancelButton = page.locator('button[type="button"]').filter({ hasText: /cancel/i });
    this.saveAsDraftButton = page.locator('button').filter({ hasText: /save.*draft/i });
    
    // Error messages
    this.nameError = page.locator('#name-error');
    this.emailError = page.locator('#email-error');
    this.subdomainError = page.locator('#subdomain-error');
    this.descriptionError = page.locator('#description-error');
    this.countryError = page.locator('#country-error');
    this.currencyError = page.locator('#currency-error');
    this.timezoneError = page.locator('#timezone-error');
    this.localeError = page.locator('#locale-error');
    this.formError = page.locator('[role="alert"]').first();
    
    // Validation indicators
    this.subdomainAvailable = page.locator('[data-testid="subdomain-available"]');
    this.subdomainUnavailable = page.locator('[data-testid="subdomain-unavailable"]');
    this.subdomainChecking = page.locator('[data-testid="subdomain-checking"]');
    
    // Preview
    this.storePreview = page.locator('[data-testid="store-preview"]');
    this.subdomainPreview = page.locator('[data-testid="subdomain-preview"]');
  }

  /**
   * Navigate to store create page
   */
  async goto(): Promise<void> {
    await this.page.goto('/dashboard/stores/create');
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: /create.*store/i })).toBeVisible();
    await expect(this.submitButton).toBeVisible();
    await expect(this.nameInput).toBeVisible();
  }

  /**
   * Fill basic store information
   * @param name - Store name
   * @param email - Store email
   * @param subdomain - Store subdomain
   * @param description - Optional description
   */
  async fillBasicInfo(
    name: string,
    email: string,
    subdomain: string,
    description?: string
  ): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.subdomainInput.fill(subdomain);
    
    if (description) {
      await this.descriptionTextarea.fill(description);
    }
    
    // Wait for subdomain validation
    await this.waitForSubdomainValidation();
  }

  /**
   * Fill contact information
   * @param phone - Phone number
   * @param website - Website URL
   */
  async fillContactInfo(phone?: string, website?: string): Promise<void> {
    if (phone) {
      await this.phoneInput.fill(phone);
    }
    
    if (website) {
      await this.websiteInput.fill(website);
    }
  }

  /**
   * Fill address information
   * @param address - Street address
   * @param city - City
   * @param state - State/Province
   * @param postalCode - Postal/ZIP code
   */
  async fillAddress(
    address?: string,
    city?: string,
    state?: string,
    postalCode?: string
  ): Promise<void> {
    if (address) {
      await this.addressInput.fill(address);
    }
    
    if (city) {
      await this.cityInput.fill(city);
    }
    
    if (state) {
      await this.stateInput.fill(state);
    }
    
    if (postalCode) {
      await this.postalCodeInput.fill(postalCode);
    }
  }

  /**
   * Fill localization settings
   * @param country - Country code
   * @param currency - Currency code
   * @param timezone - Timezone
   * @param locale - Locale code
   */
  async fillLocalization(
    country: string,
    currency: string,
    timezone: string,
    locale: string
  ): Promise<void> {
    await this.countrySelect.selectOption(country);
    await this.currencySelect.selectOption(currency);
    await this.timezoneSelect.selectOption(timezone);
    await this.localeSelect.selectOption(locale);
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Cancel form and return to store list
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Save form as draft
   */
  async saveAsDraft(): Promise<void> {
    await this.saveAsDraftButton.click();
  }

  /**
   * Wait for subdomain validation to complete
   */
  async waitForSubdomainValidation(): Promise<void> {
    // Wait for checking indicator to appear and disappear
    try {
      await expect(this.subdomainChecking).toBeVisible({ timeout: 1000 });
      await expect(this.subdomainChecking).not.toBeVisible({ timeout: 5000 });
    } catch {
      // Validation might complete too quickly to detect
    }
  }

  /**
   * Check if subdomain is available
   * @returns True if subdomain is available
   */
  async isSubdomainAvailable(): Promise<boolean> {
    return await this.subdomainAvailable.isVisible();
  }

  /**
   * Check if subdomain is unavailable
   * @returns True if subdomain is taken
   */
  async isSubdomainUnavailable(): Promise<boolean> {
    return await this.subdomainUnavailable.isVisible();
  }

  /**
   * Get subdomain error message
   * @returns Subdomain error locator
   */
  getSubdomainError(): Locator {
    return this.subdomainError;
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
    return text?.includes('Creating') || text?.includes('...') || false;
  }

  /**
   * Get subdomain preview URL
   * @returns Preview URL text
   */
  async getSubdomainPreview(): Promise<string> {
    return await this.subdomainPreview.textContent() || '';
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
   * Verify form validation on submit with empty fields
   */
  async verifyRequiredFieldValidation(): Promise<void> {
    // Clear required fields
    await this.nameInput.clear();
    await this.emailInput.clear();
    await this.subdomainInput.clear();
    
    // Try to submit
    await this.submit();
    
    // Verify validation errors appear
    await expect(this.nameError).toBeVisible();
    await expect(this.emailError).toBeVisible();
    await expect(this.subdomainError).toBeVisible();
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
    await expect(this.subdomainInput).toBeFocused();
    
    await this.page.keyboard.press('Tab');
    await expect(this.descriptionTextarea).toBeFocused();
  }

  /**
   * Submit form using Enter key
   */
  async submitWithEnter(): Promise<void> {
    // Focus submit button and press Enter
    await this.submitButton.focus();
    await this.page.keyboard.press('Enter');
  }

  /**
   * Test email validation with invalid email
   * @param invalidEmail - Invalid email to test
   */
  async testEmailValidation(invalidEmail: string): Promise<void> {
    await this.emailInput.fill(invalidEmail);
    await this.emailInput.blur(); // Trigger validation
    
    // Wait for validation error
    await expect(this.emailError).toBeVisible();
  }

  /**
   * Test subdomain validation with invalid subdomain
   * @param invalidSubdomain - Invalid subdomain to test
   */
  async testSubdomainValidation(invalidSubdomain: string): Promise<void> {
    await this.subdomainInput.fill(invalidSubdomain);
    await this.subdomainInput.blur(); // Trigger validation
    
    // Wait for validation error
    await expect(this.subdomainError).toBeVisible();
  }

  /**
   * Test form with maximum length inputs
   */
  async testMaxLengthValidation(): Promise<void> {
    // Test name max length (100 chars)
    const longName = 'a'.repeat(101);
    await this.nameInput.fill(longName);
    await this.nameInput.blur();
    await expect(this.nameError).toBeVisible();
    
    // Test description max length (500 chars)
    const longDescription = 'a'.repeat(501);
    await this.descriptionTextarea.fill(longDescription);
    await this.descriptionTextarea.blur();
    await expect(this.descriptionError).toBeVisible();
  }

  /**
   * Fill complete valid form for testing
   * @param options - Form data options
   */
  async fillValidForm(options: {
    name?: string;
    email?: string;
    subdomain?: string;
    description?: string;
    country?: string;
    currency?: string;
    timezone?: string;
    locale?: string;
  } = {}): Promise<void> {
    const {
      name = 'Test Store',
      email = 'test@stormcom-test.local',
      subdomain = `test-${Date.now()}`,
      description = 'A test store',
      country = 'US',
      currency = 'USD',
      timezone = 'UTC',
      locale = 'en',
    } = options;

    await this.fillBasicInfo(name, email, subdomain, description);
    await this.fillLocalization(country, currency, timezone, locale);
  }

  /**
   * Check character count display for textarea
   * @returns Character count text
   */
  async getDescriptionCharacterCount(): Promise<string> {
    const characterCount = this.page.locator('[data-testid="description-char-count"]');
    return await characterCount.textContent() || '';
  }

  /**
   * Verify that subdomain auto-generates from store name
   * @param storeName - Store name to test
   */
  async verifySubdomainAutoGeneration(storeName: string): Promise<void> {
    await this.nameInput.fill(storeName);
    await this.nameInput.blur();
    
    // Wait for subdomain to auto-populate
    await this.page.waitForTimeout(500);
    
    const subdomainValue = await this.subdomainInput.inputValue();
    expect(subdomainValue).toBeTruthy();
    expect(subdomainValue).toMatch(/^[a-z0-9-]+$/); // Valid subdomain format
  }
}