/**
 * Store Theme API Route
 * 
 * PUT /api/stores/[id]/theme - Update store theme configuration
 * DELETE /api/stores/[id]/theme - Reset theme to default
 * 
 * @module app/api/stores/[id]/theme/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateStoreTheme, resetStoreTheme } from '@/services/theme-service';
import { validateTheme } from '@/lib/theme-utils';
import { z } from 'zod';
import { ThemeMode } from '@prisma/client';

/**
 * Zod schema for theme update validation
 */
const themeUpdateSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  fontFamily: z.string().min(1).max(50).optional(),
  headingFont: z.string().min(1).max(50).optional(),
  fontSize: z.string().regex(/^\d{1,2}px$/).optional(),
  layoutWidth: z.string().regex(/^\d{3,4}px$/).optional(),
  borderRadius: z.string().regex(/^[\d.]+rem$/).optional(),
  mode: z.nativeEnum(ThemeMode).optional(),
  customCss: z.string().max(10000).nullable().optional(),
});

/**
 * PUT /api/stores/[id]/theme
 * 
 * Update store theme configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id: storeId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validation = themeUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid theme data',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Additional validation (contrast, ranges)
    const themeValidation = validateTheme(data);
    if (!themeValidation.valid) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Theme validation failed',
            details: themeValidation.errors,
          },
        },
        { status: 400 }
      );
    }

    // Update theme
    const theme = await updateStoreTheme(storeId, data);

    return NextResponse.json({
      data: theme,
      message: 'Theme updated successfully',
    });
  } catch (error) {
    console.error('Error updating theme:', error);

    if (error instanceof Error) {
      if (error.message === 'Store not found') {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Store not found',
            },
          },
          { status: 404 }
        );
      }

      if (error.message.includes('Invalid') && error.message.includes('color')) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: error.message,
            },
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update theme',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stores/[id]/theme
 * 
 * Reset theme to default values
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { id: storeId } = await params;

    // Reset theme to default
    const theme = await resetStoreTheme(storeId);

    return NextResponse.json({
      data: theme,
      message: 'Theme reset to default successfully',
    });
  } catch (error) {
    console.error('Error resetting theme:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to reset theme',
        },
      },
      { status: 500 }
    );
  }
}
