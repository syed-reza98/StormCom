'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

const brandSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().max(1000, 'Description too long').optional(),
  logo: z.string().url('Must be valid URL').optional(),
  website: z.string().url('Must be valid URL').optional(),
  isActive: z.boolean().default(true),
});

type BrandFormData = z.infer<typeof brandSchema>;

interface BrandFormRefactoredProps {
  initialData?: Partial<BrandFormData>;
  onSubmit: (data: BrandFormData) => Promise<void>;
  isLoading?: boolean;
}

export function BrandFormRefactored({
  initialData,
  onSubmit,
  isLoading = false,
}: BrandFormRefactoredProps) {
  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      logo: initialData?.logo || '',
      website: initialData?.website || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    form.setValue('slug', slug);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Brand Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (!initialData) handleNameChange(e.target.value);
                      }}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    The official name of the brand
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>
                    URL-friendly identifier (auto-generated from name)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>
                    Brief description of the brand and its products
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" disabled={isLoading} />
                  </FormControl>
                  <FormDescription>
                    URL to the brand's logo image
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" disabled={isLoading} />
                  </FormControl>
                  <FormDescription>
                    Brand's official website
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Show products from this brand on the storefront
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Brand'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
