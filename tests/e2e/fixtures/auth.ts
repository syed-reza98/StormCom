import { db } from '../../../src/lib/db';
import { MFAMethod } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * Auth fixture utilities for E2E tests
 * Provides functions to create sessions, MFA enrollments, and auth-related test data
 */

// bcrypt cost factor for test passwords (lower than production for speed)
const TEST_BCRYPT_COST = 10;

/**
 * Generate a unique session token
 * @returns Random session token string
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a TOTP secret (Base32 encoded)
 * @returns Base32 encoded TOTP secret
 */
export function generateTOTPSecret(): string {
  // Generate 20 random bytes and encode to Base32
  const buffer = crypto.randomBytes(20);
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      result += base32Chars[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += base32Chars[(value << (5 - bits)) & 31];
  }

  return result;
}

/**
 * Generate MFA backup codes
 * @param count - Number of backup codes to generate (default: 10)
 * @returns Array of backup code strings
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Interface for session creation options
 */
export interface CreateSessionOptions {
  userId: string;
  storeId?: string;
  token?: string;
  expiresAt?: Date;
  lastActivityAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create a session for a user
 * @param options - Session creation options
 * @returns Created session object with token
 */
export async function createSession(options: CreateSessionOptions) {
  const {
    userId,
    storeId = null,
    token = generateSessionToken(),
    expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
    lastActivityAt = new Date(),
    ipAddress = '127.0.0.1',
    userAgent = 'Mozilla/5.0 (Test Browser)',
  } = options;

  const session = await db.session.create({
    data: {
      userId,
      storeId,
      token,
      expiresAt,
      lastActivityAt,
      ipAddress,
      userAgent,
    },
  });

  return {
    ...session,
    token, // Return plain token for test usage
  };
}

/**
 * Create an expired session (for testing expiration logic)
 * @param userId - User ID
 * @param storeId - Optional store ID
 * @returns Created expired session
 */
export async function createExpiredSession(userId: string, storeId?: string) {
  return await createSession({
    userId,
    storeId,
    expiresAt: new Date(Date.now() - 60 * 60 * 1000), // Expired 1 hour ago
  });
}

/**
 * Create an idle session (for testing idle timeout)
 * @param userId - User ID
 * @param storeId - Optional store ID
 * @returns Created idle session
 */
export async function createIdleSession(userId: string, storeId?: string) {
  return await createSession({
    userId,
    storeId,
    lastActivityAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago (>7 day idle timeout)
  });
}

/**
 * Update session last activity timestamp
 * @param sessionId - Session ID
 */
export async function updateSessionActivity(sessionId: string) {
  await db.session.update({
    where: { id: sessionId },
    data: { lastActivityAt: new Date() },
  });
}

/**
 * Delete a session (logout)
 * @param sessionId - Session ID to delete
 */
export async function deleteSession(sessionId: string) {
  await db.session.delete({
    where: { id: sessionId },
  });
}

/**
 * Delete all sessions for a user (logout all devices)
 * @param userId - User ID
 */
export async function deleteUserSessions(userId: string) {
  await db.session.deleteMany({
    where: { userId },
  });
}

/**
 * Find session by token
 * @param token - Session token
 * @returns Session object or null
 */
export async function findSessionByToken(token: string) {
  return await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
}

/**
 * Check if session is valid (not expired, not idle)
 * @param sessionId - Session ID
 * @returns True if session is valid
 */
export async function isSessionValid(sessionId: string): Promise<boolean> {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { expiresAt: true, lastActivityAt: true },
  });

  if (!session) {
    return false;
  }

  const now = new Date();
  const idleTimeout = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  // Check expiration
  if (session.expiresAt < now) {
    return false;
  }

  // Check idle timeout
  const lastActivity = session.lastActivityAt.getTime();
  if (now.getTime() - lastActivity > idleTimeout) {
    return false;
  }

  return true;
}

/**
 * Interface for MFA enrollment options
 */
export interface EnrollMFAOptions {
  userId: string;
  method?: MFAMethod;
  totpSecret?: string;
  generateBackupCodes?: boolean;
}

/**
 * Enroll a user in MFA (TOTP)
 * @param options - MFA enrollment options
 * @returns Object with TOTP secret and backup codes
 */
export async function enrollMFA(options: EnrollMFAOptions) {
  const {
    userId,
    method = MFAMethod.TOTP,
    totpSecret = generateTOTPSecret(),
    generateBackupCodes: shouldGenerateBackupCodes = true,
  } = options;

  // Update user with MFA settings
  await db.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: true,
      mfaMethod: method,
      totpSecret,
    },
  });

  // Generate backup codes if requested
  let backupCodes: string[] = [];
  if (shouldGenerateBackupCodes) {
    backupCodes = await createBackupCodes(userId);
  }

  return {
    totpSecret,
    backupCodes,
  };
}

/**
 * Disable MFA for a user
 * @param userId - User ID
 */
export async function disableMFA(userId: string) {
  await db.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: false,
      mfaMethod: null,
      totpSecret: null,
    },
  });

  // Delete all backup codes
  await db.mFABackupCode.deleteMany({
    where: { userId },
  });
}

/**
 * Create MFA backup codes for a user
 * @param userId - User ID
 * @param count - Number of backup codes (default: 10)
 * @returns Array of plain backup codes
 */
export async function createBackupCodes(userId: string, count: number = 10): Promise<string[]> {
  const codes = generateBackupCodes(count);
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

  // Hash and store codes
  await Promise.all(
    codes.map(async (code) => {
      const hashedCode = await bcrypt.hash(code, TEST_BCRYPT_COST);
      return db.mFABackupCode.create({
        data: {
          userId,
          hashedCode,
          isUsed: false,
          expiresAt,
        },
      });
    })
  );

  return codes;
}

/**
 * Mark a backup code as used
 * @param codeId - Backup code ID
 */
export async function useBackupCode(codeId: string) {
  await db.mFABackupCode.update({
    where: { id: codeId },
    data: {
      isUsed: true,
      usedAt: new Date(),
    },
  });
}

/**
 * Get unused backup codes for a user
 * @param userId - User ID
 * @returns Array of unused backup code records
 */
export async function getUnusedBackupCodes(userId: string) {
  return await db.mFABackupCode.findMany({
    where: {
      userId,
      isUsed: false,
      expiresAt: { gt: new Date() }, // Not expired
    },
  });
}

/**
 * Verify a backup code for a user
 * @param userId - User ID
 * @param code - Plain text backup code
 * @returns Backup code record if valid, null otherwise
 */
export async function verifyBackupCode(userId: string, code: string) {
  const backupCodes = await db.mFABackupCode.findMany({
    where: {
      userId,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
  });

  for (const backupCode of backupCodes) {
    const isValid = await bcrypt.compare(code, backupCode.hashedCode);
    if (isValid) {
      return backupCode;
    }
  }

  return null;
}

/**
 * Create password history entry
 * @param userId - User ID
 * @param hashedPassword - Hashed password
 */
export async function createPasswordHistory(userId: string, hashedPassword: string) {
  await db.passwordHistory.create({
    data: {
      userId,
      hashedPassword,
    },
  });
}

/**
 * Get password history for a user
 * @param userId - User ID
 * @param limit - Number of recent passwords to retrieve (default: 5)
 * @returns Array of password history records
 */
export async function getPasswordHistory(userId: string, limit: number = 5) {
  return await db.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Check if password exists in user's history
 * @param userId - User ID
 * @param password - Plain text password to check
 * @param historyCount - Number of recent passwords to check (default: 5)
 * @returns True if password was used before
 */
export async function isPasswordInHistory(
  userId: string,
  password: string,
  historyCount: number = 5
): Promise<boolean> {
  const history = await getPasswordHistory(userId, historyCount);

  for (const entry of history) {
    const matches = await bcrypt.compare(password, entry.hashedPassword);
    if (matches) {
      return true;
    }
  }

  return false;
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions() {
  await db.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
}

/**
 * Clean up expired backup codes
 */
export async function cleanupExpiredBackupCodes() {
  await db.mFABackupCode.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
}

/**
 * Clean up all auth data for a user (sessions, MFA, password history)
 * @param userId - User ID
 */
export async function cleanupUserAuthData(userId: string) {
  await Promise.all([
    db.session.deleteMany({ where: { userId } }),
    db.mFABackupCode.deleteMany({ where: { userId } }),
    db.passwordHistory.deleteMany({ where: { userId } }),
  ]);
}
