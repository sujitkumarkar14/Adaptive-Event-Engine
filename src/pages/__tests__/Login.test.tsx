import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../Login';

const mockSignInAnonymously = vi.fn().mockResolvedValue(undefined);
const mockSignInWithEmail = vi.fn().mockResolvedValue(undefined);
const mockCreateUser = vi.fn().mockResolvedValue(undefined);

vi.mock('firebase/auth', () => ({
  signInAnonymously: (...args: unknown[]) => mockSignInAnonymously(...args),
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

  it('guest sign-in calls anonymous auth', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Continue as guest/i }));
    await waitFor(() => expect(mockSignInAnonymously).toHaveBeenCalled());
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
