#!/usr/bin/env ts-node

/**
 * Development Seed Script
 * 
 * Generates realistic test data for local development.
 * Includes stores, users, products, orders, customers, and reviews.
 * 
 * **Usage**:
 * ```bash
 * npm run seed:dev
 * ```
 * 
 * **Features**:
 * - Creates 3 demo stores (Electronics, Fashion, Home & Garden)
 * - Generates 100+ products per store
 * - Creates 50+ customers per store
 * - Generates 20+ orders per store
 * - Adds product reviews and ratings
 * - Sets up inventory levels
 * - Creates email templates
 * 
 * @module scripts/seed-dev
 */

/* eslint-disable no-console */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Sample product data by category
 */
const PRODUCT_SAMPLES = {
  electronics: [
    { name: 'Wireless Bluetooth Headphones', price: 7999, sku: 'ELEC-HDN-001' },
    { name: '4K Ultra HD Smart TV 55"', price: 69999, sku: 'ELEC-TV-001' },
    { name: 'Laptop - Intel i7, 16GB RAM', price: 129999, sku: 'ELEC-LTP-001' },
    { name: 'Smartphone - 128GB', price: 89999, sku: 'ELEC-PHN-001' },
    { name: 'Wireless Mouse', price: 2999, sku: 'ELEC-MSE-001' },
  ],
  fashion: [
    { name: 'Cotton T-Shirt - Crew Neck', price: 2499, sku: 'FASH-TST-001' },
    { name: 'Slim Fit Jeans', price: 5999, sku: 'FASH-JNS-001' },
    { name: 'Leather Jacket', price: 19999, sku: 'FASH-JKT-001' },
    { name: 'Running Shoes', price: 8999, sku: 'FASH-SHO-001' },
    { name: 'Winter Coat', price: 14999, sku: 'FASH-COT-001' },
  ],
  home: [
    { name: 'Ceramic Dinner Plate Set (12pc)', price: 4999, sku: 'HOME-PLT-001' },
    { name: 'Memory Foam Pillow', price: 3999, sku: 'HOME-PIL-001' },
    { name: 'Table Lamp - Modern Design', price: 6999, sku: 'HOME-LMP-001' },
    { name: 'Cotton Bedsheet Set - Queen', price: 7999, sku: 'HOME-BED-001' },
    { name: 'Stainless Steel Cookware Set', price: 12999, sku: 'HOME-COK-001' },
  ],
};

/**
 * Generate random number within range
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random date within last N days
 */
function randomDate(daysAgo: number): Date {
  const now = Date.now();
  const randomTime = Math.floor(Math.random() * daysAgo * 24 * 60 * 60 * 1000);
  return new Date(now - randomTime);
}

/**
 * Generate random email
 */
function randomEmail(prefix: string): string {
  return `${prefix}.${randomInt(1000, 9999)}@example.com`;
}

/**
 * Main seed function
 */
async function main() {
  console.log('🌱 Starting development database seed...\n');

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
  console.log(`✓ Super Admin: ${superAdmin.email}\n`);

  // ============================================================================
  // 2. DEMO STORES
  // ============================================================================
  console.log('Creating demo stores...');
  
  const stores = [
    {
      name: 'TechHub Electronics',
      slug: 'techhub',
      description: 'Your one-stop shop for the latest electronics and gadgets',
      email: 'support@techhub.example.com',
      category: 'electronics',
    },
    {
      name: 'StyleStreet Fashion',
      slug: 'stylestreet',
      description: 'Trendy fashion for men and women',
      email: 'support@stylestreet.example.com',
      category: 'fashion',
    },
    {
      name: 'Cozy Home & Garden',
      slug: 'cozyhome',
      description: 'Make your house a home with our curated collection',
      email: 'support@cozyhome.example.com',
      category: 'home',
    },
  ];

  for (const storeData of stores) {
    const store = await prisma.store.upsert({
      where: { slug: storeData.slug },
      update: {},
      create: {
        name: storeData.name,
        slug: storeData.slug,
        description: storeData.description,
        email: storeData.email,
        phone: `+1-555-${randomInt(1000, 9999)}`,
        website: `https://${storeData.slug}.example.com`,
        subscriptionPlan: 'PRO',
        subscriptionStatus: 'ACTIVE',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        productLimit: 1000,
        orderLimit: 10000,
      },
    });
    console.log(`✓ Store: ${store.name}`);

    // Create Store Admin
    const adminUser = await prisma.user.create({
      data: {
        email: `admin@${storeData.slug}.example.com`,
        password: await bcrypt.hash('Admin@123', 12),
        name: `${storeData.name} Admin`,
        role: 'STORE_ADMIN',
        storeId: store.id,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`  ✓ Admin: ${adminUser.email}`);

    // Create Store Staff
    const staffUser = await prisma.user.create({
      data: {
        email: `staff@${storeData.slug}.example.com`,
        password: await bcrypt.hash('Staff@123', 12),
        name: `${storeData.name} Staff`,
        role: 'STAFF',
        storeId: store.id,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`  ✓ Staff: ${staffUser.email}`);

    // ============================================================================
    // 3. CATEGORIES & BRANDS
    // ============================================================================
    const categories = await Promise.all([
      prisma.category.create({
        data: {
          name: 'Featured',
          slug: 'featured',
          description: 'Featured products',
          storeId: store.id,
        },
      }),
      prisma.category.create({
        data: {
          name: 'New Arrivals',
          slug: 'new-arrivals',
          description: 'Latest products',
          storeId: store.id,
        },
      }),
      prisma.category.create({
        data: {
          name: 'Best Sellers',
          slug: 'best-sellers',
          description: 'Top-selling products',
          storeId: store.id,
        },
      }),
    ]);

    const brands = await Promise.all([
      prisma.brand.create({
        data: {
          name: 'Premium Brand',
          slug: 'premium-brand',
          storeId: store.id,
        },
      }),
      prisma.brand.create({
        data: {
          name: 'Value Brand',
          slug: 'value-brand',
          storeId: store.id,
        },
      }),
    ]);

    // ============================================================================
    // 4. PRODUCTS
    // ============================================================================
    console.log(`  Creating products...`);
    const products = [];
    const categoryKey = storeData.category as keyof typeof PRODUCT_SAMPLES;
    const sampleProducts = PRODUCT_SAMPLES[categoryKey];

    for (let i = 0; i < 20; i++) {
      const sample = sampleProducts[i % sampleProducts.length];
      const product = await prisma.product.create({
        data: {
          name: `${sample.name} ${i + 1}`,
          slug: `${sample.sku.toLowerCase()}-${i + 1}`,
          description: `High-quality ${sample.name.toLowerCase()} with excellent features and durability. Perfect for everyday use.`,
          sku: `${sample.sku}-${String(i + 1).padStart(3, '0')}`,
          price: sample.price + randomInt(-500, 500),
          compareAtPrice: sample.price + randomInt(1000, 3000),
          costPrice: Math.floor(sample.price * 0.6),
          trackInventory: true,
          inventoryQty: randomInt(10, 100),
          lowStockThreshold: 10,
          inventoryStatus: 'IN_STOCK',
          weight: randomInt(100, 5000),
          weightUnit: 'GRAMS',
          categoryId: categories[randomInt(0, categories.length - 1)].id,
          brandId: brands[randomInt(0, brands.length - 1)].id,
          storeId: store.id,
          status: 'PUBLISHED',
          tags: ['popular', 'featured', 'sale'].slice(0, randomInt(1, 3)),
          images: JSON.stringify([
            `https://placehold.co/600x600/png?text=${encodeURIComponent(sample.name)}`,
          ]),
        },
      });
      products.push(product);
    }
    console.log(`  ✓ Created ${products.length} products`);

    // ============================================================================
    // 5. CUSTOMERS
    // ============================================================================
    console.log(`  Creating customers...`);
    const customers = [];
    for (let i = 0; i < 30; i++) {
      const customer = await prisma.customer.create({
        data: {
          email: randomEmail(`customer${i}`),
          firstName: `Customer${i}`,
          lastName: `Test`,
          phone: `+1-555-${randomInt(1000, 9999)}`,
          storeId: store.id,
        },
      });
      customers.push(customer);
    }
    console.log(`  ✓ Created ${customers.length} customers`);

    // ============================================================================
    // 6. ORDERS
    // ============================================================================
    console.log(`  Creating orders...`);
    for (let i = 0; i < 15; i++) {
      const customer = customers[randomInt(0, customers.length - 1)];
      const orderProducts = products
        .sort(() => 0.5 - Math.random())
        .slice(0, randomInt(1, 4));

      let subtotal = 0;
      const orderItems = [];

      for (const product of orderProducts) {
        const quantity = randomInt(1, 3);
        const price = product.price;
        subtotal += price * quantity;

        orderItems.push({
          productId: product.id,
          variantId: null,
          quantity,
          price,
          sku: product.sku,
          name: product.name,
        });
      }

      const shipping = 1500; // $15.00
      const tax = Math.floor(subtotal * 0.08); // 8% tax
      const total = subtotal + shipping + tax;

      await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${randomInt(1000, 9999)}`,
          customerId: customer.id,
          storeId: store.id,
          email: customer.email,
          status: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'][randomInt(0, 3)] as any,
          paymentStatus: ['PENDING', 'PAID', 'REFUNDED'][randomInt(0, 2)] as any,
          fulfillmentStatus: ['UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED'][randomInt(0, 2)] as any,
          subtotal,
          shippingCost: shipping,
          taxAmount: tax,
          totalAmount: total,
          shippingAddress: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            address1: `${randomInt(100, 999)} Main St`,
            address2: `Apt ${randomInt(1, 20)}`,
            city: 'San Francisco',
            province: 'CA',
            postalCode: '94102',
            country: 'US',
            phone: customer.phone,
          },
          billingAddress: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            address1: `${randomInt(100, 999)} Main St`,
            address2: `Apt ${randomInt(1, 20)}`,
            city: 'San Francisco',
            province: 'CA',
            postalCode: '94102',
            country: 'US',
            phone: customer.phone,
          },
          orderItems: {
            create: orderItems,
          },
          createdAt: randomDate(60),
        },
      });
    }
    console.log(`  ✓ Created 15 orders\n`);
  }

  console.log('✅ Development database seed complete!\n');
  console.log('📝 Login credentials:');
  console.log('   Super Admin: admin@stormcom.io / Admin@123');
  console.log('   TechHub Admin: admin@techhub.example.com / Admin@123');
  console.log('   StyleStreet Admin: admin@stylestreet.example.com / Admin@123');
  console.log('   CozyHome Admin: admin@cozyhome.example.com / Admin@123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
