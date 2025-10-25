// src/lib/email.ts
// Email service using Resend API for transactional emails
// Environment-aware: logs emails in development, sends via Resend in production

import { Resend } from 'resend';

/**
 * Email configuration
 */
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'StormCom <noreply@stormcom.io>',
  replyTo: process.env.EMAIL_REPLY_TO,
  maxRetries: 3,
  retryDelay: 1000, // 1 second, doubles each retry
} as const;

/**
 * Initialize Resend client (production only)
 */
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

/**
 * Email template type
 */
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

/**
 * Email options
 */
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
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
 * Send an email via Resend API
 * In development: logs email to console instead of sending
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<EmailResult> {
  const isDev = process.env.NODE_ENV === 'development';

  // Development mode: log email instead of sending
  if (isDev || !resend) {
    console.warn('📧 [EMAIL - DEV MODE]', {
      from: options.from || EMAIL_CONFIG.from,
      to: options.to,
      subject: options.subject,
      replyTo: options.replyTo || EMAIL_CONFIG.replyTo,
      html: options.html.substring(0, 200) + '...',
      text: options.text?.substring(0, 200) + '...',
    });

    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    };
  }

  // Production mode: send via Resend with retry logic
  let lastError: Error | null = null;
  let retryDelay = EMAIL_CONFIG.retryDelay;

  for (let attempt = 0; attempt < EMAIL_CONFIG.maxRetries; attempt++) {
    try {
      const response = await resend.emails.send({
        from: options.from || EMAIL_CONFIG.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || EMAIL_CONFIG.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        tags: options.tags,
      });

      if (response.error) {
        throw new Error(response.error.message);
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
    error: lastError?.message || 'Failed to send email after retries',
  };
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to StormCom</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to StormCom! 🎉</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${name},</p>
          <p>Thank you for creating an account with StormCom. We're excited to have you on board!</p>
          <p>With StormCom, you can:</p>
          <ul>
            <li>Manage multiple stores from a single platform</li>
            <li>Create and sell products online</li>
            <li>Track orders and inventory in real-time</li>
            <li>Grow your business with built-in marketing tools</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Get Started
            </a>
          </div>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The StormCom Team</p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>StormCom Multi-tenant E-commerce Platform</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${name},

Thank you for creating an account with StormCom. We're excited to have you on board!

With StormCom, you can:
- Manage multiple stores from a single platform
- Create and sell products online
- Track orders and inventory in real-time
- Grow your business with built-in marketing tools

Get started: ${process.env.NEXTAUTH_URL}/dashboard

If you have any questions, feel free to reach out to our support team.

Best regards,
The StormCom Team
  `.trim();

  return sendEmail({
    to,
    subject: 'Welcome to StormCom!',
    html,
    text,
    tags: [{ name: 'category', value: 'welcome' }],
  });
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationUrl: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #667eea; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Verify Your Email</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${name},</p>
          <p>Please verify your email address to complete your StormCom registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account with StormCom, you can safely ignore this email.</p>
          <p>Best regards,<br>The StormCom Team</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${name},

Please verify your email address to complete your StormCom registration.

Verification link: ${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with StormCom, you can safely ignore this email.

Best regards,
The StormCom Team
  `.trim();

  return sendEmail({
    to,
    subject: 'Verify Your Email Address',
    html,
    text,
    tags: [{ name: 'category', value: 'verification' }],
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #667eea; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Reset Your Password</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to create a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
          <p>Best regards,<br>The StormCom Team</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${name},

We received a request to reset your password. Click the link below to create a new password.

Reset link: ${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

Best regards,
The StormCom Team
  `.trim();

  return sendEmail({
    to,
    subject: 'Reset Your Password',
    html,
    text,
    tags: [{ name: 'category', value: 'password-reset' }],
  });
}

/**
 * Send MFA enrollment email
 */
export async function sendMFAEnrollmentEmail(
  to: string,
  name: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Two-Factor Authentication Enabled</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #10b981; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🔒 Two-Factor Authentication Enabled</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${name},</p>
          <p>Two-factor authentication (2FA) has been successfully enabled on your StormCom account.</p>
          <p>From now on, you'll need to enter a 6-digit code from your authenticator app when signing in.</p>
          <p><strong>Important security tips:</strong></p>
          <ul>
            <li>Keep your backup codes in a safe place</li>
            <li>Don't share your authenticator app with anyone</li>
            <li>If you lose access to your authenticator app, use a backup code to sign in</li>
          </ul>
          <p>If you didn't enable 2FA, please contact our support team immediately.</p>
          <p>Best regards,<br>The StormCom Team</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${name},

Two-factor authentication (2FA) has been successfully enabled on your StormCom account.

From now on, you'll need to enter a 6-digit code from your authenticator app when signing in.

Important security tips:
- Keep your backup codes in a safe place
- Don't share your authenticator app with anyone
- If you lose access to your authenticator app, use a backup code to sign in

If you didn't enable 2FA, please contact our support team immediately.

Best regards,
The StormCom Team
  `.trim();

  return sendEmail({
    to,
    subject: 'Two-Factor Authentication Enabled',
    html,
    text,
    tags: [{ name: 'category', value: 'security' }],
  });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  orderNumber: string,
  orderTotal: string,
  orderUrl: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #10b981; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Order Confirmed! ✓</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hi ${name},</p>
          <p>Thank you for your order! We've received your order and are processing it.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Order Number:</strong> ${orderNumber}</p>
            <p style="margin: 5px 0;"><strong>Order Total:</strong> ${orderTotal}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${orderUrl}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Order Details
            </a>
          </div>
          <p>We'll send you another email when your order ships.</p>
          <p>Best regards,<br>The StormCom Team</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${name},

Thank you for your order! We've received your order and are processing it.

Order Number: ${orderNumber}
Order Total: ${orderTotal}

View order details: ${orderUrl}

We'll send you another email when your order ships.

Best regards,
The StormCom Team
  `.trim();

  return sendEmail({
    to,
    subject: `Order Confirmation - ${orderNumber}`,
    html,
    text,
    tags: [
      { name: 'category', value: 'order' },
      { name: 'orderNumber', value: orderNumber },
    ],
  });
}
