import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { buildHasRole } from '../../contexts/AuthContext';
import { RoleRoute } from '../RoleRoute';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

function roleHarness(role: 'user' | 'staff' | 'admin') {
  mockUseAuth.mockReturnValue({
    user: { uid: 'test-uid' },
    loading: false,
    role,
    staffGates: role === 'user' ? [] : ['GATE_B'],
    claimsRole: role,
    hasRole: buildHasRole(role),
    refreshRole: vi.fn(),
  });
}

describe('RoleRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('redirects attendee to unauthorized for staff-only route', () => {
    roleHarness('user');
    render(
      <MemoryRouter initialEntries={['/secret']}>
        <Routes>
          <Route
            path="/secret"
            element={
              <RoleRoute allowedRoles={['staff', 'admin']}>
                <span data-testid="secret">secret</span>
              </RoleRoute>
            }
          />
          <Route path="/unauthorized" element={<span data-testid="unauth">unauth</span>} />
          <Route path="/login" element={<span data-testid="login">login</span>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.queryByTestId('secret')).not.toBeInTheDocument();
    expect(screen.getByTestId('unauth')).toBeInTheDocument();
  });

  it('renders children for staff', () => {
    roleHarness('staff');
    render(
      <MemoryRouter initialEntries={['/ops']}>
        <Routes>
          <Route
            path="/ops"
            element={
              <RoleRoute allowedRoles={['staff', 'admin']}>
                <span data-testid="ops">ops</span>
              </RoleRoute>
            }
          />
          <Route path="/unauthorized" element={<span data-testid="unauth">unauth</span>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('ops')).toBeInTheDocument();
  });

  it('renders children for admin on staff routes', () => {
    roleHarness('admin');
    render(
      <MemoryRouter initialEntries={['/ops']}>
        <Routes>
          <Route
            path="/ops"
            element={
              <RoleRoute allowedRoles={['staff', 'admin']}>
                <span data-testid="ops">ops</span>
              </RoleRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('ops')).toBeInTheDocument();
  });

  it('redirects to dashboard when fallbackTo is dashboard', () => {
    roleHarness('user');
    render(
      <MemoryRouter initialEntries={['/secret']}>
        <Routes>
          <Route
            path="/secret"
            element={
              <RoleRoute allowedRoles={['staff', 'admin']} fallbackTo="dashboard">
                <span data-testid="secret">secret</span>
              </RoleRoute>
            }
          />
          <Route path="/dashboard" element={<span data-testid="dash">dash</span>} />
          <Route path="/login" element={<span data-testid="login">login</span>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('dash')).toBeInTheDocument();
  });
});
