/**
 * ProductCard Component
 * 
 * Displays product information in a card format for storefront browsing.
 * Client Component for interactive features (quick view, add to cart).
 */

'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Eye, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import type { StorefrontProduct } from '@/services/storefront-service';

interface ProductCardProps {
  product: StorefrontProduct;
}

function ProductCardComponent({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Parse images JSON string (memoized to avoid re-parsing on every render)
  const images = useMemo(() => {
    return product.images ? JSON.parse(product.images) : [];
  }, [product.images]);
  
  const primaryImage = images[0];
  
  // Calculate discount (memoized to avoid recalculation on every render)
  const discountInfo = useMemo(() => {
    const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
    const discountPercent = hasDiscount
      ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
      : 0;
    return { hasDiscount, discountPercent };
  }, [product.compareAtPrice, product.price]);

  // Memoize event handler to prevent child re-renders
  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to product page
    
    setIsAdding(true);
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      price: product.price,
      quantity: 1,
      image: primaryImage,
      maxQuantity: product.inventoryQty,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsAdding(false);
    }, 2000);
  }, [product.id, product.name, product.slug, product.price, product.inventoryQty, primaryImage, addItem]);

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow" data-testid="product-card">
      <Link href={`/shop/products/${product.slug}`}>
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No Image
            </div>
          )}

          {/* Discount Badge */}
          {discountInfo.hasDiscount && (
            <Badge className="absolute top-2 right-2 bg-red-500 hover:bg-red-600">
              -{discountInfo.discountPercent}%
            </Badge>
          )}

          {/* Out of Stock Badge */}
          {!product.inStock && (
            <Badge variant="secondary" className="absolute top-2 left-2">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          {product.category && (
            <p className="text-xs text-muted-foreground mb-1">{product.category.name}</p>
          )}

          {/* Product Name */}
          <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Brand */}
          {product.brand && (
            <p className="text-sm text-muted-foreground mb-2">{product.brand.name}</p>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
            {discountInfo.hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.compareAtPrice?.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <p className="text-xs text-muted-foreground mb-3">
            {product.inStock ? (
              <span className="text-green-600">In Stock ({product.inventoryQty} available)</span>
            ) : (
              <span className="text-red-600">Out of Stock</span>
            )}
          </p>
        </div>
      </Link>

      {/* Action Buttons */}
      <div className="px-4 pb-4 flex gap-2">
        <Button
          className="flex-1"
          disabled={!product.inStock || isAdding}
          onClick={handleAddToCart}
          data-testid="add-to-cart-btn"
        >
          {showSuccess ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Added!
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </>
          )}
        </Button>
        <Button variant="outline" size="icon" data-testid="quick-view-btn">
          <Eye className="h-4 w-4" />
          <span className="sr-only">Quick View</span>
        </Button>
      </div>
    </Card>
  );
}

// Memoize component to prevent unnecessary re-renders
export const ProductCard = memo(ProductCardComponent);
