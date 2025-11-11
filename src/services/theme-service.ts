/**
 * Theme Service
 * 
 * Manages store theme customization including colors, typography, layout, and CSS generation.
 * Handles theme CRUD operations and CSS custom property generation for dynamic styling.
 * 
 * @module services/theme-service
 */

import { prisma } from '@/lib/db';
import { Theme, ThemeMode } from '@prisma/client';

/**
 * Default theme configuration
 */
export const DEFAULT_THEME = {
  primaryColor: '#3B82F6',     // Tailwind blue-500
  secondaryColor: '#10B981',   // Tailwind green-500
  accentColor: '#F59E0B',      // Tailwind amber-500
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',        // Tailwind gray-800
  fontFamily: 'Inter',
  headingFont: 'Inter',
  fontSize: '16px',
  layoutWidth: '1280px',
  borderRadius: '0.5rem',
  mode: ThemeMode.LIGHT,
} as const;

/**
 * Available font families
 */
export const AVAILABLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Source Sans Pro',
  'Raleway',
  'PT Sans',
  'Oswald',
] as const;

/**
 * Theme update input type
 */
export interface ThemeUpdateInput {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  headingFont?: string;
  fontSize?: string;
  layoutWidth?: string;
  borderRadius?: string;
  mode?: ThemeMode;
  customCss?: string | null;
}

/**
 * CSS variables generated from theme
 */
export interface ThemeCSSVariables {
  '--primary-color': string;
  '--secondary-color': string;
  '--accent-color': string;
  '--background-color': string;
  '--text-color': string;
  '--font-family': string;
  '--heading-font': string;
  '--font-size': string;
  '--layout-width': string;
  '--border-radius': string;
}

/**
 * Get theme for a store (creates default if doesn't exist)
 */
export async function getStoreTheme(storeId: string): Promise<Theme> {
  let theme = await prisma.theme.findUnique({
    where: { storeId },
  });

  // Create default theme if doesn't exist
  if (!theme) {
    theme = await prisma.theme.create({
      data: {
        storeId,
        ...DEFAULT_THEME,
      },
    });
  }

  return theme;
}

/**
 * Update store theme
 */
export async function updateStoreTheme(
  storeId: string,
  data: ThemeUpdateInput
): Promise<Theme> {
  // Validate store exists
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { id: true },
  });

  if (!store) {
    throw new Error('Store not found');
  }

  // Validate color values (hex format)
  if (data.primaryColor && !isValidHexColor(data.primaryColor)) {
    throw new Error('Invalid primary color format. Use hex format (#RRGGBB)');
  }
  if (data.secondaryColor && !isValidHexColor(data.secondaryColor)) {
    throw new Error('Invalid secondary color format. Use hex format (#RRGGBB)');
  }
  if (data.accentColor && !isValidHexColor(data.accentColor)) {
    throw new Error('Invalid accent color format. Use hex format (#RRGGBB)');
  }
  if (data.backgroundColor && !isValidHexColor(data.backgroundColor)) {
    throw new Error('Invalid background color format. Use hex format (#RRGGBB)');
  }
  if (data.textColor && !isValidHexColor(data.textColor)) {
    throw new Error('Invalid text color format. Use hex format (#RRGGBB)');
  }

  // Upsert theme (update if exists, create if doesn't)
  const theme = await prisma.theme.upsert({
    where: { storeId },
    update: {
      ...data,
      updatedAt: new Date(),
    },
    create: {
      storeId,
      ...DEFAULT_THEME,
      ...data,
    },
  });

  return theme;
}

/**
 * Reset theme to default
 */
export async function resetStoreTheme(storeId: string): Promise<Theme> {
  const theme = await prisma.theme.upsert({
    where: { storeId },
    update: {
      ...DEFAULT_THEME,
      customCss: null,
      updatedAt: new Date(),
    },
    create: {
      storeId,
      ...DEFAULT_THEME,
    },
  });

  return theme;
}

/**
 * Generate CSS custom properties from theme
 */
export function generateCSSVariables(theme: Theme): ThemeCSSVariables {
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
  };
}

/**
 * Generate CSS string from theme
 */
export function generateCSSString(theme: Theme): string {
  const variables = generateCSSVariables(theme);
  
  const cssVars = Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  let css = `:root {\n${cssVars}\n}`;

  // Add custom CSS if provided
  if (theme.customCss) {
    css += `\n\n/* Custom CSS */\n${theme.customCss}`;
  }

  // Add dark mode overrides if mode is DARK
  if (theme.mode === ThemeMode.DARK) {
    css += `\n\n/* Dark Mode */\n:root {\n  --background-color: #1F2937;\n  --text-color: #F9FAFB;\n}`;
  }

  // Add auto dark mode support
  if (theme.mode === ThemeMode.AUTO) {
    css += `\n\n/* Auto Dark Mode */\n@media (prefers-color-scheme: dark) {\n  :root {\n    --background-color: #1F2937;\n    --text-color: #F9FAFB;\n  }\n}`;
  }

  return css;
}

/**
 * Get theme preview (for testing without saving)
 */
export async function getThemePreview(
  storeId: string,
  data: ThemeUpdateInput
): Promise<{ theme: Theme; cssVariables: ThemeCSSVariables; cssString: string }> {
  const currentTheme = await getStoreTheme(storeId);
  
  // Merge current theme with preview data
  const previewTheme: Theme = {
    ...currentTheme,
    ...data,
  };

  const cssVariables = generateCSSVariables(previewTheme);
  const cssString = generateCSSString(previewTheme);

  return {
    theme: previewTheme,
    cssVariables,
    cssString,
  };
}

/**
 * Validate hex color format
 */
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Delete theme (reverts to default)
 */
export async function deleteStoreTheme(storeId: string): Promise<void> {
  await prisma.theme.delete({
    where: { storeId },
  });
}

/**
 * Get all available fonts
 */
export function getAvailableFonts(): readonly string[] {
  return AVAILABLE_FONTS;
}

/**
 * Get theme mode options
 */
export function getThemeModeOptions(): Array<{ value: ThemeMode; label: string; description: string }> {
  return [
    {
      value: ThemeMode.LIGHT,
      label: 'Light',
      description: 'Always use light theme',
    },
    {
      value: ThemeMode.DARK,
      label: 'Dark',
      description: 'Always use dark theme',
    },
    {
      value: ThemeMode.AUTO,
      label: 'Auto',
      description: 'Respect user system preference',
    },
  ];
}
