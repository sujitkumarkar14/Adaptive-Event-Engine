import React, { useLayoutEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EntryProvider, useEntryStore } from '../../store/entryStore';
import { VenueMap } from '../VenueMap';

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
  beforeEach(() => {
    mockOnSnapshot.mockReset();
    mockOnSnapshot.mockImplementation((_ref: unknown, onNext: (snap: { data: () => undefined }) => void) => {
      onNext({ data: () => undefined });
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
    expect(screen.getByText(/Escalator 131/i)).toBeInTheDocument();
    expect(screen.getByText(/Escalator 145/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Jammed \/ avoid/i).length).toBeGreaterThanOrEqual(1);
    expect(mockOnSnapshot).toHaveBeenCalled();
  });
});
