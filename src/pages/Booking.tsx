import React, { useMemo, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { FirebaseError } from 'firebase/app';
import { StarkCard, StarkButton } from '../components/common/StarkComponents';
import { useNavigate } from 'react-router-dom';
import { useEntryStore } from '../store/entryStore';
import { functions } from '../lib/firebase';
import { DEFAULT_BOOKING_GATE_ID } from '../lib/constants';
import { BOOKING_VENUE_UNAVAILABLE_COPY, getHttpsCallableUserMessage } from '../lib/errors';

const reserveEntrySlot = httpsCallable(functions, 'reserveEntrySlot');

type SlotDef = { id: string; time: string; status: 'AVAILABLE' };

export const Booking = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useEntryStore();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [blockedSlotIds, setBlockedSlotIds] = useState<Set<string>>(() => new Set());
  const [venueWideUnavailable, setVenueWideUnavailable] = useState(false);

  /** Schedule windows only — capacity is verified when you confirm (callable + Spanner). */
  const timeSlots: SlotDef[] = useMemo(
    () => [
      { id: '1', time: '14:00 - 14:15', status: 'AVAILABLE' },
      { id: '2', time: '14:15 - 14:30', status: 'AVAILABLE' },
      { id: '3', time: '14:30 - 14:45', status: 'AVAILABLE' },
      { id: '4', time: '14:45 - 15:00', status: 'AVAILABLE' },
    ],
    []
  );

  const slotIsDisabled = (slot: SlotDef) => {
    if (venueWideUnavailable) return true;
    return blockedSlotIds.has(slot.id);
  };

  const selectSlot = (id: string) => {
    dispatch({
      type: 'SET_BOOKING_STATUS',
      payload: { status: 'idle', error: null, transactionId: null },
    });
    setSelectedSlot(id);
  };

  const resetVenueAvailability = () => {
    setVenueWideUnavailable(false);
    setBlockedSlotIds(new Set());
    dispatch({
      type: 'SET_BOOKING_STATUS',
      payload: { status: 'idle', error: null, transactionId: null },
    });
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
      setVenueWideUnavailable(false);
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
      if (e instanceof FirebaseError) {
        if (e.code === 'functions/internal') {
          setVenueWideUnavailable(true);
          setSelectedSlot(null);
          dispatch({
            type: 'SET_BOOKING_STATUS',
            payload: { status: 'idle', error: null, transactionId: null },
          });
          return;
        }
        if (
          e.code === 'functions/failed-precondition' ||
          e.code === 'functions/resource-exhausted'
        ) {
          setBlockedSlotIds((prev) => new Set(prev).add(selectedSlot));
          setSelectedSlot(null);
        }
      }
      dispatch({
        type: 'SET_BOOKING_STATUS',
        payload: { status: 'error', error: getHttpsCallableUserMessage(e) },
      });
    }
  };

  const loading = state.bookingStatus === 'loading';

  const getSubtitle = (slot: SlotDef) => {
    if (venueWideUnavailable) {
      return 'Temporarily unavailable';
    }
    if (blockedSlotIds.has(slot.id)) {
      return 'Unavailable for booking';
    }
    return 'Confirm to check capacity';
  };

  return (
    <section className="flex flex-col h-full" aria-labelledby="booking-heading">
      <div className="mb-8">
        <h1 id="booking-heading" className="text-4xl font-black tracking-tighter uppercase mb-2">
          Arrival Booking
        </h1>
        <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase">
          Select your secure ingress slot
        </p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-outline max-w-xl">
          Windows are illustrative until you confirm — availability is enforced by the reservation service.
        </p>
      </div>

      {venueWideUnavailable && (
        <p
          role="status"
          aria-live="polite"
          className="mb-4 text-on-surface-variant font-bold text-xs uppercase tracking-widest border-l-4 border-outline pl-4"
        >
          {BOOKING_VENUE_UNAVAILABLE_COPY}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {timeSlots.map((slot) => (
          <StarkCard
            key={slot.id}
            title={slot.time}
            subtitle={getSubtitle(slot)}
            active={selectedSlot === slot.id}
            onClick={() => !slotIsDisabled(slot) && selectSlot(slot.id)}
            className={slotIsDisabled(slot) ? 'opacity-50 cursor-not-allowed border-l-error' : ''}
          >
            {!slotIsDisabled(slot) && (
              <div className="mt-4 flex justify-between items-center border-t border-outline-variant pt-4">
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
        <p
          className="mb-4 text-secondary font-bold text-xs uppercase tracking-widest border-l-4 border-secondary pl-4"
          role="status"
        >
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
            disabled={
              !selectedSlot || loading || state.bookingStatus === 'success' || venueWideUnavailable
            }
            className={
              !selectedSlot || state.bookingStatus === 'success' || venueWideUnavailable
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }
            aria-busy={loading}
          >
            {loading ? 'Reserving…' : state.bookingStatus === 'success' ? 'Reserved' : 'Confirm Slot'}
          </StarkButton>
        </div>
        {venueWideUnavailable && (
          <StarkButton fullWidth className="mt-4" variant="tertiary" type="button" onClick={resetVenueAvailability}>
            Try again
          </StarkButton>
        )}
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
