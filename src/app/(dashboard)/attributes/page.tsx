// src/app/(dashboard)/attributes/page.tsx
// Attributes Management Page - Manage product attributes and their values

import { Suspense } from 'react';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AttributesTable } from '@/components/attributes/attributes-table';
import { AttributesFilters } from '@/components/attributes/attributes-filters';
import { AttributeForm } from '@/components/attributes/attribute-form';

export const metadata: Metadata = {
  title: 'Attributes | StormCom Dashboard',
  description: 'Manage product attributes and their values for product variations',
};

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

interface AttributeValue {
  id: string;
  value: string;
  slug: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
}

interface AttributesPageProps {
  searchParams: {
    search?: string;
    type?: 'text' | 'number' | 'select' | 'boolean' | 'color' | 'size' | 'all';
    status?: 'active' | 'inactive' | 'all';
    sort?: 'name' | 'type' | 'products' | 'created' | 'updated';
    order?: 'asc' | 'desc';
    page?: string;
    per_page?: string;
    action?: 'create' | 'edit';
    id?: string;
  };
}

// Mock data - replace with actual API call
const mockAttributes: Attribute[] = [
  {
    id: '1',
    name: 'Color',
    slug: 'color',
    type: 'color',
    description: 'Product color variations',
    required: false,
    isActive: true,
    sortOrder: 1,
    productsCount: 125,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    values: [
      { id: '1', value: 'Red', slug: 'red', color: '#FF0000', sortOrder: 1, isActive: true },
      { id: '2', value: 'Blue', slug: 'blue', color: '#0000FF', sortOrder: 2, isActive: true },
      { id: '3', value: 'Green', slug: 'green', color: '#00FF00', sortOrder: 3, isActive: true },
    ],
  },
  {
    id: '2',
    name: 'Size',
    slug: 'size',
    type: 'select',
    description: 'Clothing and shoe sizes',
    required: true,
    isActive: true,
    sortOrder: 2,
    productsCount: 89,
    createdAt: '2024-01-12T08:00:00Z',
    updatedAt: '2024-01-18T09:15:00Z',
    values: [
      { id: '4', value: 'XS', slug: 'xs', sortOrder: 1, isActive: true },
      { id: '5', value: 'S', slug: 's', sortOrder: 2, isActive: true },
      { id: '6', value: 'M', slug: 'm', sortOrder: 3, isActive: true },
      { id: '7', value: 'L', slug: 'l', sortOrder: 4, isActive: true },
      { id: '8', value: 'XL', slug: 'xl', sortOrder: 5, isActive: true },
    ],
  },
  {
    id: '3',
    name: 'Material',
    slug: 'material',
    type: 'select',
    description: 'Product material composition',
    required: false,
    isActive: true,
    sortOrder: 3,
    productsCount: 67,
    createdAt: '2024-01-10T12:00:00Z',
    updatedAt: '2024-01-19T11:20:00Z',
    values: [
      { id: '9', value: 'Cotton', slug: 'cotton', sortOrder: 1, isActive: true },
      { id: '10', value: 'Polyester', slug: 'polyester', sortOrder: 2, isActive: true },
      { id: '11', value: 'Wool', slug: 'wool', sortOrder: 3, isActive: true },
    ],
  },
  {
    id: '4',
    name: 'Weight',
    slug: 'weight',
    type: 'number',
    description: 'Product weight in grams',
    required: false,
    isActive: true,
    sortOrder: 4,
    productsCount: 234,
    createdAt: '2024-01-08T14:00:00Z',
    updatedAt: '2024-01-16T16:45:00Z',
    values: [],
  },
  {
    id: '5',
    name: 'Waterproof',
    slug: 'waterproof',
    type: 'boolean',
    description: 'Is the product waterproof?',
    required: false,
    isActive: false,
    sortOrder: 5,
    productsCount: 12,
    createdAt: '2024-01-05T16:00:00Z',
    updatedAt: '2024-01-05T16:00:00Z',
    values: [],
  },
];

async function getAttributes(searchParams: AttributesPageProps['searchParams']): Promise<{
  attributes: Attribute[];
  totalCount: number;
  totalPages: number;
}> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));
  
  let filteredAttributes = [...mockAttributes];

  // Filter by search
  if (searchParams.search) {
    const search = searchParams.search.toLowerCase();
    filteredAttributes = filteredAttributes.filter(attr =>
      attr.name.toLowerCase().includes(search) ||
      attr.description?.toLowerCase().includes(search) ||
      attr.values.some(value => value.value.toLowerCase().includes(search))
    );
  }

  // Filter by type
  if (searchParams.type && searchParams.type !== 'all') {
    filteredAttributes = filteredAttributes.filter(attr => attr.type === searchParams.type);
  }

  // Filter by status
  if (searchParams.status && searchParams.status !== 'all') {
    const isActive = searchParams.status === 'active';
    filteredAttributes = filteredAttributes.filter(attr => attr.isActive === isActive);
  }

  // Sort
  const sortField = searchParams.sort || 'name';
  const sortOrder = searchParams.order || 'asc';
  
  filteredAttributes.sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'products':
        comparison = a.productsCount - b.productsCount;
        break;
      case 'created':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updated':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      default:
        comparison = a.name.localeCompare(b.name);
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Pagination
  const page = parseInt(searchParams.page || '1');
  const perPage = parseInt(searchParams.per_page || '10');
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  
  const paginatedAttributes = filteredAttributes.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredAttributes.length / perPage);

  return {
    attributes: paginatedAttributes,
    totalCount: filteredAttributes.length,
    totalPages,
  };
}

export default async function AttributesPage({ searchParams }: AttributesPageProps) {
  const { attributes, totalCount, totalPages } = await getAttributes(searchParams);
  const currentPage = parseInt(searchParams.page || '1');
  const perPage = parseInt(searchParams.per_page || '10');

  const isFormOpen = searchParams.action === 'create' || searchParams.action === 'edit';
  const editingAttribute = searchParams.action === 'edit' && searchParams.id 
    ? mockAttributes.find(attr => attr.id === searchParams.id)
    : undefined;

  const activeAttributes = mockAttributes.filter(attr => attr.isActive).length;
  const totalValues = mockAttributes.reduce((sum, attr) => sum + attr.values.length, 0);
  const totalProducts = mockAttributes.reduce((sum, attr) => sum + attr.productsCount, 0);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Product Attributes</h1>
          <p className="text-muted-foreground">
            Manage product attributes and values for variations and specifications
          </p>
        </div>
        <Button>
          ➕ Add Attribute
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              🏷️
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Attributes</p>
              <p className="text-2xl font-bold">{mockAttributes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              ✅
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Attributes</p>
              <p className="text-2xl font-bold">{activeAttributes}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              🎨
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Values</p>
              <p className="text-2xl font-bold">{totalValues}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              📦
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Products Using</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attributes Table */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">All Attributes</h2>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search attributes..."
                  defaultValue={searchParams.search}
                  className="w-64"
                />
                <Button variant="outline">
                  🔍 Search
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Suspense fallback={<div>Loading filters...</div>}>
              <AttributesFilters searchParams={searchParams} />
            </Suspense>

            {/* Attributes Table */}
            <Suspense fallback={<AttributesTableSkeleton />}>
              <AttributesTable
                attributes={attributes}
                currentPage={currentPage}
                totalPages={totalPages}
                perPage={perPage}
                totalCount={totalCount}
                searchParams={searchParams}
              />
            </Suspense>

            {/* Empty State */}
            {attributes.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🏷️</div>
                <h3 className="text-lg font-medium mb-2">No attributes found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchParams.search
                    ? `No attributes match your search "${searchParams.search}"`
                    : 'Create your first attribute to add product variations'}
                </p>
                <Button>Create Attribute</Button>
              </div>
            )}
          </div>
        </div>

        {/* Attribute Form or Info Panel */}
        <div className="lg:col-span-1">
          {isFormOpen ? (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">
                {searchParams.action === 'create' ? 'Create Attribute' : 'Edit Attribute'}
              </h2>
              <AttributeForm
                initialData={editingAttribute}
                onSubmit={async (data: any) => {
                  console.log('Submit attribute:', data);
                }}
                onCancel={() => {
                  // Handle cancel
                }}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Attribute Types */}
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Attribute Types</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      📝
                    </div>
                    <div>
                      <p className="font-medium">Text</p>
                      <p className="text-sm text-muted-foreground">Free text input</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      🔢
                    </div>
                    <div>
                      <p className="font-medium">Number</p>
                      <p className="text-sm text-muted-foreground">Numeric values</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      📋
                    </div>
                    <div>
                      <p className="font-medium">Select</p>
                      <p className="text-sm text-muted-foreground">Dropdown options</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      🎨
                    </div>
                    <div>
                      <p className="font-medium">Color</p>
                      <p className="text-sm text-muted-foreground">Color picker</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      ✅
                    </div>
                    <div>
                      <p className="font-medium">Boolean</p>
                      <p className="text-sm text-muted-foreground">Yes/No toggle</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    🎨 Create Color Attribute
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    📏 Create Size Attribute
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    📦 Create Material Attribute
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    📊 Export Attributes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AttributesTableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="w-4 h-4 bg-muted rounded animate-pulse" />
          <div className="w-8 h-8 bg-muted rounded animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
            <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
          </div>
          <div className="w-16 h-6 bg-muted rounded animate-pulse" />
          <div className="w-20 h-4 bg-muted rounded animate-pulse" />
          <div className="w-24 h-8 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}