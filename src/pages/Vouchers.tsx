import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { doc, onSnapshot } from 'firebase/firestore';
import { StarkCard, StarkButton } from '../components/common/StarkComponents';
import { useAuth } from '../contexts/AuthContext';
import { useEntryStore } from '../store/entryStore';
import { db } from '../lib/firebase';

export function RewardUnlockedCard({
  voucherCode,
  onDismiss,
}: {
  voucherCode: string;
  onDismiss?: () => void;
}) {
  return (
    <StarkCard
      title="Reward unlocked"
      subtitle="Venue coordination incentive"
      active
      className="border-4 border-black"
    >
      <p className="mt-4 font-mono text-xl font-black tracking-widest text-on-surface">{voucherCode}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
        Show this code at participating concessions (demo).
      </p>
      {onDismiss ? (
        <StarkButton variant="secondary" fullWidth className="mt-6 uppercase tracking-widest" onClick={onDismiss}>
          Dismiss
        </StarkButton>
      ) : null}
    </StarkCard>
  );
}

function buildPassQrValue(origin: string, uid: string, kind: 'voucher' | 'booking', ref: string): string {
  const enc = encodeURIComponent(ref);
  return `${origin}/vouchers?u=${encodeURIComponent(uid)}&${kind}=${enc}`;
}

export const Vouchers = () => {
  const { user } = useAuth();
  const { state } = useEntryStore();
  const [pendingVoucherCode, setPendingVoucherCode] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setPendingVoucherCode(null);
      setDocLoading(false);
      return;
    }
    setDocLoading(true);
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const v = snap.data()?.pendingVoucherCode;
        setPendingVoucherCode(typeof v === 'string' && v.length > 0 ? v : null);
        setDocLoading(false);
      },
      () => {
        setPendingVoucherCode(null);
        setDocLoading(false);
      }
    );
    return () => unsub();
  }, [user?.uid]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const voucherQr = useMemo(() => {
    if (!user?.uid || !pendingVoucherCode || !origin) return '';
    return buildPassQrValue(origin, user.uid, 'voucher', pendingVoucherCode);
  }, [user?.uid, pendingVoucherCode, origin]);

  const bookingQr = useMemo(() => {
    if (!user?.uid || !state.bookingTransactionId || !origin) return '';
    return buildPassQrValue(origin, user.uid, 'booking', state.bookingTransactionId);
  }, [user?.uid, state.bookingTransactionId, origin]);

  const hasPass =
    Boolean(pendingVoucherCode) ||
    (state.bookingStatus === 'success' && Boolean(state.bookingTransactionId));

  return (
    <section className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Event pass</h1>
        <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase">
          Your credentials for this venue slice
        </p>
      </div>

      {docLoading ? (
        <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest border-l-4 border-outline pl-4">
          Loading pass data…
        </p>
      ) : null}

      {!docLoading && !hasPass ? (
        <StarkCard title="No active pass" subtitle="Nothing issued for this account yet">
          <p className="mt-4 text-sm font-bold text-on-surface-variant normal-case tracking-normal leading-relaxed">
            No active event pass is shown here yet. Passes appear when you have a reward code from the venue or a
            confirmed arrival reservation reference in this session.
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-widest text-outline">
            Add to Google Wallet / Apple Wallet is not wired in this build.
          </p>
        </StarkCard>
      ) : null}

      {pendingVoucherCode ? (
        <div className="flex flex-col gap-4 mb-8">
          <StarkCard title="Venue reward code" subtitle="From your account" active>
            <div className="mt-4 flex flex-col gap-2">
              {voucherQr ? (
                <>
                  <div className="w-full bg-surface-container-highest border-2 border-outline flex items-center justify-center p-4">
                    <QRCode
                      value={voucherQr}
                      size={128}
                      className="h-auto w-full max-w-[128px]"
                      aria-label="QR code for your venue reward reference"
                    />
                  </div>
                  <p className="text-[10px] font-mono text-on-surface-variant break-all">{voucherQr}</p>
                </>
              ) : null}
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                Code: {pendingVoucherCode}
              </p>
            </div>
          </StarkCard>
        </div>
      ) : null}

      {state.bookingStatus === 'success' && state.bookingTransactionId ? (
        <div className="flex flex-col gap-4 mb-8">
          <StarkCard title="Arrival reservation" subtitle="Confirmed in this session" active>
            <div className="mt-4 flex flex-col gap-2">
              {bookingQr ? (
                <>
                  <div className="w-full bg-surface-container-highest border-2 border-outline flex items-center justify-center p-4">
                    <QRCode
                      value={bookingQr}
                      size={128}
                      className="h-auto w-full max-w-[128px]"
                      aria-label="QR code for your reservation reference"
                    />
                  </div>
                  <p className="text-[10px] font-mono text-on-surface-variant break-all">{bookingQr}</p>
                </>
              ) : null}
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface">
                Reference: {state.bookingTransactionId}
              </p>
            </div>
          </StarkCard>
        </div>
      ) : null}

      <StarkCard title="Wallet apps" subtitle="Not available in this build">
        <StarkButton
          variant="tertiary"
          fullWidth
          icon="wallet"
          type="button"
          disabled
          title="Google Wallet / Apple Wallet APIs are not wired in this build"
          aria-label="Add to Google Wallet — not available in this build"
        >
          Add to Google Wallet (unavailable)
        </StarkButton>
      </StarkCard>
    </section>
  );
};

export default Vouchers;
