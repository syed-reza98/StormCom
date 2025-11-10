/**
 * Themes API Route
 * 
 * GET /api/themes - List available theme templates and get current store theme
 * 
 * @module app/api/themes/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getStoreTheme, getAvailableFonts, getThemeModeOptions } from '@/services/theme-service';

/**
 * GET /api/themes
 * 
 * Returns theme information including:
 * - Current store theme
 * - Available fonts
 * - Theme mode options
 * - Predefined color palettes
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Get storeId from query params
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'storeId is required' } },
        { status: 400 }
      );
    }

    // Get current theme
    const theme = await getStoreTheme(storeId);

    // Predefined color palettes for quick selection
    const colorPalettes = [
      {
        name: 'Ocean Blue',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        accentColor: '#F59E0B',
      },
      {
        name: 'Forest Green',
        primaryColor: '#10B981',
        secondaryColor: '#059669',
        accentColor: '#F59E0B',
      },
      {
        name: 'Sunset Orange',
        primaryColor: '#F59E0B',
        secondaryColor: '#EF4444',
        accentColor: '#3B82F6',
      },
      {
        name: 'Royal Purple',
        primaryColor: '#8B5CF6',
        secondaryColor: '#A855F7',
        accentColor: '#EC4899',
      },
      {
        name: 'Crimson Red',
        primaryColor: '#EF4444',
        secondaryColor: '#DC2626',
        accentColor: '#F59E0B',
      },
      {
        name: 'Slate Gray',
        primaryColor: '#64748B',
        secondaryColor: '#475569',
        accentColor: '#3B82F6',
      },
    ];

    return NextResponse.json({
      data: {
        currentTheme: theme,
        availableFonts: getAvailableFonts(),
        themeModeOptions: getThemeModeOptions(),
        colorPalettes,
      },
    });
  } catch (error) {
    console.error('Error fetching themes:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch themes',
        },
      },
      { status: 500 }
    );
  }
}
