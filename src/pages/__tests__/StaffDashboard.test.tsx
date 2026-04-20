import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StaffDashboard } from '../StaffDashboard';

const mockSetDoc = vi.fn().mockResolvedValue(undefined);

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    staffGates: ['GATE_B'],
    role: 'staff',
    hasRole: (r: string) => r === 'staff' || r === 'admin',
  }),
}));

vi.mock('../../lib/firebase', () => ({
  db: {},
}));

type Snap = { exists: () => boolean; data: () => Record<string, unknown> };

const userAlertsFixture = vi.hoisted(() => ({
  docs: [] as Array<{ id: string; data: () => Record<string, unknown> }>,
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...args: unknown[]) => ({ __segments: args.slice(1) })),
  collection: vi.fn((...args: unknown[]) => ({ __segments: args.slice(1) })),
  onSnapshot: vi.fn(
    (ref: { __segments?: unknown[] }, cb: (s: Snap & { docs?: unknown[] }) => void) => {
    const segs = ref.__segments as string[] | undefined;
    const path = segs?.join('/') ?? '';
    if (path === 'userAlerts') {
      queueMicrotask(() =>
        cb({ docs: userAlertsFixture.docs } as Snap & { docs: unknown[] })
      );
      return vi.fn();
    }
    if (path.includes('gateLogistics')) {
      cb({
        exists: () => true,
        data: () => ({ currentPressure: 88, label: 'North' }),
      });
    }
    if (path.includes('routingPolicy')) {
      cb({
        exists: () => true,
        data: () => ({ gateRerouteActive: false }),
      });
    }
    return vi.fn();
  }
  ),
  serverTimestamp: vi.fn(() => ({ __ts: true })),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
}));

describe('StaffDashboard', () => {
  beforeEach(() => {
    mockSetDoc.mockClear();
    userAlertsFixture.docs = [];
  });

  it('shows live pressure from gateLogistics', async () => {
    render(<StaffDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/88%/)).toBeInTheDocument();
    });
  });

  it('writes routing policy when Trigger reroute is activated', async () => {
    render(<StaffDashboard />);
    const btn = await screen.findByRole('button', { name: /trigger reroute/i });
    fireEvent.click(btn);
    await waitFor(() => expect(mockSetDoc).toHaveBeenCalled());
    const [, payload] = mockSetDoc.mock.calls[0];
    expect(payload).toMatchObject(
      expect.objectContaining({
        gateRerouteActive: true,
        fromGate: 'GATE_B',
      })
    );
  });

  it('lists active userAlerts in Priority alerts', async () => {
    userAlertsFixture.docs = [
      {
        id: 'guest-9',
        data: () => ({ status: 'active', location: 'GATE_A' }),
      },
    ];
    render(<StaffDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/guest-9/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/GATE_A/i)).toBeInTheDocument();
  });
});
