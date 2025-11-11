// src/components/orders/__tests__/orders-table.test.tsx
// Unit tests for OrdersTable component

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { OrdersTable } from '../orders-table';

// ============================================================================
// MOCKS
// ============================================================================

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size} className={className}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-variant={variant}>{children}</span>
  ),
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

vi.mock('@/components/ui/pagination', () => ({
  Pagination: ({ currentPage, totalPages }: any) => (
    <div data-testid="pagination" data-current-page={currentPage} data-total-pages={totalPages}>
      Pagination
    </div>
  ),
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockOrders = [
  {
    id: 'order-1',
    orderNumber: 'ORD-001',
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
    },
    status: 'PENDING' as const,
    paymentStatus: 'PENDING' as const,
    totalAmount: 150.00,
    itemsCount: 2,
    createdAt: '2025-10-01T10:00:00.000Z',
    updatedAt: '2025-10-01T10:00:00.000Z',
  },
  {
    id: 'order-2',
    orderNumber: 'ORD-002',
    customer: {
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    status: 'SHIPPED' as const,
    paymentStatus: 'PAID' as const,
    totalAmount: 299.99,
    itemsCount: 5,
    createdAt: '2025-10-02T14:30:00.000Z',
    updatedAt: '2025-10-02T14:30:00.000Z',
  },
];

const mockPagination = {
  page: 1,
  perPage: 10,
  total: 2,
  totalPages: 1,
};

const mockApiResponse = {
  success: true,
  data: mockOrders,
  meta: mockPagination,
};

// ============================================================================
// TESTS
// ============================================================================

describe('OrdersTable', () => {
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  describe('Loading State', () => {
    it('should show loading skeletons initially', () => {
      fetchSpy.mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      render(<OrdersTable searchParams={{}} />);

      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons).toHaveLength(5);
    });
  });

  // ==========================================================================
  // DATA RENDERING
  // ==========================================================================

  describe('Data Rendering', () => {
    beforeEach(() => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);
    });

    it('should render orders table with data', async () => {
      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
      });

      expect(screen.getByText('ORD-002')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should render customer information correctly', async () => {
      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
      });

      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('should render order status badges', async () => {
      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        // First order has PENDING status, second has SHIPPED
        const badges = screen.getAllByText('Pending'); // May include payment status
        expect(badges.length).toBeGreaterThan(0);
      });

      expect(screen.getByText('Shipped')).toBeInTheDocument();
    });

    it('should render payment status badges', async () => {
      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        // Check for payment status badge
        expect(screen.getByText('Paid')).toBeInTheDocument();
      });

      // "Pending" appears for both order status and payment status
      const pendingBadges = screen.getAllByText('Pending');
      expect(pendingBadges.length).toBe(2); // One for order status, one for payment
    });

    it('should render formatted total amounts', async () => {
      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        expect(screen.getByText('$150.00')).toBeInTheDocument();
      });

      expect(screen.getByText('$299.99')).toBeInTheDocument();
    });

    it('should render items count', async () => {
      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(within(table).getByText('2')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      expect(within(table).getByText('5')).toBeInTheDocument();
    });

    it('should render formatted dates', async () => {
      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        // Check that dates are rendered (exact format depends on locale)
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBeGreaterThan(1); // Header + data rows
      });
    });

    it('should render view details links for each order', async () => {
      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View Details');
        expect(viewButtons).toHaveLength(2);
      });
    });

    it('should create correct links to order detail pages', async () => {
      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        const orderLink = screen.getByText('ORD-001').closest('a');
        expect(orderLink).toHaveAttribute('href', '/orders/order-1');
      });

      const orderLink2 = screen.getByText('ORD-002').closest('a');
      expect(orderLink2).toHaveAttribute('href', '/orders/order-2');
    });
  });

  // ==========================================================================
  // PAGINATION
  // ==========================================================================

  describe('Pagination', () => {
    it('should show pagination when totalPages > 1', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockApiResponse,
          meta: { ...mockPagination, totalPages: 3 },
        }),
      } as Response);

      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
      });
    });

    it('should hide pagination when totalPages = 1', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
      });
    });

    it('should show results summary', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        expect(screen.getByText(/Showing 1 to 2 of 2 orders/i)).toBeInTheDocument();
      });
    });

    it('should calculate results summary correctly for page 2', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockApiResponse,
          meta: { page: 2, perPage: 10, total: 25, totalPages: 3 },
        }),
      } as Response);

      render(<OrdersTable searchParams={{ page: '2' }} />);

      await waitFor(() => {
        expect(screen.getByText(/Showing 11 to 20 of 25 orders/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // EMPTY STATE
  // ==========================================================================

  describe('Empty State', () => {
    it('should show empty state when no orders', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
          meta: { page: 1, perPage: 10, total: 0, totalPages: 0 },
        }),
      } as Response);

      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        expect(screen.getByText('No orders found')).toBeInTheDocument();
      });

      expect(screen.getByText(/Orders will appear here once customers place them/i)).toBeInTheDocument();
    });

    it('should show filter message in empty state when filters applied', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [],
          meta: { page: 1, perPage: 10, total: 0, totalPages: 0 },
        }),
      } as Response);

      render(<OrdersTable searchParams={{ search: 'test', status: 'SHIPPED' }} />);

      await waitFor(() => {
        expect(screen.getByText('No orders found')).toBeInTheDocument();
      });

      expect(screen.getByText(/Try adjusting your filters/i)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe('Error Handling', () => {
    it('should show error message when fetch fails', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { message: 'Failed to fetch orders' },
        }),
      } as Response);

      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        expect(screen.getByText('Error loading orders')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to fetch orders')).toBeInTheDocument();
    });

    it('should show retry button on error', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { message: 'Network error' },
        }),
      } as Response);

      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'));

      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        expect(screen.getByText('Error loading orders')).toBeInTheDocument();
      });

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should handle unknown errors', async () => {
      fetchSpy.mockRejectedValue('Unknown error');

      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        expect(screen.getByText('Error loading orders')).toBeInTheDocument();
      });

      expect(screen.getByText('Unknown error occurred')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // API REQUEST PARAMETERS
  // ==========================================================================

  describe('API Request Parameters', () => {
    beforeEach(() => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);
    });

    it('should send default parameters', async () => {
      render(<OrdersTable searchParams={{}} />);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalled();
      });

      const callUrl = (fetchSpy.mock.calls[0][0] as string);
      expect(callUrl).toContain('/api/orders?');
      expect(callUrl).toContain('page=1');
      expect(callUrl).toContain('perPage=10');
      expect(callUrl).toContain('sortBy=createdAt');
      expect(callUrl).toContain('sortOrder=desc');
    });

    it('should include search parameter when provided', async () => {
      render(<OrdersTable searchParams={{ search: 'John' }} />);

      await waitFor(() => {
        const callUrl = (fetchSpy.mock.calls[0][0] as string);
        expect(callUrl).toContain('search=John');
      });
    });

    it('should include status filter when provided', async () => {
      render(<OrdersTable searchParams={{ status: 'SHIPPED' }} />);

      await waitFor(() => {
        const callUrl = (fetchSpy.mock.calls[0][0] as string);
        expect(callUrl).toContain('status=SHIPPED');
      });
    });

    it('should include date filters when provided', async () => {
      render(<OrdersTable searchParams={{ dateFrom: '2025-10-01', dateTo: '2025-10-31' }} />);

      await waitFor(() => {
        const callUrl = (fetchSpy.mock.calls[0][0] as string);
        expect(callUrl).toContain('dateFrom=2025-10-01');
        expect(callUrl).toContain('dateTo=2025-10-31');
      });
    });

    it('should include custom sorting parameters', async () => {
      render(<OrdersTable searchParams={{ sortBy: 'totalAmount', sortOrder: 'asc' }} />);

      await waitFor(() => {
        const callUrl = (fetchSpy.mock.calls[0][0] as string);
        expect(callUrl).toContain('sortBy=totalAmount');
        expect(callUrl).toContain('sortOrder=asc');
      });
    });

    it('should include page parameter', async () => {
      render(<OrdersTable searchParams={{ page: '3' }} />);

      await waitFor(() => {
        const callUrl = (fetchSpy.mock.calls[0][0] as string);
        expect(callUrl).toContain('page=3');
      });
    });
  });

  // ==========================================================================
  // STATUS BADGES
  // ==========================================================================

  describe('Status Badges', () => {
    it('should render all order status types correctly', async () => {
      const orderStatuses = [
        { status: 'PENDING', label: 'Pending', paymentStatus: 'PAID' }, // Use different payment status
        { status: 'PAID', label: 'Paid', paymentStatus: 'PENDING' },
        { status: 'PROCESSING', label: 'Processing', paymentStatus: 'PAID' },
        { status: 'SHIPPED', label: 'Shipped', paymentStatus: 'PAID' },
        { status: 'DELIVERED', label: 'Delivered', paymentStatus: 'PAID' },
        { status: 'CANCELED', label: 'Canceled', paymentStatus: 'PENDING' },
        { status: 'REFUNDED', label: 'Refunded', paymentStatus: 'REFUNDED' },
        { status: 'PAYMENT_FAILED', label: 'Payment Failed', paymentStatus: 'FAILED' },
      ];

      for (const { status, label, paymentStatus } of orderStatuses) {
        fetchSpy.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              ...mockOrders[0],
              status,
              paymentStatus,
            }],
            meta: { ...mockPagination, total: 1 },
          }),
        } as Response);

        const { unmount } = render(<OrdersTable searchParams={{}} />);

        await waitFor(() => {
          // Use getAllByText for labels that might appear in multiple places
          const badges = screen.queryAllByText(label);
          expect(badges.length).toBeGreaterThan(0);
        });

        unmount();
        vi.clearAllMocks();
      }
    });

    it('should render all payment status types correctly', async () => {
      const paymentStatuses = [
        { status: 'PENDING', label: 'Pending', orderStatus: 'PROCESSING' }, // Use different order status
        { status: 'PAID', label: 'Paid', orderStatus: 'PROCESSING' },
        { status: 'FAILED', label: 'Failed', orderStatus: 'PAYMENT_FAILED' },
        { status: 'REFUNDED', label: 'Refunded', orderStatus: 'REFUNDED' },
      ];

      for (const { status, label, orderStatus } of paymentStatuses) {
        fetchSpy.mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              ...mockOrders[0],
              status: orderStatus,
              paymentStatus: status,
            }],
            meta: { ...mockPagination, total: 1 },
          }),
        } as Response);

        const { unmount } = render(<OrdersTable searchParams={{}} />);

        await waitFor(() => {
          // Use getAllByText for labels that might appear in multiple places
          const badges = screen.queryAllByText(label);
          expect(badges.length).toBeGreaterThan(0);
        });

        unmount();
        vi.clearAllMocks();
      }
    });
  });

  // ==========================================================================
  // RE-FETCHING ON SEARCH PARAMS CHANGE
  // ==========================================================================

  describe('Re-fetching', () => {
    it('should re-fetch data when searchParams change', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const { rerender } = render(<OrdersTable searchParams={{ page: '1' }} />);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      rerender(<OrdersTable searchParams={{ page: '2' }} />);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      });
    });
  });
});
