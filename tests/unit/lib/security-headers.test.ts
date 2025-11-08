import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { applySecurityProtections } from '../../../proxy';

// Mock next-auth to avoid Next.js context errors
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(() => Promise.resolve(null)),
}));

/**
 * Unit tests for security proxy
 * 
 * Tests verify that all security headers are correctly applied
 * to protect against common web vulnerabilities:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking
 * - MIME-type sniffing
 * - Man-in-the-middle attacks
 * - Information leakage
 * 
 * Note: These tests directly test the applySecurityProtections helper
 * since the main proxy export is wrapped with NextAuth withAuth()
 */

describe('Security Proxy', () => {
  let request: NextRequest;

  beforeEach(() => {
    // Create a mock NextRequest for testing
    request = new NextRequest(new URL('https://example.com/dashboard'));
  });

  // Alias for compatibility with old test expectations
  const middleware = applySecurityProtections;

  describe('Content-Security-Policy (CSP)', () => {
    it('should set Content-Security-Policy header', async () => {
      const response = await middleware(request);

      const cspHeader = response.headers.get('Content-Security-Policy');
      expect(cspHeader).toBeDefined();
      expect(cspHeader).toBeTruthy();
    });

    it('should include default-src directive', async () => {
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy') || '';

      expect(csp).toContain("default-src 'self'");
    });

    it('should allow unsafe-inline and unsafe-eval for scripts (Next.js requirement)', async () => {
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy') || '';

      // Next.js requires these for App Router functionality
      expect(csp).toContain("'unsafe-inline'");
      expect(csp).toContain("'unsafe-eval'");
    });

    it('should allow Vercel services in script-src', async () => {
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy') || '';

      expect(csp).toContain('https://vercel.live');
      expect(csp).toContain('https://va.vercel-scripts.com');
    });

    it('should allow Google Fonts in style-src', async () => {
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy') || '';

      expect(csp).toContain('https://fonts.googleapis.com');
    });

    it('should allow data URIs and HTTPS images in img-src', async () => {
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy') || '';

      expect(csp).toContain('img-src');
      expect(csp).toContain('data:');
      expect(csp).toContain('blob:');
      expect(csp).toContain('https:');
    });

    it('should block all plugins with object-src none', async () => {
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy') || '';

      expect(csp).toContain("object-src 'none'");
    });

    it('should deny all frame ancestors', async () => {
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy') || '';

      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should include upgrade-insecure-requests directive', async () => {
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy') || '';

      expect(csp).toContain('upgrade-insecure-requests');
    });

    it('should restrict form actions to self', async () => {
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy') || '';

      expect(csp).toContain("form-action 'self'");
    });

    it('should restrict base URI to self', async () => {
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy') || '';

      expect(csp).toContain("base-uri 'self'");
    });
  });

  describe('Strict-Transport-Security (HSTS)', () => {
    it('should set Strict-Transport-Security header', async () => {
      const response = await middleware(request);

      const hstsHeader = response.headers.get('Strict-Transport-Security');
      expect(hstsHeader).toBeDefined();
      expect(hstsHeader).toBeTruthy();
    });

    it('should enforce HTTPS for 1 year (31536000 seconds)', async () => {
      const response = await middleware(request);
      const hsts = response.headers.get('Strict-Transport-Security') || '';

      expect(hsts).toContain('max-age=31536000');
    });

    it('should include subdomains in HSTS policy', async () => {
      const response = await middleware(request);
      const hsts = response.headers.get('Strict-Transport-Security') || '';

      expect(hsts).toContain('includeSubDomains');
    });

    it('should be eligible for browser preload lists', async () => {
      const response = await middleware(request);
      const hsts = response.headers.get('Strict-Transport-Security') || '';

      expect(hsts).toContain('preload');
    });
  });

  describe('X-Frame-Options', () => {
    it('should set X-Frame-Options header', async () => {
      const response = await middleware(request);

      const xfoHeader = response.headers.get('X-Frame-Options');
      expect(xfoHeader).toBeDefined();
      expect(xfoHeader).toBeTruthy();
    });

    it('should deny all framing attempts', async () => {
      const response = await middleware(request);
      const xfo = response.headers.get('X-Frame-Options');

      expect(xfo).toBe('DENY');
    });
  });

  describe('X-Content-Type-Options', () => {
    it('should set X-Content-Type-Options header', async () => {
      const response = await middleware(request);

      const xctoHeader = response.headers.get('X-Content-Type-Options');
      expect(xctoHeader).toBeDefined();
      expect(xctoHeader).toBeTruthy();
    });

    it('should prevent MIME-type sniffing', async () => {
      const response = await middleware(request);
      const xcto = response.headers.get('X-Content-Type-Options');

      expect(xcto).toBe('nosniff');
    });
  });

  describe('Referrer-Policy', () => {
    it('should set Referrer-Policy header', async () => {
      const response = await middleware(request);

      const rpHeader = response.headers.get('Referrer-Policy');
      expect(rpHeader).toBeDefined();
      expect(rpHeader).toBeTruthy();
    });

    it('should use strict-origin-when-cross-origin policy', async () => {
      const response = await middleware(request);
      const rp = response.headers.get('Referrer-Policy');

      expect(rp).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Permissions-Policy', () => {
    it('should set Permissions-Policy header', async () => {
      const response = await middleware(request);

      const ppHeader = response.headers.get('Permissions-Policy');
      expect(ppHeader).toBeDefined();
      expect(ppHeader).toBeTruthy();
    });

    it('should disable camera access', async () => {
      const response = await middleware(request);
      const pp = response.headers.get('Permissions-Policy') || '';

      expect(pp).toContain('camera=()');
    });

    it('should disable microphone access', async () => {
      const response = await middleware(request);
      const pp = response.headers.get('Permissions-Policy') || '';

      expect(pp).toContain('microphone=()');
    });

    it('should disable geolocation access', async () => {
      const response = await middleware(request);
      const pp = response.headers.get('Permissions-Policy') || '';

      expect(pp).toContain('geolocation=()');
    });
  });

  describe('X-DNS-Prefetch-Control', () => {
    it('should set X-DNS-Prefetch-Control header', async () => {
      const response = await middleware(request);

      const dnsHeader = response.headers.get('X-DNS-Prefetch-Control');
      expect(dnsHeader).toBeDefined();
      expect(dnsHeader).toBeTruthy();
    });

    it('should enable DNS prefetching', async () => {
      const response = await middleware(request);
      const dns = response.headers.get('X-DNS-Prefetch-Control');

      expect(dns).toBe('on');
    });
  });

  describe('X-Powered-By', () => {
    it('should remove X-Powered-By header', async () => {
      const response = await middleware(request);

      const poweredBy = response.headers.get('X-Powered-By');
      expect(poweredBy).toBeNull();
    });
  });

  describe('Middleware application', () => {
    it('should apply to all routes', async () => {
      const routes = [
        'https://example.com/',
        'https://example.com/dashboard',
        'https://example.com/api/products',
        'https://example.com/login',
      ];

      for (const url of routes) {
        const req = new NextRequest(new URL(url));
        const response = await middleware(req);

        expect(response.headers.get('Content-Security-Policy')).toBeDefined();
        expect(response.headers.get('X-Frame-Options')).toBeDefined();
      }
    });

    it('should return NextResponse with all security headers', async () => {
      const response = await middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
      expect(response.headers.get('Strict-Transport-Security')).toBeTruthy();
      expect(response.headers.get('X-Frame-Options')).toBeTruthy();
      expect(response.headers.get('X-Content-Type-Options')).toBeTruthy();
      expect(response.headers.get('Referrer-Policy')).toBeTruthy();
      expect(response.headers.get('Permissions-Policy')).toBeTruthy();
      expect(response.headers.get('X-DNS-Prefetch-Control')).toBeTruthy();
    });
  });

  describe('Security best practices', () => {
    it('should not leak server information via X-Powered-By', async () => {
      const response = await middleware(request);

      // X-Powered-By should not be present
      expect(response.headers.get('X-Powered-By')).toBeNull();
    });

    it('should enforce HTTPS via HSTS', async () => {
      const response = await middleware(request);
      const hsts = response.headers.get('Strict-Transport-Security') || '';

      // Must have max-age directive
      expect(hsts).toContain('max-age=');

      // Max age should be at least 6 months (15552000 seconds)
      const maxAgeMatch = hsts.match(/max-age=(\d+)/);
      expect(maxAgeMatch).not.toBeNull();

      if (maxAgeMatch) {
        const maxAge = parseInt(maxAgeMatch[1], 10);
        expect(maxAge).toBeGreaterThanOrEqual(15552000); // 6 months minimum
      }
    });

    it('should prevent clickjacking via X-Frame-Options and CSP', async () => {
      const response = await middleware(request);

      // Two layers of clickjacking protection
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');

      const csp = response.headers.get('Content-Security-Policy') || '';
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should prevent XSS via CSP directives', async () => {
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy') || '';

      // CSP should restrict script sources
      expect(csp).toContain('script-src');

      // CSP should restrict object sources (blocks Flash, Java)
      expect(csp).toContain("object-src 'none'");
    });

    it('should prevent MIME sniffing attacks', async () => {
      const response = await middleware(request);

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should limit referrer information leakage', async () => {
      const response = await middleware(request);
      const rp = response.headers.get('Referrer-Policy');

      // Should not use 'unsafe-url' or 'no-referrer-when-downgrade'
      expect(rp).not.toContain('unsafe-url');
      expect(rp).not.toContain('no-referrer-when-downgrade');

      // Should use a safe policy
      expect(rp).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('Next.js compatibility', () => {
    it('should allow Next.js inline scripts', async () => {
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy') || '';

      // Next.js App Router requires unsafe-inline for inline scripts
      expect(csp).toContain("'unsafe-inline'");
    });

    it('should allow Next.js eval for RSC hydration', async () => {
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy') || '';

      // Next.js App Router requires unsafe-eval for React Server Components
      expect(csp).toContain("'unsafe-eval'");
    });

    it('should allow Vercel Analytics scripts', async () => {
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy') || '';

      expect(csp).toContain('https://va.vercel-scripts.com');
    });

    it('should allow blob URLs for Web Workers', async () => {
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy') || '';

      expect(csp).toContain('blob:');
    });
  });
});
