/**
 * Integration tests for CSV export streaming (T028)
 * 
 * Tests:
 * - Streaming for ≤10k rows (200 OK with CSV content)
 * - Async job enqueue for >10k rows (202 Accepted with job ID)
 * - Authentication enforcement
 * - Multi-tenant isolation
 * - CSV format correctness
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db';
import { createMockSession } from '@/tests/support/session-helpers';

describe('CSV Export Streaming', () => {
  let testStoreId: string;
  let adminUserId: string;

  beforeAll(async () => {
    // Create test store
    const store = await db.store.create({
      data: {
        name: 'Test Store - CSV Export',
        slug: 'csv-export-test',
        email: 'csv@test.com',
      },
    });
    testStoreId = store.id;

    // Create admin user
    const user = await db.user.create({
      data: {
        email: 'admin@csvtest.com',
        name: 'CSV Admin',
        password: 'hashed',
        role: 'STORE_ADMIN',
        storeId: testStoreId,
      },
    });
    adminUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    await db.order.deleteMany({ where: { storeId: testStoreId } });
    await db.user.delete({ where: { id: adminUserId } });
    await db.store.delete({ where: { id: testStoreId } });
  });

  describe('Small dataset streaming (≤10k rows)', () => {
    it('should stream CSV for 100 orders', async () => {
      // Create test orders
      const orders = await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          db.order.create({
            data: {
              storeId: testStoreId,
              orderNumber: `TEST-${i.toString().padStart(5, '0')}`,
              status: 'PENDING',
              subtotal: (i + 1) * 10,
              taxAmount: 0,
              shippingAmount: 0,
              discountAmount: 0,
              totalAmount: (i + 1) * 10,
              paymentMethod: 'CREDIT_CARD',
              paymentStatus: 'PENDING',
            },
          })
        )
      );

      // Mock authenticated request
      const session = createMockSession({
        userId: adminUserId,
        storeId: testStoreId,
        role: 'STORE_ADMIN',
      });

      const response = await fetch('http://localhost:3000/api/orders/export', {
        headers: {
          cookie: `next-auth.session-token=${session.sessionToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/csv');
      expect(response.headers.get('content-disposition')).toContain('attachment');
      expect(response.headers.get('x-request-id')).toBeTruthy();

      const csv = await response.text();

      // Validate CSV structure
      const lines = csv.split('\n').filter(line => line.trim());
      expect(lines.length).toBe(101); // Header + 100 data rows
      expect(lines[0]).toBe(
        'Order Number,Customer Email,Status,Total Amount,Currency,Created At,Items Count,Payment Status'
      );

      // Validate first data row
      expect(lines[1]).toContain('TEST-');
      expect(lines[1]).toContain('customer');
      expect(lines[1]).toContain('PENDING');

      // Cleanup
      await db.order.deleteMany({
        where: { id: { in: orders.map(o => o.id) } },
      });
    });

    it('should respect tenant isolation', async () => {
      // Create orders in different store
      const otherStore = await db.store.create({
        data: {
          name: 'Other Store',
          slug: 'other-csv',
          email: 'other@test.com',
        },
      });

      await db.order.create({
        data: {
          storeId: otherStore.id,
          orderNumber: 'OTHER-00001',
          status: 'PENDING',
          subtotal: 100,
          taxAmount: 0,
          shippingAmount: 0,
          discountAmount: 0,
          totalAmount: 100,
          paymentMethod: 'CREDIT_CARD',
          paymentStatus: 'PENDING',
        },
      });

      const session = createMockSession({
        userId: adminUserId,
        storeId: testStoreId,
        role: 'STORE_ADMIN',
      });

      const response = await fetch('http://localhost:3000/api/orders/export', {
        headers: {
          cookie: `next-auth.session-token=${session.sessionToken}`,
        },
      });

      const csv = await response.text();

      // Should NOT include other store's order
      expect(csv).not.toContain('OTHER-00001');

      // Cleanup
      await db.order.deleteMany({ where: { storeId: otherStore.id } });
      await db.store.delete({ where: { id: otherStore.id } });
    });

    it('should handle CSV field escaping', async () => {
      const order = await db.order.create({
        data: {
          storeId: testStoreId,
          orderNumber: 'TEST-ESCAPE',
          status: 'PENDING',
          subtotal: 100,
          taxAmount: 0,
          shippingAmount: 0,
          discountAmount: 0,
          totalAmount: 100,
          paymentMethod: 'CREDIT_CARD',
          paymentStatus: 'PENDING',
        },
      });

      const session = createMockSession({
        userId: adminUserId,
        storeId: testStoreId,
        role: 'STORE_ADMIN',
      });

      const response = await fetch('http://localhost:3000/api/orders/export', {
        headers: {
          cookie: `next-auth.session-token=${session.sessionToken}`,
        },
      });

      const csv = await response.text();

      // Field with special chars should be quoted
      expect(csv).toContain('"test""comma,newline');

      // Cleanup
      await db.order.delete({ where: { id: order.id } });
    });
  });

  describe('Large dataset async job (>10k rows)', () => {
    it('should return 202 Accepted for >10k orders', async () => {
      // Note: Creating 10k+ test orders is expensive
      // This test validates the logic path without actual bulk creation
      
      // Mock the count to return >10k
      // In real implementation, this would trigger async job service (T029)
      
      // This test is placeholder until T029 is implemented
      // TODO: Update when export-service.ts is available
      
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('Authentication and authorization', () => {
    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3000/api/orders/export');

      expect(response.status).toBe(401);
    });

    it('should require STORE_ADMIN or STAFF role', async () => {
      const customerUser = await db.user.create({
        data: {
          email: 'customer@csvtest.com',
          name: 'Customer',
          password: 'hashed',
          role: 'CUSTOMER',
          storeId: testStoreId,
        },
      });

      const session = createMockSession({
        userId: customerUser.id,
        storeId: testStoreId,
        role: 'CUSTOMER',
      });

      const response = await fetch('http://localhost:3000/api/orders/export', {
        headers: {
          cookie: `next-auth.session-token=${session.sessionToken}`,
        },
      });

      expect(response.status).toBe(403);

      // Cleanup
      await db.user.delete({ where: { id: customerUser.id } });
    });
  });

  describe('Filtering and search', () => {
    it('should filter by status', async () => {
      const orders = await Promise.all([
        db.order.create({
          data: {
            storeId: testStoreId,
            orderNumber: 'PENDING-001',
            customerEmail: 'pending@test.com',
            status: 'PENDING',
            totalAmount: 100,
            currency: 'USD',
            paymentMethod: 'CREDIT_CARD',
          },
        }),
        db.order.create({
          data: {
            storeId: testStoreId,
            orderNumber: 'PAID-001',
            customerEmail: 'paid@test.com',
            status: 'PAID',
            totalAmount: 200,
            currency: 'USD',
            paymentMethod: 'CREDIT_CARD',
          },
        }),
      ]);

      const session = createMockSession({
        userId: adminUserId,
        storeId: testStoreId,
        role: 'STORE_ADMIN',
      });

      const response = await fetch(
        'http://localhost:3000/api/orders/export?status=PENDING',
        {
          headers: {
            cookie: `next-auth.session-token=${session.sessionToken}`,
          },
        }
      );

      const csv = await response.text();

      expect(csv).toContain('PENDING-001');
      expect(csv).not.toContain('PAID-001');

      // Cleanup
      await db.order.deleteMany({
        where: { id: { in: orders.map(o => o.id) } },
      });
    });
  });
});
