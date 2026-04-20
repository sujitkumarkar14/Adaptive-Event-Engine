/**
 * Concurrent HTTP calls to the reserveEntrySlot **callable** endpoint (Firebase HTTPS format).
 * Point LOAD_TEST_URL at a running Functions emulator or deployed URL.
 *
 * Example (emulator):
 *   LOAD_TEST_URL=http://127.0.0.1:5001/adaptive-entry/us-central1/reserveEntrySlot npm run test:load
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const CONCURRENCY = Number(process.env.LOAD_TEST_CONCURRENCY ?? 50);
const URL =
  process.env.LOAD_TEST_URL ??
  'http://127.0.0.1:5001/adaptive-entry/us-central1/reserveEntrySlot';

const start = Date.now();
const results = await Promise.allSettled(
  Array.from({ length: CONCURRENCY }, async (_, i) => {
    const t0 = Date.now();
    try {
      const r = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { slotId: `load-${i}`, gateId: 'GATE_A' },
        }),
      });
      const responseMs = Date.now() - t0;
      return { status: r.status, ok: r.ok, responseMs };
    } catch {
      const responseMs = Date.now() - t0;
      throw { responseMs };
    }
  })
);

const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
const rejected = results.filter((r) => r.status === 'rejected').length;
const responseTimesMs = results
  .map((r) => {
    if (r.status === 'fulfilled') return r.value.responseMs;
    const reason = r.reason;
    return typeof reason?.responseMs === 'number' ? reason.responseMs : null;
  })
  .filter((n) => typeof n === 'number')
  .sort((a, b) => a - b);
const avgResponseMs =
  responseTimesMs.length === 0
    ? null
    : Math.round(responseTimesMs.reduce((a, b) => a + b, 0) / responseTimesMs.length);
const p95ResponseMs =
  responseTimesMs.length === 0
    ? null
    : responseTimesMs[Math.min(responseTimesMs.length - 1, Math.floor(responseTimesMs.length * 0.95))];

const summary = {
  concurrency: CONCURRENCY,
  environment: process.env.LOAD_TEST_ENV ?? 'local',
  targetUrl: URL,
  durationMs: Date.now() - start,
  fulfilled,
  rejected,
  avgResponseMs,
  p95ResponseMs,
  notes:
    'Concurrent POSTs to the callable HTTP surface; unauthenticated responses are expected (e.g. 401). Measures fan-out stability and response-time spread, not Spanner booking success.',
  generatedAt: new Date().toISOString(),
};

mkdirSync(join(ROOT, 'artifacts'), { recursive: true });
const outPath = join(ROOT, 'artifacts', 'load-test-results.json');
writeFileSync(outPath, JSON.stringify(summary, null, 2));
console.log('Load test summary:', summary);
