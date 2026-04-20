import { describe, it, expect, vi, beforeEach } from 'vitest';
import { translateAlertText } from '../translationClient';

const mockCallable = vi.fn();

vi.mock('../../lib/firebase', () => ({
  functions: {},
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => mockCallable),
}));

describe('translationClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns text unchanged for English', async () => {
    expect(await translateAlertText('Hello', 'en')).toBe('Hello');
  });

  it('returns empty when text empty', async () => {
    expect(await translateAlertText('  ', 'hi')).toBe('  ');
  });

  it('calls translateAlert callable for non-English', async () => {
    mockCallable.mockResolvedValueOnce({ data: { translatedText: 'नमस्ते' } });
    const out = await translateAlertText('Hello', 'hi');
    expect(out).toBe('नमस्ते');
    expect(mockCallable).toHaveBeenCalled();
  });

  it('falls back to original text on callable failure', async () => {
    mockCallable.mockRejectedValueOnce(new Error('network'));
    const out = await translateAlertText('Hello', 'hi');
    expect(out).toBe('Hello');
  });
});
