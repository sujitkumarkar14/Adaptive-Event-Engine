import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { useVenueLogistics } from '../useVenueLogistics';

const mockOnSnapshot = vi.fn();

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    doc: vi.fn(() => ({ path: 'demoEvents/x/facilityStatus/live' })),
    onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  };
});

vi.mock('../../lib/firebase', () => ({ db: {} }));

function Probe(props: Parameters<typeof useVenueLogistics>[0]) {
  const v = useVenueLogistics(props);
  return (
    <span data-testid="pack">
      {v.pack ? v.pack.gate.id : 'none'}-{v.emergencyActive ? 'e' : 'n'}
    </span>
  );
}

describe('useVenueLogistics', () => {
  beforeEach(() => {
    mockOnSnapshot.mockReset();
  });

  it('subscribes in demo mode and clears state on snapshot error', async () => {
    mockOnSnapshot.mockImplementation(
      (_ref: unknown, _onNext: (s: { data: () => unknown }) => void, onErr?: () => void) => {
        if (onErr) onErr();
        return vi.fn();
      }
    );
    const { getByTestId } = render(
      <Probe
        demoMode
        demoEventId="evt-1"
        gatePressureGateId={null}
        currentLocalGate={null}
        demoSeatSection={null}
      />
    );
    await waitFor(() => {
      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(getByTestId('pack').textContent).toMatch(/GATE_NORTH/);
    });
    expect(mockOnSnapshot).toHaveBeenCalled();
  });
});
