import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createLatentOnSnapshot,
  createOnSnapshotError,
  isSpannerContentionMessage,
} from '../../__mocks__/googleServices';

describe('googleServices mocks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays snapshot delivery for latency simulation', () => {
    const onNext = vi.fn();
    const unsub = createLatentOnSnapshot(5000, { escalators: { 'E-131': 'available' } })(
      {},
      onNext
    );
    expect(onNext).not.toHaveBeenCalled();
    vi.advanceTimersByTime(5000);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect((onNext.mock.calls[0]![0] as { data: () => unknown }).data()).toEqual({
      escalators: { 'E-131': 'available' },
    });
    unsub();
  });

  it('invokes error callback for permission-style failures', () => {
    const err = new Error('permission-denied');
    const onErr = vi.fn();
    createOnSnapshotError(err)({}, vi.fn(), onErr);
    expect(onErr).toHaveBeenCalledWith(err);
  });

  it('flags Spanner-style contention strings', () => {
    expect(isSpannerContentionMessage('transaction ABORTED')).toBe(true);
    expect(isSpannerContentionMessage('ok')).toBe(false);
  });
});
