'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Pause,
  RotateCw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type SyncStatus = 'syncing' | 'success' | 'failed' | 'paused';

interface SyncHistoryItem {
  id: string;
  timestamp: Date;
  status: SyncStatus;
  message?: string;
}

interface SyncStatusIndicatorProps {
  status: SyncStatus;
  lastSyncedAt?: Date;
  progress?: number;
  syncHistory?: SyncHistoryItem[];
  onRetry?: () => void;
}

export function SyncStatusIndicator({
  status,
  lastSyncedAt,
  progress = 0,
  syncHistory = [],
  onRetry,
}: SyncStatusIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'syncing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusVariant = (): 'default' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'syncing':
        return 'default';
      case 'success':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'paused':
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Sync Status</span>
          <Badge variant={getStatusVariant()} className="gap-1">
            {getStatusIcon()}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {status === 'syncing' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Syncing...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Last Synced */}
        {lastSyncedAt && (
          <div className="text-sm">
            <span className="text-muted-foreground">Last synced: </span>
            <span>
              {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Retry Button */}
        {status === 'failed' && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="w-full">
            <RotateCw className="mr-2 h-4 w-4" />
            Retry Sync
          </Button>
        )}

        {/* Sync History */}
        {syncHistory.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Recent Activity</div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {syncHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 text-xs border-l-2 pl-2 py-1"
                  style={{
                    borderColor:
                      item.status === 'success'
                        ? 'hsl(var(--primary))'
                        : item.status === 'failed'
                        ? 'hsl(var(--destructive))'
                        : 'hsl(var(--muted-foreground))',
                  }}
                >
                  <div className="flex-1">
                    <div className="font-medium capitalize">{item.status}</div>
                    {item.message && (
                      <div className="text-muted-foreground">{item.message}</div>
                    )}
                    <div className="text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(item.timestamp), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
