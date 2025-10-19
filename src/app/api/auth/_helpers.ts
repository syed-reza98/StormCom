/**
 * Authentication helpers for API routes
 * Provides login, logout, and session validation utilities
 */

import { compare, hash } from 'bcrypt';
import prisma from '@/lib/prisma';
import { User } from '@prisma/client';

/**
 * Validate user credentials
 * @param email User email
 * @param password Plain text password
 * @returns User object if valid, null otherwise
 */
export async function validateCredentials(
  email: string,
  password: string
): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.password) {
      return null;
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new Error(`Account is ${user.status.toLowerCase()}`);
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new Error(`Account is locked. Try again in ${remainingTime} minutes.`);
    }

    // Verify password
    const isValid = await compare(password, user.password);

    if (!isValid) {
      // Increment failed login attempts
      const failedLogins = user.failedLogins + 1;
      const updates: any = { failedLogins };

      // Lock account after 5 failed attempts
      if (failedLogins >= 5) {
        updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });

      return null;
    }

    // Reset failed login attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    return user;
  } catch (error) {
    console.error('Error validating credentials:', error);
    throw error;
  }
}

/**
 * Hash password using bcrypt
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

/**
 * Verify password against hash
 * @param password Plain text password
 * @param hash Hashed password
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

/**
 * Check if password was used recently
 * @param userId User ID
 * @param password Plain text password
 * @param historyCount Number of previous passwords to check
 * @returns True if password was used recently
 */
export async function isPasswordRecentlyUsed(
  userId: string,
  password: string,
  historyCount: number = 5
): Promise<boolean> {
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: historyCount,
  });

  for (const entry of history) {
    const matches = await compare(password, entry.hash);
    if (matches) {
      return true;
    }
  }

  return false;
}

/**
 * Add password to history
 * @param userId User ID
 * @param passwordHash Hashed password
 */
export async function addPasswordToHistory(userId: string, passwordHash: string): Promise<void> {
  await prisma.passwordHistory.create({
    data: {
      userId,
      hash: passwordHash,
    },
  });

  // Keep only last 10 passwords
  const allHistory = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  if (allHistory.length > 10) {
    const toDelete = allHistory.slice(10);
    await prisma.passwordHistory.deleteMany({
      where: {
        id: { in: toDelete.map((h) => h.id) },
      },
    });
  }
}

/**
 * Create a new user session
 * @param userId User ID
 * @param expiresInDays Session expiration in days (default 30)
 * @returns Session token
 */
export async function createSession(userId: string, expiresInDays: number = 30): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

/**
 * Validate session token
 * @param token Session token
 * @returns User if session is valid, null otherwise
 */
export async function validateSession(token: string): Promise<User | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    // Clean up expired session
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  return session.user;
}

/**
 * Delete user session
 * @param token Session token
 */
export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { token },
  });
}

/**
 * Delete all sessions for a user
 * @param userId User ID
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  return result.count;
}

/**
 * Generate a random token
 */
function generateToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}
