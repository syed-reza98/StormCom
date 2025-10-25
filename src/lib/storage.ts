// src/lib/storage.ts
// File storage service using Vercel Blob for images, documents, and other files
// Provides upload, download, delete, and URL generation utilities

import { put, del, list, head } from '@vercel/blob';

/**
 * Storage configuration
 */
const STORAGE_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ] as const,
  allowedDocumentTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ] as const,
} as const;

/**
 * File upload options
 */
export interface UploadFileOptions {
  file: File | Buffer;
  filename: string;
  folder?: string; // e.g., 'products', 'users', 'invoices'
  contentType?: string;
  addRandomSuffix?: boolean; // Add random string to filename to prevent collisions
  access?: 'public' | 'private';
}

/**
 * File upload result
 */
export interface UploadResult {
  success: boolean;
  url?: string;
  pathname?: string;
  contentType?: string;
  error?: string;
}

/**
 * File delete result
 */
export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * File list result
 */
export interface ListResult {
  success: boolean;
  files?: Array<{
    url: string;
    pathname: string;
    size: number;
    uploadedAt: Date;
  }>;
  error?: string;
}

/**
 * Upload a file to Vercel Blob storage
 */
export async function uploadFile(
  options: UploadFileOptions
): Promise<UploadResult> {
  try {
    // Validate file size
    const fileSize =
      options.file instanceof File
        ? options.file.size
        : Buffer.byteLength(options.file);

    if (fileSize > STORAGE_CONFIG.maxFileSize) {
      return {
        success: false,
        error: `File size exceeds maximum of ${
          STORAGE_CONFIG.maxFileSize / 1024 / 1024
        }MB`,
      };
    }

    // Validate content type if provided
    const contentType =
      options.contentType ||
      (options.file instanceof File ? options.file.type : 'application/octet-stream');

    // Build file path
    let pathname = options.filename;
    if (options.folder) {
      pathname = `${options.folder}/${pathname}`;
    }

    // Upload to Vercel Blob
    const blob = await put(pathname, options.file, {
      access: (options.access || 'public') as 'public',
      addRandomSuffix: options.addRandomSuffix ?? true,
      contentType,
    });

    return {
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
    };
  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

/**
 * Upload a product image
 * Validates image type and size
 */
export async function uploadProductImage(
  file: File | Buffer,
  filename: string,
  productId: string
): Promise<UploadResult> {
  // Validate image type
  const contentType =
    file instanceof File ? file.type : 'application/octet-stream';

  if (!STORAGE_CONFIG.allowedImageTypes.includes(contentType as any)) {
    return {
      success: false,
      error: `Invalid image type. Allowed types: ${STORAGE_CONFIG.allowedImageTypes.join(
        ', '
      )}`,
    };
  }

  return uploadFile({
    file,
    filename,
    folder: `products/${productId}`,
    contentType,
    addRandomSuffix: true,
    access: 'public',
  });
}

/**
 * Upload a user avatar
 */
export async function uploadUserAvatar(
  file: File | Buffer,
  filename: string,
  userId: string
): Promise<UploadResult> {
  const contentType =
    file instanceof File ? file.type : 'application/octet-stream';

  if (!STORAGE_CONFIG.allowedImageTypes.includes(contentType as any)) {
    return {
      success: false,
      error: `Invalid image type. Allowed types: ${STORAGE_CONFIG.allowedImageTypes.join(
        ', '
      )}`,
    };
  }

  return uploadFile({
    file,
    filename,
    folder: `users/${userId}`,
    contentType,
    addRandomSuffix: false, // Don't add random suffix for avatars
    access: 'public',
  });
}

/**
 * Upload a store logo
 */
export async function uploadStoreLogo(
  file: File | Buffer,
  filename: string,
  storeId: string
): Promise<UploadResult> {
  const contentType =
    file instanceof File ? file.type : 'application/octet-stream';

  if (!STORAGE_CONFIG.allowedImageTypes.includes(contentType as any)) {
    return {
      success: false,
      error: `Invalid image type. Allowed types: ${STORAGE_CONFIG.allowedImageTypes.join(
        ', '
      )}`,
    };
  }

  return uploadFile({
    file,
    filename,
    folder: `stores/${storeId}`,
    contentType,
    addRandomSuffix: false,
    access: 'public',
  });
}

/**
 * Upload an invoice PDF
 */
export async function uploadInvoice(
  file: File | Buffer,
  filename: string,
  orderId: string
): Promise<UploadResult> {
  const contentType =
    file instanceof File ? file.type : 'application/pdf';

  if (contentType !== 'application/pdf') {
    return {
      success: false,
      error: 'Only PDF files are allowed for invoices',
    };
  }

  return uploadFile({
    file,
    filename,
    folder: `invoices/${orderId}`,
    contentType,
    addRandomSuffix: false,
    access: 'private', // Invoices are private
  });
}

/**
 * Delete a file from Vercel Blob storage
 */
export async function deleteFile(url: string): Promise<DeleteResult> {
  try {
    await del(url);
    return { success: true };
  } catch (error) {
    console.error('File delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
    };
  }
}

/**
 * Delete multiple files from Vercel Blob storage
 */
export async function deleteFiles(urls: string[]): Promise<DeleteResult> {
  try {
    await del(urls);
    return { success: true };
  } catch (error) {
    console.error('Files delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete files',
    };
  }
}

/**
 * List files in a folder
 */
export async function listFiles(
  folder?: string,
  limit: number = 1000
): Promise<ListResult> {
  try {
    const { blobs } = await list({
      prefix: folder,
      limit,
    });

    return {
      success: true,
      files: blobs.map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      })),
    };
  } catch (error) {
    console.error('Files list error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files',
    };
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(url: string): Promise<{
  success: boolean;
  metadata?: {
    url: string;
    pathname: string;
    size: number;
    uploadedAt: Date;
    contentType: string;
  };
  error?: string;
}> {
  try {
    const metadata = await head(url);
    return {
      success: true,
      metadata: {
        url: metadata.url,
        pathname: metadata.pathname,
        size: metadata.size,
        uploadedAt: metadata.uploadedAt,
        contentType: metadata.contentType,
      },
    };
  } catch (error) {
    console.error('Get file metadata error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get file metadata',
    };
  }
}

/**
 * Helper function to validate file type
 */
export function isValidImageType(contentType: string): boolean {
  return STORAGE_CONFIG.allowedImageTypes.includes(contentType as any);
}

/**
 * Helper function to validate document type
 */
export function isValidDocumentType(contentType: string): boolean {
  return STORAGE_CONFIG.allowedDocumentTypes.includes(contentType as any);
}

/**
 * Helper function to generate a safe filename
 * Removes special characters and spaces
 */
export function generateSafeFilename(filename: string): string {
  const extension = filename.split('.').pop() || '';
  const nameWithoutExtension = filename
    .substring(0, filename.lastIndexOf('.'))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  return extension ? `${nameWithoutExtension}.${extension}` : nameWithoutExtension;
}

/**
 * Helper function to format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
