// tests/unit/components/audit-logs/audit-logs-filters.test.tsx
// Unit tests for AuditLogsFilters component

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuditLogsFilters } from '@/components/audit-logs/audit-logs-filters';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe('AuditLogsFilters', () => {
  const mockPush = vi.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(mockSearchParams);
  });

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  it('should render all filter inputs', () => {
    render(
      <AuditLogsFilters
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    expect(screen.getByLabelText(/user id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/entity type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/entity id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/action/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it('should populate inputs with searchParams values', () => {
    render(
      <AuditLogsFilters
        searchParams={{
          userId: 'user-123',
          entityType: 'Product',
          entityId: 'product-456',
          action: 'UPDATE',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        }}
        userRole="SUPER_ADMIN"
      />
    );

    expect(screen.getByLabelText(/user id/i)).toHaveValue('user-123');
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByLabelText(/entity id/i)).toHaveValue('product-456');
    expect(screen.getByText('UPDATE')).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toHaveValue('2024-01-01');
    expect(screen.getByLabelText(/end date/i)).toHaveValue('2024-01-31');
  });

  it('should show reset button only when filters are active', () => {
    const { rerender } = render(
      <AuditLogsFilters
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    expect(screen.queryByText(/reset filters/i)).not.toBeInTheDocument();

    rerender(
      <AuditLogsFilters
        searchParams={{ userId: 'user-123' }}
        userRole="SUPER_ADMIN"
      />
    );

    expect(screen.getByText(/reset filters/i)).toBeInTheDocument();
  });

  // ============================================================================
  // FILTER APPLICATION TESTS
  // ============================================================================

  it('should apply userId filter', async () => {
    render(
      <AuditLogsFilters
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    const userIdInput = screen.getByLabelText(/user id/i);
    fireEvent.change(userIdInput, { target: { value: 'user-123' } });

    const applyButton = screen.getByText(/apply filters/i);
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('userId=user-123')
      );
    });
  });

  it('should apply entityType filter', async () => {
    render(
      <AuditLogsFilters
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    // Open entity type select
    const entityTypeSelect = screen.getByLabelText(/entity type/i);
    fireEvent.click(entityTypeSelect);

    // Select Product
    const productOption = screen.getByText('Product');
    fireEvent.click(productOption);

    const applyButton = screen.getByText(/apply filters/i);
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('entityType=Product')
      );
    });
  });

  it('should apply action filter', async () => {
    render(
      <AuditLogsFilters
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    // Open action select
    const actionSelect = screen.getByLabelText(/action/i);
    fireEvent.click(actionSelect);

    // Select UPDATE
    const updateOption = screen.getByText('UPDATE');
    fireEvent.click(updateOption);

    const applyButton = screen.getByText(/apply filters/i);
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('action=UPDATE')
      );
    });
  });

  it('should apply date range filters', async () => {
    render(
      <AuditLogsFilters
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);

    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });

    const applyButton = screen.getByText(/apply filters/i);
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/startDate=2024-01-01.*endDate=2024-01-31/)
      );
    });
  });

  it('should apply multiple filters together', async () => {
    render(
      <AuditLogsFilters
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    const userIdInput = screen.getByLabelText(/user id/i);
    const entityIdInput = screen.getByLabelText(/entity id/i);

    fireEvent.change(userIdInput, { target: { value: 'user-123' } });
    fireEvent.change(entityIdInput, { target: { value: 'product-456' } });

    const applyButton = screen.getByText(/apply filters/i);
    fireEvent.click(applyButton);

    await waitFor(() => {
      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).toContain('userId=user-123');
      expect(callArg).toContain('entityId=product-456');
    });
  });

  it('should reset page to 1 when applying filters', async () => {
    mockSearchParams.set('page', '3');

    render(
      <AuditLogsFilters
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    const userIdInput = screen.getByLabelText(/user id/i);
    fireEvent.change(userIdInput, { target: { value: 'user-123' } });

    const applyButton = screen.getByText(/apply filters/i);
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('page=1')
      );
    });
  });

  // ============================================================================
  // RESET FILTERS TESTS
  // ============================================================================

  it('should reset all filters when reset button clicked', async () => {
    render(
      <AuditLogsFilters
        searchParams={{
          userId: 'user-123',
          entityType: 'Product',
          action: 'UPDATE',
        }}
        userRole="SUPER_ADMIN"
      />
    );

    const resetButton = screen.getByText(/reset filters/i);
    fireEvent.click(resetButton);

    await waitFor(() => {
      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).not.toContain('userId');
      expect(callArg).not.toContain('entityType');
      expect(callArg).not.toContain('action');
      expect(callArg).toContain('page=1');
    });
  });

  // ============================================================================
  // MULTI-TENANT TESTS
  // ============================================================================

  it('should include storeId for non-SUPER_ADMIN users', async () => {
    render(
      <AuditLogsFilters
        searchParams={{}}
        userRole="STORE_ADMIN"
        storeId="store-123"
      />
    );

    const applyButton = screen.getByText(/apply filters/i);
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('storeId=store-123')
      );
    });
  });

  it('should preserve storeId when resetting filters for non-SUPER_ADMIN', async () => {
    render(
      <AuditLogsFilters
        searchParams={{ userId: 'user-123' }}
        userRole="STORE_ADMIN"
        storeId="store-123"
      />
    );

    const resetButton = screen.getByText(/reset filters/i);
    fireEvent.click(resetButton);

    await waitFor(() => {
      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).toContain('storeId=store-123');
      expect(callArg).not.toContain('userId');
    });
  });

  it('should not include storeId for SUPER_ADMIN users', async () => {
    render(
      <AuditLogsFilters
        searchParams={{}}
        userRole="SUPER_ADMIN"
        storeId="store-123"
      />
    );

    const applyButton = screen.getByText(/apply filters/i);
    fireEvent.click(applyButton);

    await waitFor(() => {
      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).not.toContain('storeId=store-123');
    });
  });

  // ============================================================================
  // INPUT TRIMMING TESTS
  // ============================================================================

  it('should trim whitespace from text inputs', async () => {
    render(
      <AuditLogsFilters
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    const userIdInput = screen.getByLabelText(/user id/i);
    fireEvent.change(userIdInput, { target: { value: '  user-123  ' } });

    const applyButton = screen.getByText(/apply filters/i);
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('userId=user-123')
      );
    });
  });

  it('should not include empty filters in URL', async () => {
    render(
      <AuditLogsFilters
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    const userIdInput = screen.getByLabelText(/user id/i);
    fireEvent.change(userIdInput, { target: { value: '   ' } }); // Only whitespace

    const applyButton = screen.getByText(/apply filters/i);
    fireEvent.click(applyButton);

    await waitFor(() => {
      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).not.toContain('userId');
    });
  });
});
