import React, { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Vouchers } from '../Vouchers';
import { EntryProvider, useEntryStore } from '../../store/entryStore';

vi.mock('../../lib/firebase', () => ({
  db: {},
}));

const userDoc = vi.hoisted(() => ({ pendingVoucherCode: undefined as string | undefined }));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ __path: 'users/x' })),
  onSnapshot: vi.fn((_ref: unknown, cb: (s: { data?: () => Record<string, unknown> }) => void) => {
    queueMicrotask(() =>
      cb({
        data: () =>
          userDoc.pendingVoucherCode ? { pendingVoucherCode: userDoc.pendingVoucherCode } : {},
      })
    );
    return vi.fn();
  }),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}));

function SeedSuccessfulBooking({ children }: { children: React.ReactNode }) {
  const { dispatch } = useEntryStore();
  useEffect(() => {
    dispatch({
      type: 'SET_BOOKING_STATUS',
      payload: { status: 'success', error: null, transactionId: 'tx-abc' },
    });
  }, [dispatch]);
  return <>{children}</>;
}

function renderPage(tree: React.ReactNode) {
  return render(
    <MemoryRouter>
      <EntryProvider>{tree}</EntryProvider>
    </MemoryRouter>
  );
}

describe('Vouchers page', () => {
  beforeEach(() => {
    userDoc.pendingVoucherCode = undefined;
  });

  it('shows empty state when no voucher and no booking reference', async () => {
    renderPage(<Vouchers />);
    await waitFor(() => {
      expect(screen.getByText(/No active pass/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Passes appear when/i)).toBeInTheDocument();
  });

  it('shows reward QR when Firestore has pendingVoucherCode', async () => {
    userDoc.pendingVoucherCode = 'SMART_MOVE_10';
    renderPage(<Vouchers />);
    await waitFor(() => {
      expect(screen.getByText(/^Code: SMART_MOVE_10$/)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/QR code for your venue reward reference/i)).toBeInTheDocument();
  });

  it('shows booking reference when session has a successful reservation', async () => {
    renderPage(
      <SeedSuccessfulBooking>
        <Vouchers />
      </SeedSuccessfulBooking>
    );
    await waitFor(() => {
      expect(screen.getByText(/^Reference: tx-abc$/)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/QR code for your reservation reference/i)).toBeInTheDocument();
  });
});
