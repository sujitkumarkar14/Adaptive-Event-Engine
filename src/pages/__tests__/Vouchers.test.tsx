import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Vouchers } from '../Vouchers';
import { EntryProvider } from '../../store/entryStore';

vi.mock('../../lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn((_ref: unknown, cb: (s: { data?: () => Record<string, unknown> }) => void) => {
    queueMicrotask(() => cb({ data: () => ({}) }));
    return vi.fn();
  }),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'u-smoke' } }),
}));

describe('Vouchers', () => {
  it('renders event pass heading and empty state without credentials', async () => {
    render(
      <MemoryRouter>
        <EntryProvider>
          <Vouchers />
        </EntryProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /event pass/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/No active pass/i)).toBeInTheDocument();
    });
  });
});
