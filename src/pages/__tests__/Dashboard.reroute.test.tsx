import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EntryProvider } from '../../store/entryStore';
import { Dashboard } from '../Dashboard';

const mockInitRC = vi.hoisted(() => vi.fn().mockResolvedValue('OPEN'));

vi.mock('../../components/admin/ChaosController', () => ({
  ChaosController: () => null,
}));

vi.mock('../../components/concourse/ConcourseCopilotCard', () => ({
  ConcourseCopilotCard: () => null,
}));

vi.mock('../../services/routing', () => ({
  calculateOptimalPath: vi.fn().mockResolvedValue({
    routeId: 'rt_test',
    encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
    pathNodes: [{ lat: 0, lng: 0 }],
    perimeterToSeatTime: '12 mins',
    status: 'TEST',
  }),
}));

vi.mock('../../services/bleProximity', () => ({
  detectBeaconProximity: vi.fn(),
  getWebBluetoothBlockReason: vi.fn(() => null),
}));

vi.mock('../../services/gateMatrix', () => ({
  fetchGateEtasMatrix: vi.fn().mockResolvedValue({
    rankings: [
      { gateId: 'GATE_B', durationSeconds: 240, distanceMeters: 300 },
      { gateId: 'GATE_A', durationSeconds: 360, distanceMeters: 400 },
    ],
    mode: 'mock',
  }),
  formatMatrixInsight: (r: unknown[]) =>
    r?.length ? 'Gate B is 4 mins away (Faster than Gate A).' : '',
}));

vi.mock('../../services/translationClient', () => ({
  translateAlertText: vi.fn((t: string) => Promise.resolve(t)),
}));

vi.mock('../../lib/firebase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/firebase')>();
  return {
    ...actual,
    initRemoteConfig: mockInitRC,
  };
});

vi.mock('firebase/remote-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/remote-config')>();
  return {
    ...actual,
    getValue: vi.fn(() => ({ asString: () => 'false' })),
  };
});

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    doc: vi.fn((...args: unknown[]) => ({ __p: (args as string[]).slice(1).join('/') })),
    onSnapshot: vi.fn((ref: { __p?: string }, cb: (s: { exists: () => boolean; data: () => object }) => void) => {
      if (ref.__p?.includes('routingPolicy')) {
        queueMicrotask(() =>
          cb({
            exists: () => true,
            data: () => ({
              gateRerouteActive: true,
              message: 'CRITICAL TEST: Reroute active.',
              fromGate: 'GATE_IN',
              toGate: 'GATE_OUT',
            }),
          })
        );
      }
      return vi.fn();
    }),
  };
});

describe('Dashboard reroute UX', () => {
  beforeEach(() => {
    mockInitRC.mockClear();
  });

  it('shows assertive reroute alert and smart route map when policy is active', async () => {
    render(
      <EntryProvider>
        <Dashboard />
      </EntryProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/CRITICAL TEST: Reroute active/);
    });

    expect(screen.getByText(/Smart route map/i)).toBeInTheDocument();
    expect(screen.getByText('GATE_IN')).toBeInTheDocument();
    expect(screen.getAllByText('GATE_OUT').length).toBeGreaterThanOrEqual(1);
  });
});
