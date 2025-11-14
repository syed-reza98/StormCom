/**
 * Lighthouse CI Configuration - Mobile
 * 
 * Performance Budgets (from constitution):
 * - LCP (Largest Contentful Paint): < 2.5s (mobile)
 * - FID (First Input Delay): < 100ms
 * - CLS (Cumulative Layout Shift): < 0.1
 * - TTI (Time to Interactive): < 3.0s
 * - JavaScript Bundle: < 200KB (gzipped)
 * 
 * Run locally: npm run lighthouse:mobile
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
      ],
      
      // Lighthouse settings for mobile
      numberOfRuns: 3,                              // Run 3 times and average
      settings: {
        preset: 'mobile',                           // Mobile emulation
        throttling: {
          rttMs: 150,                               // 4G network
          throughputKbps: 1638,
          cpuSlowdownMultiplier: 4,                 // Mobile CPU
        },
        screenEmulation: {
          mobile: true,
          width: 360,
          height: 640,
          deviceScaleFactor: 2,
        },
      },
    },
    
    assert: {
      // Performance budgets (mobile is more strict)
      assertions: {
        // Core Web Vitals (CRITICAL)
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],  // 2.5s mobile
        'max-potential-fid': ['error', { maxNumericValue: 100 }],          // 100ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],    // 0.1
        'interactive': ['error', { maxNumericValue: 3000 }],               // 3.0s TTI
        
        // Additional metrics (relaxed for mobile)
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],     // 2.0s
        'speed-index': ['warn', { maxNumericValue: 4000 }],                // 4.0s
        'total-blocking-time': ['warn', { maxNumericValue: 500 }],         // 500ms
        
        // JavaScript budgets (same as desktop)
        'total-byte-weight': ['warn', { maxNumericValue: 512000 }],        // 500KB total
        'bootup-time': ['warn', { maxNumericValue: 3000 }],                // 3s JS execution
        
        // Performance score (minimum 85 for mobile)
        'categories:performance': ['error', { minScore: 0.85 }],
        
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
    },
  },
};
