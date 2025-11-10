---
title: Prisma Schema Review
sourcePath: prisma/schema.prisma
category: database
riskLevel: medium
---

# Prisma Schema Review

Summary:
The schema defines a comprehensive multi-tenant e-commerce data model with strong emphasis on:
- Multi-tenancy via pervasive `storeId` foreign keys and composite indexes (e.g., products, orders, brands, categories, payments).
- Soft deletion pattern (`deletedAt` present on key entities: User, Store, Product, Category, Brand, Review, Discount, Page, etc.).
- Rich domain coverage: authentication (User, Session, MFA, PasswordHistory), catalog (Product, ProductVariant, Category, Brand, ProductAttribute), commerce (Order, OrderItem, Payment, InventoryLog, Discount, FlashSale), customer (Customer, Address, WishlistItem, Review), operations (AuditLog, SyncLog, ExternalPlatformConfig, Webhook), content (Page, Menu, MenuItem, Theme, EmailTemplate, Newsletter, Notification), compliance (GdprRequest, ConsentRecord).
- Extensive indexing strategy for performance and analytics queries (status + createdAt, composite uniqueness constraints per store, publication states, inventory statuses).

Strengths:
- Consistent primary keys using uuid() and timestamp fields (createdAt, updatedAt).
- Multi-tenant isolation patterns with unique constraints `[storeId, slug]`, `[storeId, sku]` ensuring per-store uniqueness.
- Analytics support through indexes combining status/publication fields with createdAt (e.g., Product `[storeId, isPublished, createdAt]`).
- Security features: password history, MFA backup codes, account lockout timestamps, verification/reset tokens with indexes.
- Separation of concerns for integrations (`ExternalPlatformConfig`, `SyncLog`) and GDPR compliance entities.

Potential Risks / Improvement Areas:
1. Soft Delete Consistency: Some entities lack `deletedAt` (e.g., Discount has it; verify all critical tables that require archival behavior—FlashSale lacks deletedAt? It uses isActive only.) Consider adding `deletedAt` to FlashSale, FlashSaleItem if logical deletion needed.
2. Data Volume & Index Bloat: Large number of indexes may increase write amplification; periodic review of unused indexes recommended.
3. InventoryLog userId tracking is optional without relation to User—could add relation field for richer audit linking if needed.
4. Unique store theme constraint `storeId @unique` implies exactly one Theme per store; if future theming requires drafts/versions, add a separate ThemeVersion table.
5. JSON stored in String fields (images, metaKeywords, variables, options) may benefit from native JSON in PostgreSQL production for indexing (migration consideration).
6. Customer linking: `userId String? @unique` ensures at most one Customer per User; confirm requirement for multi-store customers vs global user mapping.
7. Large text content (Page.content, EmailTemplate.htmlBody) should be monitored for size—potential move to external CMS or blob storage if growth significant.
8. Lack of cascade rules for some relations with optional foreign keys—validate deletion semantics (e.g., OrderItem variant/product SetNull vs preserving referential integrity).
9. Payment refunded states: consider separate Refund entity for audit if partial multiple refunds occur.
10. Missing explicit indexing for frequently filtered GDPR requests by `storeId` + `status`—currently `[status, createdAt]` exists; evaluate multi-tenant query patterns.

Multi-Tenancy Compliance:
- All major domain models include `storeId` except globally scoped entities (MFA backup codes, PasswordHistory) which are user-centric.
- Cross-store Super Admin features rely on nullable storeId in User and AuditLog.

Performance Considerations:
- Composite indexes targeting analytics queries (e.g., `[storeId, status, createdAt]`, `[storeId, isPublished, createdAt]`) appropriate for range scans.
- Ensure query layer selects only required fields; schema encourages selective access.

Recommendations:
- Conduct index usage analysis after production traffic to prune redundant indexes.
- Evaluate introducing partitioning (PostgreSQL) on high-growth tables (orders, order_items, audit_logs) if row counts exceed thresholds.
- Add `deletedAt` to any entity requiring historical retention semantics not currently covered.
- Prepare migrations for JSON columns (PostgreSQL) to leverage GIN indexes on searchable arrays (e.g., metaKeywords).
- Add explicit enum evolution strategy documentation (payment statuses, GDPR types) to avoid brittle app logic.

Risk Level: Medium (complexity and breadth demand ongoing governance).
