/**
 * RelatedProducts Component
 * 
 * Displays related products based on category.
 * Server Component with async data fetching.
 */

import { getRelatedProducts } from '@/services/storefront-service';
import { ProductCard } from './product-card';

interface RelatedProductsProps {
  productId: string;
  categoryId?: string;
}

export async function RelatedProducts({ productId, categoryId }: RelatedProductsProps) {
  if (!categoryId) {
    return null;
  }

  const relatedProducts = await getRelatedProducts(
    'store-placeholder',
    productId,
    4
  );

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Related Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
