import { describe, it, expect, beforeEach } from 'vitest';
import { readDemoSession, writeDemoSession, clearDemoSession } from '../demoSession';
import { DEFAULT_DEMO_EVENT_ID } from '../demoConstants';

describe('demoSession', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('readDemoSession returns false when not set', () => {
    expect(readDemoSession()).toEqual({ demoMode: false, demoEventId: null });
  });

  it('writeDemoSession and readDemoSession round-trip', () => {
    writeDemoSession('evt-1');
    expect(readDemoSession()).toEqual({ demoMode: true, demoEventId: 'evt-1' });
  });

  it('defaults event id when demo flag set without id', () => {
    sessionStorage.setItem('ae360_demo_mode', '1');
    expect(readDemoSession().demoEventId).toBe(DEFAULT_DEMO_EVENT_ID);
  });

  it('clearDemoSession removes keys', () => {
    writeDemoSession();
    clearDemoSession();
    expect(readDemoSession().demoMode).toBe(false);
  });
});
