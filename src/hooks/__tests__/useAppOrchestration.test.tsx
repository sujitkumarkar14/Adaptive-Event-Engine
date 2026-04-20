import React, { useLayoutEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { EntryProvider, useEntryStore } from '../../store/entryStore';
import { useAppOrchestration } from '../useAppOrchestration';
import { DEMO_EVENT_ID_KEY, DEMO_SESSION_FLAG_KEY } from '../../lib/demoConstants';

const mockInitRemoteConfig = vi.hoisted(() => vi.fn().mockResolvedValue('OPEN'));

vi.mock('../../lib/firestore', () => ({
  syncGatePressure: vi.fn(() => vi.fn()),
}));

vi.mock('../../lib/fcmRegister', () => ({
  subscribeVenueFcmTopics: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('../../lib/firebase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/firebase')>();
  return {
    ...actual,
    initRemoteConfig: mockInitRemoteConfig,
  };
});

type Snap = { data: () => { active?: boolean; gates?: Record<string, number> } | undefined };
type Cb = (s: Snap) => void;

const emergencyCallbacks: Cb[] = [];
const aggregateCallbacks: Cb[] = [];

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    doc: vi.fn((...args: unknown[]) => ({ __path: args.slice(1).join('/') })),
    onSnapshot: vi.fn((ref: { __path?: string }, cb: Cb) => {
      if (ref.__path === 'globalEvents/emergency') {
        emergencyCallbacks.push(cb);
      } else if (ref.__path?.endsWith('/aggregates/live')) {
        aggregateCallbacks.push(cb);
      }
      return vi.fn();
    }),
  };
});

function speakableHarness({
  user,
  primeStepFree,
  primeStepFreeRequired,
}: {
  user: User | null;
  primeStepFree: boolean;
  primeStepFreeRequired?: boolean;
}) {
  const Child = () => {
    const { dispatch } = useEntryStore();
    useLayoutEffect(() => {
      if (primeStepFree) {
        dispatch({ type: 'TOGGLE_ACCESSIBILITY_PREF', payload: 'stepFree' });
      }
      if (primeStepFreeRequired) {
        dispatch({ type: 'TOGGLE_STEP_FREE', payload: true });
      }
    }, [dispatch, primeStepFree, primeStepFreeRequired]);
    useAppOrchestration(user);
    return null;
  };
  return (
    <EntryProvider>
      <Child />
    </EntryProvider>
  );
}

function GatePressureProbe() {
  const { state } = useEntryStore();
  return <span data-testid="gate-pressure">{state.gatePressurePercent ?? 'none'}</span>;
}

function demoOrchestrationHarness(user: User | null) {
  const Child = () => {
    useAppOrchestration(user);
    return <GatePressureProbe />;
  };
  return (
    <EntryProvider>
      <Child />
    </EntryProvider>
  );
}

describe('useAppOrchestration', () => {
  const mockUser = { uid: 'orch-1', isAnonymous: false } as User;
  let speakSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    emergencyCallbacks.length = 0;
    aggregateCallbacks.length = 0;
    sessionStorage.clear();
    speakSpy = vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(() => {});
  });

  it('initializes remote config and syncs gate pressure when user present', async () => {
    render(speakableHarness({ user: mockUser, primeStepFree: false }));

    await waitFor(() => {
      expect(mockInitRemoteConfig).toHaveBeenCalled();
    });

    const { syncGatePressure } = await import('../../lib/firestore');
    expect(syncGatePressure).toHaveBeenCalled();
  });

  it('announces standard egress when emergency activates and step-free is off', async () => {
    render(speakableHarness({ user: mockUser, primeStepFree: false }));

    await waitFor(() => expect(emergencyCallbacks.length).toBeGreaterThan(0));

    const cb = emergencyCallbacks[emergencyCallbacks.length - 1];
    cb({ data: () => ({ active: true }) });

    await waitFor(() => expect(speakSpy).toHaveBeenCalled());
    const u = speakSpy.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(u.text).toMatch(/nearest marked exit/i);
    expect(u.text).not.toMatch(/Section 102/i);
  });

  it('announces step-free evacuation when stepFreeRequired is set without accessibility pref', async () => {
    render(speakableHarness({ user: mockUser, primeStepFree: false, primeStepFreeRequired: true }));

    await waitFor(() => expect(emergencyCallbacks.length).toBeGreaterThan(0));

    const cb = emergencyCallbacks[emergencyCallbacks.length - 1];
    cb({ data: () => ({ active: true }) });

    await waitFor(() => expect(speakSpy).toHaveBeenCalled());
    const u = speakSpy.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(u.text).toMatch(/Step-Free exit located at Section 102/i);
  });

  it('announces step-free evacuation when emergency activates and step-free pref is on', async () => {
    render(speakableHarness({ user: mockUser, primeStepFree: true }));

    await waitFor(() => expect(emergencyCallbacks.length).toBeGreaterThan(0));

    const cb = emergencyCallbacks[emergencyCallbacks.length - 1];
    cb({ data: () => ({ active: true }) });

    await waitFor(() => expect(speakSpy).toHaveBeenCalled());
    const u = speakSpy.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(u.text).toMatch(/Step-Free exit located at Section 102/i);
  });

  it('does not sync gate pressure without user', async () => {
    const { syncGatePressure } = await import('../../lib/firestore');
    vi.mocked(syncGatePressure).mockClear();

    render(speakableHarness({ user: null, primeStepFree: false }));

    await waitFor(() => expect(mockInitRemoteConfig).toHaveBeenCalled());
    expect(syncGatePressure).not.toHaveBeenCalled();
  });

  it('subscribes to demo aggregate live doc and skips syncGatePressure when demo session is active', async () => {
    sessionStorage.setItem(DEMO_SESSION_FLAG_KEY, '1');
    sessionStorage.setItem(DEMO_EVENT_ID_KEY, 'evt-orch');

    const { syncGatePressure } = await import('../../lib/firestore');
    vi.mocked(syncGatePressure).mockClear();

    render(demoOrchestrationHarness(mockUser));

    await waitFor(() => expect(aggregateCallbacks.length).toBeGreaterThan(0));
    expect(syncGatePressure).not.toHaveBeenCalled();
  });

  it('dispatches gate pressure from demo aggregate snapshot (GATE_NORTH)', async () => {
    sessionStorage.setItem(DEMO_SESSION_FLAG_KEY, '1');
    sessionStorage.setItem(DEMO_EVENT_ID_KEY, 'evt-orch');

    render(demoOrchestrationHarness(mockUser));

    await waitFor(() => expect(aggregateCallbacks.length).toBeGreaterThan(0));
    const cb = aggregateCallbacks[aggregateCallbacks.length - 1];
    cb({ data: () => ({ gates: { GATE_NORTH: 55.4 } }) });

    await waitFor(() => expect(screen.getByTestId('gate-pressure')).toHaveTextContent('55'));
  });
});
