// src/components/ui/image-upload-dialog.tsx
// Reusable Image Upload Dialog component
// Pattern: shadcn Dialog with ImageUpload component

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  progress?: number;
  error?: string;
  uploaded?: boolean;
}

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (urls: string[]) => void;
  title?: string;
  description?: string;
  maxImages?: number;
  isLoading?: boolean;
}

export function ImageUploadDialog({
  open,
  onOpenChange,
  onUpload,
  title = 'Upload Images',
  description = 'Upload one or more images for this item',
  maxImages = 5,
  isLoading = false,
}: ImageUploadDialogProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const handleUploadComplete = (images: UploadedImage[]) => {
    setUploadedImages(images);
  };

  const handleSave = () => {
    const urls = uploadedImages.map(img => img.url);
    onUpload(urls);
    setUploadedImages([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setUploadedImages([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-4">
          <ImageUpload
            value={uploadedImages}
            onChange={handleUploadComplete}
            maxImages={maxImages}
            disabled={isLoading}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || uploadedImages.length === 0}
          >
            {isLoading ? 'Uploading...' : 'Save Images'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
