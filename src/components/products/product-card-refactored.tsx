// src/components/products/product-card-refactored.tsx
// Refactored Product Card component for displaying product information
// Pattern: shadcn Card + Badge + Button with responsive design

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ShoppingCartIcon,
  HeartIcon,
  EyeIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
} from 'lucide-react';

// Types
interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category?: { name: string };
  brand?: { name: string };
  stock: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isFeatured: boolean;
}

interface ProductCardRefactoredProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
  onEdit?: (productId: string) => void;
  onDelete?: (productId: string) => void;
  showActions?: boolean; // Show admin actions (edit, delete)
  variant?: 'default' | 'compact'; // Display variant
}

export function ProductCardRefactored({
  product,
  onAddToCart,
  onAddToWishlist,
  onEdit,
  onDelete,
  showActions = false,
  variant = 'default',
}: ProductCardRefactoredProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  // Calculate discount percentage
  const getDiscountPercentage = () => {
    if (!product.compareAtPrice || product.compareAtPrice <= product.price) {
      return 0;
    }
    return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
  };

  const discountPercentage = getDiscountPercentage();
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock < 10;

  // Handlers
  const handleAddToCart = () => {
    if (onAddToCart && !isOutOfStock) {
      onAddToCart(product.id);
    }
  };

  const handleAddToWishlist = () => {
    setIsWishlisted(!isWishlisted);
    if (onAddToWishlist) {
      onAddToWishlist(product.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(product.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(product.id);
    }
  };

  const productImage = product.images[0] || '/placeholder-product.png';

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link href={`/products/${product.slug}`}>
          <Image
            src={imageError ? '/placeholder-product.png' : productImage}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isFeatured && (
            <Badge variant="default" className="shadow-sm">
              Featured
            </Badge>
          )}
          {discountPercentage > 0 && (
            <Badge variant="destructive" className="shadow-sm">
              {discountPercentage}% OFF
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="secondary" className="shadow-sm">
              Out of Stock
            </Badge>
          )}
          {isLowStock && !isOutOfStock && (
            <Badge variant="secondary" className="shadow-sm">
              Low Stock
            </Badge>
          )}
          {product.status === 'DRAFT' && showActions && (
            <Badge variant="secondary" className="shadow-sm">
              Draft
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 shadow-sm"
            onClick={handleAddToWishlist}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <HeartIcon
              className={`h-4 w-4 ${isWishlisted ? 'fill-current text-red-500' : ''}`}
            />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 shadow-sm"
            asChild
          >
            <Link href={`/products/${product.slug}`} aria-label="View product">
              <EyeIcon className="h-4 w-4" />
            </Link>
          </Button>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 shadow-sm"
                  aria-label="Product actions"
                >
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <EditIcon className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Product Info */}
      <CardContent className="p-4">
        {/* Category & Brand */}
        {(product.category || product.brand) && (
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            {product.category && <span>{product.category.name}</span>}
            {product.category && product.brand && <span>•</span>}
            {product.brand && <span>{product.brand.name}</span>}
          </div>
        )}

        {/* Product Name */}
        <Link
          href={`/products/${product.slug}`}
          className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors"
        >
          {product.name}
        </Link>

        {/* Description (optional for compact variant) */}
        {variant === 'default' && product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-lg font-bold">
            {formatCurrency(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="mt-2 text-xs text-muted-foreground">
          {isOutOfStock ? (
            'Out of stock'
          ) : isLowStock ? (
            `Only ${product.stock} left`
          ) : (
            `${product.stock} in stock`
          )}
        </div>
      </CardContent>

      {/* Actions Footer */}
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="w-full"
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCartIcon className="h-4 w-4 mr-2" />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
}
