import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../pages/Login';

const mockSignInWithEmail = vi.fn().mockResolvedValue(undefined);
const mockCreateUser = vi.fn().mockResolvedValue(undefined);

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignInWithEmail(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUser(...args),
}));

vi.mock('../lib/firebase', () => ({
  auth: {},
}));

describe('a11y: keyboard-only login flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tabs through primary actions without using the mouse', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await user.tab();
    expect(screen.getByRole('textbox', { name: /email/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText(/^Password$/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText(/Confirm password/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /^Sign In$/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /Create Account/i })).toHaveFocus();
  });
});
