'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductVariant {
  id: string;
  name: string;
  options: string[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: { url: string; alt: string }[];
  stock: number;
  variants?: ProductVariant[];
  category?: string;
}

interface ProductQuickViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onAddToCart?: (productId: string, selectedVariants: Record<string, string>, quantity: number) => Promise<void>;
}

export default function ProductQuickView({
  open,
  onOpenChange,
  product,
  onAddToCart,
}: ProductQuickViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!onAddToCart) return;

    setIsAdding(true);
    try {
      await onAddToCart(product.id, selectedVariants, quantity);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const discountPercentage = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Quick View: {product.name}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              <Image
                src={product.images[selectedImageIndex]?.url || '/placeholder.png'}
                alt={product.images[selectedImageIndex]?.alt || product.name}
                fill
                className="object-contain"
                priority
              />
              {discountPercentage > 0 && (
                <div className="absolute top-2 left-2">
                  <Badge variant="destructive">-{discountPercentage}%</Badge>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square w-16 rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index
                        ? 'border-primary'
                        : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              {product.category && (
                <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
              )}
              <h2 className="text-2xl font-bold">{product.name}</h2>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-lg text-muted-foreground line-through">
                  ${product.comparePrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div>
              {isOutOfStock ? (
                <Badge variant="destructive">Out of Stock</Badge>
              ) : isLowStock ? (
                <Badge variant="outline" className="border-amber-500 text-amber-700">
                  Only {product.stock} left in stock
                </Badge>
              ) : (
                <Badge variant="outline" className="border-green-500 text-green-700">
                  In Stock
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground">{product.description}</p>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                {product.variants.map((variant) => (
                  <div key={variant.id} className="space-y-2">
                    <label className="text-sm font-medium">{variant.name}</label>
                    <Select
                      value={selectedVariants[variant.id] || ''}
                      onValueChange={(value) =>
                        setSelectedVariants((prev) => ({ ...prev, [variant.id]: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${variant.name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {variant.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4">
              <Button
                className="w-full"
                size="lg"
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAdding}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {isAdding ? 'Adding...' : 'Add to Cart'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.location.href = `/products/${product.id}`;
                }}
              >
                View Full Details
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
