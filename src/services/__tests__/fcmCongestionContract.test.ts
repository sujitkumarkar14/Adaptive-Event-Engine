import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Lightweight contract check: server `sendCongestionNudgesToTokens` must attach incentive data
 * for attendee clients (FCM `data` payload). Functions package does not run Vitest separately.
 */
describe('sendCongestionNudgesToTokens (server contract)', () => {
  it('includes voucherCode in multicast data', () => {
    const root = process.cwd();
    const src = readFileSync(join(root, 'functions/src/fcmHelpers.ts'), 'utf8');
    expect(src).toContain('voucherCode');
    expect(src).toMatch(/SMART_MOVE_10|voucherCode/);
  });
});
