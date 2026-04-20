import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../pages/Login';
import { EntryProvider } from '../store/entryStore';
import { Dashboard } from '../pages/Dashboard';

const mockSignInAnonymously = vi.fn().mockResolvedValue(undefined);
const mockSignInWithEmail = vi.fn().mockResolvedValue(undefined);
const mockCreateUser = vi.fn().mockResolvedValue(undefined);

vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/auth')>();
  return {
    ...actual,
    signInAnonymously: (...args: unknown[]) => mockSignInAnonymously(...args),
    signInWithEmailAndPassword: (...args: unknown[]) => mockSignInWithEmail(...args),
    createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUser(...args),
  };
});

const mockInitRC = vi.hoisted(() => vi.fn().mockResolvedValue('OPEN'));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'sr-flow-user' },
    role: 'user',
    hasRole: () => true,
  }),
}));

vi.mock('../components/admin/ChaosController', () => ({
  ChaosController: () => null,
}));

vi.mock('../components/concourse/ConcourseCopilotCard', () => ({
  ConcourseCopilotCard: () => null,
}));

vi.mock('../services/routing', () => ({
  calculateOptimalPath: vi.fn().mockResolvedValue({
    routeId: 'rt_sr',
    encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
    pathNodes: [{ lat: 0, lng: 0 }],
    perimeterToSeatTime: '12 mins',
    status: 'TEST',
  }),
}));

vi.mock('../services/bleProximity', () => ({
  detectBeaconProximity: vi.fn(),
  getWebBluetoothBlockReason: vi.fn(() => null),
}));

vi.mock('../services/gateMatrix', () => ({
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

vi.mock('../services/translationClient', () => ({
  translateAlertText: vi.fn((t: string) => Promise.resolve(t)),
}));

vi.mock('../lib/firebase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/firebase')>();
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
              message: 'SR FLOW: Reroute for screen reader test.',
              fromGate: 'GATE_IN',
              toGate: 'GATE_OUT',
            }),
          })
        );
      }
      if (ref.__p?.includes('globalEvents')) {
        queueMicrotask(() =>
          cb({
            exists: () => true,
            data: () => ({ active: true }),
          })
        );
      }
      if (ref.__p?.includes('users/sr-flow-user')) {
        queueMicrotask(() => cb({ exists: () => false, data: () => undefined }));
      }
      return vi.fn();
    }),
    setDoc: vi.fn().mockResolvedValue(undefined),
  };
});

describe('a11y: screen reader–oriented structure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithEmail.mockResolvedValue(undefined);
  });

  it('login: heading labels section; failed sign-in exposes assertive alert', async () => {
    mockSignInWithEmail.mockRejectedValue(new Error('auth/invalid-credential'));
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const region = screen.getByRole('region', { name: /Identity Gate/i });
    expect(region).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /Identity Gate/i })).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'x@y.com');
    await user.type(screen.getByLabelText(/^Password$/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /^Sign In$/i }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
      expect(alert.textContent).toBeTruthy();
    });
  });

  it('dashboard: polite status + assertive alerts for dynamic incidents', async () => {
    const { container } = render(
      <EntryProvider>
        <Dashboard />
      </EntryProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(2);
    });

    const polite = container.querySelector('[aria-live="polite"][role="status"]');
    expect(polite).toBeTruthy();

    for (const el of screen.getAllByRole('alert')) {
      expect(el.getAttribute('aria-live')).toBe('assertive');
      expect(el.getAttribute('aria-atomic')).toBe('true');
    }
  });
});
