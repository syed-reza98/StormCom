// src/components/audit-logs/audit-logs-filters.tsx
// Audit Logs Filters - Search and filter audit log entries

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MagnifyingGlassIcon, ResetIcon } from '@radix-ui/react-icons';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT';
type EntityType = 'Product' | 'Order' | 'Customer' | 'User' | 'Store' | 'Category' | 'Brand';

interface AuditLogsFiltersProps {
  searchParams: {
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

// ============================================================================
// CONSTANTS
// ============================================================================

const ENTITY_TYPES: EntityType[] = [
  'Product',
  'Order',
  'Customer',
  'User',
  'Store',
  'Category',
  'Brand',
];

const AUDIT_ACTIONS: AuditAction[] = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
  'IMPORT',
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AuditLogsFilters({ searchParams, userRole, storeId }: AuditLogsFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  // Form state
  const [userId, setUserId] = useState(searchParams.userId || '');
  const [entityType, setEntityType] = useState(searchParams.entityType || '');
  const [entityId, setEntityId] = useState(searchParams.entityId || '');
  const [action, setAction] = useState(searchParams.action || '');
  const [startDate, setStartDate] = useState(searchParams.startDate || '');
  const [endDate, setEndDate] = useState(searchParams.endDate || '');

  // Sync with URL changes
  useEffect(() => {
    setUserId(searchParams.userId || '');
    setEntityType(searchParams.entityType || '');
    setEntityId(searchParams.entityId || '');
    setAction(searchParams.action || '');
    setStartDate(searchParams.startDate || '');
    setEndDate(searchParams.endDate || '');
  }, [searchParams]);

  // Build URL with filters
  const buildFilterUrl = () => {
    const newParams = new URLSearchParams(params);

    // Always start from page 1 when filtering
    newParams.set('page', '1');

    // Add filters if they have values
    if (userId.trim()) {
      newParams.set('userId', userId.trim());
    } else {
      newParams.delete('userId');
    }

    if (entityType) {
      newParams.set('entityType', entityType);
    } else {
      newParams.delete('entityType');
    }

    if (entityId.trim()) {
      newParams.set('entityId', entityId.trim());
    } else {
      newParams.delete('entityId');
    }

    if (action) {
      newParams.set('action', action);
    } else {
      newParams.delete('action');
    }

    if (startDate) {
      newParams.set('startDate', startDate);
    } else {
      newParams.delete('startDate');
    }

    if (endDate) {
      newParams.set('endDate', endDate);
    } else {
      newParams.delete('endDate');
    }

    // For non-SUPER_ADMIN, always include storeId
    if (userRole !== 'SUPER_ADMIN' && storeId) {
      newParams.set('storeId', storeId);
    }

    return `/audit-logs?${newParams.toString()}`;
  };

  // Apply filters
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildFilterUrl());
  };

  // Reset filters
  const handleResetFilters = () => {
    setUserId('');
    setEntityType('');
    setEntityId('');
    setAction('');
    setStartDate('');
    setEndDate('');

    const newParams = new URLSearchParams();
    newParams.set('page', '1');

    // For non-SUPER_ADMIN, preserve storeId
    if (userRole !== 'SUPER_ADMIN' && storeId) {
      newParams.set('storeId', storeId);
    }

    router.push(`/audit-logs?${newParams.toString()}`);
  };

  // Check if any filters are active
  const hasActiveFilters = 
    userId || entityType || entityId || action || startDate || endDate;

  return (
    <form onSubmit={handleApplyFilters} className="p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* User ID Filter */}
        <div className="space-y-2">
          <Label htmlFor="userId">User ID</Label>
          <Input
            id="userId"
            placeholder="Enter user ID..."
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        {/* Entity Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="entityType">Entity Type</Label>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger id="entityType">
              <SelectValue placeholder="All entity types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All entity types</SelectItem>
              {ENTITY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entity ID Filter */}
        <div className="space-y-2">
          <Label htmlFor="entityId">Entity ID</Label>
          <Input
            id="entityId"
            placeholder="Enter entity ID..."
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
          />
        </div>

        {/* Action Filter */}
        <div className="space-y-2">
          <Label htmlFor="action">Action</Label>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger id="action">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All actions</SelectItem>
              {AUDIT_ACTIONS.map((act) => (
                <SelectItem key={act} value={act}>
                  {act}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        {/* End Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button type="submit" variant="default" size="sm">
          <MagnifyingGlassIcon className="mr-2 h-4 w-4" />
          Apply Filters
        </Button>
        
        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
          >
            <ResetIcon className="mr-2 h-4 w-4" />
            Reset Filters
          </Button>
        )}
      </div>
    </form>
  );
}
