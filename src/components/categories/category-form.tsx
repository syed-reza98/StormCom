// src/components/categories/category-form.tsx
// Category Form Component - Create and edit categories with validation

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  productsCount: number;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parentId: string;
  sortOrder: number;
  isActive: boolean;
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

interface CategoryFormProps {
  initialData?: Partial<Category>;
  categories: Category[];
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CategoryForm({
  initialData,
  categories,
  onSubmit,
  onCancel,
  isLoading = false,
}: CategoryFormProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    parentId: initialData?.parentId || '',
    sortOrder: initialData?.sortOrder || 0,
    isActive: initialData?.isActive ?? true,
    seo: {
      title: '',
      description: '',
      keywords: '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (formData.sortOrder < 0) {
      newErrors.sortOrder = 'Sort order must be 0 or greater';
    }

    // Check for circular reference in parent selection
    if (formData.parentId && initialData?.id) {
      const isCircular = (categoryId: string, targetParentId: string): boolean => {
        if (categoryId === targetParentId) return true;
        
        const findInCategories = (cats: Category[]): boolean => {
          for (const cat of cats) {
            if (cat.id === targetParentId && cat.parentId === categoryId) return true;
            if (cat.children && findInCategories(cat.children)) return true;
          }
          return false;
        };

        return findInCategories(categories);
      };

      if (isCircular(initialData.id, formData.parentId)) {
        newErrors.parentId = 'Cannot set a child category as parent (circular reference)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const updateFormData = (field: keyof CategoryFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Auto-generate slug when name changes
    if (field === 'name' && !initialData?.slug) {
      const newSlug = generateSlug(value as string);
      setFormData(prev => ({
        ...prev,
        slug: newSlug,
      }));
    }
    
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Build parent category options (exclude current category and its children)
  const getParentOptions = (): Category[] => {
    const flattenCategories = (cats: Category[]): Category[] => {
      return cats.flatMap(cat => [cat, ...(cat.children ? flattenCategories(cat.children) : [])]);
    };

    const allCategories = flattenCategories(categories);
    
    if (initialData?.id) {
      // Exclude current category and its children
      const isExcluded = (cat: Category): boolean => {
        if (cat.id === initialData.id) return true;
        // Check if this category is a child of the current one
        const hasParent = (categoryId: string, targetId: string): boolean => {
          const category = allCategories.find(c => c.id === categoryId);
          if (!category) return false;
          if (category.parentId === targetId) return true;
          if (category.parentId) return hasParent(category.parentId, targetId);
          return false;
        };
        return hasParent(cat.id, initialData.id!);
      };

      return allCategories.filter(cat => !isExcluded(cat));
    }

    return allCategories;
  };

  const parentOptions = getParentOptions();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Category Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            placeholder="Enter category name"
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => updateFormData('slug', e.target.value)}
            placeholder="category-slug"
            className={errors.slug ? 'border-red-500' : ''}
          />
          {errors.slug && <p className="text-sm text-red-500 mt-1">{errors.slug}</p>}
          <p className="text-sm text-muted-foreground mt-1">
            URL-friendly version of the name. Only lowercase letters, numbers, and hyphens.
          </p>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
            placeholder="Enter category description"
            className="w-full min-h-[80px] px-3 py-2 border border-input bg-background rounded-md resize-vertical"
          />
        </div>
      </div>

      {/* Hierarchy */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="parentId">Parent Category</Label>
          <select
            id="parentId"
            value={formData.parentId}
            onChange={(e) => updateFormData('parentId', e.target.value)}
            className={`w-full px-3 py-2 border border-input bg-background rounded-md ${
              errors.parentId ? 'border-red-500' : ''
            }`}
          >
            <option value="">None (Root Category)</option>
            {parentOptions.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.parentId && <p className="text-sm text-red-500 mt-1">{errors.parentId}</p>}
          <p className="text-sm text-muted-foreground mt-1">
            Select a parent category to create a subcategory.
          </p>
        </div>

        <div>
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input
            id="sortOrder"
            type="number"
            min="0"
            value={formData.sortOrder}
            onChange={(e) => updateFormData('sortOrder', parseInt(e.target.value) || 0)}
            placeholder="0"
            className={errors.sortOrder ? 'border-red-500' : ''}
          />
          {errors.sortOrder && <p className="text-sm text-red-500 mt-1">{errors.sortOrder}</p>}
          <p className="text-sm text-muted-foreground mt-1">
            Lower numbers appear first in category lists.
          </p>
        </div>
      </div>

      {/* SEO */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">SEO Settings</h3>
        
        <div>
          <Label htmlFor="seoTitle">SEO Title</Label>
          <Input
            id="seoTitle"
            value={formData.seo.title}
            onChange={(e) => updateFormData('seo', {
              ...formData.seo,
              title: e.target.value,
            })}
            placeholder="Enter SEO title"
          />
          <p className="text-sm text-muted-foreground mt-1">
            If empty, the category name will be used.
          </p>
        </div>

        <div>
          <Label htmlFor="seoDescription">SEO Description</Label>
          <textarea
            id="seoDescription"
            value={formData.seo.description}
            onChange={(e) => updateFormData('seo', {
              ...formData.seo,
              description: e.target.value,
            })}
            placeholder="Enter SEO description"
            className="w-full min-h-[60px] px-3 py-2 border border-input bg-background rounded-md resize-vertical"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Brief description for search engines (150-160 characters recommended).
          </p>
        </div>

        <div>
          <Label htmlFor="seoKeywords">SEO Keywords</Label>
          <Input
            id="seoKeywords"
            value={formData.seo.keywords}
            onChange={(e) => updateFormData('seo', {
              ...formData.seo,
              keywords: e.target.value,
            })}
            placeholder="Enter keywords separated by commas"
          />
        </div>
      </div>

      {/* Status */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => updateFormData('isActive', checked)}
          />
          <Label htmlFor="isActive">Active Category</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Inactive categories are hidden from the storefront but remain accessible in the admin.
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : (initialData ? 'Update Category' : 'Create Category')}
        </Button>
      </div>
    </form>
  );
}