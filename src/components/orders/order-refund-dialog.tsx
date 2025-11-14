'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, Info } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

const refundSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  reason: z.enum([
    'customer_request',
    'product_defect',
    'wrong_item',
    'damaged_in_shipping',
    'not_as_described',
    'other',
  ]),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  refundShipping: z.boolean().default(false),
  refundTax: z.boolean().default(true),
  itemsToRefund: z.array(z.string()).min(1, 'Select at least one item'),
});

type RefundFormData = z.infer<typeof refundSchema>;

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface OrderRefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderTotal: number;
  shippingCost: number;
  taxAmount: number;
  items: OrderItem[];
  onSubmit?: (data: RefundFormData) => Promise<void>;
}

export default function OrderRefundDialog({
  open,
  onOpenChange,
  orderId,
  orderTotal,
  shippingCost,
  taxAmount,
  items,
  onSubmit,
}: OrderRefundDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RefundFormData>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      amount: 0,
      reason: 'customer_request',
      notes: '',
      refundShipping: false,
      refundTax: true,
      itemsToRefund: [],
    },
  });

  const watchedItems = form.watch('itemsToRefund');
  const watchedRefundShipping = form.watch('refundShipping');
  const watchedRefundTax = form.watch('refundTax');

  // Calculate refund amount based on selected items
  const calculateRefundAmount = () => {
    let amount = 0;
    
    // Add item costs
    watchedItems.forEach(itemId => {
      const item = items.find(i => i.id === itemId);
      if (item) {
        amount += item.price * item.quantity;
      }
    });
    
    // Add shipping if selected
    if (watchedRefundShipping) {
      amount += shippingCost;
    }
    
    // Add tax if selected
    if (watchedRefundTax) {
      const itemsSubtotal = watchedItems.reduce((sum, itemId) => {
        const item = items.find(i => i.id === itemId);
        return sum + (item ? item.price * item.quantity : 0);
      }, 0);
      const itemTaxPortion = (itemsSubtotal / (orderTotal - shippingCost - taxAmount)) * taxAmount;
      amount += itemTaxPortion;
    }
    
    return Math.min(amount, orderTotal);
  };

  const refundAmount = calculateRefundAmount();

  const handleSubmit = async (data: RefundFormData) => {
    if (!onSubmit) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        amount: refundAmount,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to process refund:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            Issue a full or partial refund for order {orderId}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Items to Refund */}
            <FormField
              control={form.control}
              name="itemsToRefund"
              render={() => (
                <FormItem>
                  <FormLabel>Items to Refund</FormLabel>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="itemsToRefund"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                  const value = field.value || [];
                                  field.onChange(
                                    checked
                                      ? [...value, item.id]
                                      : value.filter((id) => id !== item.id)
                                  );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex-1">
                              {item.name} (Qty: {item.quantity}) - ${item.price * item.quantity}
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

            {/* Refund Options */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="refundShipping"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Refund Shipping (${shippingCost.toFixed(2)})
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="refundTax"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Refund Tax (proportional)
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Refund Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Refund</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="customer_request">Customer Request</SelectItem>
                      <SelectItem value="product_defect">Product Defect</SelectItem>
                      <SelectItem value="wrong_item">Wrong Item Sent</SelectItem>
                      <SelectItem value="damaged_in_shipping">Damaged in Shipping</SelectItem>
                      <SelectItem value="not_as_described">Not as Described</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this refund"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Refund Preview */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between font-medium">
                  <span>Refund Amount:</span>
                  <span className="text-lg">
                    <DollarSign className="inline h-4 w-4" />
                    {refundAmount.toFixed(2)}
                  </span>
                </div>
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || refundAmount === 0}>
                {isSubmitting ? 'Processing...' : `Issue Refund ($${refundAmount.toFixed(2)})`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
