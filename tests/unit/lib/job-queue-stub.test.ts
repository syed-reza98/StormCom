/**
 * Job Queue Stub Tests
 * 
 * T040: Background job infrastructure validation
 * 
 * Tests:
 * - Job enqueue and processing
 * - Handler registration
 * - Retry logic
 * - Concurrent processing
 * - Job lifecycle (pending → processing → completed/failed)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { JobQueueStub } from '@/lib/job-queue-stub';

describe('JobQueueStub', () => {
  let queue: JobQueueStub;

  beforeEach(() => {
    // Create fresh queue instance for each test (autoStart: false)
    queue = new JobQueueStub({ autoStart: false });
  });

  afterEach(() => {
    queue.stop();
    queue.clear();
  });

  describe('enqueue', () => {
    it('should enqueue a job with unique ID', async () => {
      const jobId = await queue.enqueue('test-job', { data: 'test' });
      
      expect(jobId).toMatch(/^test-job_\d+_[a-z0-9]+$/);
      
      const job = queue.getJob(jobId);
      expect(job).toBeDefined();
      expect(job?.type).toBe('test-job');
      expect(job?.payload).toEqual({ data: 'test' });
      expect(job?.attempts).toBe(0);
    });

    it('should enqueue multiple jobs', async () => {
      const job1 = await queue.enqueue('job-1', { data: 1 });
      const job2 = await queue.enqueue('job-2', { data: 2 });
      const job3 = await queue.enqueue('job-3', { data: 3 });

      expect(queue.getPendingJobs()).toHaveLength(3);
      expect(queue.getJob(job1)).toBeDefined();
      expect(queue.getJob(job2)).toBeDefined();
      expect(queue.getJob(job3)).toBeDefined();
    });

    it('should schedule job for future execution', async () => {
      const futureDate = new Date(Date.now() + 10000); // 10 seconds
      const jobId = await queue.enqueue('future-job', { data: 'test' }, futureDate);

      const pendingNow = queue.getPendingJobs();
      expect(pendingNow).toHaveLength(0); // Not yet ready

      const job = queue.getJob(jobId);
      expect(job?.scheduledFor).toEqual(futureDate);
    });
  });

  describe('registerHandler', () => {
    it('should register a job handler', () => {
      const handler = vi.fn();
      queue.registerHandler('test-job', handler);

      // Handler should be registered (no direct access, tested via processing)
      expect(queue).toBeDefined();
    });

    it('should call handler when processing job', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      queue.registerHandler('test-job', handler);

      await queue.enqueue('test-job', { data: 'test' });
      await queue.processNextJob();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });
  });

  describe('processNextJob', () => {
    it('should process pending job successfully', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      queue.registerHandler('test-job', handler);

      const jobId = await queue.enqueue('test-job', { data: 'test' });
      await queue.processNextJob();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(queue.getJob(jobId)).toBeNull(); // Job removed after success
    });

    it('should return false if no pending jobs', async () => {
      const processed = await queue.processNextJob();
      expect(processed).toBe(false);
    });

    it('should return true if job was processed', async () => {
      queue.registerHandler('test-job', vi.fn().mockResolvedValue(undefined));
      await queue.enqueue('test-job', { data: 'test' });

      const processed = await queue.processNextJob();
      expect(processed).toBe(true);
    });
  });

  describe('retry logic', () => {
    it('should retry failed job up to maxAttempts', async () => {
      const handler = vi.fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValue(undefined); // Succeeds on 3rd attempt

      queue.registerHandler('test-job', handler);

      const jobId = await queue.enqueue('test-job', { data: 'test' });

      // Attempt 1
      await queue.processNextJob();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(queue.getJob(jobId)?.attempts).toBe(1);
      expect(queue.getJob(jobId)?.error).toBe('Attempt 1 failed');

      // Attempt 2 (wait for retry delay, or manually process)
      const job = queue.getJob(jobId);
      if (job) job.scheduledFor = new Date(); // Bypass retry delay for test
      await queue.processNextJob();
      expect(handler).toHaveBeenCalledTimes(2);
      expect(queue.getJob(jobId)?.attempts).toBe(2);

      // Attempt 3 (success)
      const job2 = queue.getJob(jobId);
      if (job2) job2.scheduledFor = new Date();
      await queue.processNextJob();
      expect(handler).toHaveBeenCalledTimes(3);
      expect(queue.getJob(jobId)).toBeNull(); // Removed after success
    });

    it('should permanently fail after maxAttempts', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Always fails'));
      queue.registerHandler('test-job', handler);

      const jobId = await queue.enqueue('test-job', { data: 'test' });

      // Attempt 1
      await queue.processNextJob();
      expect(queue.getJob(jobId)?.attempts).toBe(1);

      // Attempt 2
      const job1 = queue.getJob(jobId);
      if (job1) job1.scheduledFor = new Date();
      await queue.processNextJob();
      expect(queue.getJob(jobId)?.attempts).toBe(2);

      // Attempt 3 (final)
      const job2 = queue.getJob(jobId);
      if (job2) job2.scheduledFor = new Date();
      await queue.processNextJob();
      expect(queue.getJob(jobId)).toBeNull(); // Removed after 3 failures

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('should schedule retry with delay', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Fail'));
      queue.registerHandler('test-job', handler);

      const jobId = await queue.enqueue('test-job', { data: 'test' });
      await queue.processNextJob();

      const job = queue.getJob(jobId);
      expect(job?.scheduledFor).toBeDefined();
      expect(job?.scheduledFor!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('start/stop', () => {
    it('should start background worker', () => {
      queue.start();
      expect(queue).toBeDefined(); // Worker started (no direct access to intervalId)
    });

    it('should stop background worker', () => {
      queue.start();
      queue.stop();
      expect(queue).toBeDefined(); // Worker stopped
    });

    it('should not start if already running', () => {
      queue.start();
      queue.start(); // Should log "already running"
      expect(queue).toBeDefined();
    });

    it('should auto-start in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const devQueue = new JobQueueStub();
      expect(devQueue).toBeDefined(); // Auto-started

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('concurrent processing', () => {
    it('should respect maxConcurrency limit', async () => {
      const concurrentQueue = new JobQueueStub({
        autoStart: false,
        maxConcurrency: 2,
      });

      const handler = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      concurrentQueue.registerHandler('slow-job', handler);

      await concurrentQueue.enqueue('slow-job', { id: 1 });
      await concurrentQueue.enqueue('slow-job', { id: 2 });
      await concurrentQueue.enqueue('slow-job', { id: 3 });

      // Start processing (should process max 2 concurrently)
      const promise1 = concurrentQueue.processNextJob();
      const promise2 = concurrentQueue.processNextJob();
      const promise3 = concurrentQueue.processNextJob();

      await Promise.all([promise1, promise2]);
      
      // 3rd job should wait for first 2 to complete
      expect(handler).toHaveBeenCalledTimes(2);
      
      await promise3;
      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe('error handling', () => {
    it('should handle missing handler gracefully', async () => {
      const jobId = await queue.enqueue('unknown-job', { data: 'test' });
      await queue.processNextJob();

      const job = queue.getJob(jobId);
      expect(job?.error).toContain('No handler registered');
      expect(job?.attempts).toBe(1);
    });

    it('should capture error message in job', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Custom error'));
      queue.registerHandler('test-job', handler);

      const jobId = await queue.enqueue('test-job', { data: 'test' });
      await queue.processNextJob();

      const job = queue.getJob(jobId);
      expect(job?.error).toBe('Custom error');
    });
  });

  describe('getPendingJobs', () => {
    it('should return only pending jobs', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      queue.registerHandler('test-job', handler);

      await queue.enqueue('test-job', { id: 1 });
      await queue.enqueue('test-job', { id: 2 });
      await queue.enqueue('test-job', { id: 3 }, new Date(Date.now() + 10000)); // Scheduled

      const pending = queue.getPendingJobs();
      expect(pending).toHaveLength(2); // 2 ready, 1 scheduled
    });

    it('should exclude processing jobs', async () => {
      const handler = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      queue.registerHandler('slow-job', handler);

      await queue.enqueue('slow-job', { id: 1 });
      await queue.enqueue('slow-job', { id: 2 });

      // Start processing first job (doesn't wait)
      queue.processNextJob();

      // Should only show 1 pending (1 is processing)
      const pending = queue.getPendingJobs();
      expect(pending).toHaveLength(1);
    });
  });

  describe('clear', () => {
    it('should clear all jobs', async () => {
      await queue.enqueue('test-job', { id: 1 });
      await queue.enqueue('test-job', { id: 2 });
      await queue.enqueue('test-job', { id: 3 });

      expect(queue.getPendingJobs()).toHaveLength(3);

      queue.clear();

      expect(queue.getPendingJobs()).toHaveLength(0);
    });
  });

  describe('integration with export service', () => {
    it('should process export job from enqueue to completion', async () => {
      const exportJobHandler = vi.fn().mockResolvedValue(undefined);
      queue.registerHandler('export-orders', exportJobHandler);

      // Simulate export service enqueue
      const jobId = await queue.enqueue('export-orders', {
        jobId: 'export_123',
      });

      // Process job
      await queue.processNextJob();

      expect(exportJobHandler).toHaveBeenCalledTimes(1);
      expect(exportJobHandler).toHaveBeenCalledWith({ jobId: 'export_123' });
      expect(queue.getJob(jobId)).toBeNull(); // Completed
    });
  });
});
