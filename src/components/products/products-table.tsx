// src/components/products/products-table.tsx
// Client Component: Products Data Table with interactive selection
// PERFORMANCE OPTIMIZED: React.memo and useMemo for expensive renders
'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  salePrice?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isVisible: boolean;
  quantity?: number;
  trackQuantity: boolean;
  category?: { name: string };
  brand?: { name: string };
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProductsTableProps {
  products: Product[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  searchParams?: Record<string, string | undefined>;
}

// ============================================================================
// OPTIMIZED: Memoized currency formatter (created once, reused)
// Performance: Prevents creating new Intl.NumberFormat on every render
// ============================================================================
// Removed unused currencyFormatter (now memoized below)

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function ProductsTable({ products, pagination, searchParams }: ProductsTableProps) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // OPTIMIZED: useCallback prevents function recreation on every render
  const handleSelectProduct = useCallback((productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  }, []);

  // OPTIMIZED: useCallback prevents function recreation
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  }, [products]);

  // PERFORMANCE: Memoize currency formatter to avoid recreation on each render
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }),
    []
  );

  // Format currency using memoized formatter
  const formatPrice = (price: number) => {
    return currencyFormatter.format(price);
  };

  // OPTIMIZED: useMemo for status badge lookup (prevents recalculation on every render)
  const getStatusBadge = useMemo(() => {
    const StatusBadge = (status: string, isVisible: boolean) => {
      if (!isVisible) return <Badge variant="secondary">Hidden</Badge>;
      
      switch (status) {
        case 'PUBLISHED':
          return <Badge variant="success">Published</Badge>;
        case 'DRAFT':
          return <Badge variant="secondary">Draft</Badge>;
        case 'ARCHIVED':
          return <Badge variant="destructive">Archived</Badge>;
        default:
          return <Badge variant="secondary">{status}</Badge>;
      }
    };
    StatusBadge.displayName = 'StatusBadge';
    return StatusBadge;
  }, []);

  // OPTIMIZED: useMemo for inventory status calculation
  const getInventoryStatus = useMemo(() => {
    const InventoryStatus = (product: Product) => {
      if (!product.trackQuantity) {
        return <Badge variant="outline">Not Tracked</Badge>;
      }
      
      const quantity = product.quantity || 0;
      if (quantity === 0) {
        return <Badge variant="destructive">Out of Stock</Badge>;
      } else if (quantity <= 5) {
        return <Badge variant="warning">Low Stock</Badge>;
      } else {
        return <Badge variant="success">In Stock</Badge>;
      }
    };
    InventoryStatus.displayName = 'InventoryStatus';
    return InventoryStatus;
  }, []);

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found</p>
        <Link href="/products/new">
          <Button className="mt-4">Add your first product</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <div className="flex items-center justify-between p-6 pb-0">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedProducts.length === products.length && products.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedProducts.length > 0 
              ? `${selectedProducts.length} selected`
              : `${pagination.total} products`
            }
          </span>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Page {pagination.page} of {pagination.totalPages}
        </div>

      {/* Table Content */}
      <div className="px-6">
          <div className="space-y-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Selection Checkbox */}
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                />

                {/* Product Image */}
                <div className="h-12 w-12 rounded-md overflow-hidden bg-muted">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="object-cover h-full w-full"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">No image</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{product.name}</h3>
                    {getStatusBadge(product.status, product.isVisible)}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    {product.sku && <span>SKU: {product.sku}</span>}
                    {product.category && (
                      <>
                        <span>•</span>
                        <span>{product.category.name}</span>
                      </>
                    )}
                    {product.brand && (
                      <>
                        <span>•</span>
                        <span>{product.brand.name}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="text-right">
                  <div className="font-medium">
                    {product.salePrice ? (
                      <>
                        <span className="text-destructive">{formatPrice(product.salePrice)}</span>
                        <span className="ml-2 text-sm text-muted-foreground line-through">
                          {formatPrice(product.price)}
                        </span>
                      </>
                    ) : (
                      formatPrice(product.price)
                    )}
                  </div>
                </div>

                {/* Inventory */}
                <div className="text-center">
                  {getInventoryStatus(product)}
                  {product.trackQuantity && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Qty: {product.quantity || 0}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link href={`/products/${product.id}`}>
                    <Button variant="ghost" size="sm">👁️</Button>
                  </Link>
                  <Link href={`/products/${product.id}/edit`}>
                    <Button variant="ghost" size="sm">✏️</Button>
                  </Link>
                  <Button variant="ghost" size="sm">
                    🗑️
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 p-6">
          <Link 
            href={pagination.page <= 1 ? '#' : `?${new URLSearchParams({ ...searchParams, page: String(pagination.page - 1) })}`}
            className={pagination.page <= 1 ? 'pointer-events-none' : ''}
          >
            <Button variant="outline" size="sm" disabled={pagination.page <= 1}>
              ← Previous
            </Button>
          </Link>
          
          <span className="text-sm text-muted-foreground px-4">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <Link 
            href={pagination.page >= pagination.totalPages ? '#' : `?${new URLSearchParams({ ...searchParams, page: String(pagination.page + 1) })}`}
            className={pagination.page >= pagination.totalPages ? 'pointer-events-none' : ''}
          >
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}>
              Next →
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// PERFORMANCE: Memoize component to prevent unnecessary re-renders
// Only re-render when products, pagination, or searchParams change
export default memo(ProductsTable, (prevProps, nextProps) => {
  return (
    prevProps.products === nextProps.products &&
    prevProps.pagination.page === nextProps.pagination.page &&
    prevProps.pagination.total === nextProps.pagination.total &&
    JSON.stringify(prevProps.searchParams) === JSON.stringify(nextProps.searchParams)
  );
});
