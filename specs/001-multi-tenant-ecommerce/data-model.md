# Data Model: StormCom Multi-tenant E-commerce

**Feature**: 001-multi-tenant-ecommerce  
**Last Updated**: 2025-10-23  
**Database**: PostgreSQL 15+ (production), SQLite (local dev)

## Overview

This document defines the complete database schema for StormCom using Prisma ORM. The architecture uses **Row-Level Security (RLS)** for multi-tenancy, where all tenant-scoped tables include a `storeId` foreign key to enforce data isolation.

## Core Principles

1. **Multi-tenant Isolation**: All tenant-scoped tables include `storeId` with composite unique constraints
2. **Soft Deletes**: User-facing data uses `deletedAt DateTime?` for soft deletion
3. **Audit Trail**: All state changes tracked in `AuditLog` table
4. **Standard Fields**: All tables include `id` (UUID), `createdAt`, `updatedAt`
5. **Type Safety**: Enums for status fields, roles, and categories

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Use "sqlite" for local dev
  url      = env("DATABASE_URL")
}

// ============================================================================
// ENUMS
// ============================================================================

enum UserRole {
  SUPER_ADMIN  // Cross-store access, system settings
  STORE_ADMIN  // Full store access, admin creation
  STAFF        // Limited store access based on permissions
  CUSTOMER     // Storefront access only
}

enum SubscriptionPlan {
  FREE        // 10 products, 100 orders/month
  BASIC       // 100 products, 1K orders/month
  PRO         // 1K products, 10K orders/month
  ENTERPRISE  // Unlimited products/orders
}

enum SubscriptionStatus {
  TRIAL       // 14-day free trial
  ACTIVE      // Paid and active
  PAST_DUE    // Payment failed, grace period
  CANCELED    // User canceled, ends at period_end
  PAUSED      // Temporarily suspended
}

enum OrderStatus {
  PENDING         // Order placed, awaiting payment
  PAYMENT_FAILED  // Payment attempt failed
  PAID            // Payment confirmed
  PROCESSING      // Being prepared for shipment
  SHIPPED         // In transit
  DELIVERED       // Successfully delivered
  CANCELED        // Canceled by customer/admin
  REFUNDED        // Payment refunded
}

enum PaymentStatus {
  PENDING    // Payment initiated
  AUTHORIZED // Payment authorized (not captured)
  PAID       // Payment captured
  FAILED     // Payment attempt failed
  REFUNDED   // Payment refunded (full or partial)
  DISPUTED   // Chargeback/dispute filed
}

enum PaymentMethod {
  CREDIT_CARD     // Stripe credit card
  DEBIT_CARD      // Stripe debit card
  MOBILE_BANKING  // SSLCommerz mobile banking (bKash, Rocket, Nagad)
  BANK_TRANSFER   // SSLCommerz bank transfer
  CASH_ON_DELIVERY // Pay on delivery
}

enum PaymentGateway {
  STRIPE      // International credit/debit cards
  SSLCOMMERZ  // Bangladesh payment methods
  MANUAL      // Cash on delivery, bank transfer
}

enum ShippingStatus {
  PENDING         // Awaiting shipment
  LABEL_CREATED   // Shipping label printed
  PICKED_UP       // Picked up by carrier
  IN_TRANSIT      // En route to customer
  OUT_FOR_DELIVERY // Out for final delivery
  DELIVERED       // Successfully delivered
  FAILED_DELIVERY // Delivery attempt failed
  RETURNED        // Returned to sender
}

enum DiscountType {
  PERCENTAGE  // e.g., 20% off
  FIXED       // e.g., $10 off
  FREE_SHIPPING
}

enum InventoryStatus {
  IN_STOCK
  LOW_STOCK      // Below reorder point
  OUT_OF_STOCK
  DISCONTINUED
}

enum MFAMethod {
  TOTP  // Time-based OTP (RFC 6238) - primary method
  SMS   // SMS OTP - optional fallback
}

enum ThemeMode {
  LIGHT
  DARK
  AUTO  // Respects user's system preference
}

// ============================================================================
// AUTHENTICATION & USERS
// ============================================================================

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcrypt hash, cost factor 12
  name      String
  phone     String?
  role      UserRole @default(CUSTOMER)

  // Multi-tenant association (null for SUPER_ADMIN)
  storeId   String?
  store     Store?   @relation(fields: [storeId], references: [id], onDelete: Cascade)

  // MFA
  mfaEnabled       Boolean   @default(false)
  mfaMethod        MFAMethod?
  totpSecret       String?   // Encrypted TOTP secret (AES-256)
  mfaBackupCodes   MFABackupCode[]

  // Security
  emailVerified    Boolean   @default(false)
  emailVerifiedAt  DateTime?
  lastLoginAt      DateTime?
  lastLoginIP      String?
  failedLoginAttempts Int    @default(0)
  lockedUntil      DateTime? // Account lockout after 5 failed attempts
  passwordChangedAt DateTime @default(now())
  passwordHistory  PasswordHistory[]

  // Soft delete
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  sessions      Session[]
  orders        Order[]
  auditLogs     AuditLog[]
  storesManaged Store[]    @relation("StoreAdmins")
  reviews       Review[]
  carts         Cart[]
  addresses     Address[]
  wishlistItems WishlistItem[]
  notifications Notification[]

  @@index([email])
  @@index([storeId])
  @@index([role])
  @@map("users")
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique // JWT token ID
  expiresAt DateTime // 12-hour absolute expiration
  lastActivityAt DateTime @default(now()) // For 7-day idle timeout
  ipAddress String?
  userAgent String?
  
  // Multi-tenant tracking
  storeId   String?
  store     Store?   @relation(fields: [storeId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("sessions")
}

model MFABackupCode {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  hashedCode String   // bcrypt hash, cost factor 12
  isUsed     Boolean  @default(false)
  usedAt     DateTime?
  expiresAt  DateTime // 90 days from generation

  createdAt DateTime @default(now())

  @@index([userId])
  @@map("mfa_backup_codes")
}

model PasswordHistory {
  id             String   @id @default(uuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  hashedPassword String   // bcrypt hash of previous password
  createdAt      DateTime @default(now())

  @@index([userId, createdAt])
  @@map("password_history")
}

// ============================================================================
// STORES (Multi-tenant Root Entity)
// ============================================================================

model Store {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique // URL-safe identifier (e.g., "demo-store")
  description String?
  logo        String?  // Vercel Blob URL
  email       String
  phone       String?
  website     String?

  // Subscription
  subscriptionPlan   SubscriptionPlan   @default(FREE)
  subscriptionStatus SubscriptionStatus @default(TRIAL)
  trialEndsAt        DateTime?          // 14 days from creation
  subscriptionEndsAt DateTime?

  // Limits (enforced by plan)
  productLimit Int @default(10)   // FREE: 10, BASIC: 100, PRO: 1K, ENTERPRISE: unlimited
  orderLimit   Int @default(100)  // Orders per month

  // Address
  address    String?
  city       String?
  state      String?
  postalCode String?
  country    String @default("US")

  // Settings
  currency   String @default("USD")
  timezone   String @default("UTC")
  locale     String @default("en")

  // Soft delete
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  users           User[]
  admins          User[]    @relation("StoreAdmins")
  products        Product[]
  orders          Order[]
  customers       Customer[]
  categories      Category[]
  brands          Brand[]
  discounts       Discount[]
  flashSales      FlashSale[]
  shippingZones   ShippingZone[]
  taxRates        TaxRate[]
  pages           Page[]
  menus           Menu[]
  emailTemplates  EmailTemplate[]
  themes          Theme[]
  sessions        Session[]
  auditLogs       AuditLog[]
  newsletters     Newsletter[]
  reviews         Review[]
  inventoryLogs   InventoryLog[]
  payments        Payment[]
  externalConfigs ExternalPlatformConfig[]
  webhooks        Webhook[]

  @@index([slug])
  @@index([subscriptionPlan])
  @@index([subscriptionStatus])
  @@map("stores")
}

// ============================================================================
// PRODUCTS & CATALOG
// ============================================================================

model Product {
  id          String   @id @default(uuid())
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  // Basic Info
  name        String
  slug        String   // URL-safe (e.g., "blue-t-shirt")
  description String?  @db.Text
  shortDescription String?

  // Pricing
  price       Decimal  @db.Decimal(10, 2) // Regular price
  compareAtPrice Decimal? @db.Decimal(10, 2) // Original price (for sale display)
  costPrice   Decimal? @db.Decimal(10, 2) // Cost from supplier (for profit calculation)

  // Inventory
  sku         String   // Stock Keeping Unit
  barcode     String?
  trackInventory Boolean @default(true)
  inventoryQty   Int     @default(0)
  lowStockThreshold Int  @default(5)
  inventoryStatus InventoryStatus @default(IN_STOCK)

  // Physical attributes
  weight      Decimal? @db.Decimal(8, 2) // kg
  length      Decimal? @db.Decimal(8, 2) // cm
  width       Decimal? @db.Decimal(8, 2) // cm
  height      Decimal? @db.Decimal(8, 2) // cm

  // Organization
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  brandId     String?
  brand       Brand?    @relation(fields: [brandId], references: [id], onDelete: SetNull)

  // Media
  images      String[]  // Array of Vercel Blob URLs
  thumbnailUrl String?

  // SEO
  metaTitle       String?
  metaDescription String?
  metaKeywords    String[]

  // Visibility
  isPublished Boolean @default(false)
  publishedAt DateTime?
  isFeatured  Boolean @default(false)

  // Soft delete
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  variants      ProductVariant[]
  orderItems    OrderItem[]
  reviews       Review[]
  attributes    ProductAttributeValue[]
  cartItems     CartItem[]
  wishlistItems WishlistItem[]
  inventoryLogs InventoryLog[]
  flashSaleItems FlashSaleItem[]

  @@unique([storeId, sku])
  @@unique([storeId, slug])
  @@index([storeId, categoryId])
  @@index([storeId, brandId])
  @@index([storeId, isPublished])
  @@index([storeId, isFeatured])
  @@map("products")
}

model ProductVariant {
  id        String   @id @default(uuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  // Variant details
  name      String   // e.g., "Small / Red"
  sku       String
  barcode   String?
  
  // Pricing (overrides product price)
  price     Decimal? @db.Decimal(10, 2)
  compareAtPrice Decimal? @db.Decimal(10, 2)

  // Inventory
  inventoryQty Int @default(0)
  lowStockThreshold Int @default(5)

  // Physical attributes (overrides product)
  weight    Decimal? @db.Decimal(8, 2)
  
  // Media
  image     String?  // Vercel Blob URL
  
  // Options (e.g., { "Size": "Small", "Color": "Red" })
  options   Json

  isDefault Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  orderItems OrderItem[]

  @@index([productId])
  @@index([sku])
  @@map("product_variants")
}

model Category {
  id          String   @id @default(uuid())
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  name        String
  slug        String   // URL-safe
  description String?
  image       String?  // Vercel Blob URL
  
  // Hierarchy
  parentId    String?
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children    Category[] @relation("CategoryHierarchy")

  // SEO
  metaTitle       String?
  metaDescription String?

  isPublished Boolean @default(true)
  sortOrder   Int     @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  products Product[]

  @@unique([storeId, slug])
  @@index([storeId, parentId])
  @@index([storeId, isPublished])
  @@map("categories")
}

model Brand {
  id          String   @id @default(uuid())
  storeId     String
  store       Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  name        String
  slug        String   // URL-safe
  description String?
  logo        String?  // Vercel Blob URL
  website     String?

  // SEO
  metaTitle       String?
  metaDescription String?

  isPublished Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  products Product[]

  @@unique([storeId, slug])
  @@index([storeId, isPublished])
  @@map("brands")
}

model ProductAttribute {
  id        String   @id @default(uuid())
  name      String   // e.g., "Color", "Size"
  values    String[] // e.g., ["Red", "Blue", "Green"]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  productAttributeValues ProductAttributeValue[]

  @@map("product_attributes")
}

model ProductAttributeValue {
  id          String   @id @default(uuid())
  productId   String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  attributeId String
  attribute   ProductAttribute @relation(fields: [attributeId], references: [id], onDelete: Cascade)
  value       String   // e.g., "Red"

  createdAt DateTime @default(now())

  @@index([productId])
  @@index([attributeId])
  @@map("product_attribute_values")
}

// ============================================================================
// CUSTOMERS
// ============================================================================

model Customer {
  id        String   @id @default(uuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  // User linkage (optional - guests have no userId)
  userId    String?  @unique
  
  // Basic info
  email     String
  firstName String
  lastName  String
  phone     String?

  // Marketing
  acceptsMarketing Boolean @default(false)
  marketingOptInAt DateTime?

  // Stats
  totalOrders    Int     @default(0)
  totalSpent     Decimal @default(0) @db.Decimal(10, 2)
  averageOrderValue Decimal @default(0) @db.Decimal(10, 2)
  lastOrderAt    DateTime?

  // Soft delete
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  orders    Order[]
  addresses Address[]
  reviews   Review[]

  @@unique([storeId, email])
  @@index([storeId, userId])
  @@index([storeId, email])
  @@map("customers")
}

model Address {
  id         String   @id @default(uuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  customerId String?
  customer   Customer? @relation(fields: [customerId], references: [id], onDelete: Cascade)

  // Address details
  firstName  String
  lastName   String
  company    String?
  address1   String
  address2   String?
  city       String
  state      String
  postalCode String
  country    String @default("US")
  phone      String?

  isDefault  Boolean @default(false)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  shippingOrders Order[] @relation("ShippingAddress")
  billingOrders  Order[] @relation("BillingAddress")

  @@index([userId])
  @@index([customerId])
  @@map("addresses")
}

// ============================================================================
// ORDERS & CHECKOUT
// ============================================================================

model Order {
  id        String      @id @default(uuid())
  storeId   String
  store     Store       @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  // Customer
  customerId String?
  customer   Customer?  @relation(fields: [customerId], references: [id], onDelete: SetNull)
  userId     String?
  user       User?      @relation(fields: [userId], references: [id], onDelete: SetNull)

  // Order details
  orderNumber String     // Human-readable (e.g., "ORD-1001")
  status      OrderStatus @default(PENDING)

  // Addresses
  shippingAddressId String?
  shippingAddress   Address? @relation("ShippingAddress", fields: [shippingAddressId], references: [id], onDelete: SetNull)
  billingAddressId  String?
  billingAddress    Address? @relation("BillingAddress", fields: [billingAddressId], references: [id], onDelete: SetNull)

  // Pricing
  subtotal        Decimal @db.Decimal(10, 2) // Sum of items before tax/shipping/discounts
  taxAmount       Decimal @default(0) @db.Decimal(10, 2)
  shippingAmount  Decimal @default(0) @db.Decimal(10, 2)
  discountAmount  Decimal @default(0) @db.Decimal(10, 2)
  totalAmount     Decimal @db.Decimal(10, 2) // subtotal + tax + shipping - discount

  // Discount
  discountCode String?

  // Payment
  paymentMethod  PaymentMethod?
  paymentGateway PaymentGateway?
  paymentStatus  PaymentStatus @default(PENDING)

  // Shipping
  shippingMethod String?
  shippingStatus ShippingStatus @default(PENDING)
  trackingNumber String?
  trackingUrl    String?

  // Fulfillment
  fulfilledAt DateTime?
  canceledAt  DateTime?
  cancelReason String?

  // Customer notes
  customerNote String?
  adminNote    String?

  // IP tracking (fraud prevention)
  ipAddress   String?
  
  // Soft delete
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  items    OrderItem[]
  payments Payment[]

  @@unique([storeId, orderNumber])
  @@index([storeId, customerId])
  @@index([storeId, userId])
  @@index([storeId, status])
  @@index([storeId, createdAt])
  @@map("orders")
}

model OrderItem {
  id        String   @id @default(uuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  
  // Product
  productId String?
  product   Product? @relation(fields: [productId], references: [id], onDelete: SetNull)
  variantId String?
  variant   ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)

  // Snapshot (preserve data if product deleted)
  productName String
  variantName String?
  sku         String
  image       String?

  // Pricing
  price       Decimal @db.Decimal(10, 2) // Unit price at time of order
  quantity    Int
  subtotal    Decimal @db.Decimal(10, 2) // price * quantity
  taxAmount   Decimal @default(0) @db.Decimal(10, 2)
  discountAmount Decimal @default(0) @db.Decimal(10, 2)
  totalAmount Decimal @db.Decimal(10, 2)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}

model Payment {
  id        String        @id @default(uuid())
  storeId   String
  store     Store         @relation(fields: [storeId], references: [id], onDelete: Cascade)
  orderId   String
  order     Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)

  // Payment details
  amount    Decimal       @db.Decimal(10, 2)
  currency  String        @default("USD")
  status    PaymentStatus @default(PENDING)
  method    PaymentMethod
  gateway   PaymentGateway

  // Gateway IDs
  gatewayPaymentId   String? // Stripe payment_intent_id or SSLCommerz tran_id
  gatewayCustomerId  String? // Stripe customer_id
  gatewayChargeId    String? // Stripe charge_id

  // Metadata
  metadata  Json?         // Gateway-specific data

  // Refund
  refundedAmount Decimal @default(0) @db.Decimal(10, 2)
  refundedAt     DateTime?

  // Failure
  failureCode    String?
  failureMessage String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([storeId, orderId])
  @@index([storeId, status])
  @@index([gatewayPaymentId])
  @@map("payments")
}

// ============================================================================
// CART & WISHLIST
// ============================================================================

model Cart {
  id        String   @id @default(uuid())
  userId    String?  @unique
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionId String?  @unique // For guest carts

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  expiresAt DateTime // 30 days for guests, never for logged-in users

  items CartItem[]

  @@index([sessionId])
  @@map("carts")
}

model CartItem {
  id        String   @id @default(uuid())
  cartId    String
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  variantId String?
  variant   ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)

  quantity  Int      @default(1)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([cartId])
  @@index([productId])
  @@map("cart_items")
}

model WishlistItem {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([userId, productId])
  @@index([userId])
  @@map("wishlist_items")
}

// ============================================================================
// REVIEWS & RATINGS
// ============================================================================

model Review {
  id        String   @id @default(uuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  customerId String?
  customer  Customer? @relation(fields: [customerId], references: [id], onDelete: SetNull)

  // Review content
  rating    Int      // 1-5 stars
  title     String?
  comment   String   @db.Text
  
  // Media
  images    String[] // Vercel Blob URLs

  // Moderation
  isApproved Boolean @default(false)
  approvedAt DateTime?
  
  // Verification
  isVerifiedPurchase Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@index([storeId, productId])
  @@index([storeId, isApproved])
  @@map("reviews")
}

// ============================================================================
// INVENTORY MANAGEMENT
// ============================================================================

model InventoryLog {
  id        String   @id @default(uuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  // Change details
  previousQty Int
  newQty      Int
  changeQty   Int      // Positive = addition, Negative = subtraction
  reason      String   // e.g., "Sale", "Restock", "Adjustment", "Damaged"
  note        String?

  // User tracking
  userId    String?
  
  createdAt DateTime @default(now())

  @@index([storeId, productId])
  @@index([storeId, createdAt])
  @@map("inventory_logs")
}

// ============================================================================
// DISCOUNTS & PROMOTIONS
// ============================================================================

model Discount {
  id        String       @id @default(uuid())
  storeId   String
  store     Store        @relation(fields: [storeId], references: [id], onDelete: Cascade)

  code      String       // Coupon code (e.g., "SUMMER20")
  type      DiscountType
  value     Decimal      @db.Decimal(10, 2) // Percentage or fixed amount

  // Conditions
  minimumPurchase Decimal? @db.Decimal(10, 2)
  usageLimit      Int?     // Total usage limit (null = unlimited)
  usageCount      Int      @default(0)
  perCustomerLimit Int?    // Per-customer usage limit

  // Validity
  startsAt  DateTime?
  endsAt    DateTime?
  isActive  Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@unique([storeId, code])
  @@index([storeId, isActive])
  @@index([storeId, endsAt])
  @@map("discounts")
}

model FlashSale {
  id        String   @id @default(uuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  name      String
  description String?
  
  // Validity
  startsAt  DateTime
  endsAt    DateTime
  isActive  Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  items FlashSaleItem[]

  @@index([storeId, isActive])
  @@index([storeId, startsAt, endsAt])
  @@map("flash_sales")
}

model FlashSaleItem {
  id          String     @id @default(uuid())
  flashSaleId String
  flashSale   FlashSale  @relation(fields: [flashSaleId], references: [id], onDelete: Cascade)
  productId   String
  product     Product    @relation(fields: [productId], references: [id], onDelete: Cascade)

  discountType  DiscountType
  discountValue Decimal @db.Decimal(10, 2)
  
  stockLimit    Int?    // Limited stock for flash sale
  soldCount     Int     @default(0)

  @@index([flashSaleId])
  @@index([productId])
  @@map("flash_sale_items")
}

// ============================================================================
// SHIPPING & TAX
// ============================================================================

model ShippingZone {
  id        String   @id @default(uuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  name      String
  countries String[] // ISO country codes (e.g., ["US", "CA"])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  rates ShippingRate[]

  @@index([storeId])
  @@map("shipping_zones")
}

model ShippingRate {
  id             String       @id @default(uuid())
  shippingZoneId String
  shippingZone   ShippingZone @relation(fields: [shippingZoneId], references: [id], onDelete: Cascade)

  name           String       // e.g., "Standard Shipping", "Express"
  price          Decimal      @db.Decimal(10, 2)
  
  // Conditions
  minOrderValue  Decimal?     @db.Decimal(10, 2)
  maxOrderValue  Decimal?     @db.Decimal(10, 2)
  minWeight      Decimal?     @db.Decimal(8, 2)
  maxWeight      Decimal?     @db.Decimal(8, 2)
  
  // Delivery estimate
  estimatedDaysMin Int?
  estimatedDaysMax Int?

  isActive Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([shippingZoneId])
  @@map("shipping_rates")
}

model TaxRate {
  id        String   @id @default(uuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  name      String   // e.g., "CA Sales Tax"
  rate      Decimal  @db.Decimal(5, 4) // e.g., 0.0825 for 8.25%
  
  // Geographic scope
  country   String
  state     String?
  city      String?
  postalCode String?

  isActive  Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([storeId, country, state])
  @@map("tax_rates")
}

// ============================================================================
// CONTENT MANAGEMENT
// ============================================================================

model Page {
  id        String   @id @default(uuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  title     String
  slug      String   // URL-safe (e.g., "about-us")
  content   String   @db.Text // HTML content
  
  // SEO
  metaTitle       String?
  metaDescription String?
  metaKeywords    String[]

  isPublished Boolean @default(false)
  publishedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@unique([storeId, slug])
  @@index([storeId, isPublished])
  @@map("pages")
}

model Menu {
  id        String   @id @default(uuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  name      String   // e.g., "Main Menu", "Footer Menu"
  handle    String   // Unique identifier (e.g., "main", "footer")

  items     MenuItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([storeId, handle])
  @@index([storeId])
  @@map("menus")
}

model MenuItem {
  id        String   @id @default(uuid())
  menuId    String
  menu      Menu     @relation(fields: [menuId], references: [id], onDelete: Cascade)

  label     String
  url       String
  target    String   @default("_self") // "_self" or "_blank"
  
  // Hierarchy
  parentId  String?
  parent    MenuItem?  @relation("MenuItemHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children  MenuItem[] @relation("MenuItemHierarchy")

  sortOrder Int      @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([menuId, parentId])
  @@map("menu_items")
}

// ============================================================================
// EMAIL & NOTIFICATIONS
// ============================================================================

model EmailTemplate {
  id        String   @id @default(uuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  name      String   // e.g., "Order Confirmation"
  handle    String   // Unique identifier (e.g., "order_confirmation")
  subject   String
  htmlBody  String   @db.Text
  textBody  String?  @db.Text

  // Variables (e.g., ["{{customerName}}", "{{orderNumber}}"])
  variables String[]

  isActive  Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([storeId, handle])
  @@index([storeId, isActive])
  @@map("email_templates")
}

model Newsletter {
  id        String   @id @default(uuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  email     String
  
  // Subscription status
  isSubscribed Boolean @default(true)
  subscribedAt DateTime @default(now())
  unsubscribedAt DateTime?

  // Source tracking
  source    String?  // e.g., "checkout", "footer", "popup"

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([storeId, email])
  @@index([storeId, isSubscribed])
  @@map("newsletters")
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  title     String
  message   String
  type      String   // e.g., "order_update", "low_stock", "system"
  
  // Link
  linkUrl   String?
  linkText  String?

  isRead    Boolean @default(false)
  readAt    DateTime?

  createdAt DateTime @default(now())

  @@index([userId, isRead])
  @@index([userId, createdAt])
  @@map("notifications")
}

// ============================================================================
// THEME CUSTOMIZATION
// ============================================================================

model Theme {
  id        String    @id @default(uuid())
  storeId   String    @unique
  store     Store     @relation(fields: [storeId], references: [id], onDelete: Cascade)

  // Color scheme
  primaryColor    String @default("#3B82F6")   // Tailwind blue-500
  secondaryColor  String @default("#10B981")   // Tailwind green-500
  accentColor     String @default("#F59E0B")   // Tailwind amber-500
  backgroundColor String @default("#FFFFFF")
  textColor       String @default("#1F2937")   // Tailwind gray-800
  
  // Typography
  fontFamily      String @default("Inter")
  headingFont     String @default("Inter")
  fontSize        String @default("16px")

  // Layout
  layoutWidth     String @default("1280px")
  borderRadius    String @default("0.5rem")
  
  // Mode
  mode            ThemeMode @default(LIGHT)

  // Custom CSS
  customCss       String? @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("themes")
}

// ============================================================================
// INTEGRATIONS & WEBHOOKS
// ============================================================================

model ExternalPlatformConfig {
  id        String   @id @default(uuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  platform  String   // "woocommerce", "shopify"
  apiUrl    String
  apiKey    String   // Encrypted
  apiSecret String?  // Encrypted

  // Sync settings
  syncProducts  Boolean @default(true)
  syncOrders    Boolean @default(true)
  syncCustomers Boolean @default(true)
  syncInterval  Int     @default(60) // minutes

  lastSyncAt DateTime?
  isActive   Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  syncLogs SyncLog[]

  @@index([storeId, platform])
  @@map("external_platform_configs")
}

model SyncLog {
  id        String   @id @default(uuid())
  configId  String
  config    ExternalPlatformConfig @relation(fields: [configId], references: [id], onDelete: Cascade)

  entityType String  // "product", "order", "customer"
  action     String  // "import", "export", "update"
  status     String  // "success", "failed", "partial"
  
  recordsProcessed Int @default(0)
  recordsFailed    Int @default(0)
  
  errorMessage String? @db.Text
  metadata     Json?

  createdAt DateTime @default(now())

  @@index([configId, createdAt])
  @@map("sync_logs")
}

model Webhook {
  id        String   @id @default(uuid())
  storeId   String
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)

  url       String
  events    String[] // e.g., ["order.created", "product.updated"]
  secret    String   // For HMAC signature verification

  isActive  Boolean @default(true)

  // Delivery tracking
  lastDeliveryAt     DateTime?
  lastDeliveryStatus String? // "success", "failed"

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([storeId, isActive])
  @@map("webhooks")
}

// ============================================================================
// AUDIT & LOGGING
// ============================================================================

model AuditLog {
  id        String   @id @default(uuid())
  storeId   String?
  store     Store?   @relation(fields: [storeId], references: [id], onDelete: Cascade)

  userId    String?
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  action    String   // e.g., "CREATE", "UPDATE", "DELETE"
  entityType String  // e.g., "Product", "Order", "User"
  entityId  String
  
  // Change tracking
  changes   Json?    // { "field": { "old": "value", "new": "value" } }
  
  // Request metadata
  ipAddress String?
  userAgent String?

  createdAt DateTime @default(now())

  @@index([storeId, createdAt])
  @@index([userId, createdAt])
  @@index([entityType, entityId])
  @@map("audit_logs")
}
```

## Key Design Decisions

### 1. Multi-tenancy Enforcement
- All tenant-scoped tables include `storeId` foreign key with `onDelete: Cascade`
- Composite unique constraints prevent data collision (e.g., `@@unique([storeId, sku])`)
- Prisma middleware will auto-inject `WHERE storeId = ?` filter on all queries
- SUPER_ADMIN users have `storeId = null` for cross-store access

### 2. Soft Delete Pattern
- User-facing tables include `deletedAt DateTime?` for soft deletion
- Queries filter `WHERE deletedAt IS NULL` by default
- Hard deletes only for system tables (Session, AuditLog, PasswordHistory)
- Permanent data retention for compliance (orders, invoices, audit logs)

### 3. Audit Trail
- All state changes tracked in `AuditLog` table with JSON diff
- Includes user ID, IP address, user agent for forensics
- 2-year retention policy for GDPR compliance
- Indexed by `storeId`, `userId`, `entityType`, and `createdAt` for fast queries

### 4. Security
- Passwords: bcrypt hash with cost factor 12 (stored in `User.password`)
- MFA secrets: AES-256 encrypted TOTP secrets (stored in `User.totpSecret`)
- Backup codes: bcrypt hashed with cost factor 12 (stored in `MFABackupCode.hashedCode`)
- Sessions: JWT token ID stored in `Session.token` with Redis cache
- API keys: AES-256 encrypted (stored in `ExternalPlatformConfig.apiKey`)

### 5. Performance Optimizations
- Indexes on all foreign keys for join performance
- Composite indexes on common query patterns (e.g., `@@index([storeId, createdAt])`)
- Decimal type for monetary values (avoids floating-point precision errors)
- Array types for simple lists (images, tags, events) - denormalized for read speed
- JSON type for flexible metadata (theme settings, webhook metadata)

### 6. Data Integrity
- Check constraints for positive values (enforced in application layer)
- Unique constraints for business keys (email, slug, sku)
- Foreign key cascades to prevent orphaned records
- Default values for all non-nullable fields
- Timestamps on all tables for audit trail

## Migration Strategy

### Development (SQLite)
```bash
# Sync schema to database (no migration files)
npx prisma db push

# Seed database with initial data
npx prisma db seed
```

### Production (PostgreSQL)
```bash
# Create migration
npx prisma migrate dev --name init

# Apply migration to staging
npx prisma migrate deploy

# Verify migration success
npx prisma migrate status

# Apply to production (with backup)
npx prisma migrate deploy
```

## Seeding Strategy

Initial seed data includes:
1. **Users**: 1 Super Admin, 2 Store Admins, 3 Staff, 5 Customers
2. **Stores**: 2 demo stores (Demo Store, Test Store) with FREE plan
3. **Products**: 10 sample products per store with variants
4. **Categories**: 5 categories per store (Electronics, Clothing, Home, Books, Sports)
5. **Brands**: 3 brands per store
6. **Orders**: 5 sample orders in various states
7. **Shipping Zones**: US, Canada, International
8. **Tax Rates**: CA (8.25%), NY (8.875%)
9. **Subscription Plans**: Free, Basic, Pro, Enterprise
10. **Email Templates**: Order Confirmation, Shipping Notification, Password Reset

## Data Retention Policy

- **Orders/Invoices**: 3 years (tax compliance)
- **Audit Logs**: 2 years (GDPR compliance)
- **Sessions**: 7-day idle timeout, 12-hour absolute expiration
- **Carts**: 30 days for guests, never expire for logged-in users
- **Soft Deleted Records**: 90 days before hard delete (except orders - never hard deleted)
- **Backups**: Daily for 90 days, monthly for 1 year
- **Error Reports**: 2 years

## Constraints & Limits

### Per Store (Enforced by Subscription Plan)
- **FREE**: 10 products, 100 orders/month
- **BASIC**: 100 products, 1K orders/month
- **PRO**: 1K products, 10K orders/month
- **ENTERPRISE**: Unlimited

### Database Limits
- **Max product images**: 10 per product
- **Max product variants**: 100 per product
- **Max cart items**: 50 per cart
- **Max wishlist items**: 100 per user
- **Max addresses**: 10 per customer
- **Max backup codes**: 10 per user
- **Max password history**: 5 per user

### Field Limits
- **Product name**: 200 characters
- **Product description**: 10,000 characters
- **SKU**: 50 characters
- **Email**: 255 characters
- **Phone**: 20 characters
- **Address lines**: 100 characters each
- **Custom CSS**: 50,000 characters

## Next Steps

1. **Generate Prisma Client**: `npx prisma generate`
2. **Create SQLite Database**: `npx prisma db push`
3. **Seed Database**: `npx prisma db seed`
4. **Open Prisma Studio**: `npx prisma studio` (http://localhost:5555)
5. **Verify Schema**: Check all tables and relationships in Studio

## References

- **Feature Spec**: `specs/001-multi-tenant-ecommerce/spec.md`
- **Technical Research**: `specs/001-multi-tenant-ecommerce/research.md`
- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/15/
- **SQLite Docs**: https://www.sqlite.org/docs.html
