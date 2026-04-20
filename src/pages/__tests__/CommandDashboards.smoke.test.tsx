import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TrafficCommand, AeroCommand, GateCommand } from '../CommandDashboards';
import { EntryProvider } from '../../store/entryStore';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    hasRole: (r: string) => r === 'staff' || r === 'admin',
  }),
}));

const gateDocs = vi.hoisted(() => [
  { id: 'GATE_B', data: () => ({ currentPressure: 72 }) },
  { id: 'GATE_A', data: () => ({ currentPressure: 40 }) },
]);

vi.mock('../../lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ __col: 'gateLogistics' })),
  query: vi.fn(() => ({ __kind: 'gateLogisticsQuery' })),
  limit: vi.fn(() => ({})),
  doc: vi.fn((_db: unknown, ...segments: string[]) => ({ __segments: segments })),
  onSnapshot: vi.fn((ref: { __kind?: string; __segments?: string[] }, cb: (s: unknown) => void) => {
    if (ref?.__kind === 'gateLogisticsQuery') {
      queueMicrotask(() => cb({ docs: gateDocs }));
      return vi.fn();
    }
    if (ref?.__segments?.join('/') === 'routingPolicy/live') {
      queueMicrotask(() =>
        cb({
          exists: () => true,
          data: () => ({ gateRerouteActive: false }),
        })
      );
      return vi.fn();
    }
    queueMicrotask(() => cb({ docs: [] }));
    return vi.fn();
  }),
}));

function shell(ui: React.ReactElement) {
  return (
    <MemoryRouter>
      <EntryProvider>{ui}</EntryProvider>
    </MemoryRouter>
  );
}

describe('Command dashboards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TrafficCommand shows live sector labels and no random metrics', async () => {
    render(shell(<TrafficCommand />));
    expect(screen.getByRole('heading', { name: /Command Matrix/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/GATE_B/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/72%/)).toBeInTheDocument();
    const reroute = screen.getByRole('button', { name: /Open staff console \(reroute\)/i });
    expect(reroute).not.toBeDisabled();
  });

  it('AeroCommand shows deterministic overview and reroute flag', () => {
    render(shell(<AeroCommand />));
    expect(screen.getByRole('heading', { name: /Venue operations overview/i })).toBeInTheDocument();
    expect(screen.getByText(/^Off$/)).toBeInTheDocument();
  });

  it('GateCommand exposes refresh and disables halt', () => {
    render(shell(<GateCommand />));
    expect(screen.getByRole('heading', { name: /Gate Supervisor/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh client feed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Halt flow — not available in this web preview/i })).toBeDisabled();
  });
});
