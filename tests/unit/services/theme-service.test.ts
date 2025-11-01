/**
 * ThemeService Unit Tests
 * 
 * Tests for theme CRUD operations, validation, and CSS generation.
 * 
 * @module tests/unit/services/theme-service.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/db';
import {
  getStoreTheme,
  updateStoreTheme,
  resetStoreTheme,
  generateCSSVariables,
  generateCSSString,
  getThemePreview,
  deleteStoreTheme,
  getAvailableFonts,
  getThemeModeOptions,
  DEFAULT_THEME,
} from '@/services/theme-service';
import { ThemeMode } from '@prisma/client';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    theme: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    store: {
      findUnique: vi.fn(),
    },
  },
}));

describe('ThemeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStoreTheme', () => {
    it('should return existing theme', async () => {
      // Arrange
      const mockTheme = {
        id: 'theme-1',
        storeId: 'store-1',
        ...DEFAULT_THEME,
        createdAt: new Date(),
        updatedAt: new Date(),
        customCss: null,
      };

      vi.mocked(prisma.theme.findUnique).mockResolvedValue(mockTheme);

      // Act
      const result = await getStoreTheme('store-1');

      // Assert
      expect(result).toEqual(mockTheme);
      expect(prisma.theme.findUnique).toHaveBeenCalledWith({
        where: { storeId: 'store-1' },
      });
    });

    it('should create default theme if not exists', async () => {
      // Arrange
      const mockTheme = {
        id: 'theme-1',
        storeId: 'store-1',
        ...DEFAULT_THEME,
        createdAt: new Date(),
        updatedAt: new Date(),
        customCss: null,
      };

      vi.mocked(prisma.theme.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.theme.create).mockResolvedValue(mockTheme);

      // Act
      const result = await getStoreTheme('store-1');

      // Assert
      expect(result).toEqual(mockTheme);
      expect(prisma.theme.create).toHaveBeenCalledWith({
        data: {
          storeId: 'store-1',
          ...DEFAULT_THEME,
        },
      });
    });
  });

  describe('updateStoreTheme', () => {
    it('should update theme with valid data', async () => {
      // Arrange
      const storeId = 'store-1';
      const updateData = {
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
      };

      const mockStore = { id: storeId };
      const mockTheme = {
        id: 'theme-1',
        storeId,
        ...DEFAULT_THEME,
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
        customCss: null,
      };

      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any);
      vi.mocked(prisma.theme.upsert).mockResolvedValue(mockTheme);

      // Act
      const result = await updateStoreTheme(storeId, updateData);

      // Assert
      expect(result).toEqual(mockTheme);
      expect(prisma.theme.upsert).toHaveBeenCalledWith({
        where: { storeId },
        update: expect.objectContaining(updateData),
        create: expect.objectContaining({
          storeId,
          ...DEFAULT_THEME,
          ...updateData,
        }),
      });
    });

    it('should throw error if store not found', async () => {
      // Arrange
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      // Act & Assert
      await expect(
        updateStoreTheme('nonexistent-store', { primaryColor: '#FF0000' })
      ).rejects.toThrow('Store not found');
    });

    it('should throw error for invalid primary color', async () => {
      // Arrange
      const storeId = 'store-1';
      const mockStore = { id: storeId };

      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any);

      // Act & Assert
      await expect(
        updateStoreTheme(storeId, { primaryColor: 'invalid-color' })
      ).rejects.toThrow('Invalid primary color format');
    });

    it('should throw error for invalid secondary color', async () => {
      // Arrange
      const storeId = 'store-1';
      const mockStore = { id: storeId };

      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any);

      // Act & Assert
      await expect(
        updateStoreTheme(storeId, { secondaryColor: 'rgb(255,0,0)' })
      ).rejects.toThrow('Invalid secondary color format');
    });

    it('should throw error for invalid accent color', async () => {
      // Arrange
      const storeId = 'store-1';
      const mockStore = { id: storeId };

      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any);

      // Act & Assert
      await expect(
        updateStoreTheme(storeId, { accentColor: '#GGGGGG' })
      ).rejects.toThrow('Invalid accent color format');
    });

    it('should throw error for invalid background color', async () => {
      // Arrange
      const storeId = 'store-1';
      const mockStore = { id: storeId };

      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any);

      // Act & Assert
      await expect(
        updateStoreTheme(storeId, { backgroundColor: 'blue' })
      ).rejects.toThrow('Invalid background color format');
    });

    it('should throw error for invalid text color', async () => {
      // Arrange
      const storeId = 'store-1';
      const mockStore = { id: storeId };

      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any);

      // Act & Assert
      await expect(
        updateStoreTheme(storeId, { textColor: '#12' })
      ).rejects.toThrow('Invalid text color format');
    });

    it('should accept 3-digit hex colors', async () => {
      // Arrange
      const storeId = 'store-1';
      const updateData = {
        primaryColor: '#F00',
        secondaryColor: '#0F0',
        accentColor: '#00F',
      };

      const mockStore = { id: storeId };
      const mockTheme = {
        id: 'theme-1',
        storeId,
        ...DEFAULT_THEME,
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
        customCss: null,
      };

      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any);
      vi.mocked(prisma.theme.upsert).mockResolvedValue(mockTheme);

      // Act
      const result = await updateStoreTheme(storeId, updateData);

      // Assert
      expect(result).toEqual(mockTheme);
    });
  });

  describe('resetStoreTheme', () => {
    it('should reset theme to defaults', async () => {
      // Arrange
      const storeId = 'store-1';
      const mockTheme = {
        id: 'theme-1',
        storeId,
        ...DEFAULT_THEME,
        customCss: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.theme.upsert).mockResolvedValue(mockTheme);

      // Act
      const result = await resetStoreTheme(storeId);

      // Assert
      expect(result).toEqual(mockTheme);
      expect(prisma.theme.upsert).toHaveBeenCalledWith({
        where: { storeId },
        update: expect.objectContaining({
          ...DEFAULT_THEME,
          customCss: null,
        }),
        create: expect.objectContaining({
          storeId,
          ...DEFAULT_THEME,
        }),
      });
    });
  });

  describe('generateCSSVariables', () => {
    it('should generate CSS variables from theme', () => {
      // Arrange
      const theme = {
        id: 'theme-1',
        storeId: 'store-1',
        ...DEFAULT_THEME,
        createdAt: new Date(),
        updatedAt: new Date(),
        customCss: null,
      };

      // Act
      const result = generateCSSVariables(theme);

      // Assert
      expect(result).toEqual({
        '--primary-color': DEFAULT_THEME.primaryColor,
        '--secondary-color': DEFAULT_THEME.secondaryColor,
        '--accent-color': DEFAULT_THEME.accentColor,
        '--background-color': DEFAULT_THEME.backgroundColor,
        '--text-color': DEFAULT_THEME.textColor,
        '--font-family': DEFAULT_THEME.fontFamily,
        '--heading-font': DEFAULT_THEME.headingFont,
        '--font-size': DEFAULT_THEME.fontSize,
        '--layout-width': DEFAULT_THEME.layoutWidth,
        '--border-radius': DEFAULT_THEME.borderRadius,
      });
    });
  });

  describe('generateCSSString', () => {
    it('should generate CSS string with LIGHT mode', () => {
      // Arrange
      const theme = {
        id: 'theme-1',
        storeId: 'store-1',
        ...DEFAULT_THEME,
        mode: ThemeMode.LIGHT,
        createdAt: new Date(),
        updatedAt: new Date(),
        customCss: null,
      };

      // Act
      const result = generateCSSString(theme);

      // Assert
      expect(result).toContain(':root {');
      expect(result).toContain('--primary-color: #3B82F6;');
      expect(result).toContain('--secondary-color: #10B981;');
      expect(result).not.toContain('Dark Mode');
    });

    it('should generate CSS string with DARK mode', () => {
      // Arrange
      const theme = {
        id: 'theme-1',
        storeId: 'store-1',
        ...DEFAULT_THEME,
        mode: ThemeMode.DARK,
        createdAt: new Date(),
        updatedAt: new Date(),
        customCss: null,
      };

      // Act
      const result = generateCSSString(theme);

      // Assert
      expect(result).toContain(':root {');
      expect(result).toContain('/* Dark Mode */');
      expect(result).toContain('--background-color: #1F2937;');
      expect(result).toContain('--text-color: #F9FAFB;');
    });

    it('should generate CSS string with AUTO mode', () => {
      // Arrange
      const theme = {
        id: 'theme-1',
        storeId: 'store-1',
        ...DEFAULT_THEME,
        mode: ThemeMode.AUTO,
        createdAt: new Date(),
        updatedAt: new Date(),
        customCss: null,
      };

      // Act
      const result = generateCSSString(theme);

      // Assert
      expect(result).toContain(':root {');
      expect(result).toContain('/* Auto Dark Mode */');
      expect(result).toContain('@media (prefers-color-scheme: dark)');
      expect(result).toContain('--background-color: #1F2937;');
    });

    it('should include custom CSS if provided', () => {
      // Arrange
      const theme = {
        id: 'theme-1',
        storeId: 'store-1',
        ...DEFAULT_THEME,
        customCss: '.custom { color: red; }',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const result = generateCSSString(theme);

      // Assert
      expect(result).toContain('/* Custom CSS */');
      expect(result).toContain('.custom { color: red; }');
    });
  });

  describe('getThemePreview', () => {
    it('should merge current theme with preview data', async () => {
      // Arrange
      const storeId = 'store-1';
      const currentTheme = {
        id: 'theme-1',
        storeId,
        ...DEFAULT_THEME,
        createdAt: new Date(),
        updatedAt: new Date(),
        customCss: null,
      };

      const previewData = {
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
      };

      vi.mocked(prisma.theme.findUnique).mockResolvedValue(currentTheme);

      // Act
      const result = await getThemePreview(storeId, previewData);

      // Assert
      expect(result.theme.primaryColor).toBe('#FF0000');
      expect(result.theme.secondaryColor).toBe('#00FF00');
      expect(result.theme.accentColor).toBe(DEFAULT_THEME.accentColor);
      expect(result.cssVariables['--primary-color']).toBe('#FF0000');
      expect(result.cssString).toContain('--primary-color: #FF0000;');
    });
  });

  describe('deleteStoreTheme', () => {
    it('should delete theme', async () => {
      // Arrange
      const storeId = 'store-1';

      vi.mocked(prisma.theme.delete).mockResolvedValue({} as any);

      // Act
      await deleteStoreTheme(storeId);

      // Assert
      expect(prisma.theme.delete).toHaveBeenCalledWith({
        where: { storeId },
      });
    });
  });

  describe('getAvailableFonts', () => {
    it('should return array of available fonts', () => {
      // Act
      const result = getAvailableFonts();

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('Inter');
      expect(result).toContain('Roboto');
      expect(result).toContain('Open Sans');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getThemeModeOptions', () => {
    it('should return theme mode options', () => {
      // Act
      const result = getThemeModeOptions();

      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        value: ThemeMode.LIGHT,
        label: 'Light',
        description: 'Always use light theme',
      });
      expect(result[1]).toEqual({
        value: ThemeMode.DARK,
        label: 'Dark',
        description: 'Always use dark theme',
      });
      expect(result[2]).toEqual({
        value: ThemeMode.AUTO,
        label: 'Auto',
        description: 'Respect user system preference',
      });
    });
  });
});
