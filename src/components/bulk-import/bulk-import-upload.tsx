// src/components/bulk-import/bulk-import-upload.tsx
// File upload component for bulk import

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportSettings {
  updateExisting: boolean;
  skipInvalid: boolean;
  notifyOnComplete: boolean;
  batchSize: number;
  category?: string;
}

export function BulkImportUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ImportSettings>({
    updateExisting: false,
    skipInvalid: true,
    notifyOnComplete: true,
    batchSize: 100,
  });

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      return;
    }

    setFile(file);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock success - upload completed successfully

      // Reset form
      setFile(null);
      setUploadProgress(0);
      
      // Show success message (would be handled by parent component in real app)
      alert('File uploaded successfully! Processing will begin shortly.');

    } catch (err) {
      setError('Upload failed. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'home-garden', label: 'Home & Garden' },
    { value: 'sports', label: 'Sports & Outdoors' },
    { value: 'books', label: 'Books' },
    { value: 'toys', label: 'Toys & Games' },
  ];

  const batchSizes = [
    { value: 50, label: '50 products' },
    { value: 100, label: '100 products' },
    { value: 250, label: '250 products' },
    { value: 500, label: '500 products' },
  ];

  return (
    <div className="space-y-6">
      {/* File Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }
          ${file ? 'border-green-500 bg-green-50' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {!file ? (
          <div className="space-y-4">
            <div className="text-6xl">📁</div>
            <div>
              <h3 className="text-lg font-medium">
                {isDragging ? 'Drop your CSV file here' : 'Upload CSV File'}
              </h3>
              <p className="text-muted-foreground">
                Drag and drop your file here, or click to browse
              </p>
            </div>
            <div className="flex justify-center">
              <Label 
                htmlFor="file-input" 
                className="cursor-pointer inline-block px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
              >
                Choose File
              </Label>
              <Input
                id="file-input"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Supported format: CSV • Maximum size: 50MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl">✅</div>
            <div>
              <h3 className="text-lg font-medium">{file.name}</h3>
              <p className="text-muted-foreground">
                {formatFileSize(file.size)} • Ready to upload
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setFile(null)}
              disabled={isUploading}
            >
              Remove File
            </Button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {/* Import Settings */}
      {file && !isUploading && (
        <div className="space-y-4 border rounded-lg p-4">
          <h4 className="font-medium">Import Settings</h4>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="category">Default Category (Optional)</Label>
              <Select 
                // Use 'none' sentinel for no category instead of empty string
                value={settings.category || 'none'} 
                onValueChange={(value) => setSettings(prev => ({ 
                  ...prev, 
                  category: value === 'none' ? undefined : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No default category</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="batchSize">Batch Size</Label>
              <Select 
                value={settings.batchSize.toString()} 
                onValueChange={(value) => setSettings(prev => ({ 
                  ...prev, 
                  batchSize: parseInt(value) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {batchSizes.map(size => (
                    <SelectItem key={size.value} value={size.value.toString()}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateExisting"
                checked={settings.updateExisting}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  updateExisting: !!checked 
                }))}
              />
              <Label htmlFor="updateExisting" className="text-sm">
                Update existing products (match by SKU)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="skipInvalid"
                checked={settings.skipInvalid}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  skipInvalid: !!checked 
                }))}
              />
              <Label htmlFor="skipInvalid" className="text-sm">
                Skip invalid rows and continue processing
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyOnComplete"
                checked={settings.notifyOnComplete}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  notifyOnComplete: !!checked 
                }))}
              />
              <Label htmlFor="notifyOnComplete" className="text-sm">
                Send email notification when complete
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {file && !isUploading && (
        <div className="flex justify-end">
          <Button onClick={handleUpload} className="min-w-32">
            Start Import
          </Button>
        </div>
      )}
    </div>
  );
}