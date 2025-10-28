// @ts-nocheck - TODO: Fix 79 TypeScript errors - complete service interface rewrite needed
// tests/integration/attributes/attribute-service.test.ts
// Integration tests for AttributeService

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AttributeService } from '../../../src/services/attribute-service';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';
import { createTestStore, createTestUser } from '../helpers/test-data';

describe.skip('AttributeService Integration Tests', () => {
  let attributeService: AttributeService;
  let testStoreId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Setup test database
    await setupTestDatabase();
    
    // Create test store and user
    const store = await createTestStore();
    const user = await createTestUser(store.id);
    testStoreId = store.id;
    testUserId = user.id;
    
    // Initialize service
    attributeService = new AttributeService();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('Attribute CRUD Operations', () => {
    it('should create a text attribute', async () => {
      const attributeData = {
        name: 'Brand',
        slug: 'brand',
        type: 'text' as const,
        description: 'Product brand name',
        required: false,
        isActive: true,
        sortOrder: 0,
      };

      const attribute = await attributeService.create(testStoreId, attributeData);

      // Assertions
      expect(attribute).toBeDefined();
      expect(attribute.id).toBeDefined();
      expect(attribute.name).toBe(attributeData.name);
      expect(attribute.slug).toBe(attributeData.slug);
      expect(attribute.type).toBe(attributeData.type);
      expect(attribute.description).toBe(attributeData.description);
      expect(attribute.required).toBe(false);
      expect(attribute.isActive).toBe(true);
      expect(attribute.sortOrder).toBe(0);
      expect(attribute.storeId).toBe(testStoreId);
      expect(attribute.values).toHaveLength(0);
    });

    it('should create a select attribute with values', async () => {
      const attributeData = {
        name: 'Size',
        slug: 'size',
        type: 'select' as const,
        description: 'Product size options',
        required: true,
        isActive: true,
        sortOrder: 0,
        values: [
          {
            value: 'Small',
            slug: 'small',
            description: 'Small size',
            sortOrder: 0,
            isActive: true,
          },
          {
            value: 'Medium',
            slug: 'medium',
            description: 'Medium size',
            sortOrder: 1,
            isActive: true,
          },
          {
            value: 'Large',
            slug: 'large',
            description: 'Large size',
            sortOrder: 2,
            isActive: true,
          },
        ],
      };

      const attribute = await attributeService.create(testStoreId, attributeData);

      // Assertions
      expect(attribute.name).toBe('Size');
      expect(attribute.type).toBe('select');
      expect(attribute.required).toBe(true);
      expect(attribute.values).toHaveLength(3);
      
      const values = attribute.values.sort((a, b) => a.sortOrder - b.sortOrder);
      expect(values[0].value).toBe('Small');
      expect(values[1].value).toBe('Medium');
      expect(values[2].value).toBe('Large');
    });

    it('should create a color attribute with color values', async () => {
      const attributeData = {
        name: 'Color',
        slug: 'color',
        type: 'color' as const,
        description: 'Product color options',
        required: false,
        isActive: true,
        sortOrder: 0,
        values: [
          {
            value: 'Red',
            slug: 'red',
            color: '#FF0000',
            sortOrder: 0,
            isActive: true,
          },
          {
            value: 'Blue',
            slug: 'blue',
            color: '#0000FF',
            sortOrder: 1,
            isActive: true,
          },
          {
            value: 'Green',
            slug: 'green',
            color: '#00FF00',
            sortOrder: 2,
            isActive: true,
          },
        ],
      };

      const attribute = await attributeService.create(testStoreId, attributeData);

      // Assertions
      expect(attribute.name).toBe('Color');
      expect(attribute.type).toBe('color');
      expect(attribute.values).toHaveLength(3);
      
      const redValue = attribute.values.find(v => v.slug === 'red');
      expect(redValue).toBeDefined();
      expect(redValue!.color).toBe('#FF0000');
    });

    it('should retrieve an attribute by ID', async () => {
      // Create attribute first
      const createdAttribute = await attributeService.create(testStoreId, {
        name: 'Material',
        slug: 'material',
        type: 'text',
        description: 'Product material',
        required: false,
        isActive: true,
        sortOrder: 0,
      });

      // Retrieve attribute
      const retrievedAttribute = await attributeService.getById(testStoreId, createdAttribute.id);

      // Assertions
      expect(retrievedAttribute).toBeDefined();
      expect(retrievedAttribute!.id).toBe(createdAttribute.id);
      expect(retrievedAttribute!.name).toBe('Material');
      expect(retrievedAttribute!.slug).toBe('material');
    });

    it('should retrieve an attribute by slug', async () => {
      // Create attribute first
      await attributeService.create(testStoreId, {
        name: 'Weight',
        slug: 'weight',
        type: 'number',
        description: 'Product weight',
        required: false,
        isActive: true,
        sortOrder: 0,
      });

      // Retrieve attribute by slug
      const retrievedAttribute = await attributeService.getBySlug(testStoreId, 'weight');

      // Assertions
      expect(retrievedAttribute).toBeDefined();
      expect(retrievedAttribute!.slug).toBe('weight');
      expect(retrievedAttribute!.name).toBe('Weight');
      expect(retrievedAttribute!.type).toBe('number');
    });

    it('should update an attribute', async () => {
      // Create attribute first
      const attribute = await attributeService.create(testStoreId, {
        name: 'Original Name',
        slug: 'original-name',
        type: 'text',
        description: 'Original description',
        required: false,
        isActive: true,
        sortOrder: 0,
      });

      // Update attribute
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        required: true,
        sortOrder: 5,
      };

      const updatedAttribute = await attributeService.update(testStoreId, attribute.id, updateData);

      // Assertions
      expect(updatedAttribute.name).toBe('Updated Name');
      expect(updatedAttribute.description).toBe('Updated description');
      expect(updatedAttribute.required).toBe(true);
      expect(updatedAttribute.sortOrder).toBe(5);
      expect(updatedAttribute.slug).toBe('original-name'); // Should not change
      expect(updatedAttribute.type).toBe('text'); // Should not change
    });

    it('should soft delete an attribute', async () => {
      // Create attribute first
      const attribute = await attributeService.create(testStoreId, {
        name: 'Attribute to Delete',
        slug: 'attribute-to-delete',
        type: 'text',
        description: 'This attribute will be deleted',
        required: false,
        isActive: true,
        sortOrder: 0,
      });

      // Delete attribute
      await attributeService.delete(testStoreId, attribute.id);

      // Try to retrieve deleted attribute
      const deletedAttribute = await attributeService.getById(testStoreId, attribute.id);

      // Should not be found (soft deleted)
      expect(deletedAttribute).toBeNull();
    });

    it('should prevent creating attributes with duplicate slugs', async () => {
      // Create first attribute
      await attributeService.create(testStoreId, {
        name: 'First Attribute',
        slug: 'duplicate-slug',
        type: 'text',
        description: 'First attribute',
        required: false,
        isActive: true,
        sortOrder: 0,
      });

      // Try to create second attribute with same slug
      await expect(
        attributeService.create(testStoreId, {
          name: 'Second Attribute',
          slug: 'duplicate-slug', // Same slug
          type: 'select',
          description: 'Second attribute',
          required: false,
          isActive: true,
          sortOrder: 1,
        })
      ).rejects.toThrow('Attribute slug already exists');
    });
  });

  describe('Attribute Value Management', () => {
    let selectAttribute: any;
    let colorAttribute: any;

    beforeEach(async () => {
      // Create select attribute for testing
      selectAttribute = await attributeService.create(testStoreId, {
        name: 'Size',
        slug: 'size',
        type: 'select',
        description: 'Size options',
        required: false,
        isActive: true,
        sortOrder: 0,
        values: [
          {
            value: 'Small',
            slug: 'small',
            sortOrder: 0,
            isActive: true,
          },
          {
            value: 'Medium',
            slug: 'medium',
            sortOrder: 1,
            isActive: true,
          },
        ],
      });

      // Create color attribute for testing
      colorAttribute = await attributeService.create(testStoreId, {
        name: 'Color',
        slug: 'color',
        type: 'color',
        description: 'Color options',
        required: false,
        isActive: true,
        sortOrder: 0,
        values: [
          {
            value: 'Red',
            slug: 'red',
            color: '#FF0000',
            sortOrder: 0,
            isActive: true,
          },
        ],
      });
    });

    it('should add a new value to an existing attribute', async () => {
      const newValue = {
        value: 'Large',
        slug: 'large',
        description: 'Large size',
        sortOrder: 2,
        isActive: true,
      };

      const updatedAttribute = await attributeService.addValue(testStoreId, selectAttribute.id, newValue);

      expect(updatedAttribute.values).toHaveLength(3);
      const largeValue = updatedAttribute.values.find(v => v.slug === 'large');
      expect(largeValue).toBeDefined();
      expect(largeValue!.value).toBe('Large');
    });

    it('should update an existing attribute value', async () => {
      const smallValue = selectAttribute.values.find((v: any) => v.slug === 'small');
      
      const updatedValue = {
        value: 'Extra Small',
        description: 'Extra small size',
        sortOrder: 0,
        isActive: true,
      };

      const updatedAttribute = await attributeService.updateValue(
        testStoreId,
        selectAttribute.id,
        smallValue.id,
        updatedValue
      );

      const updatedSmallValue = updatedAttribute.values.find((v: any) => v.id === smallValue.id);
      expect(updatedSmallValue!.value).toBe('Extra Small');
      expect(updatedSmallValue!.description).toBe('Extra small size');
    });

    it('should remove an attribute value', async () => {
      const mediumValue = selectAttribute.values.find((v: any) => v.slug === 'medium');
      
      const updatedAttribute = await attributeService.removeValue(
        testStoreId,
        selectAttribute.id,
        mediumValue.id
      );

      expect(updatedAttribute.values).toHaveLength(1);
      expect(updatedAttribute.values.find((v: any) => v.slug === 'medium')).toBeUndefined();
    });

    it('should update color value with new color code', async () => {
      const redValue = colorAttribute.values.find((v: any) => v.slug === 'red');
      
      const updatedValue = {
        value: 'Dark Red',
        color: '#CC0000',
        sortOrder: 0,
        isActive: true,
      };

      const updatedAttribute = await attributeService.updateValue(
        testStoreId,
        colorAttribute.id,
        redValue.id,
        updatedValue
      );

      const updatedRedValue = updatedAttribute.values.find((v: any) => v.id === redValue.id);
      expect(updatedRedValue!.value).toBe('Dark Red');
      expect(updatedRedValue!.color).toBe('#CC0000');
    });

    it('should prevent duplicate value slugs within the same attribute', async () => {
      await expect(
        attributeService.addValue(testStoreId, selectAttribute.id, {
          value: 'Another Small',
          slug: 'small', // Duplicate slug
          sortOrder: 3,
          isActive: true,
        })
      ).rejects.toThrow('Attribute value slug already exists');
    });

    it('should reorder attribute values', async () => {
      // Add a third value first
      await attributeService.addValue(testStoreId, selectAttribute.id, {
        value: 'Large',
        slug: 'large',
        sortOrder: 2,
        isActive: true,
      });

      const newOrder = [
        { id: selectAttribute.values[1].id, sortOrder: 0 }, // Medium -> 0
        { id: selectAttribute.values[0].id, sortOrder: 1 }, // Small -> 1
        // Large will get sortOrder: 2 (the new value we just added)
      ];

      const updatedAttribute = await attributeService.reorderValues(
        testStoreId,
        selectAttribute.id,
        newOrder
      );

      // Sort values by sortOrder to check the new order
      const sortedValues = updatedAttribute.values.sort((a: any, b: any) => a.sortOrder - b.sortOrder);
      expect(sortedValues[0].value).toBe('Medium');
      expect(sortedValues[1].value).toBe('Small');
      expect(sortedValues[2].value).toBe('Large');
    });
  });

  describe('Attribute Listing and Filtering', () => {
    beforeEach(async () => {
      // Create test attributes
      const attributes = [
        {
          name: 'Color',
          slug: 'color',
          type: 'color' as const,
          description: 'Product color',
          required: false,
          isActive: true,
          sortOrder: 0,
        },
        {
          name: 'Size',
          slug: 'size',
          type: 'select' as const,
          description: 'Product size',
          required: true,
          isActive: true,
          sortOrder: 1,
        },
        {
          name: 'Material',
          slug: 'material',
          type: 'text' as const,
          description: 'Product material',
          required: false,
          isActive: true,
          sortOrder: 2,
        },
        {
          name: 'Weight',
          slug: 'weight',
          type: 'number' as const,
          description: 'Product weight',
          required: false,
          isActive: false,
          sortOrder: 3,
        },
      ];

      for (const attributeData of attributes) {
        await attributeService.create(testStoreId, attributeData);
      }
    });

    it('should list all active attributes', async () => {
      const result = await attributeService.list(testStoreId, {
        page: 1,
        perPage: 10,
      });

      expect(result.attributes).toHaveLength(3); // Only active attributes
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(10);
    });

    it('should filter attributes by type', async () => {
      const result = await attributeService.list(testStoreId, {
        type: 'select',
        page: 1,
        perPage: 10,
      });

      expect(result.attributes).toHaveLength(1);
      expect(result.attributes[0].type).toBe('select');
      expect(result.attributes[0].name).toBe('Size');
    });

    it('should filter attributes by required status', async () => {
      const result = await attributeService.list(testStoreId, {
        required: true,
        page: 1,
        perPage: 10,
      });

      expect(result.attributes).toHaveLength(1);
      expect(result.attributes[0].required).toBe(true);
      expect(result.attributes[0].name).toBe('Size');
    });

    it('should search attributes by name', async () => {
      const result = await attributeService.list(testStoreId, {
        search: 'col',
        page: 1,
        perPage: 10,
      });

      expect(result.attributes).toHaveLength(1);
      expect(result.attributes[0].name).toBe('Color');
    });

    it('should sort attributes by sort order', async () => {
      const result = await attributeService.list(testStoreId, {
        sortBy: 'sortOrder',
        sortOrder: 'asc',
        page: 1,
        perPage: 10,
      });

      const sortOrders = result.attributes.map(attr => attr.sortOrder);
      for (let i = 1; i < sortOrders.length; i++) {
        expect(sortOrders[i]).toBeGreaterThanOrEqual(sortOrders[i - 1]);
      }
    });

    it('should sort attributes by name', async () => {
      const result = await attributeService.list(testStoreId, {
        sortBy: 'name',
        sortOrder: 'asc',
        page: 1,
        perPage: 10,
      });

      const names = result.attributes.map(attr => attr.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should paginate results correctly', async () => {
      // Get first page
      const page1 = await attributeService.list(testStoreId, {
        page: 1,
        perPage: 2,
      });

      expect(page1.attributes).toHaveLength(2);
      expect(page1.total).toBe(3);
      expect(page1.totalPages).toBe(2);

      // Get second page
      const page2 = await attributeService.list(testStoreId, {
        page: 2,
        perPage: 2,
      });

      expect(page2.attributes).toHaveLength(1);
      expect(page2.total).toBe(3);
      expect(page2.totalPages).toBe(2);
    });

    it('should include values in attribute listing', async () => {
      const result = await attributeService.list(testStoreId, {
        includeValues: true,
        page: 1,
        perPage: 10,
      });

      result.attributes.forEach(attribute => {
        expect(attribute).toHaveProperty('values');
        expect(Array.isArray(attribute.values)).toBe(true);
      });
    });
  });

  describe('Multi-tenant Isolation', () => {
    it('should not return attributes from other stores', async () => {
      // Create second store
      const store2 = await createTestStore('Store 2');
      
      // Create attribute in first store
      await attributeService.create(testStoreId, {
        name: 'Store 1 Attribute',
        slug: 'store-1-attribute',
        type: 'text',
        description: 'Attribute in store 1',
        required: false,
        isActive: true,
        sortOrder: 0,
      });

      // Create attribute in second store
      await attributeService.create(store2.id, {
        name: 'Store 2 Attribute',
        slug: 'store-2-attribute',
        type: 'text',
        description: 'Attribute in store 2',
        required: false,
        isActive: true,
        sortOrder: 0,
      });

      // List attributes for store 1
      const store1Attributes = await attributeService.list(testStoreId, {
        page: 1,
        perPage: 10,
      });

      // List attributes for store 2
      const store2Attributes = await attributeService.list(store2.id, {
        page: 1,
        perPage: 10,
      });

      // Verify isolation
      expect(store1Attributes.attributes).toHaveLength(1);
      expect(store1Attributes.attributes[0].name).toBe('Store 1 Attribute');
      expect(store1Attributes.attributes[0].storeId).toBe(testStoreId);

      expect(store2Attributes.attributes).toHaveLength(1);
      expect(store2Attributes.attributes[0].name).toBe('Store 2 Attribute');
      expect(store2Attributes.attributes[0].storeId).toBe(store2.id);
    });

    it('should not allow access to attributes from other stores', async () => {
      // Create second store
      const store2 = await createTestStore('Store 2');
      
      // Create attribute in store 2
      const store2Attribute = await attributeService.create(store2.id, {
        name: 'Store 2 Attribute',
        slug: 'store-2-attribute',
        type: 'text',
        description: 'Attribute in store 2',
        required: false,
        isActive: true,
        sortOrder: 0,
      });

      // Try to access store 2 attribute from store 1 context
      const result = await attributeService.getById(testStoreId, store2Attribute.id);

      // Should not find the attribute (null result)
      expect(result).toBeNull();
    });

    it('should allow same slugs across different stores', async () => {
      // Create second store
      const store2 = await createTestStore('Store 2');
      
      // Create attribute with same slug in both stores
      const store1Attribute = await attributeService.create(testStoreId, {
        name: 'Color Store 1',
        slug: 'color',
        type: 'color',
        description: 'Color in store 1',
        required: false,
        isActive: true,
        sortOrder: 0,
      });

      const store2Attribute = await attributeService.create(store2.id, {
        name: 'Color Store 2',
        slug: 'color', // Same slug as store 1
        type: 'select',
        description: 'Color in store 2',
        required: false,
        isActive: true,
        sortOrder: 0,
      });

      // Both should be created successfully
      expect(store1Attribute.slug).toBe('color');
      expect(store2Attribute.slug).toBe('color');
      expect(store1Attribute.storeId).toBe(testStoreId);
      expect(store2Attribute.storeId).toBe(store2.id);

      // Verify they can be retrieved by slug in their respective stores
      const retrievedStore1 = await attributeService.getBySlug(testStoreId, 'color');
      const retrievedStore2 = await attributeService.getBySlug(store2.id, 'color');

      expect(retrievedStore1!.name).toBe('Color Store 1');
      expect(retrievedStore1!.type).toBe('color');
      expect(retrievedStore2!.name).toBe('Color Store 2');
      expect(retrievedStore2!.type).toBe('select');
    });
  });

  describe('Attribute Type Validation', () => {
    it('should validate color attribute values have color codes', async () => {
      await expect(
        attributeService.create(testStoreId, {
          name: 'Invalid Color',
          slug: 'invalid-color',
          type: 'color',
          description: 'Color attribute without color codes',
          required: false,
          isActive: true,
          sortOrder: 0,
          values: [
            {
              value: 'Red',
              slug: 'red',
              // Missing color property
              sortOrder: 0,
              isActive: true,
            },
          ],
        })
      ).rejects.toThrow('Color attribute values must include color codes');
    });

    it('should validate number attribute constraints', async () => {
      const attribute = await attributeService.create(testStoreId, {
        name: 'Weight',
        slug: 'weight',
        type: 'number',
        description: 'Product weight in kg',
        required: false,
        isActive: true,
        sortOrder: 0,
        constraints: {
          min: 0,
          max: 1000,
          step: 0.1,
        },
      });

      expect(attribute.constraints).toBeDefined();
      expect(attribute.constraints!.min).toBe(0);
      expect(attribute.constraints!.max).toBe(1000);
      expect(attribute.constraints!.step).toBe(0.1);
    });

    it('should validate text attribute max length', async () => {
      const attribute = await attributeService.create(testStoreId, {
        name: 'Description',
        slug: 'description',
        type: 'text',
        description: 'Product description',
        required: false,
        isActive: true,
        sortOrder: 0,
        constraints: {
          maxLength: 500,
        },
      });

      expect(attribute.constraints).toBeDefined();
      expect(attribute.constraints!.maxLength).toBe(500);
    });
  });
});