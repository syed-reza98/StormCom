/**
 * Theme API Routes Unit Tests
 * 
 * Tests for GET /api/themes and PUT/DELETE /api/stores/[id]/theme endpoints.
 * 
 * @module tests/unit/app/api/theme-routes.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/themes/route';
import { PUT, DELETE } from '@/app/api/stores/[id]/theme/route';
import { getServerSession } from 'next-auth';
import { getStoreTheme, updateStoreTheme, resetStoreTheme } from '@/services/theme-service';
import { ThemeMode } from '@prisma/client';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/services/theme-service', () => ({
  getStoreTheme: vi.fn(),
  updateStoreTheme: vi.fn(),
  resetStoreTheme: vi.fn(),
  getAvailableFonts: vi.fn(() => ['Inter', 'Roboto', 'Open Sans']),
  getThemeModeOptions: vi.fn(() => [
    { value: 'LIGHT', label: 'Light', description: 'Always use light theme' },
    { value: 'DARK', label: 'Dark', description: 'Always use dark theme' },
    { value: 'AUTO', label: 'Auto', description: 'Respect user system preference' },
  ]),
}));

vi.mock('@/lib/theme-utils', () => ({
  validateTheme: vi.fn(() => ({ valid: true, errors: [] })),
}));

describe('Theme API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/themes', () => {
    it('should return 401 if not authenticated', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost/api/themes?storeId=store-1');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 if storeId missing', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);
      const request = new NextRequest('http://localhost/api/themes');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('storeId');
    });

    it('should return theme data with palettes and fonts', async () => {
      // Arrange
      const mockTheme = {
        id: 'theme-1',
        storeId: 'store-1',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        fontFamily: 'Inter',
        headingFont: 'Inter',
        fontSize: '16px',
        layoutWidth: '1280px',
        borderRadius: '0.5rem',
        mode: ThemeMode.LIGHT,
        customCss: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);
      vi.mocked(getStoreTheme).mockResolvedValue(mockTheme);
      
      const request = new NextRequest('http://localhost/api/themes?storeId=store-1');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.currentTheme.id).toBe(mockTheme.id);
      expect(data.data.currentTheme.primaryColor).toBe(mockTheme.primaryColor);
      expect(data.data.currentTheme.secondaryColor).toBe(mockTheme.secondaryColor);
      expect(data.data.availableFonts).toContain('Inter');
      expect(data.data.themeModeOptions).toHaveLength(3);
      expect(data.data.colorPalettes).toHaveLength(6);
      expect(data.data.colorPalettes[0].name).toBe('Ocean Blue');
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);
      vi.mocked(getStoreTheme).mockRejectedValue(new Error('Database error'));
      
      const request = new NextRequest('http://localhost/api/themes?storeId=store-1');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('PUT /api/stores/[id]/theme', () => {
    it('should return 401 if not authenticated', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost/api/stores/store-1/theme', {
        method: 'PUT',
        body: JSON.stringify({ primaryColor: '#FF0000' }),
      });

      // Act
      const response = await PUT(request, { params: Promise.resolve({ id: 'store-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should update theme with valid data', async () => {
      // Arrange
      const updateData = {
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
      };

      const mockTheme = {
        id: 'theme-1',
        storeId: 'store-1',
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
        accentColor: '#F59E0B',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        fontFamily: 'Inter',
        headingFont: 'Inter',
        fontSize: '16px',
        layoutWidth: '1280px',
        borderRadius: '0.5rem',
        mode: ThemeMode.LIGHT,
        customCss: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);
      vi.mocked(updateStoreTheme).mockResolvedValue(mockTheme);

      const request = new NextRequest('http://localhost/api/stores/store-1/theme', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      // Act
      const response = await PUT(request, { params: Promise.resolve({ id: 'store-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.id).toBe(mockTheme.id);
      expect(data.data.primaryColor).toBe(mockTheme.primaryColor);
      expect(data.data.secondaryColor).toBe(mockTheme.secondaryColor);
      expect(data.message).toContain('updated successfully');
    });

    it('should return 400 for invalid color format', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);

      const request = new NextRequest('http://localhost/api/stores/store-1/theme', {
        method: 'PUT',
        body: JSON.stringify({ primaryColor: 'invalid-color' }),
      });

      // Act
      const response = await PUT(request, { params: Promise.resolve({ id: 'store-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 if store not found', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);
      vi.mocked(updateStoreTheme).mockRejectedValue(new Error('Store not found'));

      const request = new NextRequest('http://localhost/api/stores/store-1/theme', {
        method: 'PUT',
        body: JSON.stringify({ primaryColor: '#FF0000' }),
      });

      // Act
      const response = await PUT(request, { params: Promise.resolve({ id: 'store-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should accept valid theme mode', async () => {
      // Arrange
      const updateData = {
        mode: ThemeMode.DARK,
      };

      const mockTheme = {
        id: 'theme-1',
        storeId: 'store-1',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        fontFamily: 'Inter',
        headingFont: 'Inter',
        fontSize: '16px',
        layoutWidth: '1280px',
        borderRadius: '0.5rem',
        mode: ThemeMode.DARK,
        customCss: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);
      vi.mocked(updateStoreTheme).mockResolvedValue(mockTheme);

      const request = new NextRequest('http://localhost/api/stores/store-1/theme', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      // Act
      const response = await PUT(request, { params: Promise.resolve({ id: 'store-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.mode).toBe(ThemeMode.DARK);
    });

    it('should accept custom CSS', async () => {
      // Arrange
      const updateData = {
        customCss: '.custom { color: red; }',
      };

      const mockTheme = {
        id: 'theme-1',
        storeId: 'store-1',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        fontFamily: 'Inter',
        headingFont: 'Inter',
        fontSize: '16px',
        layoutWidth: '1280px',
        borderRadius: '0.5rem',
        mode: ThemeMode.LIGHT,
        customCss: '.custom { color: red; }',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);
      vi.mocked(updateStoreTheme).mockResolvedValue(mockTheme);

      const request = new NextRequest('http://localhost/api/stores/store-1/theme', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      // Act
      const response = await PUT(request, { params: Promise.resolve({ id: 'store-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.customCss).toBe('.custom { color: red; }');
    });
  });

  describe('DELETE /api/stores/[id]/theme', () => {
    it('should return 401 if not authenticated', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(null);
      const request = new NextRequest('http://localhost/api/stores/store-1/theme', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request, { params: Promise.resolve({ id: 'store-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should reset theme to defaults', async () => {
      // Arrange
      const mockTheme = {
        id: 'theme-1',
        storeId: 'store-1',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        fontFamily: 'Inter',
        headingFont: 'Inter',
        fontSize: '16px',
        layoutWidth: '1280px',
        borderRadius: '0.5rem',
        mode: ThemeMode.LIGHT,
        customCss: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);
      vi.mocked(resetStoreTheme).mockResolvedValue(mockTheme);

      const request = new NextRequest('http://localhost/api/stores/store-1/theme', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request, { params: Promise.resolve({ id: 'store-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data.id).toBe(mockTheme.id);
      expect(data.data.primaryColor).toBe(mockTheme.primaryColor);
      expect(data.data.secondaryColor).toBe(mockTheme.secondaryColor);
      expect(data.message).toContain('reset to default');
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-1', email: 'test@test.com' },
      } as any);
      vi.mocked(resetStoreTheme).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/stores/store-1/theme', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request, { params: Promise.resolve({ id: 'store-1' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
