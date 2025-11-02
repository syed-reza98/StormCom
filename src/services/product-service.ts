// src/services/product-service.ts
// Product Management Service
// Provides CRUD operations, validation, and business logic for products

import { prisma } from '@/lib/db';
import { InventoryStatus, Product, ProductVariant, Prisma } from '@prisma/client';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export interface ProductWithRelations extends Product {
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brand?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  variants: ProductVariant[];
  _count?: {
    orderItems: number;
    reviews: number;
    wishlistItems: number;
  };
}

export interface ProductSearchFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inventoryStatus?: InventoryStatus;
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListResult {
  products: ProductWithRelations[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// Validation schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format').optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  compareAtPrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  sku: z.string().min(1, 'SKU is required').max(100),
  barcode: z.string().max(100).optional(),
  trackInventory: z.boolean().default(true),
  inventoryQty: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  weight: z.number().min(0).optional(),
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  categoryId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  images: z.array(z.string().url()).default([]),
  thumbnailUrl: z.string().url().optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  metaKeywords: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateProductData = z.infer<typeof createProductSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;

// ============================================================================
// PRODUCT SERVICE CLASS
// ============================================================================

export class ProductService {
  private static instance: ProductService;

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Get products with filtering, pagination, and search
   */
  async getProducts(
    storeId: string,
    filters: ProductSearchFilters = {},
    page: number = 1,
    perPage: number = 10
  ): Promise<ProductListResult> {
    const where = this.buildWhereClause(storeId, filters);
    const orderBy = this.buildOrderByClause(filters.sortBy, filters.sortOrder);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          brand: {
            select: { id: true, name: true, slug: true },
          },
          variants: {
            
            orderBy: { isDefault: 'desc' },
          },
          _count: {
            select: {
              orderItems: true,
              reviews: true,
              wishlistItems: true,
            },
          },
        },
        orderBy,
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      prisma.product.count({ where }),
    ]);

    // Normalize fields for consumers (images/metaKeywords)
    const normalized = products.map((p) => this.normalizeProductFields(p));

    return {
      products: normalized as unknown as ProductWithRelations[],
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get single product by ID
   */
  async getProductById(productId: string, storeId: string): Promise<ProductWithRelations | null> {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
        deletedAt: null,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        variants: {
          
          orderBy: { isDefault: 'desc' },
        },
        attributes: {
          include: {
            attribute: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
            wishlistItems: true,
          },
        },
      },
    });

    if (!product) return null;

    return this.normalizeProductFields(product) as unknown as ProductWithRelations;
  }

  /**
   * Get product by slug
   */
  async getProductBySlug(slug: string, storeId: string): Promise<ProductWithRelations | null> {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        storeId,
        deletedAt: null,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        variants: {
          
          orderBy: { isDefault: 'desc' },
        },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
            wishlistItems: true,
          },
        },
      },
    });

    if (!product) return null;

    return this.normalizeProductFields(product) as unknown as ProductWithRelations;
  }
  /**
   * Get total product count for a store
   */
  async getTotalProductCount(storeId: string): Promise<number> {
    return prisma.product.count({
      where: {
        storeId,
        deletedAt: null,
      },
    });
  }

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Create a new product
   */
  async createProduct(storeId: string, data: CreateProductData): Promise<ProductWithRelations> {
    // Validate input
    const validatedData = createProductSchema.parse(data);
    
    // Generate slug if not provided (required by Prisma)
    const slug = validatedData.slug || await this.generateUniqueSlug(storeId, validatedData.name);

    // Validate business rules
    await this.validateBusinessRules(storeId, { ...validatedData, slug });

    // Update inventory status based on quantity
    const inventoryStatus = this.calculateInventoryStatus(
      validatedData.inventoryQty,
      validatedData.lowStockThreshold
    );

    const product = await prisma.product.create({
      data: {
        ...validatedData,
        slug,
        storeId,
        inventoryStatus,
        images: JSON.stringify(validatedData.images),
        metaKeywords: JSON.stringify(validatedData.metaKeywords),
        publishedAt: validatedData.isPublished ? new Date() : null,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        variants: true,
        attributes: {
          include: {
            attribute: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
            wishlistItems: true,
          },
        },
      },
    });

    return this.normalizeProductFields(product) as unknown as ProductWithRelations;
  }

  /**
   * Update an existing product
   */
  async updateProduct(productId: string, storeId: string, data: Partial<CreateProductData>): Promise<ProductWithRelations> {
    // Validate input
    const validatedData = updateProductSchema.parse({ ...data, id: productId });
    
    // Check if product exists
    const existingProduct = await this.getProductById(productId, storeId);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Generate new slug if name changed but slug not provided
    if (validatedData.name && validatedData.name !== existingProduct.name && !validatedData.slug) {
      validatedData.slug = await this.generateUniqueSlug(storeId, validatedData.name, productId);
    }

    // Validate business rules
    await this.validateBusinessRules(storeId, validatedData, productId);

    // Update inventory status if quantity changed
    let inventoryStatus = existingProduct.inventoryStatus;
    if (validatedData.inventoryQty !== undefined) {
      const lowStockThreshold = validatedData.lowStockThreshold ?? existingProduct.lowStockThreshold;
      inventoryStatus = this.calculateInventoryStatus(validatedData.inventoryQty, lowStockThreshold);
    }

    // Prepare update data
    const updateData: any = {
      ...validatedData,
      inventoryStatus,
    };

    // Handle JSON fields
    if (validatedData.images) {
      updateData.images = JSON.stringify(validatedData.images);
    }
    if (validatedData.metaKeywords) {
      updateData.metaKeywords = JSON.stringify(validatedData.metaKeywords);
    }

    // Handle published status
    if (validatedData.isPublished === true && !existingProduct.publishedAt) {
      updateData.publishedAt = new Date();
    } else if (validatedData.isPublished === false) {
      updateData.publishedAt = null;
    }

    // Remove id from update data
    delete updateData.id;

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        variants: {
          
          orderBy: { isDefault: 'desc' },
        },
        attributes: {
          include: {
            attribute: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
            wishlistItems: true,
          },
        },
      },
    });

    return this.normalizeProductFields(product) as unknown as ProductWithRelations;
  }

  /**
   * Soft delete a product
   */
  async deleteProduct(productId: string, storeId: string): Promise<void> {
    const product = await this.getProductById(productId, storeId);
    if (!product) {
      throw new Error('Product not found');
    }

    await prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Permanently delete a product (admin only)
   */
  async permanentlyDeleteProduct(productId: string, storeId: string): Promise<void> {
    const product = await this.getProductById(productId, storeId);
    if (!product) {
      throw new Error('Product not found');
    }

    await prisma.product.delete({
      where: { id: productId },
    });
  }

  // --------------------------------------------------------------------------
  // INVENTORY MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Update product inventory
   */
  async updateInventory(
    productId: string,
    storeId: string,
    quantity: number,
    reason: string = 'Manual adjustment'
  ): Promise<ProductWithRelations> {
    const product = await this.getProductById(productId, storeId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.trackInventory) {
      throw new Error('Inventory tracking is disabled for this product');
    }

    const newQuantity = Math.max(0, quantity);
    const inventoryStatus = this.calculateInventoryStatus(newQuantity, product.lowStockThreshold);

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        inventoryQty: newQuantity,
        inventoryStatus,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        variants: {
          
          orderBy: { isDefault: 'desc' },
        },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
            wishlistItems: true,
          },
        },
      },
    });

    // Log inventory change
    await prisma.inventoryLog.create({
      data: {
        productId,
        storeId,
        previousQty: product.inventoryQty,
        newQty: newQuantity,
        changeQty: newQuantity - product.inventoryQty,
        reason,
        userId: null, // System change, no specific user
      },
    });

    return this.normalizeProductFields(updatedProduct) as unknown as ProductWithRelations;
  }

  // --------------------------------------------------------------------------
  // HELPER METHODS
  // --------------------------------------------------------------------------

  /**
   * Normalize product fields returned from the database to application-friendly shapes.
   * - `images` and `metaKeywords` are stored as JSON strings in the DB for legacy reasons.
   * - This helper parses them into arrays and provides sensible fallbacks (thumbnailUrl).
   */
  private normalizeProductFields(product: any) {
    if (!product) return product;

    const p: any = { ...product };

    // Normalize images: JSON string -> string[]; if it's a single URL string, wrap it
    try {
      if (typeof p.images === 'string') {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { logger } = require('@/lib/logger');
        logger?.debug && logger.debug('normalizeProductFields: parsing images string for product id=', p.id);
        const parsed = JSON.parse(p.images);
        p.images = Array.isArray(parsed) ? parsed : (p.images ? [p.images] : []);
      } else if (!Array.isArray(p.images)) {
        p.images = [];
      }
    } catch (e) {
      // If parse fails, treat as single image URL or empty
      p.images = p.images ? [String(p.images)] : [];
    }

    // Normalize metaKeywords
    try {
      if (typeof p.metaKeywords === 'string') {
        const parsed = JSON.parse(p.metaKeywords);
        p.metaKeywords = Array.isArray(parsed) ? parsed : (p.metaKeywords ? [p.metaKeywords] : []);
      } else if (!Array.isArray(p.metaKeywords)) {
        p.metaKeywords = [];
      }
    } catch (e) {
      p.metaKeywords = p.metaKeywords ? [String(p.metaKeywords)] : [];
    }

    // Ensure thumbnailUrl falls back to first image when empty
    if ((!p.thumbnailUrl || p.thumbnailUrl === '') && Array.isArray(p.images) && p.images.length > 0) {
      p.thumbnailUrl = p.images[0];
    }

    return p;
  }

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(storeId: string, filters: ProductSearchFilters): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {
      storeId,
      deletedAt: null,
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
        { sku: { contains: filters.search } },
      ];
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.brandId) {
      where.brandId = filters.brandId;
    }

    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }

    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    if (filters.inventoryStatus) {
      where.inventoryStatus = filters.inventoryStatus;
    }

    return where;
  }

  /**
   * Build Prisma orderBy clause
   */
  private buildOrderByClause(
    sortBy: string = 'createdAt',
    sortOrder: string = 'desc'
  ): Prisma.ProductOrderByWithRelationInput {
    const validSortFields = ['name', 'price', 'createdAt', 'updatedAt'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';

    return { [field]: order };
  }

  /**
   * Generate unique slug for product
   */
  private async generateUniqueSlug(storeId: string, name: string, excludeId?: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.product.findFirst({
        where: {
          storeId,
          slug,
          deletedAt: null,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Calculate inventory status based on quantity and threshold
   */
  private calculateInventoryStatus(quantity: number, lowStockThreshold: number): InventoryStatus {
    if (quantity === 0) {
      return InventoryStatus.OUT_OF_STOCK;
    } else if (quantity <= lowStockThreshold) {
      return InventoryStatus.LOW_STOCK;
    } else {
      return InventoryStatus.IN_STOCK;
    }
  }

  /**
   * Validate business rules for product creation/update
   */
  private async validateBusinessRules(
    storeId: string,
    data: Partial<CreateProductData>,
    excludeId?: string
  ): Promise<void> {
    // Check if SKU is unique within store
    if (data.sku) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          storeId,
          sku: data.sku,
          deletedAt: null,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });

      if (existingProduct) {
        throw new Error(`SKU '${data.sku}' already exists in this store`);
      }
    }

    // Check if slug is unique within store
    if (data.slug) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          storeId,
          slug: data.slug,
          deletedAt: null,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });

      if (existingProduct) {
        throw new Error(`Slug '${data.slug}' already exists in this store`);
      }
    }

    // Validate category exists
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          storeId,
          deletedAt: null,
        },
      });

      if (!category) {
        throw new Error('Category not found');
      }
    }

    // Validate brand exists
    if (data.brandId) {
      const brand = await prisma.brand.findFirst({
        where: {
          id: data.brandId,
          storeId,
          deletedAt: null,
        },
      });

      if (!brand) {
        throw new Error('Brand not found');
      }
    }

    // Validate price constraints
    if (data.price !== undefined && data.compareAtPrice !== undefined) {
      if (data.compareAtPrice <= data.price) {
        throw new Error('Compare at price must be greater than regular price');
      }
    }
  }

  // --------------------------------------------------------------------------
  // METHOD ALIASES (for backward compatibility with tests)
  // --------------------------------------------------------------------------

  /**
   * Alias for createProduct
   */
  async create(storeId: string, data: CreateProductData): Promise<ProductWithRelations> {
    return this.createProduct(storeId, data);
  }

  /**
   * Alias for getProductById
   */
  async getById(storeId: string, productId: string): Promise<ProductWithRelations | null> {
    return this.getProductById(productId, storeId);
  }

  /**
   * Alias for updateProduct
   */
  async update(storeId: string, productId: string, data: Partial<CreateProductData>): Promise<ProductWithRelations> {
    return this.updateProduct(productId, storeId, data);
  }

  /**
   * Alias for deleteProduct
   */
  async delete(storeId: string, productId: string): Promise<void> {
    return this.deleteProduct(productId, storeId);
  }

  /**
   * Alias for getProducts (with simplified parameters)
   */
  async list(
    storeId: string, 
    options: ProductSearchFilters & { page?: number; perPage?: number } = {}
  ): Promise<ProductListResult> {
    const { page = 1, perPage = 10, ...filters } = options;
    return this.getProducts(storeId, filters, page, perPage);
  }

  /**
   * Update product stock quantity
   */
  async updateStock(storeId: string, productId: string, quantity: number): Promise<ProductWithRelations> {
    const product = await this.getProductById(productId, storeId);
    if (!product) {
      throw new Error('Product not found');
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { inventoryQty: quantity },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        variants: {  orderBy: { isDefault: 'desc' } },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
            wishlistItems: true,
          },
        },
      },
    });
    
    return this.normalizeProductFields(updated) as unknown as ProductWithRelations;
  }

  /**
   * Decrease product stock quantity
   */
  async decreaseStock(storeId: string, productId: string, quantity: number): Promise<ProductWithRelations> {
    const product = await this.getProductById(productId, storeId);
    if (!product) {
      throw new Error('Product not found');
    }

    const newStock = product.inventoryQty - quantity;
    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    const decreased = await prisma.product.update({
      where: { id: productId },
      data: { inventoryQty: newStock },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        variants: {  orderBy: { isDefault: 'desc' } },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
            wishlistItems: true,
          },
        },
      },
    });

    return this.normalizeProductFields(decreased) as unknown as ProductWithRelations;
  }

  /**
   * Check if product is in stock for given quantity
   */
  async isInStock(storeId: string, productId: string, quantity: number): Promise<boolean> {
    const product = await this.getProductById(productId, storeId);
    if (!product) {
      throw new Error('Product not found');
    }
    return product.inventoryQty >= quantity;
  }
}

// Export singleton instance
export const productService = ProductService.getInstance();