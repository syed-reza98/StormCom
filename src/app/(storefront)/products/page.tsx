import { Metadata } from 'next';
import { getPublishedProducts, getCategoryTree } from '@/services/storefront-service';
import { ProductCard } from '@/components/storefront/product-card';
import { ProductFilters } from '@/components/storefront/product-filters';
import { ProductSort } from '@/components/storefront/product-sort';
import { Pagination } from '@/components/ui/pagination';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Product Listing Page
 * 
 * Customer-facing page for browsing all products with filtering and sorting.
 * Server Component with async data fetching.
 */

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    perPage?: string;
    search?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams;
  const search = params.search;
  
  return {
    title: search ? `Search: ${search} | Products` : 'Products | StormCom',
    description: 'Browse our complete product catalog',
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Await searchParams as per Next.js 16 requirements
  const params = await searchParams;

  // TODO: Get storeId from domain/subdomain routing
  // For now, using a placeholder
  const storeId = 'store_01'; // Replace with actual store resolution

  // Parse query parameters
  const page = parseInt(params.page || '1');
  const perPage = parseInt(params.perPage || '12');
  const search = params.search;
  const categoryId = params.category;
  const minPrice = params.minPrice ? parseFloat(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? parseFloat(params.maxPrice) : undefined;
  const inStock = params.inStock === 'true';
  const sortBy = (params.sortBy as 'name' | 'price' | 'createdAt' | 'popular') || 'createdAt';
  const sortOrder = (params.sortOrder as 'asc' | 'desc') || 'desc';

  // Fetch products and categories in parallel
  const [productData, categories] = await Promise.all([
    getPublishedProducts(storeId, {
      page,
      perPage,
      search,
      categoryId,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      sortOrder,
    }),
    getCategoryTree(storeId),
  ]);

  const { products, total, totalPages } = productData;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {search ? `Search Results for "${search}"` : 'All Products'}
        </h1>
        <p className="text-muted-foreground">
          {total} {total === 1 ? 'product' : 'products'} found
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <Card className="p-4 sticky top-4">
            <h2 className="font-semibold mb-4">Filters</h2>
            <ProductFilters
              categories={categories}
              currentFilters={{
                categoryId,
                minPrice,
                maxPrice,
                inStock,
              }}
            />
          </Card>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-3">
          {/* Sort Controls */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-muted-foreground">
              Showing {products.length > 0 ? (page - 1) * perPage + 1 : 0}-
              {Math.min(page * perPage, total)} of {total}
            </div>
            <ProductSort currentSort={{ sortBy, sortOrder }} />
          </div>

          {/* Product Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No products found.</p>
              {(search || categoryId || minPrice || maxPrice || inStock) && (
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your filters to see more results.
                </p>
              )}
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                baseUrl="/products"
                searchParams={params}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton for Product Listing Page
 */
export function ProductsPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <Card className="p-4">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </Card>
        </aside>

        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-64 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
