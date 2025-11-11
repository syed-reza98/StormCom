// src/components/products/product-variants.tsx
// Product Variants Component - Display product variants with attributes

'use client';

import { Badge } from '@/components/ui/badge';

interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  inventoryQty: number;
  options: Record<string, string>;
}

interface ProductVariantsProps {
  variants: ProductVariant[];
}

export function ProductVariants({ variants }: ProductVariantsProps) {
  if (variants.length === 0) {
    return <p className="text-muted-foreground">No variants configured</p>;
  }

  return (
    <div className="space-y-4">
      {variants.map((variant) => (
        <div key={variant.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">{variant.name}</h3>
            <div className="text-right">
              {variant.price && (
                <div className="font-semibold">${variant.price.toFixed(2)}</div>
              )}
              <div className="text-sm text-muted-foreground">
                Qty: {variant.inventoryQty}
              </div>
            </div>
          </div>
          
          {variant.sku && (
            <div className="text-sm text-muted-foreground mb-2">
              SKU: {variant.sku}
            </div>
          )}
          
          {Object.keys(variant.options).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(variant.options).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}