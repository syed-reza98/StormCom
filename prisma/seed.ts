// prisma/seed.ts
// StormCom Database Seed Script
// Seeds database with initial test data for development

/* eslint-disable no-console */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ============================================================================
  // 1. SUPER ADMIN
  // ============================================================================
  console.log('Creating Super Admin...');
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@stormcom.io' },
    update: {},
    create: {
      email: 'admin@stormcom.io',
      password: await bcrypt.hash('Admin@123', 12),
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });
  console.log(`✓ Super Admin created: ${superAdmin.email}\n`);

  // ============================================================================
  // 2. DEMO STORES
  // ============================================================================
  console.log('Creating stores...');
  
  const demoStore = await prisma.store.upsert({
    where: { slug: 'demo-store' },
    update: {},
    create: {
      name: 'Demo Store',
      slug: 'demo-store',
      description: 'A demo e-commerce store for testing StormCom features',
      email: 'demo@stormcom.io',
      phone: '+1-555-0100',
      website: 'https://demo.stormcom.io',
      subscriptionPlan: 'PRO',
      subscriptionStatus: 'ACTIVE',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      productLimit: 1000,
      orderLimit: 10000,
      address: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
      locale: 'en',
    },
  });
  
  const testStore = await prisma.store.upsert({
    where: { slug: 'test-store' },
    update: {},
    create: {
      name: 'Test Store',
      slug: 'test-store',
      description: 'A test store for development and testing',
      email: 'test@stormcom.io',
      phone: '+1-555-0101',
      subscriptionPlan: 'FREE',
      subscriptionStatus: 'TRIAL',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      productLimit: 10,
      orderLimit: 100,
      country: 'US',
      currency: 'USD',
      timezone: 'UTC',
      locale: 'en',
    },
  });
  
  console.log(`✓ Created stores: ${demoStore.name}, ${testStore.name}\n`);

  // ============================================================================
  // 3. STORE USERS
  // ============================================================================
  console.log('Creating store users...');
  
  const storeAdmin = await prisma.user.upsert({
    where: { email: 'admin@demo-store.com' },
    update: {},
    create: {
      email: 'admin@demo-store.com',
      password: await bcrypt.hash('Demo@123', 12),
      name: 'Store Admin',
      role: 'STORE_ADMIN',
      storeId: demoStore.id,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@demo-store.com' },
    update: {},
    create: {
      email: 'staff@demo-store.com',
      password: await bcrypt.hash('Demo@123', 12),
      name: 'Store Staff',
      role: 'STAFF',
      storeId: demoStore.id,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: await bcrypt.hash('Customer@123', 12),
      name: 'John Doe',
      role: 'CUSTOMER',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`✓ Created users: ${storeAdmin.name}, ${staff.name}, ${customer.name}\n`);

  // ============================================================================
  // 4. CATEGORIES
  // ============================================================================
  console.log('Creating categories...');
  
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        storeId: demoStore.id,
        name: 'Electronics',
        slug: 'electronics',
        description: 'Electronic devices and accessories',
        metaTitle: 'Electronics - Demo Store',
        metaDescription: 'Browse our collection of electronics',
        isPublished: true,
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        storeId: demoStore.id,
        name: 'Clothing',
        slug: 'clothing',
        description: 'Fashion and apparel',
        metaTitle: 'Clothing - Demo Store',
        metaDescription: 'Shop the latest fashion trends',
        isPublished: true,
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        storeId: demoStore.id,
        name: 'Home & Garden',
        slug: 'home-garden',
        description: 'Home decor and gardening supplies',
        isPublished: true,
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        storeId: demoStore.id,
        name: 'Books',
        slug: 'books',
        description: 'Books and educational materials',
        isPublished: true,
        sortOrder: 4,
      },
    }),
    prisma.category.create({
      data: {
        storeId: demoStore.id,
        name: 'Sports & Outdoors',
        slug: 'sports-outdoors',
        description: 'Sports equipment and outdoor gear',
        isPublished: true,
        sortOrder: 5,
      },
    }),
  ]);
  
  console.log(`✓ Created ${categories.length} categories\n`);

  // ============================================================================
  // 5. BRANDS
  // ============================================================================
  console.log('Creating brands...');
  
  const brands = await Promise.all([
    prisma.brand.create({
      data: {
        storeId: demoStore.id,
        name: 'TechPro',
        slug: 'techpro',
        description: 'Premium electronics brand',
        isPublished: true,
      },
    }),
    prisma.brand.create({
      data: {
        storeId: demoStore.id,
        name: 'StyleCo',
        slug: 'styleco',
        description: 'Fashion and lifestyle brand',
        isPublished: true,
      },
    }),
    prisma.brand.create({
      data: {
        storeId: demoStore.id,
        name: 'HomeEssentials',
        slug: 'home-essentials',
        description: 'Quality home products',
        isPublished: true,
      },
    }),
  ]);
  
  console.log(`✓ Created ${brands.length} brands\n`);

  // ============================================================================
  // 6. PRODUCTS
  // ============================================================================
  console.log('Creating products...');
  
  const products = await Promise.all([
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'Wireless Bluetooth Headphones',
        slug: 'wireless-bluetooth-headphones',
        description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
        shortDescription: 'Premium wireless headphones',
        price: 199.99,
        compareAtPrice: 249.99,
        costPrice: 120.00,
        sku: 'WBH-001',
        barcode: '1234567890123',
        trackInventory: true,
        inventoryQty: 50,
        lowStockThreshold: 10,
        inventoryStatus: 'IN_STOCK',
        categoryId: categories[0].id,
        brandId: brands[0].id,
        images: JSON.stringify(['https://placehold.co/600x600/3B82F6/ffffff?text=Headphones']),
        thumbnailUrl: 'https://placehold.co/300x300/3B82F6/ffffff?text=Headphones',
        metaTitle: 'Wireless Bluetooth Headphones - TechPro',
        metaDescription: 'Premium noise-cancelling wireless headphones',
        metaKeywords: JSON.stringify(['headphones', 'wireless', 'bluetooth', 'audio']),
        isPublished: true,
        publishedAt: new Date(),
        isFeatured: true,
      },
    }),
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'Smart Watch Pro',
        slug: 'smart-watch-pro',
        description: 'Advanced fitness tracking smartwatch with heart rate monitor and GPS',
        shortDescription: 'Fitness tracking smartwatch',
        price: 299.99,
        compareAtPrice: 399.99,
        costPrice: 180.00,
        sku: 'SWP-001',
        trackInventory: true,
        inventoryQty: 30,
        lowStockThreshold: 5,
        inventoryStatus: 'IN_STOCK',
        categoryId: categories[0].id,
        brandId: brands[0].id,
        images: JSON.stringify(['https://placehold.co/600x600/10B981/ffffff?text=SmartWatch']),
        thumbnailUrl: 'https://placehold.co/300x300/10B981/ffffff?text=SmartWatch',
        metaTitle: 'Smart Watch Pro - TechPro',
        metaDescription: 'Advanced fitness tracking smartwatch',
        metaKeywords: JSON.stringify(['smartwatch', 'fitness', 'tracker', 'gps']),
        isPublished: true,
        publishedAt: new Date(),
        isFeatured: true,
      },
    }),
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'Premium Cotton T-Shirt',
        slug: 'premium-cotton-t-shirt',
        description: '100% organic cotton t-shirt with comfortable fit',
        shortDescription: 'Organic cotton t-shirt',
        price: 29.99,
        costPrice: 12.00,
        sku: 'PCT-001',
        trackInventory: true,
        inventoryQty: 100,
        lowStockThreshold: 20,
        inventoryStatus: 'IN_STOCK',
        categoryId: categories[1].id,
        brandId: brands[1].id,
        images: JSON.stringify(['https://placehold.co/600x600/F59E0B/ffffff?text=T-Shirt']),
        thumbnailUrl: 'https://placehold.co/300x300/F59E0B/ffffff?text=T-Shirt',
        metaTitle: 'Premium Cotton T-Shirt - StyleCo',
        metaDescription: '100% organic cotton t-shirt',
        metaKeywords: JSON.stringify(['t-shirt', 'cotton', 'organic', 'clothing']),
        isPublished: true,
        publishedAt: new Date(),
      },
    }),
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'Classic Denim Jeans',
        slug: 'classic-denim-jeans',
        description: 'Timeless denim jeans with perfect fit',
        shortDescription: 'Classic fit denim jeans',
        price: 79.99,
        compareAtPrice: 99.99,
        costPrice: 35.00,
        sku: 'CDJ-001',
        trackInventory: true,
        inventoryQty: 75,
        lowStockThreshold: 15,
        inventoryStatus: 'IN_STOCK',
        categoryId: categories[1].id,
        brandId: brands[1].id,
        images: JSON.stringify(['https://placehold.co/600x600/6366F1/ffffff?text=Jeans']),
        thumbnailUrl: 'https://placehold.co/300x300/6366F1/ffffff?text=Jeans',
        metaTitle: 'Classic Denim Jeans - StyleCo',
        metaDescription: 'Timeless denim jeans with perfect fit',
        metaKeywords: JSON.stringify(['jeans', 'denim', 'clothing', 'fashion']),
        isPublished: true,
        publishedAt: new Date(),
      },
    }),
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'Ceramic Coffee Mug Set',
        slug: 'ceramic-coffee-mug-set',
        description: 'Set of 4 handcrafted ceramic coffee mugs',
        shortDescription: '4-piece ceramic mug set',
        price: 39.99,
        costPrice: 18.00,
        sku: 'CCM-001',
        trackInventory: true,
        inventoryQty: 45,
        lowStockThreshold: 10,
        inventoryStatus: 'IN_STOCK',
        categoryId: categories[2].id,
        brandId: brands[2].id,
        images: JSON.stringify(['https://placehold.co/600x600/EC4899/ffffff?text=Mugs']),
        thumbnailUrl: 'https://placehold.co/300x300/EC4899/ffffff?text=Mugs',
        metaTitle: 'Ceramic Coffee Mug Set - HomeEssentials',
        metaDescription: 'Handcrafted ceramic coffee mugs',
        metaKeywords: JSON.stringify(['mugs', 'coffee', 'ceramic', 'home']),
        isPublished: true,
        publishedAt: new Date(),
      },
    }),
  ]);
  
  console.log(`✓ Created ${products.length} products\n`);

  // ============================================================================
  // 7. SHIPPING ZONES & RATES
  // ============================================================================
  console.log('Creating shipping zones...');
  
  const usZone = await prisma.shippingZone.create({
    data: {
      storeId: demoStore.id,
      name: 'United States',
      countries: JSON.stringify(['US']),
      rates: {
        create: [
          {
            name: 'Standard Shipping',
            price: 5.99,
            minOrderValue: 0,
            estimatedDaysMin: 5,
            estimatedDaysMax: 7,
            isActive: true,
          },
          {
            name: 'Express Shipping',
            price: 14.99,
            minOrderValue: 0,
            estimatedDaysMin: 2,
            estimatedDaysMax: 3,
            isActive: true,
          },
          {
            name: 'Free Shipping',
            price: 0,
            minOrderValue: 50,
            estimatedDaysMin: 5,
            estimatedDaysMax: 7,
            isActive: true,
          },
        ],
      },
    },
  });

  const internationalZone = await prisma.shippingZone.create({
    data: {
      storeId: demoStore.id,
      name: 'International',
      countries: JSON.stringify(['CA', 'GB', 'AU', 'DE', 'FR']),
      rates: {
        create: [
          {
            name: 'International Standard',
            price: 19.99,
            minOrderValue: 0,
            estimatedDaysMin: 10,
            estimatedDaysMax: 14,
            isActive: true,
          },
          {
            name: 'International Express',
            price: 39.99,
            minOrderValue: 0,
            estimatedDaysMin: 5,
            estimatedDaysMax: 7,
            isActive: true,
          },
        ],
      },
    },
  });
  
  console.log(`✓ Created shipping zones: ${usZone.name}, ${internationalZone.name}\n`);

  // ============================================================================
  // 8. TAX RATES
  // ============================================================================
  console.log('Creating tax rates...');
  
  const taxRates = await Promise.all([
    prisma.taxRate.create({
      data: {
        storeId: demoStore.id,
        name: 'California Sales Tax',
        rate: 0.0825,
        country: 'US',
        state: 'CA',
        isActive: true,
      },
    }),
    prisma.taxRate.create({
      data: {
        storeId: demoStore.id,
        name: 'New York Sales Tax',
        rate: 0.08875,
        country: 'US',
        state: 'NY',
        isActive: true,
      },
    }),
  ]);
  
  console.log(`✓ Created ${taxRates.length} tax rates\n`);

  // ============================================================================
  // 9. THEME
  // ============================================================================
  console.log('Creating theme...');
  
  await prisma.theme.create({
    data: {
      storeId: demoStore.id,
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      accentColor: '#F59E0B',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      fontFamily: 'Inter',
      headingFont: 'Inter',
      fontSize: '16px',
      layoutWidth: '1280px',
      borderRadius: '0.5rem',
      mode: 'LIGHT',
    },
  });
  
  console.log(`✓ Created theme for ${demoStore.name}\n`);

  // ============================================================================
  // 10. EMAIL TEMPLATES
  // ============================================================================
  console.log('Creating email templates...');
  
  const emailTemplates = await Promise.all([
    prisma.emailTemplate.create({
      data: {
        storeId: demoStore.id,
        name: 'Order Confirmation',
        handle: 'order_confirmation',
        subject: 'Order Confirmation - Order #{{orderNumber}}',
        htmlBody: `
          <h1>Thank you for your order!</h1>
          <p>Hi {{customerName}},</p>
          <p>Your order #{{orderNumber}} has been confirmed.</p>
          <p>Order Total: {{orderTotal}}</p>
        `,
        textBody: 'Thank you for your order! Order #{{orderNumber}}',
        variables: JSON.stringify(['{{customerName}}', '{{orderNumber}}', '{{orderTotal}}']),
        isActive: true,
      },
    }),
    prisma.emailTemplate.create({
      data: {
        storeId: demoStore.id,
        name: 'Shipping Notification',
        handle: 'shipping_notification',
        subject: 'Your Order Has Shipped - Order #{{orderNumber}}',
        htmlBody: `
          <h1>Your order is on the way!</h1>
          <p>Hi {{customerName}},</p>
          <p>Your order #{{orderNumber}} has been shipped.</p>
          <p>Tracking Number: {{trackingNumber}}</p>
        `,
        textBody: 'Your order has shipped. Tracking: {{trackingNumber}}',
        variables: JSON.stringify(['{{customerName}}', '{{orderNumber}}', '{{trackingNumber}}']),
        isActive: true,
      },
    }),
  ]);
  
  console.log(`✓ Created ${emailTemplates.length} email templates\n`);

  console.log('✅ Seeding completed successfully!\n');
  
  console.log('📋 Summary:');
  console.log(`   - Stores: 2 (Demo Store, Test Store)`);
  console.log(`   - Users: 4 (1 Super Admin, 1 Store Admin, 1 Staff, 1 Customer)`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Brands: ${brands.length}`);
  console.log(`   - Products: ${products.length}`);
  console.log(`   - Shipping Zones: 2`);
  console.log(`   - Tax Rates: ${taxRates.length}`);
  console.log(`   - Email Templates: ${emailTemplates.length}\n`);
  
  console.log('🔐 Test Credentials:');
  console.log(`   Super Admin: admin@stormcom.io / Admin@123`);
  console.log(`   Store Admin: admin@demo-store.com / Demo@123`);
  console.log(`   Staff: staff@demo-store.com / Demo@123`);
  console.log(`   Customer: customer@example.com / Customer@123\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
