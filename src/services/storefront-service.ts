/**
 * StorefrontService
 * 
 * Handles public-facing product catalog operations for customer browsing.
 * Filters for published/active products only and supports search, filtering, and category navigation.
 * 
 * Key Features:
 * - Public product listing (no authentication required)
 * - Published products only (status='PUBLISHED', isActive=true)
 * - Multi-tenant isolation (filter by storeId)
 * - Search and filter capabilities
 * - Category navigation with breadcrumbs
 * - Product detail with variants and images
 */

import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

/**
 * Options for filtering storefront products
 */
export interface StorefrontProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'popular';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}

/**
 * Product with related data for storefront display
 */
export interface StorefrontProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  images: string; // JSON array of URLs
  thumbnailUrl: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brand: {
    id: string;
    name: string;
    slug: string;
  } | null;
  variants: Array<{
    id: string;
    name: string;
    sku: string;
    price: number | null; // Nullable in schema
  }>;
  inventoryQty: number;
  lowStockThreshold: number;
  inventoryStatus: string;
  inStock: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Category with product count
 */
export interface StorefrontCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
  productCount: number;
  children?: StorefrontCategory[];
}

/**
 * Paginated product listing result
 */
export interface StorefrontProductList {
  products: StorefrontProduct[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/**
 * Get published products for storefront with filtering and pagination
 */
export async function getPublishedProducts(
  storeId: string,
  filters: StorefrontProductFilters = {}
): Promise<StorefrontProductList> {
  const {
    search,
    categoryId,
    minPrice,
    maxPrice,
    inStock,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    perPage = 12,
  } = filters;

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    storeId,
    isPublished: true,
    deletedAt: null,
  };

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  // Category filter
  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) {
      where.price.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      where.price.lte = maxPrice;
    }
  }

  // Stock filter - only show in-stock products
  if (inStock) {
    where.inventoryQty = { gt: 0 };
  }

  // Build order by clause
  let orderBy: Prisma.ProductOrderByWithRelationInput = {};
  switch (sortBy) {
    case 'name':
      orderBy = { name: sortOrder };
      break;
    case 'price':
      orderBy = { price: sortOrder };
      break;
    case 'createdAt':
      orderBy = { createdAt: sortOrder };
      break;
    case 'popular':
      // TODO: Implement popularity sorting based on order count or views
      orderBy = { createdAt: 'desc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  // Calculate pagination
  const skip = (page - 1) * perPage;
  const take = Math.min(perPage, 100); // Max 100 items per page

  // Execute queries in parallel
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
          },
        },
      },
      orderBy,
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  // Transform products with computed fields
  const transformedProducts = products.map((product) => ({
    ...product,
    inStock: product.inventoryQty > 0,
  })) as StorefrontProduct[];

  return {
    products: transformedProducts,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

/**
 * Get single product by slug for detail page
 */
export async function getProductBySlug(
  storeId: string,
  slug: string
): Promise<StorefrontProduct | null> {
  const product = await prisma.product.findFirst({
    where: {
      storeId,
      slug,
      isPublished: true,
      deletedAt: null,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      variants: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  return {
    ...product,
    inStock: product.inventoryQty > 0,
  } as StorefrontProduct;
}

/**
 * Get category tree with product counts for navigation
 */
export async function getCategoryTree(storeId: string): Promise<StorefrontCategory[]> {
  const categories = await prisma.category.findMany({
    where: {
      storeId,
      isPublished: true,
      deletedAt: null,
    },
    orderBy: { sortOrder: 'asc' },
  });

  // Get product counts for each category
  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const productCount = await prisma.product.count({
        where: {
          storeId,
          categoryId: category.id,
          isPublished: true,
          deletedAt: null,
        },
      });

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        parentId: category.parentId,
        sortOrder: category.sortOrder,
        productCount,
      };
    })
  );

  // Build tree structure (root categories with children)
  const rootCategories = categoriesWithCounts.filter((cat) => !cat.parentId);
  const childCategories = categoriesWithCounts.filter((cat) => cat.parentId);

  return rootCategories.map((root) => ({
    ...root,
    children: childCategories.filter((child) => child.parentId === root.id),
  }));
}

/**
 * Get category by slug with breadcrumbs
 */
export async function getCategoryBySlug(
  storeId: string,
  slug: string
): Promise<(StorefrontCategory & { breadcrumbs: Array<{ name: string; slug: string }> }) | null> {
  const category = await prisma.category.findFirst({
    where: {
      storeId,
      slug,
      isPublished: true,
      deletedAt: null,
    },
  });

  if (!category) {
    return null;
  }

  // Get product count
  const productCount = await prisma.product.count({
    where: {
      storeId,
      categoryId: category.id,
      isPublished: true,
      deletedAt: null,
    },
  });

  // Build breadcrumbs (parent hierarchy)
  // Limit depth to prevent infinite loops
  const breadcrumbs: Array<{ name: string; slug: string }> = [];
  let currentCategory = category;
  const maxDepth = 10;
  let depth = 0;

  while (currentCategory.parentId && depth < maxDepth) {
    const parent = await prisma.category.findUnique({
      where: { id: currentCategory.parentId },
    });

    if (parent) {
      breadcrumbs.unshift({ name: parent.name, slug: parent.slug });
      currentCategory = parent;
      depth++;
    } else {
      break;
    }
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
    parentId: category.parentId,
    sortOrder: category.sortOrder,
    productCount,
    breadcrumbs,
  };
}

/**
 * Get featured products for homepage
 * @param limit Maximum number of products (1-100, default 8)
 */
export async function getFeaturedProducts(
  storeId: string,
  limit: number = 8
): Promise<StorefrontProduct[]> {
  // Validate and cap limit
  const safeLimit = Math.min(Math.max(1, limit), 100);

  const products = await prisma.product.findMany({
    where: {
      storeId,
      isPublished: true,
      isFeatured: true,
      deletedAt: null,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      variants: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: safeLimit,
  });

  return products.map((product) => ({
    ...product,
    inStock: product.inventoryQty > 0,
  })) as StorefrontProduct[];
}

/**
 * Get related products based on category
 * @param limit Maximum number of products (1-100, default 4)
 */
export async function getRelatedProducts(
  storeId: string,
  productId: string,
  limit: number = 4
): Promise<StorefrontProduct[]> {
  // Validate and cap limit
  const safeLimit = Math.min(Math.max(1, limit), 100);

  // Get current product to find related items
  const currentProduct = await prisma.product.findUnique({
    where: { id: productId },
    select: { categoryId: true },
  });

  if (!currentProduct || !currentProduct.categoryId) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      storeId,
      id: { not: productId },
      categoryId: currentProduct.categoryId,
      isPublished: true,
      deletedAt: null,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      variants: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
        },
      },
    },
    take: safeLimit,
  });

  return products.map((product) => ({
    ...product,
    inStock: product.inventoryQty > 0,
  })) as StorefrontProduct[];
}
