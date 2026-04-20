import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
      data: { transactionId: 'tx-test-1', status: 'ok' },
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
});
