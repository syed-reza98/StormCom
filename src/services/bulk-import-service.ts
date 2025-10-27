// src/services/bulk-import-service.ts
// Bulk Import Service for CSV/Excel product imports
// Supports data validation, progress tracking, error reporting, and rollback capabilities

import { prisma } from '@/lib/db';
import { productService } from './product-service';
import { categoryService } from './category-service';
import { brandService } from './brand-service';
import { z } from 'zod';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ImportProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
  startedAt: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number; // seconds
}

export interface ImportError {
  row: number;
  column?: string;
  field?: string;
  message: string;
  value?: any;
  severity: 'error' | 'warning';
}

export interface ImportResult {
  progress: ImportProgress;
  errors: ImportError[];
  warnings: ImportError[];
  createdProducts: string[]; // Product IDs
  updatedProducts: string[]; // Product IDs
  skippedRows: number[];
}

export interface ImportConfiguration {
  updateExisting: boolean;
  skipDuplicates: boolean;
  validateOnly: boolean;
  batchSize: number;
  createCategories: boolean;
  createBrands: boolean;
  rollbackOnError: boolean;
}

export interface ImportRowData {
  name: string;
  sku?: string;
  description?: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  costPrice?: number;
  categoryName?: string;
  categoryPath?: string; // e.g., "Electronics > Phones > Smartphones"
  brandName?: string;
  trackQuantity?: boolean;
  quantity?: number;
  lowStockThreshold?: number;
  weight?: number;
  dimensions?: string; // JSON string: {"length": 10, "width": 5, "height": 2}
  tags?: string; // Comma-separated
  metaTitle?: string;
  metaDescription?: string;
  isVisible?: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const importConfigSchema = z.object({
  updateExisting: z.boolean().default(false),
  skipDuplicates: z.boolean().default(true),
  validateOnly: z.boolean().default(false),
  batchSize: z.number().min(1).max(1000).default(100),
  createCategories: z.boolean().default(true),
  createBrands: z.boolean().default(true),
  rollbackOnError: z.boolean().default(true),
});

const importRowSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  sku: z.string().max(100).optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  salePrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  categoryName: z.string().max(255).optional(),
  categoryPath: z.string().max(500).optional(),
  brandName: z.string().max(255).optional(),
  trackQuantity: z.boolean().default(true),
  quantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).default(5),
  weight: z.number().min(0).optional(),
  dimensions: z.string().max(500).optional(),
  tags: z.string().optional(),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(500).optional(),
  isVisible: z.boolean().default(true),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
});

// ============================================================================
// BULK IMPORT SERVICE
// ============================================================================

class BulkImportService {
  private activeJobs = new Map<string, ImportProgress>();

  /**
   * Start bulk import from CSV data
   */
  async startImport(
    storeId: string,
    csvData: string,
    config: Partial<ImportConfiguration> = {}
  ): Promise<{ jobId: string; progress: ImportProgress }> {
    const validatedConfig = importConfigSchema.parse(config);
    const jobId = `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Parse CSV data
    const rows = this.parseCSV(csvData);
    
    const progress: ImportProgress = {
      jobId,
      status: 'pending',
      totalRows: rows.length,
      processedRows: 0,
      successCount: 0,
      errorCount: 0,
      warningCount: 0,
      startedAt: new Date(),
    };

    this.activeJobs.set(jobId, progress);

    // Start processing asynchronously
    this.processImport(storeId, rows, validatedConfig, progress).catch((error) => {
      console.error(`Import job ${jobId} failed:`, error);
      progress.status = 'failed';
      progress.completedAt = new Date();
    });

    return { jobId, progress };
  }

  /**
   * Get import progress
   */
  async getProgress(jobId: string): Promise<ImportProgress | null> {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Cancel import job
   */
  async cancelImport(jobId: string): Promise<boolean> {
    const progress = this.activeJobs.get(jobId);
    if (!progress || progress.status === 'completed' || progress.status === 'failed') {
      return false;
    }

    progress.status = 'cancelled';
    progress.completedAt = new Date();
    return true;
  }

  /**
   * Parse CSV data into rows
   */
  private parseCSV(csvData: string): Record<string, any>[] {
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        if (value !== undefined) {
          // Type conversion
          row[header] = this.convertValue(header, value);
        }
      });
      
      row._rowNumber = i + 1;
      rows.push(row);
    }

    return rows;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  /**
   * Convert string values to appropriate types
   */
  private convertValue(header: string, value: string): any {
    if (!value || value.toLowerCase() === 'null' || value.toLowerCase() === 'undefined') {
      return undefined;
    }

    // Boolean fields
    if (['trackQuantity', 'isVisible'].includes(header)) {
      return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
    }

    // Number fields
    if (['price', 'salePrice', 'costPrice', 'weight'].includes(header)) {
      const num = parseFloat(value);
      return isNaN(num) ? undefined : num;
    }

    // Integer fields
    if (['quantity', 'lowStockThreshold'].includes(header)) {
      const num = parseInt(value, 10);
      return isNaN(num) ? undefined : num;
    }

    return value;
  }

  /**
   * Process import job
   */
  private async processImport(
    storeId: string,
    rows: Record<string, any>[],
    config: ImportConfiguration,
    progress: ImportProgress
  ): Promise<ImportResult> {
    progress.status = 'processing';
    
    const errors: ImportError[] = [];
    const warnings: ImportError[] = [];
    const createdProducts: string[] = [];
    const updatedProducts: string[] = [];
    const skippedRows: number[] = [];

    // Pre-validate all rows
    const validatedRows: { row: ImportRowData; rowNumber: number }[] = [];
    
    for (const row of rows) {
      try {
        const validatedRow = importRowSchema.parse(row);
        validatedRows.push({ row: validatedRow, rowNumber: row._rowNumber });
      } catch (error) {
        if (error instanceof z.ZodError) {
          for (const issue of error.errors) {
            errors.push({
              row: row._rowNumber,
              field: issue.path.join('.'),
              message: issue.message,
              value: issue.code === 'invalid_type' ? row[issue.path[0]] : undefined,
              severity: 'error',
            });
          }
        }
        skippedRows.push(row._rowNumber);
        progress.errorCount++;
      }
    }

    // If validation-only mode, return results
    if (config.validateOnly) {
      progress.status = 'completed';
      progress.completedAt = new Date();
      progress.processedRows = rows.length;
      
      return {
        progress,
        errors,
        warnings,
        createdProducts,
        updatedProducts,
        skippedRows,
      };
    }

    // Process rows in batches
    const batches = this.createBatches(validatedRows, config.batchSize);

    try {
      if (config.rollbackOnError) {
        // Use transaction for rollback capability
        await prisma.$transaction(async (tx) => {
          await this.processBatches(
            storeId,
            batches,
            config,
            progress,
            errors,
            warnings,
            createdProducts,
            updatedProducts,
            skippedRows,
            tx
          );
        });
      } else {
        // Process without transaction
        await this.processBatches(
          storeId,
          batches,
          config,
          progress,
          errors,
          warnings,
          createdProducts,
          updatedProducts,
          skippedRows
        );
      }

      progress.status = 'completed';
    } catch (error) {
      console.error('Import processing failed:', error);
      progress.status = 'failed';
      
      errors.push({
        row: 0,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
      });
    }

    progress.completedAt = new Date();
    
    return {
      progress,
      errors,
      warnings,
      createdProducts,
      updatedProducts,
      skippedRows,
    };
  }

  /**
   * Create batches from validated rows
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Process batches of rows
   */
  private async processBatches(
    storeId: string,
    batches: { row: ImportRowData; rowNumber: number }[][],
    config: ImportConfiguration,
    progress: ImportProgress,
    errors: ImportError[],
    warnings: ImportError[],
    createdProducts: string[],
    updatedProducts: string[],
    skippedRows: number[],
    transaction?: any
  ): Promise<void> {
    const db = transaction || prisma;

    for (const batch of batches) {
      if (progress.status === 'cancelled') {
        break;
      }

      await this.processBatch(
        storeId,
        batch,
        config,
        progress,
        errors,
        warnings,
        createdProducts,
        updatedProducts,
        skippedRows,
        db
      );

      // Update estimated time remaining
      const remainingRows = progress.totalRows - progress.processedRows;
      const elapsedMs = Date.now() - progress.startedAt.getTime();
      const avgTimePerRow = elapsedMs / Math.max(progress.processedRows, 1);
      progress.estimatedTimeRemaining = Math.round((remainingRows * avgTimePerRow) / 1000);
    }
  }

  /**
   * Process a single batch of rows
   */
  private async processBatch(
    storeId: string,
    batch: { row: ImportRowData; rowNumber: number }[],
    config: ImportConfiguration,
    progress: ImportProgress,
    errors: ImportError[],
    warnings: ImportError[],
    createdProducts: string[],
    updatedProducts: string[],
    skippedRows: number[],
    db: any
  ): Promise<void> {
    for (const { row, rowNumber } of batch) {
      try {
        await this.processRow(
          storeId,
          row,
          rowNumber,
          config,
          errors,
          warnings,
          createdProducts,
          updatedProducts,
          skippedRows,
          db
        );

        progress.successCount++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
        });
        progress.errorCount++;
        skippedRows.push(rowNumber);
      }

      progress.processedRows++;
    }
  }

  /**
   * Process a single row
   */
  private async processRow(
    storeId: string,
    row: ImportRowData,
    rowNumber: number,
    config: ImportConfiguration,
    errors: ImportError[],
    warnings: ImportError[],
    createdProducts: string[],
    updatedProducts: string[],
    skippedRows: number[],
    db: any
  ): Promise<void> {
    // Check for existing product by SKU
    let existingProduct = null;
    if (row.sku) {
      existingProduct = await db.product.findFirst({
        where: { sku: row.sku, storeId, deletedAt: null },
      });

      if (existingProduct) {
        if (config.skipDuplicates && !config.updateExisting) {
          warnings.push({
            row: rowNumber,
            field: 'sku',
            message: `Product with SKU "${row.sku}" already exists, skipping`,
            severity: 'warning',
          });
          skippedRows.push(rowNumber);
          return;
        }

        if (!config.updateExisting) {
          errors.push({
            row: rowNumber,
            field: 'sku',
            message: `Product with SKU "${row.sku}" already exists`,
            severity: 'error',
          });
          return;
        }
      }
    }

    // Resolve category
    let categoryId: string | undefined;
    if (row.categoryName || row.categoryPath) {
      try {
        categoryId = await this.resolveCategory(
          storeId,
          row.categoryName || row.categoryPath!,
          row.categoryPath,
          config.createCategories,
          db
        );
      } catch (error) {
        if (config.createCategories) {
          warnings.push({
            row: rowNumber,
            field: 'categoryName',
            message: `Could not create/find category: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'warning',
          });
        } else {
          errors.push({
            row: rowNumber,
            field: 'categoryName',
            message: `Category not found: ${row.categoryName || row.categoryPath}`,
            severity: 'error',
          });
          return;
        }
      }
    }

    // Resolve brand
    let brandId: string | undefined;
    if (row.brandName) {
      try {
        brandId = await this.resolveBrand(storeId, row.brandName, config.createBrands, db);
      } catch (error) {
        if (config.createBrands) {
          warnings.push({
            row: rowNumber,
            field: 'brandName',
            message: `Could not create/find brand: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'warning',
          });
        } else {
          errors.push({
            row: rowNumber,
            field: 'brandName',
            message: `Brand not found: ${row.brandName}`,
            severity: 'error',
          });
          return;
        }
      }
    }

    // Parse dimensions
    let dimensions: any = null;
    if (row.dimensions) {
      try {
        dimensions = JSON.parse(row.dimensions);
      } catch (error) {
        warnings.push({
          row: rowNumber,
          field: 'dimensions',
          message: 'Invalid JSON format for dimensions, using null',
          severity: 'warning',
        });
      }
    }

    // Parse tags
    const tags = row.tags ? row.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    // Prepare product data
    const productData = {
      name: row.name,
      sku: row.sku,
      description: row.description,
      shortDescription: row.shortDescription,
      price: row.price,
      salePrice: row.salePrice,
      costPrice: row.costPrice,
      categoryId,
      brandId,
      trackQuantity: row.trackQuantity,
      quantity: row.quantity,
      lowStockThreshold: row.lowStockThreshold,
      weight: row.weight,
      dimensions,
      tags,
      metaTitle: row.metaTitle,
      metaDescription: row.metaDescription,
      isVisible: row.isVisible,
      status: row.status,
    };

    // Create or update product
    if (existingProduct && config.updateExisting) {
      const updatedProduct = await productService.updateProduct(
        existingProduct.id,
        storeId,
        productData
      );
      updatedProducts.push(updatedProduct.id);
    } else {
      const createdProduct = await productService.createProduct(storeId, productData);
      createdProducts.push(createdProduct.id);
    }
  }

  /**
   * Resolve category by name or path, creating if necessary
   */
  private async resolveCategory(
    storeId: string,
    categoryName: string,
    categoryPath: string | undefined,
    createIfMissing: boolean,
    db: any
  ): Promise<string | undefined> {
    // Try to find by exact name first
    let category = await db.category.findFirst({
      where: { name: categoryName, storeId, deletedAt: null },
    });

    if (category) {
      return category.id;
    }

    // If path provided, try to resolve the full path
    if (categoryPath && categoryPath.includes('>')) {
      const pathParts = categoryPath.split('>').map(part => part.trim());
      let parentId: string | undefined;

      for (const part of pathParts) {
        category = await db.category.findFirst({
          where: { name: part, storeId, parentId, deletedAt: null },
        });

        if (!category && createIfMissing) {
          const categoryData = {
            name: part,
            parentId,
            isVisible: true,
          };
          category = await categoryService.createCategory(storeId, categoryData);
        }

        if (category) {
          parentId = category.id;
        } else {
          throw new Error(`Category "${part}" not found in path "${categoryPath}"`);
        }
      }

      return parentId;
    }

    // Create simple category if missing
    if (createIfMissing) {
      const categoryData = {
        name: categoryName,
        isVisible: true,
      };
      const newCategory = await categoryService.createCategory(storeId, categoryData);
      return newCategory.id;
    }

    throw new Error(`Category "${categoryName}" not found`);
  }

  /**
   * Resolve brand by name, creating if necessary
   */
  private async resolveBrand(
    storeId: string,
    brandName: string,
    createIfMissing: boolean,
    db: any
  ): Promise<string | undefined> {
    let brand = await db.brand.findFirst({
      where: { name: brandName, storeId, deletedAt: null },
    });

    if (brand) {
      return brand.id;
    }

    if (createIfMissing) {
      const brandData = {
        name: brandName,
        isPublished: true,
      };
      const newBrand = await brandService.createBrand(storeId, brandData);
      return newBrand.id;
    }

    throw new Error(`Brand "${brandName}" not found`);
  }

  /**
   * Get import results
   */
  async getImportResults(jobId: string): Promise<ImportResult | null> {
    const progress = this.activeJobs.get(jobId);
    if (!progress) return null;

    // This is a simplified version - in production, you'd store detailed results
    return {
      progress,
      errors: [],
      warnings: [],
      createdProducts: [],
      updatedProducts: [],
      skippedRows: [],
    };
  }

  /**
   * Clean up completed jobs
   */
  async cleanupCompletedJobs(): Promise<void> {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [jobId, progress] of this.activeJobs.entries()) {
      if (
        (progress.status === 'completed' || progress.status === 'failed') &&
        progress.completedAt &&
        now - progress.completedAt.getTime() > maxAge
      ) {
        this.activeJobs.delete(jobId);
      }
    }
  }
}

export const bulkImportService = new BulkImportService();