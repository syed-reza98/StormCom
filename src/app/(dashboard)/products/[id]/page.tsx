// src/app/(dashboard)/products/[id]/page.tsx
// Product Details Dashboard Page - Comprehensive product information view

import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import Link from 'next/link';
import { Card, Badge, Button } from '@radix-ui/themes';
import { ProductImages } from '@/components/products/product-images';
import { ProductVariants } from '@/components/products/product-variants';
import { ProductInventory } from '@/components/products/product-inventory';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ProductDetailsPageProps {
  params: Promise<{ id: string }>; // Next.js 16: params is now a Promise
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  barcode?: string;
  description?: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  inventoryStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'DISCONTINUED';
  isPublished: boolean;
  isFeatured: boolean;
  trackInventory: boolean;
  inventoryQty?: number;
  lowStockThreshold: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  thumbnailUrl?: string;
  category?: { id: string; name: string; slug: string };
  brand?: { id: string; name: string; slug: string };
  images: string[];
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  inventoryQty: number;
  options: Record<string, string>;
}

interface ProductAttribute {
  id: string;
  attribute: { name: string };
  value: string;
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({ params }: ProductDetailsPageProps): Promise<Metadata> {
  // Next.js 16: Await params to access route parameters
  const { id } = await params;
  const product = await getProduct(id);
  
  if (!product) {
    return {
      title: 'Product Not Found | Dashboard',
    };
  }

  return {
    title: `${product.name} | Dashboard`,
    description: product.shortDescription || product.description || 'Product details',
  };
}

// ============================================================================
// DATA FETCHING
// ============================================================================

/**
 * Fetch product data directly from database (Server Component best practice)
 * 
 * CRITICAL: In Next.js 16, Server Components should fetch data directly from
 * the database using ORM (Prisma) instead of calling internal API routes.
 * 
 * Benefits:
 * - No HTTP round-trip overhead
 * - No need for NEXT_PUBLIC_APP_URL environment variable
 * - Type-safe database queries with Prisma
 * - Better performance (direct database access)
 * - Follows Next.js App Router best practices
 * 
 * @see https://nextjs.org/docs/app/getting-started/fetching-data#with-an-orm-or-database
 */
async function getProduct(id: string): Promise<Product | null> {
  // Make this route dynamic - fetches authenticated data at request time
  await connection();
  
  try {
    const { db } = await import('@/lib/db');
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth');
    
    // Get session to check storeId for multi-tenant filtering
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.storeId) {
      console.error('No storeId in session - tenant isolation failed');
      return null;
    }

    // Query product directly from database with Prisma
    const product = await db.product.findUnique({
      where: { 
        id,
        storeId: session.user.storeId, // Multi-tenant filtering
        deletedAt: null, // Soft delete filter
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        barcode: true,
        description: true,
        shortDescription: true,
        price: true,
        compareAtPrice: true,
        costPrice: true,
        inventoryStatus: true,
        isPublished: true,
        isFeatured: true,
        trackInventory: true,
        inventoryQty: true,
        lowStockThreshold: true,
        weight: true,
        length: true,
        width: true,
        height: true,
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
        thumbnailUrl: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        category: {
          select: { id: true, name: true, slug: true }
        },
        brand: {
          select: { id: true, name: true, slug: true }
        },
        images: true,
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            inventoryQty: true,
            options: true,
          }
        },
        attributes: {
          select: {
            id: true,
            attribute: {
              select: { name: true }
            },
            value: true,
          }
        },
      },
    });

    if (!product) {
      return null;
    }

    // Transform Prisma result to match Product interface
    return {
      ...product,
      images: JSON.parse(product.images as string) as string[],
      metaKeywords: product.metaKeywords ? (JSON.parse(product.metaKeywords as string) as string[]) : undefined,
      variants: product.variants.map(v => ({
        ...v,
        options: JSON.parse(v.options as string) as Record<string, string>,
      })),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      publishedAt: product.publishedAt?.toISOString(),
    } as Product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  // Next.js 16: Await params to access route parameters
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="outline">← Back to Products</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge color={product.isPublished ? 'green' : 'gray'}>
                {product.isPublished ? 'PUBLISHED' : 'DRAFT'}
              </Badge>
              {!product.isPublished && <Badge color="gray">Hidden</Badge>}
              {product.isFeatured && <Badge color="amber">Featured</Badge>}
              {product.sku && (
                <span className="text-sm text-muted-foreground">SKU: {product.sku}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href={`/products/${product.id}/edit`}>
            <Button variant="outline">Edit Product</Button>
          </Link>
          <Link href={`/store/products/${product.id}`} target="_blank">
            <Button>View in Store</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Images */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Product Images</h2>
            <Suspense fallback={<div>Loading images...</div>}>
              <ProductImages images={product.images} productName={product.name} />
            </Suspense>
          </Card>

          {/* Product Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Product Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="mt-1 font-medium">{product.name}</p>
                </div>
                
                {product.sku && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">SKU</label>
                    <p className="mt-1">{product.sku}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <p className="mt-1">{product.category?.name || 'Uncategorized'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Brand</label>
                  <p className="mt-1">{product.brand?.name || 'No brand'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Regular Price</label>
                  <p className="mt-1 font-medium text-lg">
                    ${product.price.toFixed(2)}
                  </p>
                </div>

                {product.compareAtPrice && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Compare At Price</label>
                    <p className="mt-1 font-medium text-lg text-destructive line-through">
                      ${product.compareAtPrice.toFixed(2)}
                    </p>
                  </div>
                )}

                {product.costPrice && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cost Price</label>
                    <p className="mt-1">${product.costPrice.toFixed(2)}</p>
                  </div>
                )}

                {product.weight && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Weight</label>
                    <p className="mt-1">{product.weight} kg</p>
                  </div>
                )}
              </div>
            </div>

            {product.shortDescription && (
              <div className="mt-6">
                <label className="text-sm font-medium text-muted-foreground">Short Description</label>
                <p className="mt-1">{product.shortDescription}</p>
              </div>
            )}

            {product.description && (
              <div className="mt-6">
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <div className="mt-1 prose prose-sm max-w-none">
                  <p>{product.description}</p>
                </div>
              </div>
            )}

            {product.metaKeywords && Array.isArray(product.metaKeywords) && product.metaKeywords.length > 0 && (
              <div className="mt-6">
                <label className="text-sm font-medium text-muted-foreground">Keywords</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {product.metaKeywords.map((keyword: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Product Variants */}
          {product.variants.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Product Variants</h2>
              <Suspense fallback={<div>Loading variants...</div>}>
                <ProductVariants variants={product.variants} />
              </Suspense>
            </Card>
          )}

          {/* Product Attributes */}
          {product.attributes.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Attributes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.attributes.map((attr) => (
                  <div key={attr.id} className="flex justify-between">
                    <span className="font-medium">{attr.attribute.name}:</span>
                    <span>{attr.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Inventory Management */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Inventory</h2>
            <Suspense fallback={<div>Loading inventory...</div>}>
              <ProductInventory product={product} />
            </Suspense>
          </Card>

          {/* SEO Information */}
          {(product.metaTitle || product.metaDescription) && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">SEO</h2>
              <div className="space-y-4">
                {product.metaTitle && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Meta Title</label>
                    <p className="mt-1 text-sm">{product.metaTitle}</p>
                  </div>
                )}
                {product.metaDescription && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Meta Description</label>
                    <p className="mt-1 text-sm">{product.metaDescription}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Product Status */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge color={product.isPublished ? 'green' : 'gray'}>
                  {product.isPublished ? 'PUBLISHED' : 'DRAFT'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Visibility:</span>
                <Badge color={product.isPublished ? 'green' : 'gray'}>
                  {product.isPublished ? 'Visible' : 'Hidden'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Featured:</span>
                <Badge color={product.isFeatured ? 'green' : 'gray'}>
                  {product.isFeatured ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Created:</span>
                <span>{new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Updated:</span>
                <span>{new Date(product.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}