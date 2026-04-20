import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockCallable = vi.fn().mockResolvedValue({ data: { ok: true } });

vi.mock('../firebase', () => ({
  app: {},
  functions: {},
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => mockCallable),
}));

vi.mock('firebase/messaging', () => ({
  getMessaging: vi.fn(() => ({})),
  getToken: vi.fn().mockResolvedValue('test-fcm-token'),
  isSupported: vi.fn().mockResolvedValue(true),
}));

describe('subscribeVenueFcmTopics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('navigator', {
      serviceWorker: {
        getRegistration: vi.fn().mockResolvedValue(undefined),
        register: vi.fn().mockResolvedValue({}),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns not ok when VITE_FCM_VAPID_KEY is missing', async () => {
    vi.stubEnv('VITE_FCM_VAPID_KEY', '');
    const { subscribeVenueFcmTopics } = await import('../fcmRegister');
    const res = await subscribeVenueFcmTopics();
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/VITE_FCM_VAPID_KEY/);
  });

  it('returns not ok when messaging is not supported', async () => {
    vi.stubEnv('VITE_FCM_VAPID_KEY', 'test-vapid-key');
    const messaging = await import('firebase/messaging');
    vi.mocked(messaging.isSupported).mockResolvedValueOnce(false);
    const { subscribeVenueFcmTopics } = await import('../fcmRegister');
    const res = await subscribeVenueFcmTopics();
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('messaging_not_supported');
  });

  it('subscribes topics when token is obtained', async () => {
    vi.stubEnv('VITE_FCM_VAPID_KEY', 'test-vapid-key');
    const messaging = await import('firebase/messaging');
    vi.mocked(messaging.isSupported).mockResolvedValue(true);
    vi.mocked(messaging.getToken).mockResolvedValueOnce('tok-123');
    const { subscribeVenueFcmTopics } = await import('../fcmRegister');
    const res = await subscribeVenueFcmTopics();
    expect(res.ok).toBe(true);
    expect(mockCallable).toHaveBeenCalledWith({ token: 'tok-123' });
  });

  it('returns no_token when getToken returns empty', async () => {
    vi.stubEnv('VITE_FCM_VAPID_KEY', 'test-vapid-key');
    const messaging = await import('firebase/messaging');
    vi.mocked(messaging.isSupported).mockResolvedValue(true);
    vi.mocked(messaging.getToken).mockResolvedValueOnce('');
    const { subscribeVenueFcmTopics } = await import('../fcmRegister');
    const res = await subscribeVenueFcmTopics();
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('no_token');
  });

  it('returns error reason when subscribe throws', async () => {
    vi.stubEnv('VITE_FCM_VAPID_KEY', 'test-vapid-key');
    const messaging = await import('firebase/messaging');
    vi.mocked(messaging.isSupported).mockResolvedValue(true);
    vi.mocked(messaging.getToken).mockRejectedValueOnce(new Error('network busted'));
    const { subscribeVenueFcmTopics } = await import('../fcmRegister');
    const res = await subscribeVenueFcmTopics();
    expect(res.ok).toBe(false);
    expect(res.reason).toContain('network busted');
  });
});
