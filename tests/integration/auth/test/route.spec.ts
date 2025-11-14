/**
 * Integration tests for GET /api/auth/test
 * 
 * Tests NextAuth configuration verification endpoint.
 * This is a diagnostic route for development/testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '@/app/api/auth/test/route';
import { getServerSession } from 'next-auth/next';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('next-auth/next');

describe('GET /api/auth/test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Detection', () => {
    it('should return hasSession=false when no session exists', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      
      expect(body.success).toBe(true);
      expect(body.hasSession).toBe(false);
      expect(body.session).toBeNull();
    });

    it('should return hasSession=true when session exists', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'STORE_ADMIN',
        },
        expires: '2025-12-31',
      } as any);

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      
      expect(body.success).toBe(true);
      expect(body.hasSession).toBe(true);
      expect(body.session).toBeDefined();
      expect(body.session.user.email).toBe('test@example.com');
      expect(body.session.user.role).toBe('STORE_ADMIN');
    });
  });

  describe('Environment Variable Check', () => {
    it('should include environment variable status', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      // Temporarily set env vars for test
      const originalSecret = process.env.NEXTAUTH_SECRET;
      const originalUrl = process.env.NEXTAUTH_URL;
      const originalNodeEnv = process.env.NODE_ENV;

      process.env.NEXTAUTH_SECRET = 'test-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true, configurable: true });

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      
      expect(body.env).toBeDefined();
      expect(body.env.hasSecret).toBe(true);
      expect(body.env.hasUrl).toBe(true);
      expect(body.env.nodeEnv).toBe('test');

      // Restore original env vars
      process.env.NEXTAUTH_SECRET = originalSecret;
      process.env.NEXTAUTH_URL = originalUrl;
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalNodeEnv, writable: true, configurable: true });
    });

    it('should detect missing environment variables', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      // Temporarily unset env vars
      const originalSecret = process.env.NEXTAUTH_SECRET;
      const originalUrl = process.env.NEXTAUTH_URL;

      delete process.env.NEXTAUTH_SECRET;
      delete process.env.NEXTAUTH_URL;

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      
      expect(body.env.hasSecret).toBe(false);
      expect(body.env.hasUrl).toBe(false);

      // Restore original env vars
      process.env.NEXTAUTH_SECRET = originalSecret;
      process.env.NEXTAUTH_URL = originalUrl;
    });
  });

  describe('Error Handling', () => {
    it('should return error response when getServerSession throws', async () => {
      vi.mocked(getServerSession).mockRejectedValue(new Error('Auth configuration error'));

      const response = await GET();

      expect(response.status).toBe(500);
      const body = await response.json();
      
      expect(body.success).toBe(false);
      expect(body.error).toBe('Auth configuration error');
    });

    it('should handle unknown errors gracefully', async () => {
      vi.mocked(getServerSession).mockRejectedValue('Unknown error');

      const response = await GET();

      expect(response.status).toBe(500);
      const body = await response.json();
      
      expect(body.success).toBe(false);
      expect(body.error).toBe('Unknown error');
    });
  });

  describe('Response Format', () => {
    it('should always include success flag', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await GET();
      const body = await response.json();

      expect(body).toHaveProperty('success');
      expect(typeof body.success).toBe('boolean');
    });

    it('should include env object in successful responses', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const response = await GET();
      const body = await response.json();

      expect(body.env).toBeDefined();
      expect(body.env).toHaveProperty('hasSecret');
      expect(body.env).toHaveProperty('hasUrl');
      expect(body.env).toHaveProperty('nodeEnv');
    });
  });

  describe('Role Information', () => {
    it('should include user role in session data when present', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'admin-1',
          email: 'admin@example.com',
          role: 'SUPER_ADMIN',
        },
        expires: '2025-12-31',
      } as any);

      const response = await GET();
      const body = await response.json();

      expect(body.session.user.role).toBe('SUPER_ADMIN');
    });

    it('should handle missing role gracefully', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@example.com',
        },
        expires: '2025-12-31',
      } as any);

      const response = await GET();
      const body = await response.json();

      expect(body.session.user).toBeDefined();
      expect(body.session.user.email).toBe('user@example.com');
    });
  });
});
