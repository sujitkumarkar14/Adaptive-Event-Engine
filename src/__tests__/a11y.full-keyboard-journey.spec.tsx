import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Onboarding } from '../pages/Onboarding';
import { EntryProvider } from '../store/entryStore';
import { Booking } from '../pages/Booking';

const mockSignInAnonymously = vi.fn().mockResolvedValue(undefined);

vi.mock('firebase/auth', () => ({
  signInAnonymously: (...args: unknown[]) => mockSignInAnonymously(...args),
  signInWithEmailAndPassword: vi.fn().mockResolvedValue(undefined),
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue(undefined),
}));

const reserveMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { transactionId: 'tx-kb', status: 'ok' } })
);

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => reserveMock),
}));

vi.mock('../lib/firebase', () => ({
  auth: {},
  functions: {},
}));

describe('a11y: full keyboard journey (segmented)', () => {
  it('login — tab order without pointer', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    await user.tab();
    expect(screen.getByRole('button', { name: /Continue as guest/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('textbox', { name: /email/i })).toHaveFocus();
  });

  it('onboarding — Metro transport control is keyboard-activatable', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <EntryProvider>
          <Onboarding />
        </EntryProvider>
      </MemoryRouter>
    );
    const metro = screen.getByRole('button', { name: /subwayMetro/i });
    metro.focus();
    expect(metro).toHaveFocus();
    await user.keyboard('{Enter}');
  });

  it('booking — select slot and reach Confirm with keyboard', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <EntryProvider>
          <Booking />
        </EntryProvider>
      </MemoryRouter>
    );
    const slotCard = screen.getByRole('button', { name: /14:00 - 14:15/i });
    slotCard.focus();
    await user.keyboard('{Enter}');
    const confirm = screen.getByRole('button', { name: /Confirm Slot/i });
    for (let i = 0; i < 24; i++) {
      if (document.activeElement === confirm) break;
      await user.tab();
    }
    expect(confirm).toHaveFocus();
  });
});
