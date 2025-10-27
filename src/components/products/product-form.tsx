// src/components/products/product-form.tsx
// Product Form Component - Create and edit products with comprehensive validation

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface Category {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Attribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  required: boolean;
}

interface ProductFormData {
  name: string;
  description: string;
  shortDescription: string;
  sku: string;
  price: number;
  comparePrice?: number;
  cost?: number;
  categoryId: string;
  brandId?: string;
  tags: string[];
  trackQuantity: boolean;
  quantity?: number;
  lowStockThreshold: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  seo: {
    title?: string;
    description?: string;
    keywords?: string;
  };
  status: 'draft' | 'active' | 'archived';
  featured: boolean;
  attributes: Record<string, any>;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  categories: Category[];
  brands: Brand[];
  attributes: Attribute[];
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({
  initialData,
  categories,
  brands,
  attributes,
  onSubmit,
  onCancel,
  isLoading = false,
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    shortDescription: '',
    sku: '',
    price: 0,
    comparePrice: 0,
    cost: 0,
    categoryId: '',
    brandId: '',
    tags: [],
    trackQuantity: true,
    quantity: 0,
    lowStockThreshold: 10,
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
    },
    seo: {
      title: '',
      description: '',
      keywords: '',
    },
    status: 'draft',
    featured: false,
    attributes: {},
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    if (formData.trackQuantity && (formData.quantity === undefined || formData.quantity < 0)) {
      newErrors.quantity = 'Quantity must be 0 or greater when tracking inventory';
    }

    // Validate required attributes
    attributes.forEach(attr => {
      if (attr.required && !formData.attributes[attr.id]) {
        newErrors[`attribute_${attr.id}`] = `${attr.name} is required`;
      }
    });

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

  const updateFormData = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      updateFormData('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFormData('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleAttributeChange = (attributeId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attributeId]: value,
      },
    }));

    // Clear attribute error
    const errorKey = `attribute_${attributeId}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="Enter product name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => updateFormData('sku', e.target.value)}
              placeholder="Enter SKU"
              className={errors.sku ? 'border-red-500' : ''}
            />
            {errors.sku && <p className="text-sm text-red-500 mt-1">{errors.sku}</p>}
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
            placeholder="Enter product description"
            className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md resize-vertical"
          />
        </div>

        <div className="mt-4">
          <Label htmlFor="shortDescription">Short Description</Label>
          <textarea
            id="shortDescription"
            value={formData.shortDescription}
            onChange={(e) => updateFormData('shortDescription', e.target.value)}
            placeholder="Enter short description"
            className="w-full min-h-[60px] px-3 py-2 border border-input bg-background rounded-md resize-vertical"
          />
        </div>
      </Card>

      {/* Pricing */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pricing</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price">Price *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => updateFormData('price', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className={errors.price ? 'border-red-500' : ''}
            />
            {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
          </div>

          <div>
            <Label htmlFor="comparePrice">Compare Price</Label>
            <Input
              id="comparePrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.comparePrice || ''}
              onChange={(e) => updateFormData('comparePrice', parseFloat(e.target.value) || undefined)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="cost">Cost</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.cost || ''}
              onChange={(e) => updateFormData('cost', parseFloat(e.target.value) || undefined)}
              placeholder="0.00"
            />
          </div>
        </div>
      </Card>

      {/* Organization */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Organization</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="categoryId">Category *</Label>
            <select
              id="categoryId"
              value={formData.categoryId}
              onChange={(e) => updateFormData('categoryId', e.target.value)}
              className={`w-full px-3 py-2 border border-input bg-background rounded-md ${
                errors.categoryId ? 'border-red-500' : ''
              }`}
            >
              <option value="">Select category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="text-sm text-red-500 mt-1">{errors.categoryId}</p>}
          </div>

          <div>
            <Label htmlFor="brandId">Brand</Label>
            <select
              id="brandId"
              value={formData.brandId || ''}
              onChange={(e) => updateFormData('brandId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="">Select brand</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-xs hover:text-red-500"
                >
                  ✕
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tag"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button type="button" variant="outline" onClick={addTag}>
              Add
            </Button>
          </div>
        </div>
      </Card>

      {/* Inventory */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Inventory</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="trackQuantity"
              checked={formData.trackQuantity}
              onCheckedChange={(checked) => updateFormData('trackQuantity', checked)}
            />
            <Label htmlFor="trackQuantity">Track quantity</Label>
          </div>

          {formData.trackQuantity && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity || ''}
                  onChange={(e) => updateFormData('quantity', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className={errors.quantity ? 'border-red-500' : ''}
                />
                {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={formData.lowStockThreshold}
                  onChange={(e) => updateFormData('lowStockThreshold', parseInt(e.target.value) || 0)}
                  placeholder="10"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Shipping */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Shipping</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.01"
              min="0"
              value={formData.weight || ''}
              onChange={(e) => updateFormData('weight', parseFloat(e.target.value) || undefined)}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="length">Length (cm)</Label>
            <Input
              id="length"
              type="number"
              step="0.01"
              min="0"
              value={formData.dimensions?.length || ''}
              onChange={(e) => updateFormData('dimensions', {
                ...formData.dimensions,
                length: parseFloat(e.target.value) || undefined,
              })}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="width">Width (cm)</Label>
            <Input
              id="width"
              type="number"
              step="0.01"
              min="0"
              value={formData.dimensions?.width || ''}
              onChange={(e) => updateFormData('dimensions', {
                ...formData.dimensions,
                width: parseFloat(e.target.value) || undefined,
              })}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="height">Height (cm)</Label>
            <Input
              id="height"
              type="number"
              step="0.01"
              min="0"
              value={formData.dimensions?.height || ''}
              onChange={(e) => updateFormData('dimensions', {
                ...formData.dimensions,
                height: parseFloat(e.target.value) || undefined,
              })}
              placeholder="0.00"
            />
          </div>
        </div>
      </Card>

      {/* SEO */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">SEO</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input
              id="seoTitle"
              value={formData.seo.title || ''}
              onChange={(e) => updateFormData('seo', {
                ...formData.seo,
                title: e.target.value,
              })}
              placeholder="Enter SEO title"
            />
          </div>

          <div>
            <Label htmlFor="seoDescription">SEO Description</Label>
            <textarea
              id="seoDescription"
              value={formData.seo.description || ''}
              onChange={(e) => updateFormData('seo', {
                ...formData.seo,
                description: e.target.value,
              })}
              placeholder="Enter SEO description"
              className="w-full min-h-[60px] px-3 py-2 border border-input bg-background rounded-md resize-vertical"
            />
          </div>

          <div>
            <Label htmlFor="seoKeywords">SEO Keywords</Label>
            <Input
              id="seoKeywords"
              value={formData.seo.keywords || ''}
              onChange={(e) => updateFormData('seo', {
                ...formData.seo,
                keywords: e.target.value,
              })}
              placeholder="Enter keywords separated by commas"
            />
          </div>
        </div>
      </Card>

      {/* Attributes */}
      {attributes.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Product Attributes</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attributes.map(attribute => (
              <div key={attribute.id}>
                <Label htmlFor={`attribute_${attribute.id}`}>
                  {attribute.name}
                  {attribute.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                
                {attribute.type === 'text' && (
                  <Input
                    id={`attribute_${attribute.id}`}
                    value={formData.attributes[attribute.id] || ''}
                    onChange={(e) => handleAttributeChange(attribute.id, e.target.value)}
                    placeholder={`Enter ${attribute.name.toLowerCase()}`}
                    className={errors[`attribute_${attribute.id}`] ? 'border-red-500' : ''}
                  />
                )}

                {attribute.type === 'number' && (
                  <Input
                    id={`attribute_${attribute.id}`}
                    type="number"
                    value={formData.attributes[attribute.id] || ''}
                    onChange={(e) => handleAttributeChange(attribute.id, parseFloat(e.target.value) || '')}
                    placeholder={`Enter ${attribute.name.toLowerCase()}`}
                    className={errors[`attribute_${attribute.id}`] ? 'border-red-500' : ''}
                  />
                )}

                {attribute.type === 'select' && (
                  <select
                    id={`attribute_${attribute.id}`}
                    value={formData.attributes[attribute.id] || ''}
                    onChange={(e) => handleAttributeChange(attribute.id, e.target.value)}
                    className={`w-full px-3 py-2 border border-input bg-background rounded-md ${
                      errors[`attribute_${attribute.id}`] ? 'border-red-500' : ''
                    }`}
                  >
                    <option value="">Select {attribute.name.toLowerCase()}</option>
                    {attribute.options?.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}

                {attribute.type === 'boolean' && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id={`attribute_${attribute.id}`}
                      checked={formData.attributes[attribute.id] || false}
                      onCheckedChange={(checked) => handleAttributeChange(attribute.id, checked)}
                    />
                    <Label htmlFor={`attribute_${attribute.id}`}>
                      Enable {attribute.name.toLowerCase()}
                    </Label>
                  </div>
                )}

                {errors[`attribute_${attribute.id}`] && (
                  <p className="text-sm text-red-500 mt-1">{errors[`attribute_${attribute.id}`]}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Product Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => updateFormData('status', e.target.value as 'draft' | 'active' | 'archived')}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 mt-6">
            <Checkbox
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => updateFormData('featured', checked)}
            />
            <Label htmlFor="featured">Featured Product</Label>
          </div>
        </div>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Product'}
        </Button>
      </div>
    </form>
  );
}