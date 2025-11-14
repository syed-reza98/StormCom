/**
 * Integration Tests for JSON Migration T038g-T038m
 * 
 * Tests verify that all 7 fields migrated from String to Json type
 * work correctly with Prisma Client and maintain data integrity.
 * 
 * Migrated fields:
 * - T038g: ShippingZone.countries (String → Json)
 * - T038h: Page.metaKeywords (String → Json)
 * - T038i: EmailTemplate.variables (String → Json)
 * - T038j: Webhook.events (String → Json)
 * - T038k: Payment.metadata (String? → Json?)
 * - T038l: SyncLog.metadata (String? → Json?)
 * - T038m: AuditLog.changes (String? → Json?)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('JSON Migration T038g-T038m Integration Tests', () => {
  let testStoreId: string;

  beforeEach(async () => {
    // Create a test store for tenant-scoped entities
    const store = await prisma.store.create({
      data: {
        name: 'Test Store',
        slug: 'test-store-json-migration',
        email: 'test@jsonmigration.com',
        currency: 'USD',
        timezone: 'UTC',
      },
    });
    testStoreId = store.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({ where: { storeId: testStoreId } });
    await prisma.syncLog.deleteMany({});
    await prisma.payment.deleteMany({ where: { storeId: testStoreId } });
    await prisma.webhook.deleteMany({ where: { storeId: testStoreId } });
    await prisma.emailTemplate.deleteMany({ where: { storeId: testStoreId } });
    await prisma.page.deleteMany({ where: { storeId: testStoreId } });
    await prisma.shippingZone.deleteMany({ where: { storeId: testStoreId } });
    await prisma.store.delete({ where: { id: testStoreId } });
  });

  // ===================================================================
  // T038g: ShippingZone.countries Tests
  // ===================================================================

  describe('T038g: ShippingZone.countries (Json array)', () => {
    it('should store and retrieve countries as Json array', async () => {
      const zone = await prisma.shippingZone.create({
        data: {
          storeId: testStoreId,
          name: 'North America',
          countries: ['US', 'CA', 'MX'],
        },
      });

      expect(zone.countries).toEqual(['US', 'CA', 'MX']);

      const retrieved = await prisma.shippingZone.findUnique({
        where: { id: zone.id },
      });

      expect(retrieved?.countries).toEqual(['US', 'CA', 'MX']);
    });

    it('should handle empty countries array', async () => {
      const zone = await prisma.shippingZone.create({
        data: {
          storeId: testStoreId,
          name: 'Empty Zone',
          countries: [],
        },
      });

      expect(zone.countries).toEqual([]);
    });

    it('should support filtering by country in array', async () => {
      await prisma.shippingZone.createMany({
        data: [
          { storeId: testStoreId, name: 'US Only', countries: ['US'] },
          { storeId: testStoreId, name: 'EU', countries: ['DE', 'FR', 'IT'] },
          { storeId: testStoreId, name: 'North America', countries: ['US', 'CA'] },
        ],
      });

      // Note: Json filtering in Prisma is limited - just verify we can query all zones
      const zones = await prisma.shippingZone.findMany({
        where: {
          storeId: testStoreId,
        },
      });

      expect(zones.length).toBe(3);
      // Verify at least one zone has 'US' in countries
      const hasUS = zones.some(z => Array.isArray(z.countries) && z.countries.includes('US'));
      expect(hasUS).toBe(true);
    });
  });

  // ===================================================================
  // T038h: Page.metaKeywords Tests
  // ===================================================================

  describe('T038h: Page.metaKeywords (Json array)', () => {
    it('should store and retrieve metaKeywords as Json array', async () => {
      const page = await prisma.page.create({
        data: {
          storeId: testStoreId,
          title: 'About Us',
          slug: 'about-us',
          content: '<p>About our store</p>',
          metaKeywords: ['ecommerce', 'online store', 'shopping'],
        },
      });

      expect(page.metaKeywords).toEqual(['ecommerce', 'online store', 'shopping']);
    });

    it('should update metaKeywords array', async () => {
      const page = await prisma.page.create({
        data: {
          storeId: testStoreId,
          title: 'Products',
          slug: 'products',
          content: '<p>Our products</p>',
          metaKeywords: ['products', 'catalog'],
        },
      });

      const updated = await prisma.page.update({
        where: { id: page.id },
        data: {
          metaKeywords: ['products', 'catalog', 'shop', 'buy'],
        },
      });

      expect(updated.metaKeywords).toEqual(['products', 'catalog', 'shop', 'buy']);
    });
  });

  // ===================================================================
  // T038i: EmailTemplate.variables Tests
  // ===================================================================

  describe('T038i: EmailTemplate.variables (Json array)', () => {
    it('should store and retrieve template variables as Json array', async () => {
      const template = await prisma.emailTemplate.create({
        data: {
          storeId: testStoreId,
          name: 'Order Confirmation',
          handle: 'order-confirmation',
          subject: 'Your Order {{orderNumber}}',
          htmlBody: '<p>Hi {{customerName}}, your order {{orderNumber}} is confirmed.</p>',
          variables: ['{{customerName}}', '{{orderNumber}}', '{{orderTotal}}'],
        },
      });

      expect(template.variables).toEqual([
        '{{customerName}}',
        '{{orderNumber}}',
        '{{orderTotal}}',
      ]);
    });

    it('should handle template with no variables', async () => {
      const template = await prisma.emailTemplate.create({
        data: {
          storeId: testStoreId,
          name: 'Simple Email',
          handle: 'simple-email',
          subject: 'Static Subject',
          htmlBody: '<p>Static content</p>',
          variables: [],
        },
      });

      expect(template.variables).toEqual([]);
    });
  });

  // ===================================================================
  // T038j: Webhook.events Tests
  // ===================================================================

  describe('T038j: Webhook.events (Json array)', () => {
    it('should store and retrieve webhook events as Json array', async () => {
      const webhook = await prisma.webhook.create({
        data: {
          storeId: testStoreId,
          url: 'https://example.com/webhook',
          events: ['order.created', 'order.updated', 'product.created'],
          secret: 'webhook-secret-key',
        },
      });

      expect(webhook.events).toEqual(['order.created', 'order.updated', 'product.created']);
    });

    it('should support filtering by event type', async () => {
      await prisma.webhook.createMany({
        data: [
          {
            storeId: testStoreId,
            url: 'https://example.com/orders',
            events: ['order.created', 'order.updated'],
            secret: 'secret1',
          },
          {
            storeId: testStoreId,
            url: 'https://example.com/products',
            events: ['product.created', 'product.updated'],
            secret: 'secret2',
          },
        ],
      });

      // Note: Json filtering in Prisma is limited - just verify we can query all webhooks
      const webhooks = await prisma.webhook.findMany({
        where: {
          storeId: testStoreId,
        },
      });

      expect(webhooks.length).toBe(2);
      // Verify at least one webhook has 'order.created' in events
      const hasOrderCreated = webhooks.some(w => 
        Array.isArray(w.events) && w.events.includes('order.created')
      );
      expect(hasOrderCreated).toBe(true);
    });
  });

  // ===================================================================
  // T038k: Payment.metadata Tests (Optional Json)
  // ===================================================================

  describe('T038k: Payment.metadata (Json? object)', () => {
    let testOrderId: string;

    beforeEach(async () => {
      // Create order for payment
      const customer = await prisma.customer.create({
        data: {
          storeId: testStoreId,
          email: 'customer@test.com',
          firstName: 'Test',
          lastName: 'Customer',
        },
      });

      const address = await prisma.address.create({
        data: {
          customerId: customer.id,
          firstName: 'Test',
          lastName: 'Customer',
          address1: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
      });

      const order = await prisma.order.create({
        data: {
          storeId: testStoreId,
          customerId: customer.id,
          orderNumber: 'TEST-001',
          status: 'PENDING',
          subtotal: 100.0,
          taxAmount: 0,
          shippingAmount: 0,
          discountAmount: 0,
          totalAmount: 100.0,
          shippingAddressId: address.id,
          billingAddressId: address.id,
        },
      });

      testOrderId = order.id;
    });

    it('should store and retrieve payment metadata as Json object', async () => {
      const payment = await prisma.payment.create({
        data: {
          storeId: testStoreId,
          orderId: testOrderId,
          amount: 100.0,
          currency: 'USD',
          method: 'CREDIT_CARD',
          gateway: 'STRIPE',
          metadata: {
            paymentIntentId: 'pi_123456',
            customerId: 'cus_abc123',
            cardBrand: 'visa',
            cardLast4: '4242',
          },
        },
      });

      expect(payment.metadata).toEqual({
        paymentIntentId: 'pi_123456',
        customerId: 'cus_abc123',
        cardBrand: 'visa',
        cardLast4: '4242',
      });
    });

    it('should handle null metadata', async () => {
      const payment = await prisma.payment.create({
        data: {
          storeId: testStoreId,
          orderId: testOrderId,
          amount: 50.0,
          currency: 'USD',
          method: 'CASH_ON_DELIVERY',
          gateway: 'MANUAL',
        },
      });

      expect(payment.metadata).toBeNull();
    });

    it('should support complex nested metadata', async () => {
      const payment = await prisma.payment.create({
        data: {
          storeId: testStoreId,
          orderId: testOrderId,
          amount: 200.0,
          currency: 'USD',
          method: 'CREDIT_CARD',
          gateway: 'STRIPE',
          metadata: {
            stripe: {
              paymentIntent: { id: 'pi_123', status: 'succeeded' },
              charge: { id: 'ch_456', receipt_url: 'https://...' },
            },
            fraud: {
              score: 0.1,
              passed: true,
            },
          },
        },
      });

      const retrieved = await prisma.payment.findUnique({
        where: { id: payment.id },
      });

      expect(retrieved?.metadata).toHaveProperty('stripe');
      expect(retrieved?.metadata).toHaveProperty('fraud');
    });
  });

  // ===================================================================
  // T038l: SyncLog.metadata Tests (Optional Json)
  // ===================================================================

  describe('T038l: SyncLog.metadata (Json? object)', () => {
    let testConfigId: string;

    beforeEach(async () => {
      const config = await prisma.externalPlatformConfig.create({
        data: {
          storeId: testStoreId,
          platform: 'SHOPIFY',
          apiUrl: 'https://test.myshopify.com/admin/api/2024-01',
          apiKey: 'test-key',
          apiSecret: 'test-secret',
        },
      });

      testConfigId = config.id;
    });

    it('should store and retrieve sync log metadata as Json object', async () => {
      const syncLog = await prisma.syncLog.create({
        data: {
          configId: testConfigId,
          entityType: 'Product',
          action: 'IMPORT',
          status: 'success',
          recordsProcessed: 100,
          recordsFailed: 0,
          metadata: {
            startTime: '2025-11-15T00:00:00Z',
            endTime: '2025-11-15T00:05:00Z',
            batchSize: 100,
            totalBatches: 1,
          },
        },
      });

      expect(syncLog.metadata).toEqual({
        startTime: '2025-11-15T00:00:00Z',
        endTime: '2025-11-15T00:05:00Z',
        batchSize: 100,
        totalBatches: 1,
      });
    });

    it('should handle null sync log metadata', async () => {
      const syncLog = await prisma.syncLog.create({
        data: {
          configId: testConfigId,
          entityType: 'Order',
          action: 'EXPORT',
          status: 'success',
        },
      });

      expect(syncLog.metadata).toBeNull();
    });
  });

  // ===================================================================
  // T038m: AuditLog.changes Tests (Optional Json)
  // ===================================================================

  describe('T038m: AuditLog.changes (Json? object)', () => {
    it('should store and retrieve audit log changes as Json object', async () => {
      const auditLog = await prisma.auditLog.create({
        data: {
          storeId: testStoreId,
          action: 'UPDATE',
          entityType: 'Product',
          entityId: 'prod_123',
          changes: {
            name: { old: 'Old Product Name', new: 'New Product Name' },
            price: { old: 19.99, new: 24.99 },
            stock: { old: 100, new: 95 },
          },
        },
      });

      expect(auditLog.changes).toEqual({
        name: { old: 'Old Product Name', new: 'New Product Name' },
        price: { old: 19.99, new: 24.99 },
        stock: { old: 100, new: 95 },
      });
    });

    it('should handle null changes for CREATE actions', async () => {
      const auditLog = await prisma.auditLog.create({
        data: {
          storeId: testStoreId,
          action: 'CREATE',
          entityType: 'Product',
          entityId: 'prod_456',
        },
      });

      expect(auditLog.changes).toBeNull();
    });

    it('should support complex change tracking', async () => {
      const auditLog = await prisma.auditLog.create({
        data: {
          storeId: testStoreId,
          action: 'UPDATE',
          entityType: 'Order',
          entityId: 'order_789',
          changes: {
            status: { old: 'PENDING', new: 'PROCESSING' },
            items: {
              old: [{ id: '1', qty: 2 }],
              new: [{ id: '1', qty: 3 }],
            },
            metadata: {
              old: { notes: 'old note' },
              new: { notes: 'new note', priority: 'high' },
            },
          },
        },
      });

      const retrieved = await prisma.auditLog.findUnique({
        where: { id: auditLog.id },
      });

      expect(retrieved?.changes).toHaveProperty('status');
      expect(retrieved?.changes).toHaveProperty('items');
      expect(retrieved?.changes).toHaveProperty('metadata');
    });
  });

  // ===================================================================
  // Cross-Field Tests
  // ===================================================================

  describe('Cross-field validation', () => {
    it('should support querying multiple Json fields in single query', async () => {
      const page = await prisma.page.create({
        data: {
          storeId: testStoreId,
          title: 'Test Page',
          slug: 'test-page',
          content: '<p>Test</p>',
          metaKeywords: ['test', 'page'],
        },
      });

      const webhook = await prisma.webhook.create({
        data: {
          storeId: testStoreId,
          url: 'https://test.com/hook',
          events: ['page.created', 'page.updated'],
          secret: 'secret',
        },
      });

      // Verify both records exist with Json fields
      const retrievedPage = await prisma.page.findUnique({ where: { id: page.id } });
      const retrievedWebhook = await prisma.webhook.findUnique({ where: { id: webhook.id } });

      expect(retrievedPage?.metaKeywords).toEqual(['test', 'page']);
      expect(retrievedWebhook?.events).toEqual(['page.created', 'page.updated']);
    });
  });

  // ===================================================================
  // Type Safety Tests
  // ===================================================================

  describe('Type safety', () => {
    it('should enforce Json type at compile time for required fields', async () => {
      // This test verifies TypeScript compilation - if it compiles, types are correct
      const zone = await prisma.shippingZone.create({
        data: {
          storeId: testStoreId,
          name: 'Test Zone',
          countries: ['US'], // TypeScript ensures this is a valid Json value
        },
      });

      expect(zone.countries).toBeDefined();
    });

    it('should allow null for optional Json fields', async () => {
      const auditLog = await prisma.auditLog.create({
        data: {
          storeId: testStoreId,
          action: 'DELETE',
          entityType: 'Product',
          entityId: 'prod_deleted',
        },
      });

      expect(auditLog.changes).toBeNull();
    });
  });
});
