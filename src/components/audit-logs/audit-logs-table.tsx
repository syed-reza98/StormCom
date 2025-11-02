// src/components/audit-logs/audit-logs-table.tsx
// Audit Logs Data Table with pagination and expandable change details

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';

interface AuditLog {
  id: string;
  storeId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes?: Record<string, { old?: unknown; new?: unknown }>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditLogsTableProps {
  searchParams: {
    page?: string;
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  };
  userRole: string;
  storeId?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AuditLogsTable({ searchParams, userRole, storeId }: AuditLogsTableProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch audit logs data
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          page: searchParams.page || '1',
          limit: '50',
          ...(userRole !== 'SUPER_ADMIN' && storeId && { storeId }),
          ...(searchParams.userId && { userId: searchParams.userId }),
          ...(searchParams.entityType && { entityType: searchParams.entityType }),
          ...(searchParams.entityId && { entityId: searchParams.entityId }),
          ...(searchParams.action && { action: searchParams.action }),
          ...(searchParams.startDate && { startDate: searchParams.startDate }),
          ...(searchParams.endDate && { endDate: searchParams.endDate }),
        });

        const response = await fetch(`/api/audit-logs?${params}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to fetch audit logs');
        }

        const data = await response.json();

        if (data.data) {
          setLogs(data.data.logs || []);
          setPagination({
            page: data.data.page || 1,
            limit: data.data.limit || 50,
            total: data.data.total || 0,
            totalPages: data.data.totalPages || 0,
          });
        }
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [searchParams, userRole, storeId]);

  // Toggle row expansion
  const toggleRow = (logId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dateString));
  };

  // Get action badge
  const getActionBadge = (action: AuditAction) => {
    const badges: Record<AuditAction, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' }> = {
      CREATE: { label: 'Create', variant: 'success' },
      UPDATE: { label: 'Update', variant: 'default' },
      DELETE: { label: 'Delete', variant: 'destructive' },
      LOGIN: { label: 'Login', variant: 'outline' },
      LOGOUT: { label: 'Logout', variant: 'outline' },
      EXPORT: { label: 'Export', variant: 'secondary' },
      IMPORT: { label: 'Import', variant: 'secondary' },
    };

    const { label, variant } = badges[action];
    return <Badge variant={variant}>{label}</Badge>;
  };

  // Render changes diff
  const renderChanges = (changes?: Record<string, { old?: unknown; new?: unknown }>) => {
    if (!changes || Object.keys(changes).length === 0) {
      return <p className="text-sm text-muted-foreground italic">No changes recorded</p>;
    }

    return (
      <div className="space-y-2">
        {Object.entries(changes).map(([field, values]) => (
          <div key={field} className="border-l-2 border-blue-500 pl-3 py-1">
            <p className="text-sm font-semibold text-foreground">{field}</p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div>
                <p className="text-xs text-muted-foreground">Old Value:</p>
                <p className="text-sm font-mono bg-red-50 dark:bg-red-950 px-2 py-1 rounded">
                  {values.old !== undefined ? JSON.stringify(values.old) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">New Value:</p>
                <p className="text-sm font-mono bg-green-50 dark:bg-green-950 px-2 py-1 rounded">
                  {values.new !== undefined ? JSON.stringify(values.new) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive font-medium">Error loading audit logs</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (logs.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground font-medium">No audit logs found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or date range
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>User</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const isExpanded = expandedRows.has(log.id);
              
              return (
                <React.Fragment key={log.id}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(log.id)}
                        aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                      >
                        {isExpanded ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.entityType}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {log.entityId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {log.userName && (
                          <p className="font-medium">{log.userName}</p>
                        )}
                        {log.userEmail && (
                          <p className="text-xs text-muted-foreground">
                            {log.userEmail}
                          </p>
                        )}
                        {!log.userName && !log.userEmail && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {log.userId}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-mono">
                        {log.ipAddress || 'N/A'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{formatDate(log.createdAt)}</p>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-4 bg-muted/50">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Changes</h4>
                            {renderChanges(log.changes)}
                          </div>
                          {log.userAgent && (
                            <div>
                              <h4 className="text-sm font-semibold mb-1">User Agent</h4>
                              <p className="text-xs text-muted-foreground font-mono break-all">
                                {log.userAgent}
                              </p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 pb-6">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} logs
          </p>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            baseUrl="/audit-logs"
            searchParams={searchParams}
          />
        </div>
      )}
    </div>
  );
}
