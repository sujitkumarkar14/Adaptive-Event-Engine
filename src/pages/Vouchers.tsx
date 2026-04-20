import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { StarkCard, StarkButton } from '../components/common/StarkComponents';

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

export const Vouchers = () => {
  const [ticketQrValue, setTicketQrValue] = useState('https://adaptive-entry.web.app/vouchers?ticket=SEC104');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setTicketQrValue(`${window.location.origin}/vouchers?ticket=SEC104`);
  }, []);

  return (
    <section className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Access Credentials</h1>
        <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase">
          Wallet Integration
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <StarkCard 
          title="MATCH TICKET: SEC 104" 
          subtitle="Validated - Offline Accessible"
          active={true}
        >
          <div className="mt-4 flex flex-col gap-2">
            <div className="w-full bg-surface-container-highest border-2 border-outline flex items-center justify-center p-4">
              <QRCode
                value={ticketQrValue}
                size={128}
                className="h-auto w-full max-w-[128px]"
                aria-label="Ticket QR code for section 104"
              />
            </div>
            <p className="text-[10px] font-mono text-on-surface-variant break-all">{ticketQrValue}</p>
            <StarkButton
              variant="tertiary"
              fullWidth
              icon="wallet"
              type="button"
              disabled
              title="Google Wallet / Apple Wallet APIs are not wired in this demo build"
              aria-label="Add to Google Wallet — not available in this demo"
            >
              Add to Google Wallet (demo)
            </StarkButton>
          </div>
        </StarkCard>

        <StarkCard 
          title="FAST-PASS: GATE B" 
          subtitle="Redeemed via Arrival Booking"
        >
          <p className="text-sm font-bold mt-2">Valid from 14:15 - 14:30</p>
        </StarkCard>
      </div>
    </section>
  );
};

export default Vouchers;
