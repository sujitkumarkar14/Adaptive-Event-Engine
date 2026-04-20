import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'vitest-axe';
import { EntryProvider } from '../store/entryStore';
import { Booking } from '../pages/Booking';

const reserveMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    data: { transactionId: 'tx-a11y', status: 'ok' },
  })
);

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => reserveMock),
}));

vi.mock('../lib/firebase', () => ({
  functions: {},
}));

describe('a11y: booking flow', () => {
  it('has no detectable axe violations on booking slot selection surface', async () => {
    const { container } = render(
      <MemoryRouter>
        <EntryProvider>
          <Booking />
        </EntryProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /Arrival Booking/i })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
