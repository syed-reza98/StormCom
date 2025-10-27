// src/components/attributes/attribute-form.tsx
// Form component for creating/editing attributes

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AttributeValue {
  id: string;
  value: string;
  slug: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
}

interface AttributeFormData {
  name: string;
  slug: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'color' | 'size';
  description?: string;
  required: boolean;
  isActive: boolean;
  sortOrder: number;
  values: AttributeValue[];
}

interface AttributeFormProps {
  attribute?: AttributeFormData;
  onSubmit: (data: AttributeFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AttributeForm({ 
  attribute, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: AttributeFormProps) {
  const [formData, setFormData] = useState<AttributeFormData>({
    name: attribute?.name || '',
    slug: attribute?.slug || '',
    type: attribute?.type || 'text',
    description: attribute?.description || '',
    required: attribute?.required || false,
    isActive: attribute?.isActive ?? true,
    sortOrder: attribute?.sortOrder || 0,
    values: attribute?.values || [],
  });

  const [newValue, setNewValue] = useState('');
  const [newValueColor, setNewValueColor] = useState('#000000');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
    
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    }

    if (formData.type === 'select' && formData.values.length === 0) {
      newErrors.values = 'At least one value is required for select type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const addValue = () => {
    if (!newValue.trim()) return;

    const value: AttributeValue = {
      id: `temp-${Date.now()}`,
      value: newValue.trim(),
      slug: generateSlug(newValue.trim()),
      color: formData.type === 'color' ? newValueColor : undefined,
      sortOrder: formData.values.length,
      isActive: true,
    };

    setFormData(prev => ({
      ...prev,
      values: [...prev.values, value],
    }));

    setNewValue('');
    setNewValueColor('#000000');

    if (errors.values) {
      setErrors(prev => ({ ...prev, values: '' }));
    }
  };

  const removeValue = (valueId: string) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.filter(v => v.id !== valueId),
    }));
  };

  const moveValue = (valueId: string, direction: 'up' | 'down') => {
    const values = [...formData.values];
    const index = values.findIndex(v => v.id === valueId);
    
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= values.length) return;
    
    [values[index], values[newIndex]] = [values[newIndex], values[index]];
    
    // Update sort orders
    values.forEach((value, i) => {
      value.sortOrder = i;
    });
    
    setFormData(prev => ({ ...prev, values }));
  };

  const attributeTypes = [
    { 
      value: 'text', 
      label: 'Text', 
      description: 'Free text input (e.g., brand, model)', 
      icon: '📝' 
    },
    { 
      value: 'number', 
      label: 'Number', 
      description: 'Numeric values (e.g., weight, dimensions)', 
      icon: '🔢' 
    },
    { 
      value: 'select', 
      label: 'Select', 
      description: 'Predefined options (e.g., material, style)', 
      icon: '📋' 
    },
    { 
      value: 'boolean', 
      label: 'Boolean', 
      description: 'Yes/No or True/False (e.g., waterproof)', 
      icon: '✅' 
    },
    { 
      value: 'color', 
      label: 'Color', 
      description: 'Color picker with predefined colors', 
      icon: '🎨' 
    },
    { 
      value: 'size', 
      label: 'Size', 
      description: 'Size options (e.g., S, M, L, XL)', 
      icon: '📏' 
    },
  ];

  const showValues = ['select', 'color', 'size'].includes(formData.type);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Color, Size, Material"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="auto-generated-slug"
                className={errors.slug ? 'border-red-500' : ''}
              />
              {errors.slug && (
                <p className="text-sm text-red-500 mt-1">{errors.slug}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Used in URLs and API responses
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this attribute and how it should be used..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="type">Type *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: any) => setFormData(prev => ({ 
                ...prev, 
                type: value,
                values: value === 'select' || value === 'color' || value === 'size' ? prev.values : []
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {attributeTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-start gap-3 py-1">
                      <span className="text-lg">{type.icon}</span>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  sortOrder: parseInt(e.target.value) || 0 
                }))}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="required"
                checked={formData.required}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  required: !!checked 
                }))}
              />
              <Label htmlFor="required">Required field</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  isActive: !!checked 
                }))}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Values Section */}
      {showValues && (
        <Card>
          <CardHeader>
            <CardTitle>Values</CardTitle>
            <p className="text-sm text-muted-foreground">
              Define the available options for this attribute
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add New Value */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Enter value name..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addValue();
                    }
                  }}
                />
              </div>
              
              {formData.type === 'color' && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newValueColor}
                    onChange={(e) => setNewValueColor(e.target.value)}
                    className="w-10 h-10 border rounded cursor-pointer"
                  />
                </div>
              )}
              
              <Button type="button" onClick={addValue} disabled={!newValue.trim()}>
                Add
              </Button>
            </div>

            {errors.values && (
              <p className="text-sm text-red-500">{errors.values}</p>
            )}

            {/* Values List */}
            {formData.values.length > 0 && (
              <div className="space-y-2">
                <Label>Current Values</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {formData.values.map((value, index) => (
                    <div
                      key={value.id}
                      className="flex items-center gap-2 p-2 border rounded-lg"
                    >
                      {formData.type === 'color' && value.color && (
                        <div 
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: value.color }}
                        />
                      )}
                      
                      <div className="flex-1">
                        <div className="font-medium">{value.value}</div>
                        <div className="text-sm text-muted-foreground">
                          {value.slug}
                        </div>
                      </div>

                      <Badge variant="outline">#{index + 1}</Badge>

                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveValue(value.id, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveValue(value.id, 'down')}
                          disabled={index === formData.values.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeValue(value.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : attribute ? 'Update Attribute' : 'Create Attribute'}
        </Button>
      </div>
    </form>
  );
}