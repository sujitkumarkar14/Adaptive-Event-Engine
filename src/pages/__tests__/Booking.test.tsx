import React, { useLayoutEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import { EntryProvider, useEntryStore } from '../../store/entryStore';
import { Booking } from '../Booking';

const reserveEntryMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    data: { transactionId: 'tx-test-1', status: 'SUCCESS', message: 'ok' },
  })
);
const reserveDemoMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    data: { transactionId: 'tx-demo-1', status: 'ok' },
  })
);

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn((_f: unknown, name: string) =>
    name === 'reserveDemoSlot' ? reserveDemoMock : reserveEntryMock
  ),
}));

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    doc: vi.fn((_db: unknown, ...segs: string[]) => ({ path: segs.join('/') })),
    collection: vi.fn((_db: unknown, ...segs: string[]) => ({ path: segs.join('/') })),
    query: vi.fn((q: { path: string }) => q),
    orderBy: vi.fn(() => ({})),
    onSnapshot: vi.fn((ref: { path: string }, cb: (snap: unknown) => void) => {
      if (ref.path === 'demoEvents/demo-book-evt') {
        cb({
          data: () => ({
            /** Wide window so tests stay bookable at any reasonable "now" in CI. */
            bookingWindowStart: { toDate: () => new Date(2020, 0, 1, 0, 0, 0, 0) },
            bookingWindowEnd: { toDate: () => new Date(2035, 11, 31, 23, 59, 59, 0) },
          }),
        });
      } else if (ref.path === 'demoEvents/demo-book-evt/slots') {
        cb({
          forEach: (fn: (row: { id: string; data: () => Record<string, unknown> }) => void) => {
            fn({
              id: 'slot-a',
              data: () => ({
                startTime: { toDate: () => new Date(2030, 5, 1, 14, 0, 0, 0) },
                endTime: { toDate: () => new Date(2030, 5, 1, 14, 15, 0, 0) },
                capacityTotal: 400,
                capacityRemaining: 10,
                defaultGate: 'GATE_NORTH',
              }),
            });
          },
        });
      }
      return vi.fn();
    }),
  };
});

vi.mock('../../lib/firebase', () => ({
  functions: {},
  db: {},
}));

function renderBooking() {
  return render(
    <MemoryRouter>
      <EntryProvider>
        <Booking />
      </EntryProvider>
    </MemoryRouter>
  );
}

function renderDemoBooking() {
  return render(
    <MemoryRouter>
      <EntryProvider>
        <DemoBookingShell />
      </EntryProvider>
    </MemoryRouter>
  );
}

function DemoBookingShell() {
  const { dispatch } = useEntryStore();
  useLayoutEffect(() => {
    dispatch({
      type: 'SET_DEMO_CONTEXT',
      payload: { demoMode: true, demoEventId: 'demo-book-evt' },
    });
  }, [dispatch]);
  return <Booking />;
}

describe('Booking', () => {
  beforeEach(() => {
    reserveEntryMock.mockClear();
    reserveDemoMock.mockClear();
    reserveEntryMock.mockResolvedValue({
      data: { transactionId: 'tx-test-1', status: 'SUCCESS', message: 'ok' },
    });
    reserveDemoMock.mockResolvedValue({
      data: { transactionId: 'tx-demo-1', status: 'ok' },
    });
  });

  it('renders arrival booking heading', () => {
    renderBooking();
    expect(screen.getByRole('heading', { name: /Arrival Booking/i })).toBeInTheDocument();
  });

  it('selects a slot and confirms reservation', async () => {
    renderBooking();
    fireEvent.click(screen.getByText('14:00 - 14:15'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Slot/i }));
    await waitFor(() => expect(reserveEntryMock).toHaveBeenCalled());
    expect(screen.getByText(/Slot reserved/i)).toBeInTheDocument();
  });

  it('blocks a slot and shows safe copy after failed-precondition', async () => {
    reserveEntryMock.mockRejectedValueOnce(new FirebaseError('functions/failed-precondition', 'x'));
    renderBooking();
    fireEvent.click(screen.getByText('14:00 - 14:15'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Slot/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/not available for booking/i);
    expect(screen.getByText(/Unavailable/i)).toBeInTheDocument();
  });

  it('shows safe copy for invalid payload (invalid-argument) without backend details', async () => {
    reserveEntryMock.mockRejectedValueOnce(new FirebaseError('functions/invalid-argument', 'secret'));
    renderBooking();
    fireEvent.click(screen.getByText('14:15 - 14:30'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Slot/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/could not be processed/i);
    expect(screen.getByRole('alert').textContent).not.toMatch(/secret/);
  });

  it('enters venue-wide unavailable state on internal errors', async () => {
    reserveEntryMock.mockRejectedValueOnce(new FirebaseError('functions/internal', 'secret'));
    renderBooking();
    fireEvent.click(screen.getByText('14:00 - 14:15'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Slot/i }));
    await waitFor(() => expect(screen.getByText(/temporarily unavailable for this venue/i)).toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
  });

  it('demo mode loads Firestore-backed slots and reserves via reserveDemoSlot', async () => {
    renderDemoBooking();
    await waitFor(() =>
      expect(screen.getByText(/Demo mode uses stadium event windows/i)).toBeInTheDocument()
    );
    await waitFor(() => expect(screen.getByText(/Filled 98%/i)).toBeInTheDocument());
    const slotLabel = await screen.findByText(/\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2}/);
    fireEvent.click(slotLabel);
    fireEvent.click(screen.getByRole('button', { name: /Confirm Slot/i }));
    await waitFor(() => expect(reserveDemoMock).toHaveBeenCalled());
    expect(reserveDemoMock).toHaveBeenCalledWith({
      eventId: 'demo-book-evt',
      slotId: 'slot-a',
      gateId: 'GATE_NORTH',
    });
    expect(reserveEntryMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Slot reserved/i)).toBeInTheDocument();
    expect(screen.getByText(/tx-demo-1/)).toBeInTheDocument();
  });

  it('demo mode shows venue-wide unavailable on internal errors from reserveDemoSlot', async () => {
    reserveDemoMock.mockRejectedValueOnce(new FirebaseError('functions/internal', 'secret'));
    renderDemoBooking();
    await waitFor(() => expect(screen.queryByText(/No demo slots in Firestore yet/i)).not.toBeInTheDocument());
    const slotLabel = await screen.findByText(/\d{1,2}:\d{2}\s*[–-]\s*\d{1,2}:\d{2}/);
    fireEvent.click(slotLabel);
    fireEvent.click(screen.getByRole('button', { name: /Confirm Slot/i }));
    await waitFor(() => expect(screen.getByText(/temporarily unavailable for this venue/i)).toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
