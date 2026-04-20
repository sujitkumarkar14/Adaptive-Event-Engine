import { describe, it, expect, beforeEach } from 'vitest';
import {
  readDemoSession,
  writeDemoSession,
  clearDemoSession,
  readDemoSeatSection,
  writeDemoSeatSection,
} from '../demoSession';
import { DEFAULT_DEMO_EVENT_ID, DEMO_SEAT_SECTION_KEY } from '../demoConstants';

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

  it('writeDemoSeatSection and readDemoSeatSection round-trip', () => {
    writeDemoSeatSection('L3-101');
    expect(readDemoSeatSection()).toBe('L3-101');
    writeDemoSeatSection(null);
    expect(readDemoSeatSection()).toBeNull();
  });

  it('writeDemoSession clears stored seat section', () => {
    sessionStorage.setItem(DEMO_SEAT_SECTION_KEY, 'L2-050');
    writeDemoSession('evt-2');
    expect(readDemoSeatSection()).toBeNull();
  });
});
