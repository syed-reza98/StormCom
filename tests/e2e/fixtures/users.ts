import { db } from '../../../src/lib/db';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

/**
 * User fixture utilities for E2E tests
 * Provides functions to create test users with various roles and configurations
 */

// bcrypt cost factor for test passwords (lower than production for speed)
const TEST_BCRYPT_COST = 10;

/**
 * Generate unique email address for test users
 * Uses timestamp to ensure uniqueness across parallel test runs
 * @param prefix - Email prefix (e.g., 'admin', 'customer')
 * @returns Unique email address
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}@stormcom-test.local`;
}

/**
 * Hash password using bcrypt (test cost factor)
 * @param password - Plain text password
 * @returns Bcrypt hash
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, TEST_BCRYPT_COST);
}

/**
 * Interface for test user creation options
 */
export interface CreateTestUserOptions {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  role?: UserRole;
  storeId?: string;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  totpSecret?: string;
  failedLoginAttempts?: number;
  lockedUntil?: Date;
}

/**
 * Create a test user with specified options
 * @param options - User creation options
 * @returns Created user object
 */
export async function createTestUser(options: CreateTestUserOptions = {}) {
  const {
    email = generateUniqueEmail('user'),
    password = 'Test123456!', // Default test password
    name = 'Test User',
    phone = null,
    role = UserRole.CUSTOMER,
    storeId = null,
    emailVerified = true,
    mfaEnabled = false,
    totpSecret = null,
    failedLoginAttempts = 0,
    lockedUntil = null,
  } = options;

  const hashedPassword = await hashPassword(password);

  const user = await db.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone,
      role,
      storeId,
      emailVerified,
      emailVerifiedAt: emailVerified ? new Date() : null,
      mfaEnabled,
      totpSecret,
      failedLoginAttempts,
      lockedUntil,
    },
  });

  // Return user with plain password for test usage
  return {
    ...user,
    plainPassword: password, // Store plain password for login tests
  };
}

/**
 * Create a Super Admin user (cross-store access)
 * @param options - Optional user creation options
 * @returns Created SuperAdmin user
 */
export async function createSuperAdmin(options: Partial<CreateTestUserOptions> = {}) {
  return await createTestUser({
    email: generateUniqueEmail('superadmin'),
    name: 'Super Admin',
    role: UserRole.SUPER_ADMIN,
    storeId: undefined, // SuperAdmin is not associated with any store
    emailVerified: true,
    ...options,
  });
}

/**
 * Create a Store Admin user for a specific store
 * @param storeId - Store ID to associate user with
 * @param options - Optional user creation options
 * @returns Created StoreAdmin user
 */
export async function createStoreAdmin(
  storeId: string,
  options: Partial<CreateTestUserOptions> = {}
) {
  if (!storeId) {
    throw new Error('storeId is required for Store Admin users');
  }

  return await createTestUser({
    email: generateUniqueEmail('storeadmin'),
    name: 'Store Admin',
    role: UserRole.STORE_ADMIN,
    storeId,
    emailVerified: true,
    ...options,
  });
}

/**
 * Create a Staff user for a specific store
 * @param storeId - Store ID to associate user with
 * @param options - Optional user creation options
 * @returns Created Staff user
 */
export async function createStaff(
  storeId: string,
  options: Partial<CreateTestUserOptions> = {}
) {
  if (!storeId) {
    throw new Error('storeId is required for Staff users');
  }

  return await createTestUser({
    email: generateUniqueEmail('staff'),
    name: 'Staff Member',
    role: UserRole.STAFF,
    storeId,
    emailVerified: true,
    ...options,
  });
}

/**
 * Create a Customer user for a specific store
 * @param storeId - Store ID to associate user with
 * @param options - Optional user creation options
 * @returns Created Customer user
 */
export async function createCustomer(
  storeId: string,
  options: Partial<CreateTestUserOptions> = {}
) {
  if (!storeId) {
    throw new Error('storeId is required for Customer users');
  }

  return await createTestUser({
    email: generateUniqueEmail('customer'),
    name: 'Customer',
    role: UserRole.CUSTOMER,
    storeId,
    emailVerified: true,
    ...options,
  });
}

/**
 * Create a user with unverified email (for email verification tests)
 * @param options - Optional user creation options
 * @returns Created unverified user
 */
export async function createUnverifiedUser(options: Partial<CreateTestUserOptions> = {}) {
  const email = options.email || generateUniqueEmail('unverified');
  const verificationToken = `verify_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await createTestUser({
    email,
    emailVerified: false,
    ...options,
  });

  // Update with verification token
  await db.user.update({
    where: { id: user.id },
    data: {
      verificationToken,
      verificationExpires,
    },
  });

  return {
    ...user,
    verificationToken,
    verificationExpires,
  };
}

/**
 * Create a locked user account (failed login attempts)
 * @param options - Optional user creation options
 * @returns Created locked user
 */
export async function createLockedUser(options: Partial<CreateTestUserOptions> = {}) {
  const lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Locked for 30 minutes

  return await createTestUser({
    email: generateUniqueEmail('locked'),
    failedLoginAttempts: 5,
    lockedUntil,
    ...options,
  });
}

/**
 * Create a user with MFA enabled (TOTP)
 * @param options - Optional user creation options
 * @returns Created MFA-enabled user with TOTP secret
 */
export async function createMFAUser(options: Partial<CreateTestUserOptions> = {}) {
  const totpSecret = 'JBSWY3DPEHPK3PXP'; // Base32 encoded test secret

  const user = await createTestUser({
    email: generateUniqueEmail('mfa'),
    mfaEnabled: true,
    totpSecret,
    ...options,
  });

  return {
    ...user,
    totpSecret,
  };
}

/**
 * Create a user with password reset token
 * @param options - Optional user creation options
 * @returns Created user with reset token
 */
export async function createUserWithResetToken(options: Partial<CreateTestUserOptions> = {}) {
  const resetToken = `reset_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const user = await createTestUser({
    email: generateUniqueEmail('reset'),
    ...options,
  });

  // Update with reset token
  await db.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetExpires,
    },
  });

  return {
    ...user,
    resetToken,
    resetExpires,
  };
}

/**
 * Create multiple test users with different roles for a store
 * @param storeId - Store ID to associate users with
 * @returns Object with created users by role
 */
export async function createStoreUsers(storeId: string) {
  const [admin, staff, customer] = await Promise.all([
    createStoreAdmin(storeId, { name: 'Store Admin' }),
    createStaff(storeId, { name: 'Staff Member' }),
    createCustomer(storeId, { name: 'Customer' }),
  ]);

  return {
    admin,
    staff,
    customer,
  };
}

/**
 * Update user's last login information
 * @param userId - User ID
 * @param ipAddress - IP address of login (default: '127.0.0.1')
 */
export async function updateLastLogin(userId: string, ipAddress: string = '127.0.0.1') {
  await db.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
      lastLoginIP: ipAddress,
      failedLoginAttempts: 0, // Reset on successful login
      lockedUntil: null,
    },
  });
}

/**
 * Increment failed login attempts for a user
 * @param userId - User ID
 * @param lockAfter - Number of attempts before locking (default: 5)
 */
export async function incrementFailedLogins(userId: string, lockAfter: number = 5) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { failedLoginAttempts: true },
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const newAttempts = user.failedLoginAttempts + 1;
  const shouldLock = newAttempts >= lockAfter;

  await db.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: newAttempts,
      lockedUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null, // 30 min lockout
    },
  });
}

/**
 * Delete a test user by ID
 * @param userId - User ID to delete
 */
export async function deleteTestUser(userId: string) {
  await db.user.delete({
    where: { id: userId },
  });
}

/**
 * Delete all test users matching email pattern
 * @param emailPattern - Email pattern to match (e.g., '%stormcom-test.local')
 */
export async function deleteTestUsers(emailPattern: string = '%stormcom-test.local') {
  await db.user.deleteMany({
    where: {
      email: {
        endsWith: emailPattern.replace('%', ''),
      },
    },
  });
}

/**
 * Find user by email
 * @param email - User email address
 * @returns User object or null
 */
export async function findUserByEmail(email: string) {
  return await db.user.findUnique({
    where: { email },
  });
}

/**
 * Verify a user's password
 * @param userId - User ID
 * @param password - Plain text password to verify
 * @returns True if password matches
 */
export async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    return false;
  }

  return await bcrypt.compare(password, user.password);
}
