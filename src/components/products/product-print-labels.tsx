'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Printer, Loader2, Tag } from 'lucide-react';

const printLabelsSchema = z.object({
  template: z.enum(['barcode', 'price', 'shelf']),
  quantity: z.number().min(1).max(1000),
  labelSize: z.enum(['small', 'medium', 'large']),
});

type PrintLabelsFormData = z.infer<typeof printLabelsSchema>;

interface ProductPrintLabelsProps {
  productId?: string;
  productName: string;
  sku: string;
  barcode?: string;
  price: number;
  onPrint?: (data: PrintLabelsFormData) => Promise<void>;
}

const templates = [
  { value: 'barcode', label: 'Barcode Only', description: 'SKU + Barcode' },
  { value: 'price', label: 'Price Label', description: 'Name + Price' },
  { value: 'shelf', label: 'Shelf Label', description: 'Complete info' },
];

const labelSizes = [
  { value: 'small', label: 'Small (2x1")' },
  { value: 'medium', label: 'Medium (3x2")' },
  { value: 'large', label: 'Large (4x3")' },
];

export function ProductPrintLabels({
  productName,
  sku,
  barcode,
  price,
  onPrint,
}: ProductPrintLabelsProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<PrintLabelsFormData>({
    resolver: zodResolver(printLabelsSchema),
    defaultValues: {
      template: 'barcode',
      quantity: 1,
      labelSize: 'medium',
    },
  });

  const selectedTemplate = form.watch('template');

  const onSubmit = async (data: PrintLabelsFormData) => {
    setIsPrinting(true);
    try {
      await onPrint?.(data);
    } catch (error) {
      console.error('Print error:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Print Labels
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label Template</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.value} value={template.value}>
                          <div>
                            <div>{template.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {template.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="labelSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label Size</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {labelSizes.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex-1"
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              <Button
                type="submit"
                disabled={isPrinting}
                className="flex-1"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Preview */}
        {showPreview && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <div className="text-sm font-medium mb-2">Label Preview</div>
            <div className="bg-white p-2 border rounded text-center">
              {selectedTemplate === 'barcode' && (
                <div>
                  <div className="font-mono text-xs">{sku}</div>
                  {barcode && <div className="text-xl">|||||||</div>}
                </div>
              )}
              {selectedTemplate === 'price' && (
                <div>
                  <div className="font-medium text-sm truncate">{productName}</div>
                  <div className="text-lg font-bold">${price.toFixed(2)}</div>
                </div>
              )}
              {selectedTemplate === 'shelf' && (
                <div>
                  <div className="font-medium text-xs truncate">{productName}</div>
                  <div className="text-sm">${price.toFixed(2)}</div>
                  <div className="font-mono text-xs">{sku}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
