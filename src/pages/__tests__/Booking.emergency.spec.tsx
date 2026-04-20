import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EntryProvider, useEntryStore } from '../../store/entryStore';
import { Booking } from '../Booking';

const reserveMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    data: { transactionId: 'tx-em', status: 'ok' },
  })
);

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => reserveMock),
}));

vi.mock('../../lib/firebase', () => ({
  functions: {},
}));

function BookingWithEmergencyToggle() {
  const { dispatch } = useEntryStore();
  return (
    <>
      <button type="button" onClick={() => dispatch({ type: 'TRIGGER_EMERGENCY' })}>
        trigger-emergency
      </button>
      <Booking />
    </>
  );
}

describe('Booking during emergency phase', () => {
  it('keeps booking surface visible when phase becomes EMERGENCY', async () => {
    render(
      <MemoryRouter>
        <EntryProvider>
          <BookingWithEmergencyToggle />
        </EntryProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Arrival Booking/i })).toBeInTheDocument();
    screen.getByRole('button', { name: /trigger-emergency/i }).click();
    expect(screen.getByRole('heading', { name: /Arrival Booking/i })).toBeInTheDocument();
  });
});
