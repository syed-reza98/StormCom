// tests/unit/components/gdpr/cookie-consent.test.tsx
// Unit tests for Cookie Consent Banner Component

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CookieConsentBanner } from '@/components/gdpr/cookie-consent';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = vi.fn();

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Banner Visibility', () => {
    it('should show banner if no consent is stored', async () => {
      render(<CookieConsentBanner />);
      
      // Fast-forward past the delay
      vi.advanceTimersByTime(600);

      await waitFor(() => {
        expect(screen.getByText(/we use cookies/i)).toBeInTheDocument();
      });
    });

    it('should not show banner if consent already stored', () => {
      localStorageMock.setItem('stormcom_cookie_consent', JSON.stringify({
        essential: true,
        analytics: true,
        marketing: false,
        preferences: true,
        timestamp: new Date().toISOString(),
      }));

      render(<CookieConsentBanner />);
      
      vi.advanceTimersByTime(600);

      expect(screen.queryByText(/we use cookies/i)).not.toBeInTheDocument();
    });
  });

  describe('Accept All', () => {
    it('should accept all cookies when "Accept All" is clicked', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<CookieConsentBanner />);
      
      vi.advanceTimersByTime(600);

      await waitFor(() => {
        expect(screen.getByText(/we use cookies/i)).toBeInTheDocument();
      });

      const acceptButton = screen.getByRole('button', { name: /accept all/i });
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(4); // 4 consent types
      });

      // Verify all consent types were sent
      expect(global.fetch).toHaveBeenCalledWith('/api/gdpr/consent', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('ESSENTIAL'),
      }));
      expect(global.fetch).toHaveBeenCalledWith('/api/gdpr/consent', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('ANALYTICS'),
      }));
      expect(global.fetch).toHaveBeenCalledWith('/api/gdpr/consent', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('MARKETING'),
      }));
      expect(global.fetch).toHaveBeenCalledWith('/api/gdpr/consent', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('PREFERENCES'),
      }));
    });

    it('should save consent to localStorage', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<CookieConsentBanner />);
      
      vi.advanceTimersByTime(600);

      await waitFor(() => {
        const acceptButton = screen.getByRole('button', { name: /accept all/i });
        fireEvent.click(acceptButton);
      });

      await waitFor(() => {
        const stored = localStorageMock.getItem('stormcom_cookie_consent');
        expect(stored).toBeTruthy();
        
        const parsed = JSON.parse(stored!);
        expect(parsed.essential).toBe(true);
        expect(parsed.analytics).toBe(true);
        expect(parsed.marketing).toBe(true);
        expect(parsed.preferences).toBe(true);
        expect(parsed.timestamp).toBeTruthy();
      });
    });

    it('should hide banner after accepting', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<CookieConsentBanner />);
      
      vi.advanceTimersByTime(600);

      await waitFor(() => {
        const acceptButton = screen.getByRole('button', { name: /accept all/i });
        fireEvent.click(acceptButton);
      });

      await waitFor(() => {
        expect(screen.queryByText(/we use cookies/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Reject All', () => {
    it('should reject all non-essential cookies', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<CookieConsentBanner />);
      
      vi.advanceTimersByTime(600);

      await waitFor(() => {
        const rejectButton = screen.getByRole('button', { name: /reject all/i });
        fireEvent.click(rejectButton);
      });

      await waitFor(() => {
        const stored = localStorageMock.getItem('stormcom_cookie_consent');
        const parsed = JSON.parse(stored!);
        
        expect(parsed.essential).toBe(true); // Always true
        expect(parsed.analytics).toBe(false);
        expect(parsed.marketing).toBe(false);
        expect(parsed.preferences).toBe(false);
      });
    });
  });

  describe('Customize Settings', () => {
    it('should show detailed settings when "Customize Settings" is clicked', async () => {
      render(<CookieConsentBanner />);
      
      vi.advanceTimersByTime(600);

      await waitFor(() => {
        const customizeButton = screen.getByRole('button', { name: /customize settings/i });
        fireEvent.click(customizeButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/essential cookies \(required\)/i)).toBeInTheDocument();
        expect(screen.getByText(/analytics cookies/i)).toBeInTheDocument();
        expect(screen.getByText(/marketing cookies/i)).toBeInTheDocument();
        expect(screen.getByText(/preference cookies/i)).toBeInTheDocument();
      });
    });

    it('should toggle individual cookie preferences', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<CookieConsentBanner />);
      
      vi.advanceTimersByTime(600);

      // Open customize settings
      await waitFor(() => {
        const customizeButton = screen.getByRole('button', { name: /customize settings/i });
        fireEvent.click(customizeButton);
      });

      // Find switches (excluding essential which is disabled)
      const switches = screen.getAllByRole('switch');
      const analyticsSwitch = switches[1]; // Essential is [0]
      const marketingSwitch = switches[2];

      // Toggle analytics on
      fireEvent.click(analyticsSwitch);

      // Toggle marketing on
      fireEvent.click(marketingSwitch);

      // Save preferences
      const saveButton = screen.getByRole('button', { name: /save preferences/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        const stored = localStorageMock.getItem('stormcom_cookie_consent');
        const parsed = JSON.parse(stored!);
        
        expect(parsed.essential).toBe(true);
        expect(parsed.analytics).toBe(true);
        expect(parsed.marketing).toBe(true);
        expect(parsed.preferences).toBe(false);
      });
    });

    it('should not allow disabling essential cookies', async () => {
      render(<CookieConsentBanner />);
      
      vi.advanceTimersByTime(600);

      // Open customize settings
      await waitFor(() => {
        const customizeButton = screen.getByRole('button', { name: /customize settings/i });
        fireEvent.click(customizeButton);
      });

      // Essential switch should be disabled
      const switches = screen.getAllByRole('switch');
      const essentialSwitch = switches[0];
      
      expect(essentialSwitch).toBeDisabled();
      expect(essentialSwitch).toBeChecked();
    });
  });

  describe('Loading States', () => {
    it('should show loading state while saving', async () => {
      (global.fetch as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true }),
        }), 100))
      );

      render(<CookieConsentBanner />);
      
      vi.advanceTimersByTime(600);

      await waitFor(() => {
        const acceptButton = screen.getByRole('button', { name: /accept all/i });
        fireEvent.click(acceptButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument();
      });
    });

    it('should disable buttons while loading', async () => {
      (global.fetch as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true }),
        }), 100))
      );

      render(<CookieConsentBanner />);
      
      vi.advanceTimersByTime(600);

      await waitFor(() => {
        const acceptButton = screen.getByRole('button', { name: /accept all/i });
        fireEvent.click(acceptButton);
      });

      // Buttons should be disabled during save
      const customizeButton = screen.getByRole('button', { name: /customize settings/i });
      expect(customizeButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      render(<CookieConsentBanner />);
      
      vi.advanceTimersByTime(600);

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby', 'cookie-consent-title');
      });
    });

    it('should have labels for switches', async () => {
      render(<CookieConsentBanner />);
      
      vi.advanceTimersByTime(600);

      // Open customize settings
      await waitFor(() => {
        const customizeButton = screen.getByRole('button', { name: /customize settings/i });
        fireEvent.click(customizeButton);
      });

      // Check aria-labels exist
      expect(screen.getByLabelText(/essential cookies \(required\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/analytics cookies/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/marketing cookies/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/preference cookies/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(<CookieConsentBanner />);
      
      vi.advanceTimersByTime(600);

      await waitFor(() => {
        const acceptButton = screen.getByRole('button', { name: /accept all/i });
        fireEvent.click(acceptButton);
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
