/**
 * Subscribe the current device token to venue FCM topics (`emergency`, `smart_reroute`) via callable.
 * Requires `VITE_FCM_VAPID_KEY` and `/firebase-messaging-sw.js` at origin.
 */
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { httpsCallable } from 'firebase/functions';
import { app, functions } from './firebase';
import { devWarn } from './debug';

export async function subscribeVenueFcmTopics(): Promise<{ ok: boolean; reason?: string }> {
  const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY as string | undefined;
  if (!vapidKey || typeof vapidKey !== 'string') {
    return { ok: false, reason: 'VITE_FCM_VAPID_KEY not set' };
  }
  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return { ok: false, reason: 'messaging_not_supported' };
  }
  try {
    const messaging = getMessaging(app);
    const existing = await navigator.serviceWorker.getRegistration('/');
    const reg =
      existing ?? (await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' }));
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: reg,
    });
    if (!token) {
      return { ok: false, reason: 'no_token' };
    }
    const registerFcmTopics = httpsCallable<
      { token: string },
      { ok: boolean; topics?: readonly string[] }
    >(functions, 'registerFcmTopics');
    await registerFcmTopics({ token });
    return { ok: true };
  } catch (e) {
    devWarn('[FCM] subscribe failed', e);
    return { ok: false, reason: e instanceof Error ? e.message : 'unknown' };
  }
}
