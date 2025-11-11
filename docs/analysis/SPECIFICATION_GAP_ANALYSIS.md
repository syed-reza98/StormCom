# StormCom Specification Gap Analysis

**Date**: October 17, 2025  
**Comparison**: StormCom spec vs eCommerceGo SRS  
**Purpose**: Identify unspecified requirements, missing edge cases, and clarifications needed before planning

---

## Executive Summary

This document compares the StormCom Multi-tenant E-commerce Platform specification against the comprehensive eCommerceGo SRS (148 pages, 338 forms, 756 fields analyzed). The analysis reveals **15 major feature categories** requiring specification, **8 edge case categories** needing coverage, and **8 critical clarification questions** beyond the already-identified FR-100.

### Severity Classification
- **CRITICAL (P1)**: Must be specified before planning begins - affects core functionality
- **HIGH (P2)**: Should be specified before planning - affects major features
- **MEDIUM (P3)**: Can be specified during planning - affects optional features

---

## Part 1: Unspecified Requirements

### 1. Shipping Management [CRITICAL - P1]

**Status**: Completely unspecified in current spec  
**SRS Evidence**: shipping_classes, shipping_zones, shipping_rates tables; shipping calculation in checkout flow

**Missing Requirements**:
- Shipping zone management (geographic regions with different rates)
- Shipping class management (e.g., standard, express, fragile)
- Shipping rate configuration (flat rate, percentage, weight-based, free shipping thresholds)
- Shipping calculation logic at checkout
- Carrier integration (if real-time rates needed)
- Tracking number management and customer notifications
- Shipping label generation
- Multi-zone rate tables

**Impact**: Cannot complete order checkout without shipping calculation; blocked for Phase 1 completion.

**Recommended Functional Requirements** (to be added after clarification):
- FR-120: The system MUST support shipping zone management with geographic area definitions
- FR-121: The system MUST support shipping classes with configurable rates per zone
- FR-122: The system MUST calculate shipping costs at checkout based on customer address and cart contents
- FR-123: The system MUST support free shipping thresholds per zone
- FR-124: The system MUST allow manual entry of tracking numbers and send tracking notifications

**Questions for Clarification**:
1. Should shipping rates be manually configured or integrate with carrier APIs (FedEx, UPS, USPS) for real-time quotes?
2. What shipping methods are required? (Standard, Express, Same-day, Pickup)
3. Should shipping calculation consider product weight/dimensions or just cart value?
4. Is international shipping required? If yes, customs/duties handling?

---

### 2. Tax Management [CRITICAL - P1]

**Status**: Completely unspecified in current spec  
**SRS Evidence**: tax_amount field in orders; tax settings page; tax calculation in checkout

**Missing Requirements**:
- Tax rate configuration (by region, product type, customer type)
- Tax rule engine (e.g., compound taxes, tax exemptions)
- Tax calculation logic at checkout
- Tax reporting for compliance
- Tax-exempt customer/product handling
- VAT/GST vs Sales Tax models

**Impact**: Cannot calculate order totals correctly; legal compliance risk; blocked for Phase 1.

**Recommended Functional Requirements**:
- FR-130: The system MUST support tax rate configuration per region with percentage-based rates
- FR-131: The system MUST calculate tax at checkout based on shipping address and product taxability
- FR-132: The system MUST support tax-exempt customers and products
- FR-133: The system MUST generate tax reports for compliance purposes
- FR-134: The system SHOULD support multiple tax rates applying to a single order (e.g., state + local)

**Questions for Clarification**:
1. Should tax rates be manually configured or integrate with tax services (Avalara, TaxJar)?
2. What tax models are required? (US Sales Tax, EU VAT, Canadian GST/HST, Australian GST)
3. Is digital product tax handling required (different rules than physical goods)?
4. Are there B2B scenarios requiring tax ID validation and exemptions?

---

### 3. Payment Gateway Configuration [CRITICAL - P1]

**Status**: Partially specified (FR-036 mentions "payment methods" but no details)  
**SRS Evidence**: payment settings page; payment status/reference in orders

**Missing Requirements**:
- Supported payment gateways (Stripe, PayPal, Square, etc.)
- Gateway configuration per store (API keys, sandbox vs live)
- Payment processing workflow details
- Webhook handling for async payment confirmations
- Payment method selection at checkout
- Partial payment/deposit support
- Payment retry logic on failure
- PCI compliance requirements

**Impact**: Cannot process payments; blocked for Phase 1 completion.

**Recommended Functional Requirements**:
- FR-140: The system MUST support at least Stripe and PayPal payment gateways
- FR-141: The system MUST allow Store Admins to configure payment gateway credentials per store
- FR-142: The system MUST handle payment webhooks for async payment confirmation
- FR-143: The system MUST retry failed payments with exponential backoff
- FR-144: The system MUST support test/sandbox mode for payment testing
- FR-145: The system MUST not store raw credit card data (PCI compliance)

**Questions for Clarification**:
1. Which payment gateways are must-have for Phase 1? (Stripe, PayPal, Square, Authorize.net)
2. Are COD (Cash on Delivery) and bank transfer required?
3. Is subscription/recurring billing required? (for plan subscriptions)
4. Should the system support payment installments or split payments?

---

### 4. Subscription/Plan Management [CRITICAL - P1 for SaaS]

**Status**: Completely unspecified in current spec  
**SRS Evidence**: plans and plan_subscriptions tables; plan management page with pricing tiers

**Missing Requirements**:
- Plan tier definitions (Free, Basic, Pro, Enterprise)
- Feature limits per plan (max products, orders, staff, storage)
- Billing cycle management (monthly, yearly)
- Plan upgrade/downgrade workflows
- Trial period management
- Usage limit enforcement
- Plan expiration and renewal
- Prorated billing on plan changes
- Plan feature gates throughout the application

**Impact**: No way to monetize the SaaS; no tenant limits; critical for business model.

**Recommended Functional Requirements**:
- FR-150: The system MUST support multiple subscription plan tiers with configurable pricing
- FR-151: The system MUST enforce plan limits (max products, orders, staff, storage) per store
- FR-152: The system MUST prevent operations that would exceed plan limits with clear messaging
- FR-153: The system MUST support plan upgrades and downgrades with prorated billing
- FR-154: The system MUST support trial periods with automatic conversion or expiration
- FR-155: The system MUST send notifications before plan expiration and after expiration grace period
- FR-156: The system MUST restrict store access (read-only or suspended) after plan expiration

**Questions for Clarification**:
1. What are the specific plan tiers and limits for Phase 1? (Need a plan matrix)
2. Should billing be handled in-app or via external service (Stripe Billing, Chargebee)?
3. What is the trial period duration? (7 days, 14 days, 30 days)
4. What happens to store data after plan expiration? (grace period, data retention policy)
5. Are custom enterprise plans with negotiated pricing required?

---

### 5. Multi-language/Localization [HIGH - P2]

**Status**: Completely unspecified in current spec  
**SRS Evidence**: 16 different language pages in SRS audit (English, Chinese, Arabic, French, German, Spanish, etc.)

**Missing Requirements**:
- UI language selection (admin panel)
- Translation management for UI strings
- RTL (Right-to-Left) language support (Arabic, Hebrew)
- Date/time format localization
- Number format localization
- Language selection per store
- Content translation (product descriptions, pages, etc.)
- Fallback language logic
- Translation completeness tracking

**Impact**: Limits market reach; blocks international expansion; not critical for Phase 1 MVP.

**Recommended Functional Requirements**:
- FR-160: The system SHOULD support multiple UI languages with user-selectable language preference
- FR-161: The system SHOULD support RTL languages (Arabic, Hebrew) with appropriate layout adjustments
- FR-162: The system SHOULD support per-store default language configuration
- FR-163: The system SHOULD fall back to English for missing translations
- FR-164: The system MAY support content translation management for products, pages, and blogs

**Questions for Clarification**:
1. How many languages are required for Phase 1? (English only, or add 3-5 key languages?)
2. Should admin UI be translated or English only?
3. Should product content (names, descriptions) be translatable?
4. Is automatic translation integration needed (Google Translate API)?

---

### 6. Multi-currency Support [HIGH - P2]

**Status**: Partially specified (currency mentioned in store settings but no multi-currency logic)  
**SRS Evidence**: currency field in stores table

**Missing Requirements**:
- Multiple currency selection
- Currency conversion rate management (manual or API-based)
- Price display in customer's selected currency
- Order processing in original vs display currency
- Refund currency handling
- Currency switching without losing cart
- Exchange rate update scheduling

**Impact**: Limits international sales capability; not critical for Phase 1 domestic-only MVP.

**Recommended Functional Requirements**:
- FR-170: The system SHOULD support multiple currencies with configurable exchange rates
- FR-171: The system SHOULD allow customers to view prices in their preferred currency
- FR-172: The system SHOULD process orders in the store's base currency for reporting consistency
- FR-173: The system SHOULD update exchange rates daily via API or manual entry

**Questions for Clarification**:
1. Is multi-currency required for Phase 1 or Phase 2?
2. Should conversion rates be updated automatically (API integration) or manually?
3. Should refunds be issued in the original payment currency or current rate?

---

### 7. Delivery Management (Delivery Boy/Driver) [HIGH - P2]

**Status**: Completely unspecified in current spec  
**SRS Evidence**: delivery_boys and delivery_assignments tables; delivery boy management pages

**Missing Requirements**:
- Delivery personnel management (create, edit, activate/deactivate)
- Order assignment to delivery personnel
- Delivery status tracking (assigned, in-transit, delivered)
- Delivery boy mobile app considerations
- Delivery route optimization
- Delivery proof (signature, photo)
- Delivery boy performance metrics
- Customer-to-driver communication

**Impact**: Needed for last-mile delivery; can be Phase 2 if stores handle shipping via carriers.

**Recommended Functional Requirements**:
- FR-180: The system SHOULD support delivery personnel management with profile, contact, and vehicle info
- FR-181: The system SHOULD allow assignment of orders to delivery personnel
- FR-182: The system SHOULD track delivery status and update customers
- FR-183: The system MAY provide a delivery personnel mobile interface for status updates

**Questions for Clarification**:
1. Is in-house delivery management required for Phase 1 or Phase 2?
2. If Phase 1, what delivery features are must-have vs nice-to-have?
3. Is a separate mobile app for delivery personnel in scope?

---

### 8. Support Ticket System [HIGH - P2]

**Status**: Completely unspecified in current spec  
**SRS Evidence**: support_tickets and ticket_replies tables; support ticket management pages

**Missing Requirements**:
- Ticket creation (by customer or staff on behalf)
- Ticket status lifecycle (new, open, in-progress, resolved, closed)
- Priority levels (low, medium, high, urgent)
- Ticket assignment to staff members
- Ticket replies with internal notes vs customer-visible
- Ticket categorization and tagging
- Ticket SLA tracking
- Email integration (ticket creation via email)
- Customer portal for ticket viewing

**Impact**: Important for customer service; can be Phase 2 if using external helpdesk initially.

**Recommended Functional Requirements**:
- FR-190: The system SHOULD support customer support ticket creation and management
- FR-191: The system SHOULD support ticket status lifecycle with staff assignment
- FR-192: The system SHOULD support priority levels and SLA tracking
- FR-193: The system SHOULD allow internal notes separate from customer-visible replies

**Questions for Clarification**:
1. Is built-in ticket system required for Phase 1 or can use external service (Zendesk, Intercom)?
2. If Phase 1, what ticket features are must-have vs nice-to-have?

---

### 9. Tags System [MEDIUM - P3]

**Status**: Completely unspecified in current spec  
**SRS Evidence**: tags and taggables (polymorphic) tables; tag management page

**Missing Requirements**:
- Polymorphic tagging (products, blogs, pages)
- Tag creation and management
- Tag-based search and filtering
- Tag cloud/popular tags
- Tag merging and deletion

**Impact**: Nice-to-have for content organization; not critical for Phase 1.

**Recommended Functional Requirements**:
- FR-200: The system MAY support tagging for products, blogs, and pages
- FR-201: The system MAY support tag-based filtering and search

**Questions for Clarification**:
1. Are tags required for Phase 1 or Phase 2?

---

### 10. Product-specific Features [MEDIUM - P2/P3]

**Status**: Partially specified (testimonials and Q&A mentioned, but missing other features)  
**SRS Evidence**: Various product-related features in SRS

**Missing Requirements**:
- Downloadable/digital products (file delivery)
- Product barcodes (for scanning in POS)
- Product comparison feature
- Recently viewed products
- Related/recommended products
- Product reviews (separate from testimonials - rating system)
- Product video support
- Product badges/icons beyond labels

**Impact**: Enhances product catalog; some features (digital products, barcodes) may be Phase 1 depending on business needs.

**Recommended Functional Requirements**:
- FR-210: The system SHOULD support downloadable products with secure file delivery after purchase
- FR-211: The system SHOULD support barcode generation and scanning for products
- FR-212: The system MAY support product comparison feature
- FR-213: The system MAY track recently viewed products per customer

**Questions for Clarification**:
1. Are digital/downloadable products required for Phase 1?
2. Is barcode support needed for POS integration?

---

### 11. Email/Notification Templates [HIGH - P2]

**Status**: Partially specified (notifications mentioned but no template management)  
**SRS Evidence**: Email settings in store configuration; various notification triggers

**Missing Requirements**:
- Email template management (create, edit, preview)
- Template variables/placeholders
- Template testing (send test email)
- Per-store template customization
- Notification channel configuration (email, SMS, push)
- Notification scheduling and queuing
- Notification delivery tracking
- Unsubscribe management

**Impact**: Important for professional communication; basic templates can be hardcoded for Phase 1 MVP.

**Recommended Functional Requirements**:
- FR-220: The system SHOULD support email template customization per notification type
- FR-221: The system SHOULD support template variables for dynamic content
- FR-222: The system SHOULD provide template preview and test sending
- FR-223: The system SHOULD queue notifications with retry logic on delivery failure

**Questions for Clarification**:
1. Are customizable templates required for Phase 1 or can use default templates?
2. What notification channels are required? (Email only, or also SMS, push notifications?)

---

### 12. Store Settings - Extended Details [CRITICAL - P1]

**Status**: Partially specified (basic settings mentioned but missing critical details)  
**SRS Evidence**: Extensive settings forms in SRS (app-setting page with 6 forms)

**Missing Requirements**:
- **Checkout settings**: Guest checkout enabled/disabled, terms acceptance required, minimum order amount
- **Low stock notification settings**: Threshold per product or global, notification recipients
- **Order auto-cancellation timeout**: Configurable duration (currently mentioned in assumptions but not in FR)
- **Email sender configuration**: From name, from email, reply-to, SMTP settings
- **Store contact information**: Phone, address, business hours for storefront display
- **Social media links**: Facebook, Instagram, Twitter, etc.
- **SEO settings**: Meta title, meta description, Open Graph tags
- **Analytics integration**: Google Analytics, Facebook Pixel tracking codes
- **Cookie consent**: GDPR compliance cookie banner configuration
- **Maintenance mode**: Enable/disable store with custom message

**Impact**: Many settings are required for basic operation; critical for Phase 1.

**Recommended Functional Requirements**:
- FR-230: The system MUST support checkout settings (guest checkout, minimum order, terms acceptance)
- FR-231: The system MUST support configurable order auto-cancellation timeout per store
- FR-232: The system MUST support email sender configuration (SMTP or transactional email service)
- FR-233: The system SHOULD support store contact information for storefront display
- FR-234: The system SHOULD support social media link configuration
- FR-235: The system SHOULD support basic SEO settings (meta tags, descriptions)
- FR-236: The system SHOULD support maintenance mode with custom message

**Questions for Clarification**:
1. What are the default settings values for new stores?
2. Are all settings required for Phase 1 or can some be Phase 2?

---

### 13. Module/Add-on System [LOW - P3]

**Status**: Completely unspecified in current spec  
**SRS Evidence**: modules table; add-on manager page

**Missing Requirements**:
- Module/add-on marketplace
- Module installation and activation
- Module configuration
- Module versioning and updates
- Module API/hooks for extensibility

**Impact**: Nice-to-have for extensibility; not critical for Phase 1; likely Phase 2 or 3.

**Recommended Functional Requirements**:
- FR-240: The system MAY support an add-on/module system for extensibility

**Questions for Clarification**:
1. Is a module system required for Phase 1 or future phase?

---

### 14. Mobile App Configuration [LOW - P3]

**Status**: Completely unspecified in current spec  
**SRS Evidence**: mobile-app settings page

**Missing Requirements**:
- Mobile app configuration settings
- Push notification setup
- App version management
- App-specific branding

**Impact**: Only relevant if building mobile apps; likely out of scope for Phase 1 web platform.

**Recommended Functional Requirements**:
- FR-250: The system MAY support mobile app configuration if mobile apps are built

**Questions for Clarification**:
1. Are mobile apps (iOS/Android) in scope for Phase 1, 2, or future?

---

### 15. Storefront Features [HIGH - P2]

**Status**: Mentioned in overview but no specific requirements  
**SRS Evidence**: Theme customization, storefront pages

**Missing Requirements**:
- Home page layout customization (hero banner, featured products, categories)
- Banner/slider management
- Product listing page options (grid/list, items per page, sorting)
- Product detail page layout
- Search configuration (search scope, filters, autocomplete)
- Store navigation menu customization
- Footer content management
- Store announcement/notice banner
- Product quick view (modal)

**Impact**: Critical if building customer-facing storefront; if headless API only, then not applicable.

**Recommended Functional Requirements**:
- FR-260: The system SHOULD provide a customer-facing storefront with responsive design
- FR-261: The system SHOULD support home page customization (banners, featured products)
- FR-262: The system SHOULD support product listing with filtering and sorting
- FR-263: The system SHOULD support product search with autocomplete
- FR-264: The system SHOULD support navigation menu customization

**Questions for Clarification**:
1. **Is StormCom building a full customer-facing storefront or just an admin API?** (CRITICAL QUESTION)
2. If storefront is included, what are the must-have features vs nice-to-have?
3. Should storefront be SEO-optimized (SSR) or client-side rendered (SPA)?

---

## Part 2: Missing Edge Cases

### 1. Shipping Edge Cases

**Missing from spec**:
- What happens if no shipping zone matches the customer's address? (Should block checkout with clear message)
- What if shipping calculation fails due to API timeout? (Retry, fallback, or allow manual entry)
- Free shipping threshold behavior with multiple currencies (convert to base currency first)
- Shipping cost changes between cart and checkout (price lock vs dynamic)
- Shipping to PO Box or APO/FPO addresses (some carriers don't support)
- Split shipments for backordered items (calculate shipping per shipment or full order)

**Recommended additions to Edge Cases section**:
- No matching shipping zone must block checkout with message: "Shipping to your location is not available. Please contact support."
- Shipping calculation failure must retry 3 times, then allow manual override by staff, or offer pickup option.
- Free shipping thresholds are compared against cart total in store's base currency after conversion.

---

### 2. Tax Edge Cases

**Missing from spec**:
- Tax calculation failures (tax service API down) - proceed without tax vs block checkout
- Multiple tax rates applying to same order (e.g., state + county + city) - additive or compound
- Tax-exempt customers ordering taxable and non-taxable products - partial tax calculation
- Tax jurisdiction changes mid-checkout (customer changes address)
- Digital products tax rules (different from physical goods in some jurisdictions)

**Recommended additions to Edge Cases section**:
- Tax calculation failure should not block checkout; proceed with 0% tax and flag order for manual review.
- Multiple tax rates are applied additively in the order configured; compound taxes are calculated on previous tax total.
- Tax-exempt customers' orders apply 0% tax regardless of product taxability.

---

### 3. Payment Edge Cases

**Missing from spec**:
- Payment webhook arrives after auto-cancel window - restore order and mark as paid
- Payment partially captured (amount less than order total) - flag for manual review
- Double payment due to customer retry - refund duplicate automatically
- Payment gateway timeout during checkout - retry or allow retry by customer
- Payment held for review by payment gateway - mark order as pending verification
- Refund request for order paid with expired/deleted payment method

**Recommended additions to Edge Cases section**:
- Payment webhook arriving after auto-cancel must restore canceled order, mark as paid, and send confirmation.
- Partial payment captures must flag order for manual review; do not fulfill until full payment confirmed.
- Duplicate payments detected by transaction ID must refund automatically and log incident.

---

### 4. Multi-currency Edge Cases

**Missing from spec**:
- Currency conversion rates update during checkout - lock rate at cart initialization
- Refund in different currency than original payment - refund at current rate vs original rate
- Price display rounding errors accumulating across order items
- Customer switches currency after adding items to cart - recalculate or preserve original

**Recommended additions to Edge Cases section**:
- Currency conversion rates are locked at cart creation; updates do not affect pending orders.
- Refunds are processed in the original payment currency at the original exchange rate.

---

### 5. Subscription/Plan Limit Edge Cases

**Missing from spec**:
- Store reaches max product limit mid-import - stop import, allow completion up to limit
- Store downgrades plan with existing data exceeding new limits - no deletion, mark as over-limit, prevent new additions
- Store reaches max order limit for billing period - prevent new orders vs allow with overage charge
- Plan expires during active order processing - allow in-progress orders to complete
- Limit enforcement during bulk operations (import, batch updates)

**Recommended additions to Edge Cases section**:
- Reaching plan limits must prevent new creations with clear messaging; existing data is preserved.
- Plan downgrades with excess data mark store as over-limit; no new additions until within limits or upgrade.
- Plan expiration during order processing allows in-progress orders to complete; new orders blocked.

---

### 6. Multi-language Edge Cases

**Missing from spec**:
- Product content missing translation in selected language - fallback to default language vs show empty
- Search with non-English characters (e.g., Chinese, Arabic) - ensure indexing supports
- Language switching preserves cart and session - URL parameters vs cookie vs session
- Email notifications in customer's preferred language - detect from user settings vs order metadata

**Recommended additions to Edge Cases section**:
- Missing translations fall back to store's default language; mark with indicator "(English)" if applicable.
- Search indexing supports Unicode; non-English queries are normalized and stemmed appropriately.

---

### 7. Delivery Management Edge Cases

**Missing from spec**:
- No available delivery personnel for assigned orders - queue orders, notify admin
- Delivery person cancels/becomes unavailable mid-delivery - allow re-assignment
- Multiple delivery attempts failed - mark order for customer pickup or return
- Delivery address changed after assignment - notify delivery person, recalculate route

**Recommended additions to Edge Cases section**:
- Orders assigned to unavailable delivery personnel must be unassigned and queued with admin notification.
- Delivery person cancellation during delivery allows immediate re-assignment with route recalculation.

---

### 8. Theme/Customization Edge Cases

**Missing from spec**:
- Invalid theme configuration (broken CSS/layout) - revert to default theme automatically
- Theme update introduces breaking changes - maintain theme version compatibility
- Preview theme differs from live theme after publish - atomic publish or rollback on error
- Custom CSS injection vulnerabilities - sanitize and validate theme customizations

**Recommended additions to Edge Cases section**:
- Invalid theme configuration triggers automatic revert to default theme with admin notification.
- Theme previews are isolated; publish is atomic with validation before going live.

---

## Part 3: Critical Clarification Questions

Beyond the already-identified **FR-100 (External platform sync)**, the following questions **MUST** be answered before planning:

### Q1: Storefront Architecture [CRITICAL]
**Question**: Is StormCom building a full customer-facing storefront with UI, or is it a headless API that stores will integrate with their own frontends?

**Impact**: Affects scope of 15+ functional requirements related to storefront features, SEO, theming, etc.

**Options**:
- **Option A**: Full-stack with admin + customer storefront UI (like eCommerceGo SRS)
- **Option B**: Admin UI + headless API for storefront (stores build their own frontends)
- **Option C**: Admin UI + basic storefront, but extensible API for custom frontends

**Recommendation**: Clarify before proceeding; this is a scope-defining decision.

---

### Q2: Payment Gateways [CRITICAL]
**Question**: Which payment gateways are must-have for Phase 1?

**Impact**: Affects integration complexity and payment processing requirements.

**Options**:
- **Minimum**: Stripe only (fastest to implement)
- **Standard**: Stripe + PayPal (covers most markets)
- **Extended**: Stripe + PayPal + Square + Authorize.net (enterprise-ready)
- **Full**: All major gateways via payment abstraction library

**Recommendation**: Stripe + PayPal for Phase 1; others in Phase 2.

---

### Q3: Shipping Calculation [CRITICAL]
**Question**: Should shipping be manually configured rates or integrate with carrier APIs for real-time quotes?

**Impact**: Affects complexity and accuracy of shipping costs.

**Options**:
- **Option A**: Manual rate tables only (zones + classes)
- **Option B**: Manual rates + optional carrier API integration (FedEx, UPS, USPS)
- **Option C**: Carrier APIs only (no manual rates)

**Recommendation**: Option B - manual rates for Phase 1 with carrier API hooks for Phase 2.

---

### Q4: Tax Calculation [CRITICAL]
**Question**: Should tax be manually configured or integrate with tax services?

**Impact**: Affects accuracy and compliance, especially for US sales tax nexus.

**Options**:
- **Option A**: Manual tax rates only (simple % per region)
- **Option B**: Manual rates + optional tax service API (Avalara, TaxJar)
- **Option C**: Tax service API only (no manual)

**Recommendation**: Option B - manual rates for Phase 1 with tax API hooks for Phase 2.

---

### Q5: Subscription Plans [CRITICAL for SaaS Business Model]
**Question**: What are the specific plan tiers, pricing, and limits for Phase 1?

**Impact**: Affects plan enforcement throughout application and revenue model.

**Required**: A plan matrix table like:

| Feature | Free | Basic | Pro | Enterprise |
|---------|------|-------|-----|------------|
| Monthly Price | $0 | $29 | $99 | Custom |
| Max Products | 10 | 100 | 1000 | Unlimited |
| Max Orders/month | 10 | 100 | 1000 | Unlimited |
| Max Staff Users | 1 | 3 | 10 | Unlimited |
| Storage | 100MB | 1GB | 10GB | Custom |
| Support | Community | Email | Priority | Dedicated |
| Custom Domain | ❌ | ✅ | ✅ | ✅ |
| API Access | ❌ | Limited | Full | Full |

**Recommendation**: Define plan matrix before planning begins.

---

### Q6: Multi-language Support [HIGH Priority]
**Question**: How many languages should be supported in Phase 1? UI only or also content?

**Impact**: Affects development timeline and testing scope.

**Options**:
- **Option A**: English only for Phase 1 (fastest)
- **Option B**: English + 3-5 key languages (Spanish, French, German, Chinese, Arabic)
- **Option C**: Full 16-language support like eCommerceGo

**Recommendation**: English only for Phase 1; add languages in Phase 2 based on market demand.

---

### Q7: Delivery Management [HIGH Priority]
**Question**: Is in-house delivery management required for Phase 1, or will stores use external carriers?

**Impact**: If required, adds significant scope (delivery personnel management, mobile app, routing).

**Options**:
- **Option A**: No delivery management - stores use carrier shipping only
- **Option B**: Basic delivery assignment (no mobile app)
- **Option C**: Full delivery management with mobile app

**Recommendation**: Option A for Phase 1; add Option B in Phase 2 if market demands.

---

### Q8: Support Ticket System [HIGH Priority]
**Question**: Is built-in support ticket system required for Phase 1, or can stores use external helpdesk?

**Impact**: If required, adds scope for ticket management, routing, SLA tracking.

**Options**:
- **Option A**: No built-in tickets - use external service (Zendesk, Intercom integration)
- **Option B**: Basic ticket system (create, reply, close)
- **Option C**: Full ticket system with SLA, routing, internal notes

**Recommendation**: Option A for Phase 1 (integrate with external helpdesk); build Option B in Phase 2.

---

## Part 4: Recommended Actions

### Immediate Actions (Before Planning)

1. **Answer the 8 clarification questions** above (Q1-Q8) - especially Q1 (storefront architecture)
2. **Resolve FR-100** (external platform sync direction/frequency)
3. **Define subscription plan matrix** with specific tiers and limits
4. **Create shipping requirements** (FR-120 through FR-124) based on Q3 answer
5. **Create tax requirements** (FR-130 through FR-134) based on Q4 answer
6. **Create payment requirements** (FR-140 through FR-145) based on Q2 answer
7. **Create plan management requirements** (FR-150 through FR-156) based on plan matrix

### Phase 1 Scope Recommendations

**Must Include (CRITICAL - P1)**:
- Shipping management (FR-120 to FR-124)
- Tax management (FR-130 to FR-134)
- Payment gateways (FR-140 to FR-145)
- Plan management (FR-150 to FR-156)
- Extended store settings (FR-230 to FR-236)

**Should Include (HIGH - P2)**:
- Multi-language (FR-160 to FR-164) - at least English + 1-2 languages
- Email templates (FR-220 to FR-223) - basic customization
- Storefront features (FR-260 to FR-264) - if applicable per Q1

**Can Defer to Phase 2 (MEDIUM/LOW - P3)**:
- Multi-currency (FR-170 to FR-173)
- Delivery management (FR-180 to FR-183)
- Support tickets (FR-190 to FR-193)
- Tags (FR-200 to FR-201)
- Digital products (FR-210 to FR-213)
- Module system (FR-240)
- Mobile app settings (FR-250)

### Updated Requirements Checklist Status

After addressing all gaps above, the requirements checklist should be:

- [x] No implementation details
- [x] Focused on user value
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed
- [ ] **No [NEEDS CLARIFICATION] markers remain** ← Still failing due to:
  - FR-100 (external platform sync)
  - Q1-Q8 (8 critical questions above)
  - 15 unspecified feature categories
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] All acceptance scenarios are defined
- [ ] **Edge cases are identified** ← Need to add 8 edge case categories above
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Conclusion

The StormCom specification is well-structured and covers core e-commerce operations (products, orders, inventory, customers, marketing, content) thoroughly. However, **15 major feature categories** are completely or partially unspecified, **8 edge case categories** are missing, and **9 critical clarification questions** (including FR-100) must be answered before planning can begin.

**Estimated Impact**: Addressing all gaps will add approximately **50-70 functional requirements** to the spec.

**Recommendation**: Schedule a clarification session to answer Q1-Q8 and FR-100, then update the spec with the new requirements before proceeding to the planning phase.

---

**Next Steps**:
1. Review this gap analysis with stakeholders
2. Answer clarification questions Q1-Q8 and FR-100
3. Update spec with new functional requirements based on answers
4. Update edge cases section with recommended additions
5. Re-run requirements checklist validation
6. Proceed to planning phase once checklist is fully green
