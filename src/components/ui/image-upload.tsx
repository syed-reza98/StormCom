// src/components/ui/image-upload.tsx
// Reusable image upload component with drag & drop, preview, and validation

'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  progress?: number;
  error?: string;
  uploaded?: boolean;
}

interface ImageUploadProps {
  /** Maximum number of images allowed */
  maxImages?: number;
  /** Maximum file size in MB */
  maxSizeMB?: number;
  /** Accepted image types */
  acceptedTypes?: string[];
  /** Current images */
  value?: UploadedImage[];
  /** Callback when images change */
  onChange?: (images: UploadedImage[]) => void;
  /** Whether to show image previews */
  showPreviews?: boolean;
  /** Custom upload function */
  onUpload?: (file: File) => Promise<string>;
  /** Disabled state */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

export function ImageUpload({
  maxImages = 10,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  value = [],
  onChange,
  showPreviews = true,
  onUpload,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(value);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateImages = useCallback((newImages: UploadedImage[]) => {
    setImages(newImages);
    onChange?.(newImages);
  }, [onChange]);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use: ${acceptedTypes.map(type => type.split('/')[1]).join(', ')}`;
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `File size (${sizeMB.toFixed(2)}MB) exceeds the ${maxSizeMB}MB limit`;
    }

    // Check total count
    if (images.length >= maxImages) {
      return `Maximum ${maxImages} images allowed`;
    }

    return null;
  }, [acceptedTypes, maxSizeMB, images.length, maxImages]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);
    
    // Filter out files that would exceed the limit
    const availableSlots = maxImages - images.length;
    const filesToProcess = fileArray.slice(0, availableSlots);
    
    if (fileArray.length > availableSlots) {
      setError(`Only ${availableSlots} more images can be added (${maxImages} max)`);
    }

    const newImages: UploadedImage[] = [];

    for (const file of filesToProcess) {
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        continue;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      
      const imageData: UploadedImage = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        url,
        progress: 0,
        uploaded: false,
      };

      newImages.push(imageData);
    }

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      updateImages(updatedImages);

      // Upload images if upload function is provided
      if (onUpload) {
        for (const imageData of newImages) {
          try {
            // Update progress
            const progressImages = updatedImages.map(img => 
              img.id === imageData.id ? { ...img, progress: 50 } : img
            );
            updateImages(progressImages);

            // Upload file
            const uploadedUrl = await onUpload(imageData.file);
            
            // Update with uploaded URL and completion
            const completedImages = updatedImages.map(img =>
              img.id === imageData.id 
                ? { ...img, url: uploadedUrl, progress: 100, uploaded: true }
                : img
            );
            updateImages(completedImages);

          } catch (uploadError) {
            // Update with error
            const errorImages = updatedImages.map(img =>
              img.id === imageData.id 
                ? { ...img, error: uploadError instanceof Error ? uploadError.message : 'Upload failed' }
                : img
            );
            updateImages(errorImages);
          }
        }
      }
    }
  }, [images, maxImages, onUpload, updateImages, validateFile]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const removeImage = useCallback((imageId: string) => {
    const updatedImages = images.filter(img => {
      if (img.id === imageId) {
        // Revoke object URL to free memory
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
        return false;
      }
      return true;
    });
    updateImages(updatedImages);
  }, [images, updateImages]);

  const moveImage = useCallback((imageId: string, direction: 'up' | 'down') => {
    const currentIndex = images.findIndex(img => img.id === imageId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= images.length) return;

    const newImages = [...images];
    [newImages[currentIndex], newImages[newIndex]] = [newImages[newIndex], newImages[currentIndex]];
    
    updateImages(newImages);
  }, [images, updateImages]);

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canAddMore = images.length < maxImages && !disabled;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      {canAddMore && (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            isDragging 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="space-y-2">
            <div className="text-4xl">🖼️</div>
            <div>
              <h3 className="text-lg font-medium">
                {isDragging ? 'Drop images here' : 'Upload Images'}
              </h3>
              <p className="text-muted-foreground">
                Drag and drop or click to select files
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Supported formats: {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}</p>
              <p>Max size: {maxSizeMB}MB per file • Max {maxImages} images</p>
              <p>{images.length} of {maxImages} uploaded</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Image Previews */}
      {showPreviews && images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Uploaded Images ({images.length})</h4>
            {images.length > 1 && (
              <div className="text-sm text-muted-foreground">
                Drag to reorder • First image is primary
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group border rounded-lg overflow-hidden bg-muted"
              >
                {/* Image Preview */}
                <div className="aspect-square relative">
                  <Image
                    src={image.url}
                    alt={`Upload ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Primary Badge */}
                  {index === 0 && (
                    <Badge 
                      className="absolute top-2 left-2 text-xs"
                      variant="default"
                    >
                      Primary
                    </Badge>
                  )}

                  {/* Upload Progress */}
                  {image.progress !== undefined && image.progress < 100 && !image.error && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white space-y-2">
                        <div className="text-sm">Uploading...</div>
                        <Progress value={image.progress} className="w-20" />
                        <div className="text-xs">{image.progress}%</div>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {image.error && (
                    <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                      <div className="text-center text-white text-xs p-2">
                        <div>❌</div>
                        <div>{image.error}</div>
                      </div>
                    </div>
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveImage(image.id, 'up')}
                        className="text-white hover:text-white hover:bg-white/20"
                      >
                        ↑
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage(image.id)}
                      className="text-white hover:text-white hover:bg-red-500/80"
                    >
                      🗑️
                    </Button>

                    {index < images.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveImage(image.id, 'down')}
                        className="text-white hover:text-white hover:bg-white/20"
                      >
                        ↓
                      </Button>
                    )}
                  </div>
                </div>

                {/* Image Info */}
                <div className="p-2 space-y-1">
                  <div className="text-sm font-medium truncate">
                    {image.file.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(image.file.size)}
                  </div>
                  {image.uploaded && (
                    <Badge variant="success" className="text-xs">
                      ✅ Uploaded
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {images.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {images.filter(img => img.uploaded).length} of {images.length} images uploaded successfully
        </div>
      )}
    </div>
  );
}