import { DEFAULT_DEMO_EVENT_ID, DEMO_EVENT_ID_KEY, DEMO_SESSION_FLAG_KEY } from './demoConstants';

export function readDemoSession(): { demoMode: boolean; demoEventId: string | null } {
  if (typeof sessionStorage === 'undefined') {
    return { demoMode: false, demoEventId: null };
  }
  const demoMode = sessionStorage.getItem(DEMO_SESSION_FLAG_KEY) === '1';
  const id = sessionStorage.getItem(DEMO_EVENT_ID_KEY);
  return {
    demoMode,
    demoEventId: demoMode ? id || DEFAULT_DEMO_EVENT_ID : null,
  };
}

export function writeDemoSession(eventId: string = DEFAULT_DEMO_EVENT_ID): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(DEMO_SESSION_FLAG_KEY, '1');
  sessionStorage.setItem(DEMO_EVENT_ID_KEY, eventId);
}

export function clearDemoSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(DEMO_SESSION_FLAG_KEY);
  sessionStorage.removeItem(DEMO_EVENT_ID_KEY);
}
