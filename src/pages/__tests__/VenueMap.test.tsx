import React, { useLayoutEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EntryProvider, useEntryStore } from '../../store/entryStore';
import { VenueMap } from '../VenueMap';
import { VENUE_MAP_DOM_IDS } from '../../constants/venueMap';

const mockOnSnapshot = vi.fn();

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    doc: vi.fn(() => ({ path: 'demoEvents/e/facilityStatus/live' })),
    onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  };
});

vi.mock('../../lib/firebase', () => ({
  db: {},
}));

function DemoVenueMapShell() {
  const { dispatch } = useEntryStore();
  useLayoutEffect(() => {
    dispatch({ type: 'SET_DEMO_CONTEXT', payload: { demoMode: true, demoEventId: 'demo-evt-map' } });
  }, [dispatch]);
  return <VenueMap />;
}

describe('VenueMap', () => {
  let snapshotHandler: (snap: { data: () => unknown }) => void;

  beforeEach(() => {
    mockOnSnapshot.mockReset();
    mockOnSnapshot.mockImplementation((_ref: unknown, onNext: (snap: { data: () => unknown }) => void) => {
      snapshotHandler = onNext;
      onNext({ data: () => ({}) });
      return vi.fn();
    });
  });

  it('renders heading and Gate A escalator copy', () => {
    render(
      <MemoryRouter>
        <EntryProvider>
          <DemoVenueMapShell />
        </EntryProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /venue map/i })).toBeInTheDocument();
    const visibleRow = (needle: RegExp) =>
      screen.getByText((_, el) =>
        Boolean(el?.tagName === 'LI' && !el.closest('.sr-only') && needle.test(el.textContent ?? ''))
      );
    expect(visibleRow(/Escalator 131/)).toBeInTheDocument();
    expect(visibleRow(/Escalator 145/)).toBeInTheDocument();
    expect(screen.getAllByText(/Jammed \/ avoid/i).length).toBeGreaterThanOrEqual(1);
    expect(mockOnSnapshot).toHaveBeenCalled();
  });

  it('uses defaults and does not subscribe to Firestore when not in demo mode', () => {
    mockOnSnapshot.mockClear();
    render(
      <MemoryRouter>
        <EntryProvider>
          <VenueMap />
        </EntryProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/defaults/i)).toBeInTheDocument();
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it('shows ticket section when seat is stored', () => {
    function SeatedVenueMap() {
      const { dispatch } = useEntryStore();
      useLayoutEffect(() => {
        dispatch({ type: 'SET_DEMO_CONTEXT', payload: { demoMode: true, demoEventId: 'x' } });
        dispatch({ type: 'SET_DEMO_SEAT_SECTION', payload: 'L3-100' });
      }, [dispatch]);
      return <VenueMap />;
    }

    render(
      <MemoryRouter>
        <EntryProvider>
          <SeatedVenueMap />
        </EntryProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/L3-100/)).toBeInTheDocument();
    expect(screen.getByText(/your tier/)).toBeInTheDocument();
  });

  it('updates the live status region when Firestore toggles emergency and escalator data', async () => {
    render(
      <MemoryRouter>
        <EntryProvider>
          <DemoVenueMapShell />
        </EntryProvider>
      </MemoryRouter>
    );

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('id', VENUE_MAP_DOM_IDS.facilityStatusLive);
    expect(liveRegion).toHaveTextContent(/Escalator 131/);

    act(() => {
      snapshotHandler({
        data: () => ({
          emergencyActive: true,
          escalators: {
            'E-131': 'reduced',
            'E-145': 'available',
          },
        }),
      });
    });

    await waitFor(() => {
      expect(liveRegion).toHaveTextContent(/Venue emergency signal active/);
      expect(liveRegion).toHaveTextContent(/Reduced capacity/);
    });
  });
});
