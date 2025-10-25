// src/lib/mfa.ts
// Multi-Factor Authentication utilities: TOTP generation, verification, backup codes
// RFC 6238 compliant TOTP implementation using speakeasy

import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { db } from './db';
import { encryptTOTPSecret, decryptTOTPSecret } from './encryption';

/**
 * MFA configuration
 */
const MFA_CONFIG = {
  issuer: 'StormCom', // Appears in authenticator app
  digits: 6, // TOTP code length
  step: 30, // 30-second time window
  window: 1, // Allow 1 step before/after for clock skew (±30s)
  backupCodeLength: 10, // Backup code character length
  backupCodeCount: 8, // Number of backup codes to generate
} as const;

/**
 * Generate a new TOTP secret
 * Returns base32-encoded secret (32 characters)
 */
export function generateTOTPSecret(): {
  secret: string;
  base32: string;
} {
  const secret = speakeasy.generateSecret({
    name: MFA_CONFIG.issuer,
    length: 32, // 32 bytes = 256 bits
  });

  return {
    secret: secret.ascii,
    base32: secret.base32,
  };
}

/**
 * Generate TOTP code for a secret
 * Useful for testing or email-based 2FA
 */
export function generateTOTPCode(secret: string): string {
  return speakeasy.totp({
    secret,
    encoding: 'base32',
    digits: MFA_CONFIG.digits,
    step: MFA_CONFIG.step,
  });
}

/**
 * Verify TOTP code against a secret
 * Allows ±30 second window for clock skew
 */
export function verifyTOTPCode(secret: string, token: string): boolean {
  try {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      digits: MFA_CONFIG.digits,
      step: MFA_CONFIG.step,
      window: MFA_CONFIG.window,
    });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

/**
 * Generate QR code data URL for authenticator app enrollment
 * Returns data URL that can be used directly in <img src="...">
 */
export async function generateQRCode(
  secret: string,
  userEmail: string
): Promise<string> {
  const otpauthUrl = speakeasy.otpauthURL({
    secret,
    label: userEmail,
    issuer: MFA_CONFIG.issuer,
    encoding: 'base32',
  });

  try {
    return await QRCode.toDataURL(otpauthUrl);
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate backup codes
 * Creates cryptographically secure random codes
 */
export function generateBackupCodes(count: number = MFA_CONFIG.backupCodeCount): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate random bytes and convert to alphanumeric code
    const bytes = randomBytes(MFA_CONFIG.backupCodeLength);
    const code = bytes
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
      .substring(0, MFA_CONFIG.backupCodeLength)
      .toUpperCase();
    codes.push(code);
  }

  return codes;
}

/**
 * Hash backup code for storage
 * Uses SHA-256 for one-way hashing
 */
function hashBackupCode(code: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verify backup code
 * Checks if code matches any unused backup code for user
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  try {
    const hashedCode = hashBackupCode(code);

    // Find matching backup code
    const backupCode = await db.mFABackupCode.findFirst({
      where: {
        userId,
        hashedCode,
        isUsed: false, // Only unused codes
      },
    });

    if (!backupCode) {
      return false; // Code not found or already used
    }

    // Mark code as used
    await db.mFABackupCode.update({
      where: { id: backupCode.id },
      data: { isUsed: true, usedAt: new Date() },
    });

    return true;
  } catch (error) {
    console.error('Backup code verification error:', error);
    return false;
  }
}

/**
 * Enroll user in MFA
 * Generates secret, backup codes, and stores encrypted in database
 */
export async function enrollMFA(userId: string, userEmail: string): Promise<{
  success: boolean;
  secret?: string;
  qrCode?: string;
  backupCodes?: string[];
  error?: string;
}> {
  try {
    // Check if user already has MFA enabled
    const existingMFA = await db.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true },
    });

    if (existingMFA?.mfaEnabled) {
      return { success: false, error: 'MFA is already enabled' };
    }

    // Generate TOTP secret
    const { base32: secret } = generateTOTPSecret();

    // Generate QR code
    const qrCode = await generateQRCode(secret, userEmail);

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Encrypt TOTP secret before storage
    const encryptedSecret = encryptTOTPSecret(secret);

    // Update user with encrypted secret
    await db.user.update({
      where: { id: userId },
      data: {
        totpSecret: encryptedSecret,
        mfaEnabled: false, // Not enabled until verified
      },
    });

    // Store backup codes (hashed)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 days expiry

    await db.mFABackupCode.createMany({
      data: backupCodes.map((code) => ({
        userId,
        hashedCode: hashBackupCode(code),
        expiresAt,
      })),
    });

    return {
      success: true,
      secret,
      qrCode,
      backupCodes,
    };
  } catch (error) {
    console.error('MFA enrollment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enroll MFA',
    };
  }
}

/**
 * Verify MFA enrollment
 * User must provide valid TOTP code to enable MFA
 */
export async function verifyMFAEnrollment(
  userId: string,
  token: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get user's encrypted TOTP secret
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true, mfaEnabled: true },
    });

    if (!user?.totpSecret) {
      return { success: false, error: 'MFA enrollment not started' };
    }

    if (user.mfaEnabled) {
      return { success: false, error: 'MFA is already enabled' };
    }

    // Decrypt TOTP secret
    const secret = decryptTOTPSecret(user.totpSecret);

    // Verify TOTP code
    const isValid = verifyTOTPCode(secret, token);

    if (!isValid) {
      return { success: false, error: 'Invalid verification code' };
    }

    // Enable MFA
    await db.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('MFA verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Disable MFA for user
 * Removes TOTP secret and unused backup codes
 */
export async function disableMFA(
  userId: string,
  password: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get user password for verification
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true, mfaEnabled: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.mfaEnabled) {
      return { success: false, error: 'MFA is not enabled' };
    }

    // Verify password (require password to disable MFA)
    const { comparePassword } = await import('./password');
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return { success: false, error: 'Invalid password' };
    }

    // Disable MFA and remove secret
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

    return { success: true };
  } catch (error) {
    console.error('MFA disable error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disable MFA',
    };
  }
}

/**
 * Regenerate backup codes
 * Deletes old codes and generates new ones
 */
export async function regenerateBackupCodes(
  userId: string
): Promise<{
  success: boolean;
  backupCodes?: string[];
  error?: string;
}> {
  try {
    // Verify user has MFA enabled
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true },
    });

    if (!user?.mfaEnabled) {
      return { success: false, error: 'MFA is not enabled' };
    }

    // Delete old backup codes
    await db.mFABackupCode.deleteMany({
      where: { userId },
    });

    // Generate new backup codes
    const backupCodes = generateBackupCodes();

    // Store new codes (hashed, with expiry)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 days expiry

    await db.mFABackupCode.createMany({
      data: backupCodes.map((code) => ({
        userId,
        hashedCode: hashBackupCode(code),
        expiresAt,
      })),
    });

    return {
      success: true,
      backupCodes,
    };
  } catch (error) {
    console.error('Backup code regeneration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to regenerate codes',
    };
  }
}

/**
 * Get backup code status
 * Returns count of used/unused codes
 */
export async function getBackupCodeStatus(userId: string): Promise<{
  total: number;
  used: number;
  remaining: number;
}> {
  try {
    const [total, used] = await Promise.all([
      db.mFABackupCode.count({ where: { userId } }),
      db.mFABackupCode.count({ where: { userId, isUsed: true } }),
    ]);

    return {
      total,
      used,
      remaining: total - used,
    };
  } catch (error) {
    console.error('Backup code status error:', error);
    return { total: 0, used: 0, remaining: 0 };
  }
}
