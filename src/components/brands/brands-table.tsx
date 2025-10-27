// src/components/brands/brands-table.tsx
// Brands Table Component - Data table with sorting, pagination, and actions

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  productsCount: number;
  sortOrder: number;
  seo: {
    title?: string;
    description?: string;
    keywords?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BrandsTableProps {
  brands: Brand[];
  currentPage: number;
  totalPages: number;
  perPage: number;
  totalCount: number;
  searchParams: {
    search?: string;
    status?: 'active' | 'inactive' | 'all';
    sort?: 'name' | 'products' | 'created' | 'updated';
    order?: 'asc' | 'desc';
    page?: string;
    per_page?: string;
  };
}

export function BrandsTable({
  brands,
  currentPage,
  totalPages,
  perPage,
  totalCount,
  searchParams,
}: BrandsTableProps) {
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());

  const toggleBrandSelection = (brandId: string) => {
    setSelectedBrands(prev => {
      const newSet = new Set(prev);
      if (newSet.has(brandId)) {
        newSet.delete(brandId);
      } else {
        newSet.add(brandId);
      }
      return newSet;
    });
  };

  const toggleAllSelection = () => {
    if (selectedBrands.size === brands.length) {
      setSelectedBrands(new Set());
    } else {
      setSelectedBrands(new Set(brands.map(brand => brand.id)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
                  checked={selectedBrands.size === brands.length && brands.length > 0}
                  onCheckedChange={toggleAllSelection}
                />
              </th>
              <th className="p-3 text-left">Brand</th>
              <th className="p-3 text-left">
                <button
                  className="flex items-center gap-1 hover:text-primary"
                  onClick={() => window.location.href = createSortUrl('name')}
                >
                  Name {getSortIcon('name')}
                </button>
              </th>
              <th className="p-3 text-left">
                <button
                  className="flex items-center gap-1 hover:text-primary"
                  onClick={() => window.location.href = createSortUrl('products')}
                >
                  Products {getSortIcon('products')}
                </button>
              </th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Website</th>
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
            {brands.map((brand) => (
              <tr
                key={brand.id}
                className={`border-b hover:bg-muted/25 ${
                  selectedBrands.has(brand.id) ? 'bg-muted/50' : ''
                }`}
              >
                <td className="p-3">
                  <Checkbox
                    checked={selectedBrands.has(brand.id)}
                    onCheckedChange={() => toggleBrandSelection(brand.id)}
                  />
                </td>
                
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden relative">
                      {brand.logo ? (
                        <Image
                          src={brand.logo}
                          alt={brand.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-lg">🏷️</span>
                      )}
                    </div>
                  </div>
                </td>

                <td className="p-3">
                  <div>
                    <div className="font-medium">{brand.name}</div>
                    {brand.description && (
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {brand.description}
                      </div>
                    )}
                  </div>
                </td>

                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{brand.productsCount}</span>
                    <span className="text-muted-foreground text-sm">products</span>
                  </div>
                </td>

                <td className="p-3">
                  <Badge variant={brand.isActive ? 'success' : 'secondary'}>
                    {brand.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>

                <td className="p-3">
                  {brand.website ? (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      🔗 Visit
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </td>

                <td className="p-3">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(brand.updatedAt)}
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
            Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalCount)} of {totalCount} brands
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
      {selectedBrands.size > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
          {selectedBrands.size} brand{selectedBrands.size > 1 ? 's' : ''} selected
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 text-primary-foreground hover:text-primary-foreground"
            onClick={() => setSelectedBrands(new Set())}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}