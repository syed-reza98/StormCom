// src/app/api/products/export/route.ts
// Bulk Product Export API Route

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { bulkExportService } from '@/services/bulk-export-service';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const exportConfigSchema = z.object({
  format: z.enum(['csv', 'excel', 'json']).default('csv'),
  fields: z.array(z.string()).optional(),
  filters: z.object({
    search: z.string().optional(),
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    priceFrom: z.number().min(0).optional(),
    priceTo: z.number().min(0).optional(),
    inventoryStatus: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }).optional(),
  includeDeleted: z.boolean().default(false),
  maxRecords: z.number().min(1).max(100000).default(50000),
  dateFormat: z.string().default('YYYY-MM-DD HH:mm:ss'),
  includeHeaders: z.boolean().default(true),
  delimiter: z.string().default(','),
});

// ============================================================================
// POST /api/products/export - Start bulk export
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedConfig = exportConfigSchema.parse(body);

    // Start the export process
    const result = await bulkExportService.startExport(session.user.storeId, {
      entity: 'products',
      ...validatedConfig,
    });

    return NextResponse.json({
      data: {
        jobId: result.jobId,
        progress: result.progress,
      },
      message: 'Export job started successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid input', 
            changes: error.errors 
          } 
        },
        { status: 400 }
      );
    }

    console.error('Error starting export:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to start export' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/products/export - Get export status/progress or download result
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const download = searchParams.get('download') === 'true';

    if (!jobId) {
      return NextResponse.json(
        { error: { code: 'MISSING_JOB_ID', message: 'Job ID is required' } },
        { status: 400 }
      );
    }

    if (download) {
      // Get export result for download
      const result = await bulkExportService.getExportResult(jobId);

      if (!result) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Export result not found or not ready' } },
          { status: 404 }
        );
      }

      // In a real implementation, you would stream the file from storage
      // For now, return the download URL
      return NextResponse.json({
        data: {
          downloadUrl: result.downloadUrl,
          fileName: result.fileName,
          fileSize: result.fileSize,
          recordCount: result.recordCount,
        },
      });
    } else {
      // Get export progress
      const progress = await bulkExportService.getProgress(jobId);

      if (!progress) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Export job not found' } },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: progress });
    }
  } catch (error) {
    console.error('Error fetching export data:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch export data' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/products/export - Cancel export job
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: { code: 'MISSING_JOB_ID', message: 'Job ID is required' } },
        { status: 400 }
      );
    }

    const cancelled = await bulkExportService.cancelExport(jobId);

    if (!cancelled) {
      return NextResponse.json(
        { error: { code: 'CANCEL_FAILED', message: 'Export job could not be cancelled' } },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Export job cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling export:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel export' } },
      { status: 500 }
    );
  }
}