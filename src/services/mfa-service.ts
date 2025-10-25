// src/services/mfa-service.ts
// Multi-Factor Authentication Service: TOTP, QR Code, Backup Codes
// Implements FR-039 to FR-042 from spec.md

import { db } from '@/lib/db';
import {
  generateTOTPSecret,
  verifyTOTPCode,
  generateQRCode,
  generateBackupCodes,
} from '@/lib/mfa';
import { encryptTOTPSecret, decryptTOTPSecret } from '@/lib/encryption';
import { hashPassword, comparePassword } from '@/lib/password';
import { createAuditLog, AuditAction, AuditResource } from '@/lib/audit';

/**
 * Setup MFA for user (generate TOTP secret and QR code)
 * Implements FR-039 (MFA Setup)
 */
export async function setupMFA(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}> {
  // Get user
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, mfaEnabled: true },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  if (user.mfaEnabled) {
    throw new Error('MFA_ALREADY_ENABLED');
  }

  // Generate TOTP secret
  const secretData = generateTOTPSecret();
  const secret = secretData.base32; // Use base32 for compatibility

  // Generate QR code
  const qrCodeUrl = await generateQRCode(secret, user.email);

  // Generate backup codes
  const backupCodes = generateBackupCodes(10); // 10 backup codes

  // Encrypt secret before storing
  const encryptedSecret = encryptTOTPSecret(secret);

  // Hash backup codes before storing
  const hashedBackupCodes = await Promise.all(
    backupCodes.map((code) => hashPassword(code))
  );

  // Store MFA configuration (not enabled yet until verified)
  await db.user.update({
    where: { id: userId },
    data: {
      totpSecret: encryptedSecret,
      mfaEnabled: false, // Not enabled until first verification
    },
  });

  // Store backup codes in separate table
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90); // 90 days expiry

  await db.mFABackupCode.createMany({
    data: hashedBackupCodes.map((hashedCode) => ({
      userId,
      hashedCode,
      expiresAt,
    })),
  });

  // Audit log
  await createAuditLog({
    userId,
    action: AuditAction.MFA_ENABLED,
    resource: AuditResource.USER,
    resourceId: userId,
    metadata: { email: user.email, status: 'setup_initiated' },
    ipAddress,
    userAgent,
  });

  return { secret, qrCodeUrl, backupCodes };
}

/**
 * Verify MFA setup (first-time TOTP verification)
 * Implements FR-040 (MFA Verification)
 */
export async function verifyMFASetup(
  userId: string,
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean }> {
  // Get user
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, totpSecret: true, mfaEnabled: true },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  if (!user.totpSecret) {
    throw new Error('MFA_NOT_SETUP');
  }

  if (user.mfaEnabled) {
    throw new Error('MFA_ALREADY_ENABLED');
  }

  // Decrypt secret
  const secret = decryptTOTPSecret(user.totpSecret);

  // Verify TOTP token
  const isValid = verifyTOTPCode(secret, token);

  if (!isValid) {
    throw new Error('INVALID_MFA_TOKEN');
  }

  // Enable MFA
  await db.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: true,
    },
  });

  // Audit log
  await createAuditLog({
    userId,
    action: AuditAction.MFA_ENABLED,
    resource: AuditResource.USER,
    resourceId: userId,
    metadata: { email: user.email, status: 'enabled' },
    ipAddress,
    userAgent,
  });

  return { success: true };
}

/**
 * Verify MFA token during login
 * Implements FR-041 (MFA Login)
 */
export async function verifyMFALogin(
  userId: string,
  token: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; usedBackupCode: boolean }> {
  // Get user
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, totpSecret: true, mfaEnabled: true },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  if (!user.mfaEnabled || !user.totpSecret) {
    throw new Error('MFA_NOT_ENABLED');
  }

  // Try TOTP verification first
  const secret = decryptTOTPSecret(user.totpSecret);
  const isValidTOTP = verifyTOTPCode(secret, token);

  if (isValidTOTP) {
    // Audit log
    await createAuditLog({
      userId,
      action: AuditAction.MFA_VERIFIED,
      resource: AuditResource.USER,
      resourceId: userId,
      metadata: { email: user.email, method: 'TOTP' },
      ipAddress,
      userAgent,
    });

    return { success: true, usedBackupCode: false };
  }

  // Try backup code verification
  const backupCodes = await db.mFABackupCode.findMany({
    where: { userId, isUsed: false },
  });

  for (const backupCode of backupCodes) {
    const isValidBackupCode = await comparePassword(token, backupCode.hashedCode);
    
    if (isValidBackupCode) {
      // Mark code as used
      await db.mFABackupCode.update({
        where: { id: backupCode.id },
        data: { isUsed: true, usedAt: new Date() },
      });

      // Count remaining codes
      const remainingCount = await db.mFABackupCode.count({
        where: { userId, isUsed: false },
      });

      // Audit log
      await createAuditLog({
        userId,
        action: AuditAction.BACKUP_CODE_USED,
        resource: AuditResource.USER,
        resourceId: userId,
        metadata: { email: user.email, method: 'BACKUP_CODE', remainingCodes: remainingCount },
        ipAddress,
        userAgent,
      });

      return { success: true, usedBackupCode: true };
    }
  }

  // Invalid token
  throw new Error('INVALID_MFA_TOKEN');
}

/**
 * Disable MFA for user
 * Implements FR-042 (MFA Disable)
 */
export async function disableMFA(userId: string, password: string): Promise<{ success: boolean }> {
  // Get user
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, password: true, mfaEnabled: true },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  if (!user.mfaEnabled) {
    throw new Error('MFA_NOT_ENABLED');
  }

  // Verify password before disabling MFA
  const isValidPassword = await comparePassword(password, user.password);

  if (!isValidPassword) {
    throw new Error('INVALID_PASSWORD');
  }

  // Disable MFA and clear secret
  await db.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: false,
      totpSecret: null,
    },
  });

  // Delete all backup codes
  await db.mFABackupCode.deleteMany({
    where: { userId },
  });

  // Audit log
  await createAuditLog({
    userId,
    action: AuditAction.MFA_DISABLED,
    resource: AuditResource.USER,
    resourceId: userId,
    metadata: { email: user.email },
  });

  return { success: true };
}

/**
 * Regenerate backup codes
 * Implements FR-042 (MFA Management)
 */
export async function regenerateBackupCodes(
  userId: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ backupCodes: string[] }> {
  // Get user
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, password: true, mfaEnabled: true },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  if (!user.mfaEnabled) {
    throw new Error('MFA_NOT_ENABLED');
  }

  // Verify password before regenerating codes
  const isValidPassword = await comparePassword(password, user.password);

  if (!isValidPassword) {
    throw new Error('INVALID_PASSWORD');
  }

  // Delete old backup codes
  await db.mFABackupCode.deleteMany({
    where: { userId },
  });

  // Generate new backup codes
  const backupCodes = generateBackupCodes(10);

  // Hash backup codes before storing
  const hashedBackupCodes = await Promise.all(
    backupCodes.map((code) => hashPassword(code))
  );

  // Store new codes (hashed, with expiry)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90); // 90 days expiry

  await db.mFABackupCode.createMany({
    data: hashedBackupCodes.map((hashedCode) => ({
      userId,
      hashedCode,
      expiresAt,
    })),
  });

  // Audit log
  await createAuditLog({
    userId,
    action: AuditAction.BACKUP_CODES_REGENERATED,
    resource: AuditResource.USER,
    resourceId: userId,
    metadata: { email: user.email, codesCount: backupCodes.length },
    ipAddress,
    userAgent,
  });

  return { backupCodes };
}

/**
 * Get MFA status for user
 */
export async function getMFAStatus(userId: string): Promise<{
  enabled: boolean;
  hasBackupCodes: boolean;
  backupCodesRemaining: number;
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const backupCodesCount = await db.mFABackupCode.count({
    where: { userId, isUsed: false },
  });

  return {
    enabled: user.mfaEnabled,
    hasBackupCodes: backupCodesCount > 0,
    backupCodesRemaining: backupCodesCount,
  };
}
