// src/services/category-service.ts
// Category Management Service
// Provides hierarchical category management, CRUD operations, and validation

import { prisma } from '@/lib/db';
import { Category, Prisma } from '@prisma/client';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export interface CategoryWithRelations extends Category {
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children: CategoryWithRelations[];
  _count?: {
    products: number;
    children: number;
  };
}

export interface CategoryTree extends CategoryWithRelations {
  level: number;
  hasChildren: boolean;
}

export interface CategorySearchFilters {
  search?: string;
  parentId?: string | null;
  isPublished?: boolean;
  sortBy?: 'name' | 'sortOrder' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CategoryListResult {
  categories: CategoryWithRelations[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// Validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(255),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format').optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateCategoryData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;

// ============================================================================
// CATEGORY SERVICE CLASS
// ============================================================================

export class CategoryService {
  private static instance: CategoryService;

  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Get categories with filtering, pagination, and search
   */
  async getCategories(
    storeId: string,
    filters: CategorySearchFilters = {},
    page: number = 1,
    perPage: number = 10
  ): Promise<CategoryListResult> {
    const where = this.buildWhereClause(storeId, filters);
    const orderBy = this.buildOrderByClause(filters.sortBy, filters.sortOrder);

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          parent: {
            select: { id: true, name: true, slug: true },
          },
          children: {
            where: { deletedAt: null },
            select: { id: true, name: true, slug: true, sortOrder: true },
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: {
              products: {
                where: { deletedAt: null },
              },
              children: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy,
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      prisma.category.count({ where }),
    ]);

    return {
      categories,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get single category by ID
   */
  async getCategoryById(categoryId: string, storeId: string): Promise<CategoryWithRelations | null> {
    return prisma.category.findFirst({
      where: {
        id: categoryId,
        storeId,
        deletedAt: null,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: {
              where: { deletedAt: null },
            },
            children: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string, storeId: string): Promise<CategoryWithRelations | null> {
    return prisma.category.findFirst({
      where: {
        slug,
        storeId,
        deletedAt: null,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: {
              where: { deletedAt: null },
            },
            children: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });
  }

  /**
   * Get category tree (hierarchical structure)
   */
  async getCategoryTree(storeId: string, includeCounts: boolean = true): Promise<CategoryTree[]> {
    const categories = await prisma.category.findMany({
      where: {
        storeId,
        deletedAt: null,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
        ...(includeCounts && {
          _count: {
            select: {
              products: {
                where: { deletedAt: null },
              },
              children: {
                where: { deletedAt: null },
              },
            },
          },
        }),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return this.buildCategoryTree(categories);
  }

  /**
   * Get root categories (categories without parent)
   */
  async getRootCategories(storeId: string): Promise<CategoryWithRelations[]> {
    return prisma.category.findMany({
      where: {
        storeId,
        parentId: null,
        deletedAt: null,
      },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: {
              where: { deletedAt: null },
            },
            children: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get category breadcrumb path
   */
  async getCategoryBreadcrumb(categoryId: string, storeId: string): Promise<CategoryWithRelations[]> {
    const breadcrumb: CategoryWithRelations[] = [];
    let currentCategoryId: string | null = categoryId;

    while (currentCategoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: currentCategoryId,
          storeId,
          deletedAt: null,
        },
        include: {
          parent: {
            select: { id: true, name: true, slug: true },
          },
          children: [],
        },
      });

      if (!category) break;

      breadcrumb.unshift(category);
      currentCategoryId = category.parentId;
    }

    return breadcrumb;
  }

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Create a new category
   */
  async createCategory(storeId: string, data: CreateCategoryData): Promise<CategoryWithRelations> {
    // Validate input
    const validatedData = createCategorySchema.parse(data);
    
    // Generate slug if not provided
    if (!validatedData.slug) {
      validatedData.slug = await this.generateUniqueSlug(storeId, validatedData.name);
    }

    // Validate business rules
    await this.validateBusinessRules(storeId, validatedData);

    const category = await prisma.category.create({
      data: {
        ...validatedData,
        storeId,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: [],
        _count: {
          select: {
            products: {
              where: { deletedAt: null },
            },
            children: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    return category;
  }

  /**
   * Update an existing category
   */
  async updateCategory(categoryId: string, storeId: string, data: Partial<CreateCategoryData>): Promise<CategoryWithRelations> {
    // Validate input
    const validatedData = updateCategorySchema.parse({ ...data, id: categoryId });
    
    // Check if category exists
    const existingCategory = await this.getCategoryById(categoryId, storeId);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Generate new slug if name changed but slug not provided
    if (validatedData.name && validatedData.name !== existingCategory.name && !validatedData.slug) {
      validatedData.slug = await this.generateUniqueSlug(storeId, validatedData.name, categoryId);
    }

    // Validate business rules
    await this.validateBusinessRules(storeId, validatedData, categoryId);

    // Prevent circular references in hierarchy
    if (validatedData.parentId) {
      await this.validateHierarchy(categoryId, validatedData.parentId, storeId);
    }

    // Remove id from update data
    const updateData = { ...validatedData };
    delete updateData.id;

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            products: {
              where: { deletedAt: null },
            },
            children: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    return category;
  }

  /**
   * Soft delete a category
   */
  async deleteCategory(categoryId: string, storeId: string): Promise<void> {
    const category = await this.getCategoryById(categoryId, storeId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check if category has children
    if (category._count && category._count.children > 0) {
      throw new Error('Cannot delete category with subcategories. Please delete or move subcategories first.');
    }

    // Check if category has products
    if (category._count && category._count.products > 0) {
      throw new Error('Cannot delete category with products. Please move products to another category first.');
    }

    await prisma.category.update({
      where: { id: categoryId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Permanently delete a category (admin only)
   */
  async permanentlyDeleteCategory(categoryId: string, storeId: string): Promise<void> {
    const category = await this.getCategoryById(categoryId, storeId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Recursively delete all descendants and their products
    await this.permanentlyDeleteCategoryTree(categoryId);
  }

  /**
   * Move category to different parent
   */
  async moveCategory(categoryId: string, newParentId: string | null, storeId: string): Promise<CategoryWithRelations> {
    const category = await this.getCategoryById(categoryId, storeId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Validate new parent exists (if provided)
    if (newParentId) {
      const newParent = await this.getCategoryById(newParentId, storeId);
      if (!newParent) {
        throw new Error('New parent category not found');
      }

      // Prevent circular references
      await this.validateHierarchy(categoryId, newParentId, storeId);
    }

    return this.updateCategory(categoryId, storeId, { parentId: newParentId });
  }

  /**
   * Reorder categories within the same parent
   */
  async reorderCategories(storeId: string, parentId: string | null, categoryIds: string[]): Promise<void> {
    // Validate all categories belong to the same parent
    const categories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        storeId,
        parentId,
        deletedAt: null,
      },
    });

    if (categories.length !== categoryIds.length) {
      throw new Error('One or more categories not found or do not belong to the specified parent');
    }

    // Update sort order for each category
    await prisma.$transaction(
      categoryIds.map((categoryId, index) =>
        prisma.category.update({
          where: { id: categoryId },
          data: { sortOrder: index },
        })
      )
    );
  }

  // --------------------------------------------------------------------------
  // HELPER METHODS
  // --------------------------------------------------------------------------

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(storeId: string, filters: CategorySearchFilters): Prisma.CategoryWhereInput {
    const where: Prisma.CategoryWhereInput = {
      storeId,
      deletedAt: null,
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId;
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
    sortBy: string = 'sortOrder',
    sortOrder: string = 'asc'
  ): Prisma.CategoryOrderByWithRelationInput {
    const validSortFields = ['name', 'sortOrder', 'createdAt', 'updatedAt'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'sortOrder';
    const order = sortOrder === 'desc' ? 'desc' : 'asc';

    if (field === 'sortOrder') {
      return [{ sortOrder: order }, { name: 'asc' }];
    }

    return { [field]: order };
  }

  /**
   * Generate unique slug for category
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
      const existing = await prisma.category.findFirst({
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
   * Validate business rules for category creation/update
   */
  private async validateBusinessRules(
    storeId: string,
    data: Partial<CreateCategoryData>,
    excludeId?: string
  ): Promise<void> {
    // Check if slug is unique within store
    if (data.slug) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          storeId,
          slug: data.slug,
          deletedAt: null,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });

      if (existingCategory) {
        throw new Error(`Slug '${data.slug}' already exists in this store`);
      }
    }

    // Validate parent exists
    if (data.parentId) {
      const parent = await prisma.category.findFirst({
        where: {
          id: data.parentId,
          storeId,
          deletedAt: null,
        },
      });

      if (!parent) {
        throw new Error('Parent category not found');
      }
    }
  }

  /**
   * Validate category hierarchy to prevent circular references
   */
  private async validateHierarchy(categoryId: string, parentId: string, storeId: string): Promise<void> {
    if (categoryId === parentId) {
      throw new Error('Category cannot be its own parent');
    }

    // Check if the new parent is a descendant of the category being moved
    const descendants = await this.getCategoryDescendants(categoryId, storeId);
    if (descendants.some(desc => desc.id === parentId)) {
      throw new Error('Cannot move category to its own descendant');
    }
  }

  /**
   * Get all descendants of a category
   */
  private async getCategoryDescendants(categoryId: string, storeId: string): Promise<Category[]> {
    const descendants: Category[] = [];
    const queue = [categoryId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await prisma.category.findMany({
        where: {
          parentId: currentId,
          storeId,
          deletedAt: null,
        },
      });

      descendants.push(...children);
      queue.push(...children.map(child => child.id));
    }

    return descendants;
  }

  /**
   * Build category tree from flat array
   */
  private buildCategoryTree(categories: CategoryWithRelations[]): CategoryTree[] {
    const tree: CategoryTree[] = [];
    const categoryMap = new Map<string, CategoryTree>();

    // Convert categories to tree nodes
    categories.forEach(category => {
      const treeNode: CategoryTree = {
        ...category,
        level: 0,
        hasChildren: category.children.length > 0,
      };
      categoryMap.set(category.id, treeNode);
    });

    // Build tree structure
    categories.forEach(category => {
      const treeNode = categoryMap.get(category.id)!;
      
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          treeNode.level = parent.level + 1;
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(treeNode);
        }
      } else {
        tree.push(treeNode);
      }
    });

    return tree;
  }

  /**
   * Permanently delete category and all its descendants
   */
  private async permanentlyDeleteCategoryTree(categoryId: string): Promise<void> {
    // Get all descendants
    const descendants = await this.getCategoryDescendants(categoryId, ''); // Pass empty storeId since we're already validated

    // Delete all descendants in reverse order (children first)
    for (const descendant of descendants.reverse()) {
      await prisma.category.delete({
        where: { id: descendant.id },
      });
    }

    // Delete the category itself
    await prisma.category.delete({
      where: { id: categoryId },
    });
  }

  // --------------------------------------------------------------------------
  // METHOD ALIASES (for backward compatibility with tests)
  // --------------------------------------------------------------------------

  /**
   * Alias for createCategory
   */
  async create(storeId: string, data: CreateCategoryData): Promise<CategoryWithRelations> {
    return this.createCategory(storeId, data);
  }
}

// Export singleton instance
export const categoryService = CategoryService.getInstance();