// src/components/bulk-import/bulk-import-history.tsx
// Import history component showing recent import jobs

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type ImportStatus = 'queued' | 'processing' | 'completed' | 'failed';

interface ImportJob {
  id: string;
  fileName: string;
  status: ImportStatus;
  totalRows: number;
  processedRows?: number;
  successRows?: number;
  errorRows?: number;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
  processingTime?: string;
  progress?: number;
  errorMessage?: string;
  downloadUrl?: string;
  estimatedStartTime?: string;
}

interface BulkImportHistoryProps {
  imports: ImportJob[];
}

export function BulkImportHistory({ imports }: BulkImportHistoryProps) {
  const getStatusBadge = (status: ImportStatus) => {
    switch (status) {
      case 'queued':
        return <Badge variant="secondary">⏳ Queued</Badge>;
      case 'processing':
        return <Badge variant="default">🔄 Processing</Badge>;
      case 'completed':
        return <Badge variant="success">✅ Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">❌ Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: string, end?: string) => {
    if (!end) return 'In progress...';
    
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (imports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="text-4xl mb-2">📂</div>
        <p>No import history yet</p>
        <p className="text-sm">Your completed imports will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {imports.map((importJob) => (
        <div
          key={importJob.id}
          className="border rounded-lg p-4 space-y-3"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="font-medium">{importJob.fileName}</div>
              <div className="text-sm text-muted-foreground">
                Started: {formatDate(importJob.createdAt)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(importJob.status)}
            </div>
          </div>

          {/* Progress */}
          {importJob.status === 'processing' && importJob.progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{importJob.progress}%</span>
              </div>
              <Progress value={importJob.progress} className="w-full" />
              <div className="text-xs text-muted-foreground">
                Processed {importJob.processedRows} of {importJob.totalRows} rows
              </div>
            </div>
          )}

          {/* Status Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Rows</div>
              <div className="font-medium">{importJob.totalRows.toLocaleString()}</div>
            </div>

            {importJob.processedRows !== undefined && (
              <div>
                <div className="text-muted-foreground">Processed</div>
                <div className="font-medium">{importJob.processedRows.toLocaleString()}</div>
              </div>
            )}

            {importJob.successRows !== undefined && (
              <div>
                <div className="text-muted-foreground">Success</div>
                <div className="font-medium text-green-600">
                  {importJob.successRows.toLocaleString()}
                </div>
              </div>
            )}

            {importJob.errorRows !== undefined && importJob.errorRows > 0 && (
              <div>
                <div className="text-muted-foreground">Errors</div>
                <div className="font-medium text-red-600">
                  {importJob.errorRows.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          {importJob.status === 'completed' && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Completed in {importJob.processingTime || 
                  formatDuration(importJob.createdAt, importJob.completedAt)}
              </span>
              {importJob.downloadUrl && (
                <Button variant="outline" size="sm">
                  📥 Download Report
                </Button>
              )}
            </div>
          )}

          {importJob.status === 'failed' && importJob.errorMessage && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              <strong>Error:</strong> {importJob.errorMessage}
            </div>
          )}

          {importJob.status === 'queued' && importJob.estimatedStartTime && (
            <div className="text-sm text-muted-foreground">
              Estimated start: {formatDate(importJob.estimatedStartTime)}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {importJob.status === 'completed' && (
              <>
                <Button variant="ghost" size="sm">
                  👁️ View Details
                </Button>
                <Button variant="ghost" size="sm">
                  📊 View Products
                </Button>
                {importJob.downloadUrl && (
                  <Button variant="ghost" size="sm">
                    📥 Download
                  </Button>
                )}
              </>
            )}

            {importJob.status === 'failed' && (
              <>
                <Button variant="ghost" size="sm">
                  🔍 View Errors
                </Button>
                <Button variant="ghost" size="sm">
                  🔄 Retry Import
                </Button>
              </>
            )}

            {importJob.status === 'processing' && (
              <Button variant="ghost" size="sm" className="text-red-600">
                ⏹️ Cancel
              </Button>
            )}

            {importJob.status === 'queued' && (
              <>
                <Button variant="ghost" size="sm">
                  ⬆️ Prioritize
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600">
                  ❌ Remove
                </Button>
              </>
            )}
          </div>
        </div>
      ))}

      {/* Load More */}
      {imports.length >= 5 && (
        <div className="text-center pt-4">
          <Button variant="outline">
            Load More History
          </Button>
        </div>
      )}
    </div>
  );
}