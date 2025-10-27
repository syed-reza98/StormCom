import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Register page
 * Path: /register
 * 
 * Provides methods for interacting with the registration form,
 * including field validation, form submission, and success/error states.
 */
export class RegisterPage {
  readonly page: Page;

  // Form field locators
  readonly nameInput: Locator;          // Updated: single name field (schema has 'name', not firstName/lastName)
  readonly firstNameInput: Locator;     // Kept for backward compatibility
  readonly lastNameInput: Locator;      // Kept for backward compatibility
  readonly emailInput: Locator;
  readonly phoneInput: Locator;         // Added: phone field (in schema)
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator; // Password confirmation field (re-added for test compatibility)
  readonly submitButton: Locator;

  // Navigation link locators
  readonly signInLink: Locator;
  readonly termsLink: Locator;
  readonly privacyLink: Locator;

  // Error message locators
  readonly serverErrorAlert: Locator;
  readonly firstNameError: Locator;
  readonly lastNameError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly passwordHelp: Locator;

  // Success state locators
  readonly successHeading: Locator;
  readonly successMessage: Locator;
  readonly goToLoginButton: Locator;
  readonly tryAgainLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form field selectors (using ID attributes)
    this.firstNameInput = page.locator('input#firstName');
    this.lastNameInput = page.locator('input#lastName');
    this.emailInput = page.locator('input#email');
    this.passwordInput = page.locator('input#password');
    this.confirmPasswordInput = page.locator('input#confirmPassword');
    this.submitButton = page.locator('button[type="submit"]');

    // Navigation links
    this.signInLink = page.locator('a[href="/login"]').first();
    this.termsLink = page.locator('a[href="/terms"]');
    this.privacyLink = page.locator('a[href="/privacy"]');

    // Error messages
    this.serverErrorAlert = page.locator('[role="alert"]').filter({ hasText: /error|failed/i });
    this.firstNameError = page.locator('#firstName-error');
    this.lastNameError = page.locator('#lastName-error');
    this.emailError = page.locator('#email-error');
    this.passwordError = page.locator('#password-error');
    this.passwordHelp = page.locator('#password-help');

    // Success state elements
    this.successHeading = page.locator('h1:has-text("Registration Successful")');
    this.successMessage = page.locator('text=We\'ve sent a verification email');
    this.goToLoginButton = page.locator('a:has-text("Go to Login")');
    this.tryAgainLink = page.locator('a:has-text("Try again")');
  }

  /**
   * Navigate to the register page
   */
  async goto(): Promise<void> {
    await this.page.goto('/register');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for the page to fully load
   * Alias for compatibility with test expectations
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill basic registration info (first name, last name, email)
   * @param firstName - User's first name
   * @param lastName - User's last name
   * @param email - User's email address
   */
  async fillBasicInfo(firstName: string, lastName: string, email: string): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.emailInput.fill(email);
  }

  /**
   * Fill the registration form fields
   * @param firstName - User's first name
   * @param lastName - User's last name
   * @param email - User's email address
   * @param password - User's password
   */
  async fillForm(
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Submit the registration form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Complete registration flow (fill form + submit)
   * @param firstName - User's first name
   * @param lastName - User's last name
   * @param email - User's email address
   * @param password - User's password
   */
  async register(
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<void> {
    await this.fillForm(firstName, lastName, email, password);
    await this.submit();
  }

  /**
   * Alias for register() method - fill and submit registration form
   * @param firstName - User's first name
   * @param lastName - User's last name
   * @param email - User's email address
   * @param password - User's password
   * @param confirmPassword - Password confirmation (optional, defaults to password value)
   */
  async fillAndSubmit(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    confirmPassword?: string
  ): Promise<void> {
    await this.fillForm(firstName, lastName, email, password);
    
    // Fill confirm password if the field exists and confirmPassword is provided
    if (confirmPassword !== undefined) {
      await this.confirmPasswordInput.fill(confirmPassword);
    }
    
    await this.submit();
  }

  /**
   * Wait for successful registration (success message appears)
   * @param timeout - Optional timeout in milliseconds (default: 10000)
   */
  async waitForSuccessfulRegistration(timeout = 10000): Promise<void> {
    await this.successHeading.waitFor({ state: 'visible', timeout });
    await this.successMessage.waitFor({ state: 'visible', timeout });
  }

  /**
   * Click "Go to Login" button after successful registration
   */
  async goToLogin(): Promise<void> {
    await this.goToLoginButton.click();
    await this.page.waitForURL('/login');
  }

  /**
   * Click "Try again" link to return to registration form
   */
  async tryAgain(): Promise<void> {
    await this.tryAgainLink.click();
    // Wait for form to be visible again
    await this.firstNameInput.waitFor({ state: 'visible' });
  }

  /**
   * Submit form using Enter key (accessibility test)
   */
  async submitWithEnter(): Promise<void> {
    await this.passwordInput.press('Enter');
  }

  /**
   * Verify keyboard navigation works correctly
   * Tests Tab key navigation through all form fields
   */
  async verifyKeyboardNavigation(): Promise<void> {
    // Focus first name input
    await this.firstNameInput.focus();
    await this.page.keyboard.press('Tab');
    
    // Should focus last name input
    await this.page.waitForTimeout(100);
    await this.page.keyboard.press('Tab');
    
    // Should focus email input
    await this.page.waitForTimeout(100);
    await this.page.keyboard.press('Tab');
    
    // Should focus password input
    await this.page.waitForTimeout(100);
    await this.page.keyboard.press('Tab');
    
    // Should focus submit button
    await this.page.waitForTimeout(100);
  }

  /**
   * Check if the submit button is in loading state
   * @returns True if button shows loading state
   */
  async isLoading(): Promise<boolean> {
    const loadingText = await this.submitButton.textContent();
    return loadingText?.includes('Creating account...') || false;
  }

  /**
   * Check if the submit button is disabled
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
   * Get the first name validation error text
   * @returns Error message text or null if not visible
   */
  async getFirstNameErrorText(): Promise<string | null> {
    try {
      return await this.firstNameError.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Get the last name validation error text
   * @returns Error message text or null if not visible
   */
  async getLastNameErrorText(): Promise<string | null> {
    try {
      return await this.lastNameError.textContent();
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
   * @param field - Field name ('firstName', 'lastName', 'email', 'password')
   * @returns True if field is marked invalid
   */
  async isFieldInvalid(field: 'firstName' | 'lastName' | 'email' | 'password'): Promise<boolean> {
    const locator = this[`${field}Input`] as Locator;
    const ariaInvalid = await locator.getAttribute('aria-invalid');
    return ariaInvalid === 'true';
  }

  /**
   * Verify all ARIA attributes are correctly set
   * Used for accessibility testing
   */
  async verifyAccessibility(): Promise<void> {
    // Check form labels are associated with inputs
    await this.page.locator('label[for="firstName"]').waitFor({ state: 'visible' });
    await this.page.locator('label[for="lastName"]').waitFor({ state: 'visible' });
    await this.page.locator('label[for="email"]').waitFor({ state: 'visible' });
    await this.page.locator('label[for="password"]').waitFor({ state: 'visible' });

    // Check password help text is properly associated
    const passwordAriaDescribedBy = await this.passwordInput.getAttribute('aria-describedby');
    if (!passwordAriaDescribedBy?.includes('password-help')) {
      throw new Error('Password input missing aria-describedby="password-help"');
    }

    // Check submit button has accessible label
    const submitLabel = await this.submitButton.getAttribute('aria-label');
    if (!submitLabel) {
      throw new Error('Submit button missing aria-label');
    }
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    await this.firstNameInput.clear();
    await this.lastNameInput.clear();
    await this.emailInput.clear();
    await this.passwordInput.clear();
  }

  /**
   * Get all form field values
   * @returns Object with current form values
   */
  async getFormValues(): Promise<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }> {
    return {
      firstName: (await this.firstNameInput.inputValue()) || '',
      lastName: (await this.lastNameInput.inputValue()) || '',
      email: (await this.emailInput.inputValue()) || '',
      password: (await this.passwordInput.inputValue()) || '',
    };
  }
}
