/**
 * ProductImageGallery Component
 * 
 * Image gallery with thumbnail navigation and zoom functionality.
 * Client Component for interactive image switching.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { StorefrontProduct } from '@/services/storefront-service';

interface ProductImageGalleryProps {
  product: StorefrontProduct;
}

export function ProductImageGallery({ product }: ProductImageGalleryProps) {
  const images = product.images ? JSON.parse(product.images) : [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const hasMultipleImages = images.length > 1;

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (images.length === 0) {
    return (
      <Card className="aspect-square flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">No images available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <Card className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={images[selectedIndex]}
          alt={`${product.name} - Image ${selectedIndex + 1}`}
          fill
          className={`object-cover transition-transform duration-300 ${
            isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={selectedIndex === 0}
          onClick={() => setIsZoomed(!isZoomed)}
        />

        {/* Navigation Arrows (only if multiple images) */}
        {hasMultipleImages && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full opacity-75 hover:opacity-100"
              onClick={handlePrevious}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-75 hover:opacity-100"
              onClick={handleNext}
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Zoom Indicator */}
        <div className="absolute bottom-2 right-2 opacity-75">
          <ZoomIn className="h-5 w-5 text-white drop-shadow-lg" />
        </div>

        {/* Image Counter */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </Card>

      {/* Thumbnail Grid */}
      {hasMultipleImages && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image: string, index: number) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square overflow-hidden rounded border-2 transition-all ${
                index === selectedIndex
                  ? 'border-primary ring-2 ring-primary'
                  : 'border-transparent hover:border-muted-foreground'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image}
                alt={`${product.name} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 20vw, 10vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
