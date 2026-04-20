import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TopNavBar } from '../TopNavBar';

vi.mock('../../../lib/firebase', () => ({
  auth: {},
}));

vi.mock('firebase/auth', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'fan@venue.test', uid: 'u1', photoURL: null },
    loading: false,
    role: 'user',
    claimsRole: 'user',
    staffGates: [],
  }),
  DEMO_ROLE_STORAGE_KEY: 'demo-role',
}));

describe('TopNavBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ACCESS brand and account control', () => {
    render(
      <MemoryRouter>
        <TopNavBar />
      </MemoryRouter>
    );
    expect(screen.getByText('ACCESS')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /account/i })).toBeInTheDocument();
  });

  it('opens account panel and shows signed-in copy', async () => {
    render(
      <MemoryRouter>
        <TopNavBar />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /account/i }));
    expect(await screen.findByText(/fan@venue\.test/i)).toBeInTheDocument();
  });
});
