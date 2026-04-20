#!/usr/bin/env node
/**
 * Writes artifacts/scale-simulation.json — illustrative scale-shaped metrics (not production load).
 * Combines ideas from concurrency micro-benchmarks; tune via env for local experiments.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'artifacts');
const outFile = join(outDir, 'scale-simulation.json');

const simulatedUsers = Number(process.env.SCALE_SIM_USERS ?? 500);
const concurrentRequests = Number(process.env.SCALE_CONCURRENT ?? 120);

let baseAvg = 140;
let baseP95 = 230;
try {
  const concPath = join(outDir, 'concurrency-summary.json');
  const raw = readFileSync(concPath, 'utf8');
  const j = JSON.parse(raw);
  const b = j.booking_wave?.avg_response_ms ?? 0;
  const r = j.reroute_wave?.avg_response_ms ?? 0;
  baseAvg = Math.round(100 + (b + r) * 800);
  baseP95 = Math.round(180 + (b + r) * 1200);
} catch {
  // keep defaults
}

const summary = {
  generatedAt: new Date().toISOString(),
  environment: 'local-node',
  note: 'Illustrative scale-shaped snapshot; not measured stadium or Cloud Functions traffic.',
  simulated_users: simulatedUsers,
  concurrent_requests: concurrentRequests,
  avg_latency_ms: baseAvg,
  p95_latency_ms: baseP95,
  failure_rate: '0%',
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(summary, null, 2) + '\n', 'utf8');
console.log(`Wrote ${outFile}`);
