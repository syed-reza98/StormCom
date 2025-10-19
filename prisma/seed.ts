import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed database with initial data:
 * - Default roles (OWNER, ADMIN, MANAGER, STAFF, VIEWER)
 * - Subscription plans (Free, Basic, Pro, Enterprise)
 * - Super admin user (for bootstrapping)
 */
async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Roles
  console.log('Creating default roles...');
  const roles = [
    {
      name: 'OWNER',
      slug: 'owner',
      description: 'Store owner with full permissions',
      permissions: ['*'], // All permissions
      isSystem: true,
    },
    {
      name: 'ADMIN',
      slug: 'admin',
      description: 'Administrator with management permissions',
      permissions: [
        'products.*',
        'orders.*',
        'customers.*',
        'settings.view',
        'settings.update',
        'reports.view',
      ],
      isSystem: true,
    },
    {
      name: 'MANAGER',
      slug: 'manager',
      description: 'Manager with operational permissions',
      permissions: [
        'products.view',
        'products.create',
        'products.update',
        'orders.view',
        'orders.update',
        'customers.view',
        'reports.view',
      ],
      isSystem: true,
    },
    {
      name: 'STAFF',
      slug: 'staff',
      description: 'Staff member with limited permissions',
      permissions: ['products.view', 'orders.view', 'customers.view'],
      isSystem: true,
    },
    {
      name: 'VIEWER',
      slug: 'viewer',
      description: 'Read-only access to store data',
      permissions: ['*.view'],
      isSystem: true,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { slug: role.slug },
      update: {},
      create: role,
    });
  }
  console.log('✅ Roles created');

  // 2. Seed Subscription Plans
  console.log('Creating subscription plans...');
  const plans = [
    {
      name: 'Free',
      slug: 'free',
      tier: 0,
      description: 'Free tier for testing',
      price: 0,
      billingCycle: 'MONTHLY',
      trialDays: 14,
      maxProducts: 10,
      maxOrders: 50,
      maxStaff: 1,
      maxStorage: 100, // MB
      features: {
        basicReports: true,
        emailSupport: true,
      },
      isActive: true,
    },
    {
      name: 'Basic',
      slug: 'basic',
      tier: 1,
      description: 'Basic plan for small businesses',
      price: 29.0,
      billingCycle: 'MONTHLY',
      trialDays: 14,
      maxProducts: 100,
      maxOrders: 500,
      maxStaff: 3,
      maxStorage: 1000, // 1GB
      features: {
        basicReports: true,
        emailSupport: true,
        customDomain: true,
      },
      isActive: true,
    },
    {
      name: 'Pro',
      slug: 'pro',
      tier: 2,
      description: 'Professional plan for growing businesses',
      price: 79.0,
      billingCycle: 'MONTHLY',
      trialDays: 14,
      maxProducts: 1000,
      maxOrders: 5000,
      maxStaff: 10,
      maxStorage: 5000, // 5GB
      features: {
        advancedReports: true,
        prioritySupport: true,
        customDomain: true,
        multiCurrency: true,
        apiAccess: true,
      },
      isActive: true,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      tier: 3,
      description: 'Enterprise plan with unlimited resources',
      price: 299.0,
      billingCycle: 'MONTHLY',
      trialDays: 30,
      maxProducts: 10000,
      maxOrders: 100000,
      maxStaff: 50,
      maxStorage: 50000, // 50GB
      features: {
        advancedReports: true,
        dedicatedSupport: true,
        customDomain: true,
        multiCurrency: true,
        apiAccess: true,
        whiteLabel: true,
        ssoIntegration: true,
      },
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    });
  }
  console.log('✅ Subscription plans created');

  // 3. Create Super Admin User (optional - for bootstrapping)
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@stormcom.io';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123';

  const existingUser = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingUser) {
    console.log('Creating super admin user...');
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);

    await prisma.user.create({
      data: {
        email: superAdminEmail,
        name: 'Super Admin',
        password: hashedPassword,
        emailVerified: new Date(),
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Super admin created: ${superAdminEmail}`);
    console.log(`   Password: ${superAdminPassword} (CHANGE THIS IN PRODUCTION!)`);
  } else {
    console.log('⏭️  Super admin already exists, skipping...');
  }

  console.log('🎉 Database seed completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
