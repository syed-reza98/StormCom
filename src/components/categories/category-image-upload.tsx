'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface CategoryImageUploadProps {
  categoryId?: string;
  bannerImage?: string;
  iconImage?: string;
  onUpload: (file: File, type: 'banner' | 'icon') => Promise<string>;
  onDelete: (type: 'banner' | 'icon') => Promise<void>;
}

export function CategoryImageUpload({
  bannerImage,
  iconImage,
  onUpload,
  onDelete,
}: CategoryImageUploadProps) {
  const [bannerPreview, setBannerPreview] = useState(bannerImage);
  const [iconPreview, setIconPreview] = useState(iconImage);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'banner' | 'icon'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const url = await onUpload(file, type);
      if (type === 'banner') {
        setBannerPreview(url);
      } else {
        setIconPreview(url);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (type: 'banner' | 'icon') => {
    try {
      await onDelete(type);
      if (type === 'banner') {
        setBannerPreview(undefined);
      } else {
        setIconPreview(undefined);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Banner Image */}
        <div className="space-y-2">
          <Label>Banner Image (1200x400px)</Label>
          {bannerPreview ? (
            <div className="relative group">
              <Image
                src={bannerPreview}
                alt="Banner"
                width={600}
                height={200}
                className="rounded-lg object-cover w-full"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete('banner')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">
                Click to upload banner
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'banner')}
                disabled={isUploading}
              />
            </label>
          )}
        </div>

        {/* Icon Image */}
        <div className="space-y-2">
          <Label>Icon Image (200x200px)</Label>
          {iconPreview ? (
            <div className="relative group inline-block">
              <Image
                src={iconPreview}
                alt="Icon"
                width={100}
                height={100}
                className="rounded-lg object-cover"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDelete('icon')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="inline-flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors">
              <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">
                Upload icon
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'icon')}
                disabled={isUploading}
              />
            </label>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
