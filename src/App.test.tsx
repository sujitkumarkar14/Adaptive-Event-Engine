import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

const mockUseAuth = vi.fn(() => ({ user: null as { uid: string } | null, loading: false }));

vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => mockUseAuth(),
}));

vi.mock('./hooks/useAppOrchestration', () => ({
  useAppOrchestration: vi.fn(),
}));

vi.mock('./pages/Login', () => ({
  default: () => <div>Login Page</div>,
}));

vi.mock('./pages/Dashboard', () => ({
  default: () => <div>Dashboard Page</div>,
}));

vi.mock('./components/navigation/Navigation', () => ({
  TopNavBar: () => <div data-testid="topnav" />,
  SideNavBar: () => <div data-testid="sidenav" />,
  BottomNav: () => <div data-testid="bottomnav" />,
  DataFreshnessFooter: () => <div data-testid="data-footer" />,
}));

describe('App', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    window.history.pushState({}, '', '/');
  });

  it('redirects unauthenticated users from / to login and shows lazy Login', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('topnav')).not.toBeInTheDocument();
  });

  it('shows shell chrome on dashboard when authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'test-user' }, loading: false });
    window.history.pushState({}, '', '/dashboard');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });
    expect(screen.getByTestId('topnav')).toBeInTheDocument();
    expect(screen.getByTestId('sidenav')).toBeInTheDocument();
    expect(screen.getByTestId('bottomnav')).toBeInTheDocument();
    expect(screen.getByTestId('data-footer')).toBeInTheDocument();
  });
});
