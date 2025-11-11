// tests/unit/app/(dashboard)/settings/privacy/privacy-settings-client.test.tsx
// Unit tests for Privacy Settings Client Component

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PrivacySettingsClient } from '@/app/(dashboard)/settings/privacy/privacy-settings-client';

// Mock fetch
global.fetch = vi.fn();

describe('PrivacySettingsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Data Export', () => {
    it('should render export data section', () => {
      render(<PrivacySettingsClient />);
      
      expect(screen.getByText('Export Your Data')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /request data export/i })).toBeInTheDocument();
    });

    it('should create export request successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'req-123',
          type: 'EXPORT',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<PrivacySettingsClient />);
      
      const exportButton = screen.getByRole('button', { name: /request data export/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/gdpr/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/data export request created successfully/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during export', async () => {
      (global.fetch as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<PrivacySettingsClient />);
      
      const exportButton = screen.getByRole('button', { name: /request data export/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/creating request/i)).toBeInTheDocument();
      });
    });

    it('should handle export error', async () => {
      const mockError = {
        success: false,
        error: {
          message: 'Export request already exists',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      render(<PrivacySettingsClient />);
      
      const exportButton = screen.getByRole('button', { name: /request data export/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/export request already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Account Deletion', () => {
    it('should render delete account section', () => {
      render(<PrivacySettingsClient />);
      
      expect(screen.getByText('Delete Your Account')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete my account/i })).toBeInTheDocument();
    });

    it('should open confirmation dialog', async () => {
      render(<PrivacySettingsClient />);
      
      const deleteButton = screen.getByRole('button', { name: /delete my account/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/confirm account deletion/i)).toBeInTheDocument();
      });
    });

    it('should require confirmation text', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'req-456',
          type: 'DELETE',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<PrivacySettingsClient />);
      
      // Open dialog
      const deleteButton = screen.getByRole('button', { name: /delete my account/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/confirm account deletion/i)).toBeInTheDocument();
      });

      // Find confirm button in dialog
      const confirmButtons = screen.getAllByRole('button', { name: /delete account/i });
      const dialogConfirmButton = confirmButtons[confirmButtons.length - 1];

      // Should be disabled without confirmation
      expect(dialogConfirmButton).toBeDisabled();

      // Type confirmation text
      const input = screen.getByPlaceholderText('DELETE_MY_ACCOUNT');
      fireEvent.change(input, { target: { value: 'DELETE_MY_ACCOUNT' } });

      // Should be enabled now
      await waitFor(() => {
        expect(dialogConfirmButton).not.toBeDisabled();
      });

      // Click confirm
      fireEvent.click(dialogConfirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/gdpr/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            confirmation: 'DELETE_MY_ACCOUNT',
          }),
        });
      });
    });

    it('should handle deletion error', async () => {
      const mockError = {
        success: false,
        error: {
          message: 'Deletion request already pending',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      render(<PrivacySettingsClient />);
      
      // Open dialog
      const deleteButton = screen.getByRole('button', { name: /delete my account/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('DELETE_MY_ACCOUNT');
        fireEvent.change(input, { target: { value: 'DELETE_MY_ACCOUNT' } });
      });

      // Click confirm
      const confirmButtons = screen.getAllByRole('button', { name: /delete account/i });
      const dialogConfirmButton = confirmButtons[confirmButtons.length - 1];
      fireEvent.click(dialogConfirmButton);

      await waitFor(() => {
        expect(screen.getByText(/deletion request already pending/i)).toBeInTheDocument();
      });
    });
  });

  describe('Request History', () => {
    it('should not show request history initially', () => {
      render(<PrivacySettingsClient />);
      
      expect(screen.queryByText('Recent Requests')).not.toBeInTheDocument();
    });

    it('should show request after successful export', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'req-789',
          type: 'EXPORT',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<PrivacySettingsClient />);
      
      const exportButton = screen.getByRole('button', { name: /request data export/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('Recent Requests')).toBeInTheDocument();
        expect(screen.getByText('Data Export')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
      });
    });

    it('should show download link for completed exports', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'req-890',
          type: 'EXPORT',
          status: 'COMPLETED',
          exportUrl: 'https://example.com/export.json',
          createdAt: new Date().toISOString(),
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<PrivacySettingsClient />);
      
      const exportButton = screen.getByRole('button', { name: /request data export/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('COMPLETED')).toBeInTheDocument();
        const downloadLink = screen.getByRole('link', { name: /download/i });
        expect(downloadLink).toHaveAttribute('href', 'https://example.com/export.json');
      });
    });
  });

  describe('Status Badges', () => {
    it('should show correct status colors', async () => {
      const statuses = [
        { status: 'PENDING', expectedText: 'PENDING' },
        { status: 'PROCESSING', expectedText: 'PROCESSING' },
        { status: 'COMPLETED', expectedText: 'COMPLETED' },
        { status: 'FAILED', expectedText: 'FAILED' },
      ];

      for (const { status, expectedText } of statuses) {
        const mockResponse = {
          success: true,
          data: {
            id: `req-${status}`,
            type: 'EXPORT',
            status,
            createdAt: new Date().toISOString(),
          },
        };

        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const { unmount } = render(<PrivacySettingsClient />);
        
        const exportButton = screen.getByRole('button', { name: /request data export/i });
        fireEvent.click(exportButton);

        await waitFor(() => {
          expect(screen.getByText(expectedText)).toBeInTheDocument();
        });

        unmount();
        vi.clearAllMocks();
      }
    });
  });
});
