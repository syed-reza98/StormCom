/**
 * Job Queue Stub - Lightweight Development/Test Job Processing
 * 
 * T040: Background job infrastructure validation
 * 
 * Purpose:
 * - Provides synchronous job processing for development and testing environments
 * - Avoids external dependencies (Redis, BullMQ, SQS) in local development
 * - Maintains same interface as production job queue for compatibility
 * 
 * Architecture:
 * - In-memory queue for pending jobs
 * - Polling mechanism (setInterval) to process jobs
 * - Singleton instance per Node.js process
 * - Auto-starts worker in development mode
 * 
 * Production:
 * - Replace with Vercel Cron (hourly/daily jobs)
 * - Or integrate external queue (BullMQ with Redis, AWS SQS)
 * - Or use Vercel Serverless Functions with webhook triggers
 * 
 * Usage:
 * ```typescript
 * import { jobQueue } from '@/lib/job-queue-stub';
 * 
 * // Enqueue job
 * await jobQueue.enqueue('export-orders', { jobId: '123', storeId: 'store_1' });
 * 
 * // Register handler
 * jobQueue.registerHandler('export-orders', async (payload) => {
 *   await processOrderExportJob(payload.jobId);
 * });
 * 
 * // Start worker (auto-starts in dev)
 * jobQueue.start();
 * ```
 * 
 * @module lib/job-queue-stub
 */

/**
 * Job payload with metadata
 */
export interface Job<T = unknown> {
  id: string;
  type: string;
  payload: T;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledFor?: Date;
  error?: string;
}

/**
 * Job handler function
 */
export type JobHandler<T = unknown> = (payload: T) => Promise<void>;

/**
 * Job queue configuration
 */
export interface JobQueueConfig {
  pollInterval: number; // milliseconds
  maxConcurrency: number;
  maxAttempts: number;
  retryDelay: number; // milliseconds
  autoStart: boolean;
}

/**
 * Default configuration for development
 */
const DEFAULT_CONFIG: JobQueueConfig = {
  pollInterval: 5000, // 5 seconds
  maxConcurrency: 3, // Process 3 jobs concurrently
  maxAttempts: 3, // Retry up to 3 times
  retryDelay: 10000, // 10 second delay between retries
  autoStart: process.env.NODE_ENV === 'development', // Auto-start in dev
};

/**
 * Lightweight job queue for development and testing
 * 
 * Provides in-memory job processing without external dependencies
 */
export class JobQueueStub {
  private queue: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private processing: Set<string> = new Set();
  private config: JobQueueConfig;
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;

  constructor(config: Partial<JobQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.autoStart) {
      this.start();
    }
  }

  /**
   * Enqueue a job for processing
   * 
   * @param type Job type (e.g., 'export-orders', 'send-email')
   * @param payload Job data
   * @param scheduledFor Optional: Schedule job for future execution
   * @returns Job ID
   */
  async enqueue<T = unknown>(
    type: string,
    payload: T,
    scheduledFor?: Date
  ): Promise<string> {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: Job<T> = {
      id,
      type,
      payload,
      attempts: 0,
      maxAttempts: this.config.maxAttempts,
      createdAt: new Date(),
      scheduledFor,
    };

    this.queue.set(id, job as Job);
    
    console.log(`[JobQueue] Enqueued job ${id} (type: ${type})`);
    
    // If not auto-started, process immediately (useful for tests)
    if (!this.isRunning) {
      await this.processNextJob();
    }

    return id;
  }

  /**
   * Register a job handler
   * 
   * @param type Job type
   * @param handler Job processing function
   */
  registerHandler<T = unknown>(type: string, handler: JobHandler<T>): void {
    this.handlers.set(type, handler as JobHandler);
    console.log(`[JobQueue] Registered handler for job type: ${type}`);
  }

  /**
   * Start background worker
   * 
   * Polls queue at configured interval
   */
  start(): void {
    if (this.isRunning) {
      console.log('[JobQueue] Worker already running');
      return;
    }

    this.isRunning = true;
    console.log(`[JobQueue] Starting worker (poll interval: ${this.config.pollInterval}ms)`);

    this.intervalId = setInterval(() => {
      this.processJobs();
    }, this.config.pollInterval);
  }

  /**
   * Stop background worker
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    console.log('[JobQueue] Worker stopped');
  }

  /**
   * Get job status
   * 
   * @param jobId Job ID
   * @returns Job or null if not found
   */
  getJob(jobId: string): Job | null {
    return this.queue.get(jobId) || null;
  }

  /**
   * Get all pending jobs
   */
  getPendingJobs(): Job[] {
    const now = new Date();
    return Array.from(this.queue.values()).filter(
      (job) =>
        !this.processing.has(job.id) &&
        (!job.scheduledFor || job.scheduledFor <= now)
    );
  }

  /**
   * Clear all jobs (for testing)
   */
  clear(): void {
    this.queue.clear();
    this.processing.clear();
    console.log('[JobQueue] Cleared all jobs');
  }

  /**
   * Process jobs in queue (called by interval)
   */
  private async processJobs(): Promise<void> {
    const pendingJobs = this.getPendingJobs();
    const availableSlots = this.config.maxConcurrency - this.processing.size;

    if (pendingJobs.length === 0 || availableSlots <= 0) {
      return;
    }

    const jobsToProcess = pendingJobs.slice(0, availableSlots);

    await Promise.all(
      jobsToProcess.map((job) => this.processJob(job))
    );
  }

  /**
   * Process next job (for synchronous testing)
   */
  async processNextJob(): Promise<boolean> {
    const pendingJobs = this.getPendingJobs();
    
    if (pendingJobs.length === 0) {
      return false;
    }

    await this.processJob(pendingJobs[0]);
    return true;
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    if (this.processing.has(job.id)) {
      return; // Already processing
    }

    this.processing.add(job.id);
    console.log(`[JobQueue] Processing job ${job.id} (type: ${job.type}, attempt: ${job.attempts + 1}/${job.maxAttempts})`);

    try {
      const handler = this.handlers.get(job.type);
      
      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.type}`);
      }

      await handler(job.payload);
      
      // Success - remove from queue
      this.queue.delete(job.id);
      this.processing.delete(job.id);
      
      console.log(`[JobQueue] Job ${job.id} completed successfully`);
    } catch (error) {
      job.attempts++;
      job.error = error instanceof Error ? error.message : String(error);
      
      console.error(`[JobQueue] Job ${job.id} failed (attempt ${job.attempts}/${job.maxAttempts}):`, error);

      if (job.attempts >= job.maxAttempts) {
        // Max attempts reached - remove from queue
        this.queue.delete(job.id);
        console.error(`[JobQueue] Job ${job.id} failed permanently after ${job.attempts} attempts`);
      } else {
        // Schedule retry
        job.scheduledFor = new Date(Date.now() + this.config.retryDelay);
        console.log(`[JobQueue] Job ${job.id} will retry in ${this.config.retryDelay}ms`);
      }

      this.processing.delete(job.id);
    }
  }
}

/**
 * Singleton job queue instance
 */
export const jobQueue = new JobQueueStub();

/**
 * Production-ready job queue interface (not implemented)
 * 
 * In production, replace JobQueueStub with:
 * - Vercel Cron: Schedule hourly/daily job processing via /api/cron/process-jobs
 * - BullMQ: Distributed job queue with Redis backend
 * - AWS SQS: Message queue with Lambda workers
 * 
 * Example Vercel Cron (vercel.json):
 * ```json
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-jobs",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 * ```
 */
export interface ProductionJobQueue {
  enqueue<T>(type: string, payload: T, options?: {
    scheduledFor?: Date;
    priority?: number;
    maxAttempts?: number;
  }): Promise<string>;
  
  registerHandler<T>(type: string, handler: JobHandler<T>): void;
  
  getJob(jobId: string): Promise<Job | null>;
  
  cancelJob(jobId: string): Promise<boolean>;
}
