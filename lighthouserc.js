/**
 * Lighthouse CI Configuration
 * 
 * Performance Budgets (from constitution):
 * - LCP (Largest Contentful Paint): < 2.5s (mobile), < 2.0s (desktop)
 * - FID (First Input Delay): < 100ms
 * - CLS (Cumulative Layout Shift): < 0.1
 * - TTI (Time to Interactive): < 3.0s
 * - JavaScript Bundle: < 200KB (gzipped)
 * 
 * Run locally: npm run lighthouse
 * CI: Runs automatically on PR to main
 */

module.exports = {
  ci: {
    collect: {
      // URLs to test
      url: [
        'http://localhost:3000',                    // Homepage
        'http://localhost:3000/products',            // Product list
        'http://localhost:3000/checkout',            // Checkout page
        'http://localhost:3000/dashboard',           // Dashboard (authenticated)
        'http://localhost:3000/dashboard/products',  // Product management
      ],
      
      // Lighthouse settings
      numberOfRuns: 3,                              // Run 3 times and average
      settings: {
        preset: 'desktop',                          // Test desktop first
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    
    assert: {
      // Performance budgets
      assertions: {
        // Core Web Vitals (CRITICAL)
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],  // 2.0s desktop
        'max-potential-fid': ['error', { maxNumericValue: 100 }],          // 100ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],    // 0.1
        'interactive': ['error', { maxNumericValue: 3000 }],               // 3.0s TTI
        
        // Additional metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 1500 }],     // 1.5s
        'speed-index': ['warn', { maxNumericValue: 3000 }],                // 3.0s
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],         // 300ms
        
        // JavaScript budgets
        'total-byte-weight': ['warn', { maxNumericValue: 512000 }],        // 500KB total
        'bootup-time': ['warn', { maxNumericValue: 2000 }],                // 2s JS execution
        
        // Performance score (minimum 90)
        'categories:performance': ['error', { minScore: 0.9 }],
        
        // Accessibility score (WCAG 2.1 AA requirement)
        'categories:accessibility': ['error', { minScore: 0.9 }],
        
        // Best practices
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        
        // SEO
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    
    upload: {
      target: 'temporary-public-storage',           // Free storage for CI
      // Alternative: target: 'lhci', serverBaseUrl: 'https://your-lhci-server.com'
    },
  },
};
