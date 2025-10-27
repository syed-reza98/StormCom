// app/(dashboard)/bulk-import/page.tsx
// Bulk Import Page - Dashboard page for bulk importing products

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BulkImportUpload } from '@/components/bulk-import/bulk-import-upload';
import { BulkImportHistory } from '@/components/bulk-import/bulk-import-history';
import { BulkImportTemplates } from '@/components/bulk-import/bulk-import-templates';

// Mock data for demonstration
const importStats = {
  totalImports: 47,
  totalProducts: 12543,
  successfulImports: 42,
  failedImports: 5,
  pendingImports: 2,
  avgProcessingTime: '2.3 minutes',
};

const recentImports = [
  {
    id: '1',
    fileName: 'summer-collection-2024.csv',
    status: 'completed' as const,
    totalRows: 150,
    processedRows: 150,
    successRows: 148,
    errorRows: 2,
    createdAt: '2024-01-15T10:30:00Z',
    completedAt: '2024-01-15T10:32:30Z',
    processingTime: '2m 30s',
    downloadUrl: '/downloads/import-results-1.xlsx',
  },
  {
    id: '2',
    fileName: 'winter-inventory-update.csv',
    status: 'processing' as const,
    totalRows: 250,
    processedRows: 180,
    successRows: 175,
    errorRows: 5,
    createdAt: '2024-01-15T09:45:00Z',
    progress: 72,
  },
  {
    id: '3',
    fileName: 'electronics-catalog.csv',
    status: 'failed' as const,
    totalRows: 500,
    processedRows: 45,
    successRows: 0,
    errorRows: 45,
    createdAt: '2024-01-15T08:20:00Z',
    failedAt: '2024-01-15T08:22:15Z',
    errorMessage: 'Invalid file format: Missing required column "sku"',
  },
  {
    id: '4',
    fileName: 'accessories-q1-2024.csv',
    status: 'queued' as const,
    totalRows: 75,
    createdAt: '2024-01-15T11:00:00Z',
    estimatedStartTime: '2024-01-15T11:05:00Z',
  },
];

export default function BulkImportPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Import</h1>
          <p className="text-muted-foreground">
            Import products in bulk using CSV files
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            📖 Import Guide
          </Button>
          <Button variant="outline">
            📈 View Reports
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Imports</CardTitle>
            <div className="text-2xl">📊</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{importStats.totalImports}</div>
            <p className="text-xs text-muted-foreground">
              +3 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Imported</CardTitle>
            <div className="text-2xl">📦</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{importStats.totalProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +2,350 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <div className="text-2xl">✅</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((importStats.successfulImports / importStats.totalImports) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {importStats.successfulImports} of {importStats.totalImports} imports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <div className="text-2xl">⏱️</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{importStats.avgProcessingTime}</div>
            <p className="text-xs text-muted-foreground">
              -30s from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Upload a CSV file containing product data. Maximum file size: 50MB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading upload component...</div>}>
                <BulkImportUpload />
              </Suspense>
            </CardContent>
          </Card>

          {/* Import History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Imports</CardTitle>
              <CardDescription>
                Track the status of your recent import jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading import history...</div>}>
                <BulkImportHistory imports={recentImports} />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Processing Queue</span>
                  <Badge variant="outline">{importStats.pendingImports} jobs</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Failed Imports</span>
                  <Badge variant="destructive">{importStats.failedImports}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">System Status</span>
                  <Badge variant="success">Healthy</Badge>
                </div>
              </div>

              {importStats.pendingImports > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Progress</span>
                    <span className="text-sm">65%</span>
                  </div>
                  <Progress value={65} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle>CSV Templates</CardTitle>
              <CardDescription>
                Download sample templates to format your data correctly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading templates...</div>}>
                <BulkImportTemplates />
              </Suspense>
            </CardContent>
          </Card>

          {/* Import Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Import Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">📋 Required Fields</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Product Name</li>
                  <li>• SKU (unique)</li>
                  <li>• Price</li>
                  <li>• Category</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">📐 File Specifications</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Max size: 50MB</li>
                  <li>• Format: CSV only</li>
                  <li>• Encoding: UTF-8</li>
                  <li>• Max rows: 10,000</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">🔄 Processing</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Duplicates are skipped</li>
                  <li>• Validation runs first</li>
                  <li>• Rollback on errors</li>
                  <li>• Email notifications</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}