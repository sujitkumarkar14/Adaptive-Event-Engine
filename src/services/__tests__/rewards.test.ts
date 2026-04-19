import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { issueComplianceReward } from '../rewards';

describe('issueComplianceReward', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves true after simulated payout delay', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const p = issueComplianceReward('user-1', 5);
    await vi.advanceTimersByTimeAsync(1200);
    await expect(p).resolves.toBe(true);
    info.mockRestore();
  });
});
