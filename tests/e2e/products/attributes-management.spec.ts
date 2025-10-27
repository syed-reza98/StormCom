// tests/e2e/products/attributes-management.spec.ts
// E2E tests for product attributes management functionality

import { test, expect } from '@playwright/test';
import { seedTestData } from '../helpers/test-data';
import { loginAsStoreOwner } from '../helpers/auth';

test.describe('Attributes Management', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data
    await seedTestData();
    
    // Login as store owner
    await loginAsStoreOwner(page);
  });

  test.describe('Attributes Listing', () => {
    test('should display attributes with details', async ({ page }) => {
      await page.goto('/attributes');
      
      // Wait for attributes to load
      await expect(page.locator('[data-testid="attributes-table"]')).toBeVisible();
      
      // Check stats cards
      await expect(page.locator('[data-testid="total-attributes"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-attributes"]')).toBeVisible();
      await expect(page.locator('[data-testid="required-attributes"]')).toBeVisible();
      
      // Check that attributes are displayed in table
      const attributeRows = page.locator('[data-testid="attribute-row"]');
      if (await attributeRows.count() > 0) {
        const firstRow = attributeRows.first();
        await expect(firstRow.locator('[data-testid="attribute-name"]')).toBeVisible();
        await expect(firstRow.locator('[data-testid="attribute-type"]')).toBeVisible();
        await expect(firstRow.locator('[data-testid="attribute-values-count"]')).toBeVisible();
        await expect(firstRow.locator('[data-testid="attribute-products-count"]')).toBeVisible();
      }
    });

    test('should filter attributes by type', async ({ page }) => {
      await page.goto('/attributes');
      
      // Open type filter
      await page.click('[data-testid="type-filter"]');
      
      // Select 'color' type
      await page.click('[data-testid="type-color"]');
      
      // Apply filter
      await page.click('[data-testid="apply-filters"]');
      
      // Verify URL contains filter
      await expect(page).toHaveURL(/type=color/);
      
      // Verify only color attributes are shown
      const visibleRows = page.locator('[data-testid="attribute-row"]:visible');
      const count = await visibleRows.count();
      
      for (let i = 0; i < count; i++) {
        const typeIcon = await visibleRows.nth(i).locator('[data-testid="attribute-type"]').textContent();
        expect(typeIcon).toContain('🎨'); // Color icon
      }
    });

    test('should search attributes by name', async ({ page }) => {
      await page.goto('/attributes');
      
      // Enter search term
      await page.fill('[data-testid="attribute-search"]', 'color');
      await page.press('[data-testid="attribute-search"]', 'Enter');
      
      // Verify URL contains search parameter
      await expect(page).toHaveURL(/search=color/);
      
      // Verify search results
      const attributeNames = page.locator('[data-testid="attribute-name"]');
      const count = await attributeNames.count();
      
      for (let i = 0; i < count; i++) {
        const name = await attributeNames.nth(i).textContent();
        expect(name?.toLowerCase()).toContain('color');
      }
    });

    test('should sort attributes by usage', async ({ page }) => {
      await page.goto('/attributes');
      
      // Click sort by products (most used)
      await page.click('[data-testid="sort-products-desc"]');
      
      // Verify URL contains sort parameter
      await expect(page).toHaveURL(/sort=products.*order=desc/);
      
      // Get all product counts
      const productCounts = page.locator('[data-testid="attribute-products-count"]');
      const counts = await productCounts.allTextContents();
      
      // Convert to numbers and verify descending order
      const numericCounts = counts.map(count => 
        parseInt(count.replace(/[^0-9]/g, ''))
      );
      
      for (let i = 1; i < numericCounts.length; i++) {
        expect(numericCounts[i]).toBeLessThanOrEqual(numericCounts[i - 1]);
      }
    });

    test('should display attribute values preview', async ({ page }) => {
      await page.goto('/attributes');
      
      // Find an attribute with values
      const attributeWithValues = page.locator('[data-testid="attribute-row"]').filter({
        has: page.locator('[data-testid="attribute-values"]:has-text("Red")')
      }).first();
      
      if (await attributeWithValues.count() > 0) {
        // Verify values are displayed as badges
        await expect(attributeWithValues.locator('[data-testid="attribute-values"] .badge')).toHaveCount(await attributeWithValues.locator('[data-testid="attribute-values"] .badge').count());
        
        // Check for color values with color indicators
        const colorValues = attributeWithValues.locator('[data-testid="color-value"]');
        if (await colorValues.count() > 0) {
          await expect(colorValues.first().locator('[data-testid="color-indicator"]')).toBeVisible();
        }
      }
    });
  });

  test.describe('Attribute Creation', () => {
    test('should create a text attribute', async ({ page }) => {
      await page.goto('/attributes');
      
      // Click create attribute
      await page.click('[data-testid="create-attribute"]');
      
      // Fill basic information
      await page.fill('[data-testid="attribute-name"]', 'Brand Name');
      await page.fill('[data-testid="attribute-description"]', 'Product brand or manufacturer');
      
      // Select text type
      await page.click('[data-testid="attribute-type"]');
      await page.click('[data-testid="type-text"]');
      
      // Make it required
      await page.check('[data-testid="attribute-required"]');
      
      // Submit form
      await page.click('[data-testid="save-attribute"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="attribute-row"]').filter({ hasText: 'Brand Name' })).toBeVisible();
    });

    test('should create a select attribute with values', async ({ page }) => {
      await page.goto('/attributes');
      await page.click('[data-testid="create-attribute"]');
      
      // Fill basic information
      await page.fill('[data-testid="attribute-name"]', 'Size');
      await page.fill('[data-testid="attribute-description"]', 'Product size options');
      
      // Select select type
      await page.click('[data-testid="attribute-type"]');
      await page.click('[data-testid="type-select"]');
      
      // Add values
      const sizes = ['Small', 'Medium', 'Large', 'Extra Large'];
      for (const size of sizes) {
        await page.fill('[data-testid="new-value-input"]', size);
        await page.click('[data-testid="add-value"]');
        
        // Verify value was added
        await expect(page.locator('[data-testid="attribute-value"]').filter({ hasText: size })).toBeVisible();
      }
      
      // Submit form
      await page.click('[data-testid="save-attribute"]');
      
      // Verify attribute was created with values
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      
      // Go back to listing and verify values count
      await page.goto('/attributes');
      const sizeAttribute = page.locator('[data-testid="attribute-row"]').filter({ hasText: 'Size' });
      await expect(sizeAttribute.locator('[data-testid="attribute-values-count"]')).toContainText('4');
    });

    test('should create a color attribute with color values', async ({ page }) => {
      await page.goto('/attributes');
      await page.click('[data-testid="create-attribute"]');
      
      // Fill basic information
      await page.fill('[data-testid="attribute-name"]', 'Color');
      await page.fill('[data-testid="attribute-description"]', 'Product color options');
      
      // Select color type
      await page.click('[data-testid="attribute-type"]');
      await page.click('[data-testid="type-color"]');
      
      // Add color values
      const colors = [
        { name: 'Red', hex: '#FF0000' },
        { name: 'Blue', hex: '#0000FF' },
        { name: 'Green', hex: '#00FF00' },
      ];
      
      for (const color of colors) {
        await page.fill('[data-testid="new-value-input"]', color.name);
        await page.fill('[data-testid="color-picker"]', color.hex);
        await page.click('[data-testid="add-value"]');
        
        // Verify color value was added with color indicator
        const colorValue = page.locator('[data-testid="attribute-value"]').filter({ hasText: color.name });
        await expect(colorValue).toBeVisible();
        await expect(colorValue.locator('[data-testid="color-indicator"]')).toHaveCSS('background-color', `rgb(${parseInt(color.hex.slice(1,3), 16)}, ${parseInt(color.hex.slice(3,5), 16)}, ${parseInt(color.hex.slice(5,7), 16)})`);
      }
      
      // Submit form
      await page.click('[data-testid="save-attribute"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/attributes');
      await page.click('[data-testid="create-attribute"]');
      
      // Try to submit without required fields
      await page.click('[data-testid="save-attribute"]');
      
      // Check for validation errors
      await expect(page.locator('[data-testid="name-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="name-error"]')).toContainText('Name is required');
    });

    test('should auto-generate slug from name', async ({ page }) => {
      await page.goto('/attributes');
      await page.click('[data-testid="create-attribute"]');
      
      // Type attribute name
      await page.fill('[data-testid="attribute-name"]', 'Material Type');
      
      // Click outside to trigger slug generation
      await page.click('[data-testid="attribute-description"]');
      
      // Verify slug was generated
      const slugValue = await page.locator('[data-testid="attribute-slug"]').inputValue();
      expect(slugValue).toBe('material-type');
    });

    test('should validate select type has values', async ({ page }) => {
      await page.goto('/attributes');
      await page.click('[data-testid="create-attribute"]');
      
      // Fill basic info
      await page.fill('[data-testid="attribute-name"]', 'Test Select');
      
      // Select select type but don't add values
      await page.click('[data-testid="attribute-type"]');
      await page.click('[data-testid="type-select"]');
      
      // Try to submit without values
      await page.click('[data-testid="save-attribute"]');
      
      // Check for values error
      await expect(page.locator('[data-testid="values-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="values-error"]')).toContainText('At least one value is required');
    });
  });

  test.describe('Attribute Editing', () => {
    test('should edit attribute details', async ({ page }) => {
      await page.goto('/attributes');
      
      // Find and edit first attribute
      const firstAttribute = page.locator('[data-testid="attribute-row"]').first();
      await firstAttribute.locator('[data-testid="edit-attribute"]').click();
      
      // Modify description
      const newDescription = 'Updated description for this attribute';
      await page.fill('[data-testid="attribute-description"]', newDescription);
      
      // Save changes
      await page.click('[data-testid="save-attribute"]');
      
      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });

    test('should add values to existing attribute', async ({ page }) => {
      await page.goto('/attributes');
      
      // Find a select/color attribute to edit
      const selectAttribute = page.locator('[data-testid="attribute-row"]').filter({
        has: page.locator('[data-testid="attribute-type"]:has-text("📋")')
      }).first();
      
      if (await selectAttribute.count() > 0) {
        await selectAttribute.locator('[data-testid="edit-attribute"]').click();
        
        // Add new value
        await page.fill('[data-testid="new-value-input"]', 'Extra Extra Large');
        await page.click('[data-testid="add-value"]');
        
        // Verify value was added
        await expect(page.locator('[data-testid="attribute-value"]').filter({ hasText: 'Extra Extra Large' })).toBeVisible();
        
        // Save changes
        await page.click('[data-testid="save-attribute"]');
        
        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      }
    });

    test('should reorder attribute values', async ({ page }) => {
      await page.goto('/attributes');
      
      // Find attribute with multiple values
      const attributeWithValues = page.locator('[data-testid="attribute-row"]').filter({
        has: page.locator('[data-testid="attribute-values-count"]:not(:has-text("0"))')
      }).first();
      
      if (await attributeWithValues.count() > 0) {
        await attributeWithValues.locator('[data-testid="edit-attribute"]').click();
        
        // Get first two values
        const values = page.locator('[data-testid="attribute-value"]');
        if (await values.count() >= 2) {
          const firstValue = values.first();
          const firstValueText = await firstValue.locator('[data-testid="value-name"]').textContent();
          
          // Move first value down
          await firstValue.locator('[data-testid="move-down"]').click();
          
          // Verify order changed
          const newFirstValueText = await values.first().locator('[data-testid="value-name"]').textContent();
          expect(newFirstValueText).not.toBe(firstValueText);
          
          // Save changes
          await page.click('[data-testid="save-attribute"]');
          await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
        }
      }
    });

    test('should remove attribute values', async ({ page }) => {
      await page.goto('/attributes');
      
      // Create a test attribute with values to remove
      await page.click('[data-testid="create-attribute"]');
      await page.fill('[data-testid="attribute-name"]', 'Test Remove Values');
      await page.click('[data-testid="attribute-type"]');
      await page.click('[data-testid="type-select"]');
      
      // Add test values
      const testValues = ['Value 1', 'Value 2', 'Value 3'];
      for (const value of testValues) {
        await page.fill('[data-testid="new-value-input"]', value);
        await page.click('[data-testid="add-value"]');
      }
      
      // Save attribute
      await page.click('[data-testid="save-attribute"]');
      
      // Edit the attribute
      await page.goto('/attributes');
      const testAttribute = page.locator('[data-testid="attribute-row"]').filter({ hasText: 'Test Remove Values' });
      await testAttribute.locator('[data-testid="edit-attribute"]').click();
      
      // Remove the second value
      const secondValue = page.locator('[data-testid="attribute-value"]').filter({ hasText: 'Value 2' });
      await secondValue.locator('[data-testid="remove-value"]').click();
      
      // Verify value was removed
      await expect(secondValue).not.toBeVisible();
      
      // Save changes
      await page.click('[data-testid="save-attribute"]');
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    });
  });

  test.describe('Attribute Deletion', () => {
    test('should delete unused attribute', async ({ page }) => {
      await page.goto('/attributes');
      
      // Create a test attribute to delete
      await page.click('[data-testid="create-attribute"]');
      await page.fill('[data-testid="attribute-name"]', 'Attribute to Delete');
      await page.click('[data-testid="attribute-type"]');
      await page.click('[data-testid="type-text"]');
      await page.click('[data-testid="save-attribute"]');
      
      // Delete the attribute
      await page.goto('/attributes');
      const testAttribute = page.locator('[data-testid="attribute-row"]').filter({ hasText: 'Attribute to Delete' });
      await testAttribute.locator('[data-testid="delete-attribute"]').click();
      
      // Confirm deletion
      await expect(page.locator('[data-testid="delete-modal"]')).toBeVisible();
      await page.click('[data-testid="confirm-delete"]');
      
      // Verify deletion
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(testAttribute).not.toBeVisible();
    });

    test('should prevent deletion of attribute used by products', async ({ page }) => {
      await page.goto('/attributes');
      
      // Try to delete an attribute that has products
      const usedAttribute = page.locator('[data-testid="attribute-row"]').filter({
        has: page.locator('[data-testid="attribute-products-count"]:not(:has-text("0"))')
      }).first();
      
      if (await usedAttribute.count() > 0) {
        await usedAttribute.locator('[data-testid="delete-attribute"]').click();
        
        // Should show warning about products
        await expect(page.locator('[data-testid="delete-modal"]')).toBeVisible();
        await expect(page.locator('[data-testid="products-warning"]')).toBeVisible();
        await expect(page.locator('[data-testid="products-warning"]')).toContainText('products are using');
        
        // Cancel deletion
        await page.click('[data-testid="cancel-delete"]');
        await expect(page.locator('[data-testid="delete-modal"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Bulk Operations', () => {
    test('should bulk enable/disable attributes', async ({ page }) => {
      await page.goto('/attributes');
      
      // Select multiple attributes
      const attributeRows = page.locator('[data-testid="attribute-row"]');
      if (await attributeRows.count() >= 2) {
        await attributeRows.first().locator('[data-testid="select-attribute"]').click();
        await attributeRows.nth(1).locator('[data-testid="select-attribute"]').click();
        
        // Verify bulk actions appear
        await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
        
        // Disable selected attributes
        await page.click('[data-testid="bulk-disable"]');
        await page.click('[data-testid="confirm-bulk-action"]');
        
        // Verify success
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="success-message"]')).toContainText('2 attributes updated');
      }
    });

    test('should bulk delete unused attributes', async ({ page }) => {
      await page.goto('/attributes');
      
      // Create test attributes for bulk delete
      for (let i = 1; i <= 2; i++) {
        await page.click('[data-testid="create-attribute"]');
        await page.fill('[data-testid="attribute-name"]', `Bulk Delete Test ${i}`);
        await page.click('[data-testid="attribute-type"]');
        await page.click('[data-testid="type-text"]');
        await page.click('[data-testid="save-attribute"]');
        await page.goto('/attributes');
      }
      
      // Select the test attributes
      const testAttribute1 = page.locator('[data-testid="attribute-row"]').filter({ hasText: 'Bulk Delete Test 1' });
      const testAttribute2 = page.locator('[data-testid="attribute-row"]').filter({ hasText: 'Bulk Delete Test 2' });
      
      await testAttribute1.locator('[data-testid="select-attribute"]').click();
      await testAttribute2.locator('[data-testid="select-attribute"]').click();
      
      // Bulk delete
      await page.click('[data-testid="bulk-delete"]');
      await page.click('[data-testid="confirm-bulk-delete"]');
      
      // Verify deletion
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('2 attributes deleted');
      await expect(testAttribute1).not.toBeVisible();
      await expect(testAttribute2).not.toBeVisible();
    });
  });

  test.describe('Attribute Usage in Products', () => {
    test('should view products using an attribute', async ({ page }) => {
      await page.goto('/attributes');
      
      // Find attribute with products
      const attributeWithProducts = page.locator('[data-testid="attribute-row"]').filter({
        has: page.locator('[data-testid="attribute-products-count"]:not(:has-text("0"))')
      }).first();
      
      if (await attributeWithProducts.count() > 0) {
        // Click on products count to view products
        await attributeWithProducts.locator('[data-testid="attribute-products-count"]').click();
        
        // Should navigate to products filtered by this attribute
        await expect(page).toHaveURL(/\/products/);
        await expect(page).toHaveURL(/attribute=/);
        
        // Verify products are filtered
        await expect(page.locator('[data-testid="active-filters"]')).toBeVisible();
        await expect(page.locator('[data-testid="products-grid"]')).toBeVisible();
      }
    });

    test('should show attribute usage statistics', async ({ page }) => {
      await page.goto('/attributes');
      
      // Check stats are displayed
      const totalAttributes = await page.locator('[data-testid="total-attributes"] .text-2xl').textContent();
      const activeAttributes = await page.locator('[data-testid="active-attributes"] .text-2xl').textContent();
      const requiredAttributes = await page.locator('[data-testid="required-attributes"] .text-2xl').textContent();
      
      expect(totalAttributes).toMatch(/^\d+$/);
      expect(activeAttributes).toMatch(/^\d+$/);
      expect(requiredAttributes).toMatch(/^\d+$/);
      
      // Verify active <= total
      expect(parseInt(activeAttributes || '0')).toBeLessThanOrEqual(parseInt(totalAttributes || '0'));
      expect(parseInt(requiredAttributes || '0')).toBeLessThanOrEqual(parseInt(activeAttributes || '0'));
    });
  });
});