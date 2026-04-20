import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EntryProvider } from '../../../store/entryStore';
import { SideNavBar, BottomNav } from '../Navigation';
import { buildHasRole } from '../../../contexts/AuthContext';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../../../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../contexts/AuthContext')>();
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

describe('Navigation', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('hides staff and command links for attendee role', () => {
    mockUseAuth.mockReturnValue({
      hasRole: buildHasRole('user'),
    });
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <SideNavBar />
      </MemoryRouter>
    );

    expect(document.querySelector('a[href="/command/traffic"]')).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/staff"]')).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/dashboard"]')).toBeInTheDocument();
    expect(document.querySelector('a[href="/concierge"]')).toBeInTheDocument();
  });

  it('shows staff ops and command links for staff role', () => {
    mockUseAuth.mockReturnValue({
      hasRole: buildHasRole('staff'),
    });
    render(
      <MemoryRouter initialEntries={['/staff']}>
        <SideNavBar />
      </MemoryRouter>
    );

    expect(document.querySelector('a[href="/command/traffic"]')).toHaveAttribute('href', '/command/traffic');
    expect(document.querySelector('a[href="/staff"]')).toHaveAttribute('href', '/staff');
  });

  it('BottomNav lists attendee destinations only for user', () => {
    mockUseAuth.mockReturnValue({
      hasRole: buildHasRole('user'),
    });
    render(
      <EntryProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <BottomNav />
        </MemoryRouter>
      </EntryProvider>
    );

    const nav = screen.getByRole('navigation', { name: /primary mobile navigation/i });
    expect(nav.querySelector('a[href="/command/traffic"]')).not.toBeInTheDocument();
    expect(nav.querySelector('a[href="/dashboard"]')).toHaveAttribute('href', '/dashboard');
  });

  it('BottomNav includes ops for staff', () => {
    mockUseAuth.mockReturnValue({
      hasRole: buildHasRole('staff'),
    });
    render(
      <EntryProvider>
        <MemoryRouter initialEntries={['/staff']}>
          <BottomNav />
        </MemoryRouter>
      </EntryProvider>
    );

    const nav = screen.getByRole('navigation', { name: /primary mobile navigation/i });
    expect(nav.querySelector('a[href="/staff"]')).toHaveAttribute('href', '/staff');
    expect(nav.querySelector('a[href="/command/traffic"]')).toHaveAttribute('href', '/command/traffic');
  });
});
