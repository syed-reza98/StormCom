// src/components/orders/update-status-form.tsx
// Update Order Status Form Component - Validates state transitions and updates order status

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type OrderStatus = 
  | 'PENDING' 
  | 'PAID' 
  | 'PROCESSING' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELED' 
  | 'REFUNDED' 
  | 'PAYMENT_FAILED';

interface UpdateOrderStatusFormProps {
  orderId: string;
  currentStatus: OrderStatus;
}

// ============================================================================
// STATE MACHINE - VALID TRANSITIONS
// ============================================================================

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELED'],
  PAID: ['PROCESSING', 'CANCELED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'CANCELED'],
  DELIVERED: ['REFUNDED'],
  CANCELED: [], // Terminal state
  REFUNDED: [], // Terminal state
  PAYMENT_FAILED: ['PAID', 'CANCELED'], // Retry payment or cancel
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending Payment',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELED: 'Canceled',
  REFUNDED: 'Refunded',
  PAYMENT_FAILED: 'Payment Failed',
};

const CRITICAL_STATUSES: OrderStatus[] = ['CANCELED', 'REFUNDED'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UpdateOrderStatusForm({ orderId, currentStatus }: UpdateOrderStatusFormProps) {
  const router = useRouter();
  
  // Form state
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [adminNote, setAdminNote] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Get valid next statuses
  const validNextStatuses = VALID_TRANSITIONS[currentStatus];
  const isTerminalState = validNextStatuses.length === 0;

  // Check if status requires tracking number
  const requiresTracking = status === 'SHIPPED';

  // Check if status change is critical (needs confirmation)
  const isCriticalChange = CRITICAL_STATUSES.includes(status) && status !== currentStatus;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If status hasn't changed, do nothing
    if (status === currentStatus) {
      setError('No changes to save');
      return;
    }

    // Validate tracking number for SHIPPED status
    if (requiresTracking && !trackingNumber.trim()) {
      setError('Tracking number is required when marking order as Shipped');
      return;
    }

    // Show confirmation for critical actions
    if (isCriticalChange && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    // Proceed with status update
    await updateOrderStatus();
  };

  const updateOrderStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          ...(trackingNumber && { trackingNumber }),
          ...(trackingUrl && { trackingUrl }),
          ...(adminNote && { adminNote }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update order status');
      }

      // Success - refresh the page to show updated data
      router.refresh();
      
      // Reset form state
      setShowConfirmation(false);
      setError(null);
      
      // Show success message (could use a toast notification here)
      alert(`Order status updated to ${STATUS_LABELS[status]}`);
      
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const cancelConfirmation = () => {
    setShowConfirmation(false);
    setError(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  // Terminal state message
  if (isTerminalState) {
    return (
      <div className="text-center p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          This order is in a terminal state ({STATUS_LABELS[currentStatus]}) and cannot be changed.
        </p>
      </div>
    );
  }

  // Confirmation dialog
  if (showConfirmation) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <h3 className="font-semibold text-destructive mb-2">⚠️ Confirm Critical Action</h3>
          <p className="text-sm">
            You are about to change the order status to <strong>{STATUS_LABELS[status]}</strong>. 
            This action may have financial implications and cannot be easily reversed.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={updateOrderStatus}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Updating...' : 'Confirm Change'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={cancelConfirmation}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Current Status */}
      <div>
        <Label className="text-xs text-muted-foreground">Current Status</Label>
        <p className="font-medium">{STATUS_LABELS[currentStatus]}</p>
      </div>

      {/* New Status Selector */}
      <div className="space-y-2">
        <Label htmlFor="status">New Status</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select new status" />
          </SelectTrigger>
          <SelectContent>
            {/* Current status (disabled) */}
            <SelectItem value={currentStatus} disabled>
              {STATUS_LABELS[currentStatus]} (current)
            </SelectItem>
            
            {/* Valid next statuses */}
            {validNextStatuses.map((nextStatus) => (
              <SelectItem key={nextStatus} value={nextStatus}>
                {STATUS_LABELS[nextStatus]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Only valid state transitions are shown
        </p>
      </div>

      {/* Tracking Number (required for SHIPPED) */}
      {status === 'SHIPPED' && (
        <div className="space-y-2">
          <Label htmlFor="trackingNumber">
            Tracking Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="trackingNumber"
            type="text"
            placeholder="Enter tracking number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            maxLength={100}
            required={requiresTracking}
            className={requiresTracking && !trackingNumber ? 'border-destructive' : ''}
          />
        </div>
      )}

      {/* Tracking URL (optional for SHIPPED) */}
      {status === 'SHIPPED' && (
        <div className="space-y-2">
          <Label htmlFor="trackingUrl">Tracking URL (Optional)</Label>
          <Input
            id="trackingUrl"
            type="url"
            placeholder="https://..."
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            maxLength={500}
          />
        </div>
      )}

      {/* Admin Notes */}
      <div className="space-y-2">
        <Label htmlFor="adminNote">Admin Notes (Optional)</Label>
        <Textarea
          id="adminNote"
          placeholder="Add notes about this status change..."
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          maxLength={1000}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          {adminNote.length}/1000 characters
        </p>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading || status === currentStatus}
        className="w-full"
      >
        {loading ? 'Updating...' : isCriticalChange ? 'Update Status (Requires Confirmation)' : 'Update Status'}
      </Button>
    </form>
  );
}
