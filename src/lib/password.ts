// src/lib/password.ts
// Password utilities: hashing, comparison, strength validation, history checking
// Uses bcryptjs with cost factor 12 for security/performance balance

import { hash, compare } from 'bcryptjs';
import { db } from './db';
import { validatePasswordStrength } from './validation';

/**
 * Password configuration
 */
const PASSWORD_CONFIG = {
  saltRounds: 12, // bcrypt cost factor (2^12 iterations)
  historyLimit: 5, // Prevent reuse of last 5 passwords
  minLength: 8,
  maxLength: 128,
} as const;

/**
 * Hash a password using bcrypt
 * Uses cost factor 12 (balanced security/performance)
 */
export async function hashPassword(password: string): Promise<string> {
  if (password.length < PASSWORD_CONFIG.minLength) {
    throw new Error(`Password must be at least ${PASSWORD_CONFIG.minLength} characters`);
  }

  if (password.length > PASSWORD_CONFIG.maxLength) {
    throw new Error(`Password must be less than ${PASSWORD_CONFIG.maxLength} characters`);
  }

  return hash(password, PASSWORD_CONFIG.saltRounds);
}

/**
 * Compare a password with a hash
 * Returns true if password matches hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await compare(password, hash);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

/**
 * Validate password strength
 * Returns detailed feedback on password requirements
 */
export function checkPasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
} {
  const result = validatePasswordStrength(password);
  
  // Calculate numeric score (0-100)
  let score = 0;
  if (result.strength === 'weak') score = 25;
  else if (result.strength === 'medium') score = 50;
  else if (result.strength === 'strong') score = 75;
  else if (result.strength === 'very-strong') score = 100;

  return {
    ...result,
    score,
  };
}

/**
 * Check if password has been used recently
 * Prevents password reuse based on password history
 */
export async function isPasswordInHistory(
  userId: string,
  newPassword: string
): Promise<boolean> {
  try {
    // Get user's password history (last 5 passwords)
    const passwordHistory = await db.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: PASSWORD_CONFIG.historyLimit,
      select: { hashedPassword: true },
    });

    // Check if new password matches any in history
    for (const historyEntry of passwordHistory) {
      const matches = await comparePassword(newPassword, historyEntry.hashedPassword);
      if (matches) {
        return true; // Password found in history
      }
    }

    return false; // Password not in history
  } catch (error) {
    console.error('Password history check error:', error);
    // Fail open: allow password change if history check fails
    return false;
  }
}

/**
 * Add password to history
 * Maintains last 5 passwords in history (GDPR compliance - data minimization)
 * Automatically deletes entries older than the configured limit
 */
export async function addPasswordToHistory(
  userId: string,
  hashedPassword: string
): Promise<void> {
  try {
    // Add new password to history
    await db.passwordHistory.create({
      data: {
        userId,
        hashedPassword,
      },
    });

    // Cleanup: Get all history entries for user
    const allHistory = await db.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    // Delete old entries beyond limit (GDPR data minimization)
    if (allHistory.length > PASSWORD_CONFIG.historyLimit) {
      const entriesToDelete = allHistory.slice(PASSWORD_CONFIG.historyLimit);
      await db.passwordHistory.deleteMany({
        where: {
          id: {
            in: entriesToDelete.map((entry) => entry.id),
          },
        },
      });
    }
  } catch (error) {
    console.error('Add password to history error:', error);
    // Don't throw error - password change should still succeed
  }
}

/**
 * Change user password
 * Validates strength, checks history, updates password and history
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get current user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify current password
    const isCurrentValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Check new password strength
    const strengthCheck = checkPasswordStrength(newPassword);
    if (!strengthCheck.isValid) {
      return {
        success: false,
        error: `Password is too weak: ${strengthCheck.errors.join(', ')}`,
      };
    }

    // Check if new password was used recently
    const inHistory = await isPasswordInHistory(userId, newPassword);
    if (inHistory) {
      return {
        success: false,
        error: `Cannot reuse any of your last ${PASSWORD_CONFIG.historyLimit} passwords`,
      };
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await db.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    // Add old password to history
    await addPasswordToHistory(userId, user.password);

    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change password',
    };
  }
}

/**
 * Generate a random password that meets strength requirements
 * Useful for temporary passwords or password reset
 */
export function generateStrongPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + special;

  // Ensure at least one character from each required set
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle password to avoid predictable pattern
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Validate password reset token
 * Checks if token is valid and not expired
 */
export async function validatePasswordResetToken(
  token: string
): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    // Token should be in format: base64(userId:timestamp:randomBytes)
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [userId, timestamp] = decoded.split(':');

    if (!userId || !timestamp) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Check if token is expired (1 hour validity)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (now - tokenTime > oneHour) {
      return { valid: false, error: 'Token has expired' };
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      return { valid: false, error: 'User not found' };
    }

    return { valid: true, userId: user.id };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Invalid token' };
  }
}

/**
 * Generate password reset token
 * Creates a secure token with embedded user ID and timestamp
 */
export function generatePasswordResetToken(userId: string): string {
  const timestamp = Date.now();
  const randomBytes = require('crypto').randomBytes(32).toString('hex');
  const tokenData = `${userId}:${timestamp}:${randomBytes}`;
  return Buffer.from(tokenData, 'utf8').toString('base64');
}
