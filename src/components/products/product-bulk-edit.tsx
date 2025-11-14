'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit, Info } from 'lucide-react';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const bulkEditSchema = z.object({
  fields: z.array(z.enum(['price', 'stock', 'status', 'category'])).min(1, 'Select at least one field'),
  price: z.number().positive('Price must be positive').optional(),
  priceAction: z.enum(['set', 'increase', 'decrease']).optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  stockAction: z.enum(['set', 'increase', 'decrease']).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  categoryId: z.string().optional(),
});

type BulkEditFormData = z.infer<typeof bulkEditSchema>;

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: 'draft' | 'active' | 'archived';
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
}

interface ProductBulkEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  categories: Category[];
  onSubmit?: (data: BulkEditFormData) => Promise<void>;
}

export default function ProductBulkEdit({
  open,
  onOpenChange,
  selectedProducts,
  categories,
  onSubmit,
}: ProductBulkEditProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<BulkEditFormData>({
    resolver: zodResolver(bulkEditSchema),
    defaultValues: {
      fields: [],
      priceAction: 'set',
      stockAction: 'set',
    },
  });

  const watchedFields = form.watch('fields');
  const watchedPrice = form.watch('price');
  const watchedPriceAction = form.watch('priceAction');
  const watchedStock = form.watch('stock');
  const watchedStockAction = form.watch('stockAction');

  const calculateNewValue = (
    current: number,
    action: 'set' | 'increase' | 'decrease',
    value?: number
  ) => {
    if (!value) return current;
    
    switch (action) {
      case 'set':
        return value;
      case 'increase':
        return current + value;
      case 'decrease':
        return Math.max(0, current - value);
      default:
        return current;
    }
  };

  const getPreviewData = () => {
    return selectedProducts.map(product => {
      let newPrice = product.price;
      let newStock = product.stock;

      if (watchedFields.includes('price') && watchedPrice) {
        newPrice = calculateNewValue(product.price, watchedPriceAction || 'set', watchedPrice);
      }

      if (watchedFields.includes('stock') && watchedStock !== undefined) {
        newStock = calculateNewValue(product.stock, watchedStockAction || 'set', watchedStock);
      }

      return {
        ...product,
        newPrice,
        newStock,
      };
    });
  };

  const handleSubmit = async (data: BulkEditFormData) => {
    if (!onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to bulk edit products:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Bulk Edit Products
          </DialogTitle>
          <DialogDescription>
            Apply changes to {selectedProducts.length} selected product{selectedProducts.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Field Selection */}
            <FormField
              control={form.control}
              name="fields"
              render={() => (
                <FormItem>
                  <FormLabel>Fields to Update</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {(['price', 'stock', 'status', 'category'] as const).map((field) => (
                      <FormField
                        key={field}
                        control={form.control}
                        name="fields"
                        render={({ field: formField }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={formField.value?.includes(field)}
                                onCheckedChange={(checked) => {
                                  const value = formField.value || [];
                                  formField.onChange(
                                    checked
                                      ? [...value, field]
                                      : value.filter((f) => f !== field)
                                  );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer capitalize">
                              {field}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price Fields */}
            {watchedFields.includes('price') && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <FormField
                  control={form.control}
                  name="priceAction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Action</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="set">Set to</SelectItem>
                          <SelectItem value="increase">Increase by</SelectItem>
                          <SelectItem value="decrease">Decrease by</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Stock Fields */}
            {watchedFields.includes('stock') && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <FormField
                  control={form.control}
                  name="stockAction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Action</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="set">Set to</SelectItem>
                          <SelectItem value="increase">Increase by</SelectItem>
                          <SelectItem value="decrease">Decrease by</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Status Field */}
            {watchedFields.includes('status') && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Category Field */}
            {watchedFields.includes('category') && (
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Preview */}
            {watchedFields.length > 0 && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>

                {showPreview && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2 mt-2">
                        {getPreviewData().slice(0, 3).map((product) => (
                          <div key={product.id} className="flex items-center justify-between text-sm">
                            <span className="font-medium">{product.name}</span>
                            <div className="flex gap-2">
                              {watchedFields.includes('price') && (
                                <span>
                                  ${product.price} → ${product.newPrice}
                                </span>
                              )}
                              {watchedFields.includes('stock') && (
                                <Badge variant="outline">
                                  Stock: {product.stock} → {product.newStock}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                        {selectedProducts.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            ... and {selectedProducts.length - 3} more products
                          </p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || watchedFields.length === 0}>
                {isSubmitting ? 'Applying...' : 'Apply Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
