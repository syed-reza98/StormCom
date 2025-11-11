/**
 * Unit Tests: IntegrationService
 * 
 * Tests external platform integration service with OAuth flow,
 * token management, and API client wrappers.
 * 
 * Coverage: OAuth initialization, token refresh, API calls, error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntegrationService } from '@/services/integration-service';
import { db } from '@/lib/db';

// Mock Prisma client
vi.mock('@/lib/db', () => ({
  db: {
    externalPlatformConfig: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    syncLog: {
      create: vi.fn(),
    },
  },
}));

// Mock fetch for external API calls
global.fetch = vi.fn();

// Mock encryption key for tests (32 bytes = 64 hex characters)
process.env.INTEGRATION_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('IntegrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Shopify OAuth', () => {
    it('should generate Shopify OAuth URL', () => {
      const storeId = 'store-123';
      const shopDomain = 'test-store.myshopify.com';
      
      const authUrl = IntegrationService.getShopifyAuthUrl(storeId, shopDomain);
      
      expect(authUrl).toContain('https://test-store.myshopify.com/admin/oauth/authorize');
      expect(authUrl).toContain('client_id=');
      expect(authUrl).toContain('scope=');
      expect(authUrl).toContain('redirect_uri=');
      expect(authUrl).toContain(`state=${storeId}`);
    });

    it('should exchange Shopify code for access token', async () => {
      const shopDomain = 'test-store.myshopify.com';
      const code = 'auth-code-123';
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'shopify-token-456' }),
      });

      const token = await IntegrationService.exchangeShopifyCode(shopDomain, code);
      
      expect(token).toBe('shopify-token-456');
      expect(global.fetch).toHaveBeenCalledWith(
        `https://${shopDomain}/admin/oauth/access_token`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should throw error on Shopify OAuth failure', async () => {
      const shopDomain = 'test-store.myshopify.com';
      const code = 'invalid-code';
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'invalid_grant' }),
      });

      await expect(
        IntegrationService.exchangeShopifyCode(shopDomain, code)
      ).rejects.toThrow('Shopify OAuth failed');
    });
  });

  describe('Mailchimp OAuth', () => {
    it('should generate Mailchimp OAuth URL', () => {
      const storeId = 'store-123';
      
      const authUrl = IntegrationService.getMailchimpAuthUrl(storeId);
      
      expect(authUrl).toContain('https://login.mailchimp.com/oauth2/authorize');
      expect(authUrl).toContain('client_id=');
      expect(authUrl).toContain('redirect_uri=');
      expect(authUrl).toContain(`state=${storeId}`);
    });

    it('should exchange Mailchimp code for access token', async () => {
      const code = 'auth-code-123';
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'mailchimp-token-456' }),
      });

      const token = await IntegrationService.exchangeMailchimpCode(code);
      
      expect(token).toBe('mailchimp-token-456');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://login.mailchimp.com/oauth2/token',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('Configuration Management', () => {
    it('should save Shopify configuration with encrypted credentials', async () => {
      const storeId = 'store-123';
      const shopDomain = 'test-store.myshopify.com';
      const accessToken = 'shopify-token-456';
      
      const mockConfig = {
        id: 'config-123',
        storeId,
        platform: 'shopify',
        apiUrl: `https://${shopDomain}/admin/api/2024-01`,
        apiKey: 'encrypted-token',
        apiSecret: null,
        syncProducts: true,
        syncOrders: true,
        syncCustomers: true,
        syncInterval: 60,
        isActive: true,
        lastSyncAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.externalPlatformConfig.create as any).mockResolvedValue(mockConfig);

      const config = await IntegrationService.saveShopifyConfig(
        storeId,
        shopDomain,
        accessToken
      );
      
      expect(config).toEqual(mockConfig);
      expect(db.externalPlatformConfig.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          storeId,
          platform: 'shopify',
          apiUrl: expect.stringContaining(shopDomain),
          apiKey: expect.any(String), // Encrypted
        }),
      });
    });

    it('should save Mailchimp configuration with encrypted credentials', async () => {
      const storeId = 'store-123';
      const accessToken = 'mailchimp-token-456';
      const apiUrl = 'https://us1.api.mailchimp.com/3.0';
      
      const mockConfig = {
        id: 'config-123',
        storeId,
        platform: 'mailchimp',
        apiUrl,
        apiKey: 'encrypted-token',
        apiSecret: null,
        syncProducts: false,
        syncOrders: false,
        syncCustomers: true,
        syncInterval: 60,
        isActive: true,
        lastSyncAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.externalPlatformConfig.create as any).mockResolvedValue(mockConfig);

      const config = await IntegrationService.saveMailchimpConfig(
        storeId,
        accessToken,
        apiUrl
      );
      
      expect(config).toEqual(mockConfig);
      expect(db.externalPlatformConfig.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          storeId,
          platform: 'mailchimp',
          apiUrl,
          syncCustomers: true,
        }),
      });
    });

    it('should retrieve configuration by storeId and platform', async () => {
      const storeId = 'store-123';
      const platform = 'shopify';
      
      const mockConfig = {
        id: 'config-123',
        storeId,
        platform,
        apiUrl: 'https://test-store.myshopify.com/admin/api/2024-01',
        apiKey: 'encrypted-token',
        apiSecret: null,
        syncProducts: true,
        syncOrders: true,
        syncCustomers: true,
        syncInterval: 60,
        isActive: true,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.externalPlatformConfig.findFirst as any).mockResolvedValue(mockConfig);

      const config = await IntegrationService.getConfig(storeId, platform);
      
      expect(config).toEqual(mockConfig);
      expect(db.externalPlatformConfig.findFirst).toHaveBeenCalledWith({
        where: {
          storeId,
          platform,
        },
      });
    });

    it('should delete configuration', async () => {
      const configId = 'config-123';
      
      (db.externalPlatformConfig.delete as any).mockResolvedValue({ id: configId });

      await IntegrationService.deleteConfig(configId);
      
      expect(db.externalPlatformConfig.delete).toHaveBeenCalledWith({
        where: { id: configId },
      });
    });
  });

  describe('Shopify API Client', () => {
    it('should export product to Shopify', async () => {
      const storeId = 'store-123';
      const product = {
        id: 'product-123',
        name: 'Test Product',
        description: 'Test Description',
        price: 1999,
        stock: 10,
        sku: 'TEST-SKU',
      };
      
      const mockConfig = {
        id: 'config-123',
        storeId,
        platform: 'shopify',
        apiUrl: 'https://test-store.myshopify.com/admin/api/2024-01',
        apiKey: IntegrationService.encrypt('shopify-access-token'),
        apiSecret: null,
        syncProducts: true,
        syncOrders: true,
        syncCustomers: true,
        syncInterval: 60,
        isActive: true,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.externalPlatformConfig.findFirst as any).mockResolvedValue(mockConfig);
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          product: {
            id: 123456,
            title: product.name,
          },
        }),
      });

      const result = await IntegrationService.exportProductToShopify(storeId, product);
      
      expect(result.success).toBe(true);
      expect(result.externalId).toBe('123456');
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockConfig.apiUrl}/products.json`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': 'shopify-access-token',
          },
        })
      );
    });

    it('should handle Shopify API errors', async () => {
      const storeId = 'store-123';
      const product = {
        id: 'product-123',
        name: 'Test Product',
        description: 'Test Description',
        price: 1999,
        stock: 10,
        sku: 'TEST-SKU',
      };
      
      const mockConfig = {
        id: 'config-123',
        storeId,
        platform: 'shopify',
        apiUrl: 'https://test-store.myshopify.com/admin/api/2024-01',
        apiKey: IntegrationService.encrypt('shopify-access-token'),
        apiSecret: null,
        syncProducts: true,
        syncOrders: true,
        syncCustomers: true,
        syncInterval: 60,
        isActive: true,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.externalPlatformConfig.findFirst as any).mockResolvedValue(mockConfig);
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          errors: { sku: ['has already been taken'] },
        }),
      });

      const result = await IntegrationService.exportProductToShopify(storeId, product);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Shopify API error');
    });
  });

  describe('Mailchimp API Client', () => {
    it('should sync customers to Mailchimp', async () => {
      const storeId = 'store-123';
      const customers = [
        {
          id: 'customer-1',
          email: 'test1@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        {
          id: 'customer-2',
          email: 'test2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
        },
      ];
      
      const mockConfig = {
        id: 'config-123',
        storeId,
        platform: 'mailchimp',
        apiUrl: 'https://us1.api.mailchimp.com/3.0',
        apiKey: IntegrationService.encrypt('mailchimp-api-key'),
        apiSecret: null,
        syncProducts: false,
        syncOrders: false,
        syncCustomers: true,
        syncInterval: 60,
        isActive: true,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.externalPlatformConfig.findFirst as any).mockResolvedValue(mockConfig);
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          new_members: [{ email_address: customers[0].email }],
          updated_members: [{ email_address: customers[1].email }],
          errors: [],
        }),
      });

      const result = await IntegrationService.syncCustomersToMailchimp(storeId, customers);
      
      expect(result.success).toBe(true);
      expect(result.synced).toBe(2);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/lists/'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Basic'),
          },
        })
      );
    });

    it('should handle Mailchimp API errors', async () => {
      const storeId = 'store-123';
      const customers = [
        {
          id: 'customer-1',
          email: 'invalid-email',
          firstName: 'John',
          lastName: 'Doe',
        },
      ];
      
      const mockConfig = {
        id: 'config-123',
        storeId,
        platform: 'mailchimp',
        apiUrl: 'https://us1.api.mailchimp.com/3.0',
        apiKey: IntegrationService.encrypt('mailchimp-api-key'),
        apiSecret: null,
        syncProducts: false,
        syncOrders: false,
        syncCustomers: true,
        syncInterval: 60,
        isActive: true,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.externalPlatformConfig.findFirst as any).mockResolvedValue(mockConfig);
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          title: 'Invalid Resource',
          detail: 'Invalid email address',
        }),
      });

      const result = await IntegrationService.syncCustomersToMailchimp(storeId, customers);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Mailchimp API error');
    });
  });

  describe('Encryption', () => {
    it('should encrypt and decrypt API credentials', () => {
      const plaintext = 'my-secret-api-key';
      
      const encrypted = IntegrationService.encrypt(plaintext);
      const decrypted = IntegrationService.decrypt(encrypted);
      
      expect(encrypted).not.toBe(plaintext);
      expect(decrypted).toBe(plaintext);
    });

    it('should throw error on invalid encrypted data', () => {
      const invalidData = 'not-encrypted-data';
      
      expect(() => IntegrationService.decrypt(invalidData)).toThrow();
    });
  });

  describe('Sync Logging', () => {
    it('should log successful sync operation', async () => {
      const configId = 'config-123';
      const entityType = 'product';
      const action = 'export';
      const recordsProcessed = 10;
      
      const mockLog = {
        id: 'log-123',
        configId,
        entityType,
        action,
        status: 'success',
        recordsProcessed,
        recordsFailed: 0,
        errorMessage: null,
        metadata: null,
        createdAt: new Date(),
      };

      (db.syncLog.create as any).mockResolvedValue(mockLog);

      const log = await IntegrationService.logSync(configId, {
        entityType,
        action,
        status: 'success',
        recordsProcessed,
        recordsFailed: 0,
      });
      
      expect(log).toEqual(mockLog);
      expect(db.syncLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          configId,
          entityType,
          action,
          status: 'success',
        }),
      });
    });

    it('should log failed sync operation with error', async () => {
      const configId = 'config-123';
      const entityType = 'customer';
      const action = 'import';
      const errorMessage = 'Network timeout';
      
      const mockLog = {
        id: 'log-123',
        configId,
        entityType,
        action,
        status: 'failed',
        recordsProcessed: 0,
        recordsFailed: 5,
        errorMessage,
        metadata: null,
        createdAt: new Date(),
      };

      (db.syncLog.create as any).mockResolvedValue(mockLog);

      const log = await IntegrationService.logSync(configId, {
        entityType,
        action,
        status: 'failed',
        recordsProcessed: 0,
        recordsFailed: 5,
        errorMessage,
      });
      
      expect(log).toEqual(mockLog);
      expect(log.errorMessage).toBe(errorMessage);
    });
  });
});
