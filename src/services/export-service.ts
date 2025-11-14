/**
 * Export Service - Async CSV Export for Large Datasets (>10k rows)
 * 
 * Implements T029: Async export job enqueue with email + in-app notification
 * 
 * Architecture:
 * - Job enqueue: Creates export job record in database
 * - Background processing: Job worker fetches data in batches
 * - File storage: Uploads CSV to Vercel Blob Storage
 * - Dual notification: Email + in-app notification with download link
 * 
 * Flow:
 * 1. API endpoint enqueues export job (status: pending)
 * 2. Background worker picks up job
 * 3. Worker generates CSV in batches, uploads to blob storage
 * 4. Worker updates job status (completed/failed)
 * 5. Worker sends email + creates in-app notification
 * 
 * @module export-service
 */

import { db } from '@/lib/db';
import { OrderStatus } from '@prisma/client';
import { sendEmail } from '@/lib/email';
import { put } from '@vercel/blob';
import { jobQueue } from '@/lib/job-queue-stub';

// Register export job handler (auto-called when module loads)
jobQueue.registerHandler('export-orders', async (payload: { jobId: string }) => {
  await processOrderExportJob(payload.jobId);
});

/**
 * Export job status
 */
export type ExportJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Export job type
 */
export interface ExportJob {
  id: string;
  storeId: string;
  userId: string;
  type: 'orders' | 'customers' | 'products';
  status: ExportJobStatus;
  filters: Record<string, unknown>;
  totalRows: number;
  fileUrl?: string;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Export filters for orders
 */
export interface OrderExportFilters {
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

/**
 * Enqueue an export job
 * 
 * Creates database record for background processing
 * Returns job ID for client polling
 */
export async function enqueueOrderExport(
  storeId: string,
  userId: string,
  filters: OrderExportFilters,
  totalRows: number
): Promise<{ jobId: string; status: ExportJobStatus }> {
  // Create export job record
  const job = await db.exportJob.create({
    data: {
      storeId,
      userId,
      type: 'orders',
      status: 'pending',
      filters: JSON.stringify(filters),
      totalRows,
    },
  });

  // Enqueue job for background processing (T040: Job queue integration)
  await jobQueue.enqueue('export-orders', {
    jobId: job.id,
  });

  return {
    jobId: job.id,
    status: 'pending',
  };
}

/**
 * Process export job (called by background worker)
 * 
 * Generates CSV, uploads to blob storage, sends notifications
 */
export async function processOrderExportJob(jobId: string): Promise<void> {
  // Fetch job
  const job = await db.exportJob.findUnique({
    where: { id: jobId },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (!job) {
    throw new Error(`Export job ${jobId} not found`);
  }

  if (job.status !== 'pending') {
    throw new Error(`Export job ${jobId} is not pending (status: ${job.status})`);
  }

  try {
    // Update status to processing
    await db.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'processing',
        startedAt: new Date(),
      },
    });

    // Generate CSV in batches
    const csv = await generateOrdersCSV(
      job.storeId,
      JSON.parse(job.filters) as OrderExportFilters
    );

    // Upload to Vercel Blob Storage
    const filename = `orders-export-${job.storeId}-${Date.now()}.csv`;
    const blob = await put(filename, csv, {
      access: 'public',
      contentType: 'text/csv',
    });

    // Update job with file URL
    await db.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        fileUrl: blob.url,
      },
    });

    // Send email notification
    await sendExportCompleteEmail(
      job.user.email,
      job.user.name || 'User',
      blob.url,
      job.totalRows
    );

    // Create in-app notification
    await db.notification.create({
      data: {
        userId: job.userId,
        type: 'export_complete',
        title: 'Export Ready',
        message: `Your order export (${job.totalRows.toLocaleString()} rows) is ready for download.`,
        linkUrl: blob.url,
        linkText: 'Download CSV',
      },
    });

    console.log(`[Export Service] Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`[Export Service] Job ${jobId} failed:`, error);

    // Update job status to failed
    await db.exportJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    // Send failure notification
    await db.notification.create({
      data: {
        userId: job.userId,
        type: 'export_failed',
        title: 'Export Failed',
        message: 'Your order export failed. Please try again or contact support.',
      },
    });
  }
}

/**
 * Generate CSV for orders (batch processing)
 * 
 * Processes in batches to avoid memory issues
 * Uses string concatenation (faster than array join for large datasets)
 */
async function generateOrdersCSV(
  storeId: string,
  filters: OrderExportFilters
): Promise<string> {
  let csv = 'Order Number,Customer Email,Status,Total Amount,Currency,Created At,Items Count,Payment Status\n';

  const BATCH_SIZE = 1000;
  let skip = 0;
  let hasMore = true;

  const where: Record<string, unknown> = {
    storeId,
    deletedAt: null,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      (where.createdAt as Record<string, unknown>).gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (where.createdAt as Record<string, unknown>).lte = filters.dateTo;
    }
  }

  if (filters.search) {
    where.OR = [
      { orderNumber: { contains: filters.search, mode: 'insensitive' } },
      {
        customer: {
          email: { contains: filters.search, mode: 'insensitive' },
        },
      },
    ];
  }

  while (hasMore) {
    const orders = await db.order.findMany({
      where,
      select: {
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        customer: {
          select: { email: true },
        },
        items: {
          select: { id: true },
        },
        paymentStatus: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: BATCH_SIZE,
    });

    if (orders.length === 0) {
      hasMore = false;
      break;
    }

    for (const order of orders) {
      const customerEmail = order.customer?.email || '';
      const itemsCount = order.items?.length || 0;

      const row = [
        escapeCsvField(order.orderNumber),
        escapeCsvField(customerEmail),
        escapeCsvField(order.status),
        order.totalAmount.toFixed(2),
        'USD', // Default currency
        order.createdAt.toISOString(),
        itemsCount.toString(),
        escapeCsvField(order.paymentStatus),
      ].join(',');

      csv += row + '\n';
    }

    skip += BATCH_SIZE;

    if (orders.length < BATCH_SIZE) {
      hasMore = false;
    }
  }

  return csv;
}

/**
 * Escape CSV field
 */
function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Send export complete email
 */
async function sendExportCompleteEmail(
  to: string,
  name: string,
  downloadUrl: string,
  totalRows: number
): Promise<void> {
  const subject = 'Your Order Export is Ready';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Export Complete</h2>
      <p>Hi ${name},</p>
      <p>Your order export is ready for download.</p>
      <ul>
        <li><strong>Total rows:</strong> ${totalRows.toLocaleString()}</li>
        <li><strong>Format:</strong> CSV</li>
      </ul>
      <p>
        <a href="${downloadUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #0070f3;
          color: white;
          text-decoration: none;
          border-radius: 6px;
        ">Download CSV</a>
      </p>
      <p style="color: #666; font-size: 14px;">
        This link will expire in 7 days. Please download your export soon.
      </p>
    </div>
  `;

  await sendEmail({
    to,
    subject,
    html,
  });
}

/**
 * Get export job status
 */
export async function getExportJobStatus(
  jobId: string,
  userId: string
): Promise<ExportJob | null> {
  const job = await db.exportJob.findFirst({
    where: {
      id: jobId,
      userId, // Ensure user owns the job
    },
  });

  if (!job) {
    return null;
  }

  return {
    id: job.id,
    storeId: job.storeId,
    userId: job.userId,
    type: job.type as 'orders' | 'customers' | 'products',
    status: job.status as ExportJobStatus,
    filters: JSON.parse(job.filters) as Record<string, unknown>,
    totalRows: job.totalRows,
    fileUrl: job.fileUrl || undefined,
    error: job.error || undefined,
    createdAt: job.createdAt,
    startedAt: job.startedAt || undefined,
    completedAt: job.completedAt || undefined,
  };
}

/**
 * Cancel export job
 */
export async function cancelExportJob(
  jobId: string,
  userId: string
): Promise<boolean> {
  const job = await db.exportJob.findFirst({
    where: {
      id: jobId,
      userId,
      status: { in: ['pending', 'processing'] },
    },
  });

  if (!job) {
    return false;
  }

  await db.exportJob.update({
    where: { id: jobId },
    data: {
      status: 'failed',
      error: 'Cancelled by user',
      completedAt: new Date(),
    },
  });

  return true;
}
