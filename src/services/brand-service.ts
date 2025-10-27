// src/services/brand-service.ts
// Brand Management Service
// Provides CRUD operations, validation, and brand management

import { prisma } from '@/lib/db';
import { Brand, Prisma } from '@prisma/client';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export interface BrandWithRelations extends Brand {
  _count?: {
    products: number;
  };
}

export interface BrandSearchFilters {
  search?: string;
  isPublished?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface BrandListResult {
  brands: BrandWithRelations[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// Validation schemas
export const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(255),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format').optional(),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  isPublished: z.boolean().default(true),
});

export const updateBrandSchema = createBrandSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateBrandData = z.infer<typeof createBrandSchema>;
export type UpdateBrandData = z.infer<typeof updateBrandSchema>;

// ============================================================================
// BRAND SERVICE CLASS
// ============================================================================

export class BrandService {
  private static instance: BrandService;

  public static getInstance(): BrandService {
    if (!BrandService.instance) {
      BrandService.instance = new BrandService();
    }
    return BrandService.instance;
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Get brands with filtering, pagination, and search
   */
  async getBrands(
    storeId: string,
    filters: BrandSearchFilters = {},
    page: number = 1,
    perPage: number = 10
  ): Promise<BrandListResult> {
    const where = this.buildWhereClause(storeId, filters);
    const orderBy = this.buildOrderByClause(filters.sortBy, filters.sortOrder);

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        include: {
          _count: {
            select: {
              products: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy,
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      prisma.brand.count({ where }),
    ]);

    return {
      brands,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get single brand by ID
   */
  async getBrandById(brandId: string, storeId: string): Promise<BrandWithRelations | null> {
    return prisma.brand.findFirst({
      where: {
        id: brandId,
        storeId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            products: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  }

  /**
   * Get brand by slug
   */
  async getBrandBySlug(slug: string, storeId: string): Promise<BrandWithRelations | null> {
    return prisma.brand.findFirst({
      where: {
        slug,
        storeId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            products: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  }

  /**
   * Get all published brands for a store (for dropdown/selection)
   */
  async getPublishedBrands(storeId: string): Promise<Pick<Brand, 'id' | 'name' | 'slug'>[]> {
    return prisma.brand.findMany({
      where: {
        storeId,
        isPublished: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get total brand count for a store
   */
  async getTotalBrandCount(storeId: string): Promise<number> {
    return prisma.brand.count({
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
   * Create a new brand
   */
  async createBrand(storeId: string, data: CreateBrandData): Promise<BrandWithRelations> {
    // Validate input
    const validatedData = createBrandSchema.parse(data);
    
    // Generate slug if not provided (required by Prisma)
    const slug = validatedData.slug || await this.generateUniqueSlug(storeId, validatedData.name);

    // Validate business rules
    await this.validateBusinessRules(storeId, { ...validatedData, slug });

    const brand = await prisma.brand.create({
      data: {
        ...validatedData,
        slug,
        storeId,
      },
      include: {
        _count: {
          select: {
            products: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    return brand;
  }

  /**
   * Update an existing brand
   */
  async updateBrand(brandId: string, storeId: string, data: Partial<CreateBrandData>): Promise<BrandWithRelations> {
    // Validate input
    const validatedData = updateBrandSchema.parse({ ...data, id: brandId });
    
    // Check if brand exists
    const existingBrand = await this.getBrandById(brandId, storeId);
    if (!existingBrand) {
      throw new Error('Brand not found');
    }

    // Generate new slug if name changed but slug not provided
    if (validatedData.name && validatedData.name !== existingBrand.name && !validatedData.slug) {
      validatedData.slug = await this.generateUniqueSlug(storeId, validatedData.name, brandId);
    }

    // Validate business rules
    await this.validateBusinessRules(storeId, validatedData, brandId);

    // Remove id from update data
    const { id: _, ...updateData } = validatedData;

    const brand = await prisma.brand.update({
      where: { id: brandId },
      data: updateData,
      include: {
        _count: {
          select: {
            products: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    return brand;
  }

  /**
   * Soft delete a brand
   */
  async deleteBrand(brandId: string, storeId: string): Promise<void> {
    const brand = await this.getBrandById(brandId, storeId);
    if (!brand) {
      throw new Error('Brand not found');
    }

    // Check if brand has products
    if (brand._count && brand._count.products > 0) {
      throw new Error('Cannot delete brand with products. Please remove or reassign products first.');
    }

    await prisma.brand.update({
      where: { id: brandId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Permanently delete a brand (admin only)
   */
  async permanentlyDeleteBrand(brandId: string, storeId: string): Promise<void> {
    const brand = await this.getBrandById(brandId, storeId);
    if (!brand) {
      throw new Error('Brand not found');
    }

    // Remove brand from all products first
    await prisma.product.updateMany({
      where: {
        brandId,
        storeId,
      },
      data: {
        brandId: null,
      },
    });

    // Then delete the brand
    await prisma.brand.delete({
      where: { id: brandId },
    });
  }

  /**
   * Bulk assign products to brand
   */
  async assignProductsToBrand(
    brandId: string,
    productIds: string[],
    storeId: string
  ): Promise<{ updated: number; errors: string[] }> {
    // Validate brand exists
    const brand = await this.getBrandById(brandId, storeId);
    if (!brand) {
      throw new Error('Brand not found');
    }

    const errors: string[] = [];
    let updated = 0;

    // Process each product
    for (const productId of productIds) {
      try {
        const result = await prisma.product.updateMany({
          where: {
            id: productId,
            storeId,
            deletedAt: null,
          },
          data: {
            brandId,
          },
        });

        if (result.count === 0) {
          errors.push(`Product ${productId} not found or not accessible`);
        } else {
          updated += result.count;
        }
      } catch (error) {
        errors.push(`Failed to update product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { updated, errors };
  }

  /**
   * Remove brand from products
   */
  async removeProductsFromBrand(
    brandId: string,
    productIds: string[],
    storeId: string
  ): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;

    // Process each product
    for (const productId of productIds) {
      try {
        const result = await prisma.product.updateMany({
          where: {
            id: productId,
            brandId,
            storeId,
            deletedAt: null,
          },
          data: {
            brandId: null,
          },
        });

        if (result.count === 0) {
          errors.push(`Product ${productId} not found, not assigned to this brand, or not accessible`);
        } else {
          updated += result.count;
        }
      } catch (error) {
        errors.push(`Failed to update product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { updated, errors };
  }

  // --------------------------------------------------------------------------
  // HELPER METHODS
  // --------------------------------------------------------------------------

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(storeId: string, filters: BrandSearchFilters): Prisma.BrandWhereInput {
    const where: Prisma.BrandWhereInput = {
      storeId,
      deletedAt: null,
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }

    return where;
  }

  /**
   * Build Prisma orderBy clause
   */
  private buildOrderByClause(
    sortBy: string = 'name',
    sortOrder: string = 'asc'
  ): Prisma.BrandOrderByWithRelationInput {
    const validSortFields = ['name', 'createdAt', 'updatedAt'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder === 'desc' ? 'desc' : 'asc';

    return { [field]: order };
  }

  /**
   * Generate unique slug for brand
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
      const existing = await prisma.brand.findFirst({
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
   * Validate business rules for brand creation/update
   */
  private async validateBusinessRules(
    storeId: string,
    data: Partial<CreateBrandData>,
    excludeId?: string
  ): Promise<void> {
    // Check if slug is unique within store
    if (data.slug) {
      const existingBrand = await prisma.brand.findFirst({
        where: {
          storeId,
          slug: data.slug,
          deletedAt: null,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });

      if (existingBrand) {
        throw new Error(`Slug '${data.slug}' already exists in this store`);
      }
    }

    // Validate website URL format if provided
    if (data.website && data.website.trim()) {
      try {
        new URL(data.website);
      } catch {
        throw new Error('Invalid website URL format');
      }
    }

    // Validate logo URL format if provided
    if (data.logo && data.logo.trim()) {
      try {
        new URL(data.logo);
      } catch {
        throw new Error('Invalid logo URL format');
      }
    }
  }
}

// Export singleton instance
export const brandService = BrandService.getInstance();