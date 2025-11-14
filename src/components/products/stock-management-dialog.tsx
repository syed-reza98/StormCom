// src/components/products/stock-management-dialog.tsx
// Stock Management Dialog for updating product inventory
// Pattern: shadcn Dialog + Form with validation

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircleIcon, PackageIcon } from 'lucide-react';

const stockAdjustmentSchema = z.object({
  adjustment: z.number().int('Must be a whole number'),
  reason: z.string().min(3, 'Reason is required (min 3 characters)').max(500),
  notes: z.string().max(1000).optional(),
});

type StockAdjustmentData = z.infer<typeof stockAdjustmentSchema>;

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  lowStockThreshold?: number;
}

interface StockManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onUpdate: (productId: string, data: StockAdjustmentData) => Promise<void>;
  isLoading?: boolean;
}

export function StockManagementDialog({
  open,
  onOpenChange,
  product,
  onUpdate,
  isLoading = false,
}: StockManagementDialogProps) {
  const form = useForm<StockAdjustmentData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      adjustment: 0,
      reason: '',
      notes: '',
    },
  });

  const watchAdjustment = form.watch('adjustment');

  // Calculate new stock level
  const newStock = product ? product.currentStock + (watchAdjustment || 0) : 0;
  const isLowStock = product && product.lowStockThreshold && newStock < product.lowStockThreshold;

  const handleSubmit = async (data: StockAdjustmentData) => {
    if (!product) return;

    try {
      await onUpdate(product.id, data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handling done by parent
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock Level</DialogTitle>
          <DialogDescription>
            Update inventory for {product.name} ({product.sku})
          </DialogDescription>
        </DialogHeader>

        {/* Current Stock Display */}
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Stock</span>
            <div className="flex items-center gap-2">
              <PackageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{product.currentStock}</span>
            </div>
          </div>
          
          {isLowStock && (
            <div className="flex items-center gap-2 text-orange-500">
              <AlertCircleIcon className="h-4 w-4" />
              <span className="text-xs">Low stock warning</span>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Adjustment Field */}
            <FormField
              control={form.control}
              name="adjustment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adjustment Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter positive or negative number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Use positive numbers to add stock, negative to remove
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New Stock Level Preview */}
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">New Stock Level</span>
                <Badge variant={newStock < 0 ? 'destructive' : isLowStock ? 'secondary' : 'default'}>
                  {newStock}
                </Badge>
              </div>
              {newStock < 0 && (
                <p className="text-xs text-destructive mt-1">
                  Cannot reduce stock below 0
                </p>
              )}
            </div>

            {/* Reason Field */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Received shipment, Damaged goods, etc."
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Brief explanation for this adjustment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details..."
                      rows={3}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || newStock < 0}
              >
                {isLoading ? 'Updating...' : 'Update Stock'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
