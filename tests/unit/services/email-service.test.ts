/**
 * Unit Tests: EmailService
 * 
 * Comprehensive test coverage for Phase 13 US9 Email Notifications:
 * - Template rendering with variable substitution
 * - Fallback values for missing variables (FR-078)
 * - XSS protection (HTML entity escaping)
 * - Email sending with retry logic (FR-077)
 * - Deduplication (FR-079)
 * - Environment-aware behavior (dev logs vs production sends)
 * 
 * @module tests/unit/services/email-service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendEmail, sendOrderConfirmation, sendShippingConfirmation, sendPasswordReset, sendAccountVerification } from '@/services/email-service';
import { Resend } from 'resend';

// Mock Resend
vi.mock('resend', () => {
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: vi.fn(),
      },
    })),
  };
});

describe('EmailService - Template Rendering', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('RESEND_API_KEY', 'test_api_key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('should substitute template variables correctly', () => {
    const { renderTemplate } = require('@/services/email-service');
    const template = 'Hello {{firstName}} {{lastName}}, your order {{orderNumber}} is ready!';
    const variables = {
      firstName: 'John',
      lastName: 'Doe',
      orderNumber: 'ORD-12345',
    };

    const result = renderTemplate(template, variables);
    expect(result).toBe('Hello John Doe, your order ORD-12345 is ready!');
  });

  it('should use fallback values for missing variables (FR-078)', () => {
    const { renderTemplate } = require('@/services/email-service');
    const template = 'Hello {{firstName}} {{lastName}}, order {{orderNumber}} total: {{orderTotal}}';
    const variables = {}; // All variables missing

    const result = renderTemplate(template, variables);
    expect(result).toContain('Valued Customer'); // Default firstName fallback
    expect(result).toContain('[Order #]'); // Default orderNumber fallback
    expect(result).toContain('$0.00'); // Default orderTotal fallback
  });

  it('should handle composite variables (customerName)', () => {
    const { renderTemplate } = require('@/services/email-service');
    const template = 'Hello {{customerName}}, welcome!';
    const variables = {
      firstName: 'Jane',
      lastName: 'Smith',
    };

    const result = renderTemplate(template, variables);
    expect(result).toBe('Hello Jane Smith, welcome!');
  });

  it('should escape HTML entities for XSS protection', () => {
    const { escapeHtml } = require('@/services/email-service');
    
    expect(escapeHtml('<script>alert("XSS")</script>')).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    expect(escapeHtml("It's a test")).toBe('It&#x27;s a test');
  });

  it('should handle empty template', () => {
    const { renderTemplate } = require('@/services/email-service');
    const result = renderTemplate('', {});
    expect(result).toBe('');
  });

  it('should handle template with no variables', () => {
    const { renderTemplate } = require('@/services/email-service');
    const template = 'This is a static email template with no variables.';
    const result = renderTemplate(template, { firstName: 'John' });
    expect(result).toBe('This is a static email template with no variables.');
  });
});

describe('EmailService - Email Sending', () => {
  let mockResendSend: any;

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production'); // Test production mode
    vi.stubEnv('RESEND_API_KEY', 'test_api_key');
    
    const MockedResend = Resend as any;
    mockResendSend = vi.fn().mockResolvedValue({ id: 'email_123' });
    MockedResend.mockImplementation(() => ({
      emails: {
        send: mockResendSend,
      },
    }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('should send email successfully in production mode', async () => {
    await sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>',
      from: 'noreply@stormcom.io',
    });

    expect(mockResendSend).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>',
      from: 'noreply@stormcom.io',
    });
    expect(mockResendSend).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure (FR-077 - max 3 attempts)', async () => {
    mockResendSend
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ id: 'email_123' }); // Succeed on 3rd attempt

    await sendEmail({
      to: 'test@example.com',
      subject: 'Test Retry',
      html: '<p>Retry test</p>',
    });

    expect(mockResendSend).toHaveBeenCalledTimes(3); // Failed twice, succeeded on 3rd
  });

  it('should fail after max retry attempts', async () => {
    mockResendSend.mockRejectedValue(new Error('Persistent error'));

    await expect(
      sendEmail({
        to: 'test@example.com',
        subject: 'Test Failure',
        html: '<p>Failure test</p>',
      })
    ).rejects.toThrow('Persistent error');

    expect(mockResendSend).toHaveBeenCalledTimes(3); // Max 3 attempts per FR-077
  });

  it('should use exponential backoff for retries (1s, 2s, 4s)', async () => {
    const delays: number[] = [];
    const originalSetTimeout = setTimeout;
    
    // Mock setTimeout to capture delays
    global.setTimeout = ((fn: any, delay: number) => {
      delays.push(delay);
      return originalSetTimeout(fn, 0); // Execute immediately for test
    }) as any;

    mockResendSend
      .mockRejectedValueOnce(new Error('Error 1'))
      .mockRejectedValueOnce(new Error('Error 2'))
      .mockResolvedValueOnce({ id: 'email_123' });

    await sendEmail({
      to: 'test@example.com',
      subject: 'Test Backoff',
      html: '<p>Backoff test</p>',
    });

    // Verify exponential backoff: 1000ms, 2000ms
    expect(delays).toContain(1000); // 1st retry delay
    expect(delays).toContain(2000); // 2nd retry delay

    global.setTimeout = originalSetTimeout;
  });

  it('should log in development mode instead of sending', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await sendEmail({
      to: 'dev@example.com',
      subject: 'Dev Test',
      html: '<p>Dev content</p>',
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('📧 [DEV MODE] Email would be sent')
    );
    expect(mockResendSend).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should prevent duplicate emails via deduplication (FR-079)', async () => {
    const entityId = 'order_123';
    const eventType = 'order-confirmation';

    // Send first email
    await sendEmail(
      {
        to: 'test@example.com',
        subject: 'Order Confirmation',
        html: '<p>Your order is confirmed</p>',
      },
      entityId,
      eventType
    );

    // Try to send duplicate (should be blocked)
    await sendEmail(
      {
        to: 'test@example.com',
        subject: 'Order Confirmation',
        html: '<p>Your order is confirmed</p>',
      },
      entityId,
      eventType
    );

    // Should only send once (deduplication prevents 2nd send)
    expect(mockResendSend).toHaveBeenCalledTimes(1);
  });

  it('should allow same email after 24-hour TTL expires', async () => {
    const { isDuplicate, markAsSent } = require('@/services/email-service');
    const entityId = 'order_456';
    const eventType = 'order-confirmation';
    const key = `email:${entityId}:${eventType}`;

    // Mark as sent 25 hours ago (expired)
    const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000);
    markAsSent(key, expiredTimestamp);

    // Check if duplicate (should return false since expired)
    const duplicate = isDuplicate(key);
    expect(duplicate).toBe(false);
  });
});

describe('EmailService - Order Confirmation', () => {
  let mockResendSend: any;

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', 'test_api_key');
    
    const MockedResend = Resend as any;
    mockResendSend = vi.fn().mockResolvedValue({ id: 'email_order_123' });
    MockedResend.mockImplementation(() => ({
      emails: {
        send: mockResendSend,
      },
    }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('should send order confirmation with all order details', async () => {
    await sendOrderConfirmation({
      to: 'customer@example.com',
      customerName: 'John Doe',
      orderNumber: 'ORD-12345',
      orderDate: '2025-01-26',
      storeName: 'Test Store',
      storeEmail: 'store@example.com',
      orderItems: [
        { name: 'Product 1', quantity: '2', price: 29.99, total: 59.98 },
        { name: 'Product 2', quantity: '1', price: 49.99, total: 49.99 },
      ],
      subtotal: 109.97,
      shipping: 10.00,
      tax: 9.60,
      total: 129.57,
      shippingAddress: {
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      },
      orderUrl: 'https://stormcom.io/orders/12345',
    });

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const emailCall = mockResendSend.mock.calls[0][0];
    expect(emailCall.to).toBe('customer@example.com');
    expect(emailCall.subject).toContain('Order Confirmation');
    expect(emailCall.html).toContain('ORD-12345');
    expect(emailCall.html).toContain('John Doe');
    expect(emailCall.html).toContain('Product 1');
    expect(emailCall.html).toContain('$129.57');
  });

  it('should handle missing order items gracefully', async () => {
    await sendOrderConfirmation({
      to: 'customer@example.com',
      customerName: 'Jane Smith',
      orderNumber: 'ORD-67890',
      orderDate: '2025-01-26',
      storeName: 'Test Store',
      orderItems: [], // Empty items
      subtotal: 0,
      shipping: 0,
      tax: 0,
      total: 0,
      shippingAddress: {
        line1: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US',
      },
      orderUrl: 'https://stormcom.io/orders/67890',
    });

    expect(mockResendSend).toHaveBeenCalledTimes(1);
  });

  it('should use store branding in from address', async () => {
    await sendOrderConfirmation({
      to: 'customer@example.com',
      customerName: 'Bob Johnson',
      orderNumber: 'ORD-11111',
      orderDate: '2025-01-26',
      storeName: 'Electronics Plus',
      storeEmail: 'orders@electronicsplus.com',
      orderItems: [
        { name: 'Laptop', quantity: '1', price: 1299.99, total: 1299.99 },
      ],
      subtotal: 1299.99,
      shipping: 20.00,
      tax: 105.60,
      total: 1425.59,
      shippingAddress: {
        line1: '789 Pine Blvd',
        city: 'Chicago',
        state: 'IL',
        postalCode: '60601',
        country: 'US',
      },
      orderUrl: 'https://stormcom.io/orders/11111',
    });

    const emailCall = mockResendSend.mock.calls[0][0];
    expect(emailCall.from).toContain('Electronics Plus');
  });
});

describe('EmailService - Shipping Confirmation', () => {
  let mockResendSend: any;

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', 'test_api_key');
    
    const MockedResend = Resend as any;
    mockResendSend = vi.fn().mockResolvedValue({ id: 'email_ship_123' });
    MockedResend.mockImplementation(() => ({
      emails: {
        send: mockResendSend,
      },
    }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('should send shipping confirmation with tracking info', async () => {
    await sendShippingConfirmation({
      to: 'customer@example.com',
      customerName: 'Alice Williams',
      orderNumber: 'ORD-22222',
      trackingNumber: 'TRACK123456789',
      carrier: 'UPS',
      estimatedDelivery: '2025-01-30',
      storeName: 'Test Store',
      shippingAddress: {
        line1: '321 Elm St',
        city: 'Miami',
        state: 'FL',
        postalCode: '33101',
        country: 'US',
      },
      trackingUrl: 'https://ups.com/track?id=TRACK123456789',
    });

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const emailCall = mockResendSend.mock.calls[0][0];
    expect(emailCall.subject).toContain('Shipped');
    expect(emailCall.html).toContain('TRACK123456789');
    expect(emailCall.html).toContain('UPS');
    expect(emailCall.html).toContain('2025-01-30');
  });

  it('should handle missing tracking number', async () => {
    await sendShippingConfirmation({
      to: 'customer@example.com',
      customerName: 'Charlie Brown',
      orderNumber: 'ORD-33333',
      trackingNumber: '', // Missing
      carrier: 'Standard Shipping',
      storeName: 'Test Store',
      shippingAddress: {
        line1: '654 Maple Dr',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'US',
      },
    });

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const emailCall = mockResendSend.mock.calls[0][0];
    expect(emailCall.html).toContain('Standard Shipping'); // Carrier still shown
  });

  it('should support multiple tracking numbers', async () => {
    await sendShippingConfirmation({
      to: 'customer@example.com',
      customerName: 'Diana Prince',
      orderNumber: 'ORD-44444',
      trackingNumber: 'TRACK-A, TRACK-B', // Multiple tracking numbers
      carrier: 'FedEx',
      storeName: 'Test Store',
      shippingAddress: {
        line1: '987 Cedar Ln',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'US',
      },
    });

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const emailCall = mockResendSend.mock.calls[0][0];
    expect(emailCall.html).toContain('TRACK-A');
    expect(emailCall.html).toContain('TRACK-B');
  });
});

describe('EmailService - Password Reset', () => {
  let mockResendSend: any;

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', 'test_api_key');
    
    const MockedResend = Resend as any;
    mockResendSend = vi.fn().mockResolvedValue({ id: 'email_reset_123' });
    MockedResend.mockImplementation(() => ({
      emails: {
        send: mockResendSend,
      },
    }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('should send password reset email with reset link', async () => {
    const user = { id: 'user_123', email: 'user@example.com', name: 'Test User' };
    const resetToken = 'reset_token_abc123';
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await sendPasswordReset({
      user,
      resetToken,
      expiresAt,
    });

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const emailCall = mockResendSend.mock.calls[0][0];
    expect(emailCall.to).toBe('user@example.com');
    expect(emailCall.subject).toContain('Password Reset');
    expect(emailCall.html).toContain('reset_token_abc123');
    expect(emailCall.html).toContain('Test User');
  });

  it('should include IP address in security notice when provided', async () => {
    const user = { id: 'user_456', email: 'user2@example.com', name: 'User Two' };
    const resetToken = 'reset_token_def456';
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const ipAddress = '192.168.1.100';

    await sendPasswordReset({
      user,
      resetToken,
      expiresAt,
      ipAddress,
    });

    const emailCall = mockResendSend.mock.calls[0][0];
    expect(emailCall.html).toContain('192.168.1.100');
  });

  it('should handle missing IP address gracefully', async () => {
    const user = { id: 'user_789', email: 'user3@example.com', name: 'User Three' };
    const resetToken = 'reset_token_ghi789';
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await sendPasswordReset({
      user,
      resetToken,
      expiresAt,
      // No ipAddress provided
    });

    expect(mockResendSend).toHaveBeenCalledTimes(1);
  });
});

describe('EmailService - Account Verification', () => {
  let mockResendSend: any;

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', 'test_api_key');
    vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
    
    // Clear module cache to force re-initialization with new mock
    vi.resetModules();
    
    const MockedResend = Resend as any;
    mockResendSend = vi.fn().mockResolvedValue({ id: 'email_verify_123' });
    MockedResend.mockImplementation(() => ({
      emails: {
        send: mockResendSend,
      },
    }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('should send account verification email with token', async () => {
    const { sendAccountVerification } = await import('@/services/email-service');
    
    const user = { id: 'user_new', email: 'newuser@example.com', name: 'New User' } as any;
    const verificationToken = 'verify_token_123';
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await sendAccountVerification({
      user,
      verificationToken,
      expiresAt,
    });

    expect(mockResendSend).toHaveBeenCalledTimes(1);
    const emailCall = mockResendSend.mock.calls[0][0];
    expect(emailCall.to).toBe('newuser@example.com');
    expect(emailCall.subject).toContain('Verify');
    expect(emailCall.html).toContain('verify_token_123');
    expect(emailCall.html).toContain('New User');
  });

  it('should include store-specific branding when store provided', async () => {
    const { sendAccountVerification } = await import('@/services/email-service');
    
    const user = { id: 'user_store', email: 'storeuser@example.com', name: 'Store User' } as any;
    const verificationToken = 'verify_token_456';
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const store = { id: 'store_123', name: 'My Custom Store', email: 'store@example.com' } as any;

    await sendAccountVerification({
      user,
      verificationToken,
      expiresAt,
      store,
    });

    const emailCall = mockResendSend.mock.calls[0][0];
    expect(emailCall.html).toContain('My Custom Store');
  });

  it('should show 24-hour expiration notice', async () => {
    const { sendAccountVerification } = await import('@/services/email-service');
    
    const user = { id: 'user_exp', email: 'expuser@example.com', name: 'Exp User' } as any;
    const verificationToken = 'verify_token_789';
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await sendAccountVerification({
      user,
      verificationToken,
      expiresAt,
    });

    const emailCall = mockResendSend.mock.calls[0][0];
    expect(emailCall.html).toContain('24'); // 24-hour expiration mention
  });
});
