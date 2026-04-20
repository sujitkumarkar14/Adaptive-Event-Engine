#!/usr/bin/env node
/**
 * Simulated concurrent work (microtasks + tiny CPU) — not real HTTP or Spanner.
 * Writes artifacts/concurrency-summary.json for local throughput / p95 signals.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outFile = join(root, 'artifacts', 'concurrency-summary.json');

function measureOne() {
  const t0 = performance.now();
  let x = 0;
  for (let i = 0; i < 200; i++) x += i % 17;
  return performance.now() - t0 + x * 1e-9;
}

async function wave(label, concurrent) {
  const tasks = Array.from({ length: concurrent }, () =>
    Promise.resolve().then(() => measureOne())
  );
  const times = await Promise.all(tasks);
  times.sort((a, b) => a - b);
  const p95 = times[Math.min(times.length - 1, Math.floor(times.length * 0.95))];
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  return {
    label,
    concurrent_requests: concurrent,
    avg_response_ms: Math.round(avg * 1000) / 1000,
    p95_response_ms: Math.round(p95 * 1000) / 1000,
    failures: 0,
  };
}

const concurrent = Number(process.env.BENCH_CONCURRENT ?? 50);

const booking = await wave('mock_booking_resolve', concurrent);
const reroute = await wave('mock_reroute_eval', concurrent);

const summary = {
  generatedAt: new Date().toISOString(),
  environment: 'local-node',
  note: 'Simulated Promise.all fan-out; not Cloud Functions or Firestore latency.',
  booking_wave: booking,
  reroute_wave: reroute,
};

mkdirSync(join(root, 'artifacts'), { recursive: true });
writeFileSync(outFile, JSON.stringify(summary, null, 2) + '\n', 'utf8');
console.log(`Wrote ${outFile}`);
