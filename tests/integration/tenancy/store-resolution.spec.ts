/**
 * Integration Tests: Store Resolution from Domain
 * 
 * Tests multi-tenant store resolution from request host headers.
 * Covers custom domains, subdomains, unmapped domains, and canonical redirects.
 * 
 * @see specs/002-harden-checkout-tenancy/tasks.md - T020
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db';
import { resolveStore, extractSubdomain, buildCanonicalUrl } from '@/lib/store/resolve-store';
import { NotFoundError } from '@/lib/errors';

describe('Store Resolution Integration Tests', () => {
  let testStoreId: string;
  let testStoreDomainId: string;
  let customDomainId: string;

  beforeAll(async () => {
    // Create test store
    const store = await db.store.create({
      data: {
        name: 'Test Resolution Store',
        slug: 'test-resolution',
        email: 'test-resolution@example.com',
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'TRIAL',
        country: 'US',
        currency: 'USD',
        timezone: 'UTC',
        locale: 'en',
      },
    });
    testStoreId = store.id;

    // Create subdomain mapping
    const subdomain = await db.storeDomain.create({
      data: {
        storeId: testStoreId,
        domain: 'test-resolution.stormcom.app',
        isPrimary: false,
      },
    });
    testStoreDomainId = subdomain.id;

    // Create custom primary domain mapping
    const customDomain = await db.storeDomain.create({
      data: {
        storeId: testStoreId,
        domain: 'custom.example.com',
        isPrimary: true,
      },
    });
    customDomainId = customDomain.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await db.storeDomain.deleteMany({
      where: { id: { in: [testStoreDomainId, customDomainId] } },
    });
    await db.store.delete({ where: { id: testStoreId } });
  });

  describe('extractSubdomain()', () => {
    it('should extract subdomain from host', () => {
      const subdomain = extractSubdomain('demo-store.stormcom.app', 'stormcom.app');
      expect(subdomain).toBe('demo-store');
    });

    it('should return null for non-subdomain hosts', () => {
      const subdomain = extractSubdomain('example.com', 'stormcom.app');
      expect(subdomain).toBeNull();
    });

    it('should return null for www subdomain', () => {
      const subdomain = extractSubdomain('www.stormcom.app', 'stormcom.app');
      expect(subdomain).toBeNull();
    });

    it('should handle hosts with port numbers', () => {
      const subdomain = extractSubdomain('demo-store.stormcom.app:3000', 'stormcom.app');
      expect(subdomain).toBe('demo-store');
    });

    it('should return null for base domain', () => {
      const subdomain = extractSubdomain('stormcom.app', 'stormcom.app');
      expect(subdomain).toBeNull();
    });
  });

  describe('resolveStore() - Custom Domain', () => {
    it('should resolve store from custom domain', async () => {
      const resolved = await resolveStore('custom.example.com');

      expect(resolved.storeId).toBe(testStoreId);
      expect(resolved.slug).toBe('test-resolution');
      expect(resolved.isSubdomain).toBe(false);
      expect(resolved.primaryDomain).toBe('custom.example.com');
      expect(resolved.needsCanonicalRedirect).toBe(false);
    });

    it('should handle custom domain with port', async () => {
      const resolved = await resolveStore('custom.example.com:3000');

      expect(resolved.storeId).toBe(testStoreId);
      expect(resolved.slug).toBe('test-resolution');
    });
  });

  describe('resolveStore() - Subdomain', () => {
    it('should resolve store from subdomain', async () => {
      const resolved = await resolveStore('test-resolution.stormcom.app');

      expect(resolved.storeId).toBe(testStoreId);
      expect(resolved.slug).toBe('test-resolution');
      expect(resolved.isSubdomain).toBe(true);
      expect(resolved.primaryDomain).toBe('custom.example.com');
      expect(resolved.needsCanonicalRedirect).toBe(true); // Should redirect to custom domain
    });

    it('should handle subdomain without custom domain', async () => {
      // Create store with only subdomain (no primary custom domain)
      const store = await db.store.create({
        data: {
          name: 'Subdomain Only Store',
          slug: 'subdomain-only',
          email: 'subdomain-only@example.com',
          subscriptionPlan: 'FREE',
          subscriptionStatus: 'TRIAL',
          country: 'US',
          currency: 'USD',
          timezone: 'UTC',
          locale: 'en',
        },
      });

      const subdomain = await db.storeDomain.create({
        data: {
          storeId: store.id,
          domain: 'subdomain-only.stormcom.app',
          isPrimary: true, // Primary is the subdomain itself
        },
      });

      const resolved = await resolveStore('subdomain-only.stormcom.app');

      expect(resolved.storeId).toBe(store.id);
      expect(resolved.needsCanonicalRedirect).toBe(false);

      // Cleanup
      await db.storeDomain.delete({ where: { id: subdomain.id } });
      await db.store.delete({ where: { id: store.id } });
    });
  });

  describe('resolveStore() - Unmapped Domain (404)', () => {
    it('should throw NotFoundError for unmapped custom domain', async () => {
      await expect(
        resolveStore('unmapped.example.com')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for unmapped subdomain', async () => {
      await expect(
        resolveStore('nonexistent.stormcom.app')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for base domain', async () => {
      await expect(
        resolveStore('stormcom.app')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError for www subdomain', async () => {
      await expect(
        resolveStore('www.stormcom.app')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('buildCanonicalUrl()', () => {
    it('should build canonical URL in production', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });

      const url = buildCanonicalUrl('custom.example.com', '/products/123');
      expect(url).toBe('https://custom.example.com/products/123');

      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
    });

    it('should build canonical URL in development', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });

      const url = buildCanonicalUrl('custom.example.com', '/products/123');
      expect(url).toBe('http://custom.example.com/products/123');

      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
    });

    it('should handle root path', () => {
      const url = buildCanonicalUrl('custom.example.com', '/');
      expect(url).toContain('custom.example.com/');
    });

    it('should handle query strings', () => {
      const url = buildCanonicalUrl('custom.example.com', '/products?category=shoes');
      expect(url).toContain('/products?category=shoes');
    });
  });

  describe('Canonical Redirect Scenarios', () => {
    it('should identify redirect needed when on subdomain with custom domain', async () => {
      const resolved = await resolveStore('test-resolution.stormcom.app');

      expect(resolved.needsCanonicalRedirect).toBe(true);
      expect(resolved.primaryDomain).toBe('custom.example.com');
    });

    it('should not redirect when already on primary domain', async () => {
      const resolved = await resolveStore('custom.example.com');

      expect(resolved.needsCanonicalRedirect).toBe(false);
      expect(resolved.primaryDomain).toBe('custom.example.com');
    });

    it('should build correct redirect URL', async () => {
      const resolved = await resolveStore('test-resolution.stormcom.app');

      if (resolved.needsCanonicalRedirect && resolved.primaryDomain) {
        const redirectUrl = buildCanonicalUrl(resolved.primaryDomain, '/products/123');
        expect(redirectUrl).toContain('custom.example.com/products/123');
      }
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should resolve to correct store ID for different subdomains', async () => {
      // Create second store
      const store2 = await db.store.create({
        data: {
          name: 'Second Store',
          slug: 'second-store',
          email: 'second@example.com',
          subscriptionPlan: 'FREE',
          subscriptionStatus: 'TRIAL',
          country: 'US',
          currency: 'USD',
          timezone: 'UTC',
          locale: 'en',
        },
      });

      const domain2 = await db.storeDomain.create({
        data: {
          storeId: store2.id,
          domain: 'second-store.stormcom.app',
          isPrimary: true,
        },
      });

      const resolved1 = await resolveStore('test-resolution.stormcom.app');
      const resolved2 = await resolveStore('second-store.stormcom.app');

      expect(resolved1.storeId).not.toBe(resolved2.storeId);
      expect(resolved1.storeId).toBe(testStoreId);
      expect(resolved2.storeId).toBe(store2.id);

      // Cleanup
      await db.storeDomain.delete({ where: { id: domain2.id } });
      await db.store.delete({ where: { id: store2.id } });
    });

    it('should prevent cross-store access via domain manipulation', async () => {
      // Attempt to resolve with manipulated domain that doesn't exist
      await expect(
        resolveStore('hacked-store.stormcom.app')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long subdomains', async () => {
      const longSlug = 'a'.repeat(100);
      
      const store = await db.store.create({
        data: {
          name: 'Long Subdomain Store',
          slug: longSlug,
          email: 'long@example.com',
          subscriptionPlan: 'FREE',
          subscriptionStatus: 'TRIAL',
          country: 'US',
          currency: 'USD',
          timezone: 'UTC',
          locale: 'en',
        },
      });

      const domain = await db.storeDomain.create({
        data: {
          storeId: store.id,
          domain: `${longSlug}.stormcom.app`,
          isPrimary: true,
        },
      });

      const resolved = await resolveStore(`${longSlug}.stormcom.app`);
      expect(resolved.storeId).toBe(store.id);

      // Cleanup
      await db.storeDomain.delete({ where: { id: domain.id } });
      await db.store.delete({ where: { id: store.id } });
    });

    it('should handle special characters in custom domain', async () => {
      const store = await db.store.create({
        data: {
          name: 'Hyphen Store',
          slug: 'hyphen-store',
          email: 'hyphen@example.com',
          subscriptionPlan: 'FREE',
          subscriptionStatus: 'TRIAL',
          country: 'US',
          currency: 'USD',
          timezone: 'UTC',
          locale: 'en',
        },
      });

      const domain = await db.storeDomain.create({
        data: {
          storeId: store.id,
          domain: 'my-awesome-store.com',
          isPrimary: true,
        },
      });

      const resolved = await resolveStore('my-awesome-store.com');
      expect(resolved.storeId).toBe(store.id);

      // Cleanup
      await db.storeDomain.delete({ where: { id: domain.id } });
      await db.store.delete({ where: { id: store.id } });
    });
  });
});
