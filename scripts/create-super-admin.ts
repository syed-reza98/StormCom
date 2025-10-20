/**
 * Super Admin Bootstrap Script
 * 
 * Creates the first super admin user with full system permissions.
 * This script should only be run once during initial system setup.
 * 
 * Usage:
 *   npm run create-super-admin
 *   or
 *   tsx scripts/create-super-admin.ts
 * 
 * @module scripts/create-super-admin
 */

import * as readline from 'readline';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

/**
 * Validate email format
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a super admin already exists
 */
async function checkExistingSuperAdmin(): Promise<boolean> {
  const superAdminRole = await prisma.role.findFirst({
    where: {
      slug: 'super-admin',
    },
  });
  
  if (!superAdminRole) {
    return false;
  }
  
  const existingAdmin = await prisma.userStore.findFirst({
    where: {
      roleId: superAdminRole.id,
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });
  
  return !!existingAdmin;
}

/**
 * Create or get the Super Admin role
 */
async function ensureSuperAdminRole() {
  const existingRole = await prisma.role.findFirst({
    where: {
      slug: 'super-admin',
    },
  });
  
  if (existingRole) {
    log('✓ Super Admin role already exists', 'green');
    return existingRole;
  }
  
  log('Creating Super Admin role...', 'cyan');
  
  // Define all permissions for super admin
  const allPermissions = {
    // Subscription management
    'subscriptions.view': true,
    'subscriptions.create': true,
    'subscriptions.update': true,
    'subscriptions.delete': true,
    
    // Store management
    'stores.view': true,
    'stores.create': true,
    'stores.update': true,
    'stores.delete': true,
    
    // User management
    'users.view': true,
    'users.create': true,
    'users.update': true,
    'users.delete': true,
    
    // Product management
    'products.view': true,
    'products.create': true,
    'products.update': true,
    'products.delete': true,
    
    // Order management
    'orders.view': true,
    'orders.create': true,
    'orders.update': true,
    'orders.delete': true,
    
    // Customer management
    'customers.view': true,
    'customers.create': true,
    'customers.update': true,
    'customers.delete': true,
    
    // Marketing management
    'marketing.view': true,
    'marketing.create': true,
    'marketing.update': true,
    'marketing.delete': true,
    
    // Analytics access
    'analytics.view': true,
    
    // Settings management
    'settings.view': true,
    'settings.update': true,
    
    // System administration
    'system.manage': true,
  };
  
  const role = await prisma.role.create({
    data: {
      name: 'Super Admin',
      slug: 'super-admin',
      description: 'Full system access with all permissions',
      permissions: allPermissions,
      isSystem: true,
    },
  });
  
  log('✓ Super Admin role created', 'green');
  return role;
}

/**
 * Create a default system store for super admin
 */
async function ensureSystemStore() {
  const existingStore = await prisma.store.findFirst({
    where: {
      slug: 'system-admin',
    },
  });
  
  if (existingStore) {
    log('✓ System admin store already exists', 'green');
    return existingStore;
  }
  
  log('Creating system admin store...', 'cyan');
  
  const store = await prisma.store.create({
    data: {
      name: 'System Administration',
      slug: 'system-admin',
      email: 'admin@system.local',
      status: 'ACTIVE',
      currency: 'USD',
      timezone: 'UTC',
      language: 'en',
      settings: {}, // Empty settings JSON
    },
  });
  
  log('✓ System admin store created', 'green');
  return store;
}

/**
 * Main script execution
 */
async function main() {
  log('\n╔═══════════════════════════════════════╗', 'bright');
  log('║  Super Admin Bootstrap Script        ║', 'bright');
  log('╚═══════════════════════════════════════╝\n', 'bright');
  
  try {
    // Check if super admin already exists
    const hasExistingSuperAdmin = await checkExistingSuperAdmin();
    
    if (hasExistingSuperAdmin) {
      log('⚠ A super admin already exists in the system.', 'yellow');
      
      const rl = createInterface();
      const proceed = await question(
        rl,
        'Do you want to create another super admin? (yes/no): '
      );
      rl.close();
      
      if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
        log('\nOperation cancelled.', 'yellow');
        process.exit(0);
      }
    }
    
    // Collect user information
    const rl = createInterface();
    
    log('\nPlease provide the following information:\n', 'cyan');
    
    // Email
    let email = '';
    let emailValid = false;
    while (!emailValid) {
      email = await question(rl, 'Email address: ');
      
      if (!validateEmail(email)) {
        log('✗ Invalid email format. Please try again.', 'red');
        continue;
      }
      
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      
      if (existingUser) {
        log('✗ A user with this email already exists. Please use a different email.', 'red');
        continue;
      }
      
      emailValid = true;
    }
    
    // Name
    const name = await question(rl, 'Full name: ');
    
    if (!name.trim()) {
      log('✗ Name cannot be empty.', 'red');
      rl.close();
      process.exit(1);
    }
    
    // Password
    let password = '';
    let passwordValid = false;
    while (!passwordValid) {
      password = await question(rl, 'Password (min 8 chars, mixed case, number, special char): ');
      
      const validation = validatePassword(password);
      
      if (!validation.valid) {
        log('✗ Password does not meet requirements:', 'red');
        validation.errors.forEach((error) => {
          log(`  - ${error}`, 'red');
        });
        continue;
      }
      
      const confirmPassword = await question(rl, 'Confirm password: ');
      
      if (password !== confirmPassword) {
        log('✗ Passwords do not match. Please try again.', 'red');
        continue;
      }
      
      passwordValid = true;
    }
    
    rl.close();
    
    log('\n────────────────────────────────────────', 'cyan');
    log('Creating super admin user...', 'cyan');
    log('────────────────────────────────────────\n', 'cyan');
    
    // Ensure super admin role exists
    const superAdminRole = await ensureSuperAdminRole();
    
    // Ensure system store exists
    const systemStore = await ensureSystemStore();
    
    // Hash password
    log('Hashing password...', 'cyan');
    const hashedPassword = await bcrypt.hash(password, 12); // Cost factor 12 as per constitution
    
    // Create user
    log('Creating user account...', 'cyan');
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        status: 'ACTIVE',
        emailVerified: new Date(), // Pre-verify super admin email
      },
    });
    
    log('✓ User created', 'green');
    
    // Add password to history
    await prisma.passwordHistory.create({
      data: {
        userId: user.id,
        passwordHash: hashedPassword,
      },
    });
    
    // Link user to system store with super admin role
    log('Assigning Super Admin role...', 'cyan');
    await prisma.userStore.create({
      data: {
        userId: user.id,
        storeId: systemStore.id,
        roleId: superAdminRole.id,
        isActive: true,
      },
    });
    
    log('✓ Super Admin role assigned', 'green');
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        storeId: systemStore.id,
        userId: user.id,
        actorEmail: email,
        action: 'SUPER_ADMIN_CREATED',
        entityType: 'User',
        entityId: user.id,
      },
    });
    
    log('\n╔═══════════════════════════════════════╗', 'green');
    log('║  Super Admin Created Successfully!   ║', 'green');
    log('╚═══════════════════════════════════════╝\n', 'green');
    
    log('Login credentials:', 'bright');
    log(`  Email:    ${email}`, 'cyan');
    log(`  Password: ********\n`, 'cyan');
    
    log('You can now sign in at: http://localhost:3000/auth/login', 'yellow');
    log('\n✓ Setup complete!', 'green');
    
  } catch (error) {
    log('\n✗ Error creating super admin:', 'red');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main();
