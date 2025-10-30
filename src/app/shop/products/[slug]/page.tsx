/**
 * Product Details Page
 * 
 * Server Component displaying full product information with image gallery,
 * variants, specifications, and add to cart functionality.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlug } from '@/services/storefront-service';
import { ProductImageGallery } from '@/components/storefront/product-image-gallery';
import { ProductInfo } from '@/components/storefront/product-info';
import { ProductTabs } from '@/components/storefront/product-tabs';
import { RelatedProducts } from '@/components/storefront/related-products';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug, 'store-placeholder');

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const images = product.images ? JSON.parse(product.images) : [];
  const primaryImage = images[0];

  return {
    title: `${product.name} | StormCom`,
    description: product.shortDescription || product.description || `Buy ${product.name}`,
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description || undefined,
      images: primaryImage ? [{ url: primaryImage }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug, 'store-placeholder');

  if (!product) {
    notFound();
  }

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
          {product.category && (
            <>
              <li>
                <a
                  href={`/categories/${product.category.slug}`}
                  className="hover:text-foreground transition-colors"
                >
                  {product.category.name}
                </a>
              </li>
              <li>/</li>
            </>
          )}
          <li className="text-foreground font-medium">{product.name}</li>
        </ol>
      </nav>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Left: Image Gallery */}
        <ProductImageGallery product={product} />

        {/* Right: Product Info & Add to Cart */}
        <ProductInfo product={product} />
      </div>

      {/* Product Details Tabs */}
      <ProductTabs product={product} />

      {/* Related Products */}
      <RelatedProducts productId={product.id} categoryId={product.category?.id} />
    </div>
  );
}
