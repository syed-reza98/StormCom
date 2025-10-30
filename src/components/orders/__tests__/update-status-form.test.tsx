// src/components/orders/__tests__/update-status-form.test.tsx
// Unit tests for UpdateOrderStatusForm component

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateOrderStatusForm } from '../update-status-form';

// ============================================================================
// MOCKS
// ============================================================================

// Mock Next.js router
const mockRefresh = vi.fn();
const mockRouter = {
  refresh: mockRefresh,
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, type, variant, disabled, className }: any) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      className={className}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select-wrapper" data-value={value}>
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        data-testid="status-select"
      >
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children, disabled }: any) => (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  ),
  SelectTrigger: ({ children, id }: any) => <div id={id}>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor, className }: any) => (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  ),
}));

// Mock window.alert
global.alert = vi.fn();

// ============================================================================
// TESTS
// ============================================================================

describe('UpdateOrderStatusForm', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // INITIAL RENDER
  // ==========================================================================

  describe('Initial Render', () => {
    it('should render form with current status', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      expect(screen.getByText('Current Status')).toBeInTheDocument();
      expect(screen.getByText('Pending Payment')).toBeInTheDocument();
    });

    it('should show status selector', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      expect(screen.getByTestId('status-select')).toBeInTheDocument();
    });

    it('should show submit button', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      expect(screen.getByRole('button', { name: /Update Status/i })).toBeInTheDocument();
    });

    it('should show admin notes textarea', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      expect(screen.getByLabelText(/Admin Notes/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // TERMINAL STATES
  // ==========================================================================

  describe('Terminal States', () => {
    it('should show terminal state message for CANCELED status', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="CANCELED" />);

      expect(screen.getByText(/terminal state/i)).toBeInTheDocument();
      expect(screen.getByText(/Canceled/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Update Status/i })).not.toBeInTheDocument();
    });

    it('should show terminal state message for REFUNDED status', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="REFUNDED" />);

      expect(screen.getByText(/terminal state/i)).toBeInTheDocument();
      expect(screen.getByText(/Refunded/)).toBeInTheDocument();
    });

    it('should not show form fields in terminal state', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="CANCELED" />);

      expect(screen.queryByLabelText('New Status')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Admin Notes/i)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // VALID STATE TRANSITIONS
  // ==========================================================================

  describe('Valid State Transitions', () => {
    it('should show valid transitions for PENDING status', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      const options = Array.from(select.querySelectorAll('option')).map(opt => opt.value);

      expect(options).toContain('PAID');
      expect(options).toContain('PAYMENT_FAILED');
      expect(options).toContain('CANCELED');
    });

    it('should show valid transitions for PAID status', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PAID" />);

      const select = screen.getByTestId('status-select');
      const options = Array.from(select.querySelectorAll('option')).map(opt => opt.value);

      expect(options).toContain('PROCESSING');
      expect(options).toContain('CANCELED');
      expect(options).toContain('REFUNDED');
    });

    it('should show valid transitions for PROCESSING status', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PROCESSING" />);

      const select = screen.getByTestId('status-select');
      const options = Array.from(select.querySelectorAll('option')).map(opt => opt.value);

      expect(options).toContain('SHIPPED');
      expect(options).toContain('CANCELED');
      expect(options).toContain('REFUNDED');
    });

    it('should show valid transitions for SHIPPED status', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="SHIPPED" />);

      const select = screen.getByTestId('status-select');
      const options = Array.from(select.querySelectorAll('option')).map(opt => opt.value);

      expect(options).toContain('DELIVERED');
      expect(options).toContain('CANCELED');
    });

    it('should show valid transitions for DELIVERED status', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="DELIVERED" />);

      const select = screen.getByTestId('status-select');
      const options = Array.from(select.querySelectorAll('option')).map(opt => opt.value);

      expect(options).toContain('REFUNDED');
    });

    it('should show valid transitions for PAYMENT_FAILED status', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PAYMENT_FAILED" />);

      const select = screen.getByTestId('status-select');
      const options = Array.from(select.querySelectorAll('option')).map(opt => opt.value);

      expect(options).toContain('PAID');
      expect(options).toContain('CANCELED');
    });
  });

  // ==========================================================================
  // TRACKING NUMBER REQUIREMENTS
  // ==========================================================================

  describe('Tracking Number Requirements', () => {
    it('should show tracking number field when SHIPPED is selected', async () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PROCESSING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'SHIPPED' } });

      await waitFor(() => {
        expect(screen.getByLabelText(/Tracking Number/i)).toBeInTheDocument();
      });
    });

    it('should mark tracking number as required for SHIPPED status', async () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PROCESSING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'SHIPPED' } });

      await waitFor(() => {
        const trackingInput = screen.getByLabelText(/Tracking Number/i);
        expect(trackingInput).toHaveAttribute('required');
      });
    });

    it('should show tracking URL field when SHIPPED is selected', async () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PROCESSING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'SHIPPED' } });

      await waitFor(() => {
        expect(screen.getByLabelText(/Tracking URL/i)).toBeInTheDocument();
      });
    });

    it('should not require tracking URL', async () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PROCESSING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'SHIPPED' } });

      await waitFor(() => {
        const trackingUrlInput = screen.getByLabelText(/Tracking URL/i);
        expect(trackingUrlInput).not.toHaveAttribute('required');
      });
    });

    it('should hide tracking fields for non-SHIPPED statuses', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PROCESSING" />);

      expect(screen.queryByLabelText(/Tracking Number/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Tracking URL/i)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // FORM VALIDATION
  // ==========================================================================

  describe('Form Validation', () => {
    it('should disable submit button when status unchanged', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show error when tracking number missing for SHIPPED', async () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PROCESSING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'SHIPPED' } });

      await waitFor(() => {
        const trackingInput = screen.getByLabelText(/Tracking Number/i);
        expect(trackingInput).toBeInTheDocument();
      });

      // Submit form
      const form = screen.getByRole('button', { name: /Update Status/i }).closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText(/Tracking number is required/i)).toBeInTheDocument();
      });
    });

    it('should accept valid tracking number for SHIPPED', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PROCESSING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'SHIPPED' } });

      await waitFor(() => {
        const trackingInput = screen.getByLabelText(/Tracking Number/i);
        fireEvent.change(trackingInput, { target: { value: 'TRACK123' } });
      });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalled();
      });
    });

    it('should enforce maxLength on tracking number', async () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PROCESSING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'SHIPPED' } });

      await waitFor(() => {
        const trackingInput = screen.getByLabelText(/Tracking Number/i);
        expect(trackingInput).toHaveAttribute('maxLength', '100');
      });
    });

    it('should enforce maxLength on tracking URL', async () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PROCESSING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'SHIPPED' } });

      await waitFor(() => {
        const trackingUrlInput = screen.getByLabelText(/Tracking URL/i);
        expect(trackingUrlInput).toHaveAttribute('maxLength', '500');
      });
    });

    it('should enforce maxLength on admin notes', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const notesTextarea = screen.getByLabelText(/Admin Notes/i);
      expect(notesTextarea).toHaveAttribute('maxLength', '1000');
    });

    it('should show character count for admin notes', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      expect(screen.getByText('0/1000 characters')).toBeInTheDocument();
    });

    it('should update character count when typing', async () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const notesTextarea = screen.getByLabelText(/Admin Notes/i);
      fireEvent.change(notesTextarea, { target: { value: 'Test note' } });

      await waitFor(() => {
        expect(screen.getByText('9/1000 characters')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // CRITICAL ACTION CONFIRMATION
  // ==========================================================================

  describe('Critical Action Confirmation', () => {
    it('should show confirmation dialog for CANCELED status', async () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'CANCELED' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Confirm Critical Action/i)).toBeInTheDocument();
      });
    });

    it('should show confirmation dialog for REFUNDED status', async () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PAID" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'REFUNDED' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Confirm Critical Action/i)).toBeInTheDocument();
      });
    });

    it('should show warning message in confirmation dialog', async () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'CANCELED' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/financial implications/i)).toBeInTheDocument();
      });
    });

    it('should show confirm and cancel buttons in dialog', async () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'CANCELED' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Confirm Change/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      });
    });

    it('should cancel confirmation and return to form', async () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'CANCELED' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(screen.queryByText(/Confirm Critical Action/i)).not.toBeInTheDocument();
        expect(screen.getByTestId('status-select')).toBeInTheDocument();
      });
    });

    it('should not show confirmation for non-critical status changes', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'PAID' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalled();
      });

      expect(screen.queryByText(/Confirm Critical Action/i)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // API CALLS
  // ==========================================================================

  describe('API Calls', () => {
    it('should call API with correct endpoint', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      render(<UpdateOrderStatusForm orderId="order-123" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'PAID' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/orders/order-123/status',
          expect.any(Object)
        );
      });
    });

    it('should send correct request body', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'PAID' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'PAID' }),
          })
        );
      });
    });

    it('should include tracking information in request', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PROCESSING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'SHIPPED' } });

      await waitFor(() => {
        const trackingInput = screen.getByLabelText(/Tracking Number/i);
        fireEvent.change(trackingInput, { target: { value: 'TRACK123' } });

        const trackingUrlInput = screen.getByLabelText(/Tracking URL/i);
        fireEvent.change(trackingUrlInput, { target: { value: 'https://track.com' } });
      });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({
              status: 'SHIPPED',
              trackingNumber: 'TRACK123',
              trackingUrl: 'https://track.com',
            }),
          })
        );
      });
    });

    it('should include admin notes in request', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'PAID' } });

      const notesTextarea = screen.getByLabelText(/Admin Notes/i);
      fireEvent.change(notesTextarea, { target: { value: 'Payment received' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({
              status: 'PAID',
              adminNote: 'Payment received',
            }),
          })
        );
      });
    });
  });

  // ==========================================================================
  // SUCCESS HANDLING
  // ==========================================================================

  describe('Success Handling', () => {
    it('should refresh router on success', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'PAID' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should show success alert', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'PAID' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Order status updated to Paid');
      });
    });

    it('should clear error message on success', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'Test error' } }),
      } as Response);

      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      // Trigger error first
      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'PAID' } });
      
      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Now make successful change
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      } as Response);

      fireEvent.change(select, { target: { value: 'PAYMENT_FAILED' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Test error')).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe('Error Handling', () => {
    it('should show error message when API call fails', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { message: 'Invalid status transition' },
        }),
      } as Response);

      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'PAID' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid status transition')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'));

      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'PAID' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should handle unknown errors', async () => {
      fetchSpy.mockRejectedValue('Unknown error');

      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'PAID' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Unknown error occurred')).toBeInTheDocument();
      });
    });

    it('should cancel confirmation on error', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'Server error' } }),
      } as Response);

      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'CANCELED' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /Confirm Change/i });
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.queryByText(/Confirm Critical Action/i)).not.toBeInTheDocument();
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  describe('Loading State', () => {
    it('should show loading text on submit button', async () => {
      fetchSpy.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'PAID' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Updating...')).toBeInTheDocument();
      });
    });

    it('should disable submit button while loading', async () => {
      fetchSpy.mockImplementation(() => new Promise(() => {}));

      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'PAID' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should disable buttons in confirmation dialog while loading', async () => {
      fetchSpy.mockImplementation(() => new Promise(() => {}));

      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'CANCELED' } });

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /Confirm Change/i });
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /Updating\.\.\./i });
        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        
        expect(confirmButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
      });
    });
  });

  // ==========================================================================
  // SUBMIT BUTTON STATE
  // ==========================================================================

  describe('Submit Button State', () => {
    it('should disable submit button when status unchanged', () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const submitButton = screen.getByRole('button', { name: /Update Status/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when status changed', async () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'PAID' } });

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Update Status/i });
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show confirmation hint for critical status changes', async () => {
      render(<UpdateOrderStatusForm orderId="order-1" currentStatus="PENDING" />);

      const select = screen.getByTestId('status-select');
      fireEvent.change(select, { target: { value: 'CANCELED' } });

      await waitFor(() => {
        expect(screen.getByText(/Requires Confirmation/i)).toBeInTheDocument();
      });
    });
  });
});
