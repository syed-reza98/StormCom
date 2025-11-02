/**
 * Integration Service
 * 
 * Manages external platform integrations (Shopify, Mailchimp) with OAuth flow,
 * token management, API client wrappers, and sync logging.
 * 
 * Features:
 * - OAuth 2.0 authentication for Shopify and Mailchimp
 * - Encrypted credential storage with AES-256-GCM
 * - API client wrappers for platform-specific operations
 * - Sync operation logging with success/failure tracking
 * - Error handling with detailed error messages
 * 
 * Security:
 * - API credentials encrypted at rest
 * - Secure OAuth state parameter validation
 * - No credential exposure in logs
 */

import { db } from '@/lib/db';
import crypto from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

// Getter function for encryption key (allows dynamic access in tests)
function getEncryptionKey(): string {
  return process.env.INTEGRATION_ENCRYPTION_KEY || '';
}

// OAuth Configuration
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || '';
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';
const SHOPIFY_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/integrations/shopify/callback';
const SHOPIFY_SCOPES = 'read_products,write_products,read_orders,read_customers';

const MAILCHIMP_CLIENT_ID = process.env.MAILCHIMP_CLIENT_ID || '';
const MAILCHIMP_CLIENT_SECRET = process.env.MAILCHIMP_CLIENT_SECRET || '';
const MAILCHIMP_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/integrations/mailchimp/callback';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sku: string;
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface SyncResult {
  success: boolean;
  synced?: number;
  externalId?: string;
  error?: string;
}

export interface SyncLogInput {
  entityType: string;
  action: string;
  status: string;
  recordsProcessed: number;
  recordsFailed: number;
  errorMessage?: string;
  metadata?: string;
}

export class IntegrationService {
  // ==================== Shopify OAuth ====================

  /**
   * Generate Shopify OAuth authorization URL
   */
  static getShopifyAuthUrl(storeId: string, shopDomain: string): string {
    const params = new URLSearchParams({
      client_id: SHOPIFY_API_KEY,
      scope: SHOPIFY_SCOPES,
      redirect_uri: SHOPIFY_REDIRECT_URI,
      state: storeId, // Pass storeId for validation after callback
    });

    return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange Shopify authorization code for access token
   */
  static async exchangeShopifyCode(
    shopDomain: string,
    code: string
  ): Promise<string> {
    const response = await fetch(
      `https://${shopDomain}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: SHOPIFY_API_KEY,
          client_secret: SHOPIFY_API_SECRET,
          code,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Shopify OAuth failed: ${error.error || response.statusText}`
      );
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Save Shopify configuration with encrypted credentials
   */
  static async saveShopifyConfig(
    storeId: string,
    shopDomain: string,
    accessToken: string
  ) {
    const encryptedToken = this.encrypt(accessToken);

    // Check if config already exists
    const existing = await db.externalPlatformConfig.findFirst({
      where: { storeId, platform: 'shopify' },
    });

    if (existing) {
      // Update existing configuration
      return db.externalPlatformConfig.update({
        where: { id: existing.id },
        data: {
          apiUrl: `https://${shopDomain}/admin/api/2024-01`,
          apiKey: encryptedToken,
          updatedAt: new Date(),
        },
      });
    }

    // Create new configuration
    return db.externalPlatformConfig.create({
      data: {
        storeId,
        platform: 'shopify',
        apiUrl: `https://${shopDomain}/admin/api/2024-01`,
        apiKey: encryptedToken,
        apiSecret: null,
        syncProducts: true,
        syncOrders: true,
        syncCustomers: true,
        syncInterval: 60,
        isActive: true,
      },
    });
  }

  // ==================== Mailchimp OAuth ====================

  /**
   * Generate Mailchimp OAuth authorization URL
   */
  static getMailchimpAuthUrl(storeId: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: MAILCHIMP_CLIENT_ID,
      redirect_uri: MAILCHIMP_REDIRECT_URI,
      state: storeId,
    });

    return `https://login.mailchimp.com/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange Mailchimp authorization code for access token
   */
  static async exchangeMailchimpCode(code: string): Promise<string> {
    const response = await fetch('https://login.mailchimp.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: MAILCHIMP_CLIENT_ID,
        client_secret: MAILCHIMP_CLIENT_SECRET,
        redirect_uri: MAILCHIMP_REDIRECT_URI,
        code,
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Mailchimp OAuth failed: ${error.error || response.statusText}`
      );
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Get Mailchimp API URL from metadata endpoint
   */
  static async getMailchimpApiUrl(accessToken: string): Promise<string> {
    const response = await fetch('https://login.mailchimp.com/oauth2/metadata', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get Mailchimp API URL');
    }

    const data = await response.json();
    return data.api_endpoint; // e.g., https://us1.api.mailchimp.com/3.0
  }

  /**
   * Save Mailchimp configuration with encrypted credentials
   */
  static async saveMailchimpConfig(
    storeId: string,
    accessToken: string,
    apiUrl: string
  ) {
    const encryptedToken = this.encrypt(accessToken);

    // Check if config already exists
    const existing = await db.externalPlatformConfig.findFirst({
      where: { storeId, platform: 'mailchimp' },
    });

    if (existing) {
      // Update existing configuration
      return db.externalPlatformConfig.update({
        where: { id: existing.id },
        data: {
          apiUrl,
          apiKey: encryptedToken,
          updatedAt: new Date(),
        },
      });
    }

    // Create new configuration
    return db.externalPlatformConfig.create({
      data: {
        storeId,
        platform: 'mailchimp',
        apiUrl,
        apiKey: encryptedToken,
        apiSecret: null,
        syncProducts: false,
        syncOrders: false,
        syncCustomers: true,
        syncInterval: 60,
        isActive: true,
      },
    });
  }

  // ==================== Configuration Management ====================

  /**
   * Get configuration by storeId and platform
   */
  static async getConfig(storeId: string, platform: string) {
    return db.externalPlatformConfig.findFirst({
      where: {
        storeId,
        platform,
      },
    });
  }

  /**
   * Delete configuration
   */
  static async deleteConfig(configId: string) {
    return db.externalPlatformConfig.delete({
      where: { id: configId },
    });
  }

  // ==================== Shopify API Client ====================

  /**
   * Export product to Shopify
   */
  static async exportProductToShopify(
    storeId: string,
    product: Product
  ): Promise<SyncResult> {
    try {
      const config = await this.getConfig(storeId, 'shopify');
      if (!config) {
        return { success: false, error: 'Shopify not configured' };
      }

      const accessToken = this.decrypt(config.apiKey);

      const response = await fetch(`${config.apiUrl}/products.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({
          product: {
            title: product.name,
            body_html: product.description || '',
            variants: [
              {
                price: (product.price / 100).toString(),
                sku: product.sku,
              },
            ],
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Shopify API error: ${JSON.stringify(error)}`,
        };
      }

      const data = await response.json();
      
      // Log success
      await this.logSync(config.id, {
        entityType: 'product',
        action: 'export',
        status: 'success',
        recordsProcessed: 1,
        recordsFailed: 0,
      });

      return {
        success: true,
        externalId: data.product.id.toString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  // ==================== Mailchimp API Client ====================

  /**
   * Sync customers to Mailchimp
   */
  static async syncCustomersToMailchimp(
    storeId: string,
    customers: Customer[]
  ): Promise<SyncResult> {
    try {
      const config = await this.getConfig(storeId, 'mailchimp');
      if (!config) {
        return { success: false, error: 'Mailchimp not configured' };
      }

      const accessToken = this.decrypt(config.apiKey);
      
      // Get list ID from config metadata or use default
      const listId = process.env.MAILCHIMP_LIST_ID || 'default-list-id';

      const response = await fetch(
        `${config.apiUrl}/lists/${listId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`anystring:${accessToken}`).toString('base64')}`,
          },
          body: JSON.stringify({
            members: customers.map((c) => ({
              email_address: c.email,
              status: 'subscribed',
              merge_fields: {
                FNAME: c.firstName,
                LNAME: c.lastName,
              },
            })),
            update_existing: true,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Mailchimp API error: ${error.title || error.detail || response.statusText}`,
        };
      }

      const data = await response.json();
      const synced = (data.new_members?.length || 0) + (data.updated_members?.length || 0);
      
      // Log success
      await this.logSync(config.id, {
        entityType: 'customer',
        action: 'import',
        status: 'success',
        recordsProcessed: synced,
        recordsFailed: data.errors?.length || 0,
      });

      return { success: true, synced };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  // ==================== Encryption ====================

  /**
   * Encrypt sensitive data (API keys, tokens)
   */
  static encrypt(plaintext: string): string {
    const encryptionKey = getEncryptionKey();
    if (!encryptionKey) {
      throw new Error('INTEGRATION_ENCRYPTION_KEY not configured');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(encryptionKey, 'hex'),
      iv
    );

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = (cipher as crypto.CipherGCM).getAuthTag();

    // Return iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(ciphertext: string): string {
    const encryptionKey = getEncryptionKey();
    if (!encryptionKey) {
      throw new Error('INTEGRATION_ENCRYPTION_KEY not configured');
    }

    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      Buffer.from(encryptionKey, 'hex'),
      iv
    );
    (decipher as crypto.DecipherGCM).setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // ==================== Sync Logging ====================

  /**
   * Log sync operation result
   */
  static async logSync(configId: string, log: SyncLogInput) {
    return db.syncLog.create({
      data: {
        configId,
        entityType: log.entityType,
        action: log.action,
        status: log.status,
        recordsProcessed: log.recordsProcessed,
        recordsFailed: log.recordsFailed,
        errorMessage: log.errorMessage || null,
        metadata: log.metadata || null,
      },
    });
  }
}
