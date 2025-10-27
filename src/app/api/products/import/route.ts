// src/app/api/products/import/route.ts
// Bulk Product Import API Route

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { bulkImportService } from '@/services/bulk-import-service';
import { z } from 'zod';

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

const startImportSchema = z.object({
  csvData: z.string().min(1, 'CSV data is required'),
  config: importConfigSchema.optional(),
});

// ============================================================================
// POST /api/products/import - Start bulk import
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
    const validatedData = startImportSchema.parse(body);

    // Start the import process
    const result = await bulkImportService.startImport(
      session.user.storeId,
      validatedData.csvData,
      validatedData.config || {}
    );

    return NextResponse.json({
      data: {
        jobId: result.jobId,
        progress: result.progress,
      },
      message: 'Import job started successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid input', 
            details: error.errors 
          } 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Handle specific business logic errors
      if (error.message.includes('CSV')) {
        return NextResponse.json(
          { error: { code: 'CSV_ERROR', message: error.message } },
          { status: 400 }
        );
      }
    }

    console.error('Error starting import:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to start import' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/products/import - Get import status/progress
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

    if (!jobId) {
      return NextResponse.json(
        { error: { code: 'MISSING_JOB_ID', message: 'Job ID is required' } },
        { status: 400 }
      );
    }

    const progress = await bulkImportService.getProgress(jobId);

    if (!progress) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Import job not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: progress });
  } catch (error) {
    console.error('Error fetching import progress:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch import progress' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/products/import - Cancel import job
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

    const cancelled = await bulkImportService.cancelImport(jobId);

    if (!cancelled) {
      return NextResponse.json(
        { error: { code: 'CANCEL_FAILED', message: 'Import job could not be cancelled' } },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Import job cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling import:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel import' } },
      { status: 500 }
    );
  }
}