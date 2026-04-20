#!/usr/bin/env node
/**
 * Writes artifacts/perf-summary.json with local micro-benchmark timings + optional Vite build duration.
 * Set PERF_INCLUDE_BUILD=1 to append `viteBuildMs` (adds ~10–60s).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { runRoutingBench } from './benchmark-routing.mjs';
import { runBookingBench } from './benchmark-booking.mjs';
import { runBroadcastBench } from './benchmark-broadcast.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'artifacts');
const outFile = join(outDir, 'perf-summary.json');

const includeBuild = process.env.PERF_INCLUDE_BUILD === '1';

let viteBuildMs = null;
if (includeBuild) {
  const t0 = Date.now();
  execSync('npm run build', { cwd: root, stdio: 'pipe' });
  viteBuildMs = Date.now() - t0;
}

const summary = {
  generatedAt: new Date().toISOString(),
  environment: 'local-node',
  note: 'Synthetic CPU micro-benchmarks only; not production SLOs or Maps/Spanner latency.',
  routingBenchMs: runRoutingBench(),
  bookingBenchMs: runBookingBench(),
  broadcastBenchMs: runBroadcastBench(),
  ...(viteBuildMs != null ? { viteBuildMs } : {}),
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(summary, null, 2) + '\n', 'utf8');
console.log(`Wrote ${outFile}`);
