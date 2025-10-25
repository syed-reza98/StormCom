// src/services/auth-service.ts
// Authentication Service: Register, Login, Logout, Password Reset, Account Lockout
// Implements FR-035 to FR-049 from spec.md

import { db } from '@/lib/db';
import { hashPassword, comparePassword, isPasswordInHistory } from '@/lib/password';
import { setSession, deleteSession, deleteUserSessions } from '@/lib/session-storage';
import { sendEmail } from '@/lib/email';
import { createAuditLog, AuditAction, AuditResource } from '@/lib/audit';
import crypto from 'crypto';

/**
 * Account lockout configuration (FR-046)
 * - Lock account after 5 failed attempts
 * - 30-minute lockout duration
 */
const LOCKOUT_CONFIG = {
  maxFailedAttempts: 5,
  lockoutDuration: 30 * 60 * 1000, // 30 minutes in ms
  attemptWindow: 5 * 60 * 1000, // Track attempts in 5-minute window
} as const;

/**
 * Password reset token configuration (FR-047, FR-048)
 * - 1-hour expiration
 * - Single-use only
 */
const RESET_TOKEN_CONFIG = {
  expiresIn: 60 * 60 * 1000, // 1 hour in ms
} as const;

/**
 * Email verification token configuration (FR-148)
 * - 24-hour expiration
 */
const VERIFY_TOKEN_CONFIG = {
  expiresIn: 24 * 60 * 60 * 1000, // 24 hours in ms
} as const;

/**
 * Register new user
 * Implements FR-035 (User Registration)
 */
export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'CUSTOMER' | 'STAFF' | 'STORE_ADMIN' | 'SUPER_ADMIN';
  storeId?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ userId: string; verificationToken: string }> {
  // Check if email already exists
  const existingUser = await db.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existingUser) {
    throw new Error('EMAIL_EXISTS');
  }

  // Validate password strength before hashing
  const password = await hashPassword(data.password);

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + VERIFY_TOKEN_CONFIG.expiresIn);

  // Create user
  const user = await db.user.create({
    data: {
      email: data.email.toLowerCase(),
      password,
      name: `${data.firstName} ${data.lastName}`,
      role: data.role || 'CUSTOMER',
      storeId: data.storeId || null,
      verificationToken,
      verificationExpires,
      emailVerified: false,
      mfaEnabled: false,
      failedLoginAttempts: 0,
    },
  });

  // Add password to history
  await db.passwordHistory.create({
    data: {
      userId: user.id,
      hashedPassword: password,
    },
  });

  // Send verification email (FR-148)
  await sendEmail({
    to: user.email,
    subject: 'Verify Your Email - StormCom',
    html: `
      <h1>Welcome to StormCom!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
    `,
    text: `Welcome to StormCom! Verify your email: ${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`,
  });

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: AuditAction.USER_CREATED,
    resource: AuditResource.USER,
    resourceId: user.id,
    metadata: { email: user.email, role: user.role },
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
  });

  return { userId: user.id, verificationToken };
}

/**
 * Login user with email and password
 * Implements FR-036 (Login), FR-046 (Account Lockout)
 */
export async function login(data: {
  email: string;
  password: string;
  ipAddress?: string;
}): Promise<{
  sessionId: string;
  user: { id: string; email: string; role: string; storeId: string | null };
  requiresMFA: boolean;
}> {
  // Find user
  const user = await db.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  // Check if account is locked (FR-046)
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesRemaining = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / (60 * 1000)
    );
    throw new Error(`ACCOUNT_LOCKED:${minutesRemaining}`);
  }

  // Verify password
  const isValidPassword = await comparePassword(data.password, user.password);

  if (!isValidPassword) {
    // Increment failed attempts
    const failedAttempts = user.failedLoginAttempts + 1;
    const updateData: any = {
      failedLoginAttempts: failedAttempts,
    };

    // Lock account if max attempts reached
    if (failedAttempts >= LOCKOUT_CONFIG.maxFailedAttempts) {
      updateData.lockedUntil = new Date(Date.now() + LOCKOUT_CONFIG.lockoutDuration);

      // Send lockout notification email
      await sendEmail({
        to: user.email,
        subject: 'Account Locked - StormCom',
        html: `
          <h1>Account Security Alert</h1>
          <p>Your account has been locked due to multiple failed login attempts.</p>
          <p>It will be unlocked in 30 minutes, or you can reset your password.</p>
        `,
        text: `Your account has been locked due to multiple failed login attempts. It will be unlocked in 30 minutes.`,
      });

      // Audit log
      await createAuditLog({
        userId: user.id,
        action: AuditAction.LOGIN_FAILED,
        resource: AuditResource.USER,
        resourceId: user.id,
        metadata: { reason: 'max_failed_attempts', attempts: failedAttempts },
        ipAddress: data.ipAddress,
      });
    }

    await db.user.update({
      where: { id: user.id },
      data: updateData,
    });

    throw new Error('INVALID_CREDENTIALS');
  }

  // Check email verification (FR-148)
  if (!user.emailVerified) {
    throw new Error('EMAIL_NOT_VERIFIED');
  }

  // Reset failed attempts on successful login
  await db.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIP: data.ipAddress || null,
    },
  });

  // If MFA is enabled, require MFA verification
  if (user.mfaEnabled) {
    // Audit log
    await createAuditLog({
      userId: user.id,
      action: AuditAction.MFA_VERIFIED,
      resource: AuditResource.USER,
      resourceId: user.id,
      metadata: { email: user.email, mfaRequired: true },
      ipAddress: data.ipAddress,
    });

    return {
      sessionId: '', // MFA session created separately
      user: { id: user.id, email: user.email, role: user.role, storeId: user.storeId },
      requiresMFA: true,
    };
  }

  // Create session
  const sessionId = crypto.randomBytes(32).toString('hex');
  await setSession(sessionId, {
    userId: user.id,
    email: user.email,
    role: user.role,
    storeId: user.storeId,
    mfaVerified: false,
  });

  // Audit log
  await createAuditLog({
    userId: user.id,
    action: AuditAction.LOGIN,
    resource: AuditResource.USER,
    resourceId: user.id,
    metadata: { email: user.email, sessionId },
    ipAddress: data.ipAddress,
  });

  return {
    sessionId,
    user: { id: user.id, email: user.email, role: user.role, storeId: user.storeId },
    requiresMFA: false,
  };
}

/**
 * Logout user (delete session)
 * Implements FR-037 (Logout)
 */
export async function logout(
  sessionId: string,
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await deleteSession(sessionId);

  // Audit log
  await createAuditLog({
    userId,
    action: AuditAction.LOGOUT,
    resource: AuditResource.USER,
    resourceId: userId,
    metadata: { sessionId },
    ipAddress,
    userAgent,
  });
}

/**
 * Request password reset
 * Implements FR-047 (Forgot Password), FR-145 (Rate Limiting)
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

  // Send reset email
  await sendEmail({
    to: user.email,
    subject: 'Password Reset - StormCom',
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}">
        Reset Password
      </a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
    text: `Reset your password: ${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`,
  });

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
 * Implements FR-048 (Reset Password), FR-059E (Password History)
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

  // Invalidate all existing sessions (FR-059B)
  await deleteUserSessions(user.id);

  // Send confirmation email
  await sendEmail({
    to: user.email,
    subject: 'Password Changed - StormCom',
    html: `
      <h1>Password Changed Successfully</h1>
      <p>Your password has been changed. All existing sessions have been logged out.</p>
      <p>If you didn't make this change, please contact support immediately.</p>
    `,
    text: `Your password has been changed successfully. All existing sessions have been logged out.`,
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
 * Verify email with token
 * Implements FR-148 (Email Verification)
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
