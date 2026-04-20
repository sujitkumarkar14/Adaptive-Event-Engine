import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Login } from '../Login';
import { EntryProvider } from '../../store/entryStore';

const mockSignInWithEmail = vi.fn().mockResolvedValue(undefined);
const mockCreateUser = vi.fn().mockResolvedValue(undefined);
const mockSignInAnonymously = vi.fn().mockResolvedValue(undefined);

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignInWithEmail(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUser(...args),
  signInAnonymously: (...args: unknown[]) => mockSignInAnonymously(...args),
}));

vi.mock('../../lib/firebase', () => ({
  auth: {},
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <EntryProvider>
        <Login />
      </EntryProvider>
    </MemoryRouter>
  );
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders Identity Gate heading', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /Identity Gate/i })).toBeInTheDocument();
  });

  it('offers live demo access with anonymous sign-in', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /Continue with live demo/i })).toBeInTheDocument();
  });

  it('shows validation when email sign-in with empty fields', () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/required/i);
  });

  it('shows validation when passwords do not match on register', async () => {
    renderLogin();
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'abc12345' } });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: 'diff12345' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/do not match/i);
  });

  it('rejects weak password on register', () => {
    renderLogin();
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'abcdefgh' } });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: 'abcdefgh' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/letters and numbers/i);
  });

  it('signs in with email and password', async () => {
    renderLogin();
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), { target: { value: 'fan@test.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'abc12345' } });
    fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));
    await waitFor(() => expect(mockSignInWithEmail).toHaveBeenCalled());
  });

  it('creates account with valid password', async () => {
    renderLogin();
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), { target: { value: 'new@test.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'abc12345' } });
    fireEvent.change(screen.getByLabelText(/Confirm password/i), { target: { value: 'abc12345' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    await waitFor(() => expect(mockCreateUser).toHaveBeenCalled());
  });

  it('starts demo session via anonymous sign-in', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /Continue with live demo/i }));
    await waitFor(() => expect(mockSignInAnonymously).toHaveBeenCalled());
    expect(sessionStorage.getItem('ae360_demo_mode')).toBe('1');
  });

  it('shows error when anonymous demo sign-in fails', async () => {
    mockSignInAnonymously.mockRejectedValueOnce(new Error('auth/config-not-allowed'));
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /Continue with live demo/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });
});
