/* global __ENV */
/**
 * k6 stadium-scale spike (shell) — hits the SPA login route many times in parallel.
 *
 * Install: https://k6.io/docs/getting-started/installation/
 * Run against a preview server:
 *   BASE_URL=http://127.0.0.1:4173 k6 run tests/load/k6-venue-spike.js
 *
 * Tune `vus` / `duration` for your environment. This does not replace Firebase/Functions load tests.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
};

const BASE = __ENV.BASE_URL || 'http://127.0.0.1:4173';

export default function venueSpike() {
  const res = http.get(`${BASE}/login`);
  check(res, {
    'login shell 200': (r) => r.status === 200,
  });
  sleep(0.05);
}
