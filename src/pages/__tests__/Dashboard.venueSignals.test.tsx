import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { EntryProvider } from '../../store/entryStore';
import { Dashboard } from '../Dashboard';

const mockInitRC = vi.hoisted(() => vi.fn().mockResolvedValue('OPEN'));
const mockSetDoc = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const voucherFixture = vi.hoisted(() => ({ enabled: false }));

const routingMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    routeId: 'rt_exit',
    encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
    pathNodes: [],
    perimeterToSeatTime: '9 mins to lot',
    status: 'TEST',
  })
);

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'u1' },
    role: 'user',
    hasRole: () => true,
  }),
}));

vi.mock('../../components/admin/ChaosController', () => ({
  ChaosController: () => null,
}));

vi.mock('../../components/maps/StarkMap', () => ({
  StarkMap: ({ label }: { label?: string }) => (
    <div role="img" aria-label={label ?? 'map'} data-testid="stark-map-mock" />
  ),
}));

vi.mock('../../services/routing', () => ({
  calculateOptimalPath: routingMock,
}));

vi.mock('../../services/bleProximity', () => ({
  detectBeaconProximity: vi.fn(),
}));

vi.mock('../../services/gateMatrix', () => ({
  fetchGateEtasMatrix: vi.fn().mockResolvedValue({ rankings: [], mode: 'mock' }),
  formatMatrixInsight: () => '',
}));

const translateCalls = vi.hoisted(() => [] as string[]);
vi.mock('../../services/translationClient', () => ({
  translateAlertText: vi.fn((t: string) => {
    translateCalls.push(t);
    return Promise.resolve(t);
  }),
}));

vi.mock('../../lib/maps', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/maps')>();
  return {
    ...actual,
    fetchConcourseCopilotTip: vi.fn().mockResolvedValue({
      tip: 'Demo tip.',
      places: [{ name: 'Restroom' }],
    }),
  };
});

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
    doc: vi.fn((...args: unknown[]) => {
      const segs = args.slice(1) as string[];
      return { __path: segs.join('/') };
    }),
    setDoc: (...args: unknown[]) => mockSetDoc(...args),
    serverTimestamp: vi.fn(() => ({ __serverTimestamp: true })),
    deleteField: vi.fn(() => ({ __deleteField: true })),
    onSnapshot: vi.fn((ref: { __path?: string }, cb: (snap: unknown) => void) => {
      const p = ref.__path ?? '';
      if (p === 'routingPolicy/live') {
        queueMicrotask(() =>
          cb({
            exists: () => false,
            data: () => ({}),
          })
        );
      }
      if (p === 'globalEvents/emergency') {
        queueMicrotask(() =>
          cb({
            exists: () => false,
            data: () => ({}),
          })
        );
      }
      if (p === 'users/u1') {
        queueMicrotask(() =>
          cb({
            exists: () => true,
            data: () =>
              voucherFixture.enabled ? { pendingVoucherCode: 'SMART_MOVE_10' } : {},
          })
        );
      }
      return vi.fn();
    }),
  };
});

describe('Dashboard venue signals (SOS, exit mode, incentives)', () => {
  beforeEach(() => {
    mockInitRC.mockClear();
    mockSetDoc.mockClear();
    routingMock.mockClear();
    translateCalls.length = 0;
    voucherFixture.enabled = false;
  });

  it('writes userAlerts for signed-in user and shows translated SOS confirmation', async () => {
    render(
      <EntryProvider>
        <Dashboard />
      </EntryProvider>
    );

    const sos = await screen.findByRole('button', {
      name: /SOS: request immediate assistance from venue staff/i,
    });
    fireEvent.click(sos);

    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalled();
    });

    const alertCall = mockSetDoc.mock.calls.find(
      (c) => (c[0] as { __path?: string }).__path === 'userAlerts/u1'
    );
    expect(alertCall).toBeDefined();
    expect(alertCall![1]).toMatchObject({
      status: 'active',
      location: 'GATE_B',
    });

    await waitFor(() => {
      expect(screen.getByText(/Help is on the way/i)).toBeInTheDocument();
    });
    expect(translateCalls.some((t) => t === 'Help is on the way.')).toBe(true);
  });

  it('calls calculateOptimalPath with returnToVehicle when Exit optimization is used', async () => {
    render(
      <EntryProvider>
        <Dashboard />
      </EntryProvider>
    );

    const exitBtn = await screen.findByRole('button', { name: /exit optimization/i });
    fireEvent.click(exitBtn);

    await waitFor(() => {
      expect(routingMock).toHaveBeenCalledWith(
        expect.objectContaining({
          returnToVehicle: true,
          priority: 'standard',
        })
      );
    });
  });

  it('shows Reward unlocked when users/{uid} has pendingVoucherCode', async () => {
    voucherFixture.enabled = true;
    render(
      <EntryProvider>
        <Dashboard />
      </EntryProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Reward unlocked/i)).toBeInTheDocument();
    });
    expect(screen.getByText('SMART_MOVE_10')).toBeInTheDocument();
  });
});
