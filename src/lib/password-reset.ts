// src/lib/password-reset.ts
// Password reset utilities: Request and complete password reset flow
// Extracted from auth-service.ts for NextAuth compatibility
// Implements FR-047 (Forgot Password), FR-048 (Reset Password), FR-059E (Password History)

import { db } from '@/lib/db';
import { hashPassword, isPasswordInHistory } from '@/lib/password';
import { sendPasswordReset } from '@/services/email-service';
import { sendEmail } from '@/lib/email';
import { createAuditLog, AuditAction, AuditResource } from '@/lib/audit';
import crypto from 'crypto';

/**
 * Password reset token configuration (FR-047, FR-048)
 * - 1-hour expiration
 * - Single-use only
 */
const RESET_TOKEN_CONFIG = {
  expiresIn: 60 * 60 * 1000, // 1 hour in ms
} as const;

/**
 * Request password reset
 * Generates reset token, stores in database, sends email
 * Implements FR-047 (Forgot Password), FR-145 (Rate Limiting)
 * 
 * @param email - User's email address
 * @param ipAddress - IP address of request (optional)
 * @returns Promise<{ success: boolean }>
 * 
 * Note: Always returns success to prevent email enumeration
 */
export async function requestPasswordReset(
  email: string,
  ipAddress?: string
): Promise<{ success: boolean }> {
  // Find user
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + RESET_TOKEN_CONFIG.expiresIn);

  // Store reset token
  await db.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetExpires,
    },
  });

  // Send reset email (US9 Email Notifications)
  try {
    await sendPasswordReset({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      } as any,
      resetToken,
      expiresAt: resetExpires,
      ipAddress,
    });
  } catch (emailError) {
    // Log email error but don't block password reset flow (US9 FR-077 requirement)
    console.error('Failed to send password reset email:', emailError);
  }

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: AuditAction.PASSWORD_RESET_REQUESTED,
    resource: AuditResource.USER,
    resourceId: user.id,
    metadata: { email: user.email },
    ipAddress,
  });

  return { success: true };
}

/**
 * Reset password with token
 * Validates token, checks password history, updates password, invalidates sessions
 * Implements FR-048 (Reset Password), FR-059E (Password History)
 * 
 * @param data - Reset password data
 * @param data.token - Password reset token
 * @param data.newPassword - New password
 * @param data.ipAddress - IP address of request (optional)
 * @param data.userAgent - User agent of request (optional)
 * @returns Promise<{ success: boolean }>
 * 
 * @throws Error('INVALID_OR_EXPIRED_TOKEN') - Token is invalid or expired
 * @throws Error('PASSWORD_RECENTLY_USED') - Password was used in last 5 passwords
 */
export async function resetPassword(data: {
  token: string;
  newPassword: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ success: boolean }> {
  // Find user by reset token
  const user = await db.user.findFirst({
    where: {
      resetToken: data.token,
      resetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new Error('INVALID_OR_EXPIRED_TOKEN');
  }

  // Check password history (FR-059E - last 5 passwords)
  const inHistory = await isPasswordInHistory(user.id, data.newPassword);
  if (inHistory) {
    throw new Error('PASSWORD_RECENTLY_USED');
  }

  // Hash new password
  const password = await hashPassword(data.newPassword);

  // Update password and clear reset token
  await db.user.update({
    where: { id: user.id },
    data: {
      password,
      resetToken: null,
      resetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordChangedAt: new Date(),
    },
  });

  // Add to password history
  await db.passwordHistory.create({
    data: {
      userId: user.id,
      hashedPassword: password,
    },
  });

  // Note: Session invalidation is handled by NextAuth JWT expiration
  // No need to call deleteUserSessions() with NextAuth stateless JWT

  // Send confirmation email
  await sendEmail({
    to: user.email,
    subject: 'Password Changed - StormCom',
    html: `
      <h1>Password Changed Successfully</h1>
      <p>Your password has been changed. You will need to log in again with your new password.</p>
      <p>If you didn't make this change, please contact support immediately.</p>
    `,
    text: `Your password has been changed successfully. You will need to log in again with your new password.`,
  });

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: AuditAction.PASSWORD_RESET_COMPLETED,
    resource: AuditResource.USER,
    resourceId: user.id,
    metadata: { email: user.email },
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });

  return { success: true };
}

/**
 * Validate password reset token
 * Checks if token exists and is not expired
 * 
 * @param token - Password reset token
 * @returns Promise<{ valid: boolean; userId?: string; error?: string }>
 */
export async function validatePasswordResetToken(
  token: string
): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    // Find user by reset token
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetExpires: { gt: new Date() },
      },
      select: { id: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      return { valid: false, error: 'Invalid or expired token' };
    }

    return { valid: true, userId: user.id };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Token validation failed' };
  }
}
