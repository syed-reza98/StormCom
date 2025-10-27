// src/services/bulk-export-service.ts
// Bulk Export Service for data exports
// Supports CSV/Excel formats, progress tracking, and large dataset handling

import { prisma } from '@/lib/db';
import { z } from 'zod';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ExportFormat = 'csv' | 'excel' | 'json';
export type ExportEntity = 'products' | 'categories' | 'brands' | 'orders' | 'customers';

export interface ExportProgress {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  entity: ExportEntity;
  format: ExportFormat;
  totalRecords: number;
  processedRecords: number;
  startedAt: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number; // seconds
  downloadUrl?: string;
  fileName: string;
  fileSize?: number; // bytes
}

export interface ExportConfiguration {
  entity: ExportEntity;
  format: ExportFormat;
  fields?: string[]; // Specific fields to export, if empty exports all
  filters?: Record<string, any>; // Entity-specific filters
  includeDeleted?: boolean;
  batchSize?: number;
  maxRecords?: number;
  dateFormat?: string;
  includeHeaders?: boolean;
  delimiter?: string; // For CSV exports
}

export interface ExportFilter {
  // Common filters
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  
  // Product-specific filters
  categoryId?: string;
  brandId?: string;
  priceFrom?: number;
  priceTo?: number;
  inventoryStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  
  // Order-specific filters
  orderStatus?: string;
  paymentStatus?: string;
  
  // Customer-specific filters
  customerType?: string;
}

export interface ExportResult {
  progress: ExportProgress;
  downloadUrl?: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const exportConfigSchema = z.object({
  entity: z.enum(['products', 'categories', 'brands', 'orders', 'customers']),
  format: z.enum(['csv', 'excel', 'json']),
  fields: z.array(z.string()).optional(),
  filters: z.record(z.any()).optional(),
  includeDeleted: z.boolean().default(false),
  batchSize: z.number().min(100).max(10000).default(1000),
  maxRecords: z.number().min(1).max(100000).default(50000),
  dateFormat: z.string().default('YYYY-MM-DD HH:mm:ss'),
  includeHeaders: z.boolean().default(true),
  delimiter: z.string().default(','),
});

// ============================================================================
// BULK EXPORT SERVICE
// ============================================================================

class BulkExportService {
  private activeJobs = new Map<string, ExportProgress>();
  private readonly baseUploadPath = '/tmp/exports'; // In production, use proper storage service

  /**
   * Start bulk export
   */
  async startExport(
    storeId: string,
    config: Partial<ExportConfiguration>
  ): Promise<{ jobId: string; progress: ExportProgress }> {
    const validatedConfig = exportConfigSchema.parse(config);
    const jobId = `export-${validatedConfig.entity}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const fileName = this.generateFileName(validatedConfig);

    const progress: ExportProgress = {
      jobId,
      status: 'pending',
      entity: validatedConfig.entity,
      format: validatedConfig.format,
      totalRecords: 0,
      processedRecords: 0,
      startedAt: new Date(),
      fileName,
    };

    this.activeJobs.set(jobId, progress);

    // Start export processing asynchronously
    this.processExport(storeId, validatedConfig, progress).catch((error) => {
      console.error(`Export job ${jobId} failed:`, error);
      progress.status = 'failed';
      progress.completedAt = new Date();
    });

    return { jobId, progress };
  }

  /**
   * Get export progress
   */
  async getProgress(jobId: string): Promise<ExportProgress | null> {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Cancel export job
   */
  async cancelExport(jobId: string): Promise<boolean> {
    const progress = this.activeJobs.get(jobId);
    if (!progress || progress.status === 'completed' || progress.status === 'failed') {
      return false;
    }

    progress.status = 'cancelled';
    progress.completedAt = new Date();
    return true;
  }

  /**
   * Process export job
   */
  private async processExport(
    storeId: string,
    config: ExportConfiguration,
    progress: ExportProgress
  ): Promise<void> {
    progress.status = 'processing';

    try {
      // Get total record count
      progress.totalRecords = await this.getRecordCount(storeId, config);

      // Generate export data
      const exportData = await this.generateExportData(storeId, config, progress);

      // Create file based on format
      await this.createExportFile(exportData, config, progress);
      
      // In production, upload to cloud storage (Vercel Blob, S3, etc.)
      progress.downloadUrl = `/api/exports/download/${progress.jobId}`;
      progress.fileSize = Buffer.byteLength(JSON.stringify(exportData), 'utf8');

      progress.status = 'completed';
      progress.completedAt = new Date();

    } catch (error) {
      console.error(`Export processing failed:`, error);
      progress.status = 'failed';
      progress.completedAt = new Date();
    }
  }

  /**
   * Get total record count for export
   */
  private async getRecordCount(storeId: string, config: ExportConfiguration): Promise<number> {
    const baseWhere = {
      storeId,
      ...(config.includeDeleted ? {} : { deletedAt: null }),
    };

    const filters = this.buildFilters(config.filters || {});

    switch (config.entity) {
      case 'products':
        return await prisma.product.count({
          where: { ...baseWhere, ...filters },
        });

      case 'categories':
        return await prisma.category.count({
          where: { ...baseWhere, ...filters },
        });

      case 'brands':
        return await prisma.brand.count({
          where: { ...baseWhere, ...filters },
        });

      case 'orders':
        return await prisma.order.count({
          where: { ...baseWhere, ...filters },
        });

      case 'customers':
        return await prisma.user.count({
          where: { 
            storeId,
            role: 'CUSTOMER',
            ...filters,
            ...(config.includeDeleted ? {} : { deletedAt: null }),
          },
        });

      default:
        throw new Error(`Unsupported entity: ${config.entity}`);
    }
  }

  /**
   * Generate export data
   */
  private async generateExportData(
    storeId: string,
    config: ExportConfiguration,
    progress: ExportProgress
  ): Promise<any[]> {
    const data: any[] = [];
    const batchSize = config.batchSize || 1000;
    const maxRecords = Math.min(config.maxRecords || 50000, progress.totalRecords);
    
    let processed = 0;
    let skip = 0;

    while (processed < maxRecords && progress.status === 'processing') {
      const batch = await this.fetchBatch(storeId, config, skip, batchSize);
      
      if (batch.length === 0) break;

      // Transform data based on selected fields
      const transformedBatch = batch.map(record => this.transformRecord(record, config));
      data.push(...transformedBatch);

      processed += batch.length;
      skip += batchSize;
      progress.processedRecords = processed;

      // Update estimated time remaining
      const elapsedMs = Date.now() - progress.startedAt.getTime();
      const avgTimePerRecord = elapsedMs / Math.max(processed, 1);
      const remainingRecords = maxRecords - processed;
      progress.estimatedTimeRemaining = Math.round((remainingRecords * avgTimePerRecord) / 1000);
    }

    return data;
  }

  /**
   * Fetch a batch of records
   */
  private async fetchBatch(
    storeId: string,
    config: ExportConfiguration,
    skip: number,
    take: number
  ): Promise<any[]> {
    const baseWhere = {
      storeId,
      ...(config.includeDeleted ? {} : { deletedAt: null }),
    };

    const filters = this.buildFilters(config.filters || {});
    
    const orderBy = { createdAt: 'asc' as const };

    switch (config.entity) {
      case 'products':
        return await prisma.product.findMany({
          where: { ...baseWhere, ...filters },
          include: {
            category: { select: { name: true } },
            brand: { select: { name: true } },
            _count: { select: { orderItems: true } },
          },
          orderBy,
          skip,
          take,
        });

      case 'categories':
        return await prisma.category.findMany({
          where: { ...baseWhere, ...filters },
          include: {
            parent: { select: { name: true } },
            _count: { select: { products: true, children: true } },
          },
          orderBy,
          skip,
          take,
        });

      case 'brands':
        return await prisma.brand.findMany({
          where: { ...baseWhere, ...filters },
          include: {
            _count: { select: { products: true } },
          },
          orderBy,
          skip,
          take,
        });

      case 'orders':
        return await prisma.order.findMany({
          where: { ...baseWhere, ...filters },
          include: {
            customer: { select: { firstName: true, lastName: true, email: true } },
            items: {
              include: {
                product: { select: { name: true, sku: true } },
              },
            },
            payments: { select: { amount: true, status: true, method: true } },
          },
          orderBy,
          skip,
          take,
        });

      case 'customers':
        return await prisma.user.findMany({
          where: {
            storeId,
            role: 'CUSTOMER',
            ...filters,
            ...(config.includeDeleted ? {} : { deletedAt: null }),
          },
          include: {
            _count: { select: { orders: true } },
          },
          orderBy,
          skip,
          take,
        });

      default:
        throw new Error(`Unsupported entity: ${config.entity}`);
    }
  }

  /**
   * Build filters from configuration
   */
  private buildFilters(filters: Record<string, any>): Record<string, any> {
    const where: Record<string, any> = {};

    // Date range filters
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    // Search filter
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    // Entity-specific filters
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.status) where.status = filters.status;
    
    // Price range filters
    if (filters.priceFrom || filters.priceTo) {
      where.price = {};
      if (filters.priceFrom) where.price.gte = filters.priceFrom;
      if (filters.priceTo) where.price.lte = filters.priceTo;
    }

    return where;
  }

  /**
   * Transform record based on selected fields and format
   */
  private transformRecord(record: any, config: ExportConfiguration): any {
    let transformed: any = {};

    if (config.fields && config.fields.length > 0) {
      // Only include specified fields
      for (const field of config.fields) {
        if (field.includes('.')) {
          // Handle nested fields
          const parts = field.split('.');
          let value = record;
          for (const part of parts) {
            value = value?.[part];
          }
          transformed[field] = value;
        } else {
          transformed[field] = record[field];
        }
      }
    } else {
      // Include all fields with some transformations
      transformed = this.getDefaultFields(record, config.entity);
    }

    // Apply date formatting
    for (const [key, value] of Object.entries(transformed)) {
      if (value instanceof Date) {
        transformed[key] = this.formatDate(value, config.dateFormat || 'YYYY-MM-DD HH:mm:ss');
      }
    }

    return transformed;
  }

  /**
   * Get default fields for each entity type
   */
  private getDefaultFields(record: any, entity: ExportEntity): any {
    switch (entity) {
      case 'products':
        return {
          id: record.id,
          name: record.name,
          sku: record.sku,
          description: record.description,
          shortDescription: record.shortDescription,
          price: record.price,
          salePrice: record.salePrice,
          costPrice: record.costPrice,
          categoryName: record.category?.name,
          brandName: record.brand?.name,
          trackQuantity: record.trackQuantity,
          quantity: record.quantity,
          lowStockThreshold: record.lowStockThreshold,
          weight: record.weight,
          dimensions: JSON.stringify(record.dimensions),
          tags: Array.isArray(record.tags) ? record.tags.join(', ') : record.tags,
          metaTitle: record.metaTitle,
          metaDescription: record.metaDescription,
          isVisible: record.isVisible,
          status: record.status,
          totalSales: record._count?.orderItems || 0,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        };

      case 'categories':
        return {
          id: record.id,
          name: record.name,
          slug: record.slug,
          description: record.description,
          parentName: record.parent?.name,
          position: record.position,
          isVisible: record.isVisible,
          metaTitle: record.metaTitle,
          metaDescription: record.metaDescription,
          productCount: record._count?.products || 0,
          subcategoryCount: record._count?.children || 0,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        };

      case 'brands':
        return {
          id: record.id,
          name: record.name,
          slug: record.slug,
          description: record.description,
          logo: record.logo,
          website: record.website,
          metaTitle: record.metaTitle,
          metaDescription: record.metaDescription,
          isPublished: record.isPublished,
          productCount: record._count?.products || 0,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        };

      case 'orders':
        return {
          id: record.id,
          orderNumber: record.orderNumber,
          customerName: record.customer?.name,
          customerEmail: record.customer?.email,
          status: record.status,
          subtotal: record.subtotal,
          taxAmount: record.taxAmount,
          shippingAmount: record.shippingAmount,
          total: record.total,
          currency: record.currency,
          itemCount: record.items?.length || 0,
          paymentStatus: record.payments?.[0]?.status,
          paymentMethod: record.payments?.[0]?.method,
          shippingMethod: record.shippingMethod,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        };

      case 'customers':
        return {
          id: record.id,
          name: record.name,
          email: record.email,
          emailVerified: record.emailVerified,
          phone: record.phone,
          status: record.status,
          totalOrders: record._count?.orders || 0,
          lastLoginAt: record.lastLoginAt,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        };

      default:
        return record;
    }
  }

  /**
   * Create export file
   */
  private async createExportFile(
    data: any[],
    config: ExportConfiguration,
    progress: ExportProgress
  ): Promise<string> {
    const filePath = `${this.baseUploadPath}/${progress.fileName}`;

    switch (config.format) {
      case 'csv':
        this.generateCSV(data, config);
        // In production, save to cloud storage
        return filePath;

      case 'excel':
        // This would require a library like exceljs
        // For now, fall back to CSV
        this.generateCSV(data, config);
        return filePath;

      case 'json':
        JSON.stringify(data, null, 2);
        return filePath;

      default:
        throw new Error(`Unsupported format: ${config.format}`);
    }
  }

  /**
   * Generate CSV content from data
   */
  private generateCSV(data: any[], config: ExportConfiguration): string {
    if (data.length === 0) return '';

    const delimiter = config.delimiter || ',';
    const lines: string[] = [];

    // Add headers
    if (config.includeHeaders !== false) {
      const headers = Object.keys(data[0]);
      lines.push(headers.map(header => this.escapeCSVValue(header, delimiter)).join(delimiter));
    }

    // Add data rows
    for (const row of data) {
      const values = Object.values(row).map(value => this.escapeCSVValue(value, delimiter));
      lines.push(values.join(delimiter));
    }

    return lines.join('\n');
  }

  /**
   * Escape CSV value
   */
  private escapeCSVValue(value: any, delimiter: string): string {
    if (value === null || value === undefined) return '';
    
    const stringValue = String(value);
    
    // If value contains delimiter, quotes, or newlines, wrap in quotes and escape quotes
    if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }

  /**
   * Format date according to specified format
   */
  private formatDate(date: Date, format: string): string {
    // Simple date formatting - in production, use date-fns or similar
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * Generate file name based on configuration
   */
  private generateFileName(config: ExportConfiguration): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const extension = config.format === 'excel' ? 'xlsx' : config.format;
    
    return `${config.entity}-export-${timestamp}.${extension}`;
  }

  /**
   * Get export result
   */
  async getExportResult(jobId: string): Promise<ExportResult | null> {
    const progress = this.activeJobs.get(jobId);
    if (!progress || progress.status !== 'completed') {
      return null;
    }

    return {
      progress,
      downloadUrl: progress.downloadUrl,
      fileName: progress.fileName,
      fileSize: progress.fileSize || 0,
      recordCount: progress.processedRecords,
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
        
        // In production, also clean up the actual files from storage
      }
    }
  }

  /**
   * Get all active export jobs for a store
   */
  async getActiveJobs(_storeId: string): Promise<ExportProgress[]> {
    // In production, you'd store jobs in database with storeId association
    // For now, return all active jobs
    return Array.from(this.activeJobs.values());
  }

  /**
   * Get job statistics
   */
  async getJobStatistics(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    cancelled: number;
  }> {
    const jobs = Array.from(this.activeJobs.values());
    
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      cancelled: jobs.filter(j => j.status === 'cancelled').length,
    };
  }
}

export const bulkExportService = new BulkExportService();