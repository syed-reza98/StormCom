/**
 * ProductInfo Component
 * 
 * Product information with variant selection and add to cart functionality.
 * Client Component for interactive variant selection and cart actions.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCart } from '@/hooks/use-cart';
import type { StorefrontProduct } from '@/services/storefront-service';

interface ProductInfoProps {
  product: StorefrontProduct;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    product.variants.length > 0 ? product.variants[0].id : null
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  const currentVariant = selectedVariant
    ? product.variants.find((v) => v.id === selectedVariant)
    : null;

  const effectivePrice = currentVariant?.price || product.price;

  const handleQuantityChange = (change: number) => {
    setQuantity((prev) => Math.max(1, Math.min(product.inventoryQty, prev + change)));
  };

  const handleAddToCart = () => {
    setIsAdding(true);
    
    const images = product.images ? JSON.parse(product.images) : [];
    const primaryImage = images[0];
    
    addItem({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantId: selectedVariant || undefined,
      variantName: currentVariant?.name,
      price: effectivePrice,
      quantity,
      image: primaryImage,
      maxQuantity: product.inventoryQty,
    });

    // Show success message
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsAdding(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Product Name & Brand */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
        {product.brand && (
          <p className="text-muted-foreground">
            by <span className="font-medium">{product.brand.name}</span>
          </p>
        )}
      </div>

      {/* Price */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold">${effectivePrice.toFixed(2)}</span>
          {hasDiscount && (
            <>
              <span className="text-xl text-muted-foreground line-through">
                ${product.compareAtPrice!.toFixed(2)}
              </span>
              <Badge className="bg-red-500 hover:bg-red-600">Save {discountPercent}%</Badge>
            </>
          )}
        </div>
      </Card>

      {/* Short Description */}
      {product.shortDescription && (
        <p className="text-muted-foreground">{product.shortDescription}</p>
      )}

      {/* Stock Status */}
      <div>
        {product.inStock ? (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-green-500 text-green-700">
              In Stock
            </Badge>
            <span className="text-sm text-muted-foreground">
              {product.inventoryQty} available
            </span>
          </div>
        ) : (
          <Badge variant="destructive">Out of Stock</Badge>
        )}
      </div>

      {/* Variant Selector */}
      {product.variants.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="variant-select">Select Variant</Label>
          <Select value={selectedVariant || undefined} onValueChange={setSelectedVariant}>
            <SelectTrigger id="variant-select">
              <SelectValue placeholder="Choose a variant" />
            </SelectTrigger>
            <SelectContent>
              {product.variants.map((variant) => (
                <SelectItem key={variant.id} value={variant.id}>
                  {variant.name} - ${(variant.price || product.price).toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            -
          </Button>
          <input
            id="quantity"
            type="number"
            min="1"
            max={product.inventoryQty}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 text-center border rounded px-3 py-2"
            aria-label="Quantity"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= product.inventoryQty}
            aria-label="Increase quantity"
          >
            +
          </Button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full"
          disabled={!product.inStock || isAdding}
          onClick={handleAddToCart}
        >
          {showSuccess ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Added to Cart!
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </>
          )}
        </Button>

        {/* Secondary Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push('/cart')}
          >
            View Cart
          </Button>
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share product</span>
          </Button>
        </div>
      </div>

      {/* Category Link */}
      {product.category && (
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Category:{' '}
            <a
              href={`/shop/categories/${product.category.slug}`}
              className="text-foreground hover:underline font-medium"
            >
              {product.category.name}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
