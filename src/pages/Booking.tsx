import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { StarkCard, StarkButton } from '../components/common/StarkComponents';
import { useNavigate } from 'react-router-dom';
import { useEntryStore } from '../store/entryStore';
import { functions } from '../lib/firebase';
import { DEFAULT_BOOKING_GATE_ID } from '../lib/constants';
import { getHttpsCallableUserMessage } from '../lib/errors';

const reserveEntrySlot = httpsCallable(functions, 'reserveEntrySlot');

export const Booking = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useEntryStore();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const timeSlots = [
    { id: '1', time: '14:00 - 14:15', status: 'AVAILABLE', congestion: 'LOW' },
    { id: '2', time: '14:15 - 14:30', status: 'AVAILABLE', congestion: 'MED' },
    { id: '3', time: '14:30 - 14:45', status: 'FULL', congestion: 'HIGH' },
    { id: '4', time: '14:45 - 15:00', status: 'AVAILABLE', congestion: 'LOW' },
  ];

  const selectSlot = (id: string) => {
    dispatch({
      type: 'SET_BOOKING_STATUS',
      payload: { status: 'idle', error: null, transactionId: null },
    });
    setSelectedSlot(id);
  };

  const confirmSlot = async () => {
    if (!selectedSlot) return;
    dispatch({ type: 'SET_BOOKING_STATUS', payload: { status: 'loading' } });
    try {
      const result = await reserveEntrySlot({
        slotId: selectedSlot,
        gateId: DEFAULT_BOOKING_GATE_ID,
      });
      const data = result.data as {
        status?: string;
        transactionId?: string;
        message?: string;
      };
      dispatch({
        type: 'SET_BOOKING_STATUS',
        payload: {
          status: 'success',
          error: null,
          transactionId: data.transactionId ?? null,
        },
      });
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (e: unknown) {
      dispatch({
        type: 'SET_BOOKING_STATUS',
        payload: { status: 'error', error: getHttpsCallableUserMessage(e) },
      });
    }
  };

  const loading = state.bookingStatus === 'loading';

  return (
    <section className="flex flex-col h-full" aria-labelledby="booking-heading">
      <div className="mb-8">
        <h1 id="booking-heading" className="text-4xl font-black tracking-tighter uppercase mb-2">
          Arrival Booking
        </h1>
        <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase">
          Select your secure ingress slot
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {timeSlots.map((slot) => (
          <StarkCard
            key={slot.id}
            title={slot.time}
            subtitle={
              slot.status === 'FULL' ? 'Slot Exhausted' : `Congestion Forecast: ${slot.congestion}`
            }
            active={selectedSlot === slot.id}
            onClick={() => slot.status !== 'FULL' && selectSlot(slot.id)}
            className={slot.status === 'FULL' ? 'opacity-50 cursor-not-allowed border-l-error' : ''}
          >
            {slot.status !== 'FULL' && (
              <div className="mt-4 flex justify-between items-center border-t border-outline-variant pt-2">
                <span className="text-[10px] font-bold uppercase tracking-widest">{slot.status}</span>
                {selectedSlot === slot.id && (
                  <span
                    className="material-symbols-outlined normal-case text-primary-container"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    aria-hidden
                  >
                    check_circle
                  </span>
                )}
              </div>
            )}
          </StarkCard>
        ))}
      </div>

      {state.bookingStatus === 'success' && (
        <p className="mb-4 text-secondary font-bold text-xs uppercase tracking-widest border-l-4 border-secondary pl-4" role="status">
          Slot reserved
          {state.bookingTransactionId ? ` · ${state.bookingTransactionId}` : ''}
        </p>
      )}
      {state.bookingStatus === 'error' && state.bookingError && (
        <p className="mb-4 text-error font-bold text-xs uppercase tracking-widest border-l-4 border-error pl-4" role="alert">
          {state.bookingError}
        </p>
      )}

      <div className="mt-auto pt-8 border-t-[1px] border-outline-variant">
        <div className="flex gap-4">
          <StarkButton variant="secondary" fullWidth onClick={() => navigate('/onboarding')} disabled={loading}>
            Back
          </StarkButton>
          <StarkButton
            fullWidth
            onClick={confirmSlot}
            disabled={!selectedSlot || loading || state.bookingStatus === 'success'}
            className={!selectedSlot || state.bookingStatus === 'success' ? 'opacity-50 cursor-not-allowed' : ''}
            aria-busy={loading}
          >
            {loading ? 'Reserving…' : state.bookingStatus === 'success' ? 'Reserved' : 'Confirm Slot'}
          </StarkButton>
        </div>
        {state.bookingStatus === 'success' && (
          <StarkButton fullWidth className="mt-4" variant="secondary" onClick={() => navigate('/dashboard')}>
            Continue to Dashboard
          </StarkButton>
        )}
      </div>
    </section>
  );
};

export default Booking;
