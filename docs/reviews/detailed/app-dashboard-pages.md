# Deep Dive: Dashboard Pages

## src/app/(dashboard)/products/page.tsx
**Type**: Server Component  
**Lines**: 120  
**Purpose**: Product management list page with filters and bulk actions

### Implementation Analysis

#### Next.js 16 Compliance
- ✅ **Async searchParams**: `const searchParams = await props.searchParams;`
- ✅ **Server Component**: No `'use client'` directive
- ✅ **Cache Components**: Comment indicates migration planned (`// Removed dynamic = 'force-dynamic'`)

#### Multi-Tenancy
- Uses `getCurrentUser()` helper to get authenticated user
- Extracts `storeId` from session
- Falls back to `process.env.DEFAULT_STORE_ID` if no session
- ⚠️ Fallback should redirect to login instead

#### Data Fetching
```typescript
const result = await productService.getProducts({
  storeId,
  page: parseInt(page) || 1,
  perPage: 10,
  search: search || undefined,
  categoryId: categoryId || undefined,
  brandId: brandId || undefined,
  isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : undefined,
  minPrice: minPrice ? parseFloat(minPrice) : undefined,
  maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
  inventoryStatus: inventoryStatus as 'in_stock' | 'low_stock' | 'out_of_stock' | undefined,
  sortBy: sortBy as 'name' | 'price' | 'stock' | 'createdAt' | undefined,
  sortOrder: sortOrder as 'asc' | 'desc' | undefined,
});
```

### Features Implemented
1. **Search & Filters**:
   - Text search
   - Category filter
   - Brand filter
   - Published status filter
   - Price range (min/max)
   - Inventory status filter
   - Sort by multiple fields
   - Sort order (asc/desc)

2. **Pagination**:
   - 10 items per page
   - Current page tracking
   - Total pages calculation
   - URL-based pagination state

3. **Bulk Actions**:
   - ProductsBulkActions component
   - Selected products tracking

4. **CRUD Operations**:
   - "Add Product" button links to /products/new
   - Import functionality via /products/import
   - Export functionality via /products/export

### Components Used
- `ProductsFilters` - Filter UI component
- `ProductsTable` - Data table with selection
- `ProductsBulkActions` - Bulk operation actions

### Performance Considerations
- ✅ Pagination limits data fetch to 10 items
- ✅ Server-side filtering reduces client bundle
- ⚠️ No Suspense boundaries for streaming
- ⚠️ No loading skeleton (relies on loading.tsx)
- ⚠️ Filter state in URL (good for bookmarking, but verbose)

### Security
- ✅ StoreId enforced from session
- ✅ Service layer handles validation
- ⚠️ Should validate page number range
- ⚠️ Should sanitize search input

### Accessibility
- ✅ Semantic page structure
- ✅ Clear headings
- ⚠️ Missing skip link to main content
- ⚠️ Filter form needs aria-labels

### Recommendations
1. **High Priority**:
   - Redirect to login if no user session (remove DEFAULT_STORE_ID fallback)
   - Add Suspense boundary for filters and table
   - Validate and sanitize search input
   - Add page number range validation

2. **Medium Priority**:
   - Add loading skeletons for better UX
   - Consider reducing perPage to 20-50 for better performance
   - Add aria-labels to filter inputs
   - Add metadata export with dynamic title

3. **Low Priority**:
   - Consider URL shortening for filter state
   - Add keyboard shortcuts (e.g., Cmd+K for search)
   - Add export to Excel in addition to CSV

---

## src/app/(dashboard)/orders/page.tsx
**Type**: Server Component  
**Lines**: 70  
**Purpose**: Order management list page with filters and export

### Implementation Analysis

#### Next.js 16 Compliance
- ✅ **Async searchParams**: `const searchParams = await props.searchParams;`
- ✅ **Server Component**: No `'use client'` directive
- ✅ **Metadata Export**: Title "Orders | Dashboard"

#### URL Parameters Handled
```typescript
const page = searchParams.page || '1';
const search = searchParams.search || '';
const status = searchParams.status || '';
const paymentStatus = searchParams.paymentStatus || '';
const fulfillmentStatus = searchParams.fulfillmentStatus || '';
const startDate = searchParams.startDate || '';
const endDate = searchParams.endDate || '';
const sortBy = searchParams.sortBy || 'createdAt';
const sortOrder = searchParams.sortOrder || 'desc';
```

#### Features Implemented
1. **Filters**:
   - Text search (order number, customer name)
   - Order status filter
   - Payment status filter
   - Fulfillment status filter
   - Date range (start/end)
   - Sort by field
   - Sort order

2. **Export Functionality**:
   - CSV export form
   - All filter parameters passed as hidden inputs
   - Preserves current filter state in export

3. **Components**:
   - `OrdersFilters` - Filter UI
   - `OrdersTable` - Data display with selection

### Architecture Pattern
- Similar pattern to products page
- Filter state in URL parameters
- No data fetching shown (delegated to components)

### Security
- ⚠️ No visible storeId filtering (should be in OrdersTable/service)
- ⚠️ Export endpoint should validate authentication
- ⚠️ Should validate date ranges

### Performance
- ⚠️ No pagination parameters visible
- ⚠️ No data fetching limits shown
- ⚠️ Export could timeout for large datasets

### Recommendations
1. **High Priority**:
   - Add explicit storeId filtering call
   - Add pagination parameters (page, perPage)
   - Add date range validation
   - Add export size limits (max 10,000 orders)

2. **Medium Priority**:
   - Add loading state for export operation
   - Add success/error messages for export
   - Add Suspense boundaries
   - Add metadata export

3. **Low Priority**:
   - Add Excel export option
   - Add scheduled export functionality
   - Add export history/downloads page

---

## Comparison: Products vs Orders Pages

### Similarities
- Both use async searchParams (Next.js 16)
- Both are Server Components
- Both use URL-based filter state
- Both have filter and table components
- Both have similar filter patterns

### Differences
| Feature | Products Page | Orders Page |
|---------|--------------|-------------|
| Data Fetching | Explicit productService call | Delegated to components |
| Pagination | Visible (10 per page) | Not visible |
| StoreId Handling | Explicit getCurrentUser() | Not visible |
| Bulk Actions | ProductsBulkActions | Not shown |
| Export | Link to separate page | Inline form |
| Metadata | Not exported | Exported ✅ |

### Pattern Inconsistencies
1. Products page shows data fetching, Orders page doesn't
2. Products has explicit pagination, Orders doesn't
3. Products has visible storeId handling, Orders doesn't
4. Export implementation differs (link vs form)

### Recommendations for Consistency
1. Standardize data fetching pattern (show in page or always delegate)
2. Standardize export pattern (prefer inline form for consistency)
3. Always show storeId handling in page component
4. Always export metadata
5. Create shared pagination component
6. Create shared filter state hook

---

## Summary Statistics
- Total files reviewed: 2
- Average lines per file: 95
- Server Components: 2/2 ✅
- Next.js 16 compliance: 2/2 ✅
- Metadata exports: 1/2 ⚠️

## Critical Issues Found
1. **Products page**: DEFAULT_STORE_ID fallback should redirect to login
2. **Orders page**: Missing explicit storeId handling
3. **Orders page**: No visible pagination parameters
4. **Both pages**: Missing Suspense boundaries
5. **Both pages**: No input sanitization visible

## Architecture Recommendations
1. Create shared page layout pattern for list pages
2. Extract common filter handling logic to hook
3. Standardize export functionality
4. Add loading skeletons component library
5. Create pagination component with consistent behavior
