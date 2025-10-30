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
  // 6. PRODUCTS (Comprehensive Product Catalog)
  // ============================================================================
  console.log('Creating comprehensive product catalog...');
  
  const products = await Promise.all([
    // Electronics - Featured Products
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'Wireless Bluetooth Headphones',
        slug: 'wireless-bluetooth-headphones',
        description: 'Premium noise-cancelling wireless headphones with 30-hour battery life. Features advanced active noise cancellation, high-fidelity audio drivers, and comfortable over-ear design. Perfect for music lovers, travelers, and remote workers.',
        shortDescription: 'Premium wireless headphones with 30h battery',
        price: 199.99,
        compareAtPrice: 249.99,
        costPrice: 120.00,
        sku: 'WBH-001',
        barcode: '1234567890123',
        trackInventory: true,
        inventoryQty: 50,
        lowStockThreshold: 10,
        inventoryStatus: 'IN_STOCK',
        weight: 0.25,
        length: 20,
        width: 18,
        height: 10,
        categoryId: categories[0].id,
        brandId: brands[0].id,
        images: JSON.stringify(['https://placehold.co/600x600/3B82F6/ffffff?text=Headphones']),
        thumbnailUrl: 'https://placehold.co/300x300/3B82F6/ffffff?text=Headphones',
        metaTitle: 'Wireless Bluetooth Headphones - Premium Noise Cancelling',
        metaDescription: 'Shop premium wireless headphones with 30-hour battery life and active noise cancellation. Free shipping over $50.',
        metaKeywords: JSON.stringify(['headphones', 'wireless', 'bluetooth', 'audio', 'noise cancelling']),
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
        description: 'Advanced fitness tracking smartwatch with heart rate monitor, GPS, and sleep tracking. Water-resistant up to 50m. Compatible with iOS and Android. Track your workouts, monitor health metrics, and stay connected on the go.',
        shortDescription: 'Fitness tracking smartwatch with GPS',
        price: 299.99,
        compareAtPrice: 399.99,
        costPrice: 180.00,
        sku: 'SWP-001',
        trackInventory: true,
        inventoryQty: 30,
        lowStockThreshold: 5,
        inventoryStatus: 'IN_STOCK',
        weight: 0.05,
        length: 5,
        width: 4,
        height: 1,
        categoryId: categories[0].id,
        brandId: brands[0].id,
        images: JSON.stringify(['https://placehold.co/600x600/10B981/ffffff?text=SmartWatch']),
        thumbnailUrl: 'https://placehold.co/300x300/10B981/ffffff?text=SmartWatch',
        metaTitle: 'Smart Watch Pro - Advanced Fitness Tracker',
        metaDescription: 'Track fitness, monitor health, stay connected. GPS, heart rate, sleep tracking.',
        metaKeywords: JSON.stringify(['smartwatch', 'fitness', 'tracker', 'gps', 'health']),
        isPublished: true,
        publishedAt: new Date(),
        isFeatured: true,
      },
    }),
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'USB-C Fast Charger 65W',
        slug: 'usb-c-fast-charger-65w',
        description: 'Universal 65W USB-C fast charger with GaN technology. Charges laptops, tablets, and phones. Compact design, foldable prongs.',
        shortDescription: '65W USB-C fast charger',
        price: 49.99,
        costPrice: 22.00,
        sku: 'USBC-65W-001',
        trackInventory: true,
        inventoryQty: 80,
        lowStockThreshold: 15,
        inventoryStatus: 'IN_STOCK',
        weight: 0.15,
        categoryId: categories[0].id,
        brandId: brands[0].id,
        images: JSON.stringify(['https://placehold.co/600x600/8B5CF6/ffffff?text=Charger']),
        thumbnailUrl: 'https://placehold.co/300x300/8B5CF6/ffffff?text=Charger',
        metaKeywords: JSON.stringify(['charger', 'usb-c', 'fast charging', 'GaN']),
        isPublished: true,
        publishedAt: new Date(),
      },
    }),
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: '4K Webcam with Microphone',
        slug: '4k-webcam-microphone',
        description: 'Professional 4K webcam with built-in noise-cancelling microphone. Auto-focus, 90° wide angle, USB plug-and-play.',
        shortDescription: '4K webcam for video calls',
        price: 129.99,
        compareAtPrice: 179.99,
        costPrice: 65.00,
        sku: 'WC-4K-001',
        trackInventory: true,
        inventoryQty: 25,
        lowStockThreshold: 5,
        inventoryStatus: 'IN_STOCK',
        categoryId: categories[0].id,
        brandId: brands[0].id,
        images: JSON.stringify(['https://placehold.co/600x600/EF4444/ffffff?text=Webcam']),
        thumbnailUrl: 'https://placehold.co/300x300/EF4444/ffffff?text=Webcam',
        metaKeywords: JSON.stringify(['webcam', '4k', 'video call', 'microphone']),
        isPublished: true,
        publishedAt: new Date(),
      },
    }),
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'Mechanical Keyboard RGB',
        slug: 'mechanical-keyboard-rgb',
        description: 'Mechanical gaming keyboard with customizable RGB backlighting. Cherry MX switches, programmable keys, aluminum frame.',
        shortDescription: 'RGB mechanical gaming keyboard',
        price: 159.99,
        costPrice: 80.00,
        sku: 'KB-MECH-RGB-001',
        trackInventory: true,
        inventoryQty: 40,
        lowStockThreshold: 10,
        inventoryStatus: 'IN_STOCK',
        categoryId: categories[0].id,
        brandId: brands[0].id,
        images: JSON.stringify(['https://placehold.co/600x600/06B6D4/ffffff?text=Keyboard']),
        thumbnailUrl: 'https://placehold.co/300x300/06B6D4/ffffff?text=Keyboard',
        metaKeywords: JSON.stringify(['keyboard', 'mechanical', 'rgb', 'gaming']),
        isPublished: true,
        publishedAt: new Date(),
        isFeatured: true,
      },
    }),
    
    // Clothing - Multiple Products
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'Premium Cotton T-Shirt',
        slug: 'premium-cotton-t-shirt',
        description: '100% organic cotton t-shirt with comfortable fit. Pre-shrunk, breathable fabric. Available in multiple colors and sizes. Perfect for everyday wear.',
        shortDescription: 'Organic cotton t-shirt',
        price: 29.99,
        costPrice: 12.00,
        sku: 'PCT-001',
        trackInventory: true,
        inventoryQty: 100,
        lowStockThreshold: 20,
        inventoryStatus: 'IN_STOCK',
        weight: 0.2,
        categoryId: categories[1].id,
        brandId: brands[1].id,
        images: JSON.stringify(['https://placehold.co/600x600/F59E0B/ffffff?text=T-Shirt']),
        thumbnailUrl: 'https://placehold.co/300x300/F59E0B/ffffff?text=T-Shirt',
        metaTitle: 'Premium Cotton T-Shirt - 100% Organic',
        metaDescription: '100% organic cotton t-shirt. Soft, breathable, pre-shrunk.',
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
        description: 'Timeless denim jeans with perfect fit. Stretch denim for comfort, reinforced stitching, classic 5-pocket design.',
        shortDescription: 'Classic fit denim jeans',
        price: 79.99,
        compareAtPrice: 99.99,
        costPrice: 35.00,
        sku: 'CDJ-001',
        trackInventory: true,
        inventoryQty: 75,
        lowStockThreshold: 15,
        inventoryStatus: 'IN_STOCK',
        weight: 0.6,
        categoryId: categories[1].id,
        brandId: brands[1].id,
        images: JSON.stringify(['https://placehold.co/600x600/6366F1/ffffff?text=Jeans']),
        thumbnailUrl: 'https://placehold.co/300x300/6366F1/ffffff?text=Jeans',
        metaTitle: 'Classic Denim Jeans - Comfortable Fit',
        metaDescription: 'Timeless denim jeans with stretch comfort and classic styling.',
        metaKeywords: JSON.stringify(['jeans', 'denim', 'clothing', 'fashion']),
        isPublished: true,
        publishedAt: new Date(),
      },
    }),
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'Hooded Sweatshirt',
        slug: 'hooded-sweatshirt',
        description: 'Comfortable fleece-lined hoodie. Cotton-polyester blend, kangaroo pocket, adjustable drawstring hood.',
        shortDescription: 'Fleece-lined hoodie',
        price: 59.99,
        costPrice: 28.00,
        sku: 'HS-001',
        trackInventory: true,
        inventoryQty: 60,
        lowStockThreshold: 12,
        inventoryStatus: 'IN_STOCK',
        categoryId: categories[1].id,
        brandId: brands[1].id,
        images: JSON.stringify(['https://placehold.co/600x600/14B8A6/ffffff?text=Hoodie']),
        thumbnailUrl: 'https://placehold.co/300x300/14B8A6/ffffff?text=Hoodie',
        metaKeywords: JSON.stringify(['hoodie', 'sweatshirt', 'clothing', 'fleece']),
        isPublished: true,
        publishedAt: new Date(),
      },
    }),
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'Running Shorts',
        slug: 'running-shorts',
        description: 'Lightweight athletic shorts with moisture-wicking fabric. Built-in liner, zip pocket, reflective details.',
        shortDescription: 'Athletic running shorts',
        price: 34.99,
        costPrice: 15.00,
        sku: 'RS-001',
        trackInventory: true,
        inventoryQty: 90,
        lowStockThreshold: 18,
        inventoryStatus: 'IN_STOCK',
        categoryId: categories[4].id,
        brandId: brands[1].id,
        images: JSON.stringify(['https://placehold.co/600x600/F97316/ffffff?text=Shorts']),
        thumbnailUrl: 'https://placehold.co/300x300/F97316/ffffff?text=Shorts',
        metaKeywords: JSON.stringify(['shorts', 'running', 'athletic', 'sportswear']),
        isPublished: true,
        publishedAt: new Date(),
      },
    }),
    
    // Home & Garden
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'Ceramic Coffee Mug Set',
        slug: 'ceramic-coffee-mug-set',
        description: 'Set of 4 handcrafted ceramic coffee mugs. Dishwasher and microwave safe. Elegant design, 12oz capacity each.',
        shortDescription: '4-piece ceramic mug set',
        price: 39.99,
        costPrice: 18.00,
        sku: 'CCM-001',
        trackInventory: true,
        inventoryQty: 45,
        lowStockThreshold: 10,
        inventoryStatus: 'IN_STOCK',
        weight: 1.2,
        categoryId: categories[2].id,
        brandId: brands[2].id,
        images: JSON.stringify(['https://placehold.co/600x600/EC4899/ffffff?text=Mugs']),
        thumbnailUrl: 'https://placehold.co/300x300/EC4899/ffffff?text=Mugs',
        metaTitle: 'Ceramic Coffee Mug Set - Handcrafted 4-Piece',
        metaDescription: 'Handcrafted ceramic coffee mugs. Set of 4, dishwasher safe.',
        metaKeywords: JSON.stringify(['mugs', 'coffee', 'ceramic', 'home']),
        isPublished: true,
        publishedAt: new Date(),
      },
    }),
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'LED Desk Lamp',
        slug: 'led-desk-lamp',
        description: 'Adjustable LED desk lamp with touch controls. 5 brightness levels, USB charging port, energy-efficient.',
        shortDescription: 'Adjustable LED desk lamp',
        price: 69.99,
        costPrice: 32.00,
        sku: 'DL-LED-001',
        trackInventory: true,
        inventoryQty: 35,
        lowStockThreshold: 8,
        inventoryStatus: 'IN_STOCK',
        categoryId: categories[2].id,
        brandId: brands[2].id,
        images: JSON.stringify(['https://placehold.co/600x600/A855F7/ffffff?text=Lamp']),
        thumbnailUrl: 'https://placehold.co/300x300/A855F7/ffffff?text=Lamp',
        metaKeywords: JSON.stringify(['lamp', 'desk', 'led', 'lighting']),
        isPublished: true,
        publishedAt: new Date(),
      },
    }),
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'Indoor Plant Pot Set',
        slug: 'indoor-plant-pot-set',
        description: 'Set of 3 ceramic plant pots with drainage holes and saucers. Modern minimalist design, 4", 5", 6" sizes.',
        shortDescription: '3-piece ceramic plant pot set',
        price: 44.99,
        costPrice: 20.00,
        sku: 'PP-CER-001',
        trackInventory: true,
        inventoryQty: 52,
        lowStockThreshold: 10,
        inventoryStatus: 'IN_STOCK',
        categoryId: categories[2].id,
        brandId: brands[2].id,
        images: JSON.stringify(['https://placehold.co/600x600/22C55E/ffffff?text=Pots']),
        thumbnailUrl: 'https://placehold.co/300x300/22C55E/ffffff?text=Pots',
        metaKeywords: JSON.stringify(['plant pot', 'ceramic', 'indoor', 'garden']),
        isPublished: true,
        publishedAt: new Date(),
      },
    }),
    
    // Books
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'Web Development Guide 2025',
        slug: 'web-development-guide-2025',
        description: 'Comprehensive guide to modern web development. Covers React, Next.js, TypeScript, and best practices. 450 pages.',
        shortDescription: 'Modern web development handbook',
        price: 49.99,
        costPrice: 18.00,
        sku: 'BK-WD-2025',
        trackInventory: true,
        inventoryQty: 100,
        lowStockThreshold: 20,
        inventoryStatus: 'IN_STOCK',
        categoryId: categories[3].id,
        images: JSON.stringify(['https://placehold.co/600x600/3B82F6/ffffff?text=Book']),
        thumbnailUrl: 'https://placehold.co/300x300/3B82F6/ffffff?text=Book',
        metaKeywords: JSON.stringify(['book', 'web development', 'programming', 'technology']),
        isPublished: true,
        publishedAt: new Date(),
        isFeatured: true,
      },
    }),
    
    // Sports & Outdoors
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'Yoga Mat Premium',
        slug: 'yoga-mat-premium',
        description: 'Non-slip yoga mat with alignment markers. 6mm thick, eco-friendly TPE material, includes carrying strap.',
        shortDescription: 'Premium non-slip yoga mat',
        price: 54.99,
        costPrice: 25.00,
        sku: 'YM-PREM-001',
        trackInventory: true,
        inventoryQty: 70,
        lowStockThreshold: 15,
        inventoryStatus: 'IN_STOCK',
        categoryId: categories[4].id,
        images: JSON.stringify(['https://placehold.co/600x600/8B5CF6/ffffff?text=Yoga+Mat']),
        thumbnailUrl: 'https://placehold.co/300x300/8B5CF6/ffffff?text=Yoga+Mat',
        metaKeywords: JSON.stringify(['yoga', 'mat', 'fitness', 'exercise']),
        isPublished: true,
        publishedAt: new Date(),
      },
    }),
    prisma.product.create({
      data: {
        storeId: demoStore.id,
        name: 'Resistance Bands Set',
        slug: 'resistance-bands-set',
        description: 'Set of 5 resistance bands with different resistance levels. Includes door anchor, handles, and carrying bag.',
        shortDescription: '5-piece resistance band set',
        price: 29.99,
        costPrice: 12.00,
        sku: 'RB-SET-001',
        trackInventory: true,
        inventoryQty: 65,
        lowStockThreshold: 12,
        inventoryStatus: 'IN_STOCK',
        categoryId: categories[4].id,
        images: JSON.stringify(['https://placehold.co/600x600/EF4444/ffffff?text=Bands']),
        thumbnailUrl: 'https://placehold.co/300x300/EF4444/ffffff?text=Bands',
        metaKeywords: JSON.stringify(['resistance bands', 'fitness', 'workout', 'training']),
        isPublished: true,
        publishedAt: new Date(),
      },
    }),
  ]);
  
  console.log(`✓ Created ${products.length} products with comprehensive details\n`);

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

  // ============================================================================
  // 11. CUSTOMERS
  // ============================================================================
  console.log('Creating customers...');
  
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        storeId: demoStore.id,
        userId: customer.id,
        email: customer.email,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-0200',
        acceptsMarketing: true,
        marketingOptInAt: new Date(),
        totalOrders: 5,
        totalSpent: 1234.56,
        averageOrderValue: 246.91,
        lastOrderAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.customer.create({
      data: {
        storeId: demoStore.id,
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1-555-0201',
        acceptsMarketing: true,
        marketingOptInAt: new Date(),
        totalOrders: 3,
        totalSpent: 567.89,
        averageOrderValue: 189.30,
        lastOrderAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.customer.create({
      data: {
        storeId: demoStore.id,
        email: 'bob.wilson@example.com',
        firstName: 'Bob',
        lastName: 'Wilson',
        phone: '+1-555-0202',
        acceptsMarketing: false,
        totalOrders: 1,
        totalSpent: 199.99,
        averageOrderValue: 199.99,
        lastOrderAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);
  
  console.log(`✓ Created ${customers.length} customers\n`);

  // ============================================================================
  // 12. DISCOUNTS & FLASH SALES
  // ============================================================================
  console.log('Creating discounts and promotions...');
  
  const discounts = await Promise.all([
    prisma.discount.create({
      data: {
        storeId: demoStore.id,
        code: 'WELCOME10',
        type: 'PERCENTAGE',
        value: 10,
        minimumPurchase: 50,
        usageLimit: 100,
        usageCount: 12,
        perCustomerLimit: 1,
        startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    }),
    prisma.discount.create({
      data: {
        storeId: demoStore.id,
        code: 'FREESHIP',
        type: 'FREE_SHIPPING',
        value: 0,
        minimumPurchase: 75,
        isActive: true,
      },
    }),
    prisma.discount.create({
      data: {
        storeId: demoStore.id,
        code: 'SAVE25',
        type: 'FIXED',
        value: 25,
        minimumPurchase: 100,
        usageLimit: 50,
        usageCount: 8,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    }),
  ]);

  const flashSale = await prisma.flashSale.create({
    data: {
      storeId: demoStore.id,
      name: 'Black Friday Sale',
      description: 'Massive discounts on selected products',
      startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      isActive: true,
      items: {
        create: [
          {
            productId: products[0].id, // Headphones
            discountType: 'PERCENTAGE',
            discountValue: 20,
            stockLimit: 20,
            soldCount: 5,
          },
          {
            productId: products[1].id, // Smart Watch
            discountType: 'FIXED',
            discountValue: 50,
            stockLimit: 15,
            soldCount: 3,
          },
        ],
      },
    },
  });
  
  console.log(`✓ Created ${discounts.length} discounts and flash sale: ${flashSale.name}\n`);

  // ============================================================================
  // 13. REVIEWS
  // ============================================================================
  console.log('Creating product reviews...');
  
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        storeId: demoStore.id,
        productId: products[0].id, // Headphones
        customerId: customers[0].id,
        rating: 5,
        title: 'Excellent sound quality!',
        comment: 'These headphones are amazing! The noise cancellation is top-notch and the battery life is incredible. Highly recommend!',
        images: JSON.stringify([]),
        isApproved: true,
        approvedAt: new Date(),
        isVerifiedPurchase: true,
      },
    }),
    prisma.review.create({
      data: {
        storeId: demoStore.id,
        productId: products[0].id,
        customerId: customers[1].id,
        rating: 4,
        title: 'Great headphones',
        comment: 'Very comfortable and great sound. Only minor issue is the case could be more compact.',
        images: JSON.stringify([]),
        isApproved: true,
        approvedAt: new Date(),
        isVerifiedPurchase: true,
      },
    }),
    prisma.review.create({
      data: {
        storeId: demoStore.id,
        productId: products[1].id, // Smart Watch
        customerId: customers[0].id,
        rating: 5,
        title: 'Perfect fitness companion',
        comment: 'Tracks everything I need. GPS is accurate, heart rate monitoring works great. Battery lasts all week!',
        images: JSON.stringify([]),
        isApproved: true,
        approvedAt: new Date(),
        isVerifiedPurchase: true,
      },
    }),
    prisma.review.create({
      data: {
        storeId: demoStore.id,
        productId: products[5].id, // T-Shirt
        customerId: customers[1].id,
        rating: 5,
        title: 'Super soft and comfortable',
        comment: 'Best t-shirt I own. The organic cotton is so soft and breathable. Washes well too.',
        images: JSON.stringify([]),
        isApproved: true,
        approvedAt: new Date(),
        isVerifiedPurchase: true,
      },
    }),
  ]);
  
  console.log(`✓ Created ${reviews.length} product reviews\n`);

  // ============================================================================
  // 14. ADDRESSES
  // ============================================================================
  console.log('Creating customer addresses...');
  
  const addresses = await Promise.all([
    prisma.address.create({
      data: {
        customerId: customers[0].id,
        userId: customer.id,
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main Street',
        address2: 'Apt 4B',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102',
        country: 'US',
        phone: '+1-555-0200',
        isDefault: true,
      },
    }),
    prisma.address.create({
      data: {
        customerId: customers[1].id,
        firstName: 'Jane',
        lastName: 'Smith',
        address1: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US',
        phone: '+1-555-0201',
        isDefault: true,
      },
    }),
  ]);
  
  console.log(`✓ Created ${addresses.length} customer addresses\n`);

  // ============================================================================
  // 15. ORDERS
  // ============================================================================
  console.log('Creating sample orders...');
  
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        storeId: demoStore.id,
        customerId: customers[0].id,
        userId: customer.id,
        orderNumber: 'ORD-1001',
        status: 'DELIVERED',
        shippingAddressId: addresses[0].id,
        billingAddressId: addresses[0].id,
        subtotal: 229.98,
        taxAmount: 18.97,
        shippingAmount: 5.99,
        discountAmount: 23.00,
        totalAmount: 231.94,
        discountCode: 'WELCOME10',
        paymentMethod: 'CREDIT_CARD',
        paymentGateway: 'STRIPE',
        paymentStatus: 'PAID',
        shippingMethod: 'Standard Shipping',
        shippingStatus: 'DELIVERED',
        trackingNumber: 'TRACK123456789',
        trackingUrl: 'https://example.com/tracking/TRACK123456789',
        fulfilledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        ipAddress: '192.168.1.1',
        items: {
          create: [
            {
              productId: products[0].id,
              productName: products[0].name,
              sku: products[0].sku,
              image: products[0].thumbnailUrl,
              price: 199.99,
              quantity: 1,
              subtotal: 199.99,
              taxAmount: 16.50,
              discountAmount: 20.00,
              totalAmount: 196.49,
            },
            {
              productId: products[5].id,
              productName: products[5].name,
              sku: products[5].sku,
              image: products[5].thumbnailUrl,
              price: 29.99,
              quantity: 1,
              subtotal: 29.99,
              taxAmount: 2.47,
              discountAmount: 3.00,
              totalAmount: 29.46,
            },
          ],
        },
        payments: {
          create: {
            storeId: demoStore.id,
            amount: 231.94,
            currency: 'USD',
            status: 'PAID',
            method: 'CREDIT_CARD',
            gateway: 'STRIPE',
            gatewayPaymentId: 'pi_test_123456789',
            gatewayCustomerId: 'cus_test_123',
          },
        },
      },
    }),
    prisma.order.create({
      data: {
        storeId: demoStore.id,
        customerId: customers[1].id,
        orderNumber: 'ORD-1002',
        status: 'SHIPPED',
        shippingAddressId: addresses[1].id,
        billingAddressId: addresses[1].id,
        subtotal: 329.98,
        taxAmount: 27.22,
        shippingAmount: 14.99,
        discountAmount: 0,
        totalAmount: 372.19,
        paymentMethod: 'CREDIT_CARD',
        paymentGateway: 'STRIPE',
        paymentStatus: 'PAID',
        shippingMethod: 'Express Shipping',
        shippingStatus: 'IN_TRANSIT',
        trackingNumber: 'TRACK987654321',
        trackingUrl: 'https://example.com/tracking/TRACK987654321',
        ipAddress: '192.168.1.2',
        items: {
          create: [
            {
              productId: products[1].id,
              productName: products[1].name,
              sku: products[1].sku,
              image: products[1].thumbnailUrl,
              price: 299.99,
              quantity: 1,
              subtotal: 299.99,
              taxAmount: 24.75,
              totalAmount: 324.74,
            },
            {
              productId: products[5].id,
              productName: products[5].name,
              sku: products[5].sku,
              image: products[5].thumbnailUrl,
              price: 29.99,
              quantity: 1,
              subtotal: 29.99,
              taxAmount: 2.47,
              totalAmount: 32.46,
            },
          ],
        },
        payments: {
          create: {
            storeId: demoStore.id,
            amount: 372.19,
            currency: 'USD',
            status: 'PAID',
            method: 'CREDIT_CARD',
            gateway: 'STRIPE',
            gatewayPaymentId: 'pi_test_987654321',
          },
        },
      },
    }),
    prisma.order.create({
      data: {
        storeId: demoStore.id,
        customerId: customers[2].id,
        orderNumber: 'ORD-1003',
        status: 'PROCESSING',
        shippingAddressId: addresses[0].id,
        billingAddressId: addresses[0].id,
        subtotal: 79.99,
        taxAmount: 6.60,
        shippingAmount: 5.99,
        discountAmount: 0,
        totalAmount: 92.58,
        paymentMethod: 'CREDIT_CARD',
        paymentGateway: 'STRIPE',
        paymentStatus: 'PAID',
        shippingMethod: 'Standard Shipping',
        shippingStatus: 'PENDING',
        ipAddress: '192.168.1.3',
        items: {
          create: [
            {
              productId: products[6].id,
              productName: products[6].name,
              sku: products[6].sku,
              image: products[6].thumbnailUrl,
              price: 79.99,
              quantity: 1,
              subtotal: 79.99,
              taxAmount: 6.60,
              totalAmount: 86.59,
            },
          ],
        },
        payments: {
          create: {
            storeId: demoStore.id,
            amount: 92.58,
            currency: 'USD',
            status: 'PAID',
            method: 'CREDIT_CARD',
            gateway: 'STRIPE',
            gatewayPaymentId: 'pi_test_456789123',
          },
        },
      },
    }),
  ]);
  
  console.log(`✓ Created ${orders.length} sample orders\n`);

  // ============================================================================
  // 16. NEWSLETTER SUBSCRIPTIONS
  // ============================================================================
  console.log('Creating newsletter subscriptions...');
  
  const newsletters = await Promise.all([
    prisma.newsletter.create({
      data: {
        storeId: demoStore.id,
        email: customer.email,
        isSubscribed: true,
        source: 'checkout',
      },
    }),
    prisma.newsletter.create({
      data: {
        storeId: demoStore.id,
        email: 'jane.smith@example.com',
        isSubscribed: true,
        source: 'footer',
      },
    }),
    prisma.newsletter.create({
      data: {
        storeId: demoStore.id,
        email: 'marketing@example.com',
        isSubscribed: true,
        source: 'popup',
      },
    }),
  ]);
  
  console.log(`✓ Created ${newsletters.length} newsletter subscriptions\n`);

  console.log('✅ Seeding completed successfully!\n');
  
  console.log('📋 Summary:');
  console.log(`   - Stores: 2 (Demo Store, Test Store)`);
  console.log(`   - Users: 4 (1 Super Admin, 1 Store Admin, 1 Staff, 1 Customer)`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Brands: ${brands.length}`);
  console.log(`   - Products: ${products.length} (comprehensive catalog)`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Orders: ${orders.length}`);
  console.log(`   - Reviews: ${reviews.length}`);
  console.log(`   - Discounts: ${discounts.length}`);
  console.log(`   - Flash Sales: 1`);
  console.log(`   - Shipping Zones: 2`);
  console.log(`   - Tax Rates: ${taxRates.length}`);
  console.log(`   - Email Templates: ${emailTemplates.length}`);
  console.log(`   - Newsletter Subscriptions: ${newsletters.length}\n`);
  
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
