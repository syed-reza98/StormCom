/**
 * Category Page
 * 
 * Server Component displaying products within a specific category
 * with breadcrumb navigation and category description.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getCategoryBySlug, getPublishedProducts } from '@/services/storefront-service';
import { ProductCard } from '@/components/storefront/product-card';
import { ProductFilters } from '@/components/storefront/product-filters';
import { ProductSort } from '@/components/storefront/product-sort';
import { Pagination } from '@/components/ui/pagination';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    sortBy?: string;
    sortOrder?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const category = await getCategoryBySlug(resolvedParams.slug, 'store-placeholder');

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.name} | StormCom`,
    description: category.description || `Browse ${category.name} products`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const category = await getCategoryBySlug(resolvedParams.slug, 'store-placeholder');

  if (!category) {
    notFound();
  }

  // Parse search params
  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const perPage = parseInt(resolvedSearchParams.perPage || '12', 10);
  const sortBy = resolvedSearchParams.sortBy as 'name' | 'price' | 'createdAt' | 'popular' | undefined;
  const sortOrder = resolvedSearchParams.sortOrder as 'asc' | 'desc' | undefined;
  const minPrice = resolvedSearchParams.minPrice ? parseFloat(resolvedSearchParams.minPrice) : undefined;
  const maxPrice = resolvedSearchParams.maxPrice ? parseFloat(resolvedSearchParams.maxPrice) : undefined;
  const inStock = resolvedSearchParams.inStock === 'true';

  // Fetch products in this category
  const result = await getPublishedProducts('store-placeholder', {
    categoryId: category.id,
    minPrice,
    maxPrice,
    inStock,
    sortBy,
    sortOrder,
    page,
    perPage,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <a href="/" className="hover:text-foreground transition-colors">
              Home
            </a>
          </li>
          <li>/</li>
          {category.breadcrumbs && category.breadcrumbs.length > 0 && (
            <>
              {category.breadcrumbs.map((crumb, index) => (
                <li key={`${crumb.slug}-${index}`}>
                  <a
                    href={`/categories/${crumb.slug}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.name}
                  </a>
                  {index < category.breadcrumbs!.length - 1 && <span className="ml-2">/</span>}
                </li>
              ))}
              <li>/</li>
            </>
          )}
          <li className="text-foreground font-medium">{category.name}</li>
        </ol>
      </nav>

      {/* Category Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground max-w-3xl">{category.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          {result.total} {result.total === 1 ? 'product' : 'products'}
        </p>
      </div>

      {/* Subcategories */}
      {category.children && category.children.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Shop by Subcategory</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {category.children.map((child) => (
              <a
                key={child.id}
                href={`/categories/${child.slug}`}
                className="p-4 border rounded-lg hover:border-primary transition-colors text-center"
              >
                <h3 className="font-medium">{child.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {child.productCount} products
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <ProductFilters
            categories={[]} // Already filtered by category
            currentFilters={{
              minPrice,
              maxPrice,
              inStock,
            }}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Sort Controls */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              Showing {result.products.length} of {result.total} products
            </p>
            <ProductSort
              currentSort={{
                sortBy: sortBy || 'createdAt',
                sortOrder: sortOrder || 'desc',
              }}
            />
          </div>

          {/* Product Grid */}
          {result.products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {result.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={result.page}
                totalPages={result.totalPages}
                baseUrl={`/categories/${resolvedParams.slug}`}
                searchParams={{
                  sortBy,
                  sortOrder,
                  minPrice: minPrice?.toString(),
                  maxPrice: maxPrice?.toString(),
                  inStock: inStock ? 'true' : undefined,
                  perPage: perPage.toString(),
                }}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No products found in this category.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
