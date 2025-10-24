# Feature Specification: StormCom Multi-tenant E‑commerce Platform

**Feature Branch**: `001-multi-tenant-ecommerce`  
**Created**: 2025-10-17  
**Status**: Draft  
**Input**: High-level request to build “StormCom,” a multi-tenant e‑commerce SaaS enabling businesses to manage products, orders, inventory, customers, marketing, content, POS, themes, and security with strong tenant isolation and a unified super admin dashboard.

## Clarifications

### Session 2025-10-17

- Q: Which SSO standard(s)/provider scope should be supported for enterprise SSO? → A: OIDC + SAML (both)
- Q: Which MFA method(s) should be supported? → A: Adopt the recommended stack: TOTP authenticator apps (RFC 6238) as the primary method with single-use backup codes for account recovery; optional SMS fallback (opt‑in per tenant); optional WebAuthn/FIDO2 security keys for enterprises.
- Q: External platform sync (scope, direction, frequency)? → A: Real-time bidirectional sync with webhooks for immediate data consistency in both directions, including conflict resolution strategies.
- Q: What are the scalability targets per store before performance degradation? → A: Mid-market scale - Up to 10K products, 1M orders/year (≈83K orders/month), 250K customers per store.
- Q: What uptime SLA should StormCom guarantee? → A: 99.9% uptime (≈43 minutes downtime/month) - standard SaaS reliability target.
- Q: What data retention policy should be enforced for compliance? → A: Standard retention - 3 years for orders/invoices, 1 year for audit logs, 90 days for backups.
- Q: What API rate limiting strategy should be enforced? → A: Tiered rate limiting by subscription plan - Free (60 req/min), Basic (120 req/min), Pro (300 req/min), Enterprise (1000 req/min).

### Session 2025-10-20

- Q: How should the Role/Permission system be modeled in the database to support granular permissions? → A: Predefined roles with fixed permissions (no custom roles in Phase 1)
- Q: How should user sessions be stored to support fast invalidation (<60s) while maintaining scalability? → A: JWT + Server-side session store with environment-based implementation: Vercel KV (Redis) in production for <10ms lookups and immediate invalidation; in-memory Map fallback for local development (no Redis dependency). Session ID stored in JWT, validated on every request.
- Q: How should MFA backup codes be stored to balance security and usability? → A: Generate 10 single-use backup codes during MFA enrollment, stored as bcrypt hashes (cost factor 12). Display codes once during enrollment with download/print option. Mark each code as used after consumption. Codes expire after 1 year or when MFA is disabled.
- Q: Should Super Admins be required to use MFA, or should it be optional like other user types? → A: Optional MFA for all users including Super Admins during initial development phase - maintains consistency and flexibility. MFA can be made required for privileged accounts in future phases based on security requirements.

### Session 2025-10-23

- Q: What observability infrastructure should be used for metrics, logging, and tracing? → A: Vercel native only (Analytics + Logs + Speed Insights)
- Q: What circuit breaker configuration should be used for external API calls (payment gateways, shipping APIs, tax services)? → A: Adaptive circuit breaker with fallback (5 failures/1min → open 30s, exponential backoff, graceful degradation)
- Q: What customer-facing error message strategy should be used for storefront errors? → A: User-friendly errors with support context (generic message + error code + "Contact Support" link with pre-filled context)
- Q: What proactive monitoring strategy should be used for database connection pool management? → A: Threshold alerting with auto-scaling hints (alert at 70% utilization, suggest pool size increase, log slow queries)
- Q: What retention policy should be used for webhook dead letter queue (DLQ) failed events? → A: 30-day retention (align with backup retention policy)

## Technical Assumptions

### Infrastructure & Deployment (Vercel Platform)

- **Vercel Serverless Functions**: 10-second timeout (Hobby/Pro tier), 60-second timeout (Enterprise tier with advance request); 1024MB memory default, configurable up to 3008MB on Enterprise.
- **Database**: PostgreSQL 15+ required for full-text search with pg_trgm extension (trigram similarity for autocomplete); pg_stat_statements for query performance monitoring.
- **CDN**: Vercel Edge Network for static assets (images, CSS, JS) with automatic global distribution and cache invalidation.
- **Email Service**: Resend transactional email service; rate limit 100 emails/hour (Free tier), 1000/hour (Pro tier); batch sending for newsletters uses 5req/sec throttling.
- **Observability Stack**: Vercel native observability suite: (1) **Vercel Analytics** for Web Vitals monitoring (LCP, FID, CLS metrics), (2) **Vercel Logs** for serverless function logs with search and filtering, (3) **Vercel Speed Insights** for real-time performance tracking. All observability accessible via Vercel dashboard with 30-day retention on Pro tier. Application-level logging uses structured JSON format with correlation IDs for request tracing.

### Browser Support & Compatibility

- **Supported Browsers**: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+, mobile Safari iOS 14+, Chrome Android 90+.
- **Responsive Breakpoints**: 640px (sm), 768px (md), 1024px (lg), 1280px (xl), 1536px (2xl) - mobile-first approach.
- **JavaScript**: ES2020+ features; no IE11 support; polyfills only for Safari 14 (Promise.allSettled, String.replaceAll).
- **Progressive Enhancement**: Core checkout flow works without JavaScript (server-side rendering + forms); enhanced features (autocomplete, real-time validation) require JavaScript.

### Design & Styling Standards
StormCom's UI follows a unified design system across the admin dashboard and customer storefront. These guidelines ensure consistency, accessibility, and maintainability.

**Design System Overview**
 - Use **Tailwind CSS 4.1.14+** with custom configuration and **shadcn/ui** (built on top of Radix UI) as the primary component library. Avoid writing custom CSS except for design tokens.
 - Define reusable design tokens for colors, typography, spacing, and border radius. Store tokens in `tailwind.config.ts` and document them in `docs/design-system.md`.

**Color Palette**
 - Define a core palette with roles: **primary**, **secondary**, **neutral**, **success**, **warning**, and **danger**. Default values:  
   - `primary`: `#0f766e` (teal)  
   - `secondary`: `#7c3aed` (purple)  
   - `neutral`: `#64748b` (slate)  
   - `success`: `#16a34a` (green)  
   - `warning`: `#ca8a04` (amber)  
   - `danger`: `#dc2626` (red)  
   Ensure all text/background combinations meet WCAG 2.1 AA contrast (≥ 4.5:1).  
 - Each store may override the primary color via the `primaryColor` field (and optional `secondaryColor`) in the `Store` model. Use CSS variables to apply dynamic theming based on store configuration.

**Typography**
 - Use **Inter**, `sans-serif` as the default font family. Provide fallbacks (`ui-sans-serif, system-ui`).  
 - Heading hierarchy: `h1` → `text-3xl font-semibold`, `h2` → `text-2xl font-semibold`, `h3` → `text-xl font-medium`.  
 - Body text: `text-base leading-relaxed`.  
 - Use `text-sm` for form labels, helper text, and table captions.  
 - Avoid excessive letter-spacing; rely on Tailwind's tracking utilities (e.g., `tracking-tight`).

**Spacing & Layout**
 - Use a base unit of **4 px** (Tailwind's `0.5` spacing) and multiples thereof. Standard gaps: `4`, `6`, `8`, `12`, `16`.  
 - Pages use a max width of `1280px` (`max-w-screen-xl`) and center content.  
 - Employ the **12‑column CSS grid** for complex layouts; otherwise, use Flexbox for simple row/column arrangements.  
 - Standard border radius: `rounded-lg` for cards, `rounded-md` for buttons/inputs.

**Components & Patterns**
 - Compose UI using **shadcn/ui** primitives: `Button`, `Input`, `Label`, `Card`, `Dialog`, `Tabs`, `Accordion`, `Table`. Extend only via Tailwind classes or variant props; never modify underlying Radix styles directly.  
 - All custom components must support dark mode via CSS variables and the `data-theme` attribute.  
 - Provide global layout wrappers (`DashboardShell`, `StorefrontLayout`) with consistent padding, page titles, and breadcrumbs.

**Dark Mode**
 - Implement dark mode using CSS variables toggled by a `theme-toggle` component. Store the user's preference in `localStorage`.  
 - Define dark variants of all palette colors (e.g., `primary-dark`, `neutral-dark`) ensuring contrast requirements.

**Icons & Imagery**
 - Use **lucide-react** icons for vector icons; maintain consistent stroke width (`1.5 px`).  
 - Provide descriptive `aria-label` or `title` attributes for icons used without text.  
 - Optimize images via Next.js `<Image>` component with responsive `sizes` and `priority` flags. All images must include `alt` text.

**Motion & Interaction**
 - Use **Framer Motion** for enter/exit transitions and interactive feedback (e.g., modal slide-in, dropdown fade).  
 - Respect user motion preferences (`prefers-reduced-motion`); disable animations when necessary.  
 - Provide visual feedback on hover, focus, active, and disabled states with subtle transitions (e.g., `transition-colors`, `duration-150`).

**Documentation**
 - Document all tokens, components, and layout patterns in `docs/design-system.md` with usage guidelines and examples.  
 - Provide Figma or comparable design source files for designers and developers to reference; include links in the design docs.  

**Error Messaging & User Feedback**
 - Implement user-friendly error messages for all customer-facing errors (storefront, checkout, account management) following this strategy: (1) **Generic user message**: Clear, non-technical explanation (e.g., "We couldn't process your payment. Please try a different payment method."), (2) **Error code**: Unique identifier for support troubleshooting (e.g., "Error Code: PMT-4521"), (3) **Support context link**: "Contact Support" button with pre-filled context (error code, timestamp, user session ID, affected resource) opening support form or email template, (4) **Actionable guidance**: Suggest next steps when possible (e.g., "Try again", "Use different card", "Contact your bank"), (5) **Visual consistency**: Error messages use `danger` color theme with alert icon, displayed in toast notifications for transient errors or inline for form validation.
 - Admin dashboard errors may include technical details (stack traces, database errors) for debugging but MUST NOT expose these to customers.
 - All error messages logged to Vercel Logs with correlation ID for tracing user journey and debugging.

These guidelines supersede any ambiguous terminology (e.g., "centered card layout") and serve as the baseline for all UI/UX decisions.

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

### Circuit Breaker & Resilience Patterns

- **Circuit Breaker Configuration**: Adaptive circuit breaker pattern applied to all external API calls (payment gateways, shipping APIs, tax services, WooCommerce/Shopify sync) with the following parameters: (1) **Failure Threshold**: 5 failures within 1-minute sliding window triggers circuit open, (2) **Open State Duration**: 30 seconds initial timeout (circuit rejects requests immediately without calling external service), (3) **Exponential Backoff**: After initial 30s timeout, retry intervals increase exponentially (30s → 60s → 120s → 240s, max 5 minutes) until success, (4) **Half-Open State**: After timeout expires, allow single test request; if successful, close circuit; if failed, reopen circuit for next backoff interval, (5) **Graceful Degradation**: When circuit open, return user-friendly error with fallback behavior (e.g., tax calculation timeout proceeds with 0% tax + manual review flag; shipping quote timeout offers manual rate entry or pickup option; payment gateway timeout suggests alternative payment method).
- **Health Monitoring**: Circuit breaker state tracked per external service endpoint with metrics dashboard showing current state (closed/open/half-open), failure rate, last failure timestamp, and recovery attempts. Super Admin alerts triggered when circuit remains open for >5 minutes.
- **Manual Override**: Super Admins can manually force circuit closed (emergency override) or reset failure counters via admin dashboard; all manual actions logged to audit trail.

### Security & Compliance Assumptions

- **Password Policy**: Minimum 8 characters; requires uppercase, lowercase, number, and special character; password history (last 5 passwords) checked; bcrypt cost factor 12.
- **Session Management**: 30-minute idle timeout (sliding window: timeout resets on user activity) and 12-hour absolute expiration; sessions rotate on privilege change; stored in HttpOnly, Secure, SameSite=Lax cookies. **Session storage**: Vercel KV (Redis-compatible) in production for <10 ms validation and immediate invalidation; in-memory Map fallback for local development. Session IDs are embedded in JWTs and validated on every request.
- **Transport Security (HTTPS)**: TLS 1.3 only. Enforce HSTS headers with `max-age=63072000; includeSubDomains; preload` and automatic certificate renewal via Let's Encrypt.
- **CSRF Protection**: All state-changing requests MUST include a CSRF token bound to the user session. Idempotent GET/HEAD requests are exempt. CSRF tokens are delivered via secure cookies and validated on POST/PUT/PATCH/DELETE.
- **Security Headers**: Set strict security headers on all responses: Content-Security-Policy (nonce-based with `frame-ancestors 'none'` for the dashboard), X-Content-Type-Options `nosniff`, Referrer-Policy `strict-origin-when-cross-origin`, and, for legacy clients, X-Frame-Options `DENY`. Configure a 2-year HSTS policy as described above.
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

### Design System & UI/UX Principles

StormCom adopts a comprehensive, token-driven design system to ensure consistency, accessibility, and performance across **SMB dashboards**, **B2B admin portals**, and **consumer storefronts**:

**Framework & Libraries**
- **Next.js 16.0.0+ App Router (Including Next.js MCP Server) + React 19** (RSC-first), **TypeScript (strict)**.
- **Tailwind CSS v4** with **CSS variables** for semantic tokens.
- **Radix UI** primitives + **shadcn/ui** components (copy-in) for accessible building blocks.
- **Storybook** is the source of truth for component specs, states, and a11y checks.

**Tokens & Theming**
- Colors: `--color-bg`, `--color-fg`, `--color-muted`, `--color-border`, `--color-ring`, semantic `--color-primary|secondary|success|warning|danger|info` (+ on-color for text).
- Typography: `--font-sans`, `--font-mono`, optical sizes from **body/sm..lg** to **h1..h6**; tabular numerals for data views.
- Spacing: 4/8-pt ramp; radii `sm|md|lg|xl`; elevations `e1..e5`; z-index map for header/drawer/modal/toast/tooltip.
- Dark mode via `.dark` on `<html>`; set `color-scheme: dark` to style native UI.
- Per-tenant branding from **Store.primaryColor / secondaryColor / fontFamily** injected as CSS variables at runtime.

**Layout & Responsiveness**
- 12-col grid on desktop; fluid single-column on mobile; breakpoints: `sm(640)`, `md(768)`, `lg(1024)`, `xl(1280)`, `2xl(1536)`.
- Content max-widths to maintain readable line lengths; adaptive tables/cards; mobile bottom-sheet patterns for menus/filters.

**Components & Patterns**
- Buttons (primary/secondary/tertiary/destructive), inputs (text/textarea/select/combobox), dialogs/drawers, tabs/accordion, table (sort/filter/paginate), toasts/alerts, skeletons.
- Auth pages (login/register/mfa), dashboard shells, storefront product cards, PDP, cart, checkout, order timeline.
- Charts follow accessible palettes; KPI tiles with deltas and consistent number formatting.

**Accessibility (AA)**
- Semantic HTML first; ARIA only where necessary. Keyboard support (Tab/Shift+Tab, arrow keys), visible `:focus-visible` ring.
- **Hit targets ≥44×44** on touch; APCA-based contrast for rest/hover/focus/active in light & dark themes.
- Live regions for async updates; skip-to-content link; reduced-motion support.

**Documentation & Quality Gates**
- Each component has Storybook stories (light/dark/RTL/reduced-motion) + a11y checks.
- Playwright E2E a11y smoke tests for: Auth, Product List, PDP, Cart/Checkout.

### Theming & Multi-Tenant Overrides
- Inject tenant branding via CSS variables on `<html data-tenant="...">`; Tailwind utilities read vars (e.g., `bg-primary`).
- Contrast is validated at runtime for custom tenant colors; fall back to safe palette on failure.

### Design Ops & Governance
- Any UI change must update Storybook stories and pass a11y checks in CI.
- New components include usage notes and do/don't examples in `docs/design-system.md`.

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
- Wireframe: [Login Page Wireframe](../../docs/audit/login-register-wireframes.md#login-page) must specify all element positions, spacing, and error/empty/loading states.

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

**MFA Policy**: Multi-Factor Authentication (MFA) is optional for all user roles (Super Admin, Store Admin, Staff, Customer) during Phase 1 development to facilitate testing and initial setup. However, in production deployments, MFA becomes **REQUIRED for Super Admin accounts** to ensure maximum security for platform administration. Store Admins, Staff, and Customer accounts will have MFA as an optional security enhancement in all environments.

**Super Admin Login**:

1. Given I am a Super Admin, When I navigate to `/auth/login`, Then I see a login form with email and password fields, "Forgot Password" link, and "Sign In" button, styled as per UI requirements.
2. Given I am on the login page, When I enter a valid Super Admin email and password, Then I am authenticated and redirected to the Super Admin dashboard at `/admin/dashboard`.
3. Given I am on the login page, When I enter an invalid email format (e.g., "notanemail"), Then I see an inline validation error: "Please enter a valid email address."
4. Given I am on the login page, When I enter valid email but incorrect password, Then I see an error message: "Invalid email or password. Please try again." and the failed attempt is logged.
5. Given I have entered incorrect credentials 5 times, When I attempt to login again, Then my account is locked for 15 minutes and I see: "Account locked due to too many failed login attempts. Please try again in 15 minutes or use 'Forgot Password' to reset."
6. Given I have forgotten my password, When I click "Forgot Password" and enter my email, Then I receive a password reset link via email valid for 1 hour.
7. Given I am a Super Admin with MFA enabled (see MFA Policy above), When I enter correct credentials, Then I am prompted for a 6-digit TOTP code from my authenticator app. If I don't have access to my authenticator app, I can use one of my 10 backup codes or request SMS code (if enabled) to gain access.
8. Given I am enrolling in MFA for the first time, When I complete TOTP setup by scanning QR code, Then I am shown 10 single-use backup codes with download/print options before access is granted. These codes are displayed only once.
9. Given I have lost access to my authenticator app and backup codes, When I click "Lost access?" on MFA challenge page, Then I can request email verification link to disable MFA and reset my password.
10. Given I am authenticated as Super Admin, When I navigate to any store-specific page, Then I can view and manage data across all stores in the system.

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

### User Story 7 - Dashboard analytics and reporting (Priority: P1)

As a Store Admin, I view real-time KPI cards, generate sales/inventory/customer reports, and export data to CSV for business analysis.

**Why this priority**: Data-driven decision making requires comprehensive analytics and reporting capabilities with near real-time updates.

**Independent Test**: View dashboard KPIs (total sales, active orders, low stock items, customer count), generate sales report filtered by date range, export report to CSV, verify data accuracy against order records.

**Acceptance Scenarios**:

1. Given the dashboard, When I view KPI cards, Then I see total sales, order count, low stock alerts, and customer count updated within 10 minutes of data changes (SC-020).
2. Given the reports section, When I generate a sales report for last month, Then I see order totals, revenue, and top products with filters for date range, status, and customer segments.
3. Given a generated report, When I export to CSV, Then the downloaded file matches on-screen data within 0.5% variance (SC-008).
4. Given threshold configuration, When sales exceed target or stock falls below minimum, Then alert badges appear on dashboard within 1 minute (SC-005).

---

### User Story 8 - Theme customization and preview (Priority: P1)

As a Store Admin, I customize my storefront theme (logo, colors, typography, layout) using a preview mode before publishing changes atomically to customers.

**Why this priority**: Brand consistency and visual identity are critical for customer trust; preview mode prevents accidental broken layouts.

**Independent Test**: Upload store logo, change primary/secondary colors, modify typography settings, preview changes in isolated session, publish atomically, verify no partial updates visible to customers during publish.

**Acceptance Scenarios**:

1. Given theme customization settings, When I upload a logo and change brand colors, Then preview mode displays changes accurately without affecting live storefront (SC-018).
2. Given preview mode, When I navigate storefront pages, Then I see all theme changes applied consistently (header, footer, buttons, links).
3. Given customization complete, When I click "Publish", Then changes go live atomically with 0 downtime and no partial updates visible (SC-018).
4. Given published theme, When customers visit storefront, Then they see new branding immediately on next page load with CDN cache invalidation.

---

### User Story 9 - Email template management (Priority: P1)

As a Store Admin, I customize email templates for notifications (order confirmation, shipping updates, password reset) with template variables and preview/test sending capabilities.

**Why this priority**: Professional branded communication builds customer trust; template variables enable dynamic personalization.

**Independent Test**: Customize "Order Confirmation" email template with store logo and brand colors, add custom message, preview with sample order data, send test email to admin address, verify variables render correctly ({{orderNumber}}, {{customerName}}, {{orderTotal}}).

**Acceptance Scenarios**:

1. Given email template editor, When I customize subject and body with HTML/plain text and template variables ({{storeName}}, {{orderNumber}}, {{customerName}}), Then preview shows rendered output with sample data.
2. Given template variables, When required variable is missing from template (e.g., {{orderTotal}}), Then fallback behavior displays placeholder text "N/A" instead of empty field.
3. Given customized template, When I send test email, Then it arrives within 60 seconds with all variables replaced and formatting intact.
4. Given saved template, When triggering event occurs (order placed), Then email uses customized template and is queued within 5 minutes (SC-017).

---

### User Story 10 - Notification preferences (Priority: P2)

As a Customer or Staff member, I configure my notification preferences (email, push, SMS) per notification type to reduce irrelevant communications while staying informed about critical events.

**Why this priority**: Respects user communication preferences and reduces email fatigue; improves engagement by allowing opt-in for relevant notifications only.

**Independent Test**: Access notification preferences page, disable "Marketing emails", keep "Order updates" enabled, place test order, verify order confirmation email received but no marketing emails arrive, verify preference changes save immediately.

**Acceptance Scenarios**:

1. Given notification preferences page, When I view available notification types (order updates, shipping notifications, marketing emails, low stock alerts, plan expiration warnings), Then I see toggle controls for each type per channel (email, SMS, push).
2. Given notification toggles, When I disable "Marketing emails", Then no promotional/newsletter emails are sent to me but transactional emails (order confirmation, password reset) still arrive.
3. Given preference changes, When I save settings, Then changes apply immediately and are reflected in next notification trigger within 1 minute.
4. Given critical notifications (account lockout, password reset, payment failure), When these events occur, Then notifications are sent regardless of user preferences (cannot be disabled for security reasons).

---

### User Story 11 - Audit log review and security monitoring (Priority: P1)

As a Security Admin or Store Admin, I review immutable audit logs of security-sensitive actions (login, logout, permission changes, data access, configuration updates) to investigate incidents and ensure compliance.

**Why this priority**: Security incident investigation and compliance auditing require complete immutable trails; early detection of suspicious activity prevents breaches.

**Independent Test**: Perform security-sensitive actions (login as admin, change user permissions, update payment gateway config, export customer data), view audit log with filters for actor/action/entity/timestamp, verify all actions logged within 5 seconds (SC-010H), attempt to modify log entries (should fail - immutability).

**Acceptance Scenarios**:

1. Given audit log viewer, When I filter by actor (user email) and date range, Then I see all actions performed by that user with timestamps, IP addresses, user agents, and outcomes (SC-009).
2. Given security-sensitive action (permission change, data export, gateway config update), When action completes, Then audit entry is created within 5 seconds with before/after snapshots, actor ID, timestamp, and encrypted sensitive fields (SC-010H).
3. Given audit log entries, When I attempt to edit or delete an entry via API or database, Then operation fails with "Audit logs are immutable" error (append-only storage).
4. Given audit log retention policy, When logs exceed 1-year retention period, Then older entries are archived to cold storage but remain accessible for compliance queries (FR-122).
5. Given suspicious activity detection, When multiple failed login attempts or permission escalations occur, Then alert appears on security dashboard and email notification sent to Security Admins within 1 minute.

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

## End-to-End Test Scenarios

This section documents comprehensive E2E test scenarios for all user stories using Playwright with Page Object Model (POM) architecture. These scenarios ensure complete feature coverage from user perspective and serve as acceptance criteria for development completion.

### E2E Testing Strategy

**Framework**: Playwright 1.56.0 with TypeScript
**Architecture**: Page Object Model (POM) pattern with shared fixtures
**Test Data**: Seeded database fixtures with isolated test stores
**Browsers**: Chromium (primary), Firefox, WebKit via BrowserStack Automate
**Visual Regression**: BrowserStack Percy with 0.1% threshold
**Accessibility**: axe-core/playwright for WCAG 2.1 AA validation
**Performance**: Lighthouse CI integrated in test runs

**Page Object Model Structure**:
```
tests/e2e/
├── pages/
│   ├── auth/
│   │   ├── LoginPage.ts
│   │   ├── RegisterPage.ts
│   │   ├── MFAEnrollmentPage.ts
│   │   └── PasswordResetPage.ts
│   ├── admin/
│   │   ├── DashboardPage.ts
│   │   ├── StorePage.ts
│   │   ├── ProductPage.ts
│   │   ├── OrderPage.ts
│   │   └── SettingsPage.ts
│   └── storefront/
│       ├── HomePage.ts
│       ├── ProductListPage.ts
│       ├── ProductDetailPage.ts
│       ├── CartPage.ts
│       └── CheckoutPage.ts
├── fixtures/
│   ├── test-stores.ts
│   ├── test-users.ts
│   └── test-products.ts
└── scenarios/
    ├── us0-authentication.spec.ts
    ├── us1-store-management.spec.ts
    └── ... (one file per user story)
```

### US0 - Authentication and Authorization E2E Scenarios

**Test File**: `tests/e2e/scenarios/us0-authentication.spec.ts`

**Scenario 1: Complete user registration flow**
```typescript
test('US0-E2E-001: New user registers, verifies email, and logs in', async ({ page }) => {
  const registerPage = new RegisterPage(page);
  const loginPage = new LoginPage(page);
  
  // Navigate to registration
  await registerPage.goto();
  
  // Fill registration form
  await registerPage.fillRegistrationForm({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!'
  });
  
  // Submit and verify success message
  await registerPage.submitForm();
  await expect(page.locator('[data-testid="success-message"]')).toContainText(
    'Registration successful! Please check your email to verify your account.'
  );
  
  // Simulate email verification (click verification link)
  const verificationToken = await getVerificationToken('john.doe@example.com');
  await page.goto(`/auth/verify-email?token=${verificationToken}`);
  await expect(page.locator('[data-testid="verification-success"]')).toBeVisible();
  
  // Login with verified account
  await loginPage.goto();
  await loginPage.login('john.doe@example.com', 'SecurePass123!');
  await expect(page).toHaveURL(/\/dashboard/);
});
```

**Scenario 2: MFA enrollment and login with TOTP**
```typescript
test('US0-E2E-002: User enables MFA and logs in with TOTP code', async ({ page, authenticatedUser }) => {
  const settingsPage = new SettingsPage(page);
  const mfaPage = new MFAEnrollmentPage(page);
  const loginPage = new LoginPage(page);
  
  // Navigate to security settings
  await settingsPage.goto();
  await settingsPage.clickSecurityTab();
  
  // Enable MFA
  await settingsPage.clickEnableMFA();
  
  // Scan QR code and get secret
  const totpSecret = await mfaPage.getTOTPSecret();
  const backupCodes = await mfaPage.getBackupCodes();
  expect(backupCodes).toHaveLength(10);
  
  // Enter verification code
  const verificationCode = generateTOTP(totpSecret);
  await mfaPage.enterVerificationCode(verificationCode);
  await mfaPage.confirm();
  
  await expect(page.locator('[data-testid="mfa-enabled-badge"]')).toBeVisible();
  
  // Logout and login with MFA
  await settingsPage.logout();
  await loginPage.login(authenticatedUser.email, authenticatedUser.password);
  
  // MFA challenge appears
  await expect(page).toHaveURL(/\/auth\/mfa-challenge/);
  const mfaCode = generateTOTP(totpSecret);
  await page.fill('[data-testid="mfa-code-input"]', mfaCode);
  await page.click('[data-testid="verify-mfa-button"]');
  
  // Successfully logged in
  await expect(page).toHaveURL(/\/dashboard/);
});
```

**Scenario 3: Account lockout after failed login attempts**
```typescript
test('US0-E2E-003: Account locks after 5 failed login attempts', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  
  // Attempt 5 failed logins
  for (let i = 0; i < 5; i++) {
    await loginPage.login('valid.user@example.com', 'WrongPassword123!');
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
  }
  
  // 6th attempt shows lockout message
  await loginPage.login('valid.user@example.com', 'WrongPassword123!');
  await expect(page.locator('[data-testid="error-message"]')).toContainText(
    'Account locked due to multiple failed login attempts. Please try again in 15 minutes or reset your password.'
  );
  
  // Even correct password won't work during lockout
  await loginPage.login('valid.user@example.com', 'CorrectPassword123!');
  await expect(page.locator('[data-testid="error-message"]')).toContainText('Account locked');
});
```

**Scenario 4: Password reset flow**
```typescript
test('US0-E2E-004: User resets forgotten password', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const resetPage = new PasswordResetPage(page);
  
  // Click "Forgot Password" link
  await loginPage.goto();
  await loginPage.clickForgotPassword();
  
  // Request reset
  await resetPage.requestReset('user@example.com');
  await expect(page.locator('[data-testid="success-message"]')).toContainText(
    'Password reset link sent to your email'
  );
  
  // Simulate clicking reset link from email
  const resetToken = await getPasswordResetToken('user@example.com');
  await page.goto(`/auth/reset-password?token=${resetToken}`);
  
  // Set new password
  await resetPage.setNewPassword('NewSecurePass123!', 'NewSecurePass123!');
  await resetPage.submitReset();
  
  await expect(page.locator('[data-testid="success-message"]')).toContainText(
    'Password reset successful. You can now login with your new password.'
  );
  
  // Login with new password
  await loginPage.login('user@example.com', 'NewSecurePass123!');
  await expect(page).toHaveURL(/\/dashboard/);
});
```

### US1 - Store Management E2E Scenarios

**Test File**: `tests/e2e/scenarios/us1-store-management.spec.ts`

**Scenario 1: Super Admin creates new store and assigns admin**
```typescript
test('US1-E2E-001: Super Admin creates store in under 5 minutes (SC-001)', async ({ page, superAdmin }) => {
  const storePage = new StorePage(page);
  
  const startTime = Date.now();
  
  // Navigate to store creation
  await storePage.goto();
  await storePage.clickCreateStore();
  
  // Fill store details
  await storePage.fillStoreForm({
    name: 'Test Store',
    subdomain: 'test-store',
    adminEmail: 'admin@teststore.com',
    adminName: 'Store Admin',
    subscriptionPlan: 'Basic'
  });
  
  await storePage.submitForm();
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000; // seconds
  
  // Verify creation success and timing (SC-001: < 5 minutes = 300 seconds)
  await expect(page.locator('[data-testid="success-message"]')).toContainText('Store created successfully');
  expect(duration).toBeLessThan(300);
  
  // Verify store appears in list
  await expect(storePage.getStoreCard('Test Store')).toBeVisible();
});
```

### US2 - Product Catalog Management E2E Scenarios

**Test File**: `tests/e2e/scenarios/us2-product-catalog.spec.ts`

**Scenario 1: Create product with variants and verify SKU uniqueness**
```typescript
test('US2-E2E-001: Create product with variants, enforce SKU uniqueness (SC-002)', async ({ page, storeAdmin }) => {
  const productPage = new ProductPage(page);
  
  await productPage.goto();
  await productPage.clickAddProduct();
  
  // Fill product details
  await productPage.fillProductForm({
    name: 'Classic T-Shirt',
    description: 'Comfortable cotton t-shirt',
    category: 'Apparel',
    brand: 'TestBrand'
  });
  
  // Add variants with unique SKUs
  await productPage.addVariant({ size: 'Small', color: 'Red', sku: 'TS-RED-S', price: 19.99, stock: 100 });
  await productPage.addVariant({ size: 'Medium', color: 'Red', sku: 'TS-RED-M', price: 19.99, stock: 150 });
  
  await productPage.saveProduct();
  await expect(page.locator('[data-testid="success-message"]')).toContainText('Product created');
  
  // Attempt to create another product with duplicate SKU
  await productPage.clickAddProduct();
  await productPage.fillProductForm({ name: 'Another Product' });
  await productPage.addVariant({ sku: 'TS-RED-S', price: 29.99, stock: 50 }); // Duplicate SKU
  
  await productPage.saveProduct();
  
  // Verify uniqueness validation (SC-002)
  await expect(page.locator('[data-testid="error-message"]')).toContainText(
    'SKU "TS-RED-S" already exists in this store'
  );
});
```

### US3 - Checkout with Shipping and Tax E2E Scenarios

**Test File**: `tests/e2e/scenarios/us3-checkout.spec.ts`

**Scenario 1: Complete checkout flow with shipping and tax calculation**
```typescript
test('US3-E2E-001: Customer completes checkout under 3 minutes (SC-016)', async ({ page, storefront }) => {
  const homePage = new HomePage(page, storefront.subdomain);
  const productPage = new ProductDetailPage(page);
  const cartPage = new CartPage(page);
  const checkoutPage = new CheckoutPage(page);
  
  const startTime = Date.now();
  
  // Add product to cart
  await homePage.goto();
  await homePage.clickProduct('Test Product');
  await productPage.selectVariant({ size: 'Medium', color: 'Blue' });
  await productPage.addToCart();
  
  // Navigate to cart
  await productPage.clickCartIcon();
  await expect(cartPage.getCartItem('Test Product')).toBeVisible();
  
  // Proceed to checkout
  await cartPage.clickCheckout();
  
  // Fill shipping address
  await checkoutPage.fillShippingAddress({
    fullName: 'John Doe',
    email: 'john@example.com',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US'
  });
  
  // Select shipping method (SC-011: < 3 seconds)
  const shippingStart = Date.now();
  await checkoutPage.selectShippingMethod('Standard Shipping');
  await expect(checkoutPage.getShippingCost()).toBeVisible({ timeout: 3000 });
  const shippingDuration = Date.now() - shippingStart;
  expect(shippingDuration).toBeLessThan(3000);
  
  // Verify tax calculation (SC-012: < 2 seconds)
  const taxStart = Date.now();
  const taxAmount = await checkoutPage.getTaxAmount();
  const taxDuration = Date.now() - taxStart;
  expect(taxDuration).toBeLessThan(2000);
  expect(parseFloat(taxAmount)).toBeGreaterThan(0);
  
  // Fill payment details
  await checkoutPage.selectPaymentMethod('Stripe');
  await checkoutPage.fillStripeCard({
    cardNumber: '4242424242424242',
    expiry: '12/25',
    cvc: '123'
  });
  
  // Place order
  await checkoutPage.placeOrder();
  
  // Verify order confirmation
  await expect(page).toHaveURL(/\/order\/confirmation/);
  await expect(page.locator('[data-testid="order-success-message"]')).toContainText('Order placed successfully');
  
  const endTime = Date.now();
  const totalDuration = (endTime - startTime) / 1000 / 60; // minutes
  
  // Verify total time under 3 minutes (SC-016)
  expect(totalDuration).toBeLessThan(3);
});
```

### US7 - Dashboard Analytics E2E Scenarios

**Test File**: `tests/e2e/scenarios/us7-dashboard-analytics.spec.ts`

**Scenario 1: View dashboard KPIs and verify data accuracy**
```typescript
test('US7-E2E-001: Dashboard KPIs update within 10 minutes (SC-020)', async ({ page, storeAdmin, testData }) => {
  const dashboardPage = new DashboardPage(page);
  
  // Create test order
  await createTestOrder(testData.store.id, { total: 150.00 });
  
  // Wait up to 10 minutes for dashboard update (SC-020)
  await dashboardPage.goto();
  await expect(dashboardPage.getTotalSalesCard()).toContainText('$150.00', { timeout: 600000 });
  
  // Verify all KPI cards visible
  await expect(dashboardPage.getTotalOrdersCard()).toBeVisible();
  await expect(dashboardPage.getLowStockAlertsCard()).toBeVisible();
  await expect(dashboardPage.getCustomerCountCard()).toBeVisible();
});
```

**Scenario 2: Generate sales report and export to CSV**
```typescript
test('US7-E2E-002: Export report matches on-screen data within 0.5% (SC-008)', async ({ page, storeAdmin }) => {
  const reportsPage = new ReportsPage(page);
  
  await reportsPage.goto();
  await reportsPage.selectReportType('Sales Report');
  await reportsPage.setDateRange('2025-01-01', '2025-01-31');
  await reportsPage.applyFilters();
  
  // Get on-screen total
  const onScreenTotal = await reportsPage.getTotalRevenue();
  
  // Export to CSV
  await reportsPage.clickExport('CSV');
  const downloadPath = await reportsPage.waitForDownload();
  
  // Parse CSV and calculate total
  const csvData = parseCSV(downloadPath);
  const csvTotal = csvData.reduce((sum, row) => sum + parseFloat(row.revenue), 0);
  
  // Verify variance within 0.5% (SC-008)
  const variance = Math.abs((csvTotal - onScreenTotal) / onScreenTotal);
  expect(variance).toBeLessThan(0.005); // 0.5%
});
```

### Cross-Cutting E2E Scenarios

**Performance Testing (SC-021 to SC-025)**
```typescript
test('E2E-PERF-001: Storefront page load times meet targets', async ({ page, storefront }) => {
  // SC-021: Home page loads in < 2s desktop, < 3s mobile
  const homePage = new HomePage(page, storefront.subdomain);
  const homeMetrics = await homePage.gotoWithMetrics();
  expect(homeMetrics.lcp).toBeLessThan(2000); // 2 seconds
  
  // SC-022: Product listing loads in < 2.5s
  const productListPage = new ProductListPage(page);
  const listMetrics = await productListPage.gotoWithMetrics();
  expect(listMetrics.lcp).toBeLessThan(2500);
  
  // SC-023: Search returns results in < 1s
  const searchStart = Date.now();
  await productListPage.search('shirt');
  await expect(productListPage.getSearchResults()).toBeVisible();
  const searchDuration = Date.now() - searchStart;
  expect(searchDuration).toBeLessThan(1000);
  
  // SC-024: Product detail page loads in < 2s
  const productDetailPage = new ProductDetailPage(page);
  const detailMetrics = await productDetailPage.gotoWithMetrics('test-product');
  expect(detailMetrics.lcp).toBeLessThan(2000);
});
```

**Accessibility Testing (SC-027)**
```typescript
test('E2E-A11Y-001: Storefront meets WCAG 2.1 AA standards', async ({ page, storefront }) => {
  const homePage = new HomePage(page, storefront.subdomain);
  await homePage.goto();
  
  // Run axe accessibility scan
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  
  expect(accessibilityScanResults.violations).toHaveLength(0);
  
  // Test keyboard navigation
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'skip-to-content');
  
  // Navigate to product via keyboard only
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
  }
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/products\//);
});
```

**Visual Regression Testing with BrowserStack Percy**
```typescript
test('E2E-VIS-001: No visual regressions in storefront', async ({ page, storefront, percySnapshot }) => {
  // Home page
  await page.goto(`https://${storefront.subdomain}.example.com`);
  await percySnapshot(page, 'Storefront Homepage', { widths: [375, 1280] });
  
  // Product listing
  await page.goto(`https://${storefront.subdomain}.example.com/products`);
  await percySnapshot(page, 'Product Listing Page', { widths: [375, 1280] });
  
  // Product detail
  await page.goto(`https://${storefront.subdomain}.example.com/products/test-product`);
  await percySnapshot(page, 'Product Detail Page', { widths: [375, 1280] });
  
  // Cart
  await page.goto(`https://${storefront.subdomain}.example.com/cart`);
  await percySnapshot(page, 'Shopping Cart', { widths: [375, 1280] });
  
  // Percy automatically compares with baseline and highlights differences > 0.1% threshold
});
```

### Test Data Fixtures

**Fixture Example**: `tests/e2e/fixtures/test-stores.ts`
```typescript
export const testStores = {
  basicStore: {
    name: 'E2E Test Store',
    subdomain: 'e2e-test',
    plan: 'Basic',
    adminEmail: 'admin@e2etest.com',
    settings: {
      currency: 'USD',
      timezone: 'America/New_York',
      taxRate: 0.08
    }
  },
  proStore: {
    name: 'E2E Pro Store',
    subdomain: 'e2e-pro',
    plan: 'Pro',
    adminEmail: 'admin@e2epro.com'
  }
};

export async function seedTestStore(storeName: keyof typeof testStores) {
  const storeData = testStores[storeName];
  // Seed database via Prisma
  const store = await prisma.store.create({ data: storeData });
  return store;
}
```

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
- **CHK002 - Duplicate SKU during bulk import**: CSV import validation MUST detect duplicate SKUs within import file before processing; display inline validation message "Row {row_number}: SKU '{sku}' duplicates existing product '{product_name}' or row {duplicate_row_number}. Suggested SKU: {sku}-{variant_id}". Import continues for valid rows; invalid rows exported to error report CSV. Error reports retained for 2 years (GDPR Article 6(1)(f) - legitimate interest in fraud detection and quality control), then automatically purged. Error report includes: row number, SKU, product name, error type, suggested fix, timestamp, imported by (user reference).
- **CHK054 - Zero-product onboarding**: New stores with no products show onboarding wizard with: (a) Quick-start guide video, (b) Sample product creation walkthrough, (c) Import sample products button (adds 5 demo products to catalog), (d) CSV import tutorial. Dashboard displays "Getting Started" checklist until first product created. Wizard can be: (1) Dismissed by clicking "Skip Onboarding" (wizard hidden, can be re-triggered from Help menu → "Getting Started Guide"), (2) Re-triggered manually from Help menu at any time, (3) Auto-hidden after 10 products created (store considered "active"). Onboarding completion tracked in store metadata (completedAt timestamp, skippedAt timestamp, currentStep).

**Security and authentication edge cases**:
- **CHK009 - Password history**: System MUST prevent password reuse for last 5 passwords; compare bcrypt hashes during password change/reset. Display message: "This password was used recently. Please choose a different password." Password history stored in separate `password_history` table with userId, hashedPassword, createdAt; auto-pruned to keep only last 5 per user on each password change. Additional GDPR compliance: Password history older than 2 years is permanently deleted via scheduled job (runs monthly), regardless of count. Rationale: 2-year retention balances security (prevents rapid password cycling) with privacy (minimizes storage of authentication data). Deletion is irreversible and logged to audit trail (userId, deletedCount, deletedAt).
- **CHK101 - Account lockout timing**: Failed login attempts are tracked per user account (not per IP) with sliding 15-minute window. After 5 failed attempts within any 15-minute period, account is locked for 15 minutes from the 5th failed attempt. Lockout counter resets on successful login or after lockout period expires. Email notification sent to user's registered email on lockout with "Unlock Account" link (valid for 1 hour) and "Forgot Password" option.
- **CHK102 - Concurrent login sessions**: Users can be logged in on multiple devices/browsers simultaneously. Each session is tracked separately with unique session ID. When password is changed, all active sessions except the current one are immediately invalidated. User sees list of active sessions in account settings with device type, browser, IP address, last activity timestamp, and "Sign Out" button for each session.
- **CHK103 - Session hijacking prevention**: JWT tokens include: (a) User ID, (b) Session ID (unique per login), (c) Issued At timestamp, (d) Expiration timestamp, (e) User agent hash (optional, for stricter security). Token signature is verified on every API request. If signature verification fails or token is expired, return HTTP 401 with message: "Session expired or invalid. Please login again."
- **CHK104 - Password reset token expiration**: Password reset tokens are single-use and expire after 1 hour. If user clicks expired reset link, show: "This password reset link has expired. Please request a new one." If token is already used, show: "This password reset link has already been used. If you need to reset your password again, please request a new link."
- **CHK105 - Email verification for new accounts**: New user registrations (Store Admins, Staff, Customers) require email verification before account activation. Verification email sent immediately with link valid for 24 hours. User cannot login until email is verified (show message: "Please verify your email address. Check your inbox for verification link."). Resend verification email option available on login page.
- **CHK106 - MFA recovery with backup codes**: Users have multiple recovery options if they lose access to their authenticator app: (1) **Backup Codes**: Enter one of the 10 single-use backup codes provided during MFA enrollment. System verifies code against bcrypt hashes, marks code as used, and grants access. (2) **SMS Fallback** (if enabled): Request SMS code sent to registered phone number, enter 6-digit code valid for 5 minutes. (3) **Email Recovery** (fallback option): Click "Lost access to authenticator and backup codes?" link, system sends verification email with time-limited recovery link (valid for 1 hour), after email verification user can disable MFA and set new password. All recovery attempts are logged in audit trail with timestamp, IP address, recovery method used, and user agent for security review.
- **CHK107 - SSO account linking**: When user logs in via SSO (OIDC/SAML) for the first time, system checks if email matches existing account. If match found, prompt: "An account with this email already exists. Link your SSO account to existing account?" with "Link Account" or "Use Different Email" options. If linked, user can login with either SSO or password. If email already linked to different SSO provider, show error: "This email is already linked to another SSO provider."
- **CHK108 - Role change during active session**: If admin changes user's role or permissions while user is logged in, changes take effect on next API request (no page refresh required). User sees notification: "Your permissions have been updated. Some features may no longer be accessible." If user loses all permissions, redirect to "Access Denied" page with logout option.
- **CHK109 - Super Admin privilege escalation**: Super Admin login requires additional verification for sensitive actions: (a) Password re-confirmation for creating new Super Admin accounts, (b) MFA challenge for accessing system-wide settings, (c) Audit log entry for every Super Admin action with IP address, user agent, and timestamp. Super Admin cannot delete their own account (requires another Super Admin).
- **CHK110 - Login rate limiting per IP**: In addition to account-level lockout, implement IP-based rate limiting: 20 login attempts per IP address per 5-minute window. If exceeded, return HTTP 429 with message: "Too many login attempts from your IP address. Please try again in 5 minutes." This prevents distributed brute force attacks across multiple accounts from same IP.

**File upload and storage edge cases**:
- **CHK111 - File upload edge cases**: Handle various file upload failure scenarios: (1) **Maximum file size enforcement**: Reject uploads exceeding 100MB (configurable per store plan) with HTTP 413 and message: "File size exceeds maximum allowed ({maxSizeMB}MB). Please reduce file size and try again." Client-side validation shows warning before upload starts. (2) **Unsupported file type handling**: Reject files with MIME types not in allowlist (images: jpg/jpeg/png/gif/webp/svg, documents: pdf/doc/docx/xls/xlsx, archives: zip) with HTTP 415 and message: "File type '{fileType}' not supported. Allowed types: {allowedTypesList}". Validate both file extension AND MIME type (prevent .jpg.exe bypass). (3) **Virus scanning integration**: All uploaded files scanned via ClamAV (self-hosted) or VirusTotal API before storage; infected files quarantined and deleted with notification: "File '{fileName}' failed security scan and was not uploaded. Please scan your device for malware." Scan results logged to audit trail with file hash (SHA-256) for forensics. (4) **Upload progress tracking**: For files >10MB, show upload progress bar with percentage, estimated time remaining, and cancel button; canceled uploads immediately abort and clean up temporary storage. (5) **Concurrent upload limit**: Maximum 5 simultaneous uploads per user session; attempting 6th upload queues with message: "Maximum 5 uploads at once. Please wait for current uploads to complete." (6) **Duplicate file detection**: Before upload, compute SHA-256 hash of file; if identical file already exists in store storage, deduplicate by creating reference to existing file instead of uploading duplicate (saves storage quota). Show notification: "File already exists. Using existing copy." (7) **Corrupted file handling**: If file upload completes but file is corrupted (e.g., truncated, invalid header), detect via integrity check (file size mismatch, magic number validation) and reject with HTTP 422 and message: "File upload corrupted. Please try again." Automatically retry corrupted uploads up to 3 times with exponential backoff. (8) **Storage quota enforcement**: Track per-store storage usage; reject uploads exceeding plan quota (Free: 100MB, Basic: 1GB, Pro: 10GB, Enterprise: unlimited) with HTTP 507 and message: "Storage quota exceeded ({usedMB}/{quotaMB}MB). Please upgrade plan or delete unused files." Display storage usage meter on upload UI. (9) **Temporary file cleanup**: Incomplete/abandoned uploads older than 24 hours automatically deleted from temporary storage via scheduled job; prevents storage bloat from interrupted uploads.

**Database and infrastructure edge cases**:
- **CHK112 - Database connection pool exhaustion**: Handle scenarios where all Prisma connection pool slots (default: 5 connections per serverless function) are occupied: (1) **Connection request queuing**: When pool exhausted, queue new database queries with 10-second timeout; if connection becomes available within timeout, execute query normally. (2) **Timeout handling**: If no connection available after 10 seconds, return HTTP 503 with message: "Service temporarily unavailable due to high load. Please try again in a few seconds." Client should implement exponential backoff retry (1s, 2s, 4s intervals). (3) **Connection leak detection**: Monitor connection usage patterns; if connection held >30 seconds without activity, log warning with query details and caller stack trace for debugging. Forcefully close leaked connections after 60 seconds to prevent permanent pool exhaustion. (4) **Proactive pool monitoring (UPDATED)**: Implement threshold-based alerting to prevent pool exhaustion before it occurs: (a) Alert Super Admins when pool utilization exceeds 70% sustained for >2 minutes with message: "Database connection pool at 70% capacity for store '{storeName}'. Current: {activeConnections}/5 connections. Review slow queries and consider optimization.", (b) Include auto-scaling hints in alert: suggest pool size increase to 10 connections (requires Enterprise plan upgrade or store optimization), (c) Log slow queries (>500ms execution time) with query text, execution duration, and caller stack trace for optimization review; slow query log accessible in admin dashboard "Performance Insights" section, (d) Track real-time pool metrics: active connections, queued requests, average wait time, connection acquisition time (p50, p95, p99), slow query count per hour, (e) Display pool utilization widget on Super Admin dashboard with color-coded status: green (<50%), yellow (50-70%), orange (70-90%), red (>90%), (f) Previous 80% threshold retained as secondary alert tier with escalated urgency: "Database connection pool critical at 80%+ capacity. Immediate action required." (5) **Graceful degradation**: For non-critical operations (analytics refresh, report generation, background jobs), skip database access if pool exhausted and retry later; prioritize customer-facing operations (product browsing, checkout, order placement) for connection allocation. (6) **Connection pool configuration**: Enterprise plans can request increased pool size (up to 20 connections) for high-traffic stores; configuration change requires database restart with zero-downtime rolling deployment. (7) **Read replica failover**: For read-heavy operations (product search, report generation), use read replica pool (separate 5-connection pool); if read replica unavailable, automatically failover to primary database with degraded performance warning logged.

**Rate limiting and quota edge cases**:
- **CHK113 - Rate limit edge cases**: Handle complex rate limiting scenarios: (1) **Authenticated vs unauthenticated limits**: Authenticated API requests use per-user rate limits (based on subscription plan: Free 60/min, Basic 120/min, Pro 300/min, Enterprise 1000/min); unauthenticated requests use per-IP limits (100 req/min per IP address) to prevent abuse while allowing public browsing. If user logs in mid-session, immediately switch from IP-based to user-based limit; do NOT carry over IP limit consumption to user limit (fresh start). (2) **Rate limit sharing across sessions**: User's rate limit is shared across ALL active sessions (web, mobile app, API clients); total requests from all sessions count toward single user limit. Display current usage in API response headers: `X-RateLimit-User: 120/300 (40% used)`. (3) **Burst allowance for legitimate spikes**: Allow short-term bursts up to 2× normal rate limit for 10-second window to handle legitimate traffic spikes (e.g., page load triggers 20 parallel API calls); sustained requests above base limit trigger throttling with HTTP 429. Token bucket algorithm implementation: refill rate matches plan limit, bucket capacity is 2× plan limit. (4) **Rate limit bypass for internal operations**: Background jobs, scheduled tasks, and internal service-to-service calls bypass rate limits; authenticated via internal service token (separate from user API keys); internal calls include header `X-Internal-Service: true` with HMAC signature for validation. (5) **Rate limit reset timing**: Rate limit windows use sliding window algorithm (not fixed windows) to prevent "double dipping" exploit (e.g., 59 requests at 11:59:59 + 60 requests at 12:00:01 = 119 requests in 2 seconds). Sliding window tracks request timestamps for past 60 seconds; oldest requests drop off as window slides. (6) **Rate limit exceeded response details**: HTTP 429 responses include headers: `X-RateLimit-Limit: {limit}`, `X-RateLimit-Remaining: 0`, `X-RateLimit-Reset: {unix_timestamp}`, `Retry-After: {seconds}`. Response body includes upgrade CTA for Free/Basic users: "Rate limit exceeded. Upgrade to Pro for 300 req/min. [Upgrade Now]". (7) **Distributed rate limiting (multi-region)**: For multi-region deployments, use centralized Redis for rate limit state (Vercel KV with global replication); ensures rate limits enforced consistently regardless of which region handles request. Fallback to local memory-based limiting if Redis unavailable (per-region limits instead of global).

**Subscription and billing edge cases**:
- **CHK056 - Order at plan expiration**: Orders submitted within 60 seconds of plan expiration are allowed to complete if initiated before expiration; use order creation timestamp (server UTC time) as authoritative. New orders blocked after grace period (default 7 days); display message: "Your subscription has expired. Please renew to continue accepting orders." Boundary edge cases: (1) **Race condition at exact expiration**: If order creation timestamp equals plan expirationAt timestamp (same second), order is ALLOWED (inclusive boundary, favoring customer); (2) **Timezone confusion**: All timestamps stored in UTC; client-side timezone used only for display; validation always compares UTC timestamps; (3) **Server clock drift**: Assumes NTP-synchronized servers (<1 second drift); if drift detected (>5 seconds from NTP time), log warning and use NTP time for authorization decisions; (4) **Grace period calculation**: 7-day grace period starts from plan expirationAt timestamp (not last payment date); grace period applies to new order creation only (existing orders can be fulfilled regardless of plan status); (5) **Auto-renewal timing**: If auto-renewal scheduled within 60-second grace window, order processing paused for up to 30 seconds waiting for renewal confirmation; if renewal fails, order blocked with message: "Payment renewal in progress. Please try again in 1 minute."

**Webhook and external integration edge cases**:
- **CHK058 - Webhook after auto-cancellation (enhanced)**: Payment webhooks arriving after order auto-cancellation (default 72 hours for unpaid orders) MUST follow this restoration workflow: (1) Webhook signature verification: Validate HMAC signature to prevent replay attacks; reject if invalid with HTTP 401, (2) Idempotency check: Check Redis cache for idempotency key `payment_{gateway}_{transactionId}` with 24-hour TTL; skip processing if already handled, (3) Order status check: If order status is "cancelled", proceed to restoration, (4) Inventory availability check: Query current inventory for all order items; if ANY item has insufficient stock (orderedQty > currentStock), abort restoration and proceed to refund workflow, (5) Restoration actions (if inventory available): (a) Update order status from "cancelled" to "processing", (b) Reserve inventory again for all items, (c) Send "Payment Received - Order Confirmed" email to customer with order details, (d) Log restoration event to audit trail with webhook ID, transaction ID, timestamp, and inventory adjustments, (6) Refund workflow (if inventory unavailable): (a) Initiate automatic full refund via payment gateway API, (b) Send "Payment Refunded - Items Unavailable" email to customer with refund details and estimated refund timeline (5-7 business days), (c) Notify admin via email: "Webhook restoration failed for Order #{orderNumber} due to insufficient inventory. Refund initiated.", (d) Log refund event to audit trail with unavailable SKUs, quantities, and refund transaction ID, (7) Partial inventory scenario: If only some items unavailable, offer customer choice via email: (a) Accept partial order with available items and partial refund, or (b) Full refund and order cancellation. Customer response link valid for 48 hours; no response defaults to full refund. (8) Concurrent webhook handling: Use Redis lock with order ID as key; only one webhook processed at a time per order; subsequent webhooks for same order wait up to 10 seconds or return HTTP 409 Conflict if lock held.

**Marketing and promotions edge cases**:
- **CHK060 - Flash sale + coupon overlap**: When flash sale and coupon apply to same product, apply discounts in order: (1) Flash sale price (fixed sale price), (2) Coupon discount (percentage or fixed amount on sale price). Display breakdown in cart: "Original Price: $100, Flash Sale: -$20 (80), Coupon '10OFF': -$8 (10%), Final Price: $72". Configuration option to allow/block coupon usage during flash sales per campaign. Multiple coupon stacking rules: (a) **Maximum coupons per order**: Configurable limit (default: 3 coupons per order); attempting to apply 4th coupon shows: "Maximum 3 coupons allowed per order. Remove a coupon to add this one." (b) **Coupon stacking precedence**: When multiple coupons apply to same product, apply in order: (1) Highest percentage discount first, (2) Largest fixed amount discount second, (3) Free shipping last (applied at order level, not product level). (c) **Conflicting coupon types**: Percentage coupons stack (e.g., 10% + 5% = 14.5% total discount, applied sequentially), but fixed-amount coupons do NOT stack (only highest fixed discount applied; show warning: "Only one fixed-amount discount can be applied. Using highest discount: $20 off."). (d) **Minimum order requirements**: If order total drops below coupon minimum after applying previous discounts, coupon is automatically removed with notification: "Coupon 'SAVE50' requires $100 minimum order. Current total: $80. Coupon removed." (e) **Product-specific vs order-wide coupons**: Product-specific coupons apply before order-wide coupons; order-wide coupons apply to already-discounted cart subtotal.

**Tax and compliance edge cases**:
- **CHK091 - Tax-exempt approval workflow**: Tax-exempt status requires admin approval workflow: (1) Customer requests tax exemption via account settings, (2) Upload tax exemption certificate (PDF/image, validated for file type and size <5MB), (3) Admin receives notification and reviews certificate in pending approvals queue, (4) Admin approves/rejects with optional notes, (5) Customer notified via email. Auto-expiration after 1 year; renewal reminder sent 30 days before expiration. Audit trail requirements: (a) **Status changes logged**: Every status change (requested → pending → approved/rejected → expired → renewed) logged to audit trail with userId, adminId (if applicable), statusBefore, statusAfter, certificateUrl, notes, timestamp, IP address, (b) **Certificate retention**: Approved certificates retained for 7 years (tax audit compliance - IRS Publication 583); rejected certificates retained for 2 years (fraud prevention); expired certificates retained for 3 years post-expiration, (c) **Renewal workflow**: 30 days before expiration → email reminder with "Renew Now" link → customer uploads new certificate → admin reviews → if approved, new 1-year period starts from original expiration date (no gap in coverage); if not renewed within 30 days of expiration, tax-exempt status auto-revoked → customer charged tax on next order → email notification: "Your tax-exempt status has expired. Tax will be applied to future orders until you renew your exemption certificate.", (d) **Failed renewal**: If customer uploads invalid/expired certificate during renewal, admin can reject with specific reason (certificate expired, wrong jurisdiction, incomplete information) → customer receives rejection email with reason → can re-upload corrected certificate within 30-day window → if window expires, tax-exempt status revoked as above.

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
- **FR-004A**: Super Admins MUST have cross-store VIEW access to all store data (products, orders, customers, inventory, analytics, settings) for support and monitoring purposes. Super Admins SHALL NOT have EDIT/DELETE access to store-specific operational data (products, orders, inventory, customer data) to maintain store autonomy and data integrity. Super Admins CAN manage store metadata (name, status, subscription, assigned users), platform-wide settings, and user accounts. All Super Admin cross-store actions MUST be logged to audit trail with store ID, action type, timestamp, IP address, and user agent.

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
- **FR-016**: The system MUST allow product-level reviews/testimonials with moderation (approve/reject) before publication. Product reviews are linked to specific products and displayed on product detail pages. Data structure: customer reference (nullable for guest reviews), product reference, rating (1-5 stars), review title, review text, helpful votes, verified purchase flag (true if customer purchased product), moderation status (pending/approved/rejected), admin response (nullable text + timestamp), images/photos (optional, max 5 per review), created at, published at. Moderation workflow: New reviews default to "pending" → Admin approves/rejects → Approved reviews visible on storefront → Admin can add response to reviews → Customers can mark reviews as helpful (increment helpful votes counter). Reviews and Q&A share the same UI component but use different display logic (reviews show rating stars, Q&A shows question/answer format).
- **FR-016A**: The system MUST support product Q&A (questions and answers) with the same moderation workflow as product reviews. Q&A entries are displayed separately from reviews on product detail pages. Data structure: customer reference, product reference, question text, answer text (nullable until answered), answered by (admin/store owner reference), moderation status (pending/approved/rejected), helpful votes, created at, answered at (nullable).
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
- **FR-02E**: The system MUST calculate tax at checkout based on shipping address and product taxability status. **Tax calculation timeout threshold**: 3 seconds for total tax calculation including all line items and multiple tax rates. **Graceful degradation on timeout**: If tax calculation exceeds 3 seconds, proceed with checkout using 0% tax rate, flag order as "tax_calculation_failed" in order metadata, and trigger manual review workflow. **Customer-facing message** on timeout: "Tax calculation is temporarily unavailable. Your order will proceed without tax, and we will contact you within 24 hours to finalize the tax amount." **Admin notification**: Email sent immediately to store admin with order details, customer info, and cart contents for manual tax review. **Manual tax review workflow**: (1) Admin receives alert email, (2) Admin navigates to "Orders Pending Tax Review" queue in dashboard, (3) Admin manually calculates correct tax based on shipping address and taxability rules, (4) Admin updates order total and sends revised invoice to customer via email with payment link for tax difference (if applicable). **Timeout monitoring**: Alert Super Admins if tax calculation timeout rate exceeds 5% of checkouts in any 1-hour window; suggests external tax service API integration (Phase 2) may be needed.
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
- **FR-039A**: The system MUST define payment gateway timeout thresholds: (1) Initial payment request timeout: 30 seconds, (2) Retry timeout: 15 seconds per attempt, (3) Total checkout timeout: 90 seconds including all retries. On timeout, display user-facing error: "Payment processing is taking longer than expected. Please try again or use a different payment method." Order status handling: (a) If timeout occurs before order creation, treat as abandoned cart (no order record created), (b) If timeout occurs after order creation, set status to "pending_payment" with auto-cancel after 72 hours if no payment confirmation received. Payment retry strategy: 3 automatic retries with exponential backoff (retry 1 after 2s, retry 2 after 4s, retry 3 after 8s). Idempotency: Use payment intent ID + order ID as idempotency key to prevent duplicate charges on customer manual retry. Timeout monitoring: Alert admins if payment timeout rate exceeds 5% of total checkout attempts in any 1-hour window. Recovery paths: Customer can (1) Retry payment with same method, (2) Change payment method, (3) Contact support via "Need Help?" link with order reference number.
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
- **FR-070**: The system MUST manage pages, blogs, menus, FAQs, and store-level testimonials with publish/unpublish and scheduling. Store-level testimonials are for homepage/about page social proof (distinct from product-level reviews in FR-016). Data structure: store reference, customer/author name (text field, not FK to customer table - allows external testimonials), customer photo URL (optional), testimonial text (max 500 characters), rating (1-5 stars, optional), company/role (optional, e.g., "CEO at Company XYZ"), display order (integer for manual sorting), publication status (draft/published/archived), featured flag (boolean, for highlighting on homepage), created by (admin reference), created at, published at, scheduled publish date (nullable). Display locations: homepage (featured testimonials carousel, max 5), about page (all published testimonials grid), testimonials page (optional dedicated page). Moderation: Admin creates/edits testimonials directly (no customer submission in Phase 1; see P2-025 for customer-submitted testimonials).
- **FR-071**: The system MUST allow theme customization per store (logo, colors, typography, layout presets) and preview before publish. Preview mechanism: (1) **Data Source**: Production data from live store (products, categories, pages, testimonials, orders shown only to admins); no test/demo data; no customer PII visible in preview (anonymize customer names, emails, addresses shown in order previews); (2) **Isolation**: Admin-only access via session-based authentication; non-admin users accessing ?preview=true are redirected to published theme; (3) **URL Structure**: `https://store.example.com/?preview=true` with admin session cookie; query parameter persists across navigation until admin removes it or session expires; (4) **Implementation**: Middleware checks for `preview=true` query param → validates admin session → loads draft theme configuration from database → applies to current request → renders page with draft theme styles/layout; published theme stored separately and served to all non-preview requests; (5) **Publish Workflow**: Admin clicks "Publish" → validation (check all theme asset URLs valid, CSS valid, no broken references) → atomic swap (update `publishedThemeId` in store settings table) → zero downtime (new requests immediately use new theme, in-flight requests complete with old theme) → backup previous theme configuration for 30-day rollback window; (6) **Performance**: Preview mode adds <5ms overhead (single DB query for draft theme config); published theme served from cache (Vercel KV, 5-min TTL, invalidated on publish).
- **FR-072**: The system SHOULD support multiple UI languages with user-selectable language preference (default: English only for Phase 1).
- **FR-073**: The system SHOULD support RTL languages (Arabic, Hebrew) with appropriate layout adjustments.
- **FR-074**: The system SHOULD support per-store default language configuration and fall back to English for missing translations.
- **FR-075**: The system SHOULD support email template customization per notification type with template variables for dynamic content.
- **FR-076**: The system SHOULD provide template preview and test sending capabilities for email templates.

Email and notifications
- **FR-077**: The system MUST queue notifications with retry logic on delivery failure (exponential backoff, max 3 attempts).
- **FR-078**: The system MUST support email notifications for all order status changes, low stock alerts, and plan limit warnings. Email template variables use double-brace syntax `{{variableName}}` (Handlebars/Mustache standard). Fallback behavior: `{{firstName}}` → "Valued Customer", `{{lastName}}` → "" (empty string), `{{orderNumber}}` → "[Order #]", `{{orderTotal}}` → "$0.00", `{{storeName}}` → "Our Store", `{{productName}}` → "Product", `{{quantity}}` → "0". Composite variables: `{{customerName}}` = `{{firstName}} {{lastName}}` with automatic space trimming. Missing critical variables (e.g., `{{orderNumber}}` for order confirmation) log error and send fallback email: "Your order has been received. Please contact support for details." All variables are sanitized to prevent XSS attacks (HTML entities escaped).
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
- **FR-090B**: The system MUST validate credentials server-side using bcrypt.compare() with stored password hash. On successful authentication, generate JWT token signed with **HS256 (HMAC-SHA256)** using secret from environment variable. **JWT payload structure**: `{ userId: string, sessionId: string (UUID v4), role: enum (SUPER_ADMIN|STORE_ADMIN|STAFF|CUSTOMER), storeId: string|null, iat: number (Unix timestamp), exp: number (Unix timestamp, 30 days from iat) }`. Store JWT in HTTP-only, Secure, SameSite=Lax cookie. **Session validation workflow**: On every API request: (1) Verify JWT signature using HMAC-SHA256; if invalid, return HTTP 401 "Invalid session token", (2) Extract sessionId from JWT payload, (3) Query session store (Vercel KV in production, in-memory Map in local dev) for sessionId key, (4) If session not found or expired, return HTTP 401 "Session expired, please login again", (5) If session valid, proceed with request and update lastActivityAt timestamp for idle timeout tracking (7-day sliding window). **Session invalidation**: Delete session key from store on logout, password change, or permission revocation; invalidation completes in <10ms (production) or instantly (local dev) for immediate effect. **Performance requirements**: Session store lookup <10ms (p95) in production; in-memory Map has negligible latency (<1ms) for local development.
- **FR-090C**: The system MUST support role-based redirects after successful login: (a) Super Admin → `/admin/dashboard` (cross-store system dashboard), (b) Store Admin/Staff → `/dashboard` (store-specific dashboard for assigned store), (c) Customer → `/account` (customer account page with order history).
- **FR-090D**: The system MUST display clear error messages for failed login attempts: (a) Invalid credentials → "Invalid email or password. Please try again." (generic message to prevent account enumeration), (b) Account locked → "Account locked due to too many failed login attempts. Please try again in X minutes or reset your password.", (c) Account inactive → "Your account has been deactivated. Please contact support.", (d) Email not verified → "Please verify your email address. Check your inbox or request a new verification link."
- **FR-090E**: The system MUST implement "Forgot Password" flow: (a) User enters email on forgot password page, (b) System sends password reset email with unique token valid for 1 hour, (c) User clicks link and enters new password (validated against password policy), (d) Password is updated and all active sessions except current are invalidated, (e) User is redirected to login page with success message: "Password reset successful. Please login with your new password."
- **FR-090F**: The system MUST enforce password policy requirements: (a) Minimum 8 characters, (b) At least one uppercase letter (A-Z), (c) At least one lowercase letter (a-z), (d) At least one number (0-9), (e) At least one special character (!@#$%^&*()_+-=[]{}|;:',.<>?/), (f) Password cannot match last 5 passwords (stored in `password_history` table with bcrypt hash).
- **FR-090G**: The system MUST track failed login attempts per user account in a sliding 15-minute window. After 5 failed attempts, lock account for 15 minutes and send email notification with unlock link and timestamp when lockout expires. Reset failed attempt counter on successful login or after lockout period expires.
- **FR-090H**: The system MUST implement logout functionality at `/auth/signout` that: (a) Invalidates current session token, (b) Clears authentication cookie, (c) Redirects to login page with message: "You have been logged out successfully.", (d) Logs audit event with user ID, timestamp, and IP address.
- **FR-090I**: The system MUST provide session management UI in user account settings showing: (a) List of active sessions with device type, browser, IP address, login timestamp, last activity timestamp, (b) "Current Session" indicator for the session user is viewing from, (c) "Sign Out" button for each session to remotely terminate that session, (d) "Sign Out All Other Sessions" button to terminate all sessions except current.
- **FR-090J**: The system MUST implement IP-based rate limiting for login attempts: 20 attempts per IP address per 5-minute sliding window. When exceeded, return HTTP 429 with message: "Too many login attempts. Please try again in 5 minutes." Log rate limit violations with IP address, timestamp, and attempted email addresses (for security monitoring).
- **FR-091**: The system MUST support optional multi‑factor authentication (MFA) with TOTP authenticator apps (RFC 6238) as the primary method. The system MUST provide 10 single-use backup codes for account recovery during MFA enrollment. Backup codes MUST be hashed using bcrypt (cost factor 12) before storage, displayed only once during enrollment with download/print options, marked as used after consumption, and expire after 1 year or when MFA is disabled. The system MAY additionally offer SMS fallback (opt-in per tenant) and WebAuthn/FIDO2 security keys as optional methods for enterprises.
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

Code quality and development standards (Constitution alignment)
- **FR-133**: The system codebase MUST enforce file size limits: maximum 300 lines per file, maximum 50 lines per function. ESLint rules configured to warn at 280 lines (soft limit) and error at 300 lines (hard limit). Functions exceeding 50 lines trigger ESLint warning prompting refactoring into smaller, single-responsibility functions. Rationale: Maintainability, readability, testability. Enforcement: Pre-commit hooks run ESLint and block commits violating hard limits; CI/CD pipeline fails builds with limit violations. Exceptions: Auto-generated files (Prisma client, migration files) excluded from limits; configuration files (tailwind.config.ts, next.config.ts) allowed up to 500 lines if documented.
- **FR-134**: The system codebase MUST follow naming conventions enforced via ESLint rules: (a) Variables/functions/methods: `camelCase`, (b) Components/types/interfaces/classes: `PascalCase`, (c) Constants: `UPPER_SNAKE_CASE`, (d) Files: Match primary export (e.g., `ProductCard.tsx` for `export default function ProductCard`), (e) API routes: `kebab-case` URL paths (`/api/store-products`) mapped to filesystem paths (`src/app/api/store-products/route.ts`), (f) Database columns: `snake_case` in Prisma schema (auto-mapped to `camelCase` in TypeScript via Prisma), (g) CSS classes: `kebab-case` (Tailwind convention: `bg-primary-500`, `text-lg`). ESLint rules: `@typescript-eslint/naming-convention` with configuration matching above rules. Pre-commit hooks enforce naming conventions; CI/CD fails on violations.
- **FR-135**: The system MUST enforce database migration backup strategy: (a) **Pre-migration backup**: Before running `prisma migrate deploy` in production, automated script creates database snapshot using `pg_dump` (PostgreSQL) or Vercel Postgres backup API, (b) **Backup retention**: Migration backups retained for 30 days with automatic cleanup (separate from daily backups in FR-123), (c) **Rollback procedure**: If migration fails or causes data issues, restore from pre-migration backup using documented rollback procedure (`docs/database/rollback-procedure.md`); rollback requires Super Admin approval and creates audit log entry, (d) **Migration validation**: All migrations tested on staging environment (database copy of production) before production deployment; migrations include both `up` (apply) and `down` (revert) scripts where possible, (e) **Breaking changes**: Migrations with breaking schema changes (column removal, table deletion, constraint addition) require two-phase deployment: Phase 1 (add new schema, mark old schema deprecated, dual-write to both), Phase 2 (remove old schema after 1 sprint/2 weeks verification period), (f) **Migration monitoring**: All production migrations logged to audit trail with migration name, applied by (user/automated system), timestamp, duration, affected tables, row counts; alerts sent to DevOps team if migration exceeds 5-minute threshold.
- **FR-136**: The system MUST enforce TypeScript strict mode compliance: (a) `strict: true` in `tsconfig.json` with all sub-flags enabled (`noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, etc.), (b) Prohibit `any` types except documented exceptions (untyped third-party libraries, type assertion with justification comment), (c) Require explicit return types for all exported functions and class methods, (d) Enforce type guards and narrowing for runtime type safety (no unchecked type assertions), (e) CI/CD pipeline runs `tsc --noEmit` to validate TypeScript compilation; fails build on type errors or warnings, (f) ESLint rules: `@typescript-eslint/no-explicit-any` set to error, `@typescript-eslint/explicit-function-return-type` for exports.
- **FR-137**: The system MUST enforce React and Next.js best practices: (a) **Server Components by default**: 70%+ of components should be Server Components; Client Components marked with `'use client'` only for event handlers, browser APIs, React hooks, state management, (b) **No Pages Router**: Prohibit `pages/` directory usage; all routes in `src/app/` using App Router, (c) **Client-side JavaScript budget**: <200KB initial bundle (gzipped); bundle analysis in CI/CD warns at 180KB, fails at 200KB, (d) **Image optimization**: Require `next/image` component for all images; raw `<img>` tags flagged by ESLint as error, (e) **Font optimization**: Use `next/font` for font loading (automatic subsetting, preloading), (f) **Dynamic imports**: Heavy components (charts, editors, modals) lazy-loaded with `next/dynamic`, (g) **API route structure**: All API routes in `src/app/api/` using Route Handlers (route.ts); prohibit Edge Runtime for database-accessing routes (use Node.js runtime).
- **FR-138**: The system MUST enforce security coding standards: (a) **Environment variables**: All secrets stored in environment variables (never hard-coded); `.env.example` template provided; CI/CD validates required env vars before deployment, (b) **Input validation**: All user inputs validated with Zod schemas on both client and server; validation failures return HTTP 400 with structured error response, (c) **SQL injection prevention**: Prohibit raw SQL queries; all database access via Prisma ORM with parameterized queries, (d) **XSS prevention**: All user-generated content sanitized with DOMPurify before rendering; template variables HTML-escaped (see FR-078), (e) **CSRF protection**: NextAuth.js built-in CSRF tokens for authentication; API mutations require valid session token, (f) **Rate limiting**: API rate limiting enforced at middleware level (FR-128-FR-130), (g) **Audit logging**: All authentication events, permission changes, financial transactions logged to immutable audit trail (FR-093, FR-122).
- **FR-139**: The system MUST maintain comprehensive test coverage: (a) **Business logic**: 80% coverage minimum for `src/services/` and `src/lib/`, (b) **Utilities**: 100% coverage for `src/lib/utils.ts` and shared helpers, (c) **Critical paths**: 100% E2E coverage for authentication, checkout, payment, order management, (d) **API routes**: 100% integration test coverage for all `src/app/api/**/route.ts`, (e) **Coverage reporting**: Vitest coverage reports generated on every PR; PR blocked if coverage drops below thresholds, (f) **Test quality**: All tests follow AAA pattern (Arrange, Act, Assert); no flaky tests (deterministic, no race conditions); tests run in CI/CD with same environment as local development.
- **FR-13A**: The system codebase MUST follow accessibility standards: (a) **WCAG 2.1 Level AA compliance** for all UI components, (b) **Automated testing**: Axe accessibility linter in CI/CD; fails build on accessibility violations (missing alt text, insufficient contrast, invalid ARIA), (c) **Keyboard navigation**: All interactive elements accessible via keyboard (Tab, Enter, Escape, Arrow keys), (d) **Screen reader testing**: Manual testing with NVDA/JAWS/VoiceOver documented in test plan; critical flows (login, checkout, product search) verified with screen readers before each release, (e) **Focus management**: Visible focus indicators on all interactive elements; focus trapped in modals/dialogs; focus restored on close, (f) **Semantic HTML**: Prefer semantic HTML5 elements (`<nav>`, `<main>`, `<article>`, `<button>`) over generic `<div>`/`<span>` with ARIA roles.

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
- **P2-001**: Additional payment gateways (bKash, PayPal, Square, Authorize.net, Razorpay) - Priority based on market demand surveys. Integration approach: (a) **Unified payment interface**: Abstract `PaymentProvider` interface with methods: `createPaymentIntent()`, `confirmPayment()`, `refundPayment()`, `getPaymentStatus()`, `handleWebhook()`; each gateway implements this interface, (b) **Gateway-specific adapters**: Separate adapter classes for each provider in `src/services/payments/adapters/` (e.g., `BkashAdapter.ts`, `PayPalAdapter.ts`); adapters handle provider-specific API calls, response mapping, error handling, (c) **Configuration per store**: Store settings table includes `paymentGateways` JSONB field storing enabled gateways array with credentials (encrypted): `[{ gateway: 'stripe', apiKey: '***', webhookSecret: '***', enabled: true }, ...]`, (d) **Webhook routing**: Single webhook endpoint `/api/webhooks/payment` with gateway identification via URL query param (`?gateway=stripe`) or signature header; router dispatches to correct adapter, (e) **Migration path**: Phase 1 Stripe-only; Phase 2 adds multi-gateway support; existing Stripe integrations remain unchanged (backward compatible); admins enable additional gateways via dashboard, (f) **Testing strategy**: Mock payment provider in tests; sandbox/test mode for each gateway in development; production credentials only in production environment variables.
- **P2-002**: Carrier API integrations (FedEx, UPS, USPS, DHL) for real-time shipping quotes - Currently supporting manual rate configuration (FR-02B). Integration approach: (a) **Shipping rate API**: Separate microservice or Next.js API route `/api/shipping/quote` accepting origin address, destination address, package dimensions, weight; returns array of carrier rates with estimated delivery dates, (b) **Carrier adapters**: Similar to payment adapters, each carrier has adapter implementing `ShippingProvider` interface with methods: `getRates()`, `createShipment()`, `trackShipment()`, `cancelShipment()`, `printLabel()`, (c) **Fallback to manual rates**: If carrier API fails (timeout, downtime), fall back to manual rate table configured in FR-02B; log warning for admin review, (d) **Rate caching**: Cache carrier rates for 5 minutes per unique (origin, destination, weight) tuple to reduce API costs and improve checkout performance, (e) **Address validation**: Integrate USPS Address Validation API to verify shipping addresses before quoting rates; invalid addresses prompt customer to correct, (f) **Migration path**: Phase 1 manual rates only; Phase 2 adds carrier APIs as optional enhancement; stores can choose manual rates (free) or carrier APIs (per-quote fee); existing manual rates remain functional.
- **P2-003**: Tax calculation service integrations (Avalara, TaxJar) for automated tax determination - Currently using manual tax rate configuration (FR-02J). Integration approach: (a) **Tax calculation service**: `/api/tax/calculate` endpoint accepting line items, shipping address, customer tax exemption status; returns tax amount, breakdown by jurisdiction, tax rate applied, (b) **Service adapters**: `AvalaraAdapter`, `TaxJarAdapter` implementing `TaxProvider` interface with methods: `calculateTax()`, `validateAddress()`, `getJurisdictions()`, `reportTransaction()`, (c) **Fallback strategy**: If tax service fails, use manual tax rates configured in FR-02D/FR-02J; flag order for manual review in admin dashboard; notify customer: "Tax calculated using standard rates. Final amount will be confirmed before shipping.", (d) **Nexus configuration**: Store settings include `taxNexus` array specifying states/countries where store has tax obligation; only calculate tax for nexus jurisdictions to avoid unnecessary API calls and costs, (e) **Transaction reporting**: Daily batch job reports completed orders to tax service for compliance (required by Avalara/TaxJar for audit trails); failed reports retried for 7 days then logged for manual intervention, (f) **Migration path**: Phase 1 manual tax rates; Phase 2 adds tax services as premium feature (additional cost); stores can enable per-store; existing manual rates remain as fallback and for stores not using tax services.


### Search & Performance Enhancements
- **P2-004**: Algolia search integration for catalogs >10K products - Phase 1 uses PostgreSQL Full-Text Search with pg_trgm (FR-07N). Integration approach: (a) **Search threshold**: Algolia integration triggered automatically when store product count exceeds 10,000 products; below threshold, continue using PostgreSQL FTS (cost optimization), (b) **Index synchronization**: Background job syncs product data to Algolia index on create/update/delete; uses Algolia's batch API for bulk updates (max 1,000 records per batch); sync queue in Redis with retry logic (max 3 attempts), (c) **Index structure**: One Algolia index per store with naming convention `products_{storeId}`; index settings: searchable attributes (name, description, SKU, tags), facets (categories, brands, price ranges, attributes), custom ranking (sales volume desc, created_at desc), (d) **Search API**: New endpoint `/api/search/products?q={query}&store={storeId}` proxies to Algolia; response includes hits, facets, query suggestions, search metadata (processing time, total hits), (e) **Fallback mechanism**: If Algolia service unavailable, automatically fall back to PostgreSQL FTS; display banner: "Search results may be limited. Full search will be restored shortly."; log incident for monitoring, (f) **Migration path**: Phase 1 PostgreSQL FTS for all stores; Phase 2 auto-migrates stores crossing 10K threshold to Algolia; existing stores <10K remain on PostgreSQL FTS; migration is transparent (no admin action required); initial index built in background, switchover when complete, (g) **Cost management**: Algolia billed per search operation and record count; monitor usage per store; alert admins at 80% of monthly quota; provide option to downgrade to PostgreSQL FTS if cost concern.
- **P2-005**: Advanced product search features: visual search, voice search, natural language processing.
- **P2-006**: Search analytics dashboard showing popular queries, zero-result searches, conversion rates.


### POS & Offline Features
- **P2-007**: POS offline mode with local storage and sync-back when connectivity restored - Phase 1 online-only (FR-080).
- **P2-008**: POS inventory management: local stock adjustments, inter-store transfers, physical count audits.
- **P2-009**: POS customer-facing display for price verification and digital receipts.

### Internationalization & Localization
- **P2-010**: Multi-language support (16 languages: ar, da, de, en, es, fr, he, it, ja, nl, pl, pt, pt-br, ru, tr, zh) - Phase 1 English only (FR-072). Integration approach: (a) **Translation framework**: Use `next-intl` library for Next.js internationalization; translation files stored in `src/i18n/locales/{lang}.json` with namespace organization (common, products, checkout, admin, emails), (b) **Database content translation**: Add `translations` JSONB column to product, category, page, blog tables; structure: `{ en: {name: "Product", description: "..."}, es: {name: "Producto", description: "..."} }`; API accepts `lang` query param to return translated content; fallback to English if translation missing, (c) **Language detection**: (1) User preference in account settings (persisted to database), (2) Browser Accept-Language header (for guests), (3) Store default language configuration (FR-074), (4) System default: English, (d) **RTL support integration**: RTL languages (ar, he) trigger CSS direction flip using `[dir="rtl"]` selector; mirror layout components (navigation, forms, buttons) automatically; number formatting remains LTR (Arabic numerals), (e) **Translation workflow**: Admin UI for managing translations per entity; option to export/import translation files (JSON format) for professional translation services; machine translation API integration (Google Translate, DeepL) for quick drafts (admin review required before publish), (f) **Migration path**: Phase 1 English-only; Phase 2 adds multi-language as opt-in feature; stores enable languages in settings; existing English content auto-copied to `translations.en`; admins add translations for other languages incrementally; missing translations fall back to English with UI indicator: "[EN]" badge, (g) **Performance**: Translation files bundled with Next.js build; client-side language switching without page reload (SPA-style); server-side rendering respects language for SEO (separate URLs per language: `/en/products`, `/es/productos`).
- **P2-011**: RTL language layout support (Arabic, Hebrew) with mirrored UI components (FR-073). [Implementation details integrated into P2-010 above]
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
 - **FR-102**: External platform integration MUST implement webhook retry logic with exponential backoff (max 5 attempts), dead-letter queue for permanent failures, and manual retry capability for failed syncs. **Dead Letter Queue (DLQ) retention policy (UPDATED)**: Failed webhook events stored in DLQ table with 30-day retention period (aligns with backup retention policy from Session 2025-10-17 clarification). DLQ structure: webhook source (gateway/platform name), event type, payload (encrypted), failure reason, retry attempts count, first failed at, last retry at, resolved at (nullable), resolution method (auto-retry success, manual retry, manual archive, expired). Auto-delete events after 30 days; before deletion, send weekly digest email to Store Admins listing unresolved DLQ events with "Archive" or "Retry" actions. Manual archive option preserves event metadata (without payload) in audit log for compliance/forensics; archived events retained per audit log retention (1 year per FR-122). DLQ dashboard accessible to Store Admins shows: total failed events, events by source, resolution rate, average time to resolution, recent failures with inline retry/archive buttons.
 - **FR-103**: External platform integration MUST include configurable conflict resolution strategies for bidirectional sync when the same entity is modified in both systems: last-write-wins (timestamp-based), manual resolution queue (staff review), or configurable priority rules (e.g., always prefer StormCom inventory).
 - **FR-104**: External platform integration MUST maintain a real-time sync status monitoring dashboard per store showing: last successful sync timestamp, sync health status, pending sync items count, failed sync items with error details, and data discrepancy alerts.
 - **FR-105**: External platform integration MUST provide entity-level sync direction overrides allowing stores to configure bidirectional sync for products/inventory but inbound-only for orders (or other combinations per business needs).
 - **FR-106**: External platform integration MUST support initial bulk import/export for onboarding existing stores with large catalogs (1000+ products), including progress tracking and validation reporting.

Webhook security and reliability
 - **FR-10X - Webhook signature verification**: All incoming webhook requests (payment gateways, external platforms) MUST be cryptographically verified before processing to prevent unauthorized requests and replay attacks. Implementation requirements: (1) **Algorithm**: Use HMAC-SHA256 for signature generation and verification; other algorithms (SHA1, MD5) are NOT allowed for security reasons. (2) **Header name**: Signature transmitted in HTTP header `X-Webhook-Signature` (or gateway-specific header names: Stripe uses `Stripe-Signature`, SSLCommerz uses `Verify-Sign`, Shopify uses `X-Shopify-Hmac-Sha256`). (3) **Signature format**: `{algorithm}={hexadecimal_signature}` (e.g., `sha256=a3c7f9b2e1d5...`) or raw hexadecimal string depending on gateway convention. (4) **Signing payload**: Compute HMAC using raw request body (NOT parsed JSON) to prevent canonicalization issues; include timestamp if provided by gateway to prevent replay attacks. (5) **Secret management**: Webhook secrets stored encrypted in `PaymentGatewayConfig` table per store; accessed via secure environment variable or key management service; rotated every 90 days with zero-downtime secret migration (accept both old and new secrets for 24-hour overlap period). (6) **Verification logic**: For each webhook request: (a) Extract signature from header, (b) Retrieve webhook secret for store/gateway from encrypted config, (c) Compute expected signature using HMAC-SHA256(secret, raw_body), (d) Compare computed signature with received signature using constant-time comparison (prevent timing attacks - use `crypto.timingSafeEqual()` in Node.js), (e) If signatures match, proceed to webhook processing; if mismatch, reject with HTTP 401 Unauthorized and log security event to audit trail with IP address, user agent, and failed signature. (7) **Timestamp validation** (if provided by gateway): Verify webhook timestamp is within 5-minute window (past or future) to prevent replay attacks; reject webhooks with timestamp outside window even if signature valid. (8) **Response codes**: Return HTTP 401 for invalid signature, HTTP 400 for missing signature header, HTTP 200 for successfully verified and processed webhook, HTTP 500 for processing errors after successful verification. (9) **Testing support**: Provide webhook testing UI in admin dashboard allowing stores to send test webhooks with valid signatures for development/debugging; include signature validation logs showing computed vs received signatures for troubleshooting. (10) **Security monitoring**: Alert Super Admins when webhook signature failure rate exceeds 5% for any store (potential attack or misconfiguration); include recent failure samples in alert email.

 - **FR-137 - Webhook permanent failure classification**: Define permanent vs retriable failures for Dead Letter Queue routing: (1) **Permanent failures** (never retry, send to DLQ immediately): HTTP 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 410 Gone, 422 Unprocessable Entity - these indicate client errors or non-existent resources that won't resolve with retries, (2) **Retriable failures** (retry with exponential backoff, max 5 attempts): HTTP 408 Request Timeout, 429 Too Many Requests, 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout - these indicate temporary issues that may resolve, (3) **Network errors** (DNS failures, connection timeouts, SSL errors): Treat as retriable with exponential backoff, (4) **Response format**: Permanent failures stored in DLQ with full context (error code, response body, headers) for debugging; retriable failures logged to monitoring with retry count and next retry timestamp, (5) **Manual override**: Store Admins can manually reclassify failure type in DLQ dashboard (e.g., mark retriable as permanent to stop retries).
 - **FR-138 - External platform authentication**: Support platform-specific authentication methods for sync integrations: (1) **Shopify**: OAuth 2.0 with automatic token refresh; store access_token (encrypted per FR-134) and refresh_token in External Platform Integration entity; refresh tokens 5 minutes before expiration, (2) **WooCommerce**: REST API consumer key + secret (encrypted); use HTTP Basic Authentication (base64-encoded key:secret) in Authorization header, (3) **Custom platforms**: Support API key authentication (header-based or query parameter) and JWT bearer tokens, (4) **Credential rotation**: Support zero-downtime credential updates (dual-credential support for 24 hours during rotation similar to FR-134 key rotation), (5) **Credential validation**: Test credentials on save with ping API call; reject invalid credentials with specific error message from platform API, (6) **Audit logging**: Log all authentication attempts (success/failure) with platform name, store ID, and timestamp to audit trail.
 - **FR-139 - MFA backup code lifecycle**: Implement automated backup code expiration and renewal: (1) **Expiration reminder**: Send email to user 30 days before backup code expiration (11 months after generation) with message "Your MFA backup codes expire in 30 days. Generate new codes now to avoid account lockout.", (2) **Forced regeneration**: On expiration day (1 year after generation), mark all backup codes as expired; next MFA login requires authenticator app (no backup code option) until new codes generated, (3) **Grace period**: Provide 7-day grace period where expired codes still work but display warning "Backup codes expired. Generate new codes immediately."; after grace period, expired codes rejected entirely, (4) **Regeneration workflow**: User can regenerate backup codes anytime via Account Settings > Security > MFA > "Generate New Backup Codes"; old codes invalidated immediately upon new code generation, (5) **Download prompt**: After generation, display modal "Download and securely store these codes. You won't be able to see them again." with download button (text file format).

 - **FR-10Y - Webhook idempotency standards**: All webhook handlers MUST implement idempotency to safely handle duplicate webhook deliveries without side effects (duplicate charges, inventory double-deduction, multiple notification emails). Implementation requirements: (1) **Idempotency key format**: Use composite key `webhook:{source}:{entity}:{identifier}` where `source` is gateway/platform name (e.g., `stripe`, `sslcommerz`, `shopify`), `entity` is event type (e.g., `payment`, `order`, `inventory`), `identifier` is unique transaction/event ID from source system (e.g., Stripe payment intent ID `pi_3abc123`, SSLCommerz transaction ID `tx_987xyz`). Examples: `webhook:stripe:payment:pi_3NRnMZ2eZvKYlo2C0qytxKx1`, `webhook:sslcommerz:payment:tx_64f89a3b2c1e5`, `webhook:shopify:order:gid://shopify/Order/123456789`. (2) **Storage backend**: Use Vercel KV (Redis-compatible) for production (sub-10ms read/write, global replication, automatic eviction); fallback to in-memory cache for local development. (3) **TTL (Time-To-Live)**: Store idempotency keys with 24-hour expiration (86400 seconds); after 24 hours, key auto-deleted and webhook can be reprocessed if received again (handles extreme delayed retry scenarios). (4) **Processing workflow**: For each webhook request: (a) After signature verification passes (FR-10X), generate idempotency key, (b) Check if key exists in Redis using `EXISTS webhook:{source}:{entity}:{identifier}`, (c) **If key exists (duplicate)**: Log duplicate webhook detection to audit trail with original processing timestamp, return HTTP 200 OK with response body `{"status": "duplicate", "message": "Webhook already processed", "originalProcessedAt": "{timestamp}"}` (success response prevents gateway retries), skip all business logic processing, (d) **If key does NOT exist (first delivery)**: Proceed with webhook business logic processing (update order status, capture payment, adjust inventory, send notifications), (e) **After successful processing**: Set idempotency key in Redis with `SET webhook:{source}:{entity}:{identifier} {processing_timestamp} EX 86400`, commit database transaction, (f) Return HTTP 200 OK with response body `{"status": "success", "message": "Webhook processed", "processedAt": "{timestamp}"}`. (5) **Atomic operations**: Use Redis transactions or Lua scripts to ensure check-and-set atomicity for idempotency key to prevent race conditions when same webhook delivered concurrently to multiple serverless function instances. (6) **Failed processing handling**: If webhook processing fails after idempotency key set, delete the key (allow retry) OR store key with `status:failed` value and include failure reason; gateway retry will reprocess (new attempt) instead of returning duplicate response. (7) **Idempotency key metadata**: Store additional metadata with key: `{ processedAt: timestamp, orderId: string, amountProcessed: number, status: 'success'|'failed', errorMessage?: string }` using JSON value in Redis; enables debugging and reconciliation. (8) **Monitoring**: Track idempotency hit rate (duplicate deliveries) per gateway; alert if hit rate exceeds 10% (indicates gateway retry issues or misconfiguration); dashboard shows per-gateway duplicate rates and recent duplicate events. (9) **Manual replay**: Provide admin UI to manually replay failed webhooks (deletes idempotency key, resends webhook to handler); useful for resolving payment/order status discrepancies during incident recovery.

 - **FR-10Z - Webhook event ordering**: Webhook handlers MUST handle out-of-order event delivery gracefully to prevent data inconsistencies (e.g., "payment_captured" webhook arriving before "payment_authorized" due to network delays). Implementation requirements: (1) **Sequence numbers**: If external system provides event sequence numbers (e.g., Shopify includes `X-Shopify-Order-Sequence-Number` header), store last processed sequence number per entity in database (e.g., `Order.lastWebhookSequence`); reject events with sequence number ≤ last processed with HTTP 409 Conflict response: `{"status": "stale", "message": "Event sequence {receivedSeq} already processed. Last processed: {lastSeq}"}`. (2) **Timestamp fallback**: If sequence numbers unavailable, use event timestamp as ordering signal; compare received event timestamp with last processed event timestamp stored in entity (e.g., `Order.lastWebhookTimestamp`); if received timestamp is older, log warning but process anyway (timestamps less reliable due to clock skew). (3) **State machine validation**: For entities with defined state transitions (e.g., Order status: pending → processing → shipped → delivered), validate that incoming event's target state is a valid transition from current state; reject invalid transitions (e.g., cannot go from "delivered" back to "processing") with HTTP 422 Unprocessable Entity and message: `{"status": "invalid_transition", "message": "Cannot transition from {currentState} to {targetState}"}`. Store rejected events in `WebhookFailure` table for manual review. (4) **Gap detection**: If sequence number gaps detected (e.g., received sequence 105 but last processed was 103, missing 104), pause processing and trigger alert to admin: "Missing webhook event detected for Order #{orderNumber}. Sequence gap: {lastSeq} → {receivedSeq}. Manual intervention required." Provide admin UI to manually fetch missing events via gateway API or mark gap as resolved. (5) **Concurrent event handling**: Use database row-level locking (`SELECT ... FOR UPDATE`) when processing webhooks that modify same entity to prevent race conditions; if lock cannot be acquired within 10 seconds (indicates another webhook processing same entity), return HTTP 409 Conflict: `{"status": "concurrent_processing", "message": "Another webhook is currently processing this entity. Please retry in a few seconds."}` to trigger gateway retry. (6) **Delayed event queue**: If event arrives out-of-order (sequence number too high), queue event in `WebhookDelayedQueue` table with retry logic: check every 30 seconds if gap filled, process when previous events arrive, expire after 1 hour if gap never fills (log to admin dashboard for manual resolution). (7) **Event deduplication + ordering**: Combine FR-10Y idempotency with FR-10Z ordering checks in this order: (a) Signature verification (FR-10X), (b) Idempotency check (FR-10Y - return if duplicate), (c) Sequence number validation (FR-10Z - reject if stale), (d) State transition validation, (e) Business logic processing, (f) Set idempotency key and update sequence number atomically. (8) **Monitoring and alerting**: Track per-gateway metrics: out-of-order event rate (%), sequence gaps detected (count), delayed queue size, average gap resolution time; alert Super Admins if queue size exceeds 50 events or gaps unresolved for >1 hour. (9) **Testing scenarios**: Provide webhook replay tool in admin dashboard with sequence number override capability to test out-of-order handling during development; include pre-built test scenarios (duplicate delivery, out-of-order events, sequence gaps, concurrent updates, invalid state transitions).

Payment processing
- **FR-128**: Payment gateway authorization requests MUST timeout after 30 seconds to prevent indefinite customer wait. On timeout: (1) Display user-friendly error message "Payment processing is taking longer than expected. Please try again or use a different payment method. If this issue persists, contact support.", (2) Log timeout event to monitoring system with gateway name, order ID, and timestamp for SLA tracking, (3) Return HTTP 504 Gateway Timeout to client, (4) Do NOT create order or reserve inventory (rollback any partial state), (5) Allow customer to retry payment immediately. Gateway-side timeout handling: if webhook arrives after 30s timeout, process as normal (idempotent webhooks prevent double-charging).
- **FR-129**: Password reset endpoint MUST implement rate limiting to prevent email bombing attacks: (1) Maximum 5 password reset requests per email address per 15-minute sliding window, (2) Maximum 20 password reset requests per IP address per 5-minute sliding window, (3) Rate limit exceeded returns HTTP 429 Too Many Requests with Retry-After header and message "Too many password reset attempts. Please try again in X minutes.", (4) Rate limit counters stored in Vercel KV (Redis) with automatic expiration, (5) Security team notified if same email/IP exceeds limit 3+ times in 1 hour (potential targeted attack).
- **FR-130**: MFA recovery tokens MUST be single-use and rate-limited: (1) Add `used` boolean flag to MFA Recovery Token entity (default: false), (2) Mark token as used immediately upon successful recovery, (3) Reject already-used tokens with error "This recovery link has already been used. Request a new recovery link if needed.", (4) Maximum 3 recovery token requests per user per hour to prevent brute-force token generation, (5) Rate limit exceeded returns "Too many recovery attempts. Please try again in X minutes or contact support for assistance."

Defaults and policies
- **FR-110**: The system MUST allow configuration of thresholds (low stock, KPI highlights) at the store level by Store Admins only. Staff users cannot modify thresholds unless explicitly granted permission via Store Settings > Staff Permissions > "Manage Thresholds" toggle.
- **FR-111**: The system MUST provide configurable auto‑cancel window for unpaid orders (default: 60 minutes) and document the default.
- **FR-112**: The system MUST provide human‑readable error messages for validation failures (e.g., uniqueness, stock). Error message format: (1) What went wrong (e.g., "SKU 'ABC123' already exists"), (2) Why it failed (e.g., "for product 'Blue T-Shirt'"), (3) How to fix (e.g., "Change SKU to a unique value or edit the existing product"). Avoid generic errors like "Validation failed" without context.

Media and image optimization
- **FR-131**: Product image uploads MUST be automatically processed through optimization pipeline: (1) Resize to maximum 2000px width while maintaining aspect ratio (prevents excessive storage/bandwidth usage), (2) Generate 3 responsive variants: thumbnail (200x200 center crop), medium (600px width), large (1200px width), (3) Convert to WebP format with 85% quality; retain original format (JPEG/PNG) as fallback for unsupported browsers, (4) Store in Vercel Blob Storage with automatic CDN distribution via Vercel Edge Network, (5) Generate responsive srcset for Next.js Image component (automatic lazy loading, responsive serving), (6) Maximum upload size: 10MB per image; reject larger files with clear error message, (7) Supported formats: JPEG, PNG, WebP; reject other formats (GIF, TIFF, BMP) with message "Unsupported format. Please upload JPEG, PNG, or WebP.", (8) Processing must complete within 10 seconds; display progress indicator during upload with percentage completion, (9) Failed processing logs error to monitoring and displays user-friendly message "Image processing failed. Please try a different image or contact support."

Accessibility and testing
- **FR-132**: System MUST implement comprehensive WCAG 2.1 Level AA verification: (1) **Automated testing**: Integrate axe-core accessibility testing library into Playwright E2E test suite; run axe.run() checks on every page during test execution, (2) **CI enforcement**: CI pipeline blocks pull request merge if axe violations detected (errors only; warnings logged but non-blocking), (3) **Manual testing**: Conduct accessibility audit before GA release using screen readers: NVDA (Windows), JAWS (Windows), and VoiceOver (macOS) on critical user paths (authentication, product browsing, checkout flow, admin dashboard navigation), (4) **Documentation**: Document test results in `docs/accessibility-audit.md` with violation details, remediation steps, and retest outcomes, (5) **Keyboard navigation**: All interactive elements (buttons, links, form inputs, modals, dropdowns) must be keyboard accessible with visible focus indicators (2px solid ring), (6) **ARIA landmarks**: All pages use HTML5 semantic elements (header, nav, main, aside, footer) and ARIA landmark roles for screen reader navigation, (7) **Skip links**: Provide "Skip to main content" link at top of every page (visible on focus), (8) **Color contrast**: Ensure 4.5:1 contrast ratio for text, 3:1 for UI components; theme editor validates contrast during customization and blocks saving non-compliant themes.
- **FR-133**: System MUST implement performance validation before launch: (1) **Load testing**: Pre-launch load test with k6 simulating 100 concurrent users, 1000 orders/hour throughput for 30 minutes, (2) **Success metrics**: <1% error rate, p95 latency meets SC targets (API <500ms, page load <2s), no memory leaks, (3) **Large catalog testing**: Seed test environment with 10,000 products, 250,000 customers, 83,000 orders/month and verify SC-007 (search/filter <2s), SC-021 (homepage <2s), SC-022 (product listing <2.5s) compliance, (4) **Bundle size enforcement**: Add Next.js bundle analysis to CI; block merge if main bundle exceeds 200KB gzipped (excluding vendor chunks); display bundle size diff in PR comments, (5) **Lighthouse CI**: Run Lighthouse performance audit on every PR; require Performance score ≥90, LCP <2s, CLS <0.1, TBT <300ms; block merge if thresholds not met.

Scalability and performance
- **FR-113**: The system MUST maintain responsive performance (per success criteria timing targets: SC-003, SC-007, SC-011, SC-012, SC-013, SC-017, SC-020, SC-021-025) for stores with up to 10K products, 83K orders/month, and 250K customers.
- **FR-114**: The system SHOULD provide scalability monitoring dashboard for Super Admins showing per-store resource usage (database size, order volume trends, API request rates) to identify stores approaching limits.
- **FR-115**: The system SHOULD implement event-based cache invalidation strategy for product data: (1) **Cache storage**: Use Vercel KV (Redis) for product list/category caching in production; in-memory cache for local development, (2) **Cache keys**: Format `cache:products:{storeId}:{filterHash}` where filterHash is MD5 of query parameters (category, price range, sort order), (3) **TTL fallback**: 5-minute TTL as fallback if event invalidation fails, (4) **Invalidation triggers**: Immediately clear cache on product create/update/delete operations (product name, price, inventory, visibility changes), (5) **Partial invalidation**: Only clear affected cache keys (e.g., product update clears that product's category cache, not entire store cache), (6) **Monitoring**: Track cache hit rate (target >80%), invalidation frequency, and cache size per store; alert if hit rate drops below 60% (indicates excessive invalidation or poor cache strategy).

Reliability and availability
- **FR-116**: The system MUST achieve 99.9% uptime SLA (≈43 minutes planned + unplanned downtime per month) excluding scheduled maintenance windows.
- **FR-117**: The system MUST provide scheduled maintenance windows during low-traffic periods (configurable per region) with minimum 48-hour advance notice to affected stores.
- **FR-118**: The system MUST implement automated health checks and monitoring for critical services (database, payment gateways, email delivery, webhook processing) with alerts on failures.
- **FR-119**: The system MUST implement automated database backups with point-in-time recovery capability; backups retained for minimum 30 days.
- **FR-120**: The system SHOULD implement disaster recovery procedures with Recovery Time Objective (RTO) of 4 hours and Recovery Point Objective (RPO) of 1 hour for critical data.

Security and encryption
- **FR-134**: Sensitive credentials (payment gateway API keys, webhook secrets, external platform API tokens) MUST be encrypted at rest using AES-256-GCM: (1) **Encryption algorithm**: Use AES-256-GCM with 256-bit key and 96-bit IV (Initialization Vector); reject weaker algorithms (AES-128, 3DES, RC4), (2) **Key management**: Data Encryption Keys (DEKs) stored in Vercel environment variables (encrypted at rest by Vercel platform); Key Encryption Key (KEK) never stored in code or database, (3) **Key rotation**: Rotate DEKs every 90 days with zero-downtime migration (dual-key support for 24-hour overlap: decrypt with old key, re-encrypt with new key in background), (4) **Storage format**: Encrypted credentials stored as `{algorithm}:{iv}:{ciphertext}:{authTag}` (e.g., `aes-256-gcm:a3c7f9b2e1d5:9f8a7b6c:d4e5f6g7`), (5) **Audit trail**: Log all encryption/decryption operations with timestamp, credential type, and operation outcome (success/failure) for forensics.
- **FR-135**: Security audit logs MUST implement tamper-proof immutable storage: (1) **Database constraints**: Prisma AuditLog model has no update or delete methods; database triggers block UPDATE/DELETE operations and log tampering attempts, (2) **Append-only access**: Application code can only INSERT into audit log table via write-only database user; read access via separate read-only user for audit queries, (3) **Hash chain verification**: Each audit log entry includes cryptographic hash of previous entry (SHA-256) creating verifiable chain; periodic verification job (daily) checks chain integrity and alerts on breaks, (4) **Retention enforcement**: After 1-year retention period, audit logs archived to cold storage (Vercel Blob) with same immutability guarantees; original entries deleted from hot database to manage size, (5) **Tampering detection**: If hash chain broken or unauthorized modification detected, immediately alert Security Team with entry details, suspected tampering timestamp, and affected records.
- **FR-136**: CORS (Cross-Origin Resource Sharing) policy MUST be configurable per store: (1) **Auto-whitelisting**: Automatically allow requests from store's primary domain (`{store.domain}`) and all subdomains (`*.{store.domain}`), (2) **Custom origins**: Store Admins can add up to 10 additional allowed origins via Store Settings > Security > CORS Configuration with format validation (must be valid HTTPS URL), (3) **Credentials support**: Allow credentials (cookies, authorization headers) only for whitelisted origins; block for wildcard origins, (4) **Preflight caching**: Set `Access-Control-Max-Age: 86400` (24 hours) for preflight OPTIONS requests to reduce overhead, (5) **Default policy**: If no custom origins configured, block all cross-origin requests except from store domain (strict security posture), (6) **Monitoring**: Log CORS violations (blocked requests) with origin, timestamp, and endpoint for security analysis; alert if single origin exceeds 100 violations/hour (potential attack or misconfiguration).

Data retention and compliance
- **FR-121**: The system MUST retain orders, invoices, and financial transaction records for 3 years to meet tax and accounting compliance requirements.
- **FR-122**: The system MUST retain security audit logs for 1 year with immutable storage to support security investigations and compliance audits. Implementation: Append-only database table with hash chain verification (FR-135).
- **FR-123**: The system MUST retain automated backups for 90 days with automated cleanup of older backups to manage storage costs.
- **FR-124**: The system MUST support GDPR-compliant customer data deletion requests (right to be forgotten) with complete data purge within 30 days, excluding legally required financial records.
- **FR-125**: The system MUST provide data export functionality for customers (data portability) in machine-readable format (JSON/CSV) including all personal data, orders, and interactions.
- **FR-126**: The system MUST implement automated data retention policies with scheduled jobs to archive or delete data past retention periods.
- **FR-127**: The system SHOULD provide configurable retention policies per store for non-regulated data (e.g., marketing data, abandoned carts) to allow customization based on business needs.

Multi-tenancy and user management
- **FR-140**: System MUST support multi-store user access patterns: (1) **User-Store association**: User can be associated with multiple stores via join table (UserStore) with per-store role assignment (e.g., STORE_ADMIN at Store A, STAFF at Store B), (2) **Store switching UI**: Admin dashboard header displays current store name with dropdown to switch between associated stores; switching reloads dashboard with new store context without re-authentication, (3) **Role inheritance**: User's permissions determined by role assigned to specific store; no cross-store role inheritance (must explicitly assign role per store), (4) **Session context**: User session (FR-047) stores current active storeId; all API requests auto-filtered by session storeId via Prisma middleware for tenant isolation, (5) **Super Admin privileges**: SUPER_ADMIN role grants access to all stores without explicit association; store selector shows "All Stores" with search/filter capability, (6) **Audit logging**: Store switching events logged to audit trail with previous storeId, new storeId, and timestamp for security tracking.
- **FR-141**: System MUST enforce tenant isolation via Prisma middleware (application layer): (1) **Auto-injection**: Prisma middleware automatically injects `storeId` filter on all findMany, findFirst, findUnique queries; throws error if storeId missing from context, (2) **Create operations**: Middleware auto-injects storeId from session context on create/createMany operations; prevents accidental cross-tenant data leakage, (3) **Raw SQL prohibited**: Block raw SQL queries (`$queryRaw`, `$executeRaw`) in application code; enforce Prisma Client only for type safety and tenant isolation guarantees, (4) **Database-level RLS**: PostgreSQL Row-Level Security (RLS) policies deferred to Phase 2 for defense-in-depth; Phase 1 relies on application-layer isolation only, (5) **Testing isolation**: E2E tests verify tenant isolation by attempting cross-tenant data access (must fail with 403 Forbidden or 404 Not Found).

Notifications and email
- **FR-142**: System MUST implement intelligent bulk notification handling: (1) **Threshold detection**: If >100 notifications of same type triggered within 5-minute window for single store (e.g., 100 low-stock alerts), batch into digest format instead of individual emails, (2) **Digest format**: Single email with subject "100 Low Stock Alerts - [Store Name]" and table listing affected products with SKU, name, current stock, threshold; sent to all recipients who would have received individual emails, (3) **Immediate vs batched**: Critical notifications (payment failures, security alerts, order cancellations) always sent immediately (no batching); informational notifications (low stock, abandoned carts, daily reports) eligible for batching, (4) **Digest frequency**: Batched notifications sent at most once per hour (e.g., 10:00 AM digest includes all events from 9:00-10:00 AM), (5) **Opt-out**: Users can opt out of digest format in notification preferences (receive individual emails even if batched); default is digest enabled for cleaner inbox.
- **FR-143**: Email template preview MUST use sample data with clear indication: (1) **Sample data source**: Predefined sample values (not real customer data) for privacy protection: `{{customerName}}` = "Jane Doe", `{{orderNumber}}` = "ORD-12345", `{{orderTotal}}` = "$149.99", `{{productName}}` = "Sample Product", `{{trackingNumber}}` = "1Z999AA10123456784", etc., (2) **Preview mode indicator**: Display prominent "PREVIEW MODE" watermark in red at top of email preview; watermark not included in actual sent emails, (3) **Missing variables**: If template includes variable not in sample data set, display placeholder `[VARIABLE_NAME not available in preview]` in red text with warning icon, (4) **Test send**: Provide "Send Test Email" button to send preview to admin's email address for inbox rendering verification; test emails include "[TEST]" prefix in subject line, (5) **Real data preview**: Store Admins can optionally preview with real data (e.g., last order) by selecting from dropdown; requires explicit "Use Real Data" confirmation for privacy awareness.

Analytics and reporting  
- **FR-144**: Dashboard "top products" ranking MUST use configurable algorithm: (1) **Default ranking**: By revenue (units sold × price) for current period (e.g., last 30 days), (2) **Alternative rankings**: Store Admins can change ranking metric via Report Settings dropdown: (a) Revenue (default), (b) Units sold (quantity), (c) Profit margin (revenue - COGS), (d) Conversion rate (purchases / views), (3) **Tie-breaking**: If products have identical ranking value, sort by most recent sale timestamp (newer first), (4) **Configurable period**: Rankings support multiple time periods (last 7/30/90 days, this month, last month, custom date range) via date picker, (5) **Display format**: Show top 10 products by default; expandable to top 20/50/100; export button for full list CSV download.

Security and rate limiting
- **FR-145**: Password reset endpoint MUST enforce rate limiting to prevent email bombing attacks: (1) **Per-email limit**: 5 password reset requests per email address per 15-minute window (sliding window in Redis/Vercel KV), (2) **Per-IP limit**: 20 password reset requests per IP address per 5-minute window (prevents distributed attacks), (3) **Exceeded response**: HTTP 429 Too Many Requests with message "Too many reset requests. Please try again in X minutes." where X is time remaining until window expires, (4) **Admin alerts**: Dashboard alert triggered when >50 rate limit violations occur within 1-hour window (potential attack indication), (5) **Audit logging**: All rate limit violations logged to audit trail with email, IP address, user agent, and timestamp.
- **FR-146**: MFA recovery token MUST enforce single-use and rate limiting: (1) **Single-use enforcement**: Add `used` boolean flag (default false) to MFA Recovery Token entity; mark as used immediately after successful verification; attempting to reuse returns "Recovery token already used. Request a new one.", (2) **Token generation rate limit**: 3 recovery token requests per user per hour (prevents brute force of token generation), (3) **Token usage rate limit**: 10 recovery token verification attempts per IP address per hour (prevents distributed brute force), (4) **Audit logging**: Track all recovery token generation attempts (successful and rate-limited) and usage attempts (valid, invalid, already-used) with timestamp, IP address, user agent in audit trail, (5) **Email notification**: Send security alert email to user's registered email when recovery token generated (helps detect unauthorized attempts).
- **FR-147**: CORS (Cross-Origin Resource Sharing) policy MUST enforce origin whitelisting with store-level configuration: (1) **Auto-whitelist store domain**: Automatically allow requests from store's primary domain (`store.domain`) and all subdomains (`*.store.domain`) without manual configuration, (2) **Additional origins UI**: Store Admins can add additional allowed origins via Settings > Security > CORS Configuration; UI displays current allowed origins list with Add/Remove buttons, (3) **Origin validation**: Validate origin format on add (must be valid URL with protocol, e.g., `https://example.com`); reject invalid formats with error message, (4) **Credentials flag**: Enable `Access-Control-Allow-Credentials: true` for all whitelisted origins (supports authenticated API requests from storefront), (5) **Default deny**: All non-whitelisted origins receive CORS error in browser console (prevents unauthorized cross-origin API access), (6) **Audit logging**: Log CORS policy changes (origin added/removed) to audit trail with actor and timestamp.

Customer registration and onboarding
- **FR-148**: Storefront MUST support customer self-registration with email verification: (1) **Registration page**: Public registration page at `/register` or `/account/signup` accessible without authentication, (2) **Required fields**: Full Name (2-100 chars), Email Address (valid format, unique per store), Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char), Password Confirmation (must match), (3) **Optional fields**: Phone Number (E.164 format validation), Marketing Consent checkbox ("I agree to receive promotional emails"), (4) **Email verification**: Immediately send verification email with 24-hour expiration link upon registration; email subject "Verify your StormCom account"; link format `/auth/verify-email?token={token}`, (5) **Unverified account behavior**: Allow login before verification but display persistent banner "Verify your email to access full features"; restrict certain features (e.g., placing orders >$100, leaving reviews, accessing loyalty rewards) until verified, (6) **Manual verification**: Staff and Store Admins can manually verify customer accounts via customer detail page "Verify Email" button (bypass verification requirement for phone/in-person signups), (7) **Dashboard metrics**: Admin dashboard shows verified vs unverified customer counts with trend graph.
- **FR-149**: Session invalidation timing MUST differentiate security-critical vs non-critical changes: (1) **Security-critical changes** (password change, permission/role change, account suspension): Invalidate ALL user sessions immediately (<10 seconds) by synchronously deleting session keys from Vercel KV; user sees "Your session has been updated for security. Please login again.", (2) **Non-critical changes** (profile updates, notification preferences, theme settings): Use eventual consistency with 60-second propagation via background job (acceptable delay); user sees "Your preferences have been updated." without forced logout, (3) **Implementation**: Security-critical operations call `invalidateAllUserSessions(userId)` which performs synchronous Vercel KV delete (blocking operation); non-critical operations set `sessionNeedsRefresh` flag checked by background job every 60s, (4) **User notification**: Display toast notification explaining session impact: "Security settings changed. All devices have been logged out." vs "Settings updated. Changes will apply shortly.", (5) **Audit logging**: Log all session invalidations with reason (password change, permission revocation, etc.) and affected session count.
- **FR-150**: Store-level configuration thresholds MUST enforce Store Admin permissions: (1) **Permission requirement**: All threshold configurations (low stock threshold, discount limits, refund ceilings, bulk operation batch sizes, etc.) require Store Admin role; Staff and Manager roles have read-only access, (2) **Permission denied UI**: Attempting to modify without Store Admin role shows disabled form fields with tooltip "Store Admin privileges required to modify this setting. Contact your administrator.", (3) **Super Admin override**: Super Admin role can modify any store's configuration regardless of store-specific roles, (4) **Audit trail**: All configuration changes logged to audit trail with actor name/email, timestamp, setting name, old value, new value, (5) **Bulk updates**: Configuration bulk update API endpoint (for managing multiple stores) requires Super Admin role; returns HTTP 403 Forbidden if attempted by Store Admin.

### Key Entities (data overview)

- Store (Tenant): name, domain/slug, status, subscription plan, plan limits, settings, theme config; has many Users, Products, Orders.
- Subscription Plan: name, tier, pricing, billing cycle, feature limits (max products, orders, staff, storage), trial period; has many Store Subscriptions.
- Store Subscription: store reference, plan reference, status, start date, end date, trial end date, usage metrics; tracks plan usage and expiration.
- User: email, name, roles, MFA settings, status, language preference; belongs to one or more Stores; actions audited.
- User Session: **Stored in Vercel KV (production) or in-memory Map (local development)**. Key: session ID (from JWT), Value: { userId, storeId, role, deviceType, browser, ipAddress, userAgent, createdAt, lastActivityAt, expiresAt }. TTL set to 30 days absolute (matching JWT expiration). Session validated on every API request by checking session ID exists in store. Password change/logout/permission revocation deletes session key immediately (invalidation <10ms in production, instant in local dev).
- Password History: user reference, bcrypt password hash, created at; stores last 5 passwords to prevent reuse.
- Failed Login Attempt: user email, IP address, attempted at, success flag; tracks failed logins for account lockout enforcement.
- Password Reset Token: token, user reference, created at, expires at (1 hour), used flag; single-use tokens for password reset flow.
- MFA Secret: user reference, secret key (encrypted), backup codes (JSON array of bcrypt hashes with usage status), backup codes generated at (for 1-year expiration), SMS phone number (E.164 format), SMS enabled flag, enabled at; stores TOTP secret, backup codes, and SMS configuration for multi-factor authentication.
- MFA Recovery Token: token, user reference, created at, expires at (1 hour), used flag; single-use tokens for MFA recovery workflow when user loses access to authenticator app.
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
- Page/Blog/Menu/FAQ: content, slug, publication state, schedule, language.
- Store Testimonial (FR-070): store reference, customer name, customer photo URL, testimonial text, rating (1-5 stars), display order, publication status (draft/pending/published/archived), created at, published at. Displayed on homepage/about page for store-wide social proof.
- Product Testimonial/Review (FR-016): product reference, customer reference (nullable for guest reviews), rating (1-5 stars), review title, review text, helpful votes count, verified purchase flag, moderation status (pending/approved/rejected), admin response text (nullable), admin response at (nullable), created at, published at. Displayed on product detail pages. Same underlying data model as Product Review.
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
- **Product variants**: Maximum 100 variants per product to ensure UI performance (dropdown selector up to 20 variants, modal selector for 20-100). Database enforces limit via check constraint. Exceeding limit requires product splitting or custom Enterprise configuration.
- **International shipping**: Deferred to Phase 2. Phase 1 supports domestic shipping only (no customs declaration, HS codes, or international carrier integrations). Stores targeting international markets should defer to Phase 2 requirements.
- **COD (Cash on Delivery)**: Payment method available in Phase 1 but cash collection confirmation workflow deferred to Phase 2. Phase 1 treats COD as "pending" payment; manual admin marking as "paid" after delivery confirmation required.
- **Module/add-on system**: Deferred to Phase 3 for platform extensibility.
- **Mobile apps**: Out of scope for Phase 1; focus is web-based admin and storefront (responsive design).
- **Storefront architecture**: Full-stack solution with both admin dashboard AND customer-facing storefront UI (complete turnkey platform for mid-market merchants).
- **Store provisioning**: Store creation is Super Admin-only for Phase 1 (US1). Self-service store signup with trial activation, automated onboarding, and customer billing integration deferred to Phase 2 as customer acquisition feature. Phase 1 focuses on managed B2B model where platform owners provision stores for clients.
- **External platform sync**: Real-time bidirectional synchronization via webhooks for immediate data consistency; supports configurable conflict resolution (last-write-wins, manual queue, or priority rules) and entity-level direction overrides per store. "Real-time" latency measured from webhook receipt to StormCom database update completion (excluding external API response time).
- **PCI compliance**: Achieved by NOT storing raw card data; rely on payment gateway tokenization.
- **Default plan limits** (configurable per deployment):
  - Free: 10 products, 50 orders/month, 1 staff user, 100MB storage, 60 API req/min, community support
  - Basic ($29/mo): 100 products, 500 orders/month, 3 staff users, 1GB storage, 120 API req/min, email support
  - Pro ($99/mo): 1000 products, 5000 orders/month, 10 staff users, 10GB storage, 300 API req/min, priority support
  - Enterprise (custom): unlimited resources, 1000 API req/min (customizable), dedicated support, custom SLA
- **Trial period**: Default 14 days for all paid plans; automatically converts or expires. System sends trial expiration warnings at 7 days, 3 days, and 1 day before expiration via email and in-app banner notifications.
- **Grace period after expiration**: Default 7 days read-only access before full suspension. During grace period, store cannot create new orders/products but can view data and upgrade plan.
- **Plan downgrade data handling**: When downgrading to plan with lower limits (e.g., Pro [1000 products] → Basic [100 products] with 500 existing products), system blocks downgrade until store reduces data below new limit. Admin receives clear message: "Cannot downgrade to Basic plan. Current: 500 products, Limit: 100. Please archive or delete 400 products to proceed." No automatic data deletion or archiving.
- **Tax calculation rounding**: All tax amounts use banker's rounding (round to nearest even) to minimize cumulative rounding bias. Example: $10.125 → $10.12, $10.135 → $10.14. Ensures fairness across millions of transactions.
- **Refund policy**: Refund amount cannot exceed original payment amount per order. Multiple refunds allowed until cumulative refunds equal order total. Service recovery overages (e.g., goodwill refund exceeding order) require manual Super Admin intervention via database adjustment with audit log entry.
- **Report time zones**: All dashboard reports and analytics use store's configured time zone setting (default: server UTC). Time zone preference configurable in Store Settings. Timestamps in exports include time zone offset (e.g., "2025-01-15 14:30:00 -05:00").
- **Inventory adjustment approvals**: Phase 1 has no approval workflows; all inventory adjustments are immediate upon submission by authorized staff. Approval workflows for large adjustments (>1000 units or >$10,000 value) deferred to Phase 2 as enterprise feature.
- **Customer self-registration**: Storefront allows customer self-registration with email verification (24-hour token expiration). Account active immediately upon email verification. Admin-created customer accounts skip email verification (pre-verified status).
- **Bulk import validation strategy**: All-or-nothing transaction rollback for CSV/Excel imports. If ANY product in uploaded file fails validation (missing required field, duplicate SKU, invalid price format, reference to non-existent category), entire batch is rejected (no partial import). System generates detailed error report listing all validation failures with exact line numbers and error descriptions (e.g., "Line 47: Invalid price '$ABC' - must be decimal number"). User must fix all errors and re-upload. Partial import with skip-on-error deferred to Phase 2.
- **Low stock threshold**: Default 10 units per product (configurable per product). Notifications triggered when variant quantity falls below threshold. Threshold value displayed in inventory list with visual indicator (red badge for out-of-stock, yellow for low stock, green for in-stock).

Dependencies
- Payment gateway providers (SSLCommerz, Stripe) for capturing, refunding, and reconciling payments per store.
- Email service provider (transactional email API like SendGrid, Mailgun, or SMTP) for notifications.
- Optional SMS provider for MFA SMS fallback (Twilio, SNS).
- Optional SSO identity providers (Okta, Azure AD, Google, OneLogin) where enabled.
  - **SSO Authentication**: Deferred to Phase 2. Phase 1 implements email/password authentication with MFA only (US0). SSO integration requires additional functional requirements for provider configuration UI, profile attribute mapping, JIT (Just-In-Time) provisioning, group/role synchronization, and error handling for failed SSO assertions.
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
- **SC-010F**: MFA challenges (TOTP codes) validate successfully for correct codes and reject invalid/expired codes 100% of the time; email-based recovery workflow allows account access recovery when authenticator app is unavailable.
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


