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
  Array.from({ length: CONCURRENCY }, (_, i) =>
    fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: { slotId: `load-${i}`, gateId: 'GATE_A' },
      }),
    }).then((r) => ({ status: r.status, ok: r.ok }))
  )
);

const fulfilled = results.filter((r) => r.status === 'fulfilled').length;
const rejected = results.filter((r) => r.status === 'rejected').length;

const summary = {
  concurrency: CONCURRENCY,
  targetUrl: URL,
  durationMs: Date.now() - start,
  fulfilled,
  rejected,
  note:
    'Unauthenticated calls typically return 401/403; this measures endpoint stability under concurrent POSTs, not Spanner success.',
  generatedAt: new Date().toISOString(),
};

mkdirSync(join(ROOT, 'artifacts'), { recursive: true });
const outPath = join(ROOT, 'artifacts', 'load-test-results.json');
writeFileSync(outPath, JSON.stringify(summary, null, 2));
console.log('Load test summary:', summary);
