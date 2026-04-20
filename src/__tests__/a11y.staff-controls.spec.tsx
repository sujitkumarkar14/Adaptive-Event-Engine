import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { StaffDashboard } from '../pages/StaffDashboard';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    staffGates: ['GATE_B'],
    role: 'staff',
    hasRole: (r: string) => r === 'staff' || r === 'admin',
  }),
}));

vi.mock('../services/staffRoutingPolicy', () => ({
  mergeRoutingPolicyLive: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...args: unknown[]) => ({ __segments: args.slice(1) })),
  collection: vi.fn((...args: unknown[]) => ({ __segments: args.slice(1) })),
  onSnapshot: vi.fn((ref: { __segments?: unknown[] }, cb: (s: { exists?: () => boolean; data?: () => unknown; docs?: unknown[] }) => void) => {
    const segs = ref.__segments as string[] | undefined;
    const path = segs?.join('/') ?? '';
    if (path === 'userAlerts') {
      queueMicrotask(() => cb({ docs: [] }));
      return vi.fn();
    }
    if (path.includes('gateLogistics')) {
      cb({
        exists: () => true,
        data: () => ({ currentPressure: 50, label: 'North' }),
      });
    }
    if (path.includes('routingPolicy')) {
      cb({
        exists: () => true,
        data: () => ({ gateRerouteActive: false }),
      });
    }
    return vi.fn();
  }),
}));

describe('a11y: staff controls', () => {
  it('has no detectable axe violations on staff dashboard', async () => {
    const { container } = render(<StaffDashboard />);
    await waitFor(() => {
      expect(container.querySelector('#staff-dash-heading')).toBeTruthy();
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
