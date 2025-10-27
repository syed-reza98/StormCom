// src/services/attribute-service.ts
// Product Attribute Management Service
// Handles dynamic product attributes, values, and relationships

import { prisma } from '@/lib/db';
import { ProductAttribute, ProductAttributeValue, Prisma } from '@prisma/client';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export interface AttributeWithValues extends Omit<ProductAttribute, 'values'> {
  values: string[];
  _count?: {
    productAttributeValues: number;
  };
}

export interface ProductAttributeRelation extends ProductAttributeValue {
  attribute: ProductAttribute;
}

export interface AttributeSearchFilters {
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface AttributeListResult {
  attributes: AttributeWithValues[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// Validation schemas
export const createAttributeSchema = z.object({
  name: z.string().min(1, 'Attribute name is required').max(255),
  values: z.array(z.string().min(1)).min(1, 'At least one value is required'),
});

export const updateAttributeSchema = createAttributeSchema.partial().extend({
  id: z.string().uuid(),
});

export const assignAttributeSchema = z.object({
  productId: z.string().uuid(),
  attributeId: z.string().uuid(),
  value: z.string().min(1),
});

export type CreateAttributeData = z.infer<typeof createAttributeSchema>;
export type UpdateAttributeData = z.infer<typeof updateAttributeSchema>;
export type AssignAttributeData = z.infer<typeof assignAttributeSchema>;

// ============================================================================
// ATTRIBUTE SERVICE CLASS
// ============================================================================

export class AttributeService {
  private static instance: AttributeService;

  public static getInstance(): AttributeService {
    if (!AttributeService.instance) {
      AttributeService.instance = new AttributeService();
    }
    return AttributeService.instance;
  }

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Get attributes with filtering, pagination, and search
   */
  async getAttributes(
    filters: AttributeSearchFilters = {},
    page: number = 1,
    perPage: number = 10
  ): Promise<AttributeListResult> {
    const where = this.buildWhereClause(filters);
    const orderBy = this.buildOrderByClause(filters.sortBy, filters.sortOrder);

    const [attributes, total] = await Promise.all([
      prisma.productAttribute.findMany({
        where,
        include: {
          _count: {
            select: {
              productAttributeValues: true,
            },
          },
        },
        orderBy,
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      prisma.productAttribute.count({ where }),
    ]);

    // Parse JSON values for each attribute
    const attributesWithValues: AttributeWithValues[] = attributes.map(attr => ({
      ...attr,
      values: this.parseAttributeValues(attr.values),
    }));

    return {
      attributes: attributesWithValues,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get single attribute by ID
   */
  async getAttributeById(attributeId: string): Promise<AttributeWithValues | null> {
    const attribute = await prisma.productAttribute.findUnique({
      where: { id: attributeId },
      include: {
        _count: {
          select: {
            productAttributeValues: true,
          },
        },
      },
    });

    if (!attribute) {
      return null;
    }

    return {
      ...attribute,
      values: this.parseAttributeValues(attribute.values),
    };
  }

  /**
   * Get all attributes (for dropdown/selection)
   */
  async getAllAttributes(): Promise<Pick<ProductAttribute, 'id' | 'name'>[]> {
    return prisma.productAttribute.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get product attributes (values assigned to a specific product)
   */
  async getProductAttributes(productId: string, storeId: string): Promise<ProductAttributeRelation[]> {
    // First verify product belongs to store
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return prisma.productAttributeValue.findMany({
      where: { productId },
      include: {
        attribute: true,
      },
      orderBy: {
        attribute: { name: 'asc' },
      },
    });
  }

  /**
   * Get products by attribute value
   */
  async getProductsByAttribute(
    attributeId: string,
    value: string,
    storeId: string
  ): Promise<Array<{ id: string; name: string; slug: string }>> {
    const attributeValues = await prisma.productAttributeValue.findMany({
      where: {
        attributeId,
        value,
        product: {
          storeId,
          deletedAt: null,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return attributeValues.map(av => av.product);
  }

  // --------------------------------------------------------------------------
  // WRITE OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Create a new attribute
   */
  async createAttribute(data: CreateAttributeData): Promise<AttributeWithValues> {
    // Validate input
    const validatedData = createAttributeSchema.parse(data);
    
    // Check if attribute name already exists
    const existingAttribute = await prisma.productAttribute.findFirst({
      where: { name: validatedData.name },
    });

    if (existingAttribute) {
      throw new Error(`Attribute '${validatedData.name}' already exists`);
    }

    // Create attribute with JSON values
    const attribute = await prisma.productAttribute.create({
      data: {
        name: validatedData.name,
        values: JSON.stringify(validatedData.values),
      },
      include: {
        _count: {
          select: {
            productAttributeValues: true,
          },
        },
      },
    });

    return {
      ...attribute,
      values: validatedData.values,
    };
  }

  /**
   * Update an existing attribute
   */
  async updateAttribute(attributeId: string, data: Partial<CreateAttributeData>): Promise<AttributeWithValues> {
    // Validate input
    const validatedData = updateAttributeSchema.parse({ ...data, id: attributeId });
    
    // Check if attribute exists
    const existingAttribute = await this.getAttributeById(attributeId);
    if (!existingAttribute) {
      throw new Error('Attribute not found');
    }

    // Check if name is unique (if changing)
    if (validatedData.name && validatedData.name !== existingAttribute.name) {
      const nameExists = await prisma.productAttribute.findFirst({
        where: {
          name: validatedData.name,
          id: { not: attributeId },
        },
      });

      if (nameExists) {
        throw new Error(`Attribute '${validatedData.name}' already exists`);
      }
    }

    // Remove id from update data
    const { id: _id, ...updateData } = validatedData;

    // Convert values array to JSON if provided
    const prismaUpdateData: any = { ...updateData };
    if (updateData.values) {
      prismaUpdateData.values = JSON.stringify(updateData.values);
    }

    const attribute = await prisma.productAttribute.update({
      where: { id: attributeId },
      data: prismaUpdateData,
      include: {
        _count: {
          select: {
            productAttributeValues: true,
          },
        },
      },
    });

    return {
      ...attribute,
      values: this.parseAttributeValues(attribute.values),
    };
  }

  /**
   * Delete an attribute
   */
  async deleteAttribute(attributeId: string): Promise<void> {
    const attribute = await this.getAttributeById(attributeId);
    if (!attribute) {
      throw new Error('Attribute not found');
    }

    // Check if attribute is used by any products
    if (attribute._count && attribute._count.productAttributeValues > 0) {
      throw new Error('Cannot delete attribute that is assigned to products. Please remove all assignments first.');
    }

    await prisma.productAttribute.delete({
      where: { id: attributeId },
    });
  }

  /**
   * Add value to attribute
   */
  async addValueToAttribute(attributeId: string, value: string): Promise<AttributeWithValues> {
    const attribute = await this.getAttributeById(attributeId);
    if (!attribute) {
      throw new Error('Attribute not found');
    }

    // Check if value already exists
    if (attribute.values.includes(value)) {
      throw new Error(`Value '${value}' already exists for this attribute`);
    }

    // Add new value
    const updatedValues = [...attribute.values, value];
    
    return this.updateAttribute(attributeId, { values: updatedValues });
  }

  /**
   * Remove value from attribute
   */
  async removeValueFromAttribute(attributeId: string, value: string): Promise<AttributeWithValues> {
    const attribute = await this.getAttributeById(attributeId);
    if (!attribute) {
      throw new Error('Attribute not found');
    }

    // Check if value exists
    if (!attribute.values.includes(value)) {
      throw new Error(`Value '${value}' does not exist for this attribute`);
    }

    // Check if value is used by any products
    const usageCount = await prisma.productAttributeValue.count({
      where: {
        attributeId,
        value,
      },
    });

    if (usageCount > 0) {
      throw new Error(`Cannot remove value '${value}' as it is assigned to ${usageCount} product(s)`);
    }

    // Remove value
    const updatedValues = attribute.values.filter(v => v !== value);
    
    if (updatedValues.length === 0) {
      throw new Error('Attribute must have at least one value');
    }

    return this.updateAttribute(attributeId, { values: updatedValues });
  }

  // --------------------------------------------------------------------------
  // PRODUCT ATTRIBUTE ASSIGNMENTS
  // --------------------------------------------------------------------------

  /**
   * Assign attribute to product
   */
  async assignAttributeToProduct(
    productId: string,
    attributeId: string,
    value: string,
    storeId: string
  ): Promise<ProductAttributeRelation> {
    // Verify product exists and belongs to store
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Verify attribute exists
    const attribute = await this.getAttributeById(attributeId);
    if (!attribute) {
      throw new Error('Attribute not found');
    }

    // Verify value is valid for this attribute
    if (!attribute.values.includes(value)) {
      throw new Error(`Value '${value}' is not valid for attribute '${attribute.name}'`);
    }

    // Check if this attribute is already assigned to the product
    const existingAssignment = await prisma.productAttributeValue.findFirst({
      where: {
        productId,
        attributeId,
      },
    });

    if (existingAssignment) {
      // Update existing assignment
      const updated = await prisma.productAttributeValue.update({
        where: { id: existingAssignment.id },
        data: { value },
        include: { attribute: true },
      });
      return updated;
    } else {
      // Create new assignment
      const assignment = await prisma.productAttributeValue.create({
        data: {
          productId,
          attributeId,
          value,
        },
        include: { attribute: true },
      });
      return assignment;
    }
  }

  /**
   * Remove attribute from product
   */
  async removeAttributeFromProduct(
    productId: string,
    attributeId: string,
    storeId: string
  ): Promise<void> {
    // Verify product exists and belongs to store
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const result = await prisma.productAttributeValue.deleteMany({
      where: {
        productId,
        attributeId,
      },
    });

    if (result.count === 0) {
      throw new Error('Attribute assignment not found');
    }
  }

  /**
   * Bulk assign attributes to product
   */
  async bulkAssignAttributes(
    productId: string,
    assignments: Array<{ attributeId: string; value: string }>,
    storeId: string
  ): Promise<{ created: number; updated: number; errors: string[] }> {
    // Verify product exists and belongs to store
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const errors: string[] = [];
    let created = 0;
    let updated = 0;

    for (const assignment of assignments) {
      try {
        const result = await this.assignAttributeToProduct(
          productId,
          assignment.attributeId,
          assignment.value,
          storeId
        );

        // Check if it was an update (existing assignment) or creation
        const existingCount = await prisma.productAttributeValue.count({
          where: {
            productId,
            attributeId: assignment.attributeId,
            createdAt: { lt: result.createdAt },
          },
        });

        if (existingCount > 0) {
          updated++;
        } else {
          created++;
        }
      } catch (error) {
        errors.push(`Attribute ${assignment.attributeId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { created, updated, errors };
  }

  // --------------------------------------------------------------------------
  // HELPER METHODS
  // --------------------------------------------------------------------------

  /**
   * Build Prisma where clause from filters
   */
  private buildWhereClause(filters: AttributeSearchFilters): Prisma.ProductAttributeWhereInput {
    const where: Prisma.ProductAttributeWhereInput = {};

    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    return where;
  }

  /**
   * Build Prisma orderBy clause
   */
  private buildOrderByClause(
    sortBy: string = 'name',
    sortOrder: string = 'asc'
  ): Prisma.ProductAttributeOrderByWithRelationInput {
    const validSortFields = ['name', 'createdAt', 'updatedAt'];
    const field = validSortFields.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder === 'desc' ? 'desc' : 'asc';

    return { [field]: order };
  }

  /**
   * Parse JSON attribute values safely
   */
  private parseAttributeValues(values: string): string[] {
    try {
      const parsed = JSON.parse(values);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // METHOD ALIASES (for backward compatibility with tests)
  // --------------------------------------------------------------------------

  /**
   * Alias for createAttribute
   */
  async create(storeId: string, data: CreateAttributeData): Promise<AttributeWithValues> {
    // Note: AttributeService doesn't use storeId in create, it's global
    return this.createAttribute(data);
  }
}

// Export singleton instance
export const attributeService = AttributeService.getInstance();