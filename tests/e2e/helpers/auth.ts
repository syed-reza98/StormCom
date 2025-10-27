// tests/e2e/helpers/auth.ts
// Authentication helpers for E2E tests

import { Page } from '@playwright/test';

export async function loginAsStoreOwner(page: Page) {
  // Navigate to login page
  await page.goto('/auth/signin');
  
  // Fill in credentials
  await page.fill('[data-testid="email-input"]', 'owner@teststore.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  
  // Submit login form
  await page.click('[data-testid="signin-button"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/);
  
  // Verify login success
  await page.waitForSelector('[data-testid="user-menu"]');
}

export async function loginAsCustomer(page: Page) {
  await page.goto('/auth/signin');
  
  await page.fill('[data-testid="email-input"]', 'customer@test.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  
  await page.click('[data-testid="signin-button"]');
  
  // Wait for redirect to storefront
  await page.waitForURL(/\//);
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  
  // Wait for redirect to home page
  await page.waitForURL(/\/$/);
}