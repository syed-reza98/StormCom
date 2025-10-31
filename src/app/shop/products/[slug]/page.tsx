/**
 * Product Details Page
 * 
 * Server Component displaying full product information with image gallery,
 * variants, specifications, and add to cart functionality.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Section, Container, Flex, Text } from '@radix-ui/themes';
import { ChevronRightIcon, HomeIcon } from '@radix-ui/react-icons';
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
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb">
            <Flex align="center" gap="2">
              <a href="/">
                <Flex align="center" gap="1">
                  <HomeIcon width="16" height="16" />
                  <Text size="2" style={{ color: 'var(--gray-11)' }}>Home</Text>
                </Flex>
              </a>
              <ChevronRightIcon width="12" height="12" style={{ color: 'var(--gray-9)' }} />
              {product.category && (
                <>
                  <a href={`/categories/${product.category.slug}`}>
                    <Text size="2" style={{ color: 'var(--gray-11)' }}>
                      {product.category.name}
                    </Text>
                  </a>
                  <ChevronRightIcon width="12" height="12" style={{ color: 'var(--gray-9)' }} />
                </>
              )}
              <Text size="2" weight="medium" style={{ color: 'var(--gray-12)' }}>
                {product.name}
              </Text>
            </Flex>
          </nav>

          {/* Main Product Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Image Gallery */}
            <ProductImageGallery product={product} />

            {/* Right: Product Info & Add to Cart */}
            <ProductInfo product={product} />
          </div>

          {/* Product Details Tabs */}
          <ProductTabs product={product} />

          {/* Related Products */}
          <RelatedProducts productId={product.id} categoryId={product.category?.id} />
        </Flex>
      </Container>
    </Section>
  );
}
