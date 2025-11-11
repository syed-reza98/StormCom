// src/components/attributes/attributes-table.tsx
// Attributes Table Component - Data table for managing attributes

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface AttributeValue {
  id: string;
  value: string;
  slug: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
}

interface Attribute {
  id: string;
  name: string;
  slug: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'color' | 'size';
  description?: string;
  required: boolean;
  isActive: boolean;
  sortOrder: number;
  values: AttributeValue[];
  productsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AttributesTableProps {
  attributes: Attribute[];
  currentPage: number;
  totalPages: number;
  perPage: number;
  totalCount: number;
  searchParams: {
    search?: string;
    type?: string;
    status?: string;
    sort?: string;
    order?: string;
    page?: string;
    per_page?: string;
  };
}

export function AttributesTable({
  attributes,
  currentPage,
  totalPages,
  perPage,
  totalCount,
  searchParams,
}: AttributesTableProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<Set<string>>(new Set());

  const toggleAttributeSelection = (attributeId: string) => {
    setSelectedAttributes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(attributeId)) {
        newSet.delete(attributeId);
      } else {
        newSet.add(attributeId);
      }
      return newSet;
    });
  };

  const toggleAllSelection = () => {
    if (selectedAttributes.size === attributes.length) {
      setSelectedAttributes(new Set());
    } else {
      setSelectedAttributes(new Set(attributes.map(attr => attr.id)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'number': return '🔢';
      case 'select': return '📋';
      case 'boolean': return '✅';
      case 'color': return '🎨';
      case 'size': return '📏';
      default: return '🏷️';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getSortIcon = (field: string) => {
    if (searchParams.sort !== field) return '↕️';
    return searchParams.order === 'desc' ? '↓' : '↑';
  };

  const createSortUrl = (field: string) => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    params.set('sort', field);
    
    if (searchParams.sort === field) {
      params.set('order', searchParams.order === 'desc' ? 'asc' : 'desc');
    } else {
      params.set('order', 'asc');
    }
    
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="border rounded-lg">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-left">
                <Checkbox
                  checked={selectedAttributes.size === attributes.length && attributes.length > 0}
                  onCheckedChange={toggleAllSelection}
                />
              </th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">
                <button
                  className="flex items-center gap-1 hover:text-primary"
                  onClick={() => window.location.href = createSortUrl('name')}
                >
                  Name {getSortIcon('name')}
                </button>
              </th>
              <th className="p-3 text-left">Values</th>
              <th className="p-3 text-left">
                <button
                  className="flex items-center gap-1 hover:text-primary"
                  onClick={() => window.location.href = createSortUrl('products')}
                >
                  Products {getSortIcon('products')}
                </button>
              </th>
              <th className="p-3 text-left">Required</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">
                <button
                  className="flex items-center gap-1 hover:text-primary"
                  onClick={() => window.location.href = createSortUrl('updated')}
                >
                  Updated {getSortIcon('updated')}
                </button>
              </th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {attributes.map((attribute) => (
              <tr
                key={attribute.id}
                className={`border-b hover:bg-muted/25 ${
                  selectedAttributes.has(attribute.id) ? 'bg-muted/50' : ''
                }`}
              >
                <td className="p-3">
                  <Checkbox
                    checked={selectedAttributes.has(attribute.id)}
                    onCheckedChange={() => toggleAttributeSelection(attribute.id)}
                  />
                </td>
                
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTypeIcon(attribute.type)}</span>
                    <span className="text-sm">{getTypeLabel(attribute.type)}</span>
                  </div>
                </td>

                <td className="p-3">
                  <div>
                    <div className="font-medium">{attribute.name}</div>
                    {attribute.description && (
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {attribute.description}
                      </div>
                    )}
                  </div>
                </td>

                <td className="p-3">
                  <div className="flex items-center gap-1">
                    {attribute.values.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {attribute.values.slice(0, 3).map(value => (
                          <Badge key={value.id} variant="outline" className="text-xs">
                            {attribute.type === 'color' && value.color && (
                              <div 
                                className="w-3 h-3 rounded-full mr-1 border"
                                style={{ backgroundColor: value.color }}
                              />
                            )}
                            {value.value}
                          </Badge>
                        ))}
                        {attribute.values.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{attribute.values.length - 3} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No values</span>
                    )}
                  </div>
                </td>

                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{attribute.productsCount}</span>
                    <span className="text-muted-foreground text-sm">products</span>
                  </div>
                </td>

                <td className="p-3">
                  <Badge variant={attribute.required ? 'destructive' : 'secondary'}>
                    {attribute.required ? 'Required' : 'Optional'}
                  </Badge>
                </td>

                <td className="p-3">
                  <Badge variant={attribute.isActive ? 'success' : 'secondary'}>
                    {attribute.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>

                <td className="p-3">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(attribute.updatedAt)}
                  </span>
                </td>

                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      👁️
                    </Button>
                    <Button variant="ghost" size="sm">
                      ✏️
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                      🗑️
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalCount)} of {totalCount} attributes
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams as Record<string, string>);
                params.set('page', String(currentPage - 1));
                window.location.href = `?${params.toString()}`;
              }}
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, currentPage - 2) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams as Record<string, string>);
                      params.set('page', String(pageNum));
                      window.location.href = `?${params.toString()}`;
                    }}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams as Record<string, string>);
                params.set('page', String(currentPage + 1));
                window.location.href = `?${params.toString()}`;
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedAttributes.size > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
          {selectedAttributes.size} attribute{selectedAttributes.size > 1 ? 's' : ''} selected
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 text-primary-foreground hover:text-primary-foreground"
            onClick={() => setSelectedAttributes(new Set())}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}