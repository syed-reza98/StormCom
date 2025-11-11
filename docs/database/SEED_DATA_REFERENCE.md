# StormCom Seed Data Reference

**Last Updated**: January 30, 2025  
**Database**: SQLite (`prisma/dev.db`)  
**Seed Script**: `prisma/seed.ts`

## Quick Start

```bash
# Reset and seed database
npm run db:push
npm run db:seed
```

---

## 🔐 Test Credentials

### Super Admin
- **Email**: `admin@stormcom.io`
- **Password**: `Admin@123`
- **Role**: `SUPER_ADMIN`
- **Access**: Full platform access, manage all stores

### Store Admin (Demo Store)
- **Email**: `admin@demo-store.com`
- **Password**: `Demo@123`
- **Role**: `STORE_ADMIN`
- **Store**: Demo Store
- **Access**: Full store management

### Staff (Demo Store)
- **Email**: `staff@demo-store.com`
- **Password**: `Demo@123`
- **Role**: `STAFF`
- **Store**: Demo Store
- **Access**: Limited store operations

### Customer
- **Email**: `customer@example.com`
- **Password**: `Customer@123`
- **Role**: `CUSTOMER`
- **Access**: Storefront shopping, order history

---

## 🏪 Stores

### Demo Store
- **Name**: Demo Store
- **Slug**: `demo-store`
- **Email**: demo@stormcom.io
- **Phone**: +1-555-0100
- **Website**: https://demo.stormcom.io
- **Plan**: PRO
- **Status**: ACTIVE
- **Location**: San Francisco, CA 94102, US
- **Currency**: USD
- **Timezone**: America/Los_Angeles
- **Limits**: 1,000 products, 10,000 orders

### Test Store
- **Name**: Test Store
- **Slug**: `test-store`
- **Email**: test@stormcom.io
- **Phone**: +1-555-0101
- **Plan**: FREE
- **Status**: TRIAL
- **Currency**: USD
- **Timezone**: UTC
- **Limits**: 10 products, 100 orders

---

## 📦 Products (15 Total)

### Electronics (5 products)

#### 1. Wireless Bluetooth Headphones
- **SKU**: `WBH-001`
- **Price**: $199.99 (Compare at: $249.99)
- **Cost**: $120.00
- **Stock**: 50 units (Low threshold: 10)
- **Weight**: 0.25 kg
- **Features**: Noise cancellation, 30h battery
- **Brand**: TechPro
- **Status**: Published, Featured

#### 2. Smart Watch Pro
- **SKU**: `SWP-001`
- **Price**: $299.99 (Compare at: $399.99)
- **Cost**: $180.00
- **Stock**: 30 units (Low threshold: 5)
- **Weight**: 0.05 kg
- **Features**: GPS, heart rate, sleep tracking
- **Brand**: TechPro
- **Status**: Published, Featured

#### 3. USB-C Fast Charger 65W
- **SKU**: `USBC-65W-001`
- **Price**: $49.99
- **Cost**: $22.00
- **Stock**: 80 units (Low threshold: 15)
- **Weight**: 0.15 kg
- **Features**: GaN technology, universal compatibility
- **Brand**: TechPro
- **Status**: Published

#### 4. 4K Webcam with Microphone
- **SKU**: `WC-4K-001`
- **Price**: $129.99 (Compare at: $179.99)
- **Cost**: $65.00
- **Stock**: 25 units (Low threshold: 5)
- **Features**: 4K, auto-focus, 90° wide angle
- **Brand**: TechPro
- **Status**: Published

#### 5. Mechanical Keyboard RGB
- **SKU**: `KB-MECH-RGB-001`
- **Price**: $159.99
- **Cost**: $80.00
- **Stock**: 40 units (Low threshold: 10)
- **Features**: Cherry MX switches, RGB, aluminum frame
- **Brand**: TechPro
- **Status**: Published, Featured

### Clothing (4 products)

#### 6. Premium Cotton T-Shirt
- **SKU**: `PCT-001`
- **Price**: $29.99
- **Cost**: $12.00
- **Stock**: 100 units (Low threshold: 20)
- **Weight**: 0.2 kg
- **Features**: 100% organic cotton, pre-shrunk
- **Brand**: StyleCo
- **Status**: Published

#### 7. Classic Denim Jeans
- **SKU**: `CDJ-001`
- **Price**: $79.99 (Compare at: $99.99)
- **Cost**: $35.00
- **Stock**: 75 units (Low threshold: 15)
- **Weight**: 0.6 kg
- **Features**: Stretch denim, reinforced stitching
- **Brand**: StyleCo
- **Status**: Published

#### 8. Hooded Sweatshirt
- **SKU**: `HS-001`
- **Price**: $59.99
- **Cost**: $28.00
- **Stock**: 60 units (Low threshold: 12)
- **Features**: Fleece-lined, kangaroo pocket
- **Brand**: StyleCo
- **Status**: Published

#### 9. Running Shorts
- **SKU**: `RS-001`
- **Price**: $34.99
- **Cost**: $15.00
- **Stock**: 90 units (Low threshold: 18)
- **Features**: Moisture-wicking, zip pocket
- **Brand**: StyleCo
- **Status**: Published

### Home & Garden (3 products)

#### 10. Ceramic Coffee Mug Set
- **SKU**: `CCM-001`
- **Price**: $39.99
- **Cost**: $18.00
- **Stock**: 45 units (Low threshold: 10)
- **Weight**: 1.2 kg
- **Features**: 4-piece set, dishwasher safe, 12oz each
- **Brand**: HomeEssentials
- **Status**: Published

#### 11. LED Desk Lamp
- **SKU**: `DL-LED-001`
- **Price**: $69.99
- **Cost**: $32.00
- **Stock**: 35 units (Low threshold: 8)
- **Features**: 5 brightness levels, USB charging port
- **Brand**: HomeEssentials
- **Status**: Published

#### 12. Indoor Plant Pot Set
- **SKU**: `PP-CER-001`
- **Price**: $44.99
- **Cost**: $20.00
- **Stock**: 52 units (Low threshold: 10)
- **Features**: 3-piece ceramic set, drainage holes
- **Brand**: HomeEssentials
- **Status**: Published

### Books (1 product)

#### 13. Web Development Guide 2025
- **SKU**: `BK-WD-2025`
- **Price**: $49.99
- **Cost**: $18.00
- **Stock**: 100 units (Low threshold: 20)
- **Features**: 450 pages, React/Next.js/TypeScript
- **Status**: Published, Featured

### Sports & Outdoors (2 products)

#### 14. Yoga Mat Premium
- **SKU**: `YM-PREM-001`
- **Price**: $54.99
- **Cost**: $25.00
- **Stock**: 70 units (Low threshold: 15)
- **Features**: 6mm thick, eco-friendly TPE, alignment markers
- **Status**: Published

#### 15. Resistance Bands Set
- **SKU**: `RB-SET-001`
- **Price**: $29.99
- **Cost**: $12.00
- **Stock**: 65 units (Low threshold: 12)
- **Features**: 5-piece set, door anchor, carrying bag
- **Status**: Published

---

## 👥 Customers (3 total)

### Customer 1: John Doe
- **Email**: customer@example.com
- **Phone**: +1-555-0200
- **User ID**: Linked to customer user account
- **Address**: 123 Main Street, Apt 4B, San Francisco, CA 94102
- **Stats**:
  - Total Orders: 5
  - Total Spent: $1,234.56
  - Average Order Value: $246.91
  - Last Order: 7 days ago
- **Marketing**: Opted in

### Customer 2: Jane Smith
- **Email**: jane.smith@example.com
- **Phone**: +1-555-0201
- **Address**: 456 Oak Avenue, Los Angeles, CA 90001
- **Stats**:
  - Total Orders: 3
  - Total Spent: $567.89
  - Average Order Value: $189.30
  - Last Order: 14 days ago
- **Marketing**: Opted in

### Customer 3: Bob Wilson
- **Email**: bob.wilson@example.com
- **Phone**: +1-555-0202
- **Stats**:
  - Total Orders: 1
  - Total Spent: $199.99
  - Average Order Value: $199.99
  - Last Order: 30 days ago
- **Marketing**: Not opted in

---

## 🛒 Sample Orders (3 total)

### Order #ORD-1001 (DELIVERED)
- **Customer**: John Doe (customer@example.com)
- **Status**: DELIVERED
- **Payment**: PAID via Stripe Credit Card
- **Items**:
  1. Wireless Bluetooth Headphones × 1 = $199.99
  2. Premium Cotton T-Shirt × 1 = $29.99
- **Subtotal**: $229.98
- **Tax**: $18.97
- **Shipping**: $5.99 (Standard Shipping)
- **Discount**: -$23.00 (WELCOME10)
- **Total**: $231.94
- **Tracking**: TRACK123456789
- **Fulfilled**: 5 days ago

### Order #ORD-1002 (SHIPPED)
- **Customer**: Jane Smith (jane.smith@example.com)
- **Status**: SHIPPED (In Transit)
- **Payment**: PAID via Stripe Credit Card
- **Items**:
  1. Smart Watch Pro × 1 = $299.99
  2. Premium Cotton T-Shirt × 1 = $29.99
- **Subtotal**: $329.98
- **Tax**: $27.22
- **Shipping**: $14.99 (Express Shipping)
- **Total**: $372.19
- **Tracking**: TRACK987654321

### Order #ORD-1003 (PROCESSING)
- **Customer**: Bob Wilson (bob.wilson@example.com)
- **Status**: PROCESSING
- **Payment**: PAID via Stripe Credit Card
- **Items**:
  1. Classic Denim Jeans × 1 = $79.99
- **Subtotal**: $79.99
- **Tax**: $6.60
- **Shipping**: $5.99 (Standard Shipping)
- **Total**: $92.58
- **Tracking**: Pending

---

## ⭐ Product Reviews (4 total)

### Review 1: Wireless Bluetooth Headphones
- **Customer**: John Doe
- **Rating**: 5/5 ⭐⭐⭐⭐⭐
- **Title**: "Excellent sound quality!"
- **Comment**: "These headphones are amazing! The noise cancellation is top-notch and the battery life is incredible. Highly recommend!"
- **Verified Purchase**: Yes
- **Status**: Approved

### Review 2: Wireless Bluetooth Headphones
- **Customer**: Jane Smith
- **Rating**: 4/5 ⭐⭐⭐⭐
- **Title**: "Great headphones"
- **Comment**: "Very comfortable and great sound. Only minor issue is the case could be more compact."
- **Verified Purchase**: Yes
- **Status**: Approved

### Review 3: Smart Watch Pro
- **Customer**: John Doe
- **Rating**: 5/5 ⭐⭐⭐⭐⭐
- **Title**: "Perfect fitness companion"
- **Comment**: "Tracks everything I need. GPS is accurate, heart rate monitoring works great. Battery lasts all week!"
- **Verified Purchase**: Yes
- **Status**: Approved

### Review 4: Premium Cotton T-Shirt
- **Customer**: Jane Smith
- **Rating**: 5/5 ⭐⭐⭐⭐⭐
- **Title**: "Super soft and comfortable"
- **Comment**: "Best t-shirt I own. The organic cotton is so soft and breathable. Washes well too."
- **Verified Purchase**: Yes
- **Status**: Approved

---

## 💰 Discounts & Promotions

### Discount Codes (3 active)

#### WELCOME10
- **Type**: Percentage Discount
- **Value**: 10% off
- **Minimum Purchase**: $50
- **Usage Limit**: 100 (12 used)
- **Per Customer Limit**: 1
- **Valid**: 60 days remaining
- **Status**: Active

#### FREESHIP
- **Type**: Free Shipping
- **Minimum Purchase**: $75
- **Usage**: Unlimited
- **Status**: Active

#### SAVE25
- **Type**: Fixed Amount
- **Value**: $25 off
- **Minimum Purchase**: $100
- **Usage Limit**: 50 (8 used)
- **Valid**: 30 days remaining
- **Status**: Active

### Flash Sales (1 active)

#### Black Friday Sale
- **Description**: Massive discounts on selected products
- **Duration**: Started 2 days ago, ends in 5 days
- **Status**: Active
- **Featured Products**:
  1. Wireless Bluetooth Headphones - 20% off (5 sold, 15 remaining)
  2. Smart Watch Pro - $50 off (3 sold, 12 remaining)

---

## 🚚 Shipping Configuration

### United States Zone
- **Countries**: US
- **Rates**:
  - **Standard Shipping**: $5.99 (5-7 days)
  - **Express Shipping**: $14.99 (2-3 days)
  - **Free Shipping**: $0 on orders $50+ (5-7 days)

### International Zone
- **Countries**: CA, GB, AU, DE, FR
- **Rates**:
  - **International Standard**: $19.99 (10-14 days)
  - **International Express**: $39.99 (5-7 days)

---

## 💳 Tax Rates (2 configured)

### California Sales Tax
- **Rate**: 8.25%
- **Country**: US
- **State**: CA
- **Status**: Active

### New York Sales Tax
- **Rate**: 8.875%
- **Country**: US
- **State**: NY
- **Status**: Active

---

## 🎨 Theme Configuration

### Demo Store Theme
- **Primary Color**: `#3B82F6` (Blue)
- **Secondary Color**: `#10B981` (Green)
- **Accent Color**: `#F59E0B` (Orange)
- **Background**: `#FFFFFF` (White)
- **Text Color**: `#1F2937` (Dark Gray)
- **Font Family**: Inter
- **Font Size**: 16px
- **Layout Width**: 1280px
- **Border Radius**: 0.5rem
- **Mode**: Light

---

## 📧 Email Templates (2 configured)

### Order Confirmation
- **Handle**: `order_confirmation`
- **Subject**: "Order Confirmation - Order #{{orderNumber}}"
- **Variables**: `{{customerName}}`, `{{orderNumber}}`, `{{orderTotal}}`
- **Status**: Active

### Shipping Notification
- **Handle**: `shipping_notification`
- **Subject**: "Your Order Has Shipped - Order #{{orderNumber}}"
- **Variables**: `{{customerName}}`, `{{orderNumber}}`, `{{trackingNumber}}`
- **Status**: Active

---

## 📬 Newsletter Subscriptions (3 total)

1. **customer@example.com** - Subscribed via checkout
2. **jane.smith@example.com** - Subscribed via footer
3. **marketing@example.com** - Subscribed via popup

---

## 🏷️ Categories (5 total)

1. **Electronics** (`electronics`) - Published, Sort: 1
2. **Clothing** (`clothing`) - Published, Sort: 2
3. **Home & Garden** (`home-garden`) - Published, Sort: 3
4. **Books** (`books`) - Published, Sort: 4
5. **Sports & Outdoors** (`sports-outdoors`) - Published, Sort: 5

---

## 🏢 Brands (3 total)

1. **TechPro** (`techpro`) - Premium electronics brand - Published
2. **StyleCo** (`styleco`) - Fashion and lifestyle brand - Published
3. **HomeEssentials** (`home-essentials`) - Quality home products - Published

---

## 📊 Quick Stats Summary

| Metric | Count |
|--------|-------|
| Stores | 2 |
| Users | 4 |
| Categories | 5 |
| Brands | 3 |
| Products | 15 |
| Customers | 3 |
| Orders | 3 |
| Reviews | 4 |
| Discounts | 3 |
| Flash Sales | 1 |
| Shipping Zones | 2 |
| Tax Rates | 2 |
| Email Templates | 2 |
| Newsletter Subscribers | 3 |

---

## 🔄 Re-seeding Instructions

### Clean Database Reset

```bash
# Stop dev server if running
# Ctrl+C

# Delete database files
Remove-Item prisma/dev.db -ErrorAction SilentlyContinue
Remove-Item prisma/dev.db-journal -ErrorAction SilentlyContinue

# Recreate database schema
npm run db:push

# Seed with fresh data
npm run db:seed
```

### Quick Re-seed (keeps schema)

```bash
# Just run seed script (uses upsert for most data)
npm run db:seed
```

---

## 🧪 Testing Scenarios

### Scenario 1: Customer Checkout Flow
1. Login as: `customer@example.com / Customer@123`
2. Browse products in Electronics category
3. Add "Wireless Bluetooth Headphones" to cart
4. Apply discount code: `WELCOME10`
5. Complete checkout with existing address

### Scenario 2: Store Admin Order Management
1. Login as: `admin@demo-store.com / Demo@123`
2. View orders dashboard
3. Update order #ORD-1003 to "SHIPPED"
4. Add tracking number
5. Send shipping notification email

### Scenario 3: Product Review Management
1. Login as: `admin@demo-store.com / Demo@123`
2. View pending reviews (all are pre-approved in seed)
3. Test review moderation workflow

### Scenario 4: Discount Code Usage
1. Login as any customer
2. Add $60+ of products to cart
3. Apply code: `WELCOME10` (10% off)
4. OR apply code: `FREESHIP` (free shipping on $75+)

### Scenario 5: Flash Sale Shopping
1. Browse "Black Friday Sale" products
2. See discounted prices on Headphones & Smart Watch
3. Limited quantity display

---

## 📝 Notes

- All passwords are hashed using bcrypt with cost factor 12
- All timestamps use UTC by default (except Demo Store which uses America/Los_Angeles)
- Product images use placeholder URLs (placehold.co)
- Payment gateway IDs are test values (prefix: `pi_test_`, `cus_test_`)
- Tracking numbers are placeholder values
- IP addresses are placeholder values (192.168.1.x)
- Multi-tenant isolation is enforced via `storeId` filtering
- Soft deletes are implemented (`deletedAt` field)
- All users have `emailVerified: true` for testing convenience

---

## 🔗 Related Documentation

- [Database Schema Guide](./schema-guide.md)
- [Prisma Instructions](../../.github/instructions/database.instructions.md)
- [Project Constitution](../constitution.md)
- [Feature Specification](../../specs/001-multi-tenant-ecommerce/spec.md)

---

**Generated**: January 30, 2025  
**Seed Script Version**: 1.0.0  
**Database**: SQLite (Development)
