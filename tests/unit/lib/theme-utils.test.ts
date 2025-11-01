/**
 * Theme Utils Unit Tests
 * 
 * Tests for color manipulation, contrast checking, and theme validation.
 * 
 * @module tests/unit/lib/theme-utils.test
 */

import { describe, it, expect } from 'vitest';
import {
  getRelativeLuminance,
  getContrastRatio,
  meetsContrastStandard,
  hexToRgb,
  rgbToHex,
  lightenColor,
  darkenColor,
  adjustOpacity,
  shouldUseDarkMode,
  getThemeStyles,
  generateColorPalette,
  validateTheme,
  getSuggestedTextColor,
  getThemeCSSString,
} from '@/lib/theme-utils';
import { ThemeMode } from '@prisma/client';

describe('Theme Utils', () => {
  describe('hexToRgb', () => {
    it('should convert 6-digit hex to RGB', () => {
      // Act
      const result = hexToRgb('#FF0000');

      // Assert
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert 6-digit hex with lowercase to RGB', () => {
      // Act
      const result = hexToRgb('#00ff00');

      // Assert
      expect(result).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('should handle hex without # prefix', () => {
      // Act
      const result = hexToRgb('0000FF');

      // Assert
      expect(result).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should return null for invalid hex', () => {
      // Act
      const result = hexToRgb('invalid');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for 3-digit hex', () => {
      // Act
      const result = hexToRgb('#F00');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      // Act
      const result = rgbToHex(255, 0, 0);

      // Assert
      expect(result).toBe('#ff0000');
    });

    it('should handle values with leading zeros', () => {
      // Act
      const result = rgbToHex(15, 0, 255);

      // Assert
      expect(result).toBe('#0f00ff');
    });

    it('should clamp values above 255', () => {
      // Act
      const result = rgbToHex(300, 0, 0);

      // Assert
      expect(result).toBe('#ff0000');
    });

    it('should clamp values below 0', () => {
      // Act
      const result = rgbToHex(-10, 0, 0);

      // Assert
      expect(result).toBe('#000000');
    });
  });

  describe('getRelativeLuminance', () => {
    it('should calculate luminance for white', () => {
      // Act
      const result = getRelativeLuminance('#FFFFFF');

      // Assert
      expect(result).toBeCloseTo(1, 2);
    });

    it('should calculate luminance for black', () => {
      // Act
      const result = getRelativeLuminance('#000000');

      // Assert
      expect(result).toBeCloseTo(0, 2);
    });

    it('should calculate luminance for gray', () => {
      // Act
      const result = getRelativeLuminance('#808080');

      // Assert
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });

    it('should return 0 for invalid color', () => {
      // Act
      const result = getRelativeLuminance('invalid');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate contrast ratio for black and white', () => {
      // Act
      const result = getContrastRatio('#000000', '#FFFFFF');

      // Assert
      expect(result).toBeCloseTo(21, 0);
    });

    it('should calculate contrast ratio for same colors', () => {
      // Act
      const result = getContrastRatio('#FF0000', '#FF0000');

      // Assert
      expect(result).toBeCloseTo(1, 2);
    });

    it('should handle order of colors (lighter first)', () => {
      // Act
      const result1 = getContrastRatio('#FFFFFF', '#000000');
      const result2 = getContrastRatio('#000000', '#FFFFFF');

      // Assert
      expect(result1).toBeCloseTo(result2, 2);
    });
  });

  describe('meetsContrastStandard', () => {
    it('should pass WCAG AA for black text on white background', () => {
      // Act
      const result = meetsContrastStandard('#000000', '#FFFFFF', 'AA');

      // Assert
      expect(result).toBe(true);
    });

    it('should pass WCAG AAA for black text on white background', () => {
      // Act
      const result = meetsContrastStandard('#000000', '#FFFFFF', 'AAA');

      // Assert
      expect(result).toBe(true);
    });

    it('should fail WCAG AA for low contrast', () => {
      // Act
      const result = meetsContrastStandard('#CCCCCC', '#FFFFFF', 'AA');

      // Assert
      expect(result).toBe(false);
    });

    it('should default to AA level', () => {
      // Act
      const result = meetsContrastStandard('#000000', '#FFFFFF');

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('lightenColor', () => {
    it('should lighten black color by 50%', () => {
      // Act
      const result = lightenColor('#000000', 50);

      // Assert
      expect(result).toBe('#808080'); // 0 + round(255 * 0.5) = 0 + 128 = 128 = 0x80
    });

    it('should not exceed white when lightening', () => {
      // Act
      const result = lightenColor('#FFFFFF', 50);

      // Assert
      expect(result).toBe('#ffffff');
    });

    it('should handle 0% lightening', () => {
      // Act
      const result = lightenColor('#FF0000', 0);

      // Assert
      expect(result).toBe('#ff0000');
    });

    it('should return original for invalid hex', () => {
      // Act
      const result = lightenColor('invalid', 50);

      // Assert
      expect(result).toBe('invalid');
    });
  });

  describe('darkenColor', () => {
    it('should darken white color by 50%', () => {
      // Act
      const result = darkenColor('#FFFFFF', 50);

      // Assert
      expect(result).toBe('#808080'); // round(255 * (1 - 0.5)) = round(127.5) = 128 = 0x80
    });

    it('should not go below black when darkening', () => {
      // Act
      const result = darkenColor('#000000', 50);

      // Assert
      expect(result).toBe('#000000');
    });

    it('should handle 0% darkening', () => {
      // Act
      const result = darkenColor('#FF0000', 0);

      // Assert
      expect(result).toBe('#ff0000');
    });

    it('should return original for invalid hex', () => {
      // Act
      const result = darkenColor('invalid', 50);

      // Assert
      expect(result).toBe('invalid');
    });
  });

  describe('adjustOpacity', () => {
    it('should adjust opacity to 50%', () => {
      // Act
      const result = adjustOpacity('#FF0000', 0.5);

      // Assert
      expect(result).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should clamp opacity to 0', () => {
      // Act
      const result = adjustOpacity('#FF0000', -0.5);

      // Assert
      expect(result).toBe('rgba(255, 0, 0, 0)');
    });

    it('should clamp opacity to 1', () => {
      // Act
      const result = adjustOpacity('#FF0000', 1.5);

      // Assert
      expect(result).toBe('rgba(255, 0, 0, 1)');
    });

    it('should return original for invalid hex', () => {
      // Act
      const result = adjustOpacity('invalid', 0.5);

      // Assert
      expect(result).toBe('invalid');
    });
  });

  describe('shouldUseDarkMode', () => {
    it('should return true for DARK mode', () => {
      // Act
      const result = shouldUseDarkMode(ThemeMode.DARK);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for LIGHT mode', () => {
      // Act
      const result = shouldUseDarkMode(ThemeMode.LIGHT);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for AUTO mode with dark preference', () => {
      // Act
      const result = shouldUseDarkMode(ThemeMode.AUTO, 'dark');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for AUTO mode with light preference', () => {
      // Act
      const result = shouldUseDarkMode(ThemeMode.AUTO, 'light');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for AUTO mode without preference', () => {
      // Act
      const result = shouldUseDarkMode(ThemeMode.AUTO);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getThemeStyles', () => {
    it('should convert theme to CSS properties', () => {
      // Arrange
      const theme = {
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

      // Act
      const result = getThemeStyles(theme);

      // Assert
      expect(result).toEqual({
        '--primary-color': '#3B82F6',
        '--secondary-color': '#10B981',
        '--accent-color': '#F59E0B',
        '--background-color': '#FFFFFF',
        '--text-color': '#1F2937',
        '--font-family': 'Inter',
        '--heading-font': 'Inter',
        '--font-size': '16px',
        '--layout-width': '1280px',
        '--border-radius': '0.5rem',
      });
    });
  });

  describe('generateColorPalette', () => {
    it('should generate 10 shades', () => {
      // Act
      const result = generateColorPalette('#3B82F6');

      // Assert
      expect(Object.keys(result)).toHaveLength(10);
      expect(result).toHaveProperty('50');
      expect(result).toHaveProperty('100');
      expect(result).toHaveProperty('200');
      expect(result).toHaveProperty('300');
      expect(result).toHaveProperty('400');
      expect(result).toHaveProperty('500');
      expect(result).toHaveProperty('600');
      expect(result).toHaveProperty('700');
      expect(result).toHaveProperty('800');
      expect(result).toHaveProperty('900');
    });

    it('should have base color at 500', () => {
      // Act
      const result = generateColorPalette('#3B82F6');

      // Assert
      expect(result[500]).toBe('#3B82F6');
    });

    it('should have lighter shades below 500', () => {
      // Act
      const result = generateColorPalette('#3B82F6');

      // Assert
      const luminance50 = getRelativeLuminance(result[50]);
      const luminance500 = getRelativeLuminance(result[500]);
      expect(luminance50).toBeGreaterThan(luminance500);
    });

    it('should have darker shades above 500', () => {
      // Act
      const result = generateColorPalette('#3B82F6');

      // Assert
      const luminance500 = getRelativeLuminance(result[500]);
      const luminance900 = getRelativeLuminance(result[900]);
      expect(luminance900).toBeLessThan(luminance500);
    });
  });

  describe('validateTheme', () => {
    it('should validate valid theme', () => {
      // Arrange
      const theme = {
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        fontSize: '16px',
        layoutWidth: '1280px',
      };

      // Act
      const result = validateTheme(theme);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for invalid hex color', () => {
      // Arrange
      const theme = {
        primaryColor: 'invalid',
      };

      // Act
      const result = validateTheme(theme);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid primaryColor: must be hex format (#RRGGBB)');
    });

    it('should fail for low contrast', () => {
      // Arrange
      const theme = {
        textColor: '#CCCCCC',
        backgroundColor: '#FFFFFF',
      };

      // Act
      const result = validateTheme(theme);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes('contrast'))).toBe(true);
    });

    it('should fail for font size too small', () => {
      // Arrange
      const theme = {
        fontSize: '10px',
      };

      // Act
      const result = validateTheme(theme);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Font size must be between 12px and 24px');
    });

    it('should fail for font size too large', () => {
      // Arrange
      const theme = {
        fontSize: '30px',
      };

      // Act
      const result = validateTheme(theme);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Font size must be between 12px and 24px');
    });

    it('should fail for layout width too small', () => {
      // Arrange
      const theme = {
        layoutWidth: '800px',
      };

      // Act
      const result = validateTheme(theme);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Layout width must be between 960px and 1920px');
    });

    it('should fail for layout width too large', () => {
      // Arrange
      const theme = {
        layoutWidth: '2000px',
      };

      // Act
      const result = validateTheme(theme);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Layout width must be between 960px and 1920px');
    });

    it('should accept 3-digit hex colors', () => {
      // Arrange
      const theme = {
        primaryColor: '#F00',
      };

      // Act
      const result = validateTheme(theme);

      // Assert
      expect(result.valid).toBe(true);
    });
  });

  describe('getSuggestedTextColor', () => {
    it('should suggest dark text for light background', () => {
      // Act
      const result = getSuggestedTextColor('#FFFFFF');

      // Assert
      expect(result).toBe('#1F2937');
    });

    it('should suggest light text for dark background', () => {
      // Act
      const result = getSuggestedTextColor('#000000');

      // Assert
      expect(result).toBe('#F9FAFB');
    });

    it('should suggest dark text for bright colored background', () => {
      // Act
      const result = getSuggestedTextColor('#FFFF00');

      // Assert
      expect(result).toBe('#1F2937');
    });

    it('should suggest light text for dark colored background', () => {
      // Act
      const result = getSuggestedTextColor('#000080');

      // Assert
      expect(result).toBe('#F9FAFB');
    });
  });

  describe('getThemeCSSString', () => {
    it('should generate CSS string for LIGHT mode', () => {
      // Arrange
      const theme = {
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

      // Act
      const result = getThemeCSSString(theme);

      // Assert
      expect(result).toContain(':root {');
      expect(result).toContain('--primary-color: #3B82F6;');
      expect(result).not.toContain('Dark Mode');
    });

    it('should generate CSS string for DARK mode', () => {
      // Arrange
      const theme = {
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

      // Act
      const result = getThemeCSSString(theme);

      // Assert
      expect(result).toContain('/* Dark Mode */');
      expect(result).toContain('--background-color: #1F2937;');
      expect(result).toContain('--text-color: #F9FAFB;');
    });

    it('should generate CSS string for AUTO mode', () => {
      // Arrange
      const theme = {
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
        mode: ThemeMode.AUTO,
        customCss: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Act
      const result = getThemeCSSString(theme);

      // Assert
      expect(result).toContain('/* Auto Dark Mode */');
      expect(result).toContain('@media (prefers-color-scheme: dark)');
    });

    it('should include custom CSS', () => {
      // Arrange
      const theme = {
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

      // Act
      const result = getThemeCSSString(theme);

      // Assert
      expect(result).toContain('/* Custom CSS */');
      expect(result).toContain('.custom { color: red; }');
    });
  });
});
