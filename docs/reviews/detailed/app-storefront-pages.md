# Deep Dive: Storefront Pages

## src/app/shop/page.tsx
**Type**: Server Component  
**Lines**: 216  
**Purpose**: Storefront homepage with featured products and categories

### Implementation Analysis

#### Next.js 16 Compliance
- ✅ **Server Component**: No `'use client'` directive
- ✅ **Async Data Fetching**: Uses await with service calls
- ✅ **Metadata Export**: Title and description for SEO

#### Multi-Tenancy Pattern
```typescript
const storeId = 'fa30516f-dd0d-4b24-befe-e4c7606b841e'; // Hardcoded demo store
```

⚠️ **CRITICAL ISSUE**: Hardcoded storeId instead of dynamic resolution

**Expected Pattern**:
```typescript
// Should extract from subdomain/domain
const host = headers().get('host');
const subdomain = host?.split('.')[0];
const store = await getStoreBySubdomain(subdomain);
const storeId = store.id;
```

#### Data Fetching
```typescript
const [featuredProducts, categories] = await Promise.all([
  getFeaturedProducts(storeId, 8),
  getCategoryTree(storeId),
]);
```

✅ **Good**: Parallel data fetching with Promise.all

### Page Sections Implemented

#### 1. Hero Section
```tsx
<section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
  <Container size="4">
    <Heading size="9" className="mb-4">Welcome to StormCom</Heading>
    <Text size="5" className="mb-8">Discover amazing products at unbeatable prices</Text>
    <Flex gap="4">
      <Button size="3" variant="solid">
        <Link href="/shop/products">Shop Now</Link>
      </Button>
      <Button size="3" variant="outline">
        <Link href="/shop/categories">Browse Categories</Link>
      </Button>
    </Flex>
  </Container>
</section>
```

#### 2. Features Section
Three feature cards:
- **Free Shipping**: Orders over $50
- **Best Prices**: Price match guarantee
- **Secure Checkout**: SSL encrypted payments

Uses Radix UI icons (RocketIcon, BadgeIcon, LockClosedIcon)

#### 3. Featured Products Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {featuredProducts.map((product) => (
    <ProductCard
      key={product.id}
      id={product.id}
      name={product.name}
      price={product.price}
      image={product.images?.[0] || '/placeholder-product.png'}
      slug={product.slug}
    />
  ))}
</div>
```

✅ Responsive grid (1/2/4 columns)  
✅ Limit of 8 products  
⚠️ No loading state  
⚠️ No error handling if fetch fails  

#### 4. Categories Showcase
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {categories.slice(0, 8).map((category) => (
    <Link
      key={category.id}
      href={`/shop/categories/${category.slug}`}
      className="block p-6 bg-white rounded-lg border hover:shadow-lg transition-shadow"
    >
      <Heading size="4" className="mb-2">{category.name}</Heading>
      <Text size="2" color="gray">{category.description}</Text>
    </Link>
  ))}
</div>
```

✅ Links to category detail pages  
✅ Hover effects  
⚠️ No category images  
⚠️ Hardcoded limit of 8  

#### 5. Newsletter Signup Banner
```tsx
<section className="bg-blue-50 py-16">
  <Container size="3">
    <div className="text-center">
      <Heading size="6" className="mb-4">Subscribe to Our Newsletter</Heading>
      <Text size="3" className="mb-6">Get the latest updates on new products and exclusive offers!</Text>
      <form className="flex gap-3 max-w-md mx-auto">
        <input
          type="email"
          placeholder="Enter your email"
          className="flex-1 px-4 py-2 rounded-lg border"
          required
        />
        <Button type="submit" size="3">Subscribe</Button>
      </form>
    </div>
  </Container>
</section>
```

⚠️ **ISSUE**: Form has no action/handler (non-functional)  
⚠️ Should use Server Action or API route  

#### 6. Trust Metrics Section
```tsx
<section className="py-12 border-t">
  <Container size="4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      <div>
        <Heading size="6" className="text-blue-600 mb-2">10,000+</Heading>
        <Text size="3" color="gray">Products</Text>
      </div>
      {/* Similar blocks for 50K+ Customers, 99.9% Uptime, 24/7 Support */}
    </div>
  </Container>
</section>
```

⚠️ Hardcoded metrics (should be dynamic from store settings)

### Components Used
- `ProductCard` (from '@/components/storefront/product-card')
- Radix UI: Container, Heading, Text, Button, Flex, Section
- Next.js: Link
- Radix Icons: RocketIcon, BadgeIcon, LockClosedIcon

### Styling Approach
- Tailwind utility classes for layout
- Radix UI components for typography/buttons
- Inline styles via className
- Responsive breakpoints (md, lg)

### Performance Analysis

#### Strengths
✅ Server-side rendering (fast initial load)  
✅ Parallel data fetching  
✅ Limited product count (8)  
✅ No client-side JavaScript (except ProductCard if interactive)  

#### Weaknesses
⚠️ No Suspense boundaries (loading.tsx shows spinner for entire page)  
⚠️ No image optimization strategy mentioned  
⚠️ No caching strategy (should use `unstable_cache` for storefront)  
⚠️ Fetches categories even if empty  

#### Recommended Improvements
```typescript
// Add caching
import { unstable_cache } from 'next/cache';

const getCachedFeaturedProducts = unstable_cache(
  async (storeId: string) => getFeaturedProducts(storeId, 8),
  ['featured-products'],
  { revalidate: 3600, tags: ['products', 'featured'] }
);

const getCachedCategories = unstable_cache(
  async (storeId: string) => getCategoryTree(storeId),
  ['category-tree'],
  { revalidate: 3600, tags: ['categories'] }
);
```

### SEO Implementation
```typescript
export const metadata = {
  title: 'Shop | StormCom',
  description: 'Discover amazing products at unbeatable prices. Shop our featured products and browse categories.',
};
```

✅ Basic metadata  
⚠️ Should be dynamic based on store settings  
⚠️ Missing Open Graph tags  
⚠️ Missing structured data (JSON-LD)  

#### Recommended SEO Enhancements
```typescript
export async function generateMetadata(): Promise<Metadata> {
  const store = await getStore(storeId);
  
  return {
    title: `${store.name} | ${store.tagline}`,
    description: store.description,
    openGraph: {
      title: store.name,
      description: store.description,
      images: [store.logo],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: store.name,
      description: store.description,
    },
  };
}
```

### Accessibility Analysis

#### Strengths
✅ Semantic HTML (section, nav, heading hierarchy)  
✅ Radix UI accessible components  
✅ Links have descriptive text  
✅ Form has required attribute  

#### Weaknesses
⚠️ Newsletter form missing labels  
⚠️ Hero buttons missing aria-labels  
⚠️ No skip link to main content  
⚠️ Product grid missing aria-label  
⚠️ Category links missing aria-describedby  

#### Accessibility Fixes Needed
```tsx
<form aria-labelledby="newsletter-heading" onSubmit={handleSubmit}>
  <label htmlFor="newsletter-email" className="sr-only">Email address</label>
  <input
    id="newsletter-email"
    type="email"
    placeholder="Enter your email"
    required
    aria-required="true"
  />
  <button type="submit">Subscribe</button>
</form>
```

### Security Considerations

#### Current Issues
⚠️ Newsletter form has no CSRF protection  
⚠️ No rate limiting on newsletter signup  
⚠️ Email input not sanitized  

#### Recommended Fixes
1. Use Server Action with CSRF token
2. Add rate limiting (max 5 signups per IP per hour)
3. Validate and sanitize email server-side
4. Add honeypot field for bot detection

### Testing Requirements

#### Unit Tests Needed
1. Renders hero section correctly
2. Displays featured products (mocked data)
3. Displays categories (mocked data)
4. Handles empty products array
5. Handles empty categories array

#### Integration Tests Needed
1. Fetches data from services correctly
2. Renders ProductCard with correct props
3. Links navigate to correct URLs

#### E2E Tests Needed
1. Complete page load and render
2. Newsletter signup flow (when implemented)
3. Navigation to product detail
4. Navigation to category page
5. Performance metrics (LCP < 2.5s)

### Multi-Tenancy Fix (CRITICAL)

Current implementation bypasses multi-tenancy. Required fix:

```typescript
// app/shop/page.tsx
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getStoreByDomain } from '@/services/store-service';

export default async function ShopPage() {
  // Extract domain/subdomain from request
  const headersList = await headers();
  const host = headersList.get('host') || '';
  
  // Resolve store from domain
  const store = await getStoreByDomain(host);
  
  if (!store) {
    notFound(); // Return 404 if store not found
  }
  
  // Use resolved storeId
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(store.id, 8),
    getCategoryTree(store.id),
  ]);
  
  // ... rest of component
}
```

Also need proxy.ts to handle subdomain routing:

```typescript
// proxy.ts
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/shop')) {
    // Store resolution happens in page component
    return NextResponse.next();
  }
  
  // ... other proxy logic
}
```

### Code Quality Metrics
- **Lines**: 216 (72% of 300 limit ✅)
- **Functions**: 1 (page component)
- **External Dependencies**: 5 (services, components, icons)
- **Complexity**: Medium (multiple data fetches, multiple sections)

### Recommendations Summary

#### CRITICAL (Fix Immediately)
1. ⚠️ **Remove hardcoded storeId**: Implement domain-based store resolution
2. ⚠️ **Implement newsletter handler**: Add Server Action or API route
3. ⚠️ **Add error boundaries**: Handle data fetch failures

#### HIGH Priority
1. Add Suspense boundaries for each section
2. Implement caching strategy (unstable_cache with 1hr revalidation)
3. Add comprehensive error handling
4. Implement dynamic metadata based on store
5. Add CSRF protection to newsletter form

#### MEDIUM Priority
1. Add structured data (JSON-LD) for SEO
2. Add Open Graph and Twitter Card metadata
3. Improve accessibility (labels, ARIA attributes)
4. Add loading skeletons for each section
5. Make trust metrics dynamic

#### LOW Priority
1. Add category images to showcase
2. Add pagination for featured products
3. Add "View All" links for sections
4. Add analytics tracking
5. Add A/B testing framework

### File Organization Recommendation

Due to multiple distinct sections, consider splitting:

```
app/shop/
├── page.tsx (orchestration, 50 lines)
├── components/
│   ├── HeroSection.tsx
│   ├── FeaturesSection.tsx
│   ├── FeaturedProductsSection.tsx
│   ├── CategoriesShowcase.tsx
│   ├── NewsletterBanner.tsx (with Server Action)
│   └── TrustMetrics.tsx
└── actions.ts (newsletter signup Server Action)
```

---

## Summary Statistics
- Total files reviewed: 1
- Lines: 216 (72% of limit)
- Server Components: 1
- Critical issues: 2 (hardcoded storeId, non-functional form)
- High priority issues: 5
- Medium priority issues: 5

## Critical Findings
1. ❌ **CRITICAL**: Hardcoded storeId bypasses multi-tenancy
2. ❌ **CRITICAL**: Newsletter form is non-functional
3. ⚠️ **Missing**: Error handling for data fetches
4. ⚠️ **Missing**: Caching strategy for public content
5. ⚠️ **Missing**: Comprehensive accessibility attributes
6. ⚠️ **Missing**: CSRF protection and rate limiting

## Architecture Impact
This page reveals a fundamental gap in the multi-tenancy implementation:
- **Dashboard pages**: Correctly use session-based storeId (getCurrentUser)
- **Storefront pages**: Should use domain-based storeId resolution
- **Current gap**: No domain → store resolution implementation

This affects all storefront pages (/shop/*) and needs project-wide fix.
