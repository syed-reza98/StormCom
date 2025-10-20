# Feature Specification: StormCom Multi-tenant E‑commerce Platform

**Feature Branch**: `001-multi-tenant-ecommerce`  
**Created**: 2025-10-17  
**Status**: Draft  
**Input**: High-level request to build “StormCom,” a multi-tenant e‑commerce SaaS enabling businesses to manage products, orders, inventory, customers, marketing, content, POS, themes, and security with strong tenant isolation and a unified super admin dashboard.

## Clarifications

### Session 2025-10-17

- Q: Which SSO standard(s)/provider scope should be supported for enterprise SSO? → A: OIDC + SAML (both)
- Q: Which MFA method(s) should be supported? → A: Adopt the recommended stack: TOTP authenticator apps (RFC 6238) as the primary method with one‑time recovery codes; optional SMS fallback (opt‑in per tenant); optional WebAuthn/FIDO2 security keys for enterprises.
- Q: External platform sync (scope, direction, frequency)? → A: Real-time bidirectional sync with webhooks for immediate data consistency in both directions, including conflict resolution strategies.
- Q: What are the scalability targets per store before performance degradation? → A: Mid-market scale - Up to 10K products, 1M orders/year (≈83K orders/month), 250K customers per store.
- Q: What uptime SLA should StormCom guarantee? → A: 99.9% uptime (≈43 minutes downtime/month) - standard SaaS reliability target.
- Q: What data retention policy should be enforced for compliance? → A: Standard retention - 3 years for orders/invoices, 1 year for audit logs, 90 days for backups.
- Q: What API rate limiting strategy should be enforced? → A: Tiered rate limiting by subscription plan - Free (60 req/min), Basic (120 req/min), Pro (300 req/min), Enterprise (1000 req/min).

### Session 2025-10-20

- Q: How should the Role/Permission system be modeled in the database to support granular permissions? → A: Predefined roles with fixed permissions (no custom roles in Phase 1)
- Q: How should user sessions be stored to support fast invalidation (<60s) while maintaining scalability? → A: JWT + Server-side session store with environment-based implementation: Vercel KV (Redis) in production for <10ms lookups and immediate invalidation; in-memory Map fallback for local development (no Redis dependency). Session ID stored in JWT, validated on every request.
- Q: How should MFA backup codes be stored to balance security and usability? → A: No backup codes - users must use authenticator app only (TOTP required for MFA-enabled accounts).
- Q: Should Super Admins be required to use MFA, or should it be optional like other user types? → A: Optional MFA for Super Admins (same as other users) - maintains consistency but may reduce security for privileged accounts.

## Technical Assumptions

### Infrastructure & Deployment (Vercel Platform)

- **Vercel Serverless Functions**: 10-second timeout (Hobby/Pro tier), 60-second timeout (Enterprise tier with advance request); 1024MB memory default, configurable up to 3008MB on Enterprise.
- **Database**: PostgreSQL 15+ required for full-text search with pg_trgm extension (trigram similarity for autocomplete); pg_stat_statements for query performance monitoring.
- **CDN**: Vercel Edge Network for static assets (images, CSS, JS) with automatic global distribution and cache invalidation.
- **Email Service**: Resend transactional email service; rate limit 100 emails/hour (Free tier), 1000/hour (Pro tier); batch sending for newsletters uses 5req/sec throttling.

### Browser Support & Compatibility

- **Supported Browsers**: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+, mobile Safari iOS 14+, Chrome Android 90+.
- **Responsive Breakpoints**: 640px (sm), 768px (md), 1024px (lg), 1280px (xl), 1536px (2xl) - mobile-first approach.
- **JavaScript**: ES2020+ features; no IE11 support; polyfills only for Safari 14 (Promise.allSettled, String.replaceAll).
- **Progressive Enhancement**: Core checkout flow works without JavaScript (server-side rendering + forms); enhanced features (autocomplete, real-time validation) require JavaScript.

### Performance & Scalability Assumptions

- **Concurrent Users**: 100 concurrent users per store (95th percentile); above this threshold may require plan upgrade or Enterprise tier with dedicated resources.
- **API Request Distribution**: Assumes even distribution across 60-second rate limit window; burst protection via Vercel KV (Redis) sliding window counter.
- **Database Connections**: Prisma connection pool default 5 connections per serverless function instance; total connections limited by PostgreSQL max_connections (100 on standard tier).
- **File Storage**: Vercel Blob for product images/invoices; 100MB max file size per upload; images auto-optimized to WebP with srcset for responsive loading.
- **Search Performance**: PostgreSQL Full-Text Search <1s response for catalogs up to 10K products; beyond 10K products recommend Algolia upgrade (Phase 2).

### External Platform API Versions

- **WooCommerce**: REST API v3 (WooCommerce 3.5+); requires JWT authentication plugin for secure API access.
- **Shopify**: Admin API 2024-01 (stable version); uses private app credentials with scopes: read_products, write_products, read_orders, write_orders, read_inventory, write_inventory.
- **SSLCommerz**: Sandbox API v4 for testing; production IPN (Instant Payment Notification) v3 for payment confirmation webhooks.
- **Stripe**: API version 2023-10-16; uses webhook v1 with signature verification (HMAC-SHA256).

### Security & Compliance Assumptions

- **Password Policy**: Minimum 8 characters; requires uppercase, lowercase, number, and special character; password history (last 5 passwords) checked; bcrypt cost factor 12.
- **Session Management**: JWT tokens with 30-day absolute expiration, 7-day idle timeout (sliding window); stored in HTTP-only, Secure, SameSite=Lax cookies. **Session storage**: Vercel KV (Redis-compatible) in production for <10ms validation and immediate invalidation; in-memory Map in local development (no Redis setup required). Session ID embedded in JWT; validated on every API request.
- **HTTPS**: TLS 1.3 enforced via Vercel; HSTS headers with max-age=31536000 (1 year); automatic certificate renewal via Let's Encrypt.
- **CORS**: Allowed origins configurable per store (default: same-origin only); API endpoints support CORS preflight with credentials.
- **PCI Compliance**: Level 1 PCI-DSS compliance by never storing card data; relying on payment gateway tokenization (Stripe/SSLCommerz hosted checkout or Elements/JS SDK).

### Data & Timestamps

- **Server Time**: All timestamps use server-side UTC; stored as ISO 8601 in database (timestamptz in PostgreSQL).
- **Client Timezone**: Detected via browser timezone offset; user preference stored in profile; all times displayed in user's local timezone with offset indicator.
- **Order Timestamps**: Server time is canonical; client-submitted timestamps ignored to prevent manipulation or time drift issues.
- **Scheduled Tasks**: Cron jobs use UTC; flash sales/promotions start/end times stored in UTC and converted to store timezone for display.

### Guest User Experience

- **Cart Persistence**: Guest carts stored in session (cookie-based; 7-day expiration); logged-in user carts stored in database (permanent until cart expiration or order completion).
- **Session Duration**: Guest sessions expire after 7 days of inactivity; guest checkout preserves cart through email verification flow.
- **Data Migration**: Guest cart auto-migrates to user account on login/registration; duplicate items merged with quantity summed.

### Internationalization (Phase 1 Scope)

- **Default Language**: English only in Phase 1; UI, emails, and error messages in English.
- **Phase 2 Multi-language**: 16 languages planned (ar, da, de, en, es, fr, he, it, ja, nl, pl, pt, pt-br, ru, tr, zh); RTL support for Arabic/Hebrew.
- **Currency Display**: Store base currency only in Phase 1; Phase 2 adds multi-currency with manual exchange rates updated daily.
- **Date/Time Format**: ISO 8601 in API; localized display in UI (YYYY-MM-DD for en-US, DD/MM/YYYY for en-GB based on user locale).

## User Scenarios & Testing (mandatory)


### User Story 0 - Authentication and Authorization (Priority: P0)

As a Super Admin, Store Admin, Staff member, or Customer, I need to authenticate securely with my credentials to access the appropriate areas of the system based on my role.

**Why this priority**: Authentication is the entry point to the entire system. Without secure login, no user can access any functionality. This is a P0 (blocking) priority because all other features depend on it.


**UI Interface Requirements:**

**Login Page (Dashboard):**
- Must include: labeled email and password fields, "Forgot Password" link, "Sign In" button, and a visible loading indicator on submit.
- Error messages must be shown inline directly below the relevant field for all validation and authentication errors (e.g., invalid email, incorrect password, locked account, network failure).
- Layout must use a centered card with clear visual hierarchy: logo at top, dashboard branding, form fields, and action buttons. All spacing, font sizes, and button prominence must be specified in the wireframe.
- Accessibility: All elements must be reachable by keyboard (tab order), have ARIA labels, and provide visible focus indicators. Screen reader labels must match visible labels. Color contrast must meet WCAG 2.1 AA.
- Responsive: Layout must adapt to mobile, tablet, and desktop breakpoints as per design system. Minimum touch target size 44x44px.
- Loading and feedback: While submitting, the "Sign In" button must show a spinner and be disabled. On error, the form must display a clear error message and restore focus to the first invalid field.
- Edge cases: Requirements must specify behavior for network failure (show error banner), slow loading (show spinner for >1s), and form resubmission (prevent double submit).
- Wireframe: [Login Page Wireframe] must specify all element positions, spacing, and error/empty/loading states.

**Register Page (Dashboard):**
- Must include: labeled fields for name, email, password, confirm password, a password requirements checklist (showing which criteria are met), "Sign Up" button, and a link to the login page.
- Error messages must be shown inline below each field for all validation errors (e.g., invalid email, password mismatch, weak password, duplicate email, network failure).
- Password requirements checklist must update in real time as the user types, with each requirement (min length, uppercase, etc.) shown as checked/unchecked.
- Layout, accessibility, and responsiveness must match the Login page requirements.
- Loading and feedback: While submitting, the "Sign Up" button must show a spinner and be disabled. On error, the form must display a clear error message and restore focus to the first invalid field.
- Edge cases: Requirements must specify behavior for network failure, slow loading, and form resubmission.
- Wireframe: [Register Page Wireframe] must specify all element positions, spacing, and error/empty/loading states.

**Logout:**
- Logout action must be available in the dashboard user menu (top right avatar dropdown), with a clear label and accessible via keyboard and screen reader.
- On logout, the user must be redirected to the login page with a visible message: "You have been logged out." The message must be announced to screen readers.
- Menu must be fully keyboard accessible (open/close, navigate, select), and meet WCAG 2.1 AA.

**Wireframe Documentation Requirements:**
- Wireframes for Login and Register pages must be included in the design documentation (docs/audit/login-register-wireframes.md) and reviewed for accessibility, responsive layout, and error/loading/empty states. All element positions, spacing, and visual hierarchy must be specified.

**Non-Functional Requirements:**
- All UI flows must meet WCAG 2.1 AA accessibility, be responsive across breakpoints, and handle all error and edge cases as specified. Color contrast, focus indicators, and ARIA labeling must be testable.

**Dependencies & Assumptions:**
- UI must be implemented using Next.js App Router, shadcn/ui, and Tailwind CSS as per plan.md. Wireframes are a dependency for implementation and review.

**Ambiguities & Conflicts:**
- All terms such as "centered card layout", "dashboard branding", and "wireframe" must be defined in the design documentation. Any conflicts between UI, accessibility, and branding must be resolved in favor of accessibility.

**Independent Test**: Attempt login with valid/invalid credentials for different user types (Super Admin, Store Admin, Staff, Customer), verify role-based redirects, test "Forgot Password" flow, verify account lockout after failed attempts, confirm MFA prompt when enabled. Attempt registration and logout flows, verify UI accessibility and error handling.

**Acceptance Scenarios**:

**Super Admin Login**:

1. Given I am a Super Admin, When I navigate to `/auth/login`, Then I see a login form with email and password fields, "Forgot Password" link, and "Sign In" button, styled as per UI requirements.
2. Given I am on the login page, When I enter a valid Super Admin email and password, Then I am authenticated and redirected to the Super Admin dashboard at `/admin/dashboard`.
3. Given I am on the login page, When I enter an invalid email format (e.g., "notanemail"), Then I see an inline validation error: "Please enter a valid email address."
4. Given I am on the login page, When I enter valid email but incorrect password, Then I see an error message: "Invalid email or password. Please try again." and the failed attempt is logged.
5. Given I have entered incorrect credentials 5 times, When I attempt to login again, Then my account is locked for 15 minutes and I see: "Account locked due to too many failed login attempts. Please try again in 15 minutes or use 'Forgot Password' to reset."
6. Given I have forgotten my password, When I click "Forgot Password" and enter my email, Then I receive a password reset link via email valid for 1 hour.
7. Given I am a Super Admin with MFA enabled (optional for Super Admins), When I enter correct credentials, Then I am prompted for a 6-digit TOTP code from my authenticator app before being granted access.
8. Given I am authenticated as Super Admin, When I navigate to any store-specific page, Then I can view and manage data across all stores in the system.

**Store Admin/Staff Login**:

1. Given I am a Store Admin or Staff member, When I login successfully, Then I am redirected to my assigned store's dashboard and can only access data for my store.
2. Given I am a Staff member with limited permissions, When I attempt to access a restricted page (e.g., store settings), Then I see "403 Forbidden - You don't have permission to access this resource" and the attempt is logged in the audit trail.
3. Given my account status is set to "INACTIVE" by an admin, When I attempt to login, Then authentication fails with message: "Your account has been deactivated. Please contact your administrator."

**Customer Login**:

1. Given I am a Customer, When I login successfully from the storefront, Then I am redirected to my account page showing order history, saved addresses, and wish list.
2. Given I am a guest user who has not registered, When I view the login page, Then I also see a "Create Account" or "Register" link to sign up.
3. Given I am a logged-in Customer, When my session expires after 7 days of inactivity, Then I am automatically logged out and redirected to login page with message: "Your session has expired. Please login again."

**Session Management**:

1. Given I am logged in, When I change my password, Then all active sessions for my account are invalidated within 60 seconds and I must login again.
2. Given I am logged in on multiple devices, When an admin revokes my permissions, Then all my active sessions are terminated within 60 seconds.
3. Given I am authenticated, When I remain idle for 7 days, Then my session expires and I must login again (sliding window timeout; session expiration occurs within 60 seconds of timeout being reached).

**Password Requirements** (enforced during registration and password reset):

1. Given I am setting a new password, When I enter a password shorter than 8 characters, Then I see the error message: "Password must be at least 8 characters long."
2. Given I am setting a new password, When I enter a password without uppercase, lowercase, number, and special character, Then I see the error message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
3. Given I am changing my password, When I enter a password I've used in my last 5 passwords, Then I see the error message: "Password has been used recently. Please choose a different password."
4. Given I am setting a new password, When I meet all password requirements, Then my password is hashed using bcrypt with cost factor 12 and stored securely.

---

### User Story 1 - Create and manage a store (Priority: P1)

As a Super Admin, I create a new store (tenant), assign a Store Admin, and set basic settings so the team can start managing products and sales.

**Why this priority**: Tenant provisioning is the entry point; nothing else is possible until a store exists and is staffed.

**Independent Test**: End-to-end create store → assign admin → admin can log in and access only that store.

**Acceptance Scenarios**:

1. Given I am a Super Admin, When I create a store with a unique name and domain/slug, Then the store is created and visible in the stores list.
2. Given a new store exists, When I assign a Store Admin user, Then that user can log in and sees only their store data.
3. Given multiple stores exist, When a Store Admin navigates the dashboard, Then cross-tenant data is never visible.

---

### User Story 2 - Product catalog management with variants (Priority: P1)

As a Store Admin, I create products with variants, categories, brands, attributes, media, and labels, ensuring SKU/slug uniqueness and supporting bulk import/export.

**Why this priority**: A sellable catalog is essential to generate orders and revenue.

**Independent Test**: Create/edit/delete a product and its variants; import a CSV; export the catalog; verify uniqueness constraints.

**Acceptance Scenarios**:

1. Given a store, When I create a product with name, description, price, category, brand, attributes, and images, Then the product is saved and visible in the catalog.
2. Given existing products, When I create a variant with its own SKU and price, Then the SKU is unique per store and inventory can be tracked per variant.
3. Given a CSV import file, When I run bulk import, Then products are created/updated with validation errors reported without importing invalid rows.
4. Given a need to share data, When I export products, Then I receive a CSV/Excel file with selected fields.

---

### User Story 3 - Checkout with shipping and tax calculation (Priority: P1)

As a Customer, I complete checkout by providing shipping address, selecting shipping method, and seeing accurate tax and shipping charges, so I can complete my purchase.

**Why this priority**: Checkout is the revenue-generating step; accurate shipping and tax calculation is legally required.

**Independent Test**: Add products to cart, proceed to checkout, enter shipping address, select shipping method, verify shipping and tax calculations, complete payment.

**Acceptance Scenarios**:

1. Given items in cart and a shipping address, When I view shipping options, Then I see available shipping methods with calculated costs based on my address and cart contents.
2. Given a shipping address in a taxable region, When I view order summary, Then tax is calculated based on my address and product taxability.
3. Given free shipping threshold is met, When I view shipping options, Then free shipping is available and indicated clearly.
4. Given my address is not in any configured shipping zone, When I attempt checkout, Then I see a clear message that shipping to my location is unavailable.

---

### User Story 3a - Customer storefront browsing and shopping (Priority: P1)

As a Customer, I browse products on the storefront, search for items, add products to my cart, and manage my wish list, so I can find and purchase products easily.

**Why this priority**: Storefront is the primary customer touchpoint; browsing and discovery are essential for sales conversion.

**Independent Test**: Visit storefront home page, browse categories, search for products, filter results, view product details, add to cart, manage wish list, proceed to checkout.

**Acceptance Scenarios**:

1. Given I visit the storefront home page, When I view the page, Then I see hero banners, featured products, and category showcases configured by the store admin.
2. Given I click on a category, When the category page loads, Then I see products in that category with filters (brand, price, attributes) and sorting options.
3. Given I enter a search query, When I start typing, Then I see autocomplete suggestions, and when I submit, I see relevant results ranked by relevance.
4. Given I view a product detail page, When I see product information, Then I can view images, read description, see variants, check inventory status, read reviews/testimonials, and add to cart.
5. Given I add products to cart as a guest, When I navigate away and return, Then my cart is preserved during my session.
6. Given I am logged in, When I add products to my wish list, Then I can view and manage my wish list from my account page.

---

### User Story 4 - Order lifecycle and documents (Priority: P1)

As Staff, I process orders from pending to delivered, generate invoices/packing slips, send notifications, and handle cancellations/refunds.

**Why this priority**: Order fulfillment is the core operational process.

**Independent Test**: Place a test order, update status through all stages, generate documents, cancel/refund (including partial), and verify notifications.

**Acceptance Scenarios**:

1. Given a new order, When I confirm it, Then stock deducts appropriately and an order number is generated.
2. Given a confirmed order, When I ship it, Then a packing slip is generated and the customer receives a shipment notification.
3. Given an order with returned items, When I create a partial refund, Then the refund amount cannot exceed captured payment and returned items restock if configured.
4. Given unpaid orders after the configured window, When the auto-cancel job runs, Then those orders are canceled and stock is restored.

---

### User Story 5 - Subscription plan selection and limits (Priority: P1)

As a Store Owner, I select a subscription plan appropriate for my business size, and the system enforces plan limits to ensure fair usage.

**Why this priority**: Plan management is essential for SaaS monetization and resource allocation.

**Independent Test**: Create a store on Free plan, attempt to exceed limits, upgrade to Pro plan, verify new limits apply.

**Acceptance Scenarios**:

1. Given I am on the Free plan with 10 product limit, When I attempt to create the 11th product, Then creation is blocked with a clear message to upgrade.
2. Given I upgrade from Basic to Pro, When the upgrade completes, Then new limits apply immediately and I can access previously restricted features.
3. Given my plan expires, When I attempt to access my store, Then I see a notice about expiration and can access data in read-only mode during grace period.
4. Given I reach 80% of my plan limit, When I view dashboard, Then I see a warning notification about approaching limit.

---

### User Story 6 - Inventory tracking and alerts (Priority: P1)

As a Store Admin, I maintain accurate stock per product/variant with audit trails and receive low‑stock alerts.

**Why this priority**: Prevents overselling and ensures replenishment.

**Independent Test**: Adjust stock manually, confirm an order to deduct stock, cancel/refund to restore stock, verify low‑stock alert is triggered.

**Acceptance Scenarios**:

1. Given a product variant, When I set stock to a value, Then that change is recorded in an audit trail with actor, reason, and timestamp.
2. Given a low‑stock threshold, When stock falls below it, Then an alert appears on the dashboard and optional notification is sent.
3. Given concurrent orders, When stock would go negative, Then the second order fails with a clear message and no negative stock occurs.

---

### User Story 12 - Security and access control (Priority: P1)

As a Security Admin, I enforce strong passwords, MFA, account lockouts, RBAC, and audit logs.

**Independent Test**: Configure password rules, enable MFA, trigger lockout by repeated failures, review permissions and audit trails.

**Acceptance Scenarios**:

1. Given password requirements, When a weak password is used, Then the system rejects it with guidance.
2. Given MFA enabled, When a user logs in, Then a second factor is required.
3. Given RBAC policies, When a user without permission attempts an action, Then access is denied and logged.

---

### User Story 13 - External platform integration (Priority: P2)

As a Store Owner, I synchronize my store data with external e-commerce platforms (WooCommerce, Shopify) to maintain multi-channel presence.

**Independent Test**: Configure platform connection with API credentials, initiate manual sync, verify data consistency, review sync logs, test conflict resolution, validate webhook processing.

**Acceptance Scenarios**:

1. Given WooCommerce or Shopify API credentials, When I connect my external platform, Then the system validates the connection and stores encrypted credentials.
2. Given a connected external platform, When I initiate a sync, Then products, inventory, orders, and customers are synchronized bidirectionally according to configured direction.
3. Given conflicting updates on both platforms, When sync detects the conflict, Then the configured conflict resolution strategy (last-write-wins, manual queue, or priority rules) is applied and the result is logged.
4. Given sync is running, When an error occurs (network failure, API rate limit, invalid data), Then the operation is queued for retry with exponential backoff and the admin is notified.
5. Given webhooks configured on external platform, When data changes externally, Then the system receives webhook events and processes updates in real-time.

---

### User Story 14 - GDPR compliance and data privacy (Priority: P1)

As a Store Owner, I comply with GDPR regulations by managing customer consent, handling data access requests, and supporting data deletion.

**Independent Test**: Capture customer consent during registration, process data export request, anonymize customer data per deletion request, review consent audit logs.

**Acceptance Scenarios**:

1. Given a new customer registration, When the customer registers, Then explicit consent for data processing and marketing communications is captured with timestamp and audit trail.
2. Given a customer data access request, When I initiate the export, Then the system generates a machine-readable JSON or CSV file containing all personal data associated with that customer within 72 hours (GDPR requirement).
3. Given a customer data deletion request, When I confirm the deletion, Then all personal data is anonymized (replaced with "Deleted User" placeholders) while preserving order history for accounting compliance, and the deletion is logged in the audit trail.
4. Given consent management, When a customer updates consent preferences, Then the changes are applied immediately and marketing communications respect the updated preferences.
5. Given data retention policies, When retention periods expire, Then the system automatically anonymizes or deletes data according to configured policies and logs the action.

---

### Edge Cases

**Multi-tenancy and data isolation**:
- Duplicate SKU or slug within the same store must fail with a clear message showing "SKU '{sku}' already exists for product '{product_name}'. Please use a unique SKU." and suggesting auto-generated SKU alternatives.
- Staff switching stores must not retain cached data or permissions from previous store; session context is cleared and re-initialized with new store context.
- All queries, exports, and scheduled jobs must filter by store ID; cross-tenant data leakage is prohibited.
- Multi-tenant isolation test scenarios MUST include: (a) Direct ID manipulation attempts across tenants return 404 Not Found (never 403 Forbidden to avoid information disclosure), (b) SQL injection attempts are blocked by Prisma parameterized queries, (c) JWT token tampering to access other stores fails signature verification, (d) API endpoint authorization checks enforce storeId match before data access.

**Inventory and concurrency**:
- Concurrent orders reducing the same variant stock must not produce negative inventory; second attempt fails gracefully.
- Manual inventory adjustments during active orders must not create inconsistencies; use database-level locking.

**Order processing**:
- Auto‑cancel unpaid orders must not cancel orders that received late payments; idempotent processing with payment webhook reconciliation.
- Partial refunds cannot exceed total paid and cannot double‑restock items; validate against payment captures and previous refunds.
- POS device time drift must not corrupt order timestamps; rely on server time for order creation.

**Checkout and cart**:
- CSV import with invalid rows: valid rows import; invalid rows report precise reasons; import is resumable.
- Cart abandonment timer must account for timezone differences; use UTC internally.
- Adding items to cart near plan limits must check limit before confirmation; clear messaging if limit would be exceeded.

**Shipping edge cases**:
- No matching shipping zone must block checkout with message: "Shipping to your location is not available. Please contact support."
- Shipping calculation failure (API timeout) must retry 3 times, then allow manual override by staff or offer pickup option.
- Free shipping thresholds are compared against cart total in store's base currency after conversion.
- Shipping cost changes between cart and checkout are locked at checkout initialization; cart displays estimate.
- Split shipments for backordered items calculate shipping per shipment; customer notified of separate charges.

**Tax edge cases**:
- Tax calculation failure should not block checkout; proceed with 0% tax and flag order for manual review.
- Multiple tax rates are applied additively in the order configured; compound taxes are calculated on previous tax total.
- Tax-exempt customers' orders apply 0% tax regardless of product taxability; tax exemption status is verified.
- Tax jurisdiction changes mid-checkout (customer changes address) recalculate tax before payment.

**Payment edge cases**:
- Payment webhook arriving after auto-cancel must restore canceled order, mark as paid, and send confirmation.
- Partial payment captures must flag order for manual review; do not fulfill until full payment confirmed.
- Duplicate payments detected by transaction ID must refund automatically and log incident.
- Payment gateway timeout during checkout allows customer retry with idempotency key; no duplicate charges.
- Payment held for review by gateway marks order as "pending verification"; staff notified.
- Refund requests for orders paid with expired/deleted payment method use alternative refund method; customer contacted.

**Subscription plan limits**:
- Reaching plan limits must prevent new creations with clear messaging; existing data is preserved.
- Plan downgrades with excess data mark store as over-limit; no new additions until within limits or upgrade.
- Concurrent operations exceeding plan limits MUST use database-level advisory locks (Prisma's `@@unique([storeId, productCount])` constraints or SELECT FOR UPDATE) to prevent race conditions where multiple users simultaneously create resources that collectively exceed limits.
- Plan expiration during order processing allows in-progress orders to complete; new orders blocked.
- Bulk operations (import, batch updates) check limits before processing; partial completion up to limit allowed.
- Grace period after plan expiration allows read-only access; configurable per plan (default 7 days).
- Soft-deleted resources (deletedAt IS NOT NULL) DO count toward plan limits during 90-day grace period to prevent limit circumvention; DO NOT count after hard deletion. Admin "Reclaim Space" action available to force hard delete before 90 days.

**Multi-language edge cases**:
- Missing translations fall back to store's default language; mark with indicator "(English)" if content language differs.
- Search indexing supports Unicode; non-English queries are normalized and stemmed appropriately.
- Language switching preserves cart and session; language preference stored in cookie/session.
- Email notifications use customer's preferred language from profile; fall back to store default if not available.

**Product catalog edge cases**:
- **CHK002 - Duplicate SKU during bulk import**: CSV import validation MUST detect duplicate SKUs within import file before processing; display inline validation message "Row {row_number}: SKU '{sku}' duplicates existing product '{product_name}' or row {duplicate_row_number}. Suggested SKU: {sku}-{variant_id}". Import continues for valid rows; invalid rows exported to error report CSV.
- **CHK054 - Zero-product onboarding**: New stores with no products show onboarding wizard with: (a) Quick-start guide video, (b) Sample product creation walkthrough, (c) Import sample products button (adds 5 demo products to catalog), (d) CSV import tutorial. Dashboard displays "Getting Started" checklist until first product created.

**Security and authentication edge cases**:
- **CHK009 - Password history**: System MUST prevent password reuse for last 5 passwords; compare bcrypt hashes during password change/reset. Display message: "This password was used recently. Please choose a different password." Password history stored in separate `password_history` table with userId, hashedPassword, createdAt; auto-pruned to keep only last 5 per user.
- **CHK101 - Account lockout timing**: Failed login attempts are tracked per user account (not per IP) with sliding 15-minute window. After 5 failed attempts within any 15-minute period, account is locked for 15 minutes from the 5th failed attempt. Lockout counter resets on successful login or after lockout period expires. Email notification sent to user's registered email on lockout with "Unlock Account" link (valid for 1 hour) and "Forgot Password" option.
- **CHK102 - Concurrent login sessions**: Users can be logged in on multiple devices/browsers simultaneously. Each session is tracked separately with unique session ID. When password is changed, all active sessions except the current one are immediately invalidated. User sees list of active sessions in account settings with device type, browser, IP address, last activity timestamp, and "Sign Out" button for each session.
- **CHK103 - Session hijacking prevention**: JWT tokens include: (a) User ID, (b) Session ID (unique per login), (c) Issued At timestamp, (d) Expiration timestamp, (e) User agent hash (optional, for stricter security). Token signature is verified on every API request. If signature verification fails or token is expired, return HTTP 401 with message: "Session expired or invalid. Please login again."
- **CHK104 - Password reset token expiration**: Password reset tokens are single-use and expire after 1 hour. If user clicks expired reset link, show: "This password reset link has expired. Please request a new one." If token is already used, show: "This password reset link has already been used. If you need to reset your password again, please request a new link."
- **CHK105 - Email verification for new accounts**: New user registrations (Store Admins, Staff, Customers) require email verification before account activation. Verification email sent immediately with link valid for 24 hours. User cannot login until email is verified (show message: "Please verify your email address. Check your inbox for verification link."). Resend verification email option available on login page.
- **CHK106 - MFA backup codes**: When enabling MFA, system generates 10 single-use backup codes (8 alphanumeric characters each). User must download/save backup codes before MFA activation completes. If user loses access to authenticator app, they can use a backup code to login. Each backup code is invalidated after use. "Generate New Backup Codes" option available in account settings (invalidates all previous codes).
- **CHK107 - SSO account linking**: When user logs in via SSO (OIDC/SAML) for the first time, system checks if email matches existing account. If match found, prompt: "An account with this email already exists. Link your SSO account to existing account?" with "Link Account" or "Use Different Email" options. If linked, user can login with either SSO or password. If email already linked to different SSO provider, show error: "This email is already linked to another SSO provider."
- **CHK108 - Role change during active session**: If admin changes user's role or permissions while user is logged in, changes take effect on next API request (no page refresh required). User sees notification: "Your permissions have been updated. Some features may no longer be accessible." If user loses all permissions, redirect to "Access Denied" page with logout option.
- **CHK109 - Super Admin privilege escalation**: Super Admin login requires additional verification for sensitive actions: (a) Password re-confirmation for creating new Super Admin accounts, (b) MFA challenge for accessing system-wide settings, (c) Audit log entry for every Super Admin action with IP address, user agent, and timestamp. Super Admin cannot delete their own account (requires another Super Admin).
- **CHK110 - Login rate limiting per IP**: In addition to account-level lockout, implement IP-based rate limiting: 20 login attempts per IP address per 5-minute window. If exceeded, return HTTP 429 with message: "Too many login attempts from your IP address. Please try again in 5 minutes." This prevents distributed brute force attacks across multiple accounts from same IP.

**Subscription and billing edge cases**:
- **CHK056 - Order at plan expiration**: Orders submitted within 60 seconds of plan expiration are allowed to complete if initiated before expiration; use order creation timestamp (server UTC time) as authoritative. New orders blocked after grace period (default 7 days); display message: "Your subscription has expired. Please renew to continue accepting orders."

**Webhook and external integration edge cases**:
- **CHK058 - Webhook after auto-cancellation**: Payment webhooks arriving after order auto-cancellation (default 72 hours for unpaid orders) MUST check order status; if canceled, restore order to "pending" status, mark as paid, restock inventory if already restocked, send order confirmation email, and log reconciliation event. Use idempotency key (transaction_id + order_id) to prevent duplicate processing.

**Marketing and promotions edge cases**:
- **CHK060 - Flash sale + coupon overlap**: When flash sale and coupon apply to same product, apply discounts in order: (1) Flash sale price (fixed sale price), (2) Coupon discount (percentage or fixed amount on sale price). Display breakdown in cart: "Original Price: $100, Flash Sale: -$20 (80), Coupon '10OFF': -$8 (10%), Final Price: $72". Configuration option to allow/block coupon usage during flash sales per campaign.

**Tax and compliance edge cases**:
- **CHK091 - Tax-exempt approval workflow**: Tax-exempt status requires admin approval workflow: (1) Customer requests tax exemption via account settings, (2) Upload tax exemption certificate (PDF/image, validated for file type and size <5MB), (3) Admin receives notification and reviews certificate in pending approvals queue, (4) Admin approves/rejects with optional notes, (5) Customer notified via email. Auto-expiration after 1 year; renewal reminder sent 30 days before expiration.

**Email and notifications**:
- Email delivery failures are retried with exponential backoff (max 3 attempts); failures logged for admin review.
- Notification queue must not send duplicate notifications for same event; use deduplication by order ID + event type.
- Template variables with missing data show placeholder or sensible default; no rendering errors visible to customer.

**Theme and customization**:
- Invalid theme configuration triggers automatic revert to default theme with admin notification.
- Theme previews are isolated; publish is atomic with validation before going live.
- Custom CSS must be sanitized to prevent XSS; unsafe properties and external URLs blocked.

**API rate limiting**:
- Rate limit counters reset every minute (sliding window); requests distributed evenly across the window avoid bursts.
- Authenticated users have per-user rate limits; unauthenticated requests share IP-based limits (100 req/min per IP).
- Webhook endpoints from trusted external platforms (payment gateways, external e-commerce platforms) are exempt from rate limits; validated by webhook signature.
- Rate limit exceeded responses include current limit, remaining quota, and reset timestamp in headers for client retry logic.

## Requirements (mandatory)

### Functional Requirements

Multi‑tenancy and administration
- **FR-001**: The system MUST support multiple stores (tenants) with strict data isolation; users only access data for their assigned stores unless Super Admin.
- **FR-002**: Super Admins MUST be able to create, edit, pause, and archive stores, and assign Store Admins and Staff.
- **FR-003**: The system MUST provide a unified Super Admin dashboard to view cross‑store KPIs and manage stores without exposing store‑private data.
- **FR-004**: The system MUST enforce RBAC using predefined enum-based roles (SUPER_ADMIN, STORE_ADMIN, STAFF, CUSTOMER) with permissions hard-coded in application logic. Permission checking uses direct role comparison. Custom roles with granular permission assignment deferred to Phase 2. **Staff permissions**: Configurable per-staff module access flags (canManageProducts, canManageOrders, canManageCustomers, canManageInventory, canViewReports) stored as boolean fields on User model.

**Role Definitions**:
- **Super Admin**: Platform-level administrator with cross-store access; manages all stores and global settings.
- **Store Owner**: Billing entity (not a user role); the person/company who owns the store subscription.
- **Store Admin**: Primary store administrator with full access to store management; can assign Staff users.
- **Staff**: Store team members with configurable module-level permissions (canManageProducts, canManageOrders, canManageCustomers, canManageInventory, canViewReports). Staff cannot access store settings or assign other staff.
- **Customer**: Storefront user with account management and order history access.
- **POS Cashier**: Limited role for POS terminals (Phase 3) - deferred.


Products and catalog
- **FR-010**: Store Admins/Staff MUST create, edit, publish/unpublish, and delete products with name, description, price, category, brand, attributes, labels, and images. Featured products display in "prominent positions": top 3 grid positions on category pages, hero banner carousel on homepage (up to 5 products with 5-second auto-rotation), and dedicated "Featured Products" section with maximum 12 products in 3×4 grid layout.
- **FR-011**: The system MUST support variants with per‑variant SKU, price, attributes, and inventory.
- **FR-012**: The system MUST enforce SKU uniqueness per store and slug uniqueness per store for both products and variants as applicable.
- **FR-013**: The system MUST support categories and brands, and allow assigning multiple categories to a product.
- **FR-014**: The system MUST support custom attributes (e.g., color, size) with validation and display order.
- **FR-015**: The system MUST support multiple product images and designate a primary image.
- **FR-016**: The system MUST allow product-level testimonials and Q&A with moderation (approve/reject) before publication. Product testimonials are linked to specific products and displayed on product detail pages.
- **FR-017**: The system MUST support labels (e.g., sale, new) for listing badges and filtering.
- **FR-018**: The system MUST provide bulk import/export for products and variants (CSV/Excel) with validation and error reporting.
- **FR-019**: The system SHOULD support product barcodes for POS scanning and inventory tracking.

Inventory
- **FR-020**: The system MUST track inventory per product/variant and deduct on order confirmation.
- **FR-021**: The system MUST restore inventory on order cancellation and on refund when configured to restock returned items.
- **FR-022**: The system MUST prevent negative stock and handle concurrent deductions safely.
- **FR-023**: The system MUST trigger low‑stock alerts based on configurable thresholds and display them in dashboards; optional notifications.
- **FR-024**: The system MUST allow manual inventory adjustments with reason, actor, timestamp, and maintain an immutable audit trail.

Shipping management
- **FR-025**: The system MUST support shipping zone management with geographic area definitions (country, state/province, postal code ranges).
- **FR-026**: The system MUST support shipping classes (e.g., standard, express, fragile) with configurable rates per zone.
- **FR-027**: The system MUST calculate shipping costs at checkout based on customer address, cart contents, and selected shipping method.
- **FR-028**: The system MUST support free shipping thresholds per zone based on cart total in store's base currency.
- **FR-029**: The system MUST allow manual entry of tracking numbers and send tracking notifications to customers.
- **FR-02B**: The system SHOULD support multiple shipping rate types: flat rate, percentage of cart total, weight-based, and free. MAY integrate with carrier APIs (FedEx, UPS, USPS) for real-time shipping quotes as an optional feature (Phase 2). Architecture note: Design shipping rate service with provider interface pattern (ShippingRateProvider interface with implementations: ManualRateProvider, FedExProvider, UPSProvider) to allow future carrier integrations using strategy pattern.
- **FR-02B**: The system MAY integrate with carrier APIs (FedEx, UPS, USPS) for real-time shipping quotes as an optional feature.
- **FR-02C**: The system MUST block checkout with clear messaging when customer's address does not match any configured shipping zone.

Tax management
- **FR-02D**: The system MUST support tax rate configuration per region (country, state, postal code) with percentage-based rates.
- **FR-02E**: The system MUST calculate tax at checkout based on shipping address and product taxability status.
- **FR-02F**: The system MUST support tax-exempt customers and tax-exempt products; tax-exempt status overrides all tax calculations.
- **FR-02G**: The system MUST generate tax reports for compliance purposes, showing tax collected per region and time period.
- **FR-02H**: The system SHOULD support multiple tax rates applying to a single order (e.g., state + local) with additive or compound calculation.
- **FR-02I**: The system SHOULD support tax-inclusive and tax-exclusive pricing display modes per store preference.
- **FR-02J**: The system MAY integrate with tax calculation services (Avalara, TaxJar) for automated tax determination as an optional feature (Phase 2). Architecture note: Design tax calculation service with provider interface pattern (TaxCalculator interface with implementations: ManualTaxCalculator, AvaloraTaxCalculator, TaxJarCalculator) to allow future plugins without refactoring core tax logic.

Orders and payments
- **FR-030**: The system MUST list all orders with search and filter (status, date range, customer, totals, payment/shipment status).
- **FR-031**: The system MUST support order lifecycle with status progression: pending → confirmed → shipped → delivered; include canceled and refunded states. Status transitions are managed by workflow logic with validation rules (e.g., cannot ship canceled orders). Partial fulfillment workflow: (a) Order status "partially_shipped" when some items ship, (b) Customer receives separate shipment notifications for each package with tracking, (c) Remaining items stay in "awaiting_shipment" status, (d) Separate shipping charges calculated per shipment; customer notified of additional charges before processing.
- **FR-032**: The system MUST generate unique order numbers per store and allow generating invoices and packing slips.
- **FR-033**: The system MUST send order status notifications at key stages (confirmation, shipment, delivery, cancellation, refund, partial shipment).
- **FR-034**: The system MUST support order cancellations (by staff or by auto‑cancel policy for unpaid orders) with configurable grace period.
- **FR-035**: The system MUST support refunds, including partial refunds at item level or amount level, with validation against captured payments.
- **FR-036**: The system MUST support SSLCommerz (Phase 1, for Bangladesh) and Stripe (Phase 1, for International) payment gateways as primary payment methods. Additional gateways (bKash, PayPal, Square, Authorize.net) will be added in Phase 2 based on market demand.
- **FR-037**: The system MUST allow Store Admins to configure payment gateway credentials (API keys, webhook secrets) per store with test/sandbox mode support.
- **FR-038**: The system MUST handle payment webhooks for async payment confirmation and reconcile with orders; use idempotent processing.
- **FR-039**: The system MUST retry failed payments with exponential backoff (max 3 attempts) and log all payment attempts.
- **FR-03A**: The system MUST NOT store raw credit card data; rely on payment gateway tokenization for PCI compliance.
- **FR-03B**: The system SHOULD support additional payment methods: Cash on Delivery (COD) and bank transfer with manual confirmation.
- **FR-03C**: The system SHOULD support payment capture on order fulfillment (authorize at checkout, capture at shipment) as optional per store.
- **FR-03D**: The system MUST export orders to CSV/Excel using filters.
- **FR-03E**: The system MUST auto‑cancel unpaid orders after a configurable time window and restore reserved stock.

Customers
- **FR-040**: The system MUST maintain customer profiles with contact info and multiple addresses.
- **FR-041**: The system MUST show customer order history and total spending (LTV) per store.
- **FR-042**: The system MUST support wish‑lists linked to customers and products.
- **FR-043**: The system MUST provide search and filters for customers and allow CSV/Excel export of results.

Subscription and plan management
- **FR-045**: The system MUST support multiple subscription plan tiers with configurable pricing and billing cycles (monthly, yearly).
- **FR-046**: The system MUST define default plan tiers: Free (10 products, 50 orders/month, 1 staff, 100MB storage), Basic ($29/month: 100 products, 500 orders/month, 3 staff, 1GB storage), Pro ($99/month: 1000 products, 5000 orders/month, 10 staff, 10GB storage), Enterprise (custom pricing: unlimited).
- **FR-047**: The system MUST enforce plan limits (max products, orders per period, staff users, storage) per store and prevent operations exceeding limits with clear messaging.
- **FR-048**: The system MUST support plan upgrades and downgrades with prorated billing calculations; changes apply immediately. Store ownership transfer between subscription plans: (a) Current Store Owner initiates transfer from Settings → Transfer Ownership, (b) New owner receives email invitation with 7-day expiration, (c) New owner accepts and selects target subscription plan (existing or new), (d) Billing switches to new owner's plan; prorated credits/charges calculated, (e) Original owner loses admin access; new owner becomes Store Admin, (f) All store data and configuration preserved during transfer.
- **FR-049**: The system MUST support trial periods with configurable duration (default 14 days) and automatic conversion to paid plan or expiration.
- **FR-04A**: The system MUST send notifications before plan expiration (7 days, 3 days, 1 day) and after expiration grace period.
- **FR-04B**: The system MUST restrict store access after plan expiration: read-only mode during grace period (default 7 days), then suspended.
- **FR-04C**: The system SHOULD display plan usage metrics on dashboard (e.g., "45/100 products used").
- **FR-04D**: The system SHOULD warn users when approaching plan limits (at 80% usage threshold).

Marketing
- **FR-050**: The system MUST support coupons with configurable rules (amount/percent, min spend, eligibility, usage limits, validity window). Default behavior: no coupon stacking (one coupon per order). Optional configuration: enable coupon stacking per store with priority rules (percentage discounts apply before amount discounts; earliest expiry applies first; max 3 coupons per order).
- **FR-051**: The system MUST support flash sales with schedule windows and price overrides or discounts.
- **FR-052**: The system MUST provide newsletter campaign creation, audience selection, scheduling, and performance tracking.
- **FR-053**: The system MUST provide abandoned-cart recovery with configurable delay intervals (default: first email after 1 hour, second email after 24 hours, third email after 7 days) and message content customization; attribute recovered orders to campaign for ROI tracking.

Dashboards and reporting
- **FR-060**: The system MUST provide dashboards for sales, inventory, and customer insights with configurable thresholds and highlighting.
- **FR-061**: The system MUST support data export for reports (CSV/Excel) with applied filters and date ranges.
- **FR-062**: "Advanced reports" scope: Predefined reports include (a) Sales by product with revenue, quantity, refund rate, (b) Sales by category with trend analysis, (c) Customer lifetime value (LTV) segmentation, (d) Inventory turnover rate, (e) Marketing campaign ROI with attributed orders, (f) Tax liability by region. Custom report builder (Phase 2) allows Store Admins to select dimensions, metrics, filters, and date ranges with drag-and-drop interface.

Content management
- **FR-070**: The system MUST manage pages, blogs, menus, FAQs, and testimonials (store-level testimonials for homepage/about page, not product-specific; see FR-016 for product-level testimonials) with publish/unpublish and scheduling.
- **FR-071**: The system MUST allow theme customization per store (logo, colors, typography, layout presets) and preview before publish. Preview mechanism: session-based theme override with ?preview=true query parameter and admin-only access (non-admins see published theme). Publish is atomic with validation and zero downtime.
- **FR-072**: The system SHOULD support multiple UI languages with user-selectable language preference (default: English only for Phase 1).
- **FR-073**: The system SHOULD support RTL languages (Arabic, Hebrew) with appropriate layout adjustments.
- **FR-074**: The system SHOULD support per-store default language configuration and fall back to English for missing translations.
- **FR-075**: The system SHOULD support email template customization per notification type with template variables for dynamic content.
- **FR-076**: The system SHOULD provide template preview and test sending capabilities for email templates.

Email and notifications
- **FR-077**: The system MUST queue notifications with retry logic on delivery failure (exponential backoff, max 3 attempts).
- **FR-078**: The system MUST support email notifications for all order status changes, low stock alerts, and plan limit warnings. Email template variables with fallback behavior: {firstName} → "Valued Customer", {lastName} → "" (empty string), {orderNumber} → "[Order #]", {orderTotal} → "$0.00", {storeName} → "Our Store", {productName} → "Product", {quantity} → "0". Missing critical variables (orderNumber for order confirmation) log error and send fallback email: "Your order has been received. Please contact support for details."
- **FR-079**: The system MUST prevent duplicate notifications for the same event using deduplication by order ID and event type.
- **FR-07A**: The system SHOULD support notification preferences per user (email, none) for non-critical notifications.

Store settings and configuration
- **FR-07B**: The system MUST support checkout settings: guest checkout enabled/disabled, terms acceptance required, minimum order amount.
- **FR-07C**: The system MUST support configurable order auto-cancellation timeout per store (default: 60 minutes).
- **FR-07D**: The system MUST support email sender configuration per store (from name, from email, reply-to) using SMTP or transactional email service.
- **FR-07E**: The system SHOULD support store contact information for storefront display (phone, address, business hours).
- **FR-07F**: The system SHOULD support social media link configuration (Facebook, Instagram, Twitter, etc.).
- **FR-07G**: The system SHOULD support basic SEO settings per store (meta title, meta description, Open Graph tags).
- **FR-07H**: The system SHOULD support maintenance mode per store with custom message and allow admin access during maintenance.
- **FR-07I**: The system SHOULD support analytics integration (Google Analytics, Facebook Pixel) with tracking code configuration.
- **FR-07J**: The system MUST implement store deletion safeguards: (a) Block deletion when active subscription exists with message "Cannot delete store with active subscription. Cancel subscription first.", (b) Allow deletion with warning when unpaid orders exist; orders archived for 3-year retention period, (c) Require admin confirmation with store name entry, (d) Send final export of all store data (products, orders, customers) to Store Owner email before deletion completes.

Storefront features
- **FR-07J**: The system MUST provide a full-stack solution with both admin dashboard AND customer-facing storefront UI (complete turnkey e-commerce platform).
- **FR-07K**: The system MUST provide a responsive customer-facing storefront with product browsing, search, filtering, and checkout flow.
- **FR-07L**: The system MUST support home page customization (hero banners, featured products, category showcases) via admin dashboard. Visual hierarchy requirements: (a) 3-level navigation depth maximum (Category → Subcategory → Sub-subcategory), (b) Font size ratios: H1 (2.5rem/40px) → H2 (1.875rem/30px) → H3 (1.5rem/24px) → body (1rem/16px), (c) Color contrast ratio ≥4.5:1 for text per WCAG 2.1 AA, (d) CTA buttons minimum 44×44px touch target.
- **FR-07M**: The system MUST support product listing pages with grid/list views, sorting, and filtering by categories, brands, attributes, price range.
- **FR-07N**: The system MUST support product search with autocomplete suggestions and results relevance ranking. Implementation uses PostgreSQL Full-Text Search with trigram similarity for autocomplete (Phase 1); consider Algolia upgrade for Phase 2 if search performance requires further optimization beyond 10K products. Search result pagination: 24 products per page with infinite scroll (Phase 1) or numbered pagination (optional Phase 2 configuration).
- **FR-07O**: The system MUST support navigation menu customization per store with multi-level menus managed from admin.
- **FR-07P**: The system SHOULD support product quick view (modal preview) without leaving listing page for improved browsing experience.
- **FR-07Q**: The system MUST be SEO-optimized with server-side rendering for product and content pages to support organic search traffic.
- **FR-07R**: The system MUST support customer account pages (login, registration, order history, address management, wish lists) on the storefront.
- **FR-07S**: The system MUST support shopping cart with persistent storage (logged-in users) and session storage (guest users).
- **FR-07T**: The system MUST provide a complete checkout flow: cart review → shipping address → shipping method → billing address → payment → order confirmation.
- **FR-07U**: The system SHOULD support store announcement/notice banner configurable from admin with max 200 characters, optional schedule (start/end datetime), position (top/bottom of page), dismissible flag (customer can close), and styling options (info/warning/success themes). Multiple active banners display in configured order.
- **FR-07V**: The system SHOULD support breadcrumb navigation throughout the storefront for improved user experience and SEO.

POS
- **FR-080**: The system MUST support POS checkout for in‑store transactions, including product scan/search, discounts, tax, and receipt generation. POS operates in online-only mode (Phase 1); offline mode with local storage sync-back deferred to Phase 2 based on demand. POS sessions persist in database across device restarts; Staff can resume open session on any device by entering session ID or staff credentials.
- **FR-081**: The system MUST update inventory and customer history upon successful POS sale.
- **FR-082**: The system SHOULD allow basic POS user roles to limit access to back‑office features.
- **FR-083**: The system SHOULD support barcode scanning for products in POS interface.
- **FR-084**: The system SHOULD support cash drawer integration and cash management tracking in POS.

Security and compliance
- **FR-090**: The system MUST require login with email/password and enforce strong password policies (length, complexity, history).
- **FR-090A**: The system MUST provide a login page at `/auth/login` with email input field (validated for email format), password input field (masked with show/hide toggle), "Remember Me" checkbox (extends session to 30 days), "Forgot Password" link, and "Sign In" button. Login page must be accessible without authentication and redirect authenticated users to their default dashboard.
- **FR-090B**: The system MUST validate credentials server-side using bcrypt.compare() with stored password hash. On successful authentication, generate JWT token signed with **HS256 (HMAC-SHA256)** using secret from environment variable. JWT payload includes: user ID, session ID (UUID v4), role (enum), store ID (if applicable), issued at timestamp (iat), expiration timestamp (exp: 30 days). Store JWT in HTTP-only, Secure, SameSite=Lax cookie. Validate JWT signature on every API request; reject tampered tokens with HTTP 401.
- **FR-090C**: The system MUST support role-based redirects after successful login: (a) Super Admin → `/admin/dashboard` (cross-store system dashboard), (b) Store Admin/Staff → `/dashboard` (store-specific dashboard for assigned store), (c) Customer → `/account` (customer account page with order history).
- **FR-090D**: The system MUST display clear error messages for failed login attempts: (a) Invalid credentials → "Invalid email or password. Please try again." (generic message to prevent account enumeration), (b) Account locked → "Account locked due to too many failed login attempts. Please try again in X minutes or reset your password.", (c) Account inactive → "Your account has been deactivated. Please contact support.", (d) Email not verified → "Please verify your email address. Check your inbox or request a new verification link."
- **FR-090E**: The system MUST implement "Forgot Password" flow: (a) User enters email on forgot password page, (b) System sends password reset email with unique token valid for 1 hour, (c) User clicks link and enters new password (validated against password policy), (d) Password is updated and all active sessions except current are invalidated, (e) User is redirected to login page with success message: "Password reset successful. Please login with your new password."
- **FR-090F**: The system MUST enforce password policy requirements: (a) Minimum 8 characters, (b) At least one uppercase letter (A-Z), (c) At least one lowercase letter (a-z), (d) At least one number (0-9), (e) At least one special character (!@#$%^&*()_+-=[]{}|;:',.<>?/), (f) Password cannot match last 5 passwords (stored in `password_history` table with bcrypt hash).
- **FR-090G**: The system MUST track failed login attempts per user account in a sliding 15-minute window. After 5 failed attempts, lock account for 15 minutes and send email notification with unlock link and timestamp when lockout expires. Reset failed attempt counter on successful login or after lockout period expires.
- **FR-090H**: The system MUST implement logout functionality at `/auth/signout` that: (a) Invalidates current session token, (b) Clears authentication cookie, (c) Redirects to login page with message: "You have been logged out successfully.", (d) Logs audit event with user ID, timestamp, and IP address.
- **FR-090I**: The system MUST provide session management UI in user account settings showing: (a) List of active sessions with device type, browser, IP address, login timestamp, last activity timestamp, (b) "Current Session" indicator for the session user is viewing from, (c) "Sign Out" button for each session to remotely terminate that session, (d) "Sign Out All Other Sessions" button to terminate all sessions except current.
- **FR-090J**: The system MUST implement IP-based rate limiting for login attempts: 20 attempts per IP address per 5-minute sliding window. When exceeded, return HTTP 429 with message: "Too many login attempts. Please try again in 5 minutes." Log rate limit violations with IP address, timestamp, and attempted email addresses (for security monitoring).
- **FR-091**: The system MUST support optional multi‑factor authentication (MFA) with TOTP authenticator apps (RFC 6238) as the primary method. The system MAY additionally offer WebAuthn/FIDO2 security keys as an optional method for enterprises. No backup codes are provided - users must use their authenticator app for MFA-enabled accounts.
- **FR-092**: The system MUST support optional SSO for enterprises using OIDC and SAML 2.0 with common identity providers (e.g., Okta, Azure AD, Google, OneLogin).
- **FR-093**: The system MUST lock accounts after repeated failed login attempts for a configurable duration and notify the user.
- **FR-094**: The system MUST maintain detailed, immutable audit logs for security‑sensitive actions (auth events, role changes, inventory adjustments, order changes); implement data encryption at rest (AES-256) and in transit (TLS 1.3).
- **FR-095**: The system MUST ensure tenant isolation in all queries, exports, and scheduled jobs; cross‑tenant access is prohibited.
- **FR-096**: The system MUST sanitize all user inputs to prevent XSS attacks and validate all data before database operations.
- **FR-097**: The system MUST use HTTPS for all communications and secure session management with HTTP-only cookies; JWT session timeout: 30 days absolute expiration, 7 days idle timeout (sliding window); sessions invalidated on password change or permission revocation.
- **FR-128**: The system MUST implement API rate limiting per user/store based on subscription plan tier to prevent abuse and ensure fair resource allocation using sliding window algorithm counting requests per minute per authenticated user.
- **FR-129**: The system MUST enforce tiered rate limits: Free plan (60 requests/minute), Basic (120 req/min), Pro (300 req/min), Enterprise (1000 req/min).
- **FR-130**: The system MUST return HTTP 429 (Too Many Requests) with standard rate limit HTTP headers and Retry-After header when limits are exceeded: `X-RateLimit-Limit: 120` (max requests per window), `X-RateLimit-Remaining: 0` (remaining requests), `X-RateLimit-Reset: 1698345600` (Unix timestamp when window resets), `Retry-After: 45` (seconds until retry allowed). Error response body: `{ "error": { "code": "RATE_LIMIT_EXCEEDED", "message": "Rate limit of 120 requests per minute exceeded. Please retry after 45 seconds.", "limit": 120, "resetAt": "2025-10-19T14:30:00Z" } }`
- **FR-131**: The system SHOULD implement rate limit monitoring dashboard for Super Admins showing per-store API usage patterns and rate limit violations.
- **FR-132**: The system SHOULD allow temporary rate limit increases for Enterprise customers during known high-traffic events (e.g., flash sales) with advance request.

Future features (deferred to Phase 2)
- **FR-098**: The system MAY support multi-currency with configurable exchange rates and customer currency selection.
- **FR-099**: The system MAY support delivery personnel management with order assignment and delivery tracking.
- **FR-09A**: The system MAY support built-in customer support ticket system with status lifecycle and staff assignment.
- **FR-09B**: The system MAY support polymorphic tagging for products, blogs, and pages with tag-based filtering.
- **FR-09C**: The system MAY support downloadable/digital products with secure file delivery after purchase.
- **FR-09D**: The system MAY support product comparison feature for customers.
- **FR-09E**: The system MAY support an add-on/module system for platform extensibility.

## Phase 2 Backlog

Features explicitly deferred to Phase 2 based on market demand and performance requirements:

### Payment & Shipping Integrations
- **P2-001**: Additional payment gateways (bKash, PayPal, Square, Authorize.net, Razorpay) - Priority based on market demand surveys.
- **P2-002**: Carrier API integrations (FedEx, UPS, USPS, DHL) for real-time shipping quotes - Currently supporting manual rate configuration (FR-02B).
- **P2-003**: Tax calculation service integrations (Avalara, TaxJar) for automated tax determination - Currently using manual tax rate configuration (FR-02J).

### Search & Performance Enhancements
- **P2-004**: Algolia search integration for catalogs >10K products - Phase 1 uses PostgreSQL Full-Text Search with pg_trgm (FR-07N).
- **P2-005**: Advanced product search features: visual search, voice search, natural language processing.
- **P2-006**: Search analytics dashboard showing popular queries, zero-result searches, conversion rates.

### POS & Offline Features
- **P2-007**: POS offline mode with local storage and sync-back when connectivity restored - Phase 1 online-only (FR-080).
- **P2-008**: POS inventory management: local stock adjustments, inter-store transfers, physical count audits.
- **P2-009**: POS customer-facing display for price verification and digital receipts.

### Internationalization & Localization
- **P2-010**: Multi-language support (16 languages: ar, da, de, en, es, fr, he, it, ja, nl, pl, pt, pt-br, ru, tr, zh) - Phase 1 English only (FR-072).
- **P2-011**: RTL language layout support (Arabic, Hebrew) with mirrored UI components (FR-073).
- **P2-012**: Multi-currency support with exchange rate APIs (Open Exchange Rates, Fixer.io) and customer currency selection (FR-098).
- **P2-013**: Localized payment methods per region (iDEAL for Netherlands, Klarna for Europe, Alipay for China).

### Advanced Reporting & Analytics
- **P2-014**: Custom report builder with drag-and-drop dimensions, metrics, filters (FR-062 currently predefined reports only).
- **P2-015**: Predictive analytics: sales forecasting, inventory recommendations, customer churn prediction.
- **P2-016**: Advanced cohort analysis: customer lifetime value trends, repeat purchase patterns, channel attribution.
- **P2-017**: Real-time dashboard with WebSocket updates for order notifications and inventory alerts.

### Marketing & Customer Engagement
- **P2-018**: SMS marketing campaigns with Twilio/SendGrid integration.
- **P2-019**: Push notification support (web push + mobile app notifications).
- **P2-020**: Customer segmentation engine with behavioral triggers (cart abandonment, browse abandonment, post-purchase follow-ups).
- **P2-021**: Loyalty/rewards program with points, tiers, and redemption rules.
- **P2-022**: Referral program with unique codes and commission tracking.

### Content & Storefront Enhancements
- **P2-023**: Theme marketplace with third-party theme support and preview sandboxing.
- **P2-024**: Advanced page builder with drag-and-drop widgets (hero sections, testimonials, FAQs, comparison tables).
- **P2-025**: Blog commenting system with moderation, spam filtering, and social sharing.
- **P2-026**: Product comparison feature allowing customers to compare up to 4 products side-by-side (FR-09D).
- **P2-027**: Product quick view modal on listing pages without navigation (FR-07P currently basic implementation).

### Digital Products & Downloads
- **P2-028**: Downloadable/digital product support with secure file delivery and access control (FR-09C).
- **P2-029**: License key generation and management for software products.
- **P2-030**: Subscription products with recurring billing (weekly, monthly, yearly cycles).

### Platform Extensibility
- **P2-031**: Add-on/module marketplace for third-party extensions (FR-09E).
- **P2-032**: Webhook management UI for custom integrations (Zapier, Make, n8n).
- **P2-033**: GraphQL API alongside REST API for mobile app development.
- **P2-034**: Public API documentation portal with interactive examples (Swagger/OpenAPI UI).

### Enterprise Features
- **P2-035**: Multi-warehouse inventory management with stock allocation rules.
- **P2-036**: Advanced role-based permissions with custom role creation and field-level access control.
- **P2-037**: White-label SaaS option allowing resellers to rebrand the platform.
- **P2-038**: Dedicated infrastructure option for Enterprise customers (isolated database, dedicated compute).
- **P2-039**: Advanced SLA monitoring with customer-specific uptime dashboards and SLA credits for violations.

### Customer Support & Ticketing
- **P2-040**: Built-in helpdesk/ticketing system with email integration and SLA tracking (FR-09A).
- **P2-041**: Live chat widget with real-time customer support and chat history.
- **P2-042**: AI chatbot for common questions (order status, return policy, product recommendations).

### Priority Matrix
- **P0 (Launch Blocker)**: None - Phase 1 complete.
- **P1 (High Demand)**: P2-001 (bKash payment for Bangladesh), P2-004 (Algolia for large catalogs), P2-010 (Multi-language).
- **P2 (Medium Demand)**: P2-002 (Carrier APIs), P2-007 (POS offline), P2-014 (Custom reports), P2-020 (Customer segmentation).
- **P3 (Low Demand/Nice-to-Have)**: P2-026 (Product comparison), P2-028 (Digital products), P2-033 (GraphQL API).

Integrations
 - **FR-100**: The system MUST support optional integration with external e‑commerce platforms (e.g., WooCommerce/Shopify) using real-time bidirectional synchronization via webhooks for immediate data consistency across platforms. "Real-time sync" latency target: <5 seconds from webhook receipt to data sync completion (95th percentile).
 - **FR-101**: External platform integration MUST implement webhook handlers for both inbound (external → StormCom) and outbound (StormCom → external) events including product changes, inventory updates, order status changes, and customer data synchronization. Category mapping conflict resolution: (a) Attempt exact name match (case-insensitive), (b) If no match, map to "Uncategorized" category (auto-created), (c) Log conflict with original name for admin review, (d) Admin dashboard shows "Unmapped Categories" with bulk mapping tool, (e) Future syncs use saved mappings.
 - **FR-102**: External platform integration MUST implement webhook retry logic with exponential backoff (max 5 attempts), dead-letter queue for permanent failures, and manual retry capability for failed syncs.
 - **FR-103**: External platform integration MUST include configurable conflict resolution strategies for bidirectional sync when the same entity is modified in both systems: last-write-wins (timestamp-based), manual resolution queue (staff review), or configurable priority rules (e.g., always prefer StormCom inventory).
 - **FR-104**: External platform integration MUST maintain a real-time sync status monitoring dashboard per store showing: last successful sync timestamp, sync health status, pending sync items count, failed sync items with error details, and data discrepancy alerts.
 - **FR-105**: External platform integration MUST provide entity-level sync direction overrides allowing stores to configure bidirectional sync for products/inventory but inbound-only for orders (or other combinations per business needs).
 - **FR-106**: External platform integration MUST support initial bulk import/export for onboarding existing stores with large catalogs (1000+ products), including progress tracking and validation reporting.

Defaults and policies
- **FR-110**: The system MUST allow configuration of thresholds (low stock, KPI highlights) at the store level.
- **FR-111**: The system MUST provide configurable auto‑cancel window for unpaid orders (default: 60 minutes) and document the default.
- **FR-112**: The system MUST provide human‑readable error messages for validation failures (e.g., uniqueness, stock).

Scalability and performance
- **FR-113**: The system MUST maintain responsive performance (per success criteria timing targets: SC-003, SC-007, SC-011, SC-012, SC-013, SC-017, SC-020, SC-021-025) for stores with up to 10K products, 83K orders/month, and 250K customers.
- **FR-114**: The system SHOULD provide scalability monitoring dashboard for Super Admins showing per-store resource usage (database size, order volume trends, API request rates) to identify stores approaching limits.
- **FR-115**: The system SHOULD implement query optimization and caching strategies (database query optimization with proper indexes on frequently queried columns, Redis-based caching for product lists/categories with 5-minute TTL, CDN caching for static assets) to maintain sub-3-second page loads for product listings with 10K+ products and complex filters.

Reliability and availability
- **FR-116**: The system MUST achieve 99.9% uptime SLA (≈43 minutes planned + unplanned downtime per month) excluding scheduled maintenance windows.
- **FR-117**: The system MUST provide scheduled maintenance windows during low-traffic periods (configurable per region) with minimum 48-hour advance notice to affected stores.
- **FR-118**: The system MUST implement automated health checks and monitoring for critical services (database, payment gateways, email delivery, webhook processing) with alerts on failures.
- **FR-119**: The system MUST implement automated database backups with point-in-time recovery capability; backups retained for minimum 30 days.
- **FR-120**: The system SHOULD implement disaster recovery procedures with Recovery Time Objective (RTO) of 4 hours and Recovery Point Objective (RPO) of 1 hour for critical data.

Data retention and compliance
- **FR-121**: The system MUST retain orders, invoices, and financial transaction records for 3 years to meet tax and accounting compliance requirements.
- **FR-122**: The system MUST retain security audit logs for 1 year with immutable storage to support security investigations and compliance audits.
- **FR-123**: The system MUST retain automated backups for 90 days with automated cleanup of older backups to manage storage costs.
- **FR-124**: The system MUST support GDPR-compliant customer data deletion requests (right to be forgotten) with complete data purge within 30 days, excluding legally required financial records.
- **FR-125**: The system MUST provide data export functionality for customers (data portability) in machine-readable format (JSON/CSV) including all personal data, orders, and interactions.
- **FR-126**: The system MUST implement automated data retention policies with scheduled jobs to archive or delete data past retention periods.
- **FR-127**: The system SHOULD provide configurable retention policies per store for non-regulated data (e.g., marketing data, abandoned carts) to allow customization based on business needs.

### Key Entities (data overview)

- Store (Tenant): name, domain/slug, status, subscription plan, plan limits, settings, theme config; has many Users, Products, Orders.
- Subscription Plan: name, tier, pricing, billing cycle, feature limits (max products, orders, staff, storage), trial period; has many Store Subscriptions.
- Store Subscription: store reference, plan reference, status, start date, end date, trial end date, usage metrics; tracks plan usage and expiration.
- User: email, name, roles, MFA settings, status, language preference; belongs to one or more Stores; actions audited.
- User Session: **Stored in Vercel KV (production) or in-memory Map (local development)**. Key: session ID (from JWT), Value: { userId, storeId, role, deviceType, browser, ipAddress, userAgent, createdAt, lastActivityAt, expiresAt }. TTL set to 30 days absolute (matching JWT expiration). Session validated on every API request by checking session ID exists in store. Password change/logout/permission revocation deletes session key immediately (invalidation <10ms in production, instant in local dev).
- Password History: user reference, bcrypt password hash, created at; stores last 5 passwords to prevent reuse.
- Failed Login Attempt: user email, IP address, attempted at, success flag; tracks failed logins for account lockout enforcement.
- Password Reset Token: token, user reference, created at, expires at (1 hour), used flag; single-use tokens for password reset flow.
- MFA Secret: user reference, secret key (encrypted), backup codes (encrypted array), enabled at; stores TOTP secret and recovery codes.
- Email Verification Token: token, user reference, created at, expires at (24 hours), verified at; for new account email verification.
- Role/Permission: **Phase 1 uses predefined enum-based roles** (SUPER_ADMIN, STORE_ADMIN, STAFF, CUSTOMER) with permissions hard-coded in application logic. Role stored as enum field on User model. Permission checking done via direct role comparison (e.g., `user.role === 'SUPER_ADMIN'`). **Predefined permission sets**: (1) SUPER_ADMIN - full platform access across all stores, manage users/stores/plans; (2) STORE_ADMIN - full store management, assign staff, configure settings; (3) STAFF - configurable module access (products, orders, customers, inventory) per store; (4) CUSTOMER - storefront access, account management, order history. Custom roles with granular permissions deferred to Phase 2 as enterprise feature.
- Product: name, description, slug, category links, brand, attributes, labels, media, barcode, taxable status; has many Variants.
- Variant: SKU, price, attributes, inventory, barcode; belongs to Product.
- Category: name, hierarchy; linked to Products.
- Brand: name; linked to Products.
- Attribute/Option: name, allowed values; linked to Products/Variants.
- Media: image metadata and ordering; linked to Products.
- Inventory Adjustment: delta, reason, actor, timestamp; linked to Variant.
- Shipping Zone: name, countries, states, postal codes; has many Shipping Rates.
- Shipping Class: name, description; used in Shipping Rates.
- Shipping Rate: zone reference, class reference, rate type (flat, percentage, weight-based), cost, free threshold, conditions.
- Tax Rate: name, region (country, state, postal code), percentage, compound/additive flag, priority order.
- Tax Exemption: customer or product reference, reason, valid from/to dates.
- Customer: contact info, preferences, tax-exempt status, language preference; belongs to Store; has Addresses, Orders, Wish‑lists.
- Address: type (billing, shipping) and fields; linked to Customer.
- Cart: customer reference, items, created at, expires at; used for abandoned cart tracking.
- Order: number, customer, items, totals (subtotal, shipping, tax, discount, total), status timeline, payments, shipments, invoices, shipping address, billing address.
- Order Item: product/variant ref, qty, unit price, discounts, tax amount.
- Payment: method (SSLCommerz, bKash, Stripe, PayPal, COD, Bank Transfer), amount, status (pending, authorized, captured, failed, refunded), transaction ID, reference; linked to Order.
- Payment Gateway Config: store reference, gateway type, credentials (encrypted), test mode flag, webhook secret.
- Shipment: carrier, tracking number, status, shipped date, delivered date; linked to Order.
- Refund: amount, items, reason, payment reference, status, refund method; linked to Order.
- Coupon/Promotion: code, rules (discount type, amount, min spend, eligibility), validity window, usage limits, redemption count.
- Flash Sale: product/category reference, discount, start/end datetime, status.
- Newsletter Campaign: name, subject, content, audience filter, schedule, metrics (sent, opened, clicked).
- Abandoned Cart Recovery: cart reference, recovery email sent date, recovered order reference, attributed revenue.
- Dashboard Metric/Threshold: definitions per store, current value, threshold, alert status.
- Page/Blog/Menu/FAQ/Testimonial: content, slug, publication state, schedule, language.
- Email Template: notification type, subject template, body template (HTML/plain text), variables, language.
- Theme: preset reference and customization values per store, preview snapshot, published snapshot.
- Audit Log: actor, action, entity type, entity ID, before/after snapshots, timestamp, IP address, user agent.
- POS Session: staff reference, opened at, closed at, opening cash, closing cash, transaction count, total sales.
- Tag: name, slug; polymorphic associations to Products, Blogs, Pages.
- External Platform Integration: store reference, platform type (WooCommerce, Shopify), sync direction, API credentials (encrypted), webhook secret, last sync timestamp, sync status.
- Sync Queue: entity type, entity ID, operation (create, update, delete), direction (inbound, outbound), status (pending, processing, completed, failed), retry count, error message.
- Storefront Banner: store reference, image, link, text overlay, position, display order, active status, schedule.
- Customer Session: session ID, customer reference (nullable for guests), cart contents, language preference, currency preference, last activity, expires at.
- Product Review: customer reference, product reference, rating (1-5), review text, helpful votes, verified purchase flag, moderation status, created at.

## Email Template Variables

Email templates (FR-075) support dynamic content through template variables. Common variables available across templates:
- `{{storeName}}` - Store display name
- `{{storeUrl}}` - Store URL
- `{{storeEmail}}` - Store contact email
- `{{customerName}}` - Customer full name
- `{{customerEmail}}` - Customer email address

Order-related templates include:
- `{{orderNumber}}` - Unique order number
- `{{orderTotal}}` - Order total amount with currency
- `{{orderStatus}}` - Current order status (human-readable)
- `{{orderDate}}` - Order creation date
- `{{orderItemsTable}}` - HTML table of ordered items
- `{{shippingAddress}}` - Formatted shipping address
- `{{trackingNumber}}` - Shipment tracking number (if available)

Product stock templates include:
- `{{productName}}` - Product name
- `{{productSku}}` - Product SKU
- `{{currentStock}}` - Current stock level
- `{{lowStockThreshold}}` - Configured low stock threshold

Plan limit templates include:
- `{{planName}}` - Current subscription plan name
- `{{limitType}}` - Type of limit reached (products, orders, etc.)
- `{{currentUsage}}` - Current usage count
- `{{planLimit}}` - Plan limit value

## Assumptions & Dependencies

Assumptions
- CSV/Excel import/export is acceptable for operational data exchange in back office.
- Server time is the canonical source for order timestamps and SLA calculations (not client devices).
- Default auto‑cancel window is 60 minutes unless changed by store configuration.
- Notifications are sent via email by default; additional channels (e.g., SMS/push) may be added later.
- Theme customization is limited to provided presets and safe configurable options; no arbitrary code injection.
- **Scalability targets**: System designed for mid-market stores with up to 10K products, 1M orders/year (≈83K orders/month), and 250K customers per store; larger stores may require performance optimization or Enterprise custom infrastructure.
- **Uptime SLA**: 99.9% uptime target (≈43 minutes downtime/month) excluding scheduled maintenance windows; achieved through standard HA practices (load balancing, database replication, automated failover).
- **Disaster recovery**: Automated daily backups with 30-day retention; RTO 4 hours, RPO 1 hour for critical data restoration.
- **Data retention**: Standard retention periods - 3 years for orders/invoices (accounting/tax compliance), 1 year for audit logs (security), 90 days for backups (operational recovery); GDPR-compliant customer data deletion supported.
- **API rate limiting**: Tiered by subscription plan to prevent abuse and ensure fair resource allocation - Free (60 req/min), Basic (120 req/min), Pro (300 req/min), Enterprise (1000 req/min).
- **Retry logic**: Notification delivery failures (FR-077) use exponential backoff: 1st retry after 5 minutes, 2nd retry after 15 minutes (5 + 10), 3rd retry after 35 minutes (5 + 10 + 20), max 3 attempts before marking as failed.
- Standard e‑commerce privacy and data retention practices apply unless stricter policies are configured by the store.
- **Shipping rates**: Manual rate configuration (zones + classes) for Phase 1; carrier API integration (FedEx, UPS, USPS) deferred to Phase 2 as optional enhancement.
- **Tax calculation**: Manual tax rate configuration for Phase 1; tax service API integration (Avalara, TaxJar) deferred to Phase 2 as optional enhancement.
- **Payment gateways**: SSLCommerz (For Bangladesh) and Stripe (For International) are must-have for Phase 1 (industry standard, covers most markets); additional gateways (bKash, PayPal, Square, Authorize.net) can be added in Phase 2.
- **Subscription plans**: Default 4-tier structure (Free, Basic, Pro, Enterprise) with defined limits; specific pricing and limits are configurable per deployment.
- **Multi-language**: English-only for Phase 1 MVP; additional languages (Spanish, French, German, Chinese, Arabic) deferred to Phase 2 based on market demand.
- **Multi-currency**: Deferred to Phase 2; Phase 1 stores operate in single base currency per store.
- **Delivery management**: Deferred to Phase 2; Phase 1 assumes stores use carrier shipping only.
- **Support tickets**: Deferred to Phase 2; Phase 1 assumes integration with external helpdesk services (Zendesk, Intercom) or manual email support.
- **Email templates**: Basic customization with template variables for Phase 1; advanced template editor deferred to Phase 2.
- **Digital products**: Deferred to Phase 2; Phase 1 focuses on physical product inventory management.
- **Product comparison**: Deferred to Phase 2 as nice-to-have feature.
- **Module/add-on system**: Deferred to Phase 3 for platform extensibility.
- **Mobile apps**: Out of scope for Phase 1; focus is web-based admin and storefront (responsive design).
- **Storefront architecture**: Full-stack solution with both admin dashboard AND customer-facing storefront UI (complete turnkey platform for mid-market merchants).
- **External platform sync**: Real-time bidirectional synchronization via webhooks for immediate data consistency; supports configurable conflict resolution (last-write-wins, manual queue, or priority rules) and entity-level direction overrides per store.
- **PCI compliance**: Achieved by NOT storing raw card data; rely on payment gateway tokenization.
- **Default plan limits** (configurable per deployment):
  - Free: 10 products, 50 orders/month, 1 staff user, 100MB storage, 60 API req/min, community support
  - Basic ($29/mo): 100 products, 500 orders/month, 3 staff users, 1GB storage, 120 API req/min, email support
  - Pro ($99/mo): 1000 products, 5000 orders/month, 10 staff users, 10GB storage, 300 API req/min, priority support
  - Enterprise (custom): unlimited resources, 1000 API req/min (customizable), dedicated support, custom SLA
- **Trial period**: Default 14 days for all paid plans; automatically converts or expires.
- **Grace period after expiration**: Default 7 days read-only access before full suspension.

Dependencies
- Payment gateway providers (SSLCommerz, Stripe) for capturing, refunding, and reconciling payments per store.
- Email service provider (transactional email API like SendGrid, Mailgun, or SMTP) for notifications.
- Optional SMS provider for MFA SMS fallback (Twilio, SNS).
- Optional SSO identity providers (Okta, Azure AD, Google, OneLogin) where enabled.
- Optional external e-commerce platform APIs (WooCommerce, Shopify) with webhook support for real-time sync.
- Background job scheduling system for auto-cancel, abandoned-cart recovery, plan expiration checks, and notifications.
- Secure, immutable audit log storage (append-only with retention policy).
- Automated backup system with point-in-time recovery and 30-day retention minimum.
- Health monitoring and alerting system for critical services (uptime monitoring, APM, log aggregation).
- File storage for product images, digital downloads, invoice PDFs, and backups.
- Database with transaction support and row-level locking for inventory concurrency control.
- CDN for storefront asset delivery (images, CSS, JavaScript) for global performance.
- Search indexing system (optional: Elasticsearch, Algolia) for product search with autocomplete; fallback to database full-text search.

## Success Criteria (mandatory)

### Measurable Outcomes

- **SC-001**: Super Admins can create and staff a new store in under 5 minutes, and the assigned admin can log in immediately.
- **SC-002**: 100% of product and variant SKUs and slugs are unique per store; validation occurs before save with clear messaging.
- **SC-003**: 95% of order status updates from pending to confirmed occur within 10 seconds of user action (user‑perceived immediate feedback).
- **SC-004**: Inventory never goes negative; concurrent order attempts on low stock result in exactly one success and clear feedback on the other.
- **SC-005**: Low‑stock alerts appear on dashboards within 1 minute of the triggering change and are included in the next notification run.
- **SC-006**: Auto‑cancel removes ≥ 99% of unpaid orders past the configured window without canceling any paid orders (0 false positives in tests).
- **SC-007**: Customer search/filter returns the first page of results with applied filters in under 2 seconds for typical datasets (≤10K products, ≤250K customers per store; user‑perceived instant response).
- **SC-008**: Reports and exports reflect applied filters accurately; exported files match on‑screen totals within 0.5% variance.
- **SC-009**: 100% of security‑sensitive actions are captured in audit logs with actor, timestamp, entity, and outcome.
- **SC-010**: After enabling MFA and lockout policies, unauthorized login attempts result in lockout after the configured threshold 100% of the time in tests.
- **SC-010A**: User login with valid credentials (Super Admin, Store Admin, Staff, Customer) completes in under 2 seconds and redirects to appropriate dashboard based on role 100% of the time.
- **SC-010B**: Password validation enforces all 6 policy requirements (length, uppercase, lowercase, number, special character, history) and rejects non-compliant passwords with specific error messages 100% of the time.
- **SC-010C**: Account lockout triggers after exactly 5 failed login attempts within any 15-minute sliding window; lockout email sent within 30 seconds; unlock occurs automatically after 15 minutes.
- **SC-010D**: Password reset emails are sent within 60 seconds of request; reset tokens expire after exactly 1 hour; expired/used tokens display appropriate error messages 100% of the time.
- **SC-010E**: Session invalidation on password change or permission revocation completes within 60 seconds across all active sessions; users are prompted to re-authenticate.
- **SC-010F**: MFA challenges (TOTP codes) validate successfully for correct codes and reject invalid/expired codes 100% of the time; backup codes work as single-use fallback.
- **SC-010G**: IP-based rate limiting blocks login attempts after 20 attempts per IP per 5-minute window; returns HTTP 429 with correct Retry-After header.
- **SC-010H**: All authentication events (login, logout, failed attempts, password changes, MFA operations, session terminations) are logged to audit trail with user ID, timestamp, IP address, user agent, and outcome within 5 seconds of event.
- **SC-011**: Shipping calculation completes in under 3 seconds at checkout; no matching zone blocks checkout with clear message 100% of the time.
- **SC-012**: Tax calculation completes in under 2 seconds at checkout; tax-exempt status overrides tax 100% of the time.
- **SC-013**: Payment processing (authorization) completes within 10 seconds for 95% of transactions; webhook reconciliation occurs within 5 minutes.
- **SC-014**: Plan limit enforcement prevents exceeding limits 100% of the time; users receive clear messaging about limit and upgrade options.
- **SC-015**: Plan upgrade/downgrade applies new limits immediately; prorated billing calculates correctly within $0.01 for 100% of plan changes.
- **SC-016**: Stores can complete checkout flow (product → cart → shipping → tax → payment → confirmation) in under 3 minutes for typical orders (end-to-end customer experience including page transitions and user input time; individual API response times governed by SC-011, SC-012, SC-013).
- **SC-017**: Email notifications are queued and sent within 5 minutes of triggering event; retry logic succeeds for 95% of transient failures.
- **SC-018**: Theme preview displays changes accurately; publish is atomic with 0 downtime or partial updates visible to customers.
- **SC-019**: POS checkout completes a typical transaction (scan 3 items, apply discount, accept payment, print receipt) in under 60 seconds.
- **SC-020**: Dashboard metrics update within 10 minutes of data changes; threshold crossing triggers alerts within 1 minute.
- **SC-021**: Storefront home page loads in under 2 seconds (LCP) on desktop and under 3 seconds on mobile for 95% of page loads.
- **SC-022**: Product listing pages with 24 products display in under 2.5 seconds; filtering and sorting updates occur in under 1 second.
- **SC-023**: Product search returns results in under 1 second; autocomplete suggestions appear within 300ms of typing.
- **SC-024**: Product detail page loads in under 2 seconds; all images use lazy loading and modern formats (WebP).
- **SC-025**: Checkout flow (cart → shipping → payment → confirmation) completes without errors for 99% of attempts; abandoned carts are tracked.
- **SC-026**: External platform webhook processing completes within 10 seconds for 95% of events; failed webhooks retry successfully within 5 minutes.
- **SC-027**: Storefront is accessible via keyboard navigation only; WCAG 2.1 Level AA compliance verified for all customer-facing pages.
- **SC-028**: System maintains all performance targets (page load times, query response times) for stores with 10K products, 250K customers, and 83K orders/month sustained load.
- **SC-029**: System achieves 99.9% uptime measured monthly over a rolling 12-month period; downtime incidents logged with root cause analysis.
- **SC-030**: Automated backups complete successfully 99.9% of the time; backup restoration tested quarterly with documented RTO ≤ 4 hours.
- **SC-031**: Data retention policies execute automatically 100% of the time; orders/invoices retained for 3 years, audit logs for 1 year, backups for 90 days.
- **SC-032**: GDPR data deletion requests complete within 30 days 100% of the time; data export requests fulfill within 48 hours with complete data in machine-readable format.
- **SC-033**: API rate limiting enforces plan-specific limits 100% of the time; requests exceeding limits return HTTP 429 with Retry-After header within 100ms.
- **SC-034**: Rate limit violations are tracked and logged; Super Admin dashboard shows per-store API usage patterns updated in real-time.


