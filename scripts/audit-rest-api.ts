/**
 * REST API Audit Script (T042)
 * 
 * Scans all API routes for REST violations:
 * - PUT without idempotency handling
 * - PATCH used for full replacement (should be PUT)
 * - Stray `success: true` flags (use standardized responses)
 * - Missing OPTIONS handlers for CORS
 * 
 * Output: JSON report with violations per route
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

interface Violation {
  type: 'PUT_NO_IDEMPOTENCY' | 'PATCH_FULL_REPLACEMENT' | 'SUCCESS_FLAG' | 'MISSING_OPTIONS';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  line: number;
  message: string;
  code: string;
}

interface RouteAuditResult {
  file: string;
  violations: Violation[];
  methods: string[];
}

const API_DIR = join(process.cwd(), 'src', 'app', 'api');
const OUTPUT_FILE = join(process.cwd(), 'specs', '002-harden-checkout-tenancy', 'artifacts', 'rest-audit-report.json');

const VIOLATION_PATTERNS = {
  SUCCESS_FLAG: /success\s*:\s*true/gi,
  IDEMPOTENCY_KEY: /idempotency[-_]?key/gi,
  NEXTRESPONSE_JSON: /NextResponse\.json/g,
};

function findFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  
  function walk(currentPath: string) {
    const entries = readdirSync(currentPath);
    
    for (const entry of entries) {
      const fullPath = join(currentPath, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (pattern.test(entry)) {
        results.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return results;
}

function auditRoute(filePath: string): RouteAuditResult {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations: Violation[] = [];
  const methods: string[] = [];

  // Detect exported HTTP methods
  const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS)\s*\(/g;
  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    methods.push(match[1]);
  }

  // Check for missing OPTIONS (if other methods exist)
  if (methods.length > 0 && !methods.includes('OPTIONS')) {
    violations.push({
      type: 'MISSING_OPTIONS',
      severity: 'LOW',
      line: 1,
      message: 'Missing OPTIONS handler for CORS (optional but recommended for public APIs)',
      code: 'export async function OPTIONS() { ... }',
    });
  }

  // Scan each line
  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for `success: true` flags
    if (VIOLATION_PATTERNS.SUCCESS_FLAG.test(line)) {
      violations.push({
        type: 'SUCCESS_FLAG',
        severity: 'MEDIUM',
        line: lineNumber,
        message: 'Use standardized response format ({ data, error, meta }) instead of success flag',
        code: line.trim(),
      });
    }
  });

  // Check PUT without idempotency handling
  if (methods.includes('PUT')) {
    const hasIdempotencyKey = VIOLATION_PATTERNS.IDEMPOTENCY_KEY.test(content);
    
    if (!hasIdempotencyKey) {
      // Find PUT function line
      const putMatch = /export\s+async\s+function\s+PUT\s*\(/g.exec(content);
      const putLine = putMatch ? content.substring(0, putMatch.index).split('\n').length : 1;
      
      violations.push({
        type: 'PUT_NO_IDEMPOTENCY',
        severity: 'HIGH',
        line: putLine,
        message: 'PUT method should handle idempotency (check request headers or body for idempotency key)',
        code: 'const idempotencyKey = request.headers.get("idempotency-key");',
      });
    }
  }

  // Check PATCH for full replacement patterns
  if (methods.includes('PATCH')) {
    // Heuristic: if PATCH reads entire body without checking specific fields, might be full replacement
    const patchBodyPattern = /const\s+body\s*=\s*await\s+request\.json\(\)/;
    const patchValidationPattern = /schema\.parse\(body\)/; // Full body validation suggests full replacement
    
    if (patchBodyPattern.test(content) && patchValidationPattern.test(content)) {
      // Additional check: look for partial validation patterns
      const hasPartialPattern = /partial\(\)/i.test(content) || /pick\(/i.test(content) || /omit\(/i.test(content);
      
      if (!hasPartialPattern) {
        const patchMatch = /export\s+async\s+function\s+PATCH\s*\(/g.exec(content);
        const patchLine = patchMatch ? content.substring(0, patchMatch.index).split('\n').length : 1;
        
        violations.push({
          type: 'PATCH_FULL_REPLACEMENT',
          severity: 'MEDIUM',
          line: patchLine,
          message: 'PATCH should be used for partial updates. Use PUT for full replacement or add .partial() to schema.',
          code: 'Use schema.partial() or separate PATCH from PUT logic',
        });
      }
    }
  }

  return {
    file: relative(process.cwd(), filePath),
    violations,
    methods,
  };
}

function generateReport() {
  console.log('🔍 Scanning API routes for REST violations...\n');
  
  const routeFiles = findFiles(API_DIR, /route\.ts$/);
  console.log(`Found ${routeFiles.length} API route files\n`);

  const results: RouteAuditResult[] = [];
  let totalViolations = 0;

  for (const file of routeFiles) {
    const result = auditRoute(file);
    results.push(result);
    
    if (result.violations.length > 0) {
      totalViolations += result.violations.length;
      
      console.log(`\n❌ ${result.file}`);
      console.log(`   Methods: ${result.methods.join(', ')}`);
      console.log(`   Violations: ${result.violations.length}`);
      
      for (const violation of result.violations) {
        const severityEmoji = violation.severity === 'HIGH' ? '🔴' : violation.severity === 'MEDIUM' ? '🟡' : '🔵';
        console.log(`   ${severityEmoji} [${violation.type}] Line ${violation.line}: ${violation.message}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 AUDIT SUMMARY');
  console.log(`\nTotal routes scanned: ${routeFiles.length}`);
  console.log(`Routes with violations: ${results.filter(r => r.violations.length > 0).length}`);
  console.log(`Total violations: ${totalViolations}\n`);

  // Breakdown by type
  const violationsByType = results
    .flatMap(r => r.violations)
    .reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  console.log('Violations by type:');
  Object.entries(violationsByType).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`);
  });

  // Breakdown by severity
  const violationsBySeverity = results
    .flatMap(r => r.violations)
    .reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  console.log('\nViolations by severity:');
  Object.entries(violationsBySeverity).forEach(([severity, count]) => {
    console.log(`  - ${severity}: ${count}`);
  });

  // Write JSON report
  writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n📄 Full report written to: ${relative(process.cwd(), OUTPUT_FILE)}`);

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Audit complete!\n');

  // Exit with error code if high-severity violations found
  const highSeverityCount = results.flatMap(r => r.violations).filter(v => v.severity === 'HIGH').length;
  if (highSeverityCount > 0) {
    console.error(`❌ ${highSeverityCount} HIGH severity violations found. These should be fixed before merge.\n`);
    process.exit(1);
  }
}

// Run audit
generateReport();
