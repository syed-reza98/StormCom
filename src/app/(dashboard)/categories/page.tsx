// src/app/(dashboard)/categories/page.tsx
// Categories Management Page - Tree view with CRUD operations and drag-and-drop reordering

import { Suspense } from 'react';
import { Metadata } from 'next';
import { Flex, Heading, Text, Container, Section } from '@radix-ui/themes';
import { 
  PlusIcon, 
  ArchiveIcon, 
  DownloadIcon, 
  UploadIcon, 
  UpdateIcon
} from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CategoriesTree } from '@/components/categories/categories-tree';
import { CategoryForm } from '@/components/categories/category-form';

export const metadata: Metadata = {
  title: 'Categories | StormCom Dashboard',
  description: 'Manage product categories with tree view and drag-and-drop reordering',
};

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

interface CategoriesPageProps {
  searchParams: {
    search?: string;
    status?: 'active' | 'inactive' | 'all';
    parent?: string;
    action?: 'create' | 'edit';
    id?: string;
  };
}

// Mock data - replace with actual API call
const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Electronic devices and accessories',
    sortOrder: 1,
    isActive: true,
    productsCount: 45,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    children: [
      {
        id: '2',
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Mobile phones and accessories',
        parentId: '1',
        sortOrder: 1,
        isActive: true,
        productsCount: 25,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '3',
        name: 'Laptops',
        slug: 'laptops',
        description: 'Laptops and computer accessories',
        parentId: '1',
        sortOrder: 2,
        isActive: true,
        productsCount: 20,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
    ],
  },
  {
    id: '4',
    name: 'Clothing',
    slug: 'clothing',
    description: 'Fashion and apparel',
    sortOrder: 2,
    isActive: true,
    productsCount: 78,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    children: [
      {
        id: '5',
        name: 'Men\'s Clothing',
        slug: 'mens-clothing',
        description: 'Clothing for men',
        parentId: '4',
        sortOrder: 1,
        isActive: true,
        productsCount: 35,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '6',
        name: 'Women\'s Clothing',
        slug: 'womens-clothing',
        description: 'Clothing for women',
        parentId: '4',
        sortOrder: 2,
        isActive: true,
        productsCount: 43,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
    ],
  },
  {
    id: '7',
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Home improvement and garden supplies',
    sortOrder: 3,
    isActive: false,
    productsCount: 12,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
];

async function getCategories(searchParams: CategoriesPageProps['searchParams']): Promise<Category[]> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));
  
  let filteredCategories = [...mockCategories];

  // Filter by search
  if (searchParams.search) {
    const search = searchParams.search.toLowerCase();
    filteredCategories = filteredCategories.filter(category =>
      category.name.toLowerCase().includes(search) ||
      category.description?.toLowerCase().includes(search)
    );
  }

  // Filter by status
  if (searchParams.status && searchParams.status !== 'all') {
    const isActive = searchParams.status === 'active';
    filteredCategories = filteredCategories.filter(category => category.isActive === isActive);
  }

  return filteredCategories;
}

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<CategoriesPageProps['searchParams']> }) {
  const params = await searchParams;
  const categories = await getCategories(params);
  const isFormOpen = params.action === 'create' || params.action === 'edit';
  const editingCategory = params.action === 'edit' && params.id 
    ? mockCategories.find(cat => cat.id === params.id)
    : undefined;

  return (
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          <Flex justify="between" align="start">
            <Flex direction="column" gap="2">
              <Flex align="center" gap="3">
                <ArchiveIcon width="32" height="32" color="teal" />
                <Heading size="8">Categories</Heading>
              </Flex>
              <Text size="3" color="gray">
                Manage your product categories with hierarchical organization
              </Text>
            </Flex>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </Flex>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Categories Tree */}
            <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Category Tree</h2>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search categories..."
                  defaultValue={params.search}
                  className="w-64"
                />
                <select
                  aria-label="Filter by status"
                  defaultValue={params.status || 'all'}
                  className="px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="all">All Categories</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            <Suspense fallback={<CategoriesTreeSkeleton />}>
              <CategoriesTree categories={categories} />
            </Suspense>
          </div>
        </div>

        {/* Category Form */}
        <div className="lg:col-span-1">
          {isFormOpen ? (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">
                {params.action === 'create' ? 'Create Category' : 'Edit Category'}
              </h2>
              <CategoryForm
                initialData={editingCategory}
                categories={categories}
                onSubmit={async (_data: any) => {
                  // TODO: Implement category submission
                }}
                onCancel={() => {
                  // Handle cancel
                }}
              />
            </div>
          ) : (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Category Stats</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Categories</span>
                  <span className="font-semibold">{categories.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Categories</span>
                  <span className="font-semibold">
                    {categories.filter(cat => cat.isActive).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Products</span>
                  <span className="font-semibold">
                    {categories.reduce((sum, cat) => sum + cat.productsCount, 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Root Categories</span>
                  <span className="font-semibold">
                    {categories.filter(cat => !cat.parentId).length}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-medium mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <ArchiveIcon className="mr-2 h-4 w-4" />
                    Create Root Category
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Export Categories
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Import Categories
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <UpdateIcon className="mr-2 h-4 w-4" />
                    Bulk Update
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
        </Flex>
      </Container>
    </Section>
  );
}

function CategoriesTreeSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-muted rounded animate-pulse" />
          <div className="w-6 h-6 bg-muted rounded animate-pulse" />
          <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
          <div className="w-16 h-4 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}