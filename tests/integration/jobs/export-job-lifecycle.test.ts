/**
 * Export Job Lifecycle Integration Tests
 * 
 * T040: Background job infrastructure validation
 * 
 * Tests the complete export job flow:
 * 1. Enqueue export job (API endpoint → export-service)
 * 2. Job record created in database
 * 3. Background worker picks up job
 * 4. CSV generated and uploaded to blob storage
 * 5. Notifications sent (email + in-app)
 * 6. Job status updated (completed/failed)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/lib/db';
import { enqueueOrderExport, processOrderExportJob } from '@/services/export-service';
import { jobQueue } from '@/lib/job-queue-stub';
import * as emailLib from '@/lib/email';
import * as blobLib from '@vercel/blob';

// Mock external dependencies
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({
    url: 'https://blob.vercel-storage.com/test-export.csv',
  }),
}));

describe('Export Job Lifecycle (Integration)', () => {
  let storeId: string;
  let userId: string;

  beforeEach(async () => {
    // Create test store
    const store = await db.store.create({
      data: {
        name: 'Test Store',
        slug: 'test-store',
        currency: 'USD',
        timezone: 'America/New_York',
      },
    });
    storeId = store.id;

    // Create test user
    const user = await db.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed_password',
        role: 'STORE_ADMIN',
      },
    });
    userId = user.id;

    // Create test orders
    for (let i = 0; i < 5; i++) {
      // Create addresses for the order
      const shippingAddr = await db.address.create({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'US',
          storeId,
        },
      });

      const billingAddr = await db.address.create({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'US',
          storeId,
        },
      });

      await db.order.create({
        data: {
          storeId,
          userId,
          orderNumber: `ORD-${1000 + i}`,
          status: 'DELIVERED',
          subtotal: 100 + i * 10,
          tax: 0,
          shippingCost: 0,
          discount: 0,
          shippingAddress: {
            connect: { id: shippingAddr.id },
          },
          billingAddress: {
            connect: { id: billingAddr.id },
          },
        },
      });
    }

    // Clear job queue
    jobQueue.clear();
    jobQueue.stop();
  });

  afterEach(async () => {
    // Clean up test data
    await db.order.deleteMany({ where: { storeId } });
    await db.exportJob.deleteMany({ where: { storeId } });
    await db.user.deleteMany({ where: { id: userId } });
    await db.store.deleteMany({ where: { id: storeId } });
    
    vi.clearAllMocks();
  });

  describe('enqueueOrderExport', () => {
    it('should create export job record in database', async () => {
      const result = await enqueueOrderExport(storeId, userId, {}, 5);

      expect(result.jobId).toBeDefined();
      expect(result.status).toBe('pending');

      const job = await db.exportJob.findUnique({
        where: { id: result.jobId },
      });

      expect(job).toBeDefined();
      expect(job?.storeId).toBe(storeId);
      expect(job?.userId).toBe(userId);
      expect(job?.type).toBe('orders');
      expect(job?.status).toBe('pending');
      expect(job?.totalRows).toBe(5);
    });

    it('should enqueue job in job queue', async () => {
      const result = await enqueueOrderExport(storeId, userId, {}, 5);

      const pendingJobs = jobQueue.getPendingJobs();
      expect(pendingJobs).toHaveLength(1);
      expect(pendingJobs[0].type).toBe('export-orders');
      expect(pendingJobs[0].payload).toEqual({ jobId: result.jobId });
    });

    it('should store filters as JSON', async () => {
      const filters = {
        status: 'DELIVERED' as const,
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31'),
      };

      const result = await enqueueOrderExport(storeId, userId, filters, 5);

      const job = await db.exportJob.findUnique({
        where: { id: result.jobId },
      });

      expect(job?.filters).toBe(JSON.stringify(filters));
    });
  });

  describe('processOrderExportJob', () => {
    it('should process export job successfully', async () => {
      // Enqueue job
      const { jobId } = await enqueueOrderExport(storeId, userId, {}, 5);

      // Process job
      await processOrderExportJob(jobId);

      // Verify job status updated
      const job = await db.exportJob.findUnique({
        where: { id: jobId },
      });

      expect(job?.status).toBe('completed');
      expect(job?.startedAt).toBeDefined();
      expect(job?.completedAt).toBeDefined();
      expect(job?.fileUrl).toBe('https://blob.vercel-storage.com/test-export.csv');
    });

    it('should upload CSV to blob storage', async () => {
      const { jobId } = await enqueueOrderExport(storeId, userId, {}, 5);
      await processOrderExportJob(jobId);

      expect(blobLib.put).toHaveBeenCalledTimes(1);
      expect(blobLib.put).toHaveBeenCalledWith(
        expect.stringContaining('orders-export-'),
        expect.any(String), // CSV content
        expect.objectContaining({
          access: 'public',
          contentType: 'text/csv',
        })
      );
    });

    it('should send email notification', async () => {
      const { jobId } = await enqueueOrderExport(storeId, userId, {}, 5);
      await processOrderExportJob(jobId);

      expect(emailLib.sendEmail).toHaveBeenCalledTimes(1);
      expect(emailLib.sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Your export is ready',
        html: expect.stringContaining('https://blob.vercel-storage.com/test-export.csv'),
      });
    });

    it('should create in-app notification', async () => {
      const { jobId } = await enqueueOrderExport(storeId, userId, {}, 5);
      await processOrderExportJob(jobId);

      const notification = await db.notification.findFirst({
        where: {
          userId,
          type: 'EXPORT_COMPLETED',
        },
      });

      expect(notification).toBeDefined();
      expect(notification?.title).toContain('Export ready');
      expect(notification?.message).toContain('https://blob.vercel-storage.com/test-export.csv');
    });

    it('should handle job failure gracefully', async () => {
      // Mock blob upload failure
      vi.mocked(blobLib.put).mockRejectedValueOnce(new Error('Blob upload failed'));

      const { jobId } = await enqueueOrderExport(storeId, userId, {}, 5);
      
      // Process job (should not throw)
      await expect(processOrderExportJob(jobId)).rejects.toThrow('Blob upload failed');

      // Verify job status updated to failed
      const job = await db.exportJob.findUnique({
        where: { id: jobId },
      });

      expect(job?.status).toBe('failed');
      expect(job?.error).toContain('Blob upload failed');
      expect(job?.startedAt).toBeDefined();
      expect(job?.completedAt).toBeDefined();
    });

    it('should apply filters to export', async () => {
      const filters = {
        status: 'DELIVERED' as const,
      };

      const { jobId } = await enqueueOrderExport(storeId, userId, filters, 5);
      await processOrderExportJob(jobId);

      // Verify CSV content includes filtered orders
      const csvContent = vi.mocked(blobLib.put).mock.calls[0][1] as string;
      expect(csvContent).toContain('ORD-1000');
      expect(csvContent).toContain('DELIVERED');
    });
  });

  describe('job queue integration', () => {
    it('should process job via queue worker', async () => {
      // Enqueue job
      const { jobId } = await enqueueOrderExport(storeId, userId, {}, 5);

      // Process via queue
      await jobQueue.processNextJob();

      // Verify job completed
      const job = await db.exportJob.findUnique({
        where: { id: jobId },
      });

      expect(job?.status).toBe('completed');
      expect(job?.fileUrl).toBeDefined();
    });

    it('should retry failed job', async () => {
      // Mock first attempt fails, second succeeds
      vi.mocked(blobLib.put)
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockResolvedValueOnce({
          url: 'https://blob.vercel-storage.com/test-export.csv',
          downloadUrl: 'https://blob.vercel-storage.com/test-export.csv',
          pathname: 'test-export.csv',
          contentType: 'text/csv',
          contentDisposition: 'attachment; filename="test-export.csv"',
        });

      const { jobId } = await enqueueOrderExport(storeId, userId, {}, 5);

      // First attempt (fails)
      await jobQueue.processNextJob();
      
      let job = await db.exportJob.findUnique({
        where: { id: jobId },
      });
      expect(job?.status).toBe('failed');

      // Manually trigger retry (bypass delay)
      const queueJob = jobQueue.getJob(
        jobQueue.getPendingJobs().find((j) => (j.payload as any).jobId === jobId)?.id || ''
      );
      if (queueJob) queueJob.scheduledFor = new Date();

      // Second attempt (succeeds)
      await jobQueue.processNextJob();

      job = await db.exportJob.findUnique({
        where: { id: jobId },
      });
      expect(job?.status).toBe('completed');
    });
  });

  describe('CSV generation', () => {
    it('should generate valid CSV with headers', async () => {
      const { jobId } = await enqueueOrderExport(storeId, userId, {}, 5);
      await processOrderExportJob(jobId);

      const csvContent = vi.mocked(blobLib.put).mock.calls[0][1] as string;
      const lines = csvContent.split('\n');

      expect(lines[0]).toContain('Order Number');
      expect(lines[0]).toContain('Status');
      expect(lines[0]).toContain('Total');
      expect(lines[0]).toContain('Customer Email');
    });

    it('should include all orders in CSV', async () => {
      const { jobId } = await enqueueOrderExport(storeId, userId, {}, 5);
      await processOrderExportJob(jobId);

      const csvContent = vi.mocked(blobLib.put).mock.calls[0][1] as string;
      const lines = csvContent.split('\n');

      // Header + 5 orders
      expect(lines.length).toBeGreaterThanOrEqual(6);
    });
  });
});
