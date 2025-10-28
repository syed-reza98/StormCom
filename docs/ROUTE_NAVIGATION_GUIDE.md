# StormCom Route Navigation Guide

**Generated**: 2025-10-28  
**Purpose**: Comprehensive route testing guide based on user stories from spec.md, plan.md, and tasks.md

## Development Server

```bash
npm run dev
# Access at: http://localhost:3000
```

## User Story Routes

### US0: Authentication & Authorization (Phase 3 - Complete ✅)

#### Public Routes (No Authentication Required)

| Route | Purpose | Test Checklist |
|-------|---------|----------------|
| `/login` | User login | ✓ Email/password validation<br>✓ MFA challenge redirect<br>✓ Session creation<br>✓ Role-based redirect |
| `/register` | New user registration | ✓ Email uniqueness check<br>✓ Password strength validation<br>✓ Terms acceptance<br>✓ Email verification |
| `/forgot-password` | Password recovery initiation | ✓ Email lookup<br>✓ Rate limiting (3/hour)<br>✓ Token generation<br>✓ Email delivery |
| `/reset-password` | Password reset with token | ✓ Token validation<br>✓ Password strength check<br>✓ Token expiration (1 hour)<br>✓ Auto-login after reset |

#### Protected Routes (Requires Authentication)

| Route | Purpose | Test Checklist |
|-------|---------|----------------|
| `/mfa/enroll` | MFA enrollment | ✓ QR code generation<br>✓ TOTP verification<br>✓ Backup codes display<br>✓ One-time enrollment |
| `/mfa/challenge` | MFA verification | ✓ TOTP code validation<br>✓ Backup code fallback<br>✓ "Remember device" option<br>✓ Rate limiting (5 attempts) |

#### API Routes

```bash
# Registration
POST /api/auth/register
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "acceptTerms": true
}

# Login
POST /api/auth/login
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Logout
POST /api/auth/logout

# Forgot Password
POST /api/auth/forgot-password
Content-Type: application/json
{
  "email": "user@example.com"
}

# Reset Password
POST /api/auth/reset-password
Content-Type: application/json
{
  "token": "reset-token-here",
  "password": "NewSecurePass123!"
}

# MFA Enrollment
POST /api/auth/mfa/enroll
Authorization: Bearer <token>

# MFA Verification
POST /api/auth/mfa/verify
Content-Type: application/json
{
  "code": "123456"
}

# Generate Backup Codes
POST /api/auth/mfa/backup-codes
Authorization: Bearer <token>

# Get Session
GET /api/auth/session
Authorization: Bearer <token>
```

---

### US1: Store Management (Phase 4 - Complete ✅)

#### Dashboard Routes (Requires Super Admin Role)

| Route | Purpose | Test Checklist |
|-------|---------|----------------|
| `/stores` | List all stores | ✓ Pagination (10/page)<br>✓ Search by name<br>✓ Filter by status<br>✓ Sort by created date |
| `/stores/new` | Create new store | ✓ Unique store name<br>✓ Domain validation<br>✓ Owner assignment<br>✓ Subscription plan |
| `/stores/[id]` | View store details | ✓ Store info display<br>✓ Admin list<br>✓ Activity logs<br>✓ Analytics summary |
| `/stores/[id]/edit` | Edit store | ✓ Name/domain update<br>✓ Status toggle<br>✓ Settings management<br>✓ Audit logging |

#### API Routes

```bash
# List Stores
GET /api/stores?page=1&limit=10&search=<query>
Authorization: Bearer <super-admin-token>

# Create Store
POST /api/stores
Authorization: Bearer <super-admin-token>
Content-Type: application/json
{
  "name": "My Store",
  "domain": "mystore.example.com",
  "ownerId": "user-id",
  "plan": "PRO"
}

# Get Store Details
GET /api/stores/[id]
Authorization: Bearer <token>

# Update Store
PUT /api/stores/[id]
Authorization: Bearer <super-admin-token>
Content-Type: application/json
{
  "name": "Updated Store Name",
  "status": "ACTIVE"
}

# Delete Store (Soft Delete)
DELETE /api/stores/[id]
Authorization: Bearer <super-admin-token>

# List Store Admins
GET /api/stores/[id]/admins
Authorization: Bearer <token>

# Add Store Admin
POST /api/stores/[id]/admins
Authorization: Bearer <super-admin-token>
Content-Type: application/json
{
  "userId": "user-id",
  "role": "STORE_ADMIN"
}
```

---

### US2: Product Catalog Management (Phase 5 - Complete ✅)

#### Dashboard Routes (Requires Store Admin Role)

| Route | Purpose | Test Checklist |
|-------|---------|----------------|
| `/products` | Product list | ✓ Pagination (20/page)<br>✓ Search by name/SKU<br>✓ Filter by category/brand/status<br>✓ Bulk actions |
| `/products/new` | Create product | ✓ Name/SKU uniqueness<br>✓ Price validation<br>✓ Category assignment<br>✓ Image upload |
| `/products/[id]` | Product details | ✓ Full product info<br>✓ Variant display<br>✓ Stock levels<br>✓ Price history |
| `/products/[id]/edit` | Edit product | ✓ Update fields<br>✓ Manage variants<br>✓ Inventory adjustment<br>✓ Version control |
| `/categories` | Category management | ✓ Tree structure<br>✓ Drag-drop reorder<br>✓ Nested categories<br>✓ Product count |
| `/brands` | Brand management | ✓ Brand CRUD<br>✓ Logo upload<br>✓ Product association<br>✓ Slug generation |
| `/attributes` | Product attributes | ✓ Attribute types<br>✓ Value options<br>✓ Multi-select support<br>✓ Filterable flag |
| `/bulk-import` | Bulk CSV import | ✓ CSV validation<br>✓ Template download<br>✓ Progress tracking<br>✓ Error reporting |

#### API Routes

```bash
# List Products
GET /api/products?page=1&limit=20&search=<query>&category=<id>&brand=<id>
Authorization: Bearer <token>

# Create Product
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json
{
  "name": "Product Name",
  "sku": "PROD-001",
  "price": 29.99,
  "categoryId": "cat-id",
  "brandId": "brand-id",
  "description": "Product description",
  "stock": 100
}

# Get Product
GET /api/products/[id]
Authorization: Bearer <token>

# Update Product
PUT /api/products/[id]
Authorization: Bearer <token>
Content-Type: application/json
{
  "name": "Updated Product Name",
  "price": 34.99
}

# Delete Product
DELETE /api/products/[id]
Authorization: Bearer <token>

# Export Products (CSV)
GET /api/products/export?format=csv
Authorization: Bearer <token>

# Import Products (CSV)
POST /api/products/import
Authorization: Bearer <token>
Content-Type: multipart/form-data
file: <csv-file>

# Get Stock Info
GET /api/products/[id]/stock
Authorization: Bearer <token>

# Decrease Stock (Order Fulfillment)
POST /api/products/[id]/stock/decrease
Authorization: Bearer <token>
Content-Type: application/json
{
  "quantity": 2
}

# Check Stock Availability
POST /api/products/[id]/stock/check
Authorization: Bearer <token>
Content-Type: application/json
{
  "quantity": 5
}

# Categories
GET /api/categories
POST /api/categories
GET /api/categories/[id]
PUT /api/categories/[id]
DELETE /api/categories/[id]
POST /api/categories/[id]/move
POST /api/categories/reorder

# Brands
GET /api/brands
POST /api/brands
GET /api/brands/[id]
PUT /api/brands/[id]
DELETE /api/brands/[id]
GET /api/brands/[id]/products

# Attributes
GET /api/attributes
POST /api/attributes
GET /api/attributes/[id]
PUT /api/attributes/[id]
DELETE /api/attributes/[id]
GET /api/attributes/[id]/products

# Bulk Operations
POST /api/bulk/products/import
GET /api/bulk/products/export
POST /api/bulk/categories/import
GET /api/bulk/categories/export
```

---

## Testing Workflow

### 1. Authentication Flow Test

```bash
# 1. Open browser to http://localhost:3000
# 2. Navigate to /register
# 3. Fill registration form
# 4. Verify email (check console for link)
# 5. Navigate to /login
# 6. Login with credentials
# 7. If MFA enrolled, complete /mfa/challenge
# 8. Verify redirect to dashboard
```

### 2. Store Management Flow Test (Super Admin Only)

```bash
# 1. Login as Super Admin
# 2. Navigate to /stores
# 3. Click "Create Store" → /stores/new
# 4. Fill store form and submit
# 5. Verify redirect to /stores/[id]
# 6. Click "Edit" → /stores/[id]/edit
# 7. Update store details and save
# 8. Navigate back to /stores list
# 9. Verify store appears in list
```

### 3. Product Catalog Flow Test (Store Admin)

```bash
# 1. Login as Store Admin
# 2. Navigate to /products
# 3. Click "Add Product" → /products/new
# 4. Fill product form (name, SKU, price, category)
# 5. Upload product image
# 6. Save and verify redirect to /products/[id]
# 7. Click "Edit" → /products/[id]/edit
# 8. Update product details
# 9. Test search functionality on /products
# 10. Test filters (category, brand, status)
# 11. Test bulk import via /bulk-import
```

### 4. Category Management Flow Test

```bash
# 1. Navigate to /categories
# 2. Create parent category
# 3. Create child category
# 4. Test drag-drop reordering
# 5. Assign products to categories
# 6. Test category tree navigation
```

### 5. Brand Management Flow Test

```bash
# 1. Navigate to /brands
# 2. Create new brand
# 3. Upload brand logo
# 4. Assign products to brand
# 5. Test brand filtering on /products
```

---

## Browser DevTools Testing

### Check Console Errors

```javascript
// Open browser console (F12) and check for:
// - React errors
// - API call failures
// - Network request errors
// - Hydration mismatches
```

### Network Tab Monitoring

```javascript
// Monitor API calls:
// - Check response times (target <500ms)
// - Verify proper status codes
// - Check request/response payloads
// - Monitor for failed requests
```

### Performance Profiling

```javascript
// Use Lighthouse or Chrome DevTools:
// - LCP target: <2.0s desktop, <2.5s mobile
// - FID target: <100ms
// - CLS target: <0.1
```

---

## Common Issues & Solutions

### Issue: React.Children.only Error

**Symptoms**: Build fails with "React.Children.only expected to receive a single React element child"

**Solution**: 
- Remove Suspense wrappers from pages with client components
- Add `export const dynamic = 'force-dynamic'` to pages
- Ensure components return single root element

### Issue: MFA Not Working

**Symptoms**: TOTP codes not validating

**Solution**:
- Verify system time is synchronized
- Check TOTP secret is correctly saved
- Test with backup codes
- Verify 30-second time window

### Issue: Session Expiration

**Symptoms**: Users logged out unexpectedly

**Solution**:
- Check session TTL in environment variables
- Verify Vercel KV connection (production)
- Check in-memory Map fallback (development)

### Issue: Multi-tenant Data Leakage

**Symptoms**: Users see data from other stores

**Solution**:
- Verify Prisma middleware is registered
- Check storeId filter on all queries
- Review role-based access control
- Audit API route protections

---

## Next Steps

### Pending User Stories (Not Yet Implemented)

- **US3**: Order Management
- **US3a**: Inventory Management  
- **US4**: Customer Management
- **US5**: Marketing & Promotions
- **US6**: Checkout & Payments
- **US7**: Shipping & Fulfillment
- **US8**: Content Management (CMS)
- **US9**: Reports & Analytics

---

## Manual Testing Checklist

- [ ] All authentication routes load without errors
- [ ] Registration flow creates user and sends email
- [ ] Login flow validates credentials and creates session
- [ ] MFA enrollment generates QR code and backup codes
- [ ] Password reset flow sends email and updates password
- [ ] Store CRUD operations work for Super Admins
- [ ] Product CRUD operations work for Store Admins
- [ ] Category tree displays correctly
- [ ] Brand management functions properly
- [ ] Bulk import validates CSV and imports products
- [ ] Search and filters work on product list
- [ ] Role-based access control enforced
- [ ] Multi-tenant isolation verified (no cross-store data)
- [ ] API rate limiting enforced
- [ ] Responsive design works on mobile
- [ ] Accessibility standards met (WCAG 2.1 AA)

---

**Last Updated**: 2025-10-28  
**Next.js Version**: 16.0.0  
**Status**: Development Environment Ready ✅
