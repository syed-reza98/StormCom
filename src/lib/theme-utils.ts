/**
 * Theme Utilities
 * 
 * Helper functions for theme manipulation, color operations, and CSS generation.
 * Provides utilities for contrast checking, color validation, and theme application.
 * 
 * @module lib/theme-utils
 */

import { Theme, ThemeMode } from '@prisma/client';

/**
 * Calculate relative luminance for color contrast
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color contrast meets WCAG AA standards (4.5:1 for normal text)
 */
export function meetsContrastStandard(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return level === 'AAA' ? ratio >= 7 : ratio >= 4.5;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = Math.max(0, Math.min(255, x)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Lighten color by percentage
 */
export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = percent / 100;
  
  return rgbToHex(
    Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor)),
    Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor)),
    Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor))
  );
}

/**
 * Darken color by percentage
 */
export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = percent / 100;
  
  return rgbToHex(
    Math.max(0, Math.round(rgb.r * (1 - factor))),
    Math.max(0, Math.round(rgb.g * (1 - factor))),
    Math.max(0, Math.round(rgb.b * (1 - factor)))
  );
}

/**
 * Adjust color opacity (returns rgba)
 */
export function adjustOpacity(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const clampedOpacity = Math.max(0, Math.min(1, opacity));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clampedOpacity})`;
}

/**
 * Check if theme should use dark mode based on mode setting
 */
export function shouldUseDarkMode(mode: ThemeMode, systemPreference?: 'light' | 'dark'): boolean {
  if (mode === ThemeMode.DARK) return true;
  if (mode === ThemeMode.LIGHT) return false;
  if (mode === ThemeMode.AUTO && systemPreference) {
    return systemPreference === 'dark';
  }
  return false;
}

/**
 * Get theme CSS variables as inline style object
 */
export function getThemeStyles(theme: Theme): React.CSSProperties {
  return {
    '--primary-color': theme.primaryColor,
    '--secondary-color': theme.secondaryColor,
    '--accent-color': theme.accentColor,
    '--background-color': theme.backgroundColor,
    '--text-color': theme.textColor,
    '--font-family': theme.fontFamily,
    '--heading-font': theme.headingFont,
    '--font-size': theme.fontSize,
    '--layout-width': theme.layoutWidth,
    '--border-radius': theme.borderRadius,
  } as React.CSSProperties;
}

/**
 * Generate theme color palette with shades
 */
export function generateColorPalette(baseColor: string): {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
} {
  return {
    50: lightenColor(baseColor, 40),
    100: lightenColor(baseColor, 35),
    200: lightenColor(baseColor, 25),
    300: lightenColor(baseColor, 15),
    400: lightenColor(baseColor, 8),
    500: baseColor, // Base color
    600: darkenColor(baseColor, 8),
    700: darkenColor(baseColor, 15),
    800: darkenColor(baseColor, 25),
    900: darkenColor(baseColor, 35),
  };
}

/**
 * Validate theme configuration
 */
export function validateTheme(theme: Partial<Theme>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate colors
  const colors = [
    { name: 'primaryColor', value: theme.primaryColor },
    { name: 'secondaryColor', value: theme.secondaryColor },
    { name: 'accentColor', value: theme.accentColor },
    { name: 'backgroundColor', value: theme.backgroundColor },
    { name: 'textColor', value: theme.textColor },
  ];

  for (const color of colors) {
    if (color.value && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color.value)) {
      errors.push(`Invalid ${color.name}: must be hex format (#RRGGBB)`);
    }
  }

  // Check text contrast
  if (theme.textColor && theme.backgroundColor) {
    if (!meetsContrastStandard(theme.textColor, theme.backgroundColor, 'AA')) {
      errors.push('Text color and background color do not meet WCAG AA contrast ratio (4.5:1)');
    }
  }

  // Validate font size
  if (theme.fontSize) {
    const size = parseInt(theme.fontSize);
    if (isNaN(size) || size < 12 || size > 24) {
      errors.push('Font size must be between 12px and 24px');
    }
  }

  // Validate layout width
  if (theme.layoutWidth) {
    const width = parseInt(theme.layoutWidth);
    if (isNaN(width) || width < 960 || width > 1920) {
      errors.push('Layout width must be between 960px and 1920px');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get suggested text color based on background
 */
export function getSuggestedTextColor(backgroundColor: string): string {
  const luminance = getRelativeLuminance(backgroundColor);
  return luminance > 0.5 ? '#1F2937' : '#F9FAFB';
}

/**
 * Get theme as CSS string for <style> tag
 */
export function getThemeCSSString(theme: Theme): string {
  const styles = getThemeStyles(theme);
  const cssVars = Object.entries(styles)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  let css = `:root {\n${cssVars}\n}`;

  // Add custom CSS
  if (theme.customCss) {
    css += `\n\n/* Custom CSS */\n${theme.customCss}`;
  }

  // Handle dark mode
  if (theme.mode === ThemeMode.DARK) {
    css += `\n\n/* Dark Mode */\n:root {\n  --background-color: #1F2937;\n  --text-color: #F9FAFB;\n}`;
  } else if (theme.mode === ThemeMode.AUTO) {
    css += `\n\n/* Auto Dark Mode */\n@media (prefers-color-scheme: dark) {\n  :root {\n    --background-color: #1F2937;\n    --text-color: #F9FAFB;\n  }\n}`;
  }

  return css;
}
