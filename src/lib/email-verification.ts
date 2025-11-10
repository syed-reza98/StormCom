// src/lib/email-verification.ts
// Email verification utilities: Verify and resend verification emails
// Extracted from auth-service.ts for NextAuth compatibility
// Implements FR-148 (Email Verification)

import { db } from '@/lib/db';
import { sendAccountVerification } from '@/services/email-service';
import { createAuditLog, AuditAction, AuditResource } from '@/lib/audit';
import crypto from 'crypto';

/**
 * Email verification token configuration (FR-148)
 * - 24-hour expiration
 */
const VERIFY_TOKEN_CONFIG = {
  expiresIn: 24 * 60 * 60 * 1000, // 24 hours in ms
} as const;

/**
 * Verify email with token
 * Validates token and marks email as verified
 * Implements FR-148 (Email Verification)
 * 
 * @param token - Email verification token
 * @returns Promise<{ success: boolean }>
 * 
 * @throws Error('INVALID_OR_EXPIRED_TOKEN') - Token is invalid or expired
 */
export async function verifyEmail(token: string): Promise<{ success: boolean }> {
  // Find user by verification token
  const user = await db.user.findFirst({
    where: {
      verificationToken: token,
      verificationExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new Error('INVALID_OR_EXPIRED_TOKEN');
  }

  // Mark email as verified
  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      verificationToken: null,
      verificationExpires: null,
    },
  });

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: AuditAction.EMAIL_VERIFIED,
    resource: AuditResource.USER,
    resourceId: user.id,
    metadata: { email: user.email },
  });

  return { success: true };
}

/**
 * Resend verification email
 * Generates new verification token and sends email
 * Implements FR-148 (Email Verification)
 * 
 * @param email - User's email address
 * @returns Promise<{ success: boolean }>
 * 
 * Note: Always returns success to prevent email enumeration
 */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean }> {
  // Find user
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true };
  }

  // Don't resend if already verified
  if (user.emailVerified) {
    return { success: true };
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + VERIFY_TOKEN_CONFIG.expiresIn);

  // Update user with new token
  await db.user.update({
    where: { id: user.id },
    data: {
      verificationToken,
      verificationExpires,
    },
  });

  // Send verification email
  try {
    await sendAccountVerification({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      } as any,
      verificationToken,
      expiresAt: verificationExpires,
      store: user.storeId ? undefined : undefined, // TODO: Fetch store data if storeId provided
    });
  } catch (emailError) {
    // Log email error but don't block verification flow
    console.error('Failed to send verification email:', emailError);
  }

  return { success: true };
}

/**
 * Validate email verification token
 * Checks if token exists and is not expired
 * 
 * @param token - Email verification token
 * @returns Promise<{ valid: boolean; userId?: string; error?: string }>
 */
export async function validateVerificationToken(
  token: string
): Promise<{
  valid: boolean;
  userId?: string;
  email?: string;
  error?: string;
}> {
  try {
    // Find user by verification token
    const user = await db.user.findFirst({
      where: {
        verificationToken: token,
        verificationExpires: { gt: new Date() },
      },
      select: { id: true, email: true, emailVerified: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      return { valid: false, error: 'Invalid or expired token' };
    }

    if (user.emailVerified) {
      return { valid: false, error: 'Email already verified' };
    }

    return { valid: true, userId: user.id, email: user.email };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Token validation failed' };
  }
}
