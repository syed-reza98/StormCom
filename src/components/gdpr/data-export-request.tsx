'use client';

import * as React from 'react';
import {
  Download,
  FileText,
  Database,
  User,
  ShoppingCart,
  CreditCard,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { Separator } from '@/components/ui/separator';

interface DataCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  recordCount: number;
  size: string;
}

interface DataExportRequestProps {
  onRequestExport: () => Promise<string>; // Returns download URL
  categories?: DataCategory[];
  className?: string;
}

const defaultCategories: DataCategory[] = [
  {
    id: 'profile',
    name: 'Profile Data',
    description: 'Your account information and preferences',
    icon: User,
    recordCount: 1,
    size: '2 KB',
  },
  {
    id: 'orders',
    name: 'Order History',
    description: 'All your past orders and transactions',
    icon: ShoppingCart,
    recordCount: 0,
    size: '0 KB',
  },
  {
    id: 'payments',
    name: 'Payment Information',
    description: 'Saved payment methods (anonymized)',
    icon: CreditCard,
    recordCount: 0,
    size: '0 KB',
  },
  {
    id: 'activity',
    name: 'Activity Logs',
    description: 'Your browsing and interaction history',
    icon: Database,
    recordCount: 0,
    size: '0 KB',
  },
];

export function DataExportRequest({
  onRequestExport,
  categories = defaultCategories,
  className,
}: DataExportRequestProps) {
  const [status, setStatus] = React.useState<
    'idle' | 'preparing' | 'ready' | 'error'
  >('idle');
  const [progress, setProgress] = React.useState(0);
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleRequestExport = async () => {
    setStatus('preparing');
    setProgress(0);
    setError(null);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const url = await onRequestExport();
      clearInterval(interval);
      setProgress(100);
      setDownloadUrl(url);
      setStatus('ready');
    } catch (err) {
      clearInterval(interval);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to prepare export');
    }
  };

  const totalRecords = categories.reduce((sum, cat) => sum + cat.recordCount, 0);
  const totalSize = categories.reduce((sum, cat) => {
    const match = cat.size.match(/(\d+\.?\d*)/);
    return sum + (match ? parseFloat(match[1]) : 0);
  }, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle>Export Your Data</CardTitle>
        </div>
        <CardDescription>
          Request a copy of all your personal data in machine-readable format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data categories */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">What will be included:</h4>
          <div className="space-y-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{category.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{category.recordCount} records</span>
                        <span>•</span>
                        <span>{category.size}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Summary */}
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Records:</span>
            <span className="font-medium">{totalRecords}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated Size:</span>
            <span className="font-medium">~{totalSize.toFixed(1)} KB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Format:</span>
            <span className="font-medium">JSON (.json)</span>
          </div>
        </div>

        {/* Status */}
        {status !== 'idle' && (
          <div className="space-y-3">
            {status === 'preparing' && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Preparing your data export...</span>
                </div>
                <Progress value={progress} className="h-2" />
              </>
            )}

            {status === 'ready' && downloadUrl && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 border border-green-200">
                <CheckCircle className="h-4 w-4 text-green-700" />
                <span className="text-sm font-medium text-green-700">
                  Your data export is ready!
                </span>
              </div>
            )}

            {status === 'error' && (
              <div className="rounded-md bg-red-50 p-3 border border-red-200">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {status === 'idle' || status === 'error' ? (
            <Button onClick={handleRequestExport} className="w-full">
              Request Data Export
            </Button>
          ) : status === 'ready' && downloadUrl ? (
            <Button asChild className="w-full">
              <a href={downloadUrl} download>
                <Download className="mr-2 h-4 w-4" />
                Download Export
              </a>
            </Button>
          ) : null}

          {status === 'ready' && (
            <Button
              variant="outline"
              onClick={handleRequestExport}
              className="w-full"
            >
              Request New Export
            </Button>
          )}
        </div>

        {/* Legal notice */}
        <p className="text-xs text-muted-foreground">
          Under GDPR Article 20, you have the right to receive your personal data in
          a structured, commonly used format. The export will be available for 7 days.
        </p>
      </CardContent>
    </Card>
  );
}
