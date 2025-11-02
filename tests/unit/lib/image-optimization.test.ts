/**
 * Unit tests for image optimization utility
 * 
 * Tests Sharp-based image processing with presets, formats, and validation.
 * 
 * @group unit
 * @group lib
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  optimizeImage,
  generateResponsiveImages,
  getImageMetadata,
  validateImage,
} from '@/lib/image-optimization';
import sharp from 'sharp';

describe('image-optimization', () => {
  // Create test image buffers
  let testImageBuffer: Buffer;
  let largeImageBuffer: Buffer;

  beforeAll(async () => {
    // Create a simple test image (100x100 red square)
    testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    // Create a large test image (2000x2000)
    largeImageBuffer = await sharp({
      create: {
        width: 2000,
        height: 2000,
        channels: 3,
        background: { r: 0, g: 255, b: 0 },
      },
    })
      .png()
      .toBuffer();
  });

  describe('optimizeImage', () => {
    it('should optimize image with thumbnail preset', async () => {
      const optimized = await optimizeImage(testImageBuffer, {
        preset: 'thumbnail',
        format: 'webp',
      });

      expect(optimized).toBeInstanceOf(Buffer);

      const metadata = await sharp(optimized).metadata();
      expect(metadata.width).toBe(100); // Original is smaller than preset
      expect(metadata.height).toBe(100);
      expect(metadata.format).toBe('webp');
    });

    it('should optimize image with small preset', async () => {
      const optimized = await optimizeImage(largeImageBuffer, {
        preset: 'small',
        format: 'webp',
      });

      const metadata = await sharp(optimized).metadata();
      expect(metadata.width).toBe(300);
      expect(metadata.height).toBe(300);
      expect(metadata.format).toBe('webp');
    });

    it('should optimize image with medium preset', async () => {
      const optimized = await optimizeImage(largeImageBuffer, {
        preset: 'medium',
        format: 'jpeg',
      });

      const metadata = await sharp(optimized).metadata();
      expect(metadata.width).toBe(600);
      expect(metadata.height).toBe(600);
      expect(metadata.format).toBe('jpeg');
    });

    it('should optimize image with large preset', async () => {
      const optimized = await optimizeImage(largeImageBuffer, {
        preset: 'large',
        format: 'png',
      });

      const metadata = await sharp(optimized).metadata();
      expect(metadata.width).toBe(1200);
      expect(metadata.height).toBe(1200);
      expect(metadata.format).toBe('png');
    });

    it('should optimize with custom width', async () => {
      const optimized = await optimizeImage(largeImageBuffer, {
        width: 400,
        format: 'webp',
      });

      const metadata = await sharp(optimized).metadata();
      expect(metadata.width).toBe(400);
      expect(metadata.format).toBe('webp');
    });

    it('should optimize with custom width and height', async () => {
      const optimized = await optimizeImage(largeImageBuffer, {
        width: 500,
        height: 300,
        format: 'webp',
      });

      const metadata = await sharp(optimized).metadata();
      expect(metadata.width).toBe(500);
      expect(metadata.height).toBe(300);
      expect(metadata.format).toBe('webp');
    });

    it('should use default format (webp) when not specified', async () => {
      const optimized = await optimizeImage(testImageBuffer, {
        preset: 'thumbnail',
      });

      const metadata = await sharp(optimized).metadata();
      expect(metadata.format).toBe('webp');
    });

    it('should apply custom quality setting', async () => {
      const optimized = await optimizeImage(testImageBuffer, {
        preset: 'small',
        format: 'jpeg',
        quality: 50,
      });

      expect(optimized).toBeInstanceOf(Buffer);
      // Lower quality should result in smaller file size
      expect(optimized.length).toBeLessThan(testImageBuffer.length);
    });

    it('should support AVIF format', async () => {
      const optimized = await optimizeImage(testImageBuffer, {
        preset: 'thumbnail',
        format: 'avif',
      });

      const metadata = await sharp(optimized).metadata();
      expect(metadata.format).toBe('heif'); // AVIF is detected as heif by Sharp
    });

    it('should not upscale images smaller than target size', async () => {
      const optimized = await optimizeImage(testImageBuffer, {
        width: 500,
        format: 'webp',
      });

      const metadata = await sharp(optimized).metadata();
      expect(metadata.width).toBe(100); // Original size maintained
    });
  });

  describe('generateResponsiveImages', () => {
    it('should generate all preset sizes', async () => {
      const responsiveSet = await generateResponsiveImages(largeImageBuffer, 'webp');

      expect(responsiveSet).toHaveProperty('thumbnail');
      expect(responsiveSet).toHaveProperty('small');
      expect(responsiveSet).toHaveProperty('medium');
      expect(responsiveSet).toHaveProperty('large');

      // Verify thumbnail
      const thumbnailMeta = await sharp(responsiveSet.thumbnail).metadata();
      expect(thumbnailMeta.width).toBe(150);
      expect(thumbnailMeta.format).toBe('webp');

      // Verify small
      const smallMeta = await sharp(responsiveSet.small).metadata();
      expect(smallMeta.width).toBe(300);
      expect(smallMeta.format).toBe('webp');

      // Verify medium
      const mediumMeta = await sharp(responsiveSet.medium).metadata();
      expect(mediumMeta.width).toBe(600);
      expect(mediumMeta.format).toBe('webp');

      // Verify large
      const largeMeta = await sharp(responsiveSet.large).metadata();
      expect(largeMeta.width).toBe(1200);
      expect(largeMeta.format).toBe('webp');
    });

    it('should generate responsive set in JPEG format', async () => {
      const responsiveSet = await generateResponsiveImages(largeImageBuffer, 'jpeg');

      const thumbnailMeta = await sharp(responsiveSet.thumbnail).metadata();
      expect(thumbnailMeta.format).toBe('jpeg');

      const largeMeta = await sharp(responsiveSet.large).metadata();
      expect(largeMeta.format).toBe('jpeg');
    });

    it('should use webp as default format', async () => {
      const responsiveSet = await generateResponsiveImages(largeImageBuffer);

      const thumbnailMeta = await sharp(responsiveSet.thumbnail).metadata();
      expect(thumbnailMeta.format).toBe('webp');
    });
  });

  describe('getImageMetadata', () => {
    it('should return correct metadata for test image', async () => {
      const metadata = await getImageMetadata(testImageBuffer);

      expect(metadata.width).toBe(100);
      expect(metadata.height).toBe(100);
      expect(metadata.format).toBe('png');
      expect(metadata.size).toBeGreaterThan(0);
      expect(metadata.hasAlpha).toBe(false);
    });

    it('should return correct metadata for large image', async () => {
      const metadata = await getImageMetadata(largeImageBuffer);

      expect(metadata.width).toBe(2000);
      expect(metadata.height).toBe(2000);
      expect(metadata.format).toBe('png');
      expect(metadata.size).toBeGreaterThan(0);
    });

    it('should detect alpha channel in PNG with transparency', async () => {
      const transparentPng = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 4, // RGBA
          background: { r: 255, g: 0, b: 0, alpha: 0.5 },
        },
      })
        .png()
        .toBuffer();

      const metadata = await getImageMetadata(transparentPng);
      expect(metadata.hasAlpha).toBe(true);
    });
  });

  describe('validateImage', () => {
    it('should validate image within constraints', async () => {
      const validation = await validateImage(testImageBuffer, {
        maxWidth: 200,
        maxHeight: 200,
        maxSizeBytes: 1024 * 1024, // 1MB
      });

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.metadata).toBeDefined();
      expect(validation.metadata?.width).toBe(100);
    });

    it('should fail validation for oversized width', async () => {
      const validation = await validateImage(largeImageBuffer, {
        maxWidth: 1000,
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Image width 2000px exceeds maximum 1000px');
    });

    it('should fail validation for oversized height', async () => {
      const validation = await validateImage(largeImageBuffer, {
        maxHeight: 1000,
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Image height 2000px exceeds maximum 1000px');
    });

    it('should fail validation for undersized width', async () => {
      const validation = await validateImage(testImageBuffer, {
        minWidth: 200,
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Image width 100px is below minimum 200px');
    });

    it('should fail validation for undersized height', async () => {
      const validation = await validateImage(testImageBuffer, {
        minHeight: 200,
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Image height 100px is below minimum 200px');
    });

    it('should fail validation for oversized file', async () => {
      const validation = await validateImage(largeImageBuffer, {
        maxSizeBytes: 1024, // 1KB (too small)
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('exceeds maximum');
    });

    it('should fail validation for disallowed format', async () => {
      const validation = await validateImage(testImageBuffer, {
        allowedFormats: ['jpeg', 'webp'],
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Image format png not allowed. Allowed: jpeg, webp');
    });

    it('should pass validation for allowed format', async () => {
      const validation = await validateImage(testImageBuffer, {
        allowedFormats: ['png', 'jpeg', 'webp'],
      });

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should return multiple errors for multiple constraint violations', async () => {
      const validation = await validateImage(largeImageBuffer, {
        maxWidth: 1000,
        maxHeight: 1000,
        maxSizeBytes: 1024, // 1KB
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(1);
    });

    it('should handle invalid image buffer', async () => {
      const invalidBuffer = Buffer.from('not an image');
      const validation = await validateImage(invalidBuffer, {
        maxWidth: 1000,
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Invalid image file or corrupted data');
    });
  });
});
