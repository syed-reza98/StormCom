// src/app/(dashboard)/brands/page.tsx
// Brands Management Page - List view with search, filtering, and CRUD operations

import { Suspense } from 'react';
import { Metadata } from 'next';
import { Flex, Heading, Text, Container, Section } from '@radix-ui/themes';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FileTextIcon,
  CheckCircledIcon,
  ArchiveIcon,
  BarChartIcon
} from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandsTable } from '@/components/brands/brands-table';
import { BrandsFilters } from '@/components/brands/brands-filters';
import { BrandsBulkActions } from '@/components/brands/brands-bulk-actions';

export const metadata: Metadata = {
  title: 'Brands | StormCom Dashboard',
  description: 'Manage product brands with search, filtering, and bulk operations',
};

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

interface BrandsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: 'active' | 'inactive' | 'all';
    sort?: 'name' | 'products' | 'created' | 'updated';
    order?: 'asc' | 'desc';
    page?: string;
    per_page?: string;
  }>;
}

// Mock data - replace with actual API call
const mockBrands: Brand[] = [
  {
    id: '1',
    name: 'Apple',
    slug: 'apple',
    description: 'Technology company known for innovative products',
    logo: '/brands/apple-logo.png',
    website: 'https://apple.com',
    isActive: true,
    productsCount: 45,
    sortOrder: 1,
    seo: {
      title: 'Apple Products | StormCom',
      description: 'Shop the latest Apple products including iPhone, iPad, MacBook and more.',
      keywords: 'apple, iphone, ipad, macbook, technology',
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
  },
  {
    id: '2',
    name: 'Samsung',
    slug: 'samsung',
    description: 'Global technology leader in electronics and semiconductors',
    logo: '/brands/samsung-logo.png',
    website: 'https://samsung.com',
    isActive: true,
    productsCount: 38,
    sortOrder: 2,
    seo: {
      title: 'Samsung Products | StormCom',
      description: 'Discover Samsung smartphones, tablets, TVs, and home appliances.',
      keywords: 'samsung, galaxy, smartphone, tv, electronics',
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-18T09:15:00Z',
  },
  {
    id: '3',
    name: 'Nike',
    slug: 'nike',
    description: 'Leading sports and athletic wear brand',
    logo: '/brands/nike-logo.png',
    website: 'https://nike.com',
    isActive: true,
    productsCount: 124,
    sortOrder: 3,
    seo: {
      title: 'Nike Athletic Wear | StormCom',
      description: 'Shop Nike shoes, clothing, and athletic gear for all sports.',
      keywords: 'nike, shoes, athletic wear, sports, sneakers',
    },
    createdAt: '2024-01-12T08:00:00Z',
    updatedAt: '2024-01-22T16:45:00Z',
  },
  {
    id: '4',
    name: 'Adidas',
    slug: 'adidas',
    description: 'German multinational corporation that designs and manufactures shoes, clothing and accessories',
    logo: '/brands/adidas-logo.png',
    website: 'https://adidas.com',
    isActive: true,
    productsCount: 89,
    sortOrder: 4,
    seo: {
      title: 'Adidas Sports Gear | StormCom',
      description: 'Browse Adidas shoes, apparel, and sports equipment.',
      keywords: 'adidas, sports, shoes, apparel, athletic',
    },
    createdAt: '2024-01-10T12:00:00Z',
    updatedAt: '2024-01-19T11:20:00Z',
  },
  {
    id: '5',
    name: 'Vintage Co.',
    slug: 'vintage-co',
    description: 'Premium vintage clothing and accessories',
    isActive: false,
    productsCount: 0,
    sortOrder: 5,
    seo: {},
    createdAt: '2024-01-05T14:00:00Z',
    updatedAt: '2024-01-05T14:00:00Z',
  },
];

async function getBrands(searchParamsPromise: BrandsPageProps['searchParams']): Promise<{
  brands: Brand[];
  totalCount: number;
  totalPages: number;
}> {
  // Await searchParams (Next.js 16 requirement)
  const searchParams = await searchParamsPromise;
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));
  
  let filteredBrands = [...mockBrands];

  // Filter by search
  if (searchParams.search) {
    const search = searchParams.search.toLowerCase();
    filteredBrands = filteredBrands.filter(brand =>
      brand.name.toLowerCase().includes(search) ||
      brand.description?.toLowerCase().includes(search) ||
      brand.website?.toLowerCase().includes(search)
    );
  }

  // Filter by status
  if (searchParams.status && searchParams.status !== 'all') {
    const isActive = searchParams.status === 'active';
    filteredBrands = filteredBrands.filter(brand => brand.isActive === isActive);
  }

  // Sort
  const sortField = searchParams.sort || 'name';
  const sortOrder = searchParams.order || 'asc';
  
  filteredBrands.sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
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
  
  const paginatedBrands = filteredBrands.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredBrands.length / perPage);

  return {
    brands: paginatedBrands,
    totalCount: filteredBrands.length,
    totalPages,
  };
}

export default async function BrandsPage({ searchParams }: BrandsPageProps) {
  const { brands, totalCount, totalPages } = await getBrands(searchParams);
  const params = await searchParams;
  const currentPage = parseInt(params.page || '1');
  const perPage = parseInt(params.per_page || '10');

  const activeBrands = mockBrands.filter(brand => brand.isActive).length;
  const totalProducts = mockBrands.reduce((sum, brand) => sum + brand.productsCount, 0);

  return (
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          <Flex justify="between" align="start">
            <Flex direction="column" gap="2">
              <Flex align="center" gap="3">
                <FileTextIcon width="32" height="32" color="teal" />
                <Heading size="8">Brands</Heading>
              </Flex>
              <Text size="3" color="gray">
                Manage product brands and their information
              </Text>
            </Flex>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Brand
            </Button>
          </Flex>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileTextIcon width="20" height="20" color="blue" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Brands</p>
              <p className="text-2xl font-bold">{mockBrands.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircledIcon width="20" height="20" color="green" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Brands</p>
              <p className="text-2xl font-bold">{activeBrands}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ArchiveIcon width="20" height="20" color="purple" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChartIcon width="20" height="20" color="orange" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Products/Brand</p>
              <p className="text-2xl font-bold">
                {activeBrands > 0 ? Math.round(totalProducts / activeBrands) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">All Brands</h2>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search brands..."
                defaultValue={params.search}
                className="w-64"
              />
              <Button variant="outline">
                <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Suspense fallback={<div>Loading filters...</div>}>
            <BrandsFilters searchParams={params} />
          </Suspense>

          {/* Bulk Actions */}
          <Suspense fallback={<div>Loading bulk actions...</div>}>
            <BrandsBulkActions />
          </Suspense>

          {/* Brands Table */}
          <Suspense fallback={<BrandsTableSkeleton />}>
            <BrandsTable
              brands={brands}
              currentPage={currentPage}
              totalPages={totalPages}
              perPage={perPage}
              totalCount={totalCount}
              searchParams={params}
            />
          </Suspense>

          {/* Empty State */}
          {brands.length === 0 && (
            <div className="text-center py-12">
              <FileTextIcon width="48" height="48" className="mx-auto mb-4" color="gray" />
              <h3 className="text-lg font-medium mb-2">No brands found</h3>
              <p className="text-muted-foreground mb-4">
                {params.search
                  ? `No brands match your search "${params.search}"`
                  : 'Create your first brand to organize your products'}
              </p>
              <Button>Create Brand</Button>
            </div>
          )}
        </div>
      </div>
    </Flex>
  </Container>
</Section>
  );
}

function BrandsTableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="w-4 h-4 bg-muted rounded animate-pulse" />
          <div className="w-12 h-12 bg-muted rounded animate-pulse" />
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