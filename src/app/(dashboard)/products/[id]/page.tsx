// src/app/(dashboard)/products/[id]/page.tsx
// Product Details Dashboard Page - Comprehensive product information view

import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductImages } from '@/components/products/product-images';
import { ProductVariants } from '@/components/products/product-variants';
import { ProductInventory } from '@/components/products/product-inventory';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ProductDetailsPageProps {
  params: { id: string };
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  costPrice?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isVisible: boolean;
  isFeatured: boolean;
  trackQuantity: boolean;
  quantity?: number;
  lowStockThreshold: number;
  weight?: number;
  dimensions?: any;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  category?: { id: string; name: string };
  brand?: { id: string; name: string };
  images: string[];
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  createdAt: string;
  updatedAt: string;
}

interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  attributes: Record<string, string>;
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
  const product = await getProduct(params.id);
  
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

async function getProduct(id: string): Promise<Product | null> {
  try {
    // In a real app, this would use the authenticated API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/products/${id}`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products">
            <Button variant="outline">← Back to Products</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={product.status === 'PUBLISHED' ? 'success' : 'secondary'}>
                {product.status}
              </Badge>
              {!product.isVisible && <Badge variant="secondary">Hidden</Badge>}
              {product.isFeatured && <Badge variant="outline">Featured</Badge>}
              {product.sku && (
                <span className="text-sm text-muted-foreground">SKU: {product.sku}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/products/${product.id}/edit`}>
            <Button variant="outline">✏️ Edit Product</Button>
          </Link>
          <Link href={`/store/products/${product.id}`} target="_blank">
            <Button>👁️ View in Store</Button>
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

                {product.salePrice && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Sale Price</label>
                    <p className="mt-1 font-medium text-lg text-destructive">
                      ${product.salePrice.toFixed(2)}
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

            {product.tags.length > 0 && (
              <div className="mt-6">
                <label className="text-sm font-medium text-muted-foreground">Tags</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
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
                <Badge variant={product.status === 'PUBLISHED' ? 'success' : 'secondary'}>
                  {product.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Visibility:</span>
                <Badge variant={product.isVisible ? 'success' : 'secondary'}>
                  {product.isVisible ? 'Visible' : 'Hidden'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Featured:</span>
                <Badge variant={product.isFeatured ? 'success' : 'outline'}>
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