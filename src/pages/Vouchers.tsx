import React from 'react';
import { StarkCard, StarkButton } from '../components/common/StarkComponents';

export const Vouchers = () => {
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
            <div className="w-full h-32 bg-on-surface flex items-center justify-center">
              <span className="text-surface font-black tracking-[0.5em]">QR_CODE_MOCK</span>
            </div>
            <StarkButton variant="tertiary" fullWidth icon="wallet">
              Add to Google Wallet
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
