// src/lib/encryption.ts
// AES-256-GCM encryption for sensitive data (TOTP secrets, API keys, payment tokens)
// Uses environment-based encryption key with secure key derivation

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

/**
 * Encryption configuration
 */
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm' as const,
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  saltLength: 32, // 256 bits
  authTagLength: 16, // 128 bits
  scryptOptions: {
    N: 16384, // CPU/memory cost (2^14)
    r: 8, // Block size
    p: 1, // Parallelization
  },
} as const;

/**
 * Get encryption key from environment
 * In production: MUST set ENCRYPTION_KEY environment variable
 * In development: Falls back to NEXTAUTH_SECRET with warning
 */
function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error(
      'ENCRYPTION_KEY or NEXTAUTH_SECRET environment variable is required for encryption'
    );
  }

  if (process.env.NODE_ENV === 'production' && !process.env.ENCRYPTION_KEY) {
    console.warn(
      'WARNING: Using NEXTAUTH_SECRET for encryption. Set ENCRYPTION_KEY for better security.'
    );
  }

  return secret;
}

/**
 * Derive encryption key from secret using scrypt
 * Uses salt to generate unique key per encryption
 */
function deriveKey(secret: string, salt: Buffer): Buffer {
  return scryptSync(
    secret,
    salt,
    ENCRYPTION_CONFIG.keyLength,
    ENCRYPTION_CONFIG.scryptOptions
  );
}

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  iv: string; // Initialization vector (Base64)
  salt: string; // Salt for key derivation (Base64)
  authTag: string; // Authentication tag (Base64)
  encrypted: string; // Encrypted data (Base64)
}

/**
 * Encrypt data using AES-256-GCM
 * Returns Base64-encoded encrypted data with IV, salt, and auth tag
 */
export function encrypt(plaintext: string): string {
  try {
    const secret = getEncryptionSecret();

    // Generate random IV and salt
    const iv = randomBytes(ENCRYPTION_CONFIG.ivLength);
    const salt = randomBytes(ENCRYPTION_CONFIG.saltLength);

    // Derive encryption key from secret
    const key = deriveKey(secret, salt);

    // Create cipher
    const cipher = createCipheriv(ENCRYPTION_CONFIG.algorithm, key, iv);

    // Encrypt data
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Package encrypted data
    const encryptedData: EncryptedData = {
      iv: iv.toString('base64'),
      salt: salt.toString('base64'),
      authTag: authTag.toString('base64'),
      encrypted: encrypted.toString('base64'),
    };

    // Return as JSON string
    return JSON.stringify(encryptedData);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(
      `Failed to encrypt data: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Decrypt data using AES-256-GCM
 * Accepts Base64-encoded encrypted data with IV, salt, and auth tag
 */
export function decrypt(encryptedString: string): string {
  try {
    const secret = getEncryptionSecret();

    // Parse encrypted data
    const encryptedData: EncryptedData = JSON.parse(encryptedString);

    // Convert from Base64
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const salt = Buffer.from(encryptedData.salt, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    const encrypted = Buffer.from(encryptedData.encrypted, 'base64');

    // Derive decryption key (same as encryption)
    const key = deriveKey(secret, salt);

    // Create decipher
    const decipher = createDecipheriv(ENCRYPTION_CONFIG.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt data
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(
      `Failed to decrypt data: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Encrypt TOTP secret for MFA
 * Specialized function for encrypting TOTP secrets
 */
export function encryptTOTPSecret(secret: string): string {
  return encrypt(secret);
}

/**
 * Decrypt TOTP secret for MFA
 * Specialized function for decrypting TOTP secrets
 */
export function decryptTOTPSecret(encryptedSecret: string): string {
  return decrypt(encryptedSecret);
}

/**
 * Encrypt API key
 */
export function encryptAPIKey(apiKey: string): string {
  return encrypt(apiKey);
}

/**
 * Decrypt API key
 */
export function decryptAPIKey(encryptedKey: string): string {
  return decrypt(encryptedKey);
}

/**
 * Encrypt payment token
 */
export function encryptPaymentToken(token: string): string {
  return encrypt(token);
}

/**
 * Decrypt payment token
 */
export function decryptPaymentToken(encryptedToken: string): string {
  return decrypt(encryptedToken);
}

/**
 * Generate a random encryption-safe string
 * Useful for generating tokens, secrets, etc.
 */
export function generateRandomSecret(length: number = 32): string {
  return randomBytes(length).toString('base64');
}

/**
 * Hash a string using SHA-256
 * Useful for non-reversible hashing (e.g., API key hints)
 */
export function hashString(input: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Validate encrypted data format
 * Checks if a string is valid encrypted data
 */
export function isValidEncryptedData(encryptedString: string): boolean {
  try {
    const data = JSON.parse(encryptedString);
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.iv === 'string' &&
      typeof data.salt === 'string' &&
      typeof data.authTag === 'string' &&
      typeof data.encrypted === 'string'
    );
  } catch {
    return false;
  }
}
