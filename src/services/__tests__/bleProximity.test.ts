import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectBeaconProximity } from '../bleProximity';

describe('detectBeaconProximity', () => {
  const origBt = (navigator as unknown as { bluetooth?: unknown }).bluetooth;

  afterEach(() => {
    (navigator as unknown as { bluetooth?: unknown }).bluetooth = origBt;
    vi.restoreAllMocks();
  });

  it('warns and returns early when Web Bluetooth is unavailable', async () => {
    (navigator as unknown as { bluetooth?: unknown }).bluetooth = undefined;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await detectBeaconProximity(() => {});
    expect(warn).toHaveBeenCalled();
  });

  it('invokes onDetected when a device is returned', async () => {
    const requestDevice = vi.fn().mockResolvedValue({ id: 'device-abc' });
    (navigator as unknown as { bluetooth?: { requestDevice: typeof requestDevice } }).bluetooth = {
      requestDevice,
    };
    const onDetected = vi.fn();
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    await detectBeaconProximity(onDetected);
    expect(onDetected).toHaveBeenCalledWith('device-abc');
    info.mockRestore();
  });

  it('logs error when requestDevice rejects', async () => {
    const requestDevice = vi.fn().mockRejectedValue(new Error('User cancelled'));
    (navigator as unknown as { bluetooth?: { requestDevice: typeof requestDevice } }).bluetooth = {
      requestDevice,
    };
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await detectBeaconProximity(() => {});
    expect(err).toHaveBeenCalled();
  });
});
