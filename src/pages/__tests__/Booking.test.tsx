import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FirebaseError } from 'firebase/app';
import { EntryProvider } from '../../store/entryStore';
import { Booking } from '../Booking';

const reserveMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    data: { transactionId: 'tx-test-1', status: 'ok' },
  })
);

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => reserveMock),
}));

vi.mock('../../lib/firebase', () => ({
  functions: {},
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

describe('Booking', () => {
  beforeEach(() => {
    reserveMock.mockClear();
    reserveMock.mockResolvedValue({
      data: { transactionId: 'tx-test-1', status: 'SUCCESS', message: 'ok' },
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
    await waitFor(() => expect(reserveMock).toHaveBeenCalled());
    expect(screen.getByText(/Slot reserved/i)).toBeInTheDocument();
  });

  it('blocks a slot and shows safe copy after failed-precondition', async () => {
    reserveMock.mockRejectedValueOnce(new FirebaseError('functions/failed-precondition', 'x'));
    renderBooking();
    fireEvent.click(screen.getByText('14:00 - 14:15'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Slot/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/not available for booking/i);
    expect(screen.getByText(/Unavailable/i)).toBeInTheDocument();
  });

  it('shows safe copy for invalid payload (invalid-argument) without backend details', async () => {
    reserveMock.mockRejectedValueOnce(new FirebaseError('functions/invalid-argument', 'secret'));
    renderBooking();
    fireEvent.click(screen.getByText('14:15 - 14:30'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Slot/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/could not be processed/i);
    expect(screen.getByRole('alert').textContent).not.toMatch(/secret/);
  });

  it('enters venue-wide unavailable state on internal errors', async () => {
    reserveMock.mockRejectedValueOnce(new FirebaseError('functions/internal', 'secret'));
    renderBooking();
    fireEvent.click(screen.getByText('14:00 - 14:15'));
    fireEvent.click(screen.getByRole('button', { name: /Confirm Slot/i }));
    await waitFor(() => expect(screen.getByText(/temporarily unavailable for this venue/i)).toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
  });
});
