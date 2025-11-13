# Feature Specification: Harden Checkout, Tenancy, and Newsletter

**Feature Branch**: `002-harden-checkout-tenancy`  
**Created**: 2025-11-13  
**Status**: Draft  
**Input**: Consolidated remediation for: insecure checkout, storefront multi-tenancy bypass, non-functional newsletter signup; plus standardization of errors, schema alignment, middleware enforcement, transactional integrity, caching strategy, performance/accessibility validation, API pipeline, CSV export, SEO/accessibility, GDPR consent, analytics accessibility.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Shopper completes a secure checkout (Priority: P1)

As a signed-in shopper, I can complete checkout with server-verified pricing and payment validation so that my order is correct, inventory is adjusted, and my payment is captured without fraud or errors.

**Why this priority**: Eliminates critical security and integrity risks (price tampering, unauthorized checkout, partial writes), directly impacting revenue and trust.

**Independent Test**: Execute checkout end-to-end with a cart that attempts client-side price manipulation; verify server-side recalculation, payment validation, atomic order creation, inventory decrement, and consistent success/error responses.

**Acceptance Scenarios**:

1. Given a signed-in shopper and a cart, When the shopper submits checkout, Then pricing is recalculated server-side, payment is validated, and the order is created with inventory decremented in a single atomic transaction.
2. Given a shopper attempts to alter client-submitted prices or discounts, When checkout is submitted, Then the server ignores client prices, recalculates totals, and proceeds only if payment validation succeeds.
3. Given payment validation fails or inventory is insufficient, When checkout is submitted, Then the transaction is aborted and no order, payment record, or inventory change persists.
4. Given a successful order, When the response is returned, Then the payload uses the standardized shape and includes a correlation/request ID header.

---

### User Story 2 - Visitors see only their store’s content (Priority: P2)

As a visitor to the storefront on a given domain or subdomain, I see only the products, pages, and metadata for that store; unknown domains return a not-found experience.

**Why this priority**: Prevents cross-tenant data leakage and establishes canonical domain behavior for SEO and brand integrity.

**Independent Test**: Navigate to two different store domains; verify store resolution, tenant-scoped data only, 404 on unknown domains, and per-store metadata.

**Acceptance Scenarios**:

1. Given a mapped domain/subdomain, When a visitor requests storefront pages, Then the platform resolves to the correct store and returns only that store’s data.
2. Given an unmapped domain/subdomain, When a visitor requests a page, Then a not-found response is returned (no fallback store).
3. Given a store with specific title/description/social metadata, When pages are rendered, Then per-store metadata is present for search/social previews.
4. Given a store with both a custom domain and a subdomain, When a visitor arrives on the subdomain, Then they are redirected to the custom domain as the canonical host.

---

### User Story 3 - Visitors can subscribe to the newsletter compliantly (Priority: P2)

As a visitor, I can subscribe to a store’s newsletter via a simple form that validates my email, enforces rate limits, records my consent, deduplicates per store, and creates an auditable record; optional double opt-in behavior is clarified.

**Why this priority**: Converts traffic into leads while ensuring compliance (consent, DNT) and preventing abuse.

**Independent Test**: Submit the form with valid/invalid emails, repeat submissions, and DNT enabled; verify validation, rate limiting, consent record, audit log, and deduplication per store.

**Acceptance Scenarios**:

1. Given a valid email and store, When the subscription form is submitted, Then a subscription record is created once per email+store with a consent record and audit log entry.
2. Given repeated submissions for the same email+store, When the form is submitted again, Then the response indicates existing subscription without duplication and respects rate limits.
3. Given a user agent signaling Do Not Track, When the form is submitted, Then only essential processing occurs and no non-essential tracking is performed.
4. Given a valid submission, When the subscription is processed, Then it is activated immediately (single opt-in) and an audit trail is recorded.

---

### User Story 4 - Consistent APIs and export for admins (Priority: P3)

As an admin, I receive consistent API responses and can export orders as CSV; small exports stream promptly, and very large exports complete asynchronously with a downloadable link.

**Why this priority**: Improves operational reliability and performance for data workflows while standardizing developer experience and observability.

**Independent Test**: Call representative endpoints and verify response shape and headers; trigger CSV exports under and over the threshold and confirm streaming vs background processing behavior.

**Acceptance Scenarios**:

1. Given any API response, When received, Then the error shape is `{ error: { code, message, details? } }` and successes are `{ data, meta?, message? }` with an `X-Request-Id` header present.
2. Given an orders export with ≤10,000 rows, When requested, Then the CSV is streamed without exhausting memory.
3. Given an orders export with >10,000 rows, When requested, Then an asynchronous job is created and the user is notified to download when ready via both email and in-app notification.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Client attempts price tampering (negative price, extreme discount, altering currency) → server recalculates and rejects inconsistent payment intents.
- Inventory sells out between cart review and payment capture → transaction aborts with clear message; no partial writes.
- Payment validation unavailable (provider outage) → checkout rejects with retry guidance; no order creation.
- Unknown or misconfigured domain/subdomain → return not-found; no fallback to a default store.
- Duplicate newsletter submissions (same email+store) → idempotent response, no duplicates; respects rate limits.
- Requests exceeding rate limits (newsletter or checkout) → standardized rate-limit error with retry-after semantics.
- Accessibility: focus lost on form error → focus is managed to error summary; screen-reader announcements via live region.
- CSV export requested for extreme dataset size → streams up to threshold; larger yields async job with notification.
- Caching: product update occurs while cached list is served → cache invalidation tags clear dependent views promptly.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: Reject unauthenticated checkout attempts; require a valid signed-in session.
- **FR-002**: Recalculate all line items, discounts, shipping, and taxes on the server; ignore client-submitted monetary values.
- **FR-003**: Validate the provided payment intent/token with the payment processor prior to order creation; abort on validation failure.
 - **FR-003**: Validate the provided payment intent/token with the payment processor prior to order creation; abort on validation failure.
   - Clarification: Payment pre-validation MUST verify that the payment intent/authorization exists and that the expected amount and currency match server-side recalculated totals. The system SHOULD accept processor states such as "AUTHORIZED" or equivalent pre-authorized states for later capture; the implementation MUST document which states are merely validated vs which will be captured as part of order finalization.
   - Idempotency & retries: Checkout submissions MUST include an idempotency key (client-provided or server-generated) to prevent duplicate captures. The payment adapter MUST implement safe retry/backoff semantics. In case of payment provider outages, the checkout flow MUST abort without creating an order or mutating inventory; a retryable error should be surfaced to the client and reconciliation attempted by background processes when appropriate.
- **FR-004**: Execute order creation, order items, inventory decrement, discount usage mark, and payment record within a single atomic transaction.
- **FR-005**: Resolve the active store from the request domain/subdomain and map it to a tenant identifier; return not-found if no mapping exists. When both a custom domain and subdomain exist, redirect subdomain traffic to the custom domain as the canonical host.
 - **FR-005**: Resolve the active store from the request domain/subdomain and map it to a tenant identifier; return not-found if no mapping exists. When both a custom domain and subdomain exist, redirect subdomain traffic to the custom domain as the canonical host.
   - Clarification: For storefront GET requests, the canonical redirect SHOULD use HTTP 301 (Permanent Redirect) and the response SHOULD include a `Link: <https://{primary-domain}{path}>; rel="canonical"` header to aid SEO. For non-GET requests (e.g., form POSTs), avoid automatic redirects that change method semantics; prefer returning an informative error so clients can re-submit to the canonical host if applicable.
- **FR-006**: Eliminate hardcoded tenant identifiers from storefront components and services.
- **FR-007**: Provide a newsletter subscription path that validates input, prevents duplicates per email+store, records explicit consent, supports rate limiting, and writes an audit entry; activate subscriptions immediately (single opt-in) with an audit trail.
- **FR-008**: Standardize API responses: success `{ data, meta?, message? }`; error `{ error: { code, message, details? } }`.
- **FR-009**: Enforce tenant scoping for all tenant-owned queries via a guaranteed filter on the tenant identifier.
- **FR-010**: Align data fields where arrays vs delimited strings are inconsistent; add soft-delete fields where missing; validate forward data entry accordingly.
 - **FR-010**: Align data fields where arrays vs delimited strings are inconsistent; add soft-delete fields where missing; validate forward data entry accordingly.
   - Clarification: Candidate fields for normalization include, but are not limited to: `Product.images` (string[] vs CSV), `Product.tags` (string[] vs CSV), `Variant.attributes` (JSON vs CSV), and any CSV-encoded historical fields. The schema audit (T038) MUST produce an explicit per-field inventory artifact listing current type, recommended normalized type, migration approach, and backward-compatibility notes.
- **FR-011**: Establish cache tag categories for key entities (e.g., products, categories, pages) and provide invalidation on create/update/delete actions.
- **FR-012**: Produce a plan to adopt component-level caching in phases, initially disabled, with documented enablement steps and guardrails.
- **FR-013**: Achieve and enforce test coverage thresholds (services ≥80%, utilities 100%) with tests for fraud scenarios, tenancy isolation, newsletter flows, and error mapping.
- **FR-014**: Apply an API middleware pipeline covering authentication, rate limiting, request validation, and structured logging that includes a request correlation ID.
- **FR-015**: Ensure REST semantics: PUT requires full resource payload; PATCH allows partial updates; no stray `success` flags; use standardized error payloads.
- **FR-016**: Stream CSV exports for up to 10,000 rows within memory limits; for larger datasets, enqueue a background job and provide a downloadable link upon completion via both email and in-app notification.
- **FR-017**: Redirect unauthenticated dashboard access to sign-in; remove any fallback tenant defaults; utilize progressive rendering patterns for lists.
- **FR-018**: Make analytics and chart visualizations accessible with textual summaries or `<figure>`/`<figcaption>` structures; pass accessibility audits.
- **FR-019**: Present a consent banner that stores per-store consent and honors the user’s Do Not Track preference by disabling non-essential tracking.
- **FR-020**: Render per-store dynamic metadata (title, description, social previews) and optionally structured data for product and shop pages.
- **FR-021**: Include a unique request/correlation ID in all API responses and propagate it through logs for traceability.

### Key Entities *(include if feature involves data)*

- **Store**: Tenant context resolved from domain/subdomain; attributes include id, name, domains, created/updated/deleted timestamps.
- **Order**: Purchase record containing buyer, store, totals (recalculated), items, status, timestamps.
- **OrderItem**: Line items referencing product, quantity, unit price, discounts at time of order.
- **PaymentRecord**: Validation/capture outcome linked to an order with status and reference identifiers.
- **ConsentRecord**: User consent artifacts (type, timestamp, scope, user agent/DNT flag) associated with a store.
- **NewsletterSubscriber**: Email subscription per store with deduplication and status (pending/active) depending on opt-in model.
- **AuditLog**: Immutable record of significant actions (checkout created, subscription added) with correlation/request IDs.
- **CacheTag**: Semantic identifiers used to manage cache invalidation across related views.
- **RequestContext**: Correlation/request ID and store resolution used for logging and response headers.
 - **RequestContext**: Correlation/request ID and store resolution used for logging and response headers. Implementation note: standardize the canonical store resolver filename to `src/lib/store/resolve-store.ts` across plan/tasks to avoid naming drift.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Critical issues remediated; manual security review reports 0 high-severity findings for checkout and tenancy.
- **SC-002**: Tenant isolation verified: repository search shows zero hardcoded tenant identifiers in application code; isolation tests pass.
- **SC-003**: Checkout E2E validates server-side price correction and succeeds across major browsers; invalid payment/stock paths abort with no partial writes.
- **SC-004**: Newsletter E2E: successful subscription with consent and audit record; duplicate submissions are idempotent and rate-limited.
- **SC-005**: Middleware instrumentation confirms tenant scoping applied for all tenant models in representative operations.
- **SC-006**: Schema migrations apply cleanly in development and production parity environments with verification of data integrity.
- **SC-007**: API responses audited show 100% conformity to standardized shapes; each response includes a unique request/correlation ID header.
- **SC-008**: Cache invalidation test demonstrates timely updates on product/category/page changes.
- **SC-009**: Code coverage thresholds met: ≥80% services, 100% utilities; new tests cover fraud, tenancy, newsletter, and error mapping.
- **SC-010**: Performance and accessibility budgets pass automated checks (e.g., LCP < 2.5s mobile, CLS < 0.1, zero blocking accessibility violations for targeted pages).
- **SC-011**: CSV export streams complete within memory limits for ≤10k rows; >10k path enqueues background processing and delivers a downloadable link.
- **SC-012**: Dashboard unauthenticated access redirects to sign-in; no fallback tenant default exists.
- **SC-013**: Per-store metadata present and validated in snapshots (title, description, social previews); optional structured data validated when present.
- **SC-014**: Charts/analytics views include accessible structures and pass automated accessibility scans.

---

## Assumptions

- Performance targets reflect standard modern web expectations and may be tuned during testing without changing user-facing behavior.
- Unknown domains should not resolve to a default tenant; they should return a not-found experience to prevent data leakage and SEO confusion.
- Newsletter rate limiting at a baseline of 100 requests per minute per IP is sufficient to deter abuse for this phase.
- Payment validation occurs prior to order creation and can be stubbed for testing; precise processor details are an implementation concern.
- Background export jobs will use an existing job processing mechanism; download links will be delivered via both email and in-app notification.

---

<!-- Clarifications resolved: single opt-in with audit trail; canonical redirect subdomain → custom domain; CSV link via both email and in-app notification. -->

