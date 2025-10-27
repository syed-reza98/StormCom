// src/components/products/product-inventory.tsx
// Product Inventory Component - Display and manage inventory information

'use client';

import { Badge } from '@/components/ui/badge';

interface Product {
  trackQuantity: boolean;
  quantity?: number;
  lowStockThreshold: number;
}

interface ProductInventoryProps {
  product: Product;
}

export function ProductInventory({ product }: ProductInventoryProps) {
  const getInventoryStatus = () => {
    if (!product.trackQuantity) {
      return { status: 'Not Tracked', variant: 'outline' as const };
    }
    
    const quantity = product.quantity || 0;
    if (quantity === 0) {
      return { status: 'Out of Stock', variant: 'destructive' as const };
    } else if (quantity <= product.lowStockThreshold) {
      return { status: 'Low Stock', variant: 'warning' as const };
    } else {
      return { status: 'In Stock', variant: 'success' as const };
    }
  };

  const inventoryStatus = getInventoryStatus();

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground">Inventory Tracking</label>
        <div className="mt-1">
          <Badge variant={product.trackQuantity ? 'success' : 'secondary'}>
            {product.trackQuantity ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </div>

      {product.trackQuantity && (
        <>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Current Stock</label>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-bold">{product.quantity || 0}</span>
              <Badge variant={inventoryStatus.variant}>
                {inventoryStatus.status}
              </Badge>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Low Stock Threshold</label>
            <p className="mt-1 text-sm">{product.lowStockThreshold} units</p>
          </div>

          {product.quantity !== undefined && product.quantity <= product.lowStockThreshold && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Stock is running low. Consider restocking soon.
              </p>
            </div>
          )}

          {product.quantity === 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                🚫 Product is out of stock and unavailable for purchase.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}