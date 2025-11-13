#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * CI Gate: Ensure every API route under src/app/api/.../route.ts has at least one integration test.
 * Mapping heuristic:
 *   - For each route file, derive its relative API path (segments before route.ts)
 *   - Search tests/integration for any test file whose path contains all those segments in order.
 *   - If none found, mark missing.
 *   - Exit with non-zero code and JSON summary for missing routes.
 *
 * This keeps the rule flexible while enforcing coverage presence.
 */
import { promises as fs } from 'fs';
import path from 'path';

const root = process.cwd();
const apiRoot = path.join(root, 'src', 'app', 'api');
const testsRoot = path.join(root, 'tests', 'integration');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

function segmentsForRoute(routeFile) {
  // routeFile: .../src/app/api/products/[id]/route.ts
  const rel = path.relative(apiRoot, path.dirname(routeFile));
  // e.g. products/[id]
  return rel.split(path.sep).filter(Boolean);
}

function testMatchesSegments(testPath, segments) {
  const lowered = testPath.toLowerCase();
  return segments.every(seg => lowered.includes(seg.replace(/\[|\]/g, '').toLowerCase()));
}

async function main() {
  // Guard if paths missing
  for (const required of [apiRoot, testsRoot]) {
    try { await fs.access(required); } catch { console.error(JSON.stringify({ error: `Missing required directory: ${required}` })); process.exit(1); }
  }
  const routeFiles = (await walk(apiRoot)).filter(f => f.endsWith(path.join('route.ts')));
  const testFiles = (await walk(testsRoot)).filter(f => /\.(test|spec)\.(ts|tsx|js|mjs)$/.test(f));

  const missing = [];
  for (const rf of routeFiles) {
    const segs = segmentsForRoute(rf);
    const has = testFiles.some(tf => testMatchesSegments(tf, segs));
    if (!has) missing.push({ routeFile: path.relative(root, rf), segments: segs });
  }

  const summary = { totalRoutes: routeFiles.length, missingCount: missing.length, missing };
  if (missing.length) {
    console.error(JSON.stringify(summary, null, 2));
    process.exit(2);
  } else {
    console.log(JSON.stringify(summary, null, 2));
  }
}

main().catch(err => { console.error(JSON.stringify({ error: err.message, stack: err.stack }, null, 2)); process.exit(1); });
