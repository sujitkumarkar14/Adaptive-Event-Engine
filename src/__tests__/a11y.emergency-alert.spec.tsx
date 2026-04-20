import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { DEMO_ROLE_STORAGE_KEY } from '../contexts/AuthContext';
import { ChaosController } from '../components/admin/ChaosController';

const mockDispatch = vi.fn();
const mockMergeRoutingPolicyLive = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('../services/staffRoutingPolicy', () => ({
  mergeRoutingPolicyLive: (...args: unknown[]) => mockMergeRoutingPolicyLive(...args),
}));

vi.mock('../lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn((_ref: unknown, cb: (s: { data: () => Record<string, unknown> }) => void) => {
    queueMicrotask(() => cb({ data: () => ({ emergency_vehicle_active: false }) }));
    return vi.fn();
  }),
}));

vi.mock('../store/entryStore', () => ({
  useEntryStore: () => ({ dispatch: mockDispatch }),
}));

describe('a11y: emergency / chaos controls', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockMergeRoutingPolicyLive.mockClear();
    localStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
    vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
    vi.restoreAllMocks();
  });

  it('has no detectable axe violations on ChaosController', async () => {
    const { container } = render(<ChaosController />);
    await waitFor(() => {
      expect(container.querySelector('button')).toBeTruthy();
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
