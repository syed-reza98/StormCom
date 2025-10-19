/**
 * Email Sender using Resend
 * Handles transactional emails for the platform
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailData {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: { name: string; value: string }[];
  attachments?: {
    filename: string;
    content: Buffer | string;
  }[];
}

/**
 * Send email using Resend
 */
export async function sendEmail(data: EmailData): Promise<{ id: string; success: boolean }> {
  try {
    const fromEmail = data.from || process.env.EMAIL_FROM || 'noreply@stormcom.io';

    const result = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(data.to) ? data.to : [data.to],
      subject: data.subject,
      html: data.html,
      text: data.text,
      replyTo: data.replyTo,
      cc: data.cc,
      bcc: data.bcc,
      tags: data.tags,
      attachments: data.attachments,
    });

    return {
      id: result.data?.id || '',
      success: true,
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  to: string,
  userName: string,
  loginUrl: string
): Promise<void> {
  await sendEmail({
    to,
    subject: 'Welcome to StormCom!',
    html: `
      <h1>Welcome to StormCom, ${userName}!</h1>
      <p>Your account has been successfully created.</p>
      <p>You can now log in to your dashboard:</p>
      <p><a href="${loginUrl}">Login to Dashboard</a></p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The StormCom Team</p>
    `,
    text: `Welcome to StormCom, ${userName}! Your account has been successfully created. You can now log in at: ${loginUrl}`,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  userName: string,
  resetUrl: string,
  expiresInMinutes: number = 60
): Promise<void> {
  await sendEmail({
    to,
    subject: 'Reset Your Password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi ${userName},</p>
      <p>We received a request to reset your password. Click the link below to create a new password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in ${expiresInMinutes} minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The StormCom Team</p>
    `,
    text: `Hi ${userName}, Click this link to reset your password: ${resetUrl}. This link expires in ${expiresInMinutes} minutes.`,
  });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  to: string,
  orderNumber: string,
  orderTotal: string,
  orderUrl: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `Order Confirmation - ${orderNumber}`,
    html: `
      <h1>Order Confirmed!</h1>
      <p>Thank you for your order!</p>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Total:</strong> ${orderTotal}</p>
      <p>You can track your order here:</p>
      <p><a href="${orderUrl}">View Order Details</a></p>
      <p>Best regards,<br>The StormCom Team</p>
    `,
    text: `Order Confirmed! Order Number: ${orderNumber}, Total: ${orderTotal}. Track your order: ${orderUrl}`,
  });
}

/**
 * Send order shipped email
 */
export async function sendOrderShippedEmail(
  to: string,
  orderNumber: string,
  trackingNumber: string,
  trackingUrl?: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `Your Order Has Shipped - ${orderNumber}`,
    html: `
      <h1>Your Order Has Shipped!</h1>
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
      ${trackingUrl ? `<p><a href="${trackingUrl}">Track Your Package</a></p>` : ''}
      <p>Thank you for shopping with us!</p>
      <p>Best regards,<br>The StormCom Team</p>
    `,
    text: `Your order ${orderNumber} has shipped! Tracking: ${trackingNumber}${trackingUrl ? `. Track at: ${trackingUrl}` : ''}`,
  });
}

/**
 * Send invoice email
 */
export async function sendInvoiceEmail(
  to: string,
  invoiceNumber: string,
  invoicePdf: Buffer,
  invoiceTotal: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `Invoice ${invoiceNumber}`,
    html: `
      <h1>Invoice</h1>
      <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
      <p><strong>Total:</strong> ${invoiceTotal}</p>
      <p>Please find your invoice attached.</p>
      <p>Best regards,<br>The StormCom Team</p>
    `,
    text: `Invoice ${invoiceNumber} - Total: ${invoiceTotal}. See attached PDF.`,
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: invoicePdf,
      },
    ],
  });
}

/**
 * Send store invitation email
 */
export async function sendStoreInvitationEmail(
  to: string,
  storeName: string,
  inviterName: string,
  inviteUrl: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `You've been invited to join ${storeName}`,
    html: `
      <h1>Store Invitation</h1>
      <p>Hi there!</p>
      <p>${inviterName} has invited you to join <strong>${storeName}</strong> on StormCom.</p>
      <p><a href="${inviteUrl}">Accept Invitation</a></p>
      <p>Best regards,<br>The StormCom Team</p>
    `,
    text: `${inviterName} has invited you to join ${storeName}. Accept invitation: ${inviteUrl}`,
  });
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(
  to: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): Promise<void> {
  await sendEmail({
    to,
    subject: title,
    html: `
      <h1>${title}</h1>
      <p>${message}</p>
      ${actionUrl && actionText ? `<p><a href="${actionUrl}">${actionText}</a></p>` : ''}
      <p>Best regards,<br>The StormCom Team</p>
    `,
    text: `${title}\n\n${message}${actionUrl ? `\n\n${actionText}: ${actionUrl}` : ''}`,
  });
}

export { resend };
export default resend;
