/**
 * GET /api/exports/[jobId]
 * 
 * Get export job status and download URL
 * 
 * Implements job status polling for async exports (T029)
 * 
 * @requires Authentication
 * @returns Export job details with status and file URL (if completed)
 */

import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';

import { createApiHandler, middlewareStacks } from '@/lib/api-middleware';
import { 
  successResponse,
  notFoundResponse,
  forbiddenResponse,
} from '@/lib/api-response';
import { getExportJobStatus } from '@/services/export-service';

export const GET = createApiHandler(
  middlewareStacks.authenticated,
  async (_request: NextRequest, context) => {
    const jobId = context.params?.jobId;

    if (!jobId) {
      return notFoundResponse('Job ID is required');
    }

    const userId = context.session!.user.id;

    // Fetch job status (enforces ownership)
    const job = await getExportJobStatus(jobId, userId);

    if (!job) {
      return notFoundResponse('Export job not found');
    }

    return successResponse(job, {
      message: 'Export job retrieved successfully',
    });
  }
);
