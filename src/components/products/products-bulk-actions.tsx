// src/components/products/products-bulk-actions.tsx
// Products Bulk Actions Component - Handle bulk operations on selected products

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ProductsBulkActionsProps {
  selectedProducts?: string[];
  onSelectionChange?: (products: string[]) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProductsBulkActions({ 
  selectedProducts = [], 
  onSelectionChange 
}: ProductsBulkActionsProps) {
  const [loading, setLoading] = useState(false);

  // Handle bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) return;

    setLoading(true);
    try {
      switch (action) {
        case 'publish':
          await bulkUpdateStatus('PUBLISHED');
          break;
        case 'draft':
          await bulkUpdateStatus('DRAFT');
          break;
        case 'archive':
          await bulkUpdateStatus('ARCHIVED');
          break;
        case 'delete':
          await bulkDelete();
          break;
        case 'export':
          await bulkExport();
          break;
        default:
          console.warn('Unknown bulk action:', action);
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Bulk update status
  const bulkUpdateStatus = async (status: string) => {
    const response = await fetch('/api/products/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productIds: selectedProducts,
        action: 'updateStatus',
        data: { status },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update product status');
    }

    // Clear selection after successful action
    onSelectionChange?.([]);
    
    // Refresh page to show updated data
    window.location.reload();
  };

  // Bulk delete
  const bulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`)) {
      return;
    }

    const response = await fetch('/api/products/bulk', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productIds: selectedProducts,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete products');
    }

    // Clear selection after successful action
    onSelectionChange?.([]);
    
    // Refresh page to show updated data
    window.location.reload();
  };

  // Bulk export
  const bulkExport = async () => {
    const response = await fetch('/api/products/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: { productIds: selectedProducts },
        format: 'csv',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to start export');
    }

    const data = await response.json();
    
    // For now, just show success message
    // In a real app, you'd track the export job and provide download link
    alert(`Export started! Job ID: ${data.data.jobId}`);
  };

  // Don't render if no products are selected
  if (selectedProducts.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
      <div className="flex items-center gap-3">
        <Badge variant="secondary">
          {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
        </Badge>
        <span className="text-sm text-muted-foreground">
          Choose an action to perform on selected products
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Status Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('publish')}
          disabled={loading}
        >
          📢 Publish
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('draft')}
          disabled={loading}
        >
          📝 Draft
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('archive')}
          disabled={loading}
        >
          📦 Archive
        </Button>

        {/* Export Action */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('export')}
          disabled={loading}
        >
          📊 Export
        </Button>

        {/* Delete Action */}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleBulkAction('delete')}
          disabled={loading}
        >
          🗑️ Delete
        </Button>

        {/* Clear Selection */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectionChange?.([])}
          disabled={loading}
        >
          ✕ Clear
        </Button>
      </div>
    </div>
  );
}