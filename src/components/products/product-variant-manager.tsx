'use client';

import * as React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Variant name is required'),
  price: z.number().min(0, 'Price must be positive'),
  comparePrice: z.number().min(0).optional(),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  weight: z.number().min(0).optional(),
  attributes: z.record(z.string()).optional(),
});

const variantManagerSchema = z.object({
  variants: z.array(variantSchema).min(1, 'At least one variant is required'),
});

type VariantFormData = z.infer<typeof variantManagerSchema>;
type Variant = z.infer<typeof variantSchema>;

interface ProductVariantManagerProps {
  initialVariants?: Variant[];
  onSave: (variants: Variant[]) => Promise<void>;
  attributeOptions?: Array<{
    name: string;
    values: string[];
  }>;
}

export function ProductVariantManager({
  initialVariants = [],
  onSave,
  attributeOptions = [],
}: ProductVariantManagerProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<VariantFormData>({
    resolver: zodResolver(variantManagerSchema),
    defaultValues: {
      variants: initialVariants.length > 0 ? initialVariants : [
        {
          sku: '',
          name: '',
          price: 0,
          stock: 0,
          attributes: {},
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  const addVariant = () => {
    append({
      sku: '',
      name: '',
      price: 0,
      stock: 0,
      attributes: {},
    });
  };

  const handleSubmit = async (data: VariantFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(data.variants);
    } catch (error) {
      console.error('Failed to save variants:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Variants</CardTitle>
        <CardDescription>
          Manage different variations of this product (e.g., sizes, colors)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Variants list */}
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-border p-4 space-y-4"
                >
                  {/* Variant header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <Badge variant="outline">Variant {index + 1}</Badge>
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Variant fields */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`variants.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Variant Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Small / Red"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`variants.${index}.sku`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., PROD-SM-RED"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`variants.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`variants.${index}.comparePrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compare at Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`variants.${index}.stock`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`variants.${index}.weight`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (kg)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Attributes */}
                  {attributeOptions.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <FormLabel>Attributes</FormLabel>
                        <div className="grid gap-4 md:grid-cols-2">
                          {attributeOptions.map((option) => (
                            <FormField
                              key={option.name}
                              control={form.control}
                              name={`variants.${index}.attributes.${option.name}`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">
                                    {option.name}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder={`Select ${option.name}`}
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add variant button */}
            <Button
              type="button"
              variant="outline"
              onClick={addVariant}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Variant
            </Button>

            <Separator />

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Variants'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
