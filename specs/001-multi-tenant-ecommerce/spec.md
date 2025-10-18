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

## User Scenarios & Testing (mandatory)

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

### Edge Cases

**Multi-tenancy and data isolation**:
- Duplicate SKU or slug within the same store must fail with a clear message; across stores is allowed.
- Staff switching stores must not retain cached data or permissions from previous store.
- All queries, exports, and scheduled jobs must filter by store ID; cross-tenant data leakage is prohibited.

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
- Plan expiration during order processing allows in-progress orders to complete; new orders blocked.
- Bulk operations (import, batch updates) check limits before processing; partial completion up to limit allowed.
- Grace period after plan expiration allows read-only access; configurable per plan (default 7 days).

**Multi-language edge cases**:
- Missing translations fall back to store's default language; mark with indicator "(English)" if content language differs.
- Search indexing supports Unicode; non-English queries are normalized and stemmed appropriately.
- Language switching preserves cart and session; language preference stored in cookie/session.
- Email notifications use customer's preferred language from profile; fall back to store default if not available.

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
- **FR-004**: The system MUST enforce RBAC with at least roles: Super Admin, Store Admin, Staff; permissions are granular by module/action.

Products and catalog
- **FR-010**: Store Admins/Staff MUST create, edit, publish/unpublish, and delete products with name, description, price, category, brand, attributes, labels, and images.
- **FR-011**: The system MUST support variants with per‑variant SKU, price, attributes, and inventory.
- **FR-012**: The system MUST enforce SKU uniqueness per store and slug uniqueness per store for both products and variants as applicable.
- **FR-013**: The system MUST support categories and brands, and allow assigning multiple categories to a product.
- **FR-014**: The system MUST support custom attributes (e.g., color, size) with validation and display order.
- **FR-015**: The system MUST support multiple product images and designate a primary image.
- **FR-016**: The system MUST allow product testimonials and Q&A with moderation (approve/reject) before publication.
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
- **FR-02A**: The system SHOULD support multiple shipping rate types: flat rate, percentage of cart total, weight-based, and free.
- **FR-02B**: The system MAY integrate with carrier APIs (FedEx, UPS, USPS) for real-time shipping quotes as an optional feature.
- **FR-02C**: The system MUST block checkout with clear messaging when customer's address does not match any configured shipping zone.

Tax management
- **FR-02D**: The system MUST support tax rate configuration per region (country, state, postal code) with percentage-based rates.
- **FR-02E**: The system MUST calculate tax at checkout based on shipping address and product taxability status.
- **FR-02F**: The system MUST support tax-exempt customers and tax-exempt products; tax-exempt status overrides all tax calculations.
- **FR-02G**: The system MUST generate tax reports for compliance purposes, showing tax collected per region and time period.
- **FR-02H**: The system SHOULD support multiple tax rates applying to a single order (e.g., state + local) with additive or compound calculation.
- **FR-02I**: The system SHOULD support tax-inclusive and tax-exclusive pricing display modes per store preference.
- **FR-02J**: The system MAY integrate with tax calculation services (Avalara, TaxJar) for automated tax determination as an optional feature.

Orders and payments
- **FR-030**: The system MUST list all orders with search and filter (status, date range, customer, totals, payment/shipment status).
- **FR-031**: The system MUST support order lifecycle statuses: pending → confirmed → shipped → delivered; include canceled and refunded states.
- **FR-032**: The system MUST generate unique order numbers per store and allow generating invoices and packing slips.
- **FR-033**: The system MUST send order status notifications at key stages (confirmation, shipment, delivery, cancellation, refund).
- **FR-034**: The system MUST support order cancellations (by staff or by auto‑cancel policy for unpaid orders) with configurable grace period.
- **FR-035**: The system MUST support refunds, including partial refunds at item level or amount level, with validation against captured payments.
- **FR-036**: The system MUST support SSLCommerz and Stripe payment gateways as primary payment methods.
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
- **FR-048**: The system MUST support plan upgrades and downgrades with prorated billing calculations; changes apply immediately.
- **FR-049**: The system MUST support trial periods with configurable duration (default 14 days) and automatic conversion to paid plan or expiration.
- **FR-04A**: The system MUST send notifications before plan expiration (7 days, 3 days, 1 day) and after expiration grace period.
- **FR-04B**: The system MUST restrict store access after plan expiration: read-only mode during grace period (default 7 days), then suspended.
- **FR-04C**: The system SHOULD display plan usage metrics on dashboard (e.g., "45/100 products used").
- **FR-04D**: The system SHOULD warn users when approaching plan limits (at 80% usage threshold).

Marketing
- **FR-050**: The system MUST support coupons with configurable rules (amount/percent, min spend, eligibility, usage limits, validity window).
- **FR-051**: The system MUST support flash sales with schedule windows and price overrides or discounts.
- **FR-052**: The system MUST provide newsletter campaign creation, audience selection, scheduling, and performance tracking.
- **FR-053**: The system MUST provide abandoned‑cart recovery with configurable delay and message content; attribute recovered orders.

Dashboards and reporting
- **FR-060**: The system MUST provide dashboards for sales, inventory, and customer insights with configurable thresholds and highlighting.
- **FR-061**: The system MUST support data export for reports (CSV/Excel) with applied filters and date ranges.

Content management
- **FR-070**: The system MUST manage pages, blogs, menus, FAQs, and testimonials with publish/unpublish and scheduling.
- **FR-071**: The system MUST allow theme customization per store (logo, colors, typography, layout presets) and preview before publish.
- **FR-072**: The system SHOULD support multiple UI languages with user-selectable language preference (default: English only for Phase 1).
- **FR-073**: The system SHOULD support RTL languages (Arabic, Hebrew) with appropriate layout adjustments.
- **FR-074**: The system SHOULD support per-store default language configuration and fall back to English for missing translations.
- **FR-075**: The system SHOULD support email template customization per notification type with template variables for dynamic content.
- **FR-076**: The system SHOULD provide template preview and test sending capabilities for email templates.

Email and notifications
- **FR-077**: The system MUST queue notifications with retry logic on delivery failure (exponential backoff, max 3 attempts).
- **FR-078**: The system MUST support email notifications for all order status changes, low stock alerts, and plan limit warnings.
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

Storefront features
- **FR-07J**: The system MUST provide a full-stack solution with both admin dashboard AND customer-facing storefront UI (complete turnkey e-commerce platform).
- **FR-07K**: The system MUST provide a responsive customer-facing storefront with product browsing, search, filtering, and checkout flow.
- **FR-07L**: The system MUST support home page customization (hero banners, featured products, category showcases) via admin dashboard.
- **FR-07M**: The system MUST support product listing pages with grid/list views, sorting, and filtering by categories, brands, attributes, price range.
- **FR-07N**: The system MUST support product search with autocomplete suggestions and results relevance ranking.
- **FR-07O**: The system MUST support navigation menu customization per store with multi-level menus managed from admin.
- **FR-07P**: The system SHOULD support product quick view (modal preview) without leaving listing page for improved browsing experience.
- **FR-07Q**: The system MUST be SEO-optimized with server-side rendering for product and content pages to support organic search traffic.
- **FR-07R**: The system MUST support customer account pages (login, registration, order history, address management, wish lists) on the storefront.
- **FR-07S**: The system MUST support shopping cart with persistent storage (logged-in users) and session storage (guest users).
- **FR-07T**: The system MUST provide a complete checkout flow: cart review → shipping address → shipping method → billing address → payment → order confirmation.
- **FR-07U**: The system SHOULD support store announcement/notice banner configurable from admin (e.g., promotional messages, shipping delays).
- **FR-07V**: The system SHOULD support breadcrumb navigation throughout the storefront for improved user experience and SEO.

POS
- **FR-080**: The system MUST support POS checkout for in‑store transactions, including product scan/search, discounts, tax, and receipt generation.
- **FR-081**: The system MUST update inventory and customer history upon successful POS sale.
- **FR-082**: The system SHOULD allow basic POS user roles to limit access to back‑office features.
- **FR-083**: The system SHOULD support barcode scanning for products in POS interface.
- **FR-084**: The system SHOULD support cash drawer integration and cash management tracking in POS.

Security and compliance
- **FR-090**: The system MUST require login with email/password and enforce strong password policies (length, complexity, history).
- **FR-091**: The system MUST support optional multi‑factor authentication (MFA) with: (a) TOTP authenticator apps (RFC 6238) as the primary method, (b) one‑time recovery codes for account recovery, and (c) optional SMS fallback (opt‑in per tenant). The system MAY additionally offer WebAuthn/FIDO2 security keys as an optional method for enterprises.
- **FR-092**: The system MUST support optional SSO for enterprises using OIDC and SAML 2.0 with common identity providers (e.g., Okta, Azure AD, Google, OneLogin).
- **FR-093**: The system MUST lock accounts after repeated failed login attempts for a configurable duration and notify the user.
- **FR-094**: The system MUST maintain detailed, immutable audit logs for security‑sensitive actions (auth events, role changes, inventory adjustments, order changes).
- **FR-095**: The system MUST ensure tenant isolation in all queries, exports, and scheduled jobs; cross‑tenant access is prohibited.
- **FR-096**: The system MUST sanitize all user inputs to prevent XSS attacks and validate all data before database operations.
- **FR-097**: The system MUST use HTTPS for all communications and secure session management with HTTP-only cookies.
- **FR-128**: The system MUST implement API rate limiting per user/store based on subscription plan tier to prevent abuse and ensure fair resource allocation.
- **FR-129**: The system MUST enforce tiered rate limits: Free plan (60 requests/minute), Basic (120 req/min), Pro (300 req/min), Enterprise (1000 req/min).
- **FR-130**: The system MUST return HTTP 429 (Too Many Requests) with Retry-After header when rate limits are exceeded; include clear error messaging.
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

Integrations
 - **FR-100**: The system MUST support optional integration with external e‑commerce platforms (e.g., WooCommerce/Shopify) using real-time bidirectional synchronization via webhooks for immediate data consistency across platforms.
 - **FR-101**: External platform integration MUST implement webhook handlers for both inbound (external → StormCom) and outbound (StormCom → external) events including product changes, inventory updates, order status changes, and customer data synchronization.
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
- **FR-113**: The system MUST maintain responsive performance (per success criteria timing targets) for stores with up to 10K products, 83K orders/month, and 250K customers.
- **FR-114**: The system SHOULD provide scalability monitoring dashboard for Super Admins showing per-store resource usage (database size, order volume trends, API request rates) to identify stores approaching limits.
- **FR-115**: The system SHOULD implement query optimization and caching strategies to maintain sub-3-second page loads for product listings with 10K+ products and complex filters.

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
- Role/Permission: predefined roles and granular permissions assignable per user per store.
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
- **SC-007**: Customer search/filter returns the first page of results with applied filters in under 2 seconds for typical datasets (user‑perceived instant response).
- **SC-008**: Reports and exports reflect applied filters accurately; exported files match on‑screen totals within 0.5% variance.
- **SC-009**: 100% of security‑sensitive actions are captured in audit logs with actor, timestamp, entity, and outcome.
- **SC-010**: After enabling MFA and lockout policies, unauthorized login attempts result in lockout after the configured threshold 100% of the time in tests.
- **SC-011**: Shipping calculation completes in under 3 seconds at checkout; no matching zone blocks checkout with clear message 100% of the time.
- **SC-012**: Tax calculation completes in under 2 seconds at checkout; tax-exempt status overrides tax 100% of the time.
- **SC-013**: Payment processing (authorization) completes within 10 seconds for 95% of transactions; webhook reconciliation occurs within 5 minutes.
- **SC-014**: Plan limit enforcement prevents exceeding limits 100% of the time; users receive clear messaging about limit and upgrade options.
- **SC-015**: Plan upgrade/downgrade applies new limits immediately; prorated billing calculates correctly within $0.01 for 100% of plan changes.
- **SC-016**: Stores can complete checkout flow (product → cart → shipping → tax → payment → confirmation) in under 3 minutes for typical orders.
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


