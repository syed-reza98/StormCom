/**
 * k6 Load Test: Orders CSV Export (Streaming)
 * 
 * Performance Requirements (from constitution + spec):
 * - Small export (≤10k rows): < 5s for streaming response
 * - Large export (>10k rows): async job enqueued < 500ms
 * - API Response Time (p95): < 500ms (for job enqueue)
 * - Concurrent Users: 20 VUs (export is resource-intensive)
 * - Duration: 20s ramp-up, 40s sustained, 20s ramp-down
 * 
 * Run: k6 run tests/performance/orders-export-load-test.js
 * Run with cloud: k6 cloud tests/performance/orders-export-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const exportErrors = new Rate('export_errors');
const streamExportDuration = new Trend('stream_export_duration');
const asyncExportEnqueueDuration = new Trend('async_export_enqueue_duration');
const csvRowsReceived = new Counter('csv_rows_received');

export const options = {
  stages: [
    { duration: '20s', target: 5 },   // Ramp-up to 5 VUs
    { duration: '20s', target: 20 },  // Ramp-up to 20 VUs
    { duration: '40s', target: 20 },  // Sustained load at 20 VUs
    { duration: '20s', target: 0 },   // Ramp-down to 0 VUs
  ],
  thresholds: {
    // Streaming export (≤10k rows) < 5s
    'http_req_duration{export_type:stream}': ['p(95)<5000'],
    
    // Async job enqueue < 500ms
    'http_req_duration{export_type:async}': ['p(95)<500'],
    
    // Error rate < 2% (exports can be resource-intensive)
    'export_errors': ['rate<0.02'],
    
    // Success rate > 98%
    'checks': ['rate>0.98'],
    
    // HTTP failures < 2%
    'http_req_failed': ['rate<0.02'],
  },
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const STORE_ID = __ENV.STORE_ID || 'test-store-id';

/**
 * Scenario 1: Small export (streaming) - 70% of requests
 */
export function smallExport() {
  const startTime = Date.now();
  
  // Request streaming export (≤10k rows)
  const params = new URLSearchParams({
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    status: 'completed',
    limit: '5000', // Small export
  });
  
  const res = http.get(
    `${BASE_URL}/api/orders/export?${params.toString()}`,
    {
      headers: {
        'Cookie': `next-auth.session-token=test-session-${__VU}-${__ITER}`,
      },
      tags: { export_type: 'stream' },
    }
  );
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const success = check(res, {
    'stream: status 200': (r) => r.status === 200,
    'stream: Content-Type is CSV': (r) => r.headers['Content-Type']?.includes('text/csv'),
    'stream: has Content-Disposition': (r) => !!r.headers['Content-Disposition'],
    'stream: response time < 5s': (r) => r.timings.duration < 5000,
    'stream: has CSV content': (r) => {
      const body = r.body || '';
      // Check for CSV header row
      return body.includes('Order ID') || body.includes('orderId') || body.length > 0;
    },
  });
  
  if (!success) {
    exportErrors.add(1);
  }
  
  // Count approximate rows (newlines)
  if (res.status === 200 && res.body) {
    const rows = (res.body.match(/\n/g) || []).length;
    csvRowsReceived.add(rows);
  }
  
  streamExportDuration.add(duration);
  
  sleep(5);
}

/**
 * Scenario 2: Large export (async job) - 30% of requests
 */
export function largeExport() {
  const startTime = Date.now();
  
  // Request async export (>10k rows)
  const params = new URLSearchParams({
    startDate: '2023-01-01',
    endDate: '2024-12-31',
    status: 'all',
    limit: '50000', // Large export - triggers async
  });
  
  const res = http.get(
    `${BASE_URL}/api/orders/export?${params.toString()}`,
    {
      headers: {
        'Cookie': `next-auth.session-token=test-session-${__VU}-${__ITER}`,
      },
      tags: { export_type: 'async' },
    }
  );
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const success = check(res, {
    'async: status 202 (Accepted)': (r) => r.status === 202,
    'async: response time < 500ms': (r) => r.timings.duration < 500,
    'async: has job ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && typeof body.data.jobId === 'string';
      } catch {
        return false;
      }
    },
    'async: has message': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.message && body.message.includes('background');
      } catch {
        return false;
      }
    },
  });
  
  if (!success) {
    exportErrors.add(1);
  }
  
  asyncExportEnqueueDuration.add(duration);
  
  sleep(3);
}

/**
 * Main test scenario: Mixed export workload
 */
export default function () {
  // 70% small exports, 30% large exports
  const rand = Math.random();
  
  if (rand < 0.7) {
    smallExport();
  } else {
    largeExport();
  }
}

/**
 * Setup function: runs once before the test
 */
export function setup() {
  console.log(`Starting k6 orders export load test against ${BASE_URL}`);
  console.log(`Store ID: ${STORE_ID}`);
  console.log(`Target: 20 concurrent users, 1.5 minutes duration`);
  console.log(`Mix: 70% streaming exports, 30% async jobs`);
  
  return {
    baseUrl: BASE_URL,
    storeId: STORE_ID,
  };
}

/**
 * Teardown function: runs once after the test
 */
export function teardown(data) {
  console.log('Orders export load test completed');
  console.log(`Base URL: ${data.baseUrl}`);
}
