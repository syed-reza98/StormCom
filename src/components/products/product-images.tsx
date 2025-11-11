// src/components/products/product-images.tsx
// Product Images Component - Display and manage product images

'use client';

import Image from 'next/image';

interface ProductImagesProps {
  images: string[] | string;
  productName: string;
}

export function ProductImages({ images, productName }: ProductImagesProps) {
  // Normalize images: accept an array or a JSON-encoded string from legacy seed data
  let imgs: string[] = [];

  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      imgs = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // If parsing fails, try to use the string as a single src
      imgs = images ? [images] : [];
    }
  } else if (Array.isArray(images)) {
    imgs = images;
  }

  if (imgs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <p className="text-muted-foreground">No images uploaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden bg-muted">
        <Image
          src={imgs[0]}
          alt={productName}
          width={400}
          height={400}
          className="object-cover h-full w-full"
        />
      </div>
      
      {/* Thumbnail Gallery */}
      {imgs.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {imgs.slice(1).map((image, index) => (
            <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
              <Image
                src={image}
                alt={`${productName} ${index + 2}`}
                width={100}
                height={100}
                className="object-cover h-full w-full"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}