// tests/unit/components/audit-logs/audit-logs-table.test.tsx
// Unit tests for AuditLogsTable component

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuditLogsTable } from '@/components/audit-logs/audit-logs-table';

// Mock fetch
global.fetch = vi.fn();

describe('AuditLogsTable', () => {
  const mockAuditLog = {
    id: 'log-1',
    storeId: 'store-123',
    userId: 'user-123',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    action: 'UPDATE' as const,
    entityType: 'Product',
    entityId: 'product-456',
    changes: {
      name: { old: 'Old Name', new: 'New Name' },
      price: { old: 19.99, new: 24.99 },
    },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    createdAt: '2024-01-15T10:30:00Z',
  };

  const mockPagination = {
    page: 1,
    limit: 50,
    total: 100,
    totalPages: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ============================================================================
  // LOADING STATE TESTS
  // ============================================================================

  it('should show loading skeletons while fetching data', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0);
  });

  // ============================================================================
  // DATA FETCHING TESTS
  // ============================================================================

  it('should fetch audit logs on mount', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          logs: [mockAuditLog],
          ...mockPagination,
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/audit-logs?')
      );
    });
  });

  it('should include storeId in request for non-SUPER_ADMIN', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          logs: [],
          ...mockPagination,
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="STORE_ADMIN"
        storeId="store-123"
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('storeId=store-123')
      );
    });
  });

  it('should include all searchParams in request', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          logs: [],
          ...mockPagination,
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{
          page: '2',
          userId: 'user-123',
          entityType: 'Product',
          action: 'UPDATE',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        }}
        userRole="SUPER_ADMIN"
      />
    );

    await waitFor(() => {
      const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callUrl).toContain('page=2');
      expect(callUrl).toContain('userId=user-123');
      expect(callUrl).toContain('entityType=Product');
      expect(callUrl).toContain('action=UPDATE');
      expect(callUrl).toContain('startDate=2024-01-01');
      expect(callUrl).toContain('endDate=2024-01-31');
    });
  });

  // ============================================================================
  // DATA DISPLAY TESTS
  // ============================================================================

  it('should display audit log data correctly', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          logs: [mockAuditLog],
          ...mockPagination,
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Product')).toBeInTheDocument();
      expect(screen.getByText('product-456')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
      expect(screen.getByText('Update')).toBeInTheDocument(); // Badge label
    });
  });

  it('should display user ID when userName and userEmail are not available', async () => {
    const logWithoutUser = { ...mockAuditLog, userName: undefined, userEmail: undefined };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          logs: [logWithoutUser],
          ...mockPagination,
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('user-123')).toBeInTheDocument();
    });
  });

  it('should display N/A when ipAddress is missing', async () => {
    const logWithoutIp = { ...mockAuditLog, ipAddress: undefined };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          logs: [logWithoutIp],
          ...mockPagination,
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ACTION BADGE TESTS
  // ============================================================================

  it('should display correct badge variants for actions', async () => {
    const createLog = { ...mockAuditLog, id: 'log-create', action: 'CREATE' as const };
    const updateLog = { ...mockAuditLog, id: 'log-update', action: 'UPDATE' as const };
    const deleteLog = { ...mockAuditLog, id: 'log-delete', action: 'DELETE' as const };
    const loginLog = { ...mockAuditLog, id: 'log-login', action: 'LOGIN' as const };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          logs: [createLog, updateLog, deleteLog, loginLog],
          ...mockPagination,
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('Update')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ROW EXPANSION TESTS
  // ============================================================================

  it('should expand row when chevron button clicked', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          logs: [mockAuditLog],
          ...mockPagination,
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Product')).toBeInTheDocument();
    });

    // Changes should not be visible initially
    expect(screen.queryByText('Old Name')).not.toBeInTheDocument();

    // Click expand button
    const expandButton = screen.getByLabelText(/expand row/i);
    fireEvent.click(expandButton);

    // Changes should now be visible
    await waitFor(() => {
      expect(screen.getByText('Old Name')).toBeInTheDocument();
      expect(screen.getByText('New Name')).toBeInTheDocument();
      expect(screen.getByText('"Old Name"')).toBeInTheDocument();
      expect(screen.getByText('"New Name"')).toBeInTheDocument();
    });
  });

  it('should collapse row when chevron button clicked again', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          logs: [mockAuditLog],
          ...mockPagination,
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Product')).toBeInTheDocument();
    });

    // Expand row
    const expandButton = screen.getByLabelText(/expand row/i);
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText('Old Name')).toBeInTheDocument();
    });

    // Collapse row
    const collapseButton = screen.getByLabelText(/collapse row/i);
    fireEvent.click(collapseButton);

    await waitFor(() => {
      expect(screen.queryByText('Old Name')).not.toBeInTheDocument();
    });
  });

  it('should display changes diff with old and new values', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          logs: [mockAuditLog],
          ...mockPagination,
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Product')).toBeInTheDocument();
    });

    // Expand row
    const expandButton = screen.getByLabelText(/expand row/i);
    fireEvent.click(expandButton);

    await waitFor(() => {
      // Check field names
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('price')).toBeInTheDocument();

      // Check old/new labels
      expect(screen.getAllByText(/old value/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/new value/i).length).toBeGreaterThan(0);

      // Check actual values
      expect(screen.getByText('"Old Name"')).toBeInTheDocument();
      expect(screen.getByText('"New Name"')).toBeInTheDocument();
      expect(screen.getByText('19.99')).toBeInTheDocument();
      expect(screen.getByText('24.99')).toBeInTheDocument();
    });
  });

  it('should display "No changes recorded" when changes are empty', async () => {
    const logWithoutChanges = { ...mockAuditLog, changes: undefined };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          logs: [logWithoutChanges],
          ...mockPagination,
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Product')).toBeInTheDocument();
    });

    // Expand row
    const expandButton = screen.getByLabelText(/expand row/i);
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText(/no changes recorded/i)).toBeInTheDocument();
    });
  });

  it('should display user agent when expanded', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          logs: [mockAuditLog],
          ...mockPagination,
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Product')).toBeInTheDocument();
    });

    // Expand row
    const expandButton = screen.getByLabelText(/expand row/i);
    fireEvent.click(expandButton);

    await waitFor(() => {
      expect(screen.getByText(/user agent/i)).toBeInTheDocument();
      expect(screen.getByText('Mozilla/5.0...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ERROR STATE TESTS
  // ============================================================================

  it('should display error message when fetch fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: {
          message: 'Failed to fetch audit logs',
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading audit logs/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to fetch audit logs/i)).toBeInTheDocument();
    });
  });

  it('should provide retry button on error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: {
          message: 'Network error',
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // EMPTY STATE TESTS
  // ============================================================================

  it('should display empty state when no logs found', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          logs: [],
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/no audit logs found/i)).toBeInTheDocument();
      expect(screen.getByText(/try adjusting your filters/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // PAGINATION TESTS
  // ============================================================================

  it('should display pagination when totalPages > 1', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          logs: [mockAuditLog],
          page: 1,
          limit: 50,
          total: 100,
          totalPages: 2,
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/showing 1 to 50 of 100 logs/i)).toBeInTheDocument();
    });
  });

  it('should not display pagination when totalPages <= 1', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          logs: [mockAuditLog],
          page: 1,
          limit: 50,
          total: 10,
          totalPages: 1,
        },
      }),
    });

    render(
      <AuditLogsTable
        searchParams={{}}
        userRole="SUPER_ADMIN"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/showing.*logs/i)).not.toBeInTheDocument();
    });
  });
});
