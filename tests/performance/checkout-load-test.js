/**
 * k6 Load Test: Checkout Flow
 * 
 * Performance Requirements (from constitution):
 * - API Response Time (p95): < 500ms
 * - Checkout Flow (p95): ≤ 650ms (including payment validation)
 * - Concurrent Users: 50 VUs (Virtual Users)
 * - Duration: 30s ramp-up, 1m sustained, 30s ramp-down
 * 
 * Run: k6 run tests/performance/checkout-load-test.js
 * Run with cloud: k6 cloud tests/performance/checkout-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const checkoutErrors = new Rate('checkout_errors');
const checkoutDuration = new Trend('checkout_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp-up to 10 VUs
    { duration: '30s', target: 50 },  // Ramp-up to 50 VUs
    { duration: '1m', target: 50 },   // Sustained load at 50 VUs
    { duration: '30s', target: 0 },   // Ramp-down to 0 VUs
  ],
  thresholds: {
    // API response time p95 < 500ms (general)
    'http_req_duration{endpoint:validate}': ['p(95)<500'],
    'http_req_duration{endpoint:shipping}': ['p(95)<500'],
    
    // Checkout completion p95 ≤ 650ms (including payment)
    'http_req_duration{endpoint:complete}': ['p(95)<650'],
    
    // Error rate < 1%
    'checkout_errors': ['rate<0.01'],
    
    // Success rate > 99%
    'checks': ['rate>0.99'],
    
    // HTTP failures < 1%
    'http_req_failed': ['rate<0.01'],
  },
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const STORE_ID = __ENV.STORE_ID || 'test-store-id';

// Sample test data
const testProducts = [
  { productId: 'prod_1', variantId: 'var_1', quantity: 2 },
  { productId: 'prod_2', variantId: 'var_2', quantity: 1 },
];

const testAddress = {
  firstName: 'Load',
  lastName: 'Test',
  addressLine1: '123 Test St',
  city: 'Test City',
  state: 'TS',
  postalCode: '12345',
  country: 'US',
  phone: '+1234567890',
  email: 'loadtest@example.com',
};

/**
 * Main test scenario: Complete checkout flow
 */
export default function () {
  const startTime = Date.now();
  
  // Step 1: Validate cart (cart validation endpoint)
  const validatePayload = JSON.stringify({
    items: testProducts,
    shippingAddress: testAddress,
  });
  
  const validateRes = http.post(
    `${BASE_URL}/api/checkout/validate`,
    validatePayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=test-session-${__VU}-${__ITER}`,
      },
      tags: { endpoint: 'validate' },
    }
  );
  
  check(validateRes, {
    'validate: status 200': (r) => r.status === 200,
    'validate: has cart total': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && typeof body.data.total === 'number';
      } catch {
        return false;
      }
    },
  }) || checkoutErrors.add(1);
  
  sleep(0.5);
  
  // Step 2: Calculate shipping (shipping estimation endpoint)
  const shippingPayload = JSON.stringify({
    items: testProducts,
    address: testAddress,
  });
  
  const shippingRes = http.post(
    `${BASE_URL}/api/checkout/shipping`,
    shippingPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=test-session-${__VU}-${__ITER}`,
      },
      tags: { endpoint: 'shipping' },
    }
  );
  
  check(shippingRes, {
    'shipping: status 200': (r) => r.status === 200,
    'shipping: has options': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data) && body.data.length > 0;
      } catch {
        return false;
      }
    },
  }) || checkoutErrors.add(1);
  
  sleep(0.5);
  
  // Step 3: Create payment intent (pre-validation)
  const paymentIntentPayload = JSON.stringify({
    amount: 5000, // $50.00
    currency: 'usd',
  });
  
  const paymentIntentRes = http.post(
    `${BASE_URL}/api/checkout/payment-intent`,
    paymentIntentPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=test-session-${__VU}-${__ITER}`,
      },
      tags: { endpoint: 'payment-intent' },
    }
  );
  
  check(paymentIntentRes, {
    'payment-intent: status 200': (r) => r.status === 200,
    'payment-intent: has client secret': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && typeof body.data.clientSecret === 'string';
      } catch {
        return false;
      }
    },
  }) || checkoutErrors.add(1);
  
  sleep(1);
  
  // Step 4: Complete checkout (CRITICAL PATH - includes payment validation)
  const completePayload = JSON.stringify({
    items: testProducts,
    shippingAddress: testAddress,
    billingAddress: testAddress,
    shippingMethodId: 'standard',
    paymentMethodId: 'pm_test_card',
    paymentIntentId: 'pi_test_intent',
  });
  
  const completeRes = http.post(
    `${BASE_URL}/api/checkout/complete`,
    completePayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=test-session-${__VU}-${__ITER}`,
      },
      tags: { endpoint: 'complete' },
    }
  );
  
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  const completeSuccess = check(completeRes, {
    'complete: status 200 or 201': (r) => r.status === 200 || r.status === 201,
    'complete: has order ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && typeof body.data.orderId === 'string';
      } catch {
        return false;
      }
    },
    'complete: response time < 650ms': (r) => r.timings.duration < 650,
  });
  
  if (!completeSuccess) {
    checkoutErrors.add(1);
  }
  
  checkoutDuration.add(totalDuration);
  
  sleep(2);
}

/**
 * Setup function: runs once before the test
 */
export function setup() {
  console.log(`Starting k6 load test against ${BASE_URL}`);
  console.log(`Store ID: ${STORE_ID}`);
  console.log(`Target: 50 concurrent users, 2 minutes duration`);
  
  return {
    baseUrl: BASE_URL,
    storeId: STORE_ID,
  };
}

/**
 * Teardown function: runs once after the test
 */
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Base URL: ${data.baseUrl}`);
}
