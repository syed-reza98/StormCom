# Implementation Tasks: StormCom Multi-tenant E-commerce Platform

**Feature**: 001-multi-tenant-ecommerce  
**Status**: Phase 5 (US2 Product Catalog) - 120/260 tasks complete (46.2%) - Product catalog API routes, dashboard UI pages, and CRUD operations complete  
**Created**: 2025-10-24  
**Updated**: 2025-10-27  
**Priorities**: P0 (Blocking), P1 (Must Have), P2 (Should Have)  
**Overall Progress**: 120/260 tasks complete (46.2%)

**✅ MILESTONE ACHIEVED**: Phase 4 US1 Store Management complete (T091-T096). Authentication and store management foundations established. Ready for Phase 5 US2 Product Catalog.

## Progress Summary

- ✅ **Phase 1: Setup (T001-T015)** - 15/15 complete (100%)
- ✅ **Phase 2: Foundational (T016-T035)** - 20/20 complete (100%)
- ✅ **Phase 3: US0 Authentication (T036-T080)** - 45/45 complete (100%)
  - ✅ Service layer: AuthService, MFAService, SessionService, RoleService (T036-T039)
  - ✅ API routes: register, login, logout, forgot-password, reset-password, mfa/enroll, mfa/verify, mfa/backup-codes (T040-T047)
  - ✅ UI pages: login, register, forgot-password, reset-password, mfa/enroll, mfa/challenge (T048-T052) - **UPDATED with design system**
  - ✅ Hooks & Context: useAuth hook, AuthProvider context (T053-T054)
  - ✅ Design System: Tailwind config, CSS variables, shared UI components (Button, Input, Card, Label, FormError, FormSuccess) - **NEW**
  - ✅ UI components: PasswordStrengthIndicator, all auth pages redesigned with centered card layout (T054a-T054b)
  - ✅ E2E test suites (T055-T079) - 25/25 complete (spec.md defines 25 scenarios)
  - ✅ Accessibility tests (T080) - 1/1 complete (constitution requirement)
- ✅ **Phase 4: US1 Store Management (T081-T096)** - 16/16 complete (100%)
- ✅ **Phase 5: US2 Product Catalog (T097-T127)** - 31/31 complete (100%) - Complete product catalog management system with dashboard UI, API routes, and comprehensive testing
- ⏳ **Phase 6+**: US6, US3a, US3, US4, US5, US7, US8, US9 - 0/153 complete

## Implementation Strategy

**Approach**: MVP-first with incremental delivery by user story  
**MVP Scope**: US0 → US1 → US2 → US6 → US3a → US3 → US4 (complete e-commerce loop)  
**Testing**: E2E tests included per spec.md scenarios (Playwright with POM)  
**Organization**: Tasks organized by user story to enable independent implementation and testing

**Key Principles**:
- Each user story phase delivers complete, independently testable functionality
- Tasks follow strict format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
- [P] marker indicates parallelizable tasks (different files, no dependencies)
- [Story] labels (US0, US1, etc.) only for user story phases
- Setup and Foundational phases have NO story labels
- Dependencies clearly marked for sequential execution

---

## Phase 1: Setup (Project Initialization) ✅

**Goal**: Initialize Next.js 16 project with complete tooling infrastructure

**Status**: COMPLETE (All 15 tasks finished)

**Tasks**:

- [x] T001 Initialize Next.js 16 project with App Router (no Pages Router) using `npx create-next-app@latest --typescript --tailwind --app`
- [x] T002 Configure TypeScript strict mode in tsconfig.json with Next.js recommended settings
- [x] T003 [P] Create package.json with core dependencies: next@16, react@19, typescript@5.9.3, prisma, @prisma/client, next-auth@4, tailwindcss@4.1.14
- [x] T004 [P] Add development dependencies: vitest@3.2.4, @playwright/test@1.56.0, @testing-library/react, @testing-library/jest-dom, eslint, prettier
- [x] T005 Install all npm dependencies with `npm install`
- [x] T006 Configure Tailwind CSS 4.1.14+ in tailwind.config.ts with design system tokens (colors, typography, spacing)
- [x] T007 [P] Create .env.example file with all required environment variables (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, VERCEL_BLOB_TOKEN)
- [x] T008 [P] Configure ESLint in .eslintrc.json with Next.js recommended rules and custom rules from .github/instructions/
- [x] T009 [P] Configure Prettier in .prettierrc with 2-space indentation and semicolons
- [x] T010 Setup Git with .gitignore for Next.js (node_modules/, .env.local, .next/, .vercel/, prisma/*.db)
- [x] T011 Create project folder structure: src/app/, src/components/, src/lib/, src/services/, src/types/, prisma/, tests/, public/
- [x] T012 Configure Next.js in next.config.ts with security headers, image optimization, and experimental features
- [x] T013 [P] Setup Vitest in vitest.config.ts for unit/integration tests with React Testing Library
- [x] T014 [P] Setup Playwright in playwright.config.ts for E2E tests with BrowserStack and Percy integration
- [x] T015 [P] Create README.md with local setup instructions, architecture overview, and development workflow

---

## Phase 2: Foundational (Blocking Prerequisites) ✅

**Goal**: Establish shared infrastructure that ALL user stories depend on

**Status**: COMPLETE (All 20 tasks finished - T022 replaced with custom auth)

**Tasks**:

- [x] T016 Create complete Prisma schema in prisma/schema.prisma with ALL entities from data-model.md (User, Store, Product, Order, Payment, etc.)
- [x] T017 Generate Prisma Client with `npx prisma generate`
- [x] T018 Create initial database migration with `npx prisma migrate dev --name init`
- [x] T019 Create database seed script in prisma/seed.ts with test stores, users, and products
- [x] T020 Implement Prisma middleware in src/lib/prisma-middleware.ts for multi-tenant isolation (auto-inject storeId on queries)
- [x] T021 Create Prisma client singleton in src/lib/db.ts with connection pooling and middleware registration
- [x] ~~T022 Configure NextAuth.js v4+ in src/app/api/auth/[...nextauth]/route.ts with JWT strategy and credentials provider~~ **REPLACED** - NextAuth v5 incompatible with Next.js 16. Custom auth system implemented in Phase 3 using utilities T029-T035.
- [x] T023 Implement session storage layer in src/lib/session-storage.ts (Vercel KV for production, in-memory Map for dev)
- [x] T024 [P] Create error handling utilities in src/lib/error-handler.ts with customer-facing error messages and error codes
- [x] T025 [P] Create API response formatter in src/lib/api-response.ts with {data, error, meta} structure
- [x] T026 [P] Implement security headers middleware in src/middleware.ts (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [x] T027 [P] Implement CSRF protection middleware in src/lib/csrf.ts with token generation and validation
- [x] T028 [P] Implement rate limiting middleware in src/lib/rate-limit.ts (tiered by subscription plan using Vercel KV)
- [x] T029 [P] Create Zod validation schemas library in src/lib/validation.ts with schemas for User, Store, Product, Order (420 lines)
- [x] T030 [P] Create email service in src/lib/email.ts with Resend integration for transactional emails (430 lines)
- [x] T031 [P] Implement Vercel Blob integration in src/lib/storage.ts for file uploads - images, invoices (370 lines)
- [x] T032 [P] Create encryption utilities in src/lib/encryption.ts for AES-256-GCM encryption of TOTP secrets, API keys, payment tokens (230 lines)
- [x] T033 [P] Create password utilities in src/lib/password.ts for bcrypt hashing, strength validation, history checking (370 lines)
- [x] T034 [P] Create MFA utilities in src/lib/mfa.ts for TOTP generation, QR codes, backup codes (430 lines)
- [x] T035 [P] Create audit logging utilities in src/lib/audit.ts for security event tracking (430 lines)

**Notes**:
- T029-T035 originally listed setup tasks were replaced with essential utility libraries
- Original T029 (logging) merged into audit.ts (T035)
- Original T030-T032 (validation/blob storage/ui components) renumbered and implemented
- Original T033-T035 (error boundary/loading/styles) moved to Phase 3 as needed

---

## Phase 3: US0 - Authentication and Authorization (P0 - Blocking) 🚧

**User Story**: As a Super Admin, Store Admin, Staff member, or Customer, I need to authenticate securely with my credentials to access the appropriate areas of the system based on my role.

**Why P0**: Authentication is the entry point to the entire system. Without secure login, no user can access any functionality. This blocks all other features.

**Independent Test**: Attempt login with valid/invalid credentials for different user types (Super Admin, Store Admin, Staff, Customer), verify role-based redirects, test password reset flow, verify account lockout after failed attempts, confirm MFA prompt when enabled.

**Tasks**:

- [x] T036 [US0] Create AuthService in src/services/auth-service.ts with register, login, logout, password reset, and account lockout logic
- [x] T037 [US0] Create MFAService in src/services/mfa-service.ts with TOTP generation, QR code generation, backup codes, and verification
- [x] T038 [US0] Create SessionService in src/services/session-service.ts with session creation, validation, refresh, and revocation
- [x] T039 [US0] Create RoleService in src/services/role-service.ts with role assignment, permission checking, and role hierarchy validation
- [x] T040 [US0] [P] Create API route POST /api/auth/register in src/app/api/auth/register/route.ts for user registration with email verification
- [x] T041 [US0] [P] Create API route POST /api/auth/login in src/app/api/auth/login/route.ts with credentials validation and session creation
- [x] T042 [US0] [P] Create API route POST /api/auth/logout in src/app/api/auth/logout/route.ts with session invalidation
- [x] T043 [US0] [P] Create API route POST /api/auth/forgot-password in src/app/api/auth/forgot-password/route.ts with reset token generation
- [x] T044 [US0] [P] Create API route POST /api/auth/reset-password in src/app/api/auth/reset-password/route.ts with token validation and password update
- [x] T045 [US0] [P] Create API route POST /api/auth/mfa/enroll in src/app/api/auth/mfa/enroll/route.ts with TOTP secret generation and QR code
- [x] T046 [US0] [P] Create API route POST /api/auth/mfa/verify in src/app/api/auth/mfa/verify/route.ts with TOTP code validation
- [x] T047 [US0] [P] Create API route POST /api/auth/mfa/backup-codes in src/app/api/auth/mfa/backup-codes/route.ts with backup code generation
- [x] T048 [US0] [P] Create Login page in src/app/(auth)/login/page.tsx with email/password form and MFA prompt redirect - **UPDATED with design system (centered card, shared components, CSS variables)**
- [x] T049 [US0] [P] Create Register page in src/app/(auth)/register/page.tsx with user registration form and email verification notice - **UPDATED with design system + PasswordStrengthIndicator**
- [x] T050 [US0] [P] Create MFA Enrollment page in src/app/(auth)/mfa/enroll/page.tsx with QR code display and setup instructions - **UPDATED with design system**
- [x] T051 [US0] [P] Create MFA Challenge page in src/app/(auth)/mfa/challenge/page.tsx with TOTP code input and backup code option - **UPDATED with design system**
- [x] T052 [US0] [P] Create Password Reset page in src/app/(auth)/reset-password/page.tsx with token validation and new password form - **UPDATED with design system + PasswordStrengthIndicator**
- [x] T053 [US0] [P] Create useAuth hook in src/hooks/use-auth.ts with login, logout, register, and current user state
- [x] T054 [US0] [P] Create AuthProvider context in src/contexts/auth-provider.tsx with session management and role checking
- [x] T054a [US0] [P] Create PasswordStrengthIndicator component in src/components/auth/password-strength-indicator.tsx with real-time validation checklist (min 8 chars, uppercase, lowercase, number, special char) - **REQUIRED by spec.md L232** - **IMPLEMENTED**
- [x] T054b [US0] [P] Create ForgotPasswordPage in src/app/(auth)/forgot-password/page.tsx with email input and reset link request - **Missing from original task list** - **IMPLEMENTED**
- [x] T054c [US0] [P] Implement complete design system foundation: Tailwind CSS v4 config with CSS variables, globals.css with 20+ theme variables, shared UI components (Button, Input, Card, Label, FormError, FormSuccess), cn() utility - **NEW TASK** - **COMPLETE**
- [x] T054d [US0] [P] Update all 6 auth pages with design system: centered card layout (max-w-md), shared Button/Input/Label components, CSS variable colors, consistent focus states (ring-2 ring-ring), accessibility preserved - **NEW TASK** - **COMPLETE**
- [x] T055 [US0] Create E2E test "User can register with valid credentials" in tests/e2e/auth/register.spec.ts using RegisterPage POM (validates form submission, email verification notice, database user creation)
- [x] T056 [US0] Create E2E test "User can login with valid credentials" in tests/e2e/auth/login.spec.ts using LoginPage POM (validates email/password, session creation, role-based redirect to /dashboard or /account)
- [x] T057 [US0] Create E2E test "User account is locked after 5 failed login attempts" in tests/e2e/auth/account-lockout.spec.ts using LoginPage POM (attempts 5 invalid logins, validates lockout message, 15-minute timeout)
- [x] T058 [US0] Create E2E test "User can complete MFA enrollment and login with TOTP code" in tests/e2e/auth/mfa.spec.ts using MFAEnrollPage, MFAChallengePage POMs (scans QR code, saves backup codes, verifies TOTP login)
- [x] T059 [US0] Create E2E test "User can reset password via email link" in tests/e2e/auth/password-reset.spec.ts using ForgotPasswordPage, PasswordResetPage POMs (requests reset, clicks email link, sets new password, validates 1-hour expiry)
- [x] T060 [US0] Create E2E test "Invalid email format shows validation error" in tests/e2e/auth/validation.spec.ts using RegisterPage, LoginPage POMs (tests "notanemail", validates inline error message)
- [x] T061 [US0] Create E2E test "Incorrect password shows error message" in tests/e2e/auth/login-errors.spec.ts using LoginPage POM (valid email + wrong password, validates "Invalid email or password" message, failed attempt logged)
- [x] T062 [US0] Create E2E test "User can login with MFA backup code" in tests/e2e/auth/mfa-backup.spec.ts using MFAChallengePage POM (enters backup code, validates single-use, marks code as used)
- [x] T063 [US0] Create E2E test "User can recover lost MFA access via email" in tests/e2e/auth/mfa-recovery.spec.ts using MFAChallengePage POM (clicks "Lost access?", verifies email recovery link, disables MFA)
- [x] T064 [US0] Create E2E test "Super Admin can access all stores" in tests/e2e/auth/cross-tenant.spec.ts using DashboardPage POM (login as Super Admin, navigate to multiple stores, validates cross-store data visibility)
- [x] T065 [US0] Create E2E test "Store Admin redirected to assigned store only" in tests/e2e/auth/role-redirect.spec.ts using LoginPage, DashboardPage POMs (login as Store Admin, validates redirect to assigned store, blocks other stores with 404)
- [x] T066 [US0] Create E2E test "Staff denied access to restricted pages" in tests/e2e/auth/permissions.spec.ts using DashboardPage, SettingsPage POMs (login as Staff, attempt /settings, validates 403 Forbidden, audit log entry)
- [x] T067 [US0] Create E2E test "Inactive account login prevented" in tests/e2e/auth/inactive-account.spec.ts using LoginPage POM (login with INACTIVE status, validates "account deactivated" message)
- [x] T068 [US0] Create E2E test "Customer redirected to account page" in tests/e2e/auth/customer-login.spec.ts using LoginPage, AccountPage POMs (login as Customer, validates redirect to /account, shows order history)
- [x] T069 [US0] Create E2E test "Session expires after 7 days inactivity" in tests/e2e/auth/session-expiry.spec.ts using DashboardPage POM (fast-forward time, validates session expired message, redirect to login)
- [x] T070 [US0] Create E2E test "Password change invalidates all sessions" in tests/e2e/auth/session-invalidation.spec.ts using SettingsPage, LoginPage POMs (change password, validates other sessions invalidated within 60s)
- [x] T071 [US0] Create E2E test "Permission revocation terminates sessions" in tests/e2e/auth/session-termination.spec.ts using DashboardPage POM (admin revokes permissions, validates session terminated within 60s)
- [x] T072 [US0] Create E2E test "Password must meet length and complexity requirements" in tests/e2e/auth/password-validation.spec.ts using RegisterPage, PasswordResetPage POMs (tests <8 chars, no uppercase, no number, etc., validates inline errors)
- [x] T073 [US0] Create E2E test "Password cannot be reused from last 5 passwords" in tests/e2e/auth/password-history.spec.ts using SettingsPage POM (change password 6 times, attempt reuse of 1st password, validates "password used recently" error)
- [x] T074 [US0] Create E2E test "Login with valid credentials shows loading state" in tests/e2e/auth/login-loading.spec.ts using LoginPage POM (validates spinner on submit button, disabled state during submission)
- [x] T075 [US0] Create E2E test "Register with duplicate email shows error" in tests/e2e/auth/register-duplicate.spec.ts using RegisterPage POM (attempts registration with existing email, validates "email already registered" error)
- [x] T076 [US0] Create E2E test "Password reset token expires after 1 hour" in tests/e2e/auth/password-reset-expiry.spec.ts using PasswordResetPage POM (requests reset, waits 1 hour, clicks link, validates expiry message)
- [x] T077 [US0] Create E2E test "Email verification required before login" in tests/e2e/auth/email-verification.spec.ts using RegisterPage, LoginPage POMs (registers, attempts login without verifying, validates "verify email" message)
- [x] T078 [US0] Create E2E test "Logout from user menu succeeds" in tests/e2e/auth/logout.spec.ts using DashboardPage, UserMenuPOM (clicks logout, validates redirect to /login, "logged out" message announced to screen reader)
- [x] T079 [US0] Create integration tests for AuthService, MFAService, SessionService, RoleService in tests/integration/services/auth.test.ts (unit tests for all service methods, mocks Prisma, validates business logic)
- [x] T080 [US0] Create E2E accessibility tests for auth pages in tests/e2e/auth/accessibility.spec.ts using axe-core (runs WCAG 2.1 AA checks on login, register, MFA pages; validates keyboard navigation, focus indicators, ARIA labels) - **CONSTITUTION REQUIREMENT**

---

## Phase 4: US1 - Store Management (P1 - Must Have) ✅

**User Story**: As a Super Admin, I need to create, configure, and manage multiple stores to enable multi-tenancy for my e-commerce platform.

**Why P1**: Store is the core tenant entity. Without stores, users cannot create products, take orders, or perform any business operations. This is the foundation of multi-tenancy.

**Status**: COMPLETE (All 16 tasks finished)

**Independent Test**: Create a new store with name, subdomain, and owner assignment. Verify store appears in store list. Update store settings (logo, theme). Delete store and verify all associated data is soft-deleted.

**Tasks**:

- [x] T081 [US1] Create StoreService in src/services/store-service.ts with create, list, get, update, delete (soft delete), and assign admin operations
- [x] T082 [US1] [P] Create API route POST /api/stores in src/app/api/stores/route.ts for creating new stores with subdomain validation
- [x] T083 [US1] [P] Create API route GET /api/stores in src/app/api/stores/route.ts for listing all stores (Super Admin) or assigned stores (Store Admin)
- [x] T084 [US1] [P] Create API route GET /api/stores/[id] in src/app/api/stores/[id]/route.ts for retrieving store details
- [x] T085 [US1] [P] Create API route PUT /api/stores/[id] in src/app/api/stores/[id]/route.ts for updating store settings (name, logo, theme, contact info)
- [x] T086 [US1] [P] Create API route DELETE /api/stores/[id] in src/app/api/stores/[id]/route.ts for soft deleting stores
- [x] T087 [US1] [P] Create API route POST /api/stores/[id]/admins in src/app/api/stores/[id]/admins/route.ts for assigning store admins
- [x] T088 [US1] [P] Create Stores List page in src/app/(dashboard)/stores/page.tsx with data table and create button
- [x] T089 [US1] [P] Create Store Details page in src/app/(dashboard)/stores/[id]/page.tsx with settings tabs (General, Theme, Billing, Users)
- [x] T090 [US1] [P] Create Create Store form component in src/components/stores/create-store-form.tsx with name, subdomain, and owner fields
- [x] T091 [US1] [P] Create Store Settings form component in src/components/stores/store-settings-form.tsx with logo upload and theme configuration
- [x] T092 [US1] Create E2E test "Super Admin can create new store" in tests/e2e/stores/create-store.spec.ts using StoresListPage, CreateStoreFormPOM
- [x] T093 [US1] Create E2E test "Store Admin can update store settings" in tests/e2e/stores/update-store.spec.ts using StoreDetailsPage, StoreSettingsFormPOM
- [x] T094 [US1] Create E2E test "Super Admin can delete store" in tests/e2e/stores/delete-store.spec.ts using StoresListPage POM (soft delete validation)
- [x] T095 [US1] Create E2E accessibility tests for store management pages in tests/e2e/stores/accessibility.spec.ts using axe-core
- [x] T096 [US1] Create integration tests for StoreService in tests/integration/services/store.test.ts

---

## Phase 5: US2 - Product Catalog (P1 - Must Have)

**User Story**: As a Store Admin, I need to create, organize, and manage my product catalog with categories, brands, and attributes to enable customers to browse and purchase products.

**Why P1**: Products are the core business entity. Without a product catalog, there is nothing to sell. This is essential for basic e-commerce functionality.

**Dependencies**: **[RESOLVED: T096]** - Phase 5 UNBLOCKED as US1 Store Management complete (stores exist, can create products).

**Independent Test**: Create a category, brand, and product with variants (size, color). Upload product images. Bulk import 50 products via CSV. Search for products by name. Filter products by category and price range. Verify product appears on storefront.

**Tasks**:

- [x] T097 [US2] Create ProductService in src/services/product-service.ts with create, list, get, update, delete, search, and filter operations
- [x] T098 [US2] Create CategoryService in src/services/category-service.ts with hierarchical category CRUD and tree structure operations
- [x] T099 [US2] Create BrandService in src/services/brand-service.ts with brand CRUD operations
- [x] T100 [US2] Create AttributeService in src/services/attribute-service.ts with attribute and attribute value management
- [x] T101 [US2] Create BulkImportService in src/services/bulk-import-service.ts with CSV parsing, validation, and batch product creation
- [x] T102 [US2] Create BulkExportService in src/services/bulk-export-service.ts with product export to CSV format
- [x] T103 [US2] [P] Create API route POST /api/products in src/app/api/products/route.ts for creating products with variants and images
- [x] T104 [US2] [P] Create API route GET /api/products in src/app/api/products/route.ts for listing products with pagination, search, and filters
- [x] T105 [US2] [P] Create API route GET /api/products/[id] in src/app/api/products/[id]/route.ts for retrieving product details with variants
- [x] T106 [US2] [P] Create API route PUT /api/products/[id] in src/app/api/products/[id]/route.ts for updating product details
- [x] T107 [US2] [P] Create API route DELETE /api/products/[id] in src/app/api/products/[id]/route.ts for soft deleting products
- [x] T108 [US2] [P] Create API route POST /api/categories in src/app/api/categories/route.ts for creating categories with parent-child relationships
- [x] T109 [US2] [P] Create API route GET /api/categories in src/app/api/categories/route.ts for listing categories in tree structure
- [x] T110 [US2] [P] Create API route POST /api/brands in src/app/api/brands/route.ts for creating brands
- [x] T111 [US2] [P] Create API route GET /api/brands in src/app/api/brands/route.ts for listing brands
- [x] T112 [US2] [P] Create API route POST /api/attributes in src/app/api/attributes/route.ts for creating product attributes
- [x] T113 [US2] [P] Create API route GET /api/attributes in src/app/api/attributes/route.ts for listing attributes with values
- [x] T114 [US2] [P] Create API route POST /api/products/import in src/app/api/products/import/route.ts for bulk product import from CSV
- [x] T115 [US2] [P] Create API route GET /api/products/export in src/app/api/products/export/route.ts for bulk product export to CSV
- [x] T116 [US2] [P] Create Products List page in src/app/(dashboard)/products/page.tsx with data table, search, filters, and bulk actions
- [x] T117 [US2] [P] Create Product Details page in src/app/(dashboard)/products/[id]/page.tsx with product info, variants, images, and inventory
- [x] T118 [US2] [P] Create Create/Edit Product form in src/components/products/product-form.tsx with variant management and image upload
- [x] T119 [US2] [P] Create Categories page in src/app/(dashboard)/categories/page.tsx with tree view and drag-drop reordering
- [x] T120 [US2] [P] Create Brands page in src/app/(dashboard)/brands/page.tsx with brand list and CRUD operations
- [x] T121 [US2] [P] Create Attributes page in src/app/(dashboard)/attributes/page.tsx with attribute and value management ✓
- [x] T122 [US2] [P] Create Bulk Import page in src/app/(dashboard)/products/import/page.tsx with CSV upload and validation preview ✓
- [x] T123 [US2] [P] Create Image upload component in src/components/products/image-upload.tsx with Vercel Blob integration and preview ✓
- [x] T124 [US2] Create E2E test "Store Admin can create product with variants" in tests/e2e/products/create-product.spec.ts ✓
- [x] T125 [US2] Create E2E test "Store Admin can bulk import products from CSV" in tests/e2e/products/bulk-import.spec.ts ✓
- [x] T126 [US2] Create E2E test "Customer can search and filter products" in tests/e2e/products/search-filter.spec.ts ✓
- ✅ T127 [US2] Create integration tests for ProductService, CategoryService, BrandService, AttributeService in tests/integration/services/product.test.ts

---

## Phase 6: US6 - Inventory Management (P1 - Must Have)

**User Story**: As a Store Admin, I need to track product stock levels, receive low stock alerts, and manage inventory across multiple warehouses to prevent overselling and maintain accurate inventory.

**Why P1**: Inventory management prevents overselling and ensures accurate stock levels. Without this, customers could purchase out-of-stock items, leading to fulfillment failures and poor customer experience.

**Depends On**: US2 (Products must exist before inventory can be tracked)

**Independent Test**: Set product stock to 5 units. Place order for 3 units. Verify stock decreases to 2. Set low stock threshold to 3. Verify low stock alert appears. Add stock from warehouse. Verify stock increases.

**Tasks**:

- [x] T107 [US6] Create InventoryService in src/services/inventory-service.ts with stock tracking, adjustments, and low stock detection - **BUG FIX: Removed unsupported `mode: 'insensitive'` from Prisma search filters. Exported `determineInventoryStatus` function for testing.**
- [x] T108 [US6] [P] Create API route GET /api/inventory in src/app/api/inventory/route.ts for retrieving inventory levels with low stock filter
- [x] T109 [US6] [P] Create API route POST /api/inventory/adjust in src/app/api/inventory/adjust/route.ts for manual stock adjustments
- [x] T110 [US6] [P] Create Inventory page in src/app/(dashboard)/inventory/page.tsx with stock levels table and low stock alerts - **ENHANCED: Added data-testid attributes for E2E testing (low-stock-alert, inventory-status, low-stock-filter)**
- [⏳] T111 [US6] Create E2E test "Stock decreases when order is placed" in tests/e2e/inventory/stock-tracking.spec.ts - **DEFERRED: Requires Phase 8 (US3 - Checkout) implementation. Depends on T123-T131 (CheckoutService, PaymentService, order creation workflow). Stub created with implementation plan.**
- [x] T112 [US6] Create E2E test "Low stock alert appears when threshold reached" in tests/e2e/inventory/low-stock-alert.spec.ts - **COMPLETE: 5 test scenarios covering alert display, stock adjustments, out-of-stock, filtering, and alert count updates.**
- [x] **NEW**: T107a [US6] Create unit tests for InventoryService in tests/unit/services/inventory-service.test.ts - **COMPLETE: 15 test cases covering determineInventoryStatus, getInventoryLevels, getLowStockItems, getInventoryHistory, adjustStock validation and operations.**

---

## Phase 7: US3a - Storefront (P1 - Must Have)

**User Story**: As a Customer, I need to browse products, view product details, and add items to my cart to prepare for purchase.

**Why P1**: Storefront is the customer-facing product display. Without this, customers cannot browse or view products, making e-commerce impossible.

**Depends On**: US2 (Products must exist to display on storefront)

**Independent Test**: Visit storefront homepage. Browse products by category. Click product to view details with images and variants. Select variant (size, color). Add product to cart. View cart with selected products.

**Tasks**:

- [x] T113 [US3a] Create StorefrontService in src/services/storefront-service.ts with public product catalog, search, filtering, and category navigation - **COMPLETE**: 6 functions (getPublishedProducts, getProductBySlug, getCategoryTree, getCategoryBySlug, getFeaturedProducts, getRelatedProducts)
- [x] T114 [US3a] [P] Create Product Listing page in src/app/(storefront)/products/page.tsx with product grid, filters, sorting, and pagination - **COMPLETE**: Server Component with async data fetching, responsive grid, ProductFilters, ProductSort, Pagination components
- [x] **NEW**: T114a [US3a] Create ProductCard component in src/components/storefront/product-card.tsx - **COMPLETE**: Product display with image, price, discount badge, stock status, add to cart button
- [x] **NEW**: T114b [US3a] Create ProductFilters component in src/components/storefront/product-filters.tsx - **COMPLETE**: Category, price range, stock status filters with apply/clear actions
- [x] **NEW**: T114c [US3a] Create ProductSort component in src/components/storefront/product-sort.tsx - **COMPLETE**: Sorting dropdown (newest, oldest, name, price, popular)
- [x] **NEW**: T114d [US3a] Create Pagination component in src/components/ui/pagination.tsx - **COMPLETE**: Page navigation with prev/next buttons and page numbers
- [x] **NEW**: T114e [US3a] Create Skeleton component in src/components/ui/skeleton.tsx - **COMPLETE**: Loading placeholder component
- [x] T115 [US3a] [P] Create Product Details page in src/app/(storefront)/products/[slug]/page.tsx with image gallery, variants, and add to cart - **COMPLETE**: 5 components (ProductImageGallery, ProductInfo, ProductTabs, RelatedProducts + main page) with breadcrumbs, variant selection, quantity controls, zoom functionality
- [x] T116 [US3a] [P] Create Category page in src/app/(storefront)/categories/[slug]/page.tsx with category products and breadcrumbs - **COMPLETE**: Server Component with breadcrumb navigation, subcategories display, product filtering, sorting, pagination
- [x] T117 [US3a] [P] Create Search Results page in src/app/(storefront)/search/page.tsx with search query highlighting and filters - **COMPLETE**: Server Component with search header, query highlighting, empty state, search tips, product grid with filters
- [x] T118 [US3a] [P] Create Cart page in src/app/(storefront)/cart/page.tsx with cart items, quantity controls, and checkout button - **COMPLETE**: Client Component with cart items list, quantity controls (+/-), remove button, subtotal/total display, checkout CTA, empty state
- [x] T119 [US3a] [P] Create useCart hook in src/hooks/use-cart.ts with add, remove, update quantity, and cart state management - **COMPLETE**: localStorage persistence, addItem, removeItem, updateQuantity, clearCart, getItem, isInCart, totalItems, totalPrice calculations
- [x] T120 [US3a] [P] Create Homepage in src/app/(storefront)/page.tsx with featured products, categories, and hero banner - **COMPLETE**: Hero section, featured products grid (8 items), category showcase (6 categories), CTAs, responsive layout
- [x] T121 [US3a] Create E2E test "Customer can browse products and view details" in tests/e2e/storefront/browse-products.spec.ts - **COMPLETE**: 14 test scenarios covering homepage display, product grid navigation, category/price filtering, sorting, product detail page, image gallery navigation, product tabs, breadcrumb navigation, related products, search functionality, empty state handling, pagination filter persistence
- [x] T122 [US3a] Create E2E test "Customer can add product to cart" in tests/e2e/storefront/add-to-cart.spec.ts - **COMPLETE**: 14 test scenarios covering quick add from product card with toast notification, add from detail page with variant selection, cart display with items/quantities/totals, quantity updates (increase/decrease), remove items, empty cart state, cart persistence across reloads/navigation, out-of-stock prevention, loading skeleton, multiple items subtotal calculation, maximum quantity limit enforcement

---

## Phase 8: US3 - Checkout Process (P1 - Must Have)

**User Story**: As a Customer, I need to enter shipping information, select payment method, and complete my purchase securely to receive my products.

**Why P1**: Checkout is the final step in the purchase flow. Without this, customers cannot complete orders and generate revenue.

**Depends On**: US2 (Products), US6 (Inventory), US3a (Storefront/Cart)

**Independent Test**: Add product to cart. Proceed to checkout. Enter shipping address. Select payment method (Stripe). Complete payment. Verify order confirmation email. Verify order appears in admin dashboard.

**Tasks**:

- [ ] T123 [US3] Create CheckoutService in src/services/checkout-service.ts with cart validation, shipping calculation, and order creation
- [ ] T124 [US3] Create PaymentService in src/services/payment-service.ts with Stripe integration (payment intents, webhooks, refunds)
- [ ] T125 [US3] [P] Create API route POST /api/checkout/validate in src/app/api/checkout/validate/route.ts for cart and stock validation
- [ ] T126 [US3] [P] Create API route POST /api/checkout/shipping in src/app/api/checkout/shipping/route.ts for shipping options and rates
- [ ] T127 [US3] [P] Create API route POST /api/checkout/payment-intent in src/app/api/checkout/payment-intent/route.ts for creating Stripe payment intent
- [ ] T128 [US3] [P] Create API route POST /api/checkout/complete in src/app/api/checkout/complete/route.ts for finalizing order and creating Order record
- [ ] T129 [US3] [P] Create API route POST /api/webhooks/stripe in src/app/api/webhooks/stripe/route.ts for Stripe webhook events (payment succeeded, failed)
- [ ] T130 [US3] [P] Create Checkout page in src/app/(storefront)/checkout/page.tsx with multi-step form (shipping, payment, review)
- [ ] T131 [US3] [P] Create Shipping Address form in src/components/checkout/shipping-address-form.tsx with address validation
- [ ] T132 [US3] [P] Create Payment Method selector in src/components/checkout/payment-method-selector.tsx with Stripe Elements integration
- [ ] T133 [US3] [P] Create Order Review component in src/components/checkout/order-review.tsx with order summary and place order button
- [ ] T134 [US3] [P] Create Order Confirmation page in src/app/(storefront)/orders/[id]/confirmation/page.tsx with order details and tracking
- [ ] T135 [US3] Create E2E test "Customer can complete checkout with credit card" in tests/e2e/checkout/complete-checkout.spec.ts
- [ ] T136 [US3] Create E2E test "Checkout fails when stock is insufficient" in tests/e2e/checkout/stock-validation.spec.ts

---

## Phase 9: US4 - Order Management (P1 - Must Have)

**User Story**: As a Store Admin, I need to view, manage, and fulfill customer orders to ensure timely delivery and customer satisfaction.

**Why P1**: Order management is essential for fulfilling customer purchases. Without this, Store Admins cannot process orders, update statuses, or manage fulfillment.

**Depends On**: US3 (Checkout - orders must be created first)

**Independent Test**: View order list with filters (pending, processing, shipped, delivered). Click order to view details with customer info, products, and payment status. Update order status to "shipped". Generate invoice PDF. Send tracking email to customer.

**Tasks**:

- [ ] T137 [US4] Create OrderService in src/services/order-service.ts with list, get, update status, generate invoice, and send tracking operations
- [ ] T138 [US4] [P] Create API route GET /api/orders in src/app/api/orders/route.ts for listing orders with pagination, search, and status filters
- [ ] T139 [US4] [P] Create API route GET /api/orders/[id] in src/app/api/orders/[id]/route.ts for retrieving order details with customer, products, payments
- [ ] T140 [US4] [P] Create API route PUT /api/orders/[id]/status in src/app/api/orders/[id]/status/route.ts for updating order status (processing, shipped, delivered)
- [ ] T141 [US4] [P] Create API route GET /api/orders/[id]/invoice in src/app/api/orders/[id]/invoice/route.ts for generating invoice PDF
- [ ] T142 [US4] [P] Create Orders List page in src/app/(dashboard)/orders/page.tsx with data table, filters, and export button
- [ ] T143 [US4] [P] Create Order Details page in src/app/(dashboard)/orders/[id]/page.tsx with customer info, products, payment, shipping, and status timeline
- [ ] T144 [US4] [P] Create Update Order Status form in src/components/orders/update-status-form.tsx with status dropdown and tracking number input
- [ ] T145 [US4] Create E2E test "Store Admin can view and update order status" in tests/e2e/orders/manage-orders.spec.ts
- [ ] T146 [US4] Create E2E test "Store Admin can generate invoice PDF" in tests/e2e/orders/generate-invoice.spec.ts

---

## Phase 10: US5 - Subscription Management (P1 - Must Have)

**User Story**: As a Super Admin, I need to manage subscription plans (Free, Basic, Pro, Enterprise) and enforce plan limits to monetize the platform.

**Why P1**: Subscriptions are the revenue model for the SaaS platform. Without this, stores cannot be charged, and the platform cannot generate revenue.

**Depends On**: US1 (Store)

**Independent Test**: Create subscription plans with different product limits. Assign Free plan to new store. Attempt to create 6 products (limit is 5). Verify error. Upgrade to Pro plan. Verify product limit increased to 500.

**Tasks**:

- [ ] T147 [US5] Create SubscriptionService in src/services/subscription-service.ts with plan assignment, limit enforcement, and usage tracking
- [ ] T148 [US5] Create Stripe subscription integration in src/lib/stripe-subscription.ts with plan creation, checkout sessions, and webhooks
- [ ] T149 [US5] [P] Create API route POST /api/subscriptions in src/app/api/subscriptions/route.ts for creating Stripe checkout session
- [ ] T150 [US5] [P] Create API route GET /api/subscriptions/[storeId] in src/app/api/subscriptions/[storeId]/route.ts for retrieving subscription status
- [ ] T151 [US5] [P] Create API route POST /api/subscriptions/[storeId]/cancel in src/app/api/subscriptions/[storeId]/cancel/route.ts for canceling subscriptions
- [ ] T152 [US5] [P] Create API route POST /api/webhooks/stripe/subscription in src/app/api/webhooks/stripe/subscription/route.ts for subscription events
- [ ] T153 [US5] [P] Create Subscription Plans page in src/app/(dashboard)/subscription/plans/page.tsx with plan comparison table and upgrade buttons
- [ ] T154 [US5] [P] Create Billing page in src/app/(dashboard)/subscription/billing/page.tsx with current plan, usage, and payment history
- [ ] T155 [US5] Create plan enforcement middleware in src/lib/plan-enforcement.ts to check limits before operations
- [ ] T156 [US5] Create E2E test "Store cannot exceed plan limits" in tests/e2e/subscriptions/plan-limits.spec.ts
- [ ] T157 [US5] Create E2E test "Store can upgrade subscription plan" in tests/e2e/subscriptions/upgrade-plan.spec.ts

---

## Phase 11: US7 - Analytics and Reports (P1 - Must Have)

**User Story**: As a Store Admin, I need to view sales analytics, revenue reports, and customer insights to make data-driven business decisions.

**Why P1**: Analytics provide business intelligence for Store Admins to understand performance, identify trends, and optimize operations.

**Depends On**: US4 (Orders - data source for analytics)

**Independent Test**: View dashboard with total sales, revenue, and order count for current month. Filter analytics by date range. View top-selling products report. Export sales report to CSV.

**Tasks**:

- [ ] T158 [US7] Create AnalyticsService in src/services/analytics-service.ts with sales aggregation, revenue calculation, and report generation
- [ ] T159 [US7] [P] Create API route GET /api/analytics/sales in src/app/api/analytics/sales/route.ts for sales metrics with date range filters
- [ ] T160 [US7] [P] Create API route GET /api/analytics/revenue in src/app/api/analytics/revenue/route.ts for revenue reports by period
- [ ] T161 [US7] [P] Create API route GET /api/analytics/products in src/app/api/analytics/products/route.ts for top-selling products report
- [ ] T162 [US7] [P] Create API route GET /api/analytics/customers in src/app/api/analytics/customers/route.ts for customer acquisition and retention metrics
- [ ] T163 [US7] [P] Create Analytics Dashboard in src/app/(dashboard)/analytics/page.tsx with charts, metrics cards, and date range picker
- [ ] T164 [US7] [P] Create Sales Report component in src/components/analytics/sales-report.tsx with line chart and export button
- [ ] T165 [US7] [P] Create Top Products component in src/components/analytics/top-products.tsx with bar chart and table
- [ ] T166 [US7] Create E2E test "Store Admin can view analytics dashboard" in tests/e2e/analytics/view-analytics.spec.ts

---

## Phase 12: US8 - Theme Customization (P1 - Must Have)

**User Story**: As a Store Admin, I need to customize my store's appearance (colors, fonts, logo) to match my brand identity.

**Why P1**: Theme customization allows stores to differentiate their branding and create unique customer experiences.

**Depends On**: US1 (Store settings)

**Independent Test**: Upload store logo. Change primary color to #FF5733. Change font to "Inter". Preview changes on storefront. Save theme. Verify storefront reflects new theme.

**Tasks**:

- [ ] T167 [US8] Create ThemeService in src/services/theme-service.ts with theme configuration CRUD and CSS variable generation
- [ ] T168 [US8] [P] Create API route GET /api/themes in src/app/api/themes/route.ts for listing available themes
- [ ] T169 [US8] [P] Create API route PUT /api/stores/[id]/theme in src/app/api/stores/[id]/theme/route.ts for updating store theme
- [ ] T170 [US8] [P] Create Theme Editor page in src/app/(dashboard)/settings/theme/page.tsx with color pickers, font selectors, and live preview
- [ ] T171 [US8] [P] Create theme CSS variables utility in src/lib/theme-utils.ts to generate CSS custom properties from theme config
- [ ] T172 [US8] Create dynamic theme loader in src/app/(storefront)/layout.tsx to apply store-specific theme
- [ ] T173 [US8] Create E2E test "Store Admin can customize theme" in tests/e2e/theme/customize-theme.spec.ts

---

## Phase 13: US9 - Email Notifications (P1 - Must Have)

**User Story**: As a Customer, I need to receive email notifications for order confirmation, shipping updates, and password resets to stay informed about my account and orders.

**Why P1**: Email notifications are essential for customer communication, order confirmations, and account security.

**Depends On**: US0 (Auth), US4 (Orders)

**Independent Test**: Place order. Verify order confirmation email received. Update order status to "shipped". Verify shipping confirmation email with tracking link. Reset password. Verify password reset email.

**Tasks**:

- [ ] T174 [US9] Create EmailService in src/services/email-service.ts with Resend integration and email template rendering
- [ ] T175 [US9] [P] Create email template for order confirmation in src/emails/order-confirmation.tsx using React Email
- [ ] T176 [US9] [P] Create email template for shipping confirmation in src/emails/shipping-confirmation.tsx
- [ ] T177 [US9] [P] Create email template for password reset in src/emails/password-reset.tsx
- [ ] T178 [US9] [P] Create email template for account verification in src/emails/account-verification.tsx
- [ ] T179 [US9] [P] Create API route POST /api/emails/send in src/app/api/emails/send/route.ts for sending emails via Resend
- [ ] T180 [US9] Create email sending hooks in order and auth workflows to trigger notifications
- [ ] T181 [US9] Create E2E test "Customer receives order confirmation email" in tests/e2e/emails/order-confirmation.spec.ts

---

## Phase 14: US11 - Audit Logs (P1 - Must Have)

**User Story**: As a Super Admin, I need to view audit logs of all critical actions (user login, order creation, product updates) to ensure accountability and troubleshoot issues.

**Why P1**: Audit logs provide accountability, security monitoring, and debugging capabilities for the platform.

**Depends On**: US0 (Auth), US1 (Store), US2 (Products), US4 (Orders)

**Independent Test**: Login as Store Admin. Create product. Update order status. View audit logs. Verify login, product creation, and order update events are logged with timestamps and user info.

**Tasks**:

- [ ] T182 [US11] Create AuditLogService in src/services/audit-log-service.ts with log creation and retrieval operations
- [ ] T183 [US11] Create audit logging middleware in src/lib/audit-middleware.ts to automatically log API calls
- [ ] T184 [US11] [P] Create API route GET /api/audit-logs in src/app/api/audit-logs/route.ts for retrieving logs with filters (entity, action, user, date)
- [ ] T185 [US11] [P] Create Audit Logs page in src/app/(dashboard)/audit-logs/page.tsx with filterable data table
- [ ] T186 [US11] Create E2E test "Audit logs capture critical actions" in tests/e2e/audit/audit-logging.spec.ts

---

## Phase 15: US12 - Security Hardening (P1 - Must Have)

**User Story**: As a Platform Owner, I need to ensure the platform is secure with encryption, HTTPS, secure headers, and vulnerability scanning to protect user data and prevent attacks.

**Why P1**: Security is non-negotiable for handling customer data, payments, and sensitive business information.

**Independent Test**: Run security scan with npm audit. Verify no critical vulnerabilities. Test CSRF protection by submitting form without token. Verify rejection. Test rate limiting by sending 110 requests. Verify 429 Too Many Requests after 100.

**Tasks**:

- [ ] T187 [US12] [P] Enable HTTPS-only in production via Vercel configuration
- [ ] T188 [US12] [P] Implement Content Security Policy in src/middleware.ts with strict directives
- [ ] T189 [US12] [P] Setup automated dependency scanning with GitHub Dependabot in .github/dependabot.yml
- [ ] T190 [US12] [P] Create security headers test in tests/integration/security/headers.test.ts to verify CSP, HSTS, X-Frame-Options
- [ ] T191 [US12] [P] Implement input sanitization utility in src/lib/sanitize.ts for XSS prevention
- [ ] T192 [US12] Create E2E test "CSRF protection blocks unauthorized requests" in tests/e2e/security/csrf-protection.spec.ts
- [ ] T193 [US12] Create E2E test "Rate limiting enforces request limits" in tests/e2e/security/rate-limiting.spec.ts

---

## Phase 16: US14 - GDPR Compliance (P1 - Must Have)

**User Story**: As a Customer, I need to request my personal data export, request data deletion, and manage cookie consent to comply with GDPR regulations.

**Why P1**: GDPR compliance is legally required for serving European customers and builds trust with users.

**Depends On**: US0 (Auth), US1 (Store)

**Independent Test**: Login as Customer. Request data export. Verify email with download link. Download JSON file with all personal data. Request account deletion. Verify account marked for deletion. Verify cookie consent banner on first visit.

**Tasks**:

- [ ] T194 [US14] Create GDPRService in src/services/gdpr-service.ts with data export, deletion request, and consent management
- [ ] T195 [US14] [P] Create API route POST /api/gdpr/export in src/app/api/gdpr/export/route.ts for user data export
- [ ] T196 [US14] [P] Create API route POST /api/gdpr/delete in src/app/api/gdpr/delete/route.ts for account deletion request
- [ ] T197 [US14] [P] Create API route POST /api/gdpr/consent in src/app/api/gdpr/consent/route.ts for cookie consent tracking
- [ ] T198 [US14] [P] Create Privacy Settings page in src/app/(dashboard)/settings/privacy/page.tsx with data export and deletion buttons
- [ ] T199 [US14] [P] Create Cookie Consent banner in src/components/gdpr/cookie-consent.tsx with accept/reject buttons
- [ ] T200 [US14] Create E2E test "User can export personal data" in tests/e2e/gdpr/data-export.spec.ts
- [ ] T201 [US14] Create E2E test "User can request account deletion" in tests/e2e/gdpr/data-deletion.spec.ts

---

## Phase 17: US10 - Notifications (P2 - Should Have)

**User Story**: As a Store Admin or Customer, I need to receive in-app notifications for important events (new orders, low stock, order shipped) to stay informed without checking emails.

**Why P2**: In-app notifications improve user engagement but are not essential for core e-commerce functionality. Email notifications (US9) cover critical communication needs.

**Depends On**: US4 (Orders), US6 (Inventory)

**Independent Test**: Login as Store Admin. Receive in-app notification for new order. Click notification to view order details. Login as Customer. Receive notification when order ships. Mark notification as read.

**Tasks**:

- [ ] T202 [US10] Create NotificationService in src/services/notification-service.ts with create, list, mark as read, and delete operations
- [ ] T203 [US10] [P] Create API route GET /api/notifications in src/app/api/notifications/route.ts for retrieving user notifications
- [ ] T204 [US10] [P] Create API route PUT /api/notifications/[id]/read in src/app/api/notifications/[id]/read/route.ts for marking as read
- [ ] T205 [US10] [P] Create Notifications dropdown in src/components/layout/notifications-dropdown.tsx with unread count badge
- [ ] T206 [US10] [P] Create useNotifications hook in src/hooks/use-notifications.ts with real-time updates via polling or WebSockets
- [ ] T207 [US10] Create notification triggers in order and inventory workflows
- [ ] T208 [US10] Create E2E test "User receives in-app notification" in tests/e2e/notifications/in-app-notifications.spec.ts

---

## Phase 18: US13 - External Platform Integration (P2 - Should Have)

**User Story**: As a Store Admin, I need to integrate with external platforms (Shopify, WooCommerce, Mailchimp) to sync products, orders, and customer data.

**Why P2**: External integrations expand functionality but are not essential for the core e-commerce platform. The platform is fully functional without external integrations.

**Depends On**: US2 (Products), US4 (Orders)

**Independent Test**: Connect Mailchimp account. Sync customer list. Verify contacts appear in Mailchimp. Create product in StormCom. Export to Shopify. Verify product appears in Shopify admin.

**Tasks**:

- [ ] T209 [US13] Create IntegrationService in src/services/integration-service.ts with OAuth flow, token management, and API client wrappers
- [ ] T210 [US13] [P] Create API route POST /api/integrations/mailchimp/connect in src/app/api/integrations/mailchimp/connect/route.ts for Mailchimp OAuth
- [ ] T211 [US13] [P] Create API route POST /api/integrations/mailchimp/sync in src/app/api/integrations/mailchimp/sync/route.ts for customer sync
- [ ] T212 [US13] [P] Create API route POST /api/integrations/shopify/connect in src/app/api/integrations/shopify/connect/route.ts for Shopify OAuth
- [ ] T213 [US13] [P] Create API route POST /api/integrations/shopify/export in src/app/api/integrations/shopify/export/route.ts for product export
- [ ] T214 [US13] [P] Create Integrations page in src/app/(dashboard)/integrations/page.tsx with available integrations and connect buttons
- [ ] T215 [US13] Create E2E test "Store Admin can connect Mailchimp and sync customers" in tests/e2e/integrations/mailchimp.spec.ts

---

## Phase 19: Polish and Cross-Cutting Concerns

**Goal**: Final touches, performance optimizations, and developer experience improvements

**Tasks**:

- [ ] T216 [P] Setup error monitoring with Sentry in src/lib/sentry.ts (configure DSN from env, setup environment tags, enable release tracking, add breadcrumbs for user actions, configure sample rate for production)
- [ ] T217 [P] Implement search optimization with Typesense in src/lib/search.ts (configure products collection with indexed fields: name, description, category, brand, SKU; setup autocomplete with typo tolerance of 2, enable relevance scoring with custom weights, configure synonyms for common product terms)
- [ ] T218 [P] Add image optimization pipeline with Sharp in src/lib/image-optimization.ts (support formats: JPEG, PNG, WebP, AVIF; create resize presets: thumbnail 150px, small 300px, medium 600px, large 1200px; set quality: 80 for JPEG, 85 for WebP; enable progressive JPEG and lossless WebP)
- [ ] T219 [P] Create API documentation with Swagger UI in src/app/api/docs/route.ts
- [ ] T220 [P] Setup performance monitoring with Vercel Analytics in src/app/layout.tsx
- [ ] T221 [P] Create development seed script with realistic data in scripts/seed-dev.ts
- [ ] T222 [P] Add database backup script in scripts/backup-db.sh
- [ ] T223 [P] Create deployment checklist in docs/deployment-checklist.md
- [ ] T224 [P] Setup automated E2E tests in CI/CD pipeline in .github/workflows/e2e.yml
- [ ] T225 [P] Create developer onboarding guide in docs/developer-guide.md

---

## Dependencies

This section outlines the recommended order for completing user stories based on their dependencies.

**Story Completion Order**:

1. **Phase 1-2**: Setup & Foundational (T001-T035) - Must complete first
2. **Phase 3**: US0 Authentication (T036-T060) - Blocking for all other features
3. **Phase 4**: US1 Store Management (T061-T075) - Required for multi-tenancy
4. **Parallel - Group A** (Can be completed in any order after US0 + US1):
   - Phase 10: US5 Subscriptions (T147-T157)
   - Phase 12: US8 Theme (T167-T173)
   - Phase 13: US9 Email (T174-T181)
   - Phase 14: US11 Audit Logs (T182-T186)
   - Phase 15: US12 Security (T187-T193)
5. **Phase 5**: US2 Product Catalog (T076-T106) - Required for inventory and storefront
6. **Phase 6**: US6 Inventory (T107-T112) - Depends on US2
7. **Phase 7**: US3a Storefront (T113-T122) - Depends on US2
8. **Parallel - Group B** (Can be completed in any order after US2 + US6):
   - Phase 8: US3 Checkout (T123-T136)
9. **Phase 9**: US4 Orders (T137-T146) - Depends on US3
10. **Parallel - Group C** (Can be completed after US4):
    - Phase 11: US7 Analytics (T158-T166) - Depends on US4
    - Phase 16: US14 GDPR (T194-T201) - Depends on US0 + US1
11. **P2 Stories** (Can be completed anytime after core features):
    - Phase 17: US10 Notifications (T202-T208) - Depends on US4 + US6
    - Phase 18: US13 External Integrations (T209-T215) - Depends on US2 + US4
12. **Phase 19**: Polish (T216-T225) - Final improvements

**Critical Path (MVP)**:
Setup → Foundational → US0 → US1 → US2 → US6 → US3a → US3 → US4

---

## Parallel Execution Examples

Tasks marked with `[P]` can be executed in parallel with other `[P]` tasks within the same phase or across phases at the same dependency level.

**Within Phase 2 (Foundational)** - All tasks T024-T035 can be parallelized:
- Security middleware (T026, T027, T028)
- Utilities (T024, T025, T029, T030, T031)
- UI components (T032, T033, T034, T035)

**Within Phase 3 (US0 Authentication)** - All API routes (T040-T047) and UI pages (T048-T052) can be parallelized.

**Within Phase 5 (US2 Product Catalog)** - All API routes (T082-T094) and UI pages (T095-T102) can be parallelized.

**Across Phases (Parallel Group A)** - After US0 + US1 complete:
- US5, US8, US9, US11, US12 can all be worked on simultaneously by different team members

---

## Summary

**Total Tasks**: 239 (updated from 225 after adding missing E2E tests)
**Phases**: 19 (Setup, Foundational, 13 User Stories, Polish)
**User Stories**: 15 (US0-US14 mapped)
**P0 (Blocking)**: 1 story (US0 - 39 tasks, including 19 E2E tests)
**P1 (Must Have)**: 12 stories (US1-US9, US11-US12, US14 - ~170 tasks)
**P2 (Should Have)**: 2 stories (US10, US13 - ~14 tasks)
**Setup & Polish**: ~30 tasks

**Format Validation**:
- ✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
- ✅ [Story] labels only on user story tasks (not Setup, Foundational, or Polish)
- ✅ [P] markers only on parallelizable tasks (different files, no dependencies)
- ✅ Every task includes exact file path for implementation
- ✅ E2E tests included per spec.md scenarios (UPDATED: 14 additional E2E tests added for US0)
- ✅ Tasks organized by user story (PRIMARY), not technical layer
- ✅ Each story phase independently testable

**Testing Coverage**:
- Unit/Integration tests: ~25 test files
- E2E tests: ~44 test scenarios (updated from ~30 after adding US0 coverage)
- Coverage targets: 80%+ for business logic, 100% for critical paths

**Estimated Implementation Time** (based on 2-hour average per task):
- Setup & Foundational: ~15 days (1 developer)
- US0 Authentication: ~12 days (1 developer)
- MVP (US0 → US4): ~45 days (3 developers in parallel)
- All P1 Stories: ~85 days (4 developers in parallel)
- Complete Platform (P1 + P2 + Polish): ~110 days (4 developers)

---

**Next Steps**:
1. Review and approve this task breakdown
2. Import tasks into project management tool (GitHub Projects, Jira, Linear)
3. Assign tasks to team members based on expertise
4. Begin with Setup & Foundational (T001-T035)
5. Complete US0 Authentication as top priority
6. Parallelize remaining user stories per dependency order

---

*Generated by GitHub Copilot Coding Agent following spec-driven development methodology*
