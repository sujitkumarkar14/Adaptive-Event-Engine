import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../Login';

const mockSignInWithEmail = vi.fn().mockResolvedValue(undefined);
const mockCreateUser = vi.fn().mockResolvedValue(undefined);

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignInWithEmail(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUser(...args),
}));

vi.mock('../../lib/firebase', () => ({
  auth: {},
}));

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Identity Gate heading', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /Identity Gate/i })).toBeInTheDocument();
  });

  it('does not offer guest sign-in (email/password only)', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.queryByRole('button', { name: /Continue as guest/i })).not.toBeInTheDocument();
  });

  it('shows validation when email sign-in with empty fields', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/required/i);
  });
});
