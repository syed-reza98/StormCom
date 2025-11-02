/**
 * Image Optimization Utility
 * 
 * Provides image processing capabilities using Sharp for server-side optimization.
 * Supports multiple formats (JPEG, PNG, WebP, AVIF) with preset sizes for e-commerce.
 * 
 * **Features**:
 * - Format conversion (JPEG, PNG, WebP, AVIF)
 * - Preset sizes: thumbnail (150px), small (300px), medium (600px), large (1200px)
 * - Quality optimization: 80 for JPEG, 85 for WebP
 * - Progressive JPEG and lossless WebP support
 * 
 * **Usage**:
 * ```typescript
 * import { optimizeImage, ImageFormat, ImagePreset } from '@/lib/image-optimization';
 * 
 * // Optimize with preset
 * const buffer = await optimizeImage(imageBuffer, {
 *   preset: 'medium',
 *   format: 'webp',
 * });
 * 
 * // Custom size
 * const customBuffer = await optimizeImage(imageBuffer, {
 *   width: 800,
 *   height: 600,
 *   format: 'jpeg',
 * });
 * ```
 * 
 * @module image-optimization
 */

import sharp from 'sharp';

/**
 * Supported image formats
 */
export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif';

/**
 * Preset image sizes for e-commerce
 */
export type ImagePreset = 'thumbnail' | 'small' | 'medium' | 'large';

/**
 * Image optimization options
 */
export interface ImageOptimizationOptions {
  /**
   * Target width in pixels (optional if using preset)
   */
  width?: number;

  /**
   * Target height in pixels (optional, maintains aspect ratio if not provided)
   */
  height?: number;

  /**
   * Preset size (overrides width/height if provided)
   */
  preset?: ImagePreset;

  /**
   * Output format (default: webp)
   */
  format?: ImageFormat;

  /**
   * Quality setting (1-100, default varies by format)
   */
  quality?: number;

  /**
   * Fit strategy when both width and height are provided
   * - cover: Crop to fill dimensions (default)
   * - contain: Fit within dimensions
   * - fill: Stretch to dimensions
   * - inside: Shrink to fit within dimensions
   * - outside: Grow to cover dimensions
   */
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Size presets for e-commerce images
 */
const SIZE_PRESETS: Record<ImagePreset, { width: number; height: number }> = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 },
};

/**
 * Default quality settings by format
 */
const DEFAULT_QUALITY: Record<ImageFormat, number> = {
  jpeg: 80,
  png: 100, // PNG is lossless, quality affects compression
  webp: 85,
  avif: 80,
};

/**
 * Optimize an image buffer with the specified options
 * 
 * @param buffer - Input image buffer
 * @param options - Optimization options
 * @returns Optimized image buffer
 * 
 * @example
 * ```typescript
 * // Optimize to medium WebP
 * const optimized = await optimizeImage(imageBuffer, {
 *   preset: 'medium',
 *   format: 'webp',
 * });
 * 
 * // Custom size with JPEG
 * const custom = await optimizeImage(imageBuffer, {
 *   width: 800,
 *   format: 'jpeg',
 *   quality: 85,
 * });
 * ```
 */
export async function optimizeImage(
  buffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<Buffer> {
  const {
    preset,
    format = 'webp',
    quality,
    fit = 'cover',
  } = options;

  // Determine dimensions
  let { width, height } = options;
  if (preset) {
    const presetSize = SIZE_PRESETS[preset];
    width = presetSize.width;
    height = presetSize.height;
  }

  // Get quality setting
  const imageQuality = quality ?? DEFAULT_QUALITY[format];

  // Start Sharp pipeline
  let pipeline = sharp(buffer);

  // Resize if dimensions provided
  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit,
      withoutEnlargement: true, // Don't upscale images
    });
  }

  // Apply format-specific optimizations
  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({
        quality: imageQuality,
        progressive: true, // Progressive JPEG
        mozjpeg: true, // Use MozJPEG encoder for better compression
      });
      break;

    case 'png':
      pipeline = pipeline.png({
        quality: imageQuality,
        compressionLevel: 9, // Max compression
        progressive: false, // PNG doesn't support progressive
      });
      break;

    case 'webp':
      pipeline = pipeline.webp({
        quality: imageQuality,
        lossless: false, // Use lossy compression (better file size)
        effort: 4, // Compression effort (0-6, 4 is balanced)
      });
      break;

    case 'avif':
      pipeline = pipeline.avif({
        quality: imageQuality,
        effort: 4, // Compression effort (0-9, 4 is balanced)
      });
      break;
  }

  // Execute pipeline and return buffer
  return pipeline.toBuffer();
}

/**
 * Generate multiple sizes of an image (responsive image set)
 * 
 * @param buffer - Input image buffer
 * @param format - Output format (default: webp)
 * @returns Object with buffers for each preset size
 * 
 * @example
 * ```typescript
 * const responsiveSet = await generateResponsiveImages(imageBuffer, 'webp');
 * // Upload each size to storage
 * await uploadImage('product-thumbnail.webp', responsiveSet.thumbnail);
 * await uploadImage('product-small.webp', responsiveSet.small);
 * await uploadImage('product-medium.webp', responsiveSet.medium);
 * await uploadImage('product-large.webp', responsiveSet.large);
 * ```
 */
export async function generateResponsiveImages(
  buffer: Buffer,
  format: ImageFormat = 'webp'
): Promise<Record<ImagePreset, Buffer>> {
  const presets: ImagePreset[] = ['thumbnail', 'small', 'medium', 'large'];

  const results = await Promise.all(
    presets.map(async (preset) => ({
      preset,
      buffer: await optimizeImage(buffer, { preset, format }),
    }))
  );

  return results.reduce(
    (acc, { preset, buffer }) => {
      acc[preset] = buffer;
      return acc;
    },
    {} as Record<ImagePreset, Buffer>
  );
}

/**
 * Get image metadata without processing
 * 
 * @param buffer - Input image buffer
 * @returns Image metadata (width, height, format, size)
 * 
 * @example
 * ```typescript
 * const metadata = await getImageMetadata(imageBuffer);
 * console.log(`Image: ${metadata.width}x${metadata.height} ${metadata.format}`);
 * console.log(`Size: ${(metadata.size / 1024).toFixed(2)} KB`);
 * ```
 */
export async function getImageMetadata(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
}> {
  const metadata = await sharp(buffer).metadata();

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: metadata.size || 0,
    hasAlpha: metadata.hasAlpha || false,
  };
}

/**
 * Validate that an image meets size and dimension requirements
 * 
 * @param buffer - Input image buffer
 * @param constraints - Size and dimension constraints
 * @returns Validation result with error messages
 * 
 * @example
 * ```typescript
 * const validation = await validateImage(imageBuffer, {
 *   maxWidth: 4000,
 *   maxHeight: 4000,
 *   maxSizeBytes: 10 * 1024 * 1024, // 10MB
 * });
 * 
 * if (!validation.valid) {
 *   console.error('Image validation failed:', validation.errors);
 * }
 * ```
 */
export async function validateImage(
  buffer: Buffer,
  constraints: {
    maxWidth?: number;
    maxHeight?: number;
    minWidth?: number;
    minHeight?: number;
    maxSizeBytes?: number;
    allowedFormats?: string[];
  }
): Promise<{
  valid: boolean;
  errors: string[];
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}> {
  const errors: string[] = [];

  try {
    const metadata = await getImageMetadata(buffer);

    // Check dimensions
    if (constraints.maxWidth && metadata.width > constraints.maxWidth) {
      errors.push(`Image width ${metadata.width}px exceeds maximum ${constraints.maxWidth}px`);
    }

    if (constraints.maxHeight && metadata.height > constraints.maxHeight) {
      errors.push(`Image height ${metadata.height}px exceeds maximum ${constraints.maxHeight}px`);
    }

    if (constraints.minWidth && metadata.width < constraints.minWidth) {
      errors.push(`Image width ${metadata.width}px is below minimum ${constraints.minWidth}px`);
    }

    if (constraints.minHeight && metadata.height < constraints.minHeight) {
      errors.push(`Image height ${metadata.height}px is below minimum ${constraints.minHeight}px`);
    }

    // Check file size
    if (constraints.maxSizeBytes && metadata.size > constraints.maxSizeBytes) {
      const maxMB = (constraints.maxSizeBytes / (1024 * 1024)).toFixed(2);
      const actualMB = (metadata.size / (1024 * 1024)).toFixed(2);
      errors.push(`Image size ${actualMB}MB exceeds maximum ${maxMB}MB`);
    }

    // Check format
    if (constraints.allowedFormats && !constraints.allowedFormats.includes(metadata.format)) {
      errors.push(`Image format ${metadata.format} not allowed. Allowed: ${constraints.allowedFormats.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      metadata,
    };
  } catch (error) {
    return {
      valid: false,
      errors: ['Invalid image file or corrupted data'],
    };
  }
}
