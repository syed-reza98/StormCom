/**
 * Search Results Page
 * 
 * Server Component displaying product search results with filters
 * and query highlighting.
 */

import type { Metadata } from 'next';
import { getPublishedProducts } from '@/services/storefront-service';
import { ProductCard } from '@/components/storefront/product-card';
import { ProductFilters } from '@/components/storefront/product-filters';
import { ProductSort } from '@/components/storefront/product-sort';
import { Pagination } from '@/components/ui/pagination';
import { Search } from 'lucide-react';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    perPage?: string;
    categoryId?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q || '';

  return {
    title: query ? `Search Results for "${query}" | StormCom` : 'Search Products | StormCom',
    description: query
      ? `Find products matching "${query}"`
      : 'Search our product catalog',
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;

  // Parse search params
  const query = resolvedSearchParams.q || '';
  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const perPage = parseInt(resolvedSearchParams.perPage || '12', 10);
  const categoryId = resolvedSearchParams.categoryId;
  const sortBy = resolvedSearchParams.sortBy as
    | 'name'
    | 'price'
    | 'createdAt'
    | 'popular'
    | undefined;
  const sortOrder = resolvedSearchParams.sortOrder as 'asc' | 'desc' | undefined;
  const minPrice = resolvedSearchParams.minPrice
    ? parseFloat(resolvedSearchParams.minPrice)
    : undefined;
  const maxPrice = resolvedSearchParams.maxPrice
    ? parseFloat(resolvedSearchParams.maxPrice)
    : undefined;
  const inStock = resolvedSearchParams.inStock === 'true';

  // Fetch search results
  const result = await getPublishedProducts('store-placeholder', {
    search: query,
    categoryId,
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
      {/* Search Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-4xl font-bold">
              {query ? (
                <>
                  Search Results for{' '}
                  <span className="text-primary">&ldquo;{query}&rdquo;</span>
                </>
              ) : (
                'All Products'
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {result.total === 0
                ? 'No products found'
                : `${result.total} ${result.total === 1 ? 'product' : 'products'} found`}
            </p>
          </div>
        </div>

        {/* Search Tips (shown when no results) */}
        {query && result.total === 0 && (
          <div className="bg-muted p-6 rounded-lg">
            <h2 className="font-semibold mb-2">Search Tips:</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Check your spelling</li>
              <li>Try more general keywords</li>
              <li>Try different keywords</li>
              <li>Remove filters to see more results</li>
            </ul>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <ProductFilters
            categories={[]}
            currentFilters={{
              categoryId,
              minPrice,
              maxPrice,
              inStock,
            }}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {result.products.length > 0 && (
            <>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {result.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={result.page}
                totalPages={result.totalPages}
                baseUrl="/search"
                searchParams={{
                  q: query,
                  categoryId,
                  sortBy,
                  sortOrder,
                  minPrice: minPrice?.toString(),
                  maxPrice: maxPrice?.toString(),
                  inStock: inStock ? 'true' : undefined,
                  perPage: perPage.toString(),
                }}
              />
            </>
          )}

          {/* Empty State */}
          {result.products.length === 0 && query && (
            <div className="text-center py-12">
              <div className="mb-6">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">
                  We couldn&apos;t find any products matching your search.
                </p>
              </div>
              <a
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Browse All Products
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
