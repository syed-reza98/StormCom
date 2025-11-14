'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary?: boolean;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  onReorder?: (imageIds: string[]) => void;
  onDelete?: (imageId: string) => void;
  onSetPrimary?: (imageId: string) => void;
  editable?: boolean;
}

export default function ProductImageGallery({
  images,
  onReorder,
  onDelete,
  onSetPrimary,
  editable = false,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleDragStart = (index: number) => {
    if (!editable) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    if (onReorder) {
      onReorder(newImages.map(img => img.id));
    }
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDelete = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(imageId);
      if (selectedIndex >= images.length - 1) {
        setSelectedIndex(Math.max(0, images.length - 2));
      }
    }
  };

  const handleSetPrimary = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSetPrimary) {
      onSetPrimary(imageId);
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
        <Image
          src={selectedImage.url}
          alt={selectedImage.alt}
          fill
          className="object-contain"
          priority
        />
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Zoom Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setLightboxOpen(true)}
        >
          <ZoomIn className="h-5 w-5" />
        </Button>

        {/* Primary Badge */}
        {selectedImage.isPrimary && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
            Primary
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-5 gap-2">
        {images.map((image, index) => (
          <div
            key={image.id}
            draggable={editable}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => setSelectedIndex(index)}
            className={cn(
              "relative aspect-square rounded-lg overflow-hidden cursor-pointer group",
              "ring-2 ring-offset-2 transition-all",
              selectedIndex === index
                ? "ring-primary"
                : "ring-transparent hover:ring-primary/50",
              editable && "cursor-move"
            )}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              className="object-cover"
            />

            {/* Delete Button */}
            {editable && onDelete && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDelete(image.id, e)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}

            {/* Set Primary Button */}
            {editable && onSetPrimary && !image.isPrimary && (
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-1 left-1 h-6 text-xs px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleSetPrimary(image.id, e)}
              >
                Set Primary
              </Button>
            )}

            {/* Primary Indicator */}
            {image.isPrimary && (
              <div className="absolute top-1 left-1 px-1 py-0.5 bg-primary text-primary-foreground text-xs rounded">
                1st
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedImage.alt}</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-square">
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt}
              fill
              className="object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
