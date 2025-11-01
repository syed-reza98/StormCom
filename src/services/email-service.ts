// src/services/email-service.ts
// Email service with Resend integration, template rendering, retry logic, and deduplication
// Implements FR-077 (queue with retry), FR-078 (template variables), FR-079 (deduplication)

import { Resend } from 'resend';
import type { User, Store } from '@prisma/client';

/**
 * Email configuration from environment
 */
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'StormCom <noreply@stormcom.io>',
  replyTo: process.env.EMAIL_REPLY_TO,
  maxRetries: 3,
  retryDelayMs: 1000, // Initial delay, doubles each retry
  deduplicationTTL: 24 * 60 * 60, // 24 hours in seconds
} as const;

/**
 * Initialize Resend client
 */
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Email template variables with fallback support (FR-078)
 */
export interface TemplateVariables {
  [key: string]: string | number | undefined | null;
}

/**
 * Email send options
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Email send result
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Order confirmation email data (simplified for React Email templates)
 */
export interface OrderConfirmationData {
  to: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  storeName: string;
  storeEmail?: string;
  orderItems: Array<{
    name: string;
    quantity: string;
    price: number;
    total: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  orderUrl: string;
}

/**
 * Shipping confirmation email data (simplified for React Email templates)
 */
export interface ShippingConfirmationData {
  to: string;
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery?: string;
  storeName: string;
  storeEmail?: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  trackingUrl?: string;
}

/**
 * Password reset email data
 */
export interface PasswordResetData {
  user: User;
  resetToken: string;
  expiresAt: Date;
  ipAddress?: string;
}

/**
 * Account verification email data
 */
export interface AccountVerificationData {
  user: User;
  verificationToken: string;
  expiresAt: Date;
  store?: Store;
}

/**
 * Deduplication key storage (in-memory for development, Redis/KV for production)
 */
const deduplicationStore = new Map<string, number>();

/**
 * Generate deduplication key (FR-079)
 * Format: email:{orderId}:{eventType}
 */
function generateDeduplicationKey(
  entityId: string,
  eventType: string
): string {
  return `email:${entityId}:${eventType}`;
}

/**
 * Check if email has been sent recently (deduplication)
 */
async function isDuplicate(
  entityId: string,
  eventType: string
): Promise<boolean> {
  const key = generateDeduplicationKey(entityId, eventType);

  // In production, check Redis/Vercel KV
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv');
      const exists = await kv.exists(key);
      return exists === 1;
    } catch (error) {
      console.warn('KV store unavailable, using in-memory deduplication:', error);
    }
  }

  // Development: use in-memory store
  const timestamp = deduplicationStore.get(key);
  if (!timestamp) return false;

  const now = Date.now();
  const ageSeconds = (now - timestamp) / 1000;

  // Check if within TTL
  if (ageSeconds < EMAIL_CONFIG.deduplicationTTL) {
    return true;
  }

  // Expired, remove from store
  deduplicationStore.delete(key);
  return false;
}

/**
 * Mark email as sent (for deduplication)
 */
async function markAsSent(entityId: string, eventType: string): Promise<void> {
  const key = generateDeduplicationKey(entityId, eventType);

  // In production, use Redis/Vercel KV with TTL
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(key, Date.now(), { ex: EMAIL_CONFIG.deduplicationTTL });
      return;
    } catch (error) {
      console.warn('KV store unavailable, using in-memory deduplication:', error);
    }
  }

  // Development: use in-memory store
  deduplicationStore.set(key, Date.now());

  // Cleanup old entries (memory management)
  if (deduplicationStore.size > 10000) {
    const now = Date.now();
    for (const [k, timestamp] of deduplicationStore.entries()) {
      const ageSeconds = (now - timestamp) / 1000;
      if (ageSeconds > EMAIL_CONFIG.deduplicationTTL) {
        deduplicationStore.delete(k);
      }
    }
  }
}

/**
 * Render template with variable substitution and fallbacks (FR-078)
 * Supports Handlebars-style {{variableName}} syntax
 * XSS protection: HTML entities escaped
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  // Fallback values per FR-078
  const fallbacks: Record<string, string> = {
    firstName: 'Valued Customer',
    lastName: '',
    orderNumber: '[Order #]',
    orderTotal: '$0.00',
    storeName: 'Our Store',
    productName: 'Product',
    quantity: '0',
  };

  // Composite variable: customerName = firstName + lastName
  const firstName = variables.firstName?.toString() || fallbacks.firstName;
  const lastName = variables.lastName?.toString() || fallbacks.lastName;
  const customerName = `${firstName} ${lastName}`.trim();

  const allVariables: Record<string, string | number | undefined | null> = { ...variables, customerName };

  // Replace {{variableName}} with actual value or fallback
  let rendered = template;
  const variablePattern = /\{\{(\w+)\}\}/g;

  rendered = rendered.replace(variablePattern, (_match, varName: string) => {
    let value = allVariables[varName];

    // Use fallback if variable is missing
    if (value === undefined || value === null || value === '') {
      value = (fallbacks as Record<string, string>)[varName] || '';
    }

    // Escape HTML entities for XSS protection
    return escapeHtml(String(value));
  });

  return rendered;
}

/**
 * Escape HTML entities to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Send email with retry logic (FR-077: exponential backoff, max 3 attempts)
 */
export async function sendEmail(
  options: SendEmailOptions,
  entityId?: string,
  eventType?: string
): Promise<EmailResult> {
  const isDev = process.env.NODE_ENV === 'development';

  // Check for duplicate (FR-079)
  if (entityId && eventType) {
    const duplicate = await isDuplicate(entityId, eventType);
    if (duplicate) {
      console.warn(`Duplicate email prevented: ${eventType} for ${entityId}`);
      return {
        success: true,
        messageId: 'duplicate-prevented',
      };
    }
  }

  // Development mode: log email instead of sending
  if (isDev || !resend) {
    console.log('📧 [EMAIL - DEV MODE]', {
      from: options.from || EMAIL_CONFIG.from,
      to: options.to,
      subject: options.subject,
      html: options.html.substring(0, 200) + '...',
      entityId,
      eventType,
    });

    // Mark as sent for deduplication
    if (entityId && eventType) {
      await markAsSent(entityId, eventType);
    }

    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    };
  }

  // Production mode: send via Resend with retry logic
  let lastError: Error | null = null;
  let retryDelay = EMAIL_CONFIG.retryDelayMs;

  for (let attempt = 0; attempt < EMAIL_CONFIG.maxRetries; attempt++) {
    try {
      const response = await resend.emails.send({
        from: options.from || EMAIL_CONFIG.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || EMAIL_CONFIG.replyTo,
        tags: options.tags,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Mark as sent for deduplication
      if (entityId && eventType) {
        await markAsSent(entityId, eventType);
      }

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`Email send attempt ${attempt + 1} failed:`, error);

      // Wait before retrying (exponential backoff)
      if (attempt < EMAIL_CONFIG.maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // Double delay for next retry
      }
    }
  }

  // All retries failed
  return {
    success: false,
    error: lastError?.message || 'Failed to send email after 3 retries',
  };
}

/**
 * Send order confirmation email (T174)
 * Triggered when order status changes to PROCESSING
 */
export async function sendOrderConfirmation(
  data: OrderConfirmationData
): Promise<EmailResult> {
  const { to, customerName, orderNumber, orderDate, storeName, storeEmail, orderItems, subtotal, shipping, tax, total, shippingAddress, orderUrl } = data;

  // Build items HTML
  const itemsHtml = orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        ${item.name}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        $${item.total.toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: #10b981; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed! ✓</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <p style="font-size: 16px;">Hi ${customerName},</p>
          <p style="font-size: 16px;">Thank you for your order! We've received your order and are processing it.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Order Date:</strong> ${orderDate}</p>
            <p style="margin: 5px 0;"><strong>Store:</strong> ${storeName}</p>
          </div>

          <h2 style="font-size: 18px; color: #374151; margin-top: 30px;">Order Items</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb;">Quantity</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
            <p style="display: flex; justify-content: space-between; margin: 5px 0;">
              <span>Subtotal:</span>
              <span>$${subtotal.toFixed(2)}</span>
            </p>
            <p style="display: flex; justify-content: space-between; margin: 5px 0;">
              <span>Shipping:</span>
              <span>$${shipping.toFixed(2)}</span>
            </p>
            <p style="display: flex; justify-content: space-between; margin: 5px 0;">
              <span>Tax:</span>
              <span>$${tax.toFixed(2)}</span>
            </p>
            <p style="display: flex; justify-content: space-between; margin: 15px 0 0 0; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 18px; font-weight: bold;">
              <span>Total:</span>
              <span style="color: #10b981;">$${total.toFixed(2)}</span>
            </p>
          </div>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="font-size: 16px; margin-top: 0;">Shipping Address</h3>
            <p style="margin: 5px 0;">${shippingAddress.line1}</p>
            ${shippingAddress.line2 ? `<p style="margin: 5px 0;">${shippingAddress.line2}</p>` : ''}
            <p style="margin: 5px 0;">${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}</p>
            <p style="margin: 5px 0;">${shippingAddress.country}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${orderUrl}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              View Order Details
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280;">We'll send you another email when your order ships.</p>
          <p style="font-size: 14px;">Best regards,<br><strong>${storeName}</strong></p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>${storeName} | Powered by StormCom</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(
    {
      to,
      subject: `Order Confirmation - ${orderNumber}`,
      html,
      from: `${storeName} <${storeEmail || EMAIL_CONFIG.from}>`,
      replyTo: storeEmail,
      tags: [
        { name: 'category', value: 'order-confirmation' },
        { name: 'orderNumber', value: orderNumber },
      ],
    },
    orderNumber,
    'order-confirmation'
  );
}

/**
 * Send shipping confirmation email (T174)
 * Triggered when order status changes to SHIPPED
 */
export async function sendShippingConfirmation(
  data: ShippingConfirmationData
): Promise<EmailResult> {
  const { to, customerName, orderNumber, trackingNumber, carrier, estimatedDelivery, storeName, storeEmail, shippingAddress, trackingUrl } = data;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Your Order Has Shipped</title>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: #3b82f6; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📦 Your Order Has Shipped!</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <p style="font-size: 16px;">Hi ${customerName},</p>
          <p style="font-size: 16px;">Great news! Your order has been shipped and is on its way to you.</p>
          
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
            <p style="margin: 5px 0;"><strong>Carrier:</strong> ${carrier}</p>
            ${estimatedDelivery ? `<p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ''}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl || `${process.env.NEXTAUTH_URL}/orders/${orderNumber}`}" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              Track Your Shipment
            </a>
          </div>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="font-size: 16px; margin-top: 0;">Shipping Address</h3>
            <p style="margin: 5px 0;">${shippingAddress.line1}</p>
            ${shippingAddress.line2 ? `<p style="margin: 5px 0;">${shippingAddress.line2}</p>` : ''}
            <p style="margin: 5px 0;">${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}</p>
            <p style="margin: 5px 0;">${shippingAddress.country}</p>
          </div>

          <p style="font-size: 14px; color: #6b7280;">If you have any questions about your shipment, please contact our support team.</p>
          <p style="font-size: 14px;">Best regards,<br><strong>${storeName}</strong></p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>${storeName} | Powered by StormCom</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(
    {
      to,
      subject: `Your Order Has Shipped - ${orderNumber}`,
      html,
      from: `${storeName} <${storeEmail || EMAIL_CONFIG.from}>`,
      replyTo: storeEmail,
      tags: [
        { name: 'category', value: 'shipping-confirmation' },
        { name: 'orderNumber', value: orderNumber },
        { name: 'trackingNumber', value: trackingNumber },
      ],
    },
    orderNumber,
    'shipping-confirmation'
  );
}

/**
 * Send password reset email (T174)
 * Triggered when user requests password reset
 */
export async function sendPasswordReset(
  data: PasswordResetData
): Promise<EmailResult> {
  const { user, resetToken, expiresAt, ipAddress } = data;
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: #ef4444; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔒 Reset Your Password</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <p style="font-size: 16px;">Hi ${user.name},</p>
          <p style="font-size: 16px;">We received a request to reset your password. Click the button below to create a new password.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>

          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 5px 0; font-size: 14px;"><strong>Security Notice:</strong></p>
            <p style="margin: 5px 0; font-size: 14px;">• This link expires at ${expiresAt.toLocaleString()}</p>
            ${ipAddress ? `<p style="margin: 5px 0; font-size: 14px;">• Request from IP: ${ipAddress}</p>` : ''}
            <p style="margin: 5px 0; font-size: 14px;">• If you didn't request this, you can safely ignore this email</p>
          </div>

          <p style="font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">${resetUrl}</p>

          <p style="font-size: 14px; margin-top: 30px;">Best regards,<br><strong>The StormCom Team</strong></p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>StormCom Multi-tenant E-commerce Platform</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(
    {
      to: user.email,
      subject: 'Reset Your Password - StormCom',
      html,
      tags: [{ name: 'category', value: 'password-reset' }],
    },
    user.id,
    'password-reset'
  );
}

/**
 * Send account verification email (T174)
 * Triggered when user registers new account
 */
export async function sendAccountVerification(
  data: AccountVerificationData
): Promise<EmailResult> {
  const { user, verificationToken, expiresAt, store } = data;
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify?token=${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email Address</title>
      </head>
      <body style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: #10b981; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${store?.name || 'StormCom'}! 🎉</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <p style="font-size: 16px;">Hi ${user.name},</p>
          <p style="font-size: 16px;">Thank you for creating an account! Please verify your email address to complete your registration.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
              Verify Email Address
            </a>
          </div>

          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 5px 0; font-size: 14px;">• This link expires at ${expiresAt.toLocaleString()}</p>
            <p style="margin: 5px 0; font-size: 14px;">• You can request a new verification link if this one expires</p>
          </div>

          <p style="font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">${verificationUrl}</p>

          <p style="font-size: 14px; margin-top: 30px;">Best regards,<br><strong>${store?.name || 'The StormCom Team'}</strong></p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>${store?.name || 'StormCom Multi-tenant E-commerce Platform'}</p>
        </div>
      </body>
    </html>
  `;

  return sendEmail(
    {
      to: user.email,
      subject: `Verify Your Email Address - ${store?.name || 'StormCom'}`,
      html,
      from: store?.email
        ? `${store.name} <${store.email}>`
        : EMAIL_CONFIG.from,
      tags: [{ name: 'category', value: 'account-verification' }],
    },
    user.id,
    'account-verification'
  );
}
