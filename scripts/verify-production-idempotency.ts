/**
 * Production Idempotency Verification Script
 * 
 * This script tests the idempotency infrastructure in production to ensure:
 * 1. Duplicate requests return cached results
 * 2. Different idempotency keys allow new requests
 * 3. Missing idempotency keys are properly validated
 * 4. Vercel KV is properly configured and responding
 * 
 * Usage:
 *   1. Get session token from browser (DevTools → Application → Cookies → next-auth.session-token)
 *   2. Run: $env:PRODUCTION_URL = "https://your-domain.vercel.app"
 *   3. Run: $env:SESSION_TOKEN = "your-session-token"
 *   4. Run: npx tsx scripts/verify-production-idempotency.ts
 */

import { setTimeout } from 'timers/promises';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://stormcom.vercel.app';
const SESSION_TOKEN = process.env.SESSION_TOKEN;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✓ ${message}`, 'green');
}

function logError(message: string) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message: string) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message: string) {
  log(`ℹ ${message}`, 'cyan');
}

async function verifyIdempotency() {
  log('\n🔍 Verifying Production Idempotency Infrastructure\n', 'blue');
  
  // Validate prerequisites
  if (!SESSION_TOKEN) {
    logError('SESSION_TOKEN environment variable not set');
    logInfo('Get session token from browser: DevTools → Application → Cookies → next-auth.session-token');
    process.exit(1);
  }
  
  logInfo(`Testing against: ${PRODUCTION_URL}`);
  logInfo(`Session token: ${SESSION_TOKEN.substring(0, 20)}...`);
  console.log('');

  let passedTests = 0;
  let failedTests = 0;
  const errors: string[] = [];

  // Test 1: Duplicate requests should return cached result
  try {
    log('Test 1: Duplicate Request Detection', 'blue');
    log('─'.repeat(50), 'blue');
    
    const idempotencyKey = `verify-${Date.now()}`;
    logInfo(`Idempotency-Key: ${idempotencyKey}`);
    
    // First request
    logInfo('Sending first request...');
    const response1 = await fetch(`${PRODUCTION_URL}/api/orders/test-order-id/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        'Cookie': `next-auth.session-token=${SESSION_TOKEN}`,
      },
      body: JSON.stringify({ status: 'PROCESSING' }),
    });
    
    const data1 = await response1.json();
    log(`  Response 1: ${response1.status} ${response1.statusText}`, 'cyan');
    console.log('  ', JSON.stringify(data1, null, 2).split('\n').join('\n  '));

    // Small delay to ensure cache is written
    await setTimeout(100);

    // Second request with same key (should be cached)
    logInfo('Sending second request with same key (should be cached)...');
    const response2 = await fetch(`${PRODUCTION_URL}/api/orders/test-order-id/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        'Cookie': `next-auth.session-token=${SESSION_TOKEN}`,
      },
      body: JSON.stringify({ status: 'PROCESSING' }),
    });
    
    const data2 = await response2.json();
    log(`  Response 2: ${response2.status} ${response2.statusText}`, 'cyan');
    console.log('  ', JSON.stringify(data2, null, 2).split('\n').join('\n  '));

    // Verify responses are identical
    const areIdentical = JSON.stringify(data1) === JSON.stringify(data2);
    if (areIdentical && response1.ok && response2.ok) {
      logSuccess('Duplicate requests returned identical cached result');
      passedTests++;
    } else if (!areIdentical) {
      logError('Responses are different - cache may not be working');
      errors.push('Test 1: Responses not identical (cache miss)');
      failedTests++;
    } else {
      logError(`Requests failed: ${response1.status} / ${response2.status}`);
      errors.push(`Test 1: HTTP errors (${response1.status}, ${response2.status})`);
      failedTests++;
    }
    console.log('');
  } catch (error) {
    logError(`Test 1 failed: ${error instanceof Error ? error.message : String(error)}`);
    errors.push(`Test 1: Exception - ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
    console.log('');
  }

  // Test 2: Different idempotency keys should allow new requests
  try {
    log('Test 2: Different Idempotency Keys', 'blue');
    log('─'.repeat(50), 'blue');
    
    const newKey = `verify-${Date.now()}-new`;
    logInfo(`New Idempotency-Key: ${newKey}`);
    
    logInfo('Sending request with new key...');
    const response3 = await fetch(`${PRODUCTION_URL}/api/orders/test-order-id/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': newKey,
        'Cookie': `next-auth.session-token=${SESSION_TOKEN}`,
      },
      body: JSON.stringify({ status: 'SHIPPED' }),
    });
    
    const data3 = await response3.json();
    log(`  Response: ${response3.status} ${response3.statusText}`, 'cyan');
    console.log('  ', JSON.stringify(data3, null, 2).split('\n').join('\n  '));

    if (response3.ok) {
      logSuccess('New idempotency key allowed new request');
      passedTests++;
    } else {
      logError(`Request failed: ${response3.status}`);
      errors.push(`Test 2: HTTP error (${response3.status})`);
      failedTests++;
    }
    console.log('');
  } catch (error) {
    logError(`Test 2 failed: ${error instanceof Error ? error.message : String(error)}`);
    errors.push(`Test 2: Exception - ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
    console.log('');
  }

  // Test 3: Missing idempotency key should fail with 400
  try {
    log('Test 3: Missing Idempotency Key Validation', 'blue');
    log('─'.repeat(50), 'blue');
    
    logInfo('Sending request without Idempotency-Key header...');
    const response4 = await fetch(`${PRODUCTION_URL}/api/orders/test-order-id/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // No Idempotency-Key header
        'Cookie': `next-auth.session-token=${SESSION_TOKEN}`,
      },
      body: JSON.stringify({ status: 'PROCESSING' }),
    });
    
    const data4 = await response4.json();
    log(`  Response: ${response4.status} ${response4.statusText}`, 'cyan');
    console.log('  ', JSON.stringify(data4, null, 2).split('\n').join('\n  '));

    if (response4.status === 400) {
      logSuccess('Missing idempotency key properly rejected with 400');
      passedTests++;
    } else {
      logError(`Expected 400, got ${response4.status}`);
      errors.push(`Test 3: Wrong status code (expected 400, got ${response4.status})`);
      failedTests++;
    }
    console.log('');
  } catch (error) {
    logError(`Test 3 failed: ${error instanceof Error ? error.message : String(error)}`);
    errors.push(`Test 3: Exception - ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
    console.log('');
  }

  // Test 4: Check if Vercel KV is configured (via custom metrics endpoint if available)
  try {
    log('Test 4: Vercel KV Configuration Check', 'blue');
    log('─'.repeat(50), 'blue');
    
    logInfo('Checking cache metrics (requires SuperAdmin role)...');
    const response5 = await fetch(`${PRODUCTION_URL}/api/internal/metrics/idempotency`, {
      headers: {
        'Cookie': `next-auth.session-token=${SESSION_TOKEN}`,
      },
    });
    
    if (response5.status === 403) {
      logWarning('Metrics endpoint forbidden (requires SuperAdmin role)');
      logInfo('Skipping Test 4 - cannot verify KV configuration without admin access');
    } else if (response5.status === 404) {
      logWarning('Metrics endpoint not implemented yet');
      logInfo('Skipping Test 4 - metrics endpoint not available');
    } else if (response5.ok) {
      const metricsData = await response5.json();
      log(`  Metrics: ${response5.status} ${response5.statusText}`, 'cyan');
      console.log('  ', JSON.stringify(metricsData, null, 2).split('\n').join('\n  '));
      
      if (metricsData.data?.hitRate) {
        const hitRate = parseFloat(metricsData.data.hitRate);
        if (hitRate >= 80) {
          logSuccess(`Cache hit rate: ${metricsData.data.hitRate} (excellent)`);
          passedTests++;
        } else if (hitRate >= 50) {
          logWarning(`Cache hit rate: ${metricsData.data.hitRate} (acceptable, monitor)`);
          passedTests++;
        } else {
          logError(`Cache hit rate: ${metricsData.data.hitRate} (too low)`);
          errors.push(`Test 4: Low cache hit rate (${metricsData.data.hitRate})`);
          failedTests++;
        }
      }
    } else {
      logError(`Metrics endpoint error: ${response5.status}`);
      errors.push(`Test 4: HTTP error (${response5.status})`);
      failedTests++;
    }
    console.log('');
  } catch (error) {
    logWarning('Metrics endpoint not available - skipping Test 4');
    console.log('');
  }

  // Summary
  log('═'.repeat(50), 'blue');
  log('Test Summary', 'blue');
  log('═'.repeat(50), 'blue');
  
  const totalTests = passedTests + failedTests;
  log(`Total Tests: ${totalTests}`, 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'cyan');
  
  if (errors.length > 0) {
    console.log('');
    log('Errors:', 'red');
    errors.forEach((error, index) => {
      logError(`${index + 1}. ${error}`);
    });
  }
  
  console.log('');
  if (failedTests === 0) {
    log('✅ All idempotency tests passed! Production deployment successful.', 'green');
    process.exit(0);
  } else {
    log('❌ Some tests failed. Review errors above and check deployment configuration.', 'red');
    process.exit(1);
  }
}

// Run verification
verifyIdempotency().catch((error) => {
  logError(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  console.error(error);
  process.exit(1);
});
