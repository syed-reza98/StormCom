#!/usr/bin/env tsx

/**
 * Super Admin Bootstrap Script
 * Creates a super admin user for initial system access
 * 
 * Usage:
 *   tsx scripts/create-super-admin.ts
 *   tsx scripts/create-super-admin.ts --email admin@example.com --password secure123
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface SuperAdminData {
  email: string;
  password: string;
  name: string;
}

/**
 * Prompt user for input
 */
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Parse command line arguments
 */
function parseArgs(): Partial<SuperAdminData> {
  const args = process.argv.slice(2);
  const data: Partial<SuperAdminData> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    if (key === '--email' || key === '-e') {
      data.email = value;
    } else if (key === '--password' || key === '-p') {
      data.password = value;
    } else if (key === '--name' || key === '-n') {
      data.name = value;
    }
  }

  return data;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  return { valid: true };
}

/**
 * Create super admin user
 */
async function createSuperAdmin(data: SuperAdminData): Promise<void> {
  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    console.log('❌ User with this email already exists');
    process.exit(1);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      password: hashedPassword,
      name: data.name,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  });

  console.log('\n✅ Super admin user created successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📧 Email:    ${user.email}`);
  console.log(`👤 Name:     ${user.name}`);
  console.log(`🔑 Role:     ${user.role}`);
  console.log(`🆔 User ID:  ${user.id}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n⚠️  IMPORTANT: Keep this password secure!');
  console.log('   Change it immediately after first login.\n');
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 StormCom - Super Admin Bootstrap\n');

  // Parse command line arguments
  const args = parseArgs();

  // Collect super admin data
  let email = args.email || '';
  let password = args.password || '';
  let name = args.name || '';

  // Interactive prompts if data not provided
  if (!email) {
    email = await prompt('Email address: ');
  }

  if (!isValidEmail(email)) {
    console.log('❌ Invalid email address');
    process.exit(1);
  }

  if (!name) {
    name = await prompt('Full name: ');
  }

  if (!password) {
    password = await prompt('Password (min 8 chars, 1 upper, 1 lower, 1 number): ');
  }

  const passwordValidation = isValidPassword(password);
  if (!passwordValidation.valid) {
    console.log(`❌ ${passwordValidation.message}`);
    process.exit(1);
  }

  console.log('\n📝 Creating super admin user...\n');

  try {
    await createSuperAdmin({ email, password, name });
  } catch (error: any) {
    console.error('❌ Failed to create super admin:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
