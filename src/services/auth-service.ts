// src/services/auth-service.ts
// Authentication Service: User Registration
// Implements FR-035 from spec.md
//
// NOTE: Login, logout, and session management are now handled by NextAuth.js
// Password reset and email verification utilities are in src/lib/password-reset.ts and src/lib/email-verification.ts

import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
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
 * Register new user
 * Implements FR-035 (User Registration)
 * 
 * Note: This endpoint creates a user account but does NOT create a session.
 * After email verification, users must log in using NextAuth signIn() method.
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

  // Validate password strength before hashing (bcrypt cost factor 12 - NextAuth compatible)
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

  // Send verification email (FR-148, US9 Email Notifications)
  try {
    await sendAccountVerification({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      } as any,
      verificationToken,
      expiresAt: verificationExpires,
      store: data.storeId ? undefined : undefined, // TODO: Fetch store data if storeId provided
    });
  } catch (emailError) {
    // Log email error but don't block registration (US9 FR-077 requirement)
    console.error('Failed to send verification email:', emailError);
  }

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
