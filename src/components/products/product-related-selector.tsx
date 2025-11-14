'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Search, GripVertical, Plus } from 'lucide-react';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  image?: string;
  price: number;
  sku: string;
}

interface ProductRelatedSelectorProps {
  productId: string;
  selectedProducts: Product[];
  availableProducts: Product[];
  onAdd: (productId: string) => void;
  onRemove: (productId: string) => void;
  onReorder?: (products: Product[]) => void;
}

export function ProductRelatedSelector({
  productId,
  selectedProducts,
  availableProducts,
  onAdd,
  onRemove,
  onReorder,
}: ProductRelatedSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter available products (excluding selected and current product)
  const filteredProducts = availableProducts.filter(
    (product) =>
      product.id !== productId &&
      !selectedProducts.find((p) => p.id === product.id) &&
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Related Products</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Products */}
        <div className="space-y-2">
          <div className="text-sm font-medium">
            Selected ({selectedProducts.length})
          </div>
          {selectedProducts.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
              No related products selected
            </div>
          ) : (
            <div className="space-y-2">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2 border rounded-lg hover:bg-accent transition-colors"
                >
                  {onReorder && (
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  )}
                  {product.image && (
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {product.sku} • ${product.price.toFixed(2)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(product.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search & Add */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Add Products</div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-2">
            {filteredProducts.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                {searchQuery ? 'No products found' : 'No more products available'}
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg transition-colors cursor-pointer"
                  onClick={() => onAdd(product.id)}
                >
                  {product.image && (
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {product.sku} • ${product.price.toFixed(2)}
                    </div>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
