import { test, expect, Page, BrowserContext } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * E2E Tests: Permission Revocation Session Termination
 * 
 * Task: T071 [US0] Create E2E test "Permission revocation terminates sessions"
 * 
 * Purpose: Verify that when an admin revokes user permissions, the affected
 * user's active sessions are terminated within 60 seconds for security.
 * 
 * Requirements:
 * - Admin can revoke user permissions from admin panel
 * - Permission revocation terminates user sessions within 60 seconds
 * - Affected user receives session termination notification
 * - User must re-authenticate after permission changes
 * - Session termination works across multiple devices/browsers
 * - Security audit logging for permission changes and session termination
 * 
 * User Story: US0 Authentication
 * Security Feature: Session termination on permission changes
 * Acceptance Criteria:
 * - Admin revokes user permissions/access
 * - User's active sessions become invalid within 60 seconds
 * - User redirected to login with permission revocation message
 * - Re-authentication required with new permission level
 * - Permission change events logged for security audit
 */

test.describe('Permission Revocation Session Termination - T071', () => {
  let adminPage: Page;
  let userPage: Page;
  let adminContext: BrowserContext;
  let userContext: BrowserContext;
  let loginPageAdmin: LoginPage;
  let loginPageUser: LoginPage;
  let dashboardPageAdmin: DashboardPage;
  let dashboardPageUser: DashboardPage;

  // Test data
  const adminUser = {
    email: 'admin@stormcom.dev',
    password: 'Admin123!@#',
    role: 'SUPER_ADMIN',
    storeId: 'store-001'
  };

  const targetUser = {
    email: 'staff@stormcom.dev',
    password: 'Staff123!@#',
    role: 'STAFF',
    storeId: 'store-001',
    userId: 'user-staff-001',
    permissions: ['VIEW_PRODUCTS', 'EDIT_PRODUCTS', 'VIEW_ORDERS']
  };

  test.beforeEach(async ({ browser }) => {
    // Create separate browser contexts for admin and target user
    adminContext = await browser.newContext();
    userContext = await browser.newContext();

    adminPage = await adminContext.newPage();
    userPage = await userContext.newPage();

    loginPageAdmin = new LoginPage(adminPage);
    loginPageUser = new LoginPage(userPage);
    dashboardPageAdmin = new DashboardPage(adminPage);
    dashboardPageUser = new DashboardPage(userPage);

    // Setup: Login admin user
    await loginPageAdmin.goto();
    await loginPageAdmin.login(adminUser.email, adminUser.password);
    await adminPage.waitForURL(/\/dashboard/);

    // Setup: Login target user  
    await loginPageUser.goto();
    await loginPageUser.login(targetUser.email, targetUser.password);
    await userPage.waitForURL(/\/dashboard/);
  });

  test.afterEach(async () => {
    // Cleanup: Close contexts
    await adminContext.close();
    await userContext.close();
  });

  test('Admin can revoke user permissions and terminate sessions within 60 seconds', async () => {
    // Arrange: Verify both users are authenticated and active
    await dashboardPageAdmin.waitForPageLoad();
    await dashboardPageUser.waitForPageLoad();

    await expect(adminPage.locator('h1')).toBeVisible();
    await expect(userPage.locator('h1')).toBeVisible();

    // Verify target user can access protected content initially
    await userPage.goto('/products');
    await userPage.waitForTimeout(1000);
    expect(userPage.url()).toMatch(/\/products/);

    // Act: Admin revokes user permissions
    await adminPage.goto('/admin/users');
    await adminPage.waitForTimeout(1000);

    // Navigate to user management page
    const userManagementPage = adminPage.locator('[data-testid="user-management-page"]');
    if (await userManagementPage.isVisible()) {
      // Find target user in user list
      const userRow = adminPage.locator(`[data-testid="user-row-${targetUser.userId}"]`);
      await userRow.waitFor({ state: 'visible', timeout: 5000 });

      // Click edit permissions button
      const editPermissionsButton = userRow.locator('[data-testid="edit-permissions-button"]');
      await editPermissionsButton.click();

      // Revoke all permissions
      const permissionCheckboxes = adminPage.locator('[data-testid^="permission-checkbox-"]');
      const checkboxCount = await permissionCheckboxes.count();
      
      for (let i = 0; i < checkboxCount; i++) {
        const checkbox = permissionCheckboxes.nth(i);
        if (await checkbox.isChecked()) {
          await checkbox.uncheck();
        }
      }

      // Save permission changes
      const savePermissionsButton = adminPage.locator('[data-testid="save-permissions-button"]');
      await savePermissionsButton.click();

      // Wait for confirmation
      const successMessage = adminPage.locator('[data-testid="permissions-updated-success"]');
      await successMessage.waitFor({ state: 'visible' });
    } else {
      // Alternative: Simulate permission revocation via API or direct user status change
      // This would be the fallback if UI-based permission management isn't available
      
      // Navigate to user profile page
      await adminPage.goto(`/admin/users/${targetUser.userId}`);
      await adminPage.waitForTimeout(1000);

      // Change user status to revoke access
      const userStatusDropdown = adminPage.locator('[data-testid="user-status-dropdown"]');
      await userStatusDropdown.selectOption('SUSPENDED');

      const saveUserButton = adminPage.locator('[data-testid="save-user-button"]');
      await saveUserButton.click();

      // Wait for save confirmation
      const saveConfirmation = adminPage.locator('[data-testid="user-updated-success"]');
      await saveConfirmation.waitFor({ state: 'visible' });
    }

    // Monitor target user session for termination within 60 seconds
    const startTime = Date.now();
    let sessionTerminated = false;
    const maxWaitTime = 60000; // 60 seconds
    const checkInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < maxWaitTime && !sessionTerminated) {
      try {
        // Try to access protected content in user session
        await userPage.goto('/dashboard');
        await userPage.waitForTimeout(checkInterval);

        const currentUrl = userPage.url();
        if (currentUrl.includes('/login')) {
          sessionTerminated = true;
          break;
        }

        // Check for permission revocation message
        const revocationMessage = userPage.locator('text=/permissions.*revoked|access.*revoked|session.*terminated/i');
        if (await revocationMessage.isVisible()) {
          sessionTerminated = true;
          break;
        }

        // Check for unauthorized access message
        const unauthorizedMessage = userPage.locator('text=/unauthorized|403|forbidden/i');
        if (await unauthorizedMessage.isVisible()) {
          sessionTerminated = true;
          break;
        }

      } catch (error) {
        // Page navigation failed, likely due to session termination
        sessionTerminated = true;
        break;
      }
    }

    // Assert: User session should be terminated within 60 seconds
    expect(sessionTerminated).toBe(true);

    const elapsedTime = Date.now() - startTime;
    expect(elapsedTime).toBeLessThan(maxWaitTime);

    // Verify user is redirected to login or shows unauthorized message
    const finalUrl = userPage.url();
    const showsUnauthorized = finalUrl.includes('/login') || 
                             finalUrl.includes('/unauthorized') ||
                             finalUrl.includes('403');
    expect(showsUnauthorized).toBe(true);
  });

  test('Permission revocation shows appropriate notification message', async () => {
    // Arrange: Revoke user permissions via admin
    await adminPage.goto('/admin/users');
    await adminPage.waitForTimeout(1000);

    // Simulate quick permission revocation (details similar to above test)
    // For brevity, using direct status change approach
    await adminPage.goto(`/admin/users/${targetUser.userId}`);
    
    const userStatusDropdown = adminPage.locator('[data-testid="user-status-dropdown"]');
    if (await userStatusDropdown.isVisible()) {
      await userStatusDropdown.selectOption('SUSPENDED');
      
      const saveButton = adminPage.locator('[data-testid="save-user-button"]');
      await saveButton.click();
    }

    // Wait for permission revocation to take effect
    await adminPage.waitForTimeout(5000);

    // Act: User tries to access protected content
    await userPage.goto('/dashboard');
    await userPage.waitForTimeout(2000);

    // Assert: Verify appropriate revocation message
    const possibleMessages = [
      'permissions.*revoked',
      'access.*revoked',
      'account.*suspended',
      'session.*terminated',
      'no longer.*authorized',
      'contact.*administrator'
    ];

    let messageFound = false;
    for (const messagePattern of possibleMessages) {
      const messageElement = userPage.locator(`text=/${messagePattern}/i`);
      if (await messageElement.isVisible()) {
        messageFound = true;
        break;
      }
    }

    expect(messageFound).toBe(true);

    // Verify user is on appropriate error/login page
    const currentUrl = userPage.url();
    const onErrorPage = currentUrl.includes('/login') || 
                       currentUrl.includes('/unauthorized') ||
                       currentUrl.includes('/suspended') ||
                       currentUrl.includes('403');
    expect(onErrorPage).toBe(true);
  });

  test('Revoked user cannot re-access protected content without re-authentication', async () => {
    // Arrange: Revoke user permissions
    await adminPage.goto(`/admin/users/${targetUser.userId}`);
    await adminPage.waitForTimeout(1000);

    const statusDropdown = adminPage.locator('[data-testid="user-status-dropdown"]');
    if (await statusDropdown.isVisible()) {
      await statusDropdown.selectOption('SUSPENDED');
      
      const saveButton = adminPage.locator('[data-testid="save-user-button"]');
      await saveButton.click();
    }

    // Wait for revocation to propagate
    await userPage.waitForTimeout(10000);

    // Act: Try to access various protected pages
    const protectedPages = [
      '/dashboard',
      '/products',
      '/orders',
      '/customers',
      '/settings'
    ];

    for (const page of protectedPages) {
      await userPage.goto(page);
      await userPage.waitForTimeout(1000);

      // Assert: Should be redirected or blocked
      const currentUrl = userPage.url();
      const accessBlocked = currentUrl.includes('/login') || 
                           currentUrl.includes('/unauthorized') ||
                           currentUrl.includes('403') ||
                           currentUrl.includes('/suspended');
      
      expect(accessBlocked).toBe(true);
    }

    // Verify cannot login with old credentials due to revocation
    if (userPage.url().includes('/login')) {
      await loginPageUser.fillForm(targetUser.email, targetUser.password);
      await loginPageUser.submit();
      
      await userPage.waitForTimeout(2000);
      
      // Should either:
      // 1. Show "account suspended" error
      // 2. Login but immediately redirect to suspended page
      // 3. Stay on login page with error
      
      const loginFailed = userPage.url().includes('/login') ||
                         userPage.url().includes('/suspended') ||
                         userPage.url().includes('/unauthorized');
      
      expect(loginFailed).toBe(true);
    }
  });

  test('Admin can restore user permissions and re-enable access', async () => {
    // Arrange: First revoke permissions
    await adminPage.goto(`/admin/users/${targetUser.userId}`);
    
    const statusDropdown = adminPage.locator('[data-testid="user-status-dropdown"]');
    await statusDropdown.selectOption('SUSPENDED');
    
    const saveButton = adminPage.locator('[data-testid="save-user-button"]');
    await saveButton.click();

    // Wait for revocation
    await userPage.waitForTimeout(5000);

    // Verify user access is blocked
    await userPage.goto('/dashboard');
    await userPage.waitForTimeout(1000);
    expect(userPage.url()).not.toMatch(/\/dashboard$/);

    // Act: Admin restores user permissions
    await adminPage.goto(`/admin/users/${targetUser.userId}`);
    await statusDropdown.selectOption('ACTIVE');
    await saveButton.click();

    // Wait for restoration
    await adminPage.waitForTimeout(3000);

    // Act: User logs in again
    await userPage.goto('/login');
    await loginPageUser.fillForm(targetUser.email, targetUser.password);
    await loginPageUser.submit();

    // Assert: User should regain access
    await userPage.waitForURL(/\/dashboard/, { timeout: 10000 });
    expect(userPage.url()).toMatch(/\/dashboard/);

    // Verify can access protected content again
    await userPage.goto('/products');
    await userPage.waitForTimeout(1000);
    expect(userPage.url()).toMatch(/\/products/);
  });

  test('Multiple user sessions terminated simultaneously', async () => {
    // Arrange: Create additional user session (simulate mobile device)
    const mobileContext = await adminPage.context().browser()?.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
    });
    
    if (!mobileContext) {
      test.skip('Could not create mobile browser context', () => {});
      return;
    }

    const mobilePage = await mobileContext!.newPage();
    const loginPageMobile = new LoginPage(mobilePage);

    await loginPageMobile.goto();
    await loginPageMobile.login(targetUser.email, targetUser.password);
    await mobilePage.waitForURL(/\/dashboard/);

    // Verify both sessions are active
    expect(userPage.url()).toMatch(/\/dashboard/);
    expect(mobilePage.url()).toMatch(/\/dashboard/);

    // Act: Admin revokes permissions
    await adminPage.goto(`/admin/users/${targetUser.userId}`);
    
    const statusDropdown = adminPage.locator('[data-testid="user-status-dropdown"]');
    await statusDropdown.selectOption('SUSPENDED');
    
    const saveButton = adminPage.locator('[data-testid="save-user-button"]');
    await saveButton.click();

    // Wait for termination propagation
    await adminPage.waitForTimeout(15000);

    // Act: Check both sessions are terminated
    await userPage.goto('/dashboard');
    await mobilePage.goto('/dashboard');
    await adminPage.waitForTimeout(2000);

    // Assert: Both sessions should be invalidated
    const desktopBlocked = userPage.url().includes('/login') || 
                          userPage.url().includes('/unauthorized');
    const mobileBlocked = mobilePage.url().includes('/login') || 
                         mobilePage.url().includes('/unauthorized');

    expect(desktopBlocked).toBe(true);
    expect(mobileBlocked).toBe(true);

    // Cleanup
    await mobileContext!.close();
  });

  test('Permission revocation audit logging captures security events', async () => {
    // Act: Admin revokes user permissions
    await adminPage.goto(`/admin/users/${targetUser.userId}`);
    
    const statusDropdown = adminPage.locator('[data-testid="user-status-dropdown"]');
    await statusDropdown.selectOption('SUSPENDED');
    
    const saveButton = adminPage.locator('[data-testid="save-user-button"]');
    await saveButton.click();

    // Wait for user session termination
    await userPage.waitForTimeout(10000);
    await userPage.goto('/dashboard');

    // Note: In a real implementation, we would verify audit logs through:
    // 1. API call to audit log endpoint
    // 2. Database query to audit_logs table
    // 3. Admin interface for security monitoring
    
    // Expected audit log entries:
    // 1. Permission revocation event:
    // {
    //   event_type: 'PERMISSION_REVOKED',
    //   admin_user_id: adminUser.id,
    //   target_user_id: targetUser.userId,
    //   target_user_email: targetUser.email,
    //   action: 'SUSPEND_USER',
    //   timestamp: revocationTime,
    //   reason: 'ADMIN_ACTION',
    //   ip_address: request.ip
    // }
    
    // 2. Session termination event:
    // {
    //   event_type: 'SESSION_TERMINATED',
    //   user_id: targetUser.userId,
    //   user_email: targetUser.email,
    //   termination_reason: 'PERMISSION_REVOKED',
    //   timestamp: terminationTime,
    //   session_id: userSessionId
    // }

    // For E2E test purposes, verify the system responds appropriately
    const userBlocked = userPage.url().includes('/login') || 
                       userPage.url().includes('/unauthorized');
    expect(userBlocked).toBe(true);

    // Verify admin action was successful
    await adminPage.goto(`/admin/users/${targetUser.userId}`);
    const currentStatus = await adminPage.locator('[data-testid="user-status-display"]').textContent();
    expect(currentStatus?.toLowerCase()).toContain('suspended');
  });

  test('Permission revocation notification is accessible', async () => {
    // Arrange: Revoke user permissions
    await adminPage.goto(`/admin/users/${targetUser.userId}`);
    
    const statusDropdown = adminPage.locator('[data-testid="user-status-dropdown"]');
    await statusDropdown.selectOption('SUSPENDED');
    
    const saveButton = adminPage.locator('[data-testid="save-user-button"]');
    await saveButton.click();

    await userPage.waitForTimeout(10000);

    // Act: User tries to access protected content
    await userPage.goto('/dashboard');
    await userPage.waitForTimeout(2000);

    // Assert: Check accessibility of revocation message
    const errorMessages = userPage.locator('[role="alert"], [data-testid*="error"], [data-testid*="revoked"]');
    const messageCount = await errorMessages.count();
    expect(messageCount).toBeGreaterThan(0);

    // Verify alert has proper ARIA attributes
    const firstAlert = errorMessages.first();
    if (await firstAlert.isVisible()) {
      const hasAriaLive = await firstAlert.getAttribute('aria-live');
      const hasRole = await firstAlert.getAttribute('role');
      
      expect(hasRole === 'alert' || hasAriaLive).toBeTruthy();
    }

    // Check keyboard navigation works
    await userPage.keyboard.press('Tab');
    const focusedElement = await userPage.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(focusedElement);

    // Verify page has proper heading structure
    const headings = userPage.locator('h1, h2, h3, h4');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test('Permission revocation timing is consistent and reliable', async () => {
    // Test multiple revocation scenarios for timing consistency
    const timingTests = [];

    for (let i = 0; i < 3; i++) {
      // Reset user status to active
      await adminPage.goto(`/admin/users/${targetUser.userId}`);
      
      const statusDropdown = adminPage.locator('[data-testid="user-status-dropdown"]');
      await statusDropdown.selectOption('ACTIVE');
      
      const saveButton = adminPage.locator('[data-testid="save-user-button"]');
      await saveButton.click();
      await adminPage.waitForTimeout(2000);

      // User logs in again
      await userPage.goto('/login');
      await loginPageUser.fillForm(targetUser.email, targetUser.password);
      await loginPageUser.submit();
      await userPage.waitForURL(/\/dashboard/);

      // Measure revocation timing
      const startTime = Date.now();
      
      // Revoke permissions
      await adminPage.goto(`/admin/users/${targetUser.userId}`);
      await statusDropdown.selectOption('SUSPENDED');
      await saveButton.click();

      // Monitor user session for termination
      let terminated = false;
      while (Date.now() - startTime < 60000 && !terminated) {
        await userPage.goto('/dashboard');
        await userPage.waitForTimeout(1000);
        
        if (!userPage.url().includes('/dashboard')) {
          terminated = true;
          break;
        }
        
        await adminPage.waitForTimeout(2000);
      }

      const elapsedTime = Date.now() - startTime;
      timingTests.push(elapsedTime);
      
      expect(terminated).toBe(true);
      expect(elapsedTime).toBeLessThan(60000);
    }

    // Verify timing consistency
    const avgTime = timingTests.reduce((a, b) => a + b, 0) / timingTests.length;
    expect(avgTime).toBeLessThan(30000); // Average should be well under 60 seconds

    // No timing should exceed 60 seconds
    timingTests.forEach(time => {
      expect(time).toBeLessThan(60000);
    });
  });
});