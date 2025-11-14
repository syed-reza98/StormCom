/**
 * Integration tests for GET /api/exports/[jobId]
 * 
 * Tests export job status retrieval and ownership enforcement.
 * Validates async export workflow (T029).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '@/app/api/exports/[jobId]/route';
import { getExportJobStatus } from '@/services/export-service';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('@/services/export-service');
vi.mock('@/lib/api-middleware', async () => {
  const actual = await vi.importActual('@/lib/api-middleware');
  return {
    ...actual,
    createApiHandler: (middlewares: any, handler: any) => {
      return async (request: any, context: any) => {
        // Simulate authenticated middleware
        context = context || { params: {} };
        context.session = {
          user: { id: 'user-1', email: 'test@example.com' },
        };
        return handler(request, context);
      };
    },
  };
});

describe('GET /api/exports/[jobId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Job Retrieval', () => {
    it('should return 404 when jobId is missing', async () => {
      const request = new Request('http://localhost:3000/api/exports/') as any;
      const context = { params: {}, session: { user: { id: 'user-1' } } };

      const response = await GET(request, context as any);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.message).toBe('Job ID is required');
    });

    it('should return 404 when job does not exist', async () => {
      vi.mocked(getExportJobStatus).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/exports/job-123') as any;
      const context = {
        params: { jobId: 'job-123' },
        session: { user: { id: 'user-1' } },
      };

      const response = await GET(request, context as any);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.message).toBe('Export job not found');
    });

    it('should return job details when job exists and user owns it', async () => {
      const mockJob = {
        id: 'job-123',
        userId: 'user-1',
        storeId: 'store-1',
        type: 'ORDERS',
        status: 'COMPLETED',
        fileUrl: 'https://storage.example.com/exports/orders-2025-01-26.csv',
        rowCount: 5000,
        estimatedRows: 5000,
        createdAt: new Date('2025-01-26T10:00:00Z'),
        completedAt: new Date('2025-01-26T10:05:00Z'),
        expiresAt: new Date('2025-02-02T10:00:00Z'),
      };

      vi.mocked(getExportJobStatus).mockResolvedValue(mockJob as any);

      const request = new Request('http://localhost:3000/api/exports/job-123') as any;
      const context = {
        params: { jobId: 'job-123' },
        session: { user: { id: 'user-1' } },
      };

      const response = await GET(request, context as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      
      expect(body.data).toBeDefined();
      expect(body.data.id).toBe('job-123');
      expect(body.data.status).toBe('COMPLETED');
      expect(body.data.fileUrl).toBe('https://storage.example.com/exports/orders-2025-01-26.csv');
      expect(body.message).toBe('Export job retrieved successfully');
    });
  });

  describe('Job Status Variants', () => {
    it('should return PENDING status for queued jobs', async () => {
      const mockJob = {
        id: 'job-456',
        userId: 'user-1',
        storeId: 'store-1',
        type: 'PRODUCTS',
        status: 'PENDING',
        fileUrl: null,
        rowCount: null,
        estimatedRows: 15000,
        createdAt: new Date('2025-01-26T11:00:00Z'),
        completedAt: null,
        expiresAt: null,
      };

      vi.mocked(getExportJobStatus).mockResolvedValue(mockJob as any);

      const request = new Request('http://localhost:3000/api/exports/job-456') as any;
      const context = {
        params: { jobId: 'job-456' },
        session: { user: { id: 'user-1' } },
      };

      const response = await GET(request, context as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      
      expect(body.data.status).toBe('PENDING');
      expect(body.data.fileUrl).toBeNull();
      expect(body.data.estimatedRows).toBe(15000);
    });

    it('should return PROCESSING status for in-progress jobs', async () => {
      const mockJob = {
        id: 'job-789',
        userId: 'user-1',
        storeId: 'store-1',
        type: 'ORDERS',
        status: 'PROCESSING',
        fileUrl: null,
        rowCount: 7500,
        estimatedRows: 15000,
        createdAt: new Date('2025-01-26T11:00:00Z'),
        completedAt: null,
        expiresAt: null,
      };

      vi.mocked(getExportJobStatus).mockResolvedValue(mockJob as any);

      const request = new Request('http://localhost:3000/api/exports/job-789') as any;
      const context = {
        params: { jobId: 'job-789' },
        session: { user: { id: 'user-1' } },
      };

      const response = await GET(request, context as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      
      expect(body.data.status).toBe('PROCESSING');
      expect(body.data.rowCount).toBe(7500); // Partial progress
    });

    it('should return FAILED status for errored jobs', async () => {
      const mockJob = {
        id: 'job-999',
        userId: 'user-1',
        storeId: 'store-1',
        type: 'CUSTOMERS',
        status: 'FAILED',
        fileUrl: null,
        rowCount: null,
        estimatedRows: 5000,
        error: 'Database timeout',
        createdAt: new Date('2025-01-26T11:00:00Z'),
        completedAt: null,
        expiresAt: null,
      };

      vi.mocked(getExportJobStatus).mockResolvedValue(mockJob as any);

      const request = new Request('http://localhost:3000/api/exports/job-999') as any;
      const context = {
        params: { jobId: 'job-999' },
        session: { user: { id: 'user-1' } },
      };

      const response = await GET(request, context as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      
      expect(body.data.status).toBe('FAILED');
      expect(body.data.error).toBe('Database timeout');
    });
  });

  describe('Ownership Enforcement', () => {
    it('should return 404 when user does not own the job', async () => {
      // getExportJobStatus already enforces ownership at service layer
      vi.mocked(getExportJobStatus).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/exports/job-123') as any;
      const context = {
        params: { jobId: 'job-123' },
        session: { user: { id: 'different-user' } },
      };

      const response = await GET(request, context as any);

      expect(response.status).toBe(404);
      expect(getExportJobStatus).toHaveBeenCalledWith('job-123', 'different-user');
    });
  });

  describe('Response Format', () => {
    it('should include all required job fields', async () => {
      const mockJob = {
        id: 'job-complete',
        userId: 'user-1',
        storeId: 'store-1',
        type: 'ORDERS',
        status: 'COMPLETED',
        fileUrl: 'https://storage.example.com/exports/orders.csv',
        rowCount: 8500,
        estimatedRows: 8500,
        createdAt: new Date('2025-01-26T10:00:00Z'),
        completedAt: new Date('2025-01-26T10:05:00Z'),
        expiresAt: new Date('2025-02-02T10:00:00Z'),
      };

      vi.mocked(getExportJobStatus).mockResolvedValue(mockJob as any);

      const request = new Request('http://localhost:3000/api/exports/job-complete') as any;
      const context = {
        params: { jobId: 'job-complete' },
        session: { user: { id: 'user-1' } },
      };

      const response = await GET(request, context as any);
      const body = await response.json();

      expect(body.data).toMatchObject({
        id: 'job-complete',
        type: 'ORDERS',
        status: 'COMPLETED',
        fileUrl: expect.any(String),
        rowCount: 8500,
        estimatedRows: 8500,
      });
      expect(body.data.createdAt).toBeDefined();
      expect(body.data.completedAt).toBeDefined();
      expect(body.data.expiresAt).toBeDefined();
    });

    it('should include success message in response', async () => {
      const mockJob = {
        id: 'job-123',
        userId: 'user-1',
        status: 'COMPLETED',
        fileUrl: 'https://storage.example.com/export.csv',
      };

      vi.mocked(getExportJobStatus).mockResolvedValue(mockJob as any);

      const request = new Request('http://localhost:3000/api/exports/job-123') as any;
      const context = {
        params: { jobId: 'job-123' },
        session: { user: { id: 'user-1' } },
      };

      const response = await GET(request, context as any);
      const body = await response.json();

      expect(body.message).toBe('Export job retrieved successfully');
    });
  });
});
