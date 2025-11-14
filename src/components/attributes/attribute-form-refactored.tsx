// src/components/attributes/attribute-form-refactored.tsx
// Refactored form component for creating/editing attributes
// Pattern: shadcn Form + React Hook Form + Zod validation

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { 
  PlusIcon, 
  TrashIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  TextIcon,
  HashIcon,
  ListIcon,
  CheckIcon,
  PaletteIcon,
  RulerIcon
} from 'lucide-react';

// Attribute value schema
const attributeValueSchema = z.object({
  id: z.string(),
  value: z.string().min(1, 'Value is required'),
  slug: z.string().min(1, 'Slug is required'),
  color: z.string().optional(),
  sortOrder: z.number(),
  isActive: z.boolean().default(true),
});

// Main form schema
const attributeFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long'),
  type: z.enum(['text', 'number', 'select', 'boolean', 'color', 'size']),
  description: z.string().max(1000, 'Description too long').optional(),
  required: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  values: z.array(attributeValueSchema),
}).refine(
  (data) => {
    // Validate that select, color, and size types have at least one value
    if (['select', 'color', 'size'].includes(data.type)) {
      return data.values.length > 0;
    }
    return true;
  },
  {
    message: 'At least one value is required for this attribute type',
    path: ['values'],
  }
);

type AttributeFormData = z.infer<typeof attributeFormSchema>;
type AttributeValue = z.infer<typeof attributeValueSchema>;

interface AttributeFormRefactoredProps {
  attribute?: Partial<AttributeFormData>;
  onSubmit: (data: AttributeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AttributeFormRefactored({
  attribute,
  onSubmit,
  onCancel,
  isLoading = false,
}: AttributeFormRefactoredProps) {
  const [newValue, setNewValue] = useState('');
  const [newValueColor, setNewValueColor] = useState('#000000');

  const form = useForm<AttributeFormData>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: {
      name: attribute?.name || '',
      slug: attribute?.slug || '',
      type: attribute?.type || 'text',
      description: attribute?.description || '',
      required: attribute?.required || false,
      isActive: attribute?.isActive ?? true,
      sortOrder: attribute?.sortOrder || 0,
      values: attribute?.values || [],
    },
  });

  const watchType = form.watch('type');
  const watchValues = form.watch('values');
  const showValues = ['select', 'color', 'size'].includes(watchType);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (value: string) => {
    form.setValue('name', value);
    if (!attribute) {
      form.setValue('slug', generateSlug(value));
    }
  };

  const addValue = () => {
    if (!newValue.trim()) return;

    const currentValues = form.getValues('values');
    const value: AttributeValue = {
      id: `temp-${Date.now()}`,
      value: newValue.trim(),
      slug: generateSlug(newValue.trim()),
      color: watchType === 'color' ? newValueColor : undefined,
      sortOrder: currentValues.length,
      isActive: true,
    };

    form.setValue('values', [...currentValues, value]);
    setNewValue('');
    setNewValueColor('#000000');
  };

  const removeValue = (valueId: string) => {
    const currentValues = form.getValues('values');
    form.setValue('values', currentValues.filter(v => v.id !== valueId));
  };

  const moveValue = (valueId: string, direction: 'up' | 'down') => {
    const values = [...form.getValues('values')];
    const index = values.findIndex(v => v.id === valueId);
    
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= values.length) return;
    
    [values[index], values[newIndex]] = [values[newIndex], values[index]];
    
    // Update sort orders
    values.forEach((value, i) => {
      value.sortOrder = i;
    });
    
    form.setValue('values', values);
  };

  const attributeTypes = [
    { 
      value: 'text', 
      label: 'Text', 
      description: 'Free text input', 
      icon: TextIcon 
    },
    { 
      value: 'number', 
      label: 'Number', 
      description: 'Numeric values', 
      icon: HashIcon 
    },
    { 
      value: 'select', 
      label: 'Select', 
      description: 'Predefined options', 
      icon: ListIcon 
    },
    { 
      value: 'boolean', 
      label: 'Boolean', 
      description: 'Yes/No toggle', 
      icon: CheckIcon 
    },
    { 
      value: 'color', 
      label: 'Color', 
      description: 'Color picker', 
      icon: PaletteIcon 
    },
    { 
      value: 'size', 
      label: 'Size', 
      description: 'Size options', 
      icon: RulerIcon 
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g., Color, Size, Material"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Display name for this attribute
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Slug Field */}
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="auto-generated-slug"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Used in URLs and API responses
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Optional description for this attribute"
                      rows={3}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Help text shown to users when adding this attribute
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Attribute Type Card */}
        <Card>
          <CardHeader>
            <CardTitle>Attribute Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type Select */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading || !!attribute}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select attribute type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {attributeTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {type.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {attribute ? 'Type cannot be changed after creation' : 'Choose how this attribute will be displayed'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Required</FormLabel>
                      <FormDescription>
                        Must be filled
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Show to users
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        min={0}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Display order
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Attribute Values Card (conditional) */}
        {showValues && (
          <Card>
            <CardHeader>
              <CardTitle>Attribute Values</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Value Input */}
              <div className="flex gap-2">
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Enter value (e.g., Red, Small, Cotton)"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addValue();
                    }
                  }}
                />
                {watchType === 'color' && (
                  <Input
                    type="color"
                    value={newValueColor}
                    onChange={(e) => setNewValueColor(e.target.value)}
                    className="w-20"
                    disabled={isLoading}
                  />
                )}
                <Button
                  type="button"
                  onClick={addValue}
                  disabled={isLoading || !newValue.trim()}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Values List */}
              <FormField
                control={form.control}
                name="values"
                render={() => (
                  <FormItem>
                    <div className="space-y-2">
                      {watchValues.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No values added yet. Add at least one value.
                        </div>
                      ) : (
                        watchValues.map((value, index) => (
                          <div
                            key={value.id}
                            className="flex items-center gap-2 p-2 border rounded-lg"
                          >
                            {watchType === 'color' && value.color && (
                              <div
                                className="w-6 h-6 rounded border"
                                style={{ backgroundColor: value.color }}
                              />
                            )}
                            <Badge variant="secondary" className="flex-1">
                              {value.value}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => moveValue(value.id, 'up')}
                                disabled={isLoading || index === 0}
                                aria-label="Move up"
                              >
                                <ChevronUpIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => moveValue(value.id, 'down')}
                                disabled={isLoading || index === watchValues.length - 1}
                                aria-label="Move down"
                              >
                                <ChevronDownIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeValue(value.id)}
                                disabled={isLoading}
                                aria-label="Remove value"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : attribute ? 'Update Attribute' : 'Create Attribute'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
