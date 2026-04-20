import React, { useEffect, useMemo, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { FirebaseError } from 'firebase/app';
import { collection, doc, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { StarkCard, StarkButton } from '../components/common/StarkComponents';
import { useNavigate } from 'react-router-dom';
import { useEntryStore } from '../store/entryStore';
import { functions, db } from '../lib/firebase';
import { DEFAULT_BOOKING_GATE_ID } from '../lib/constants';
import { BOOKING_VENUE_UNAVAILABLE_COPY, getHttpsCallableUserMessage } from '../lib/errors';
import {
  evaluateSlotBookability,
  bookabilityLabel,
  type SlotBookabilityState,
} from '../lib/bookingSlotBookability';
import { DEFAULT_DEMO_EVENT_ID } from '../lib/demoConstants';
import { slotIngressFillPercent } from '../lib/slotIngressFillPercent';

const reserveEntrySlot = httpsCallable(functions, 'reserveEntrySlot');
const reserveDemoSlot = httpsCallable(functions, 'reserveDemoSlot');

type SlotDef = {
  id: string;
  time: string;
  status: 'AVAILABLE';
  slotStart: Date;
  slotEnd: Date;
  /** Total ingress capacity for this window (from seed or booking service). */
  capacityTotal: number;
  capacityRemaining: number;
  defaultGate: string;
};

function fmtRange(a: Date, b: Date): string {
  const f = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${f(a)} – ${f(b)}`;
}

const STATIC_SLOTS: SlotDef[] = [
  {
    id: '1',
    time: '14:00 - 14:15',
    status: 'AVAILABLE',
    slotStart: new Date(2020, 0, 1, 14, 0),
    slotEnd: new Date(2020, 0, 1, 14, 15),
    capacityTotal: 1000,
    capacityRemaining: 999,
    defaultGate: DEFAULT_BOOKING_GATE_ID,
  },
  {
    id: '2',
    time: '14:15 - 14:30',
    status: 'AVAILABLE',
    slotStart: new Date(2020, 0, 1, 14, 15),
    slotEnd: new Date(2020, 0, 1, 14, 30),
    capacityTotal: 1000,
    capacityRemaining: 999,
    defaultGate: DEFAULT_BOOKING_GATE_ID,
  },
  {
    id: '3',
    time: '14:30 - 14:45',
    status: 'AVAILABLE',
    slotStart: new Date(2020, 0, 1, 14, 30),
    slotEnd: new Date(2020, 0, 1, 14, 45),
    capacityTotal: 1000,
    capacityRemaining: 999,
    defaultGate: DEFAULT_BOOKING_GATE_ID,
  },
  {
    id: '4',
    time: '14:45 - 15:00',
    status: 'AVAILABLE',
    slotStart: new Date(2020, 0, 1, 14, 45),
    slotEnd: new Date(2020, 0, 1, 15, 0),
    capacityTotal: 1000,
    capacityRemaining: 999,
    defaultGate: DEFAULT_BOOKING_GATE_ID,
  },
];

export const Booking = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useEntryStore();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [blockedSlotIds, setBlockedSlotIds] = useState<Set<string>>(() => new Set());
  const [venueWideUnavailable, setVenueWideUnavailable] = useState(false);
  const [demoSlots, setDemoSlots] = useState<SlotDef[] | null>(null);
  const [demoWindows, setDemoWindows] = useState<{
    bookingWindowStart: Date;
    bookingWindowEnd: Date;
  } | null>(null);
  const [demoTimeTick, setDemoTimeTick] = useState(0);

  const eventId = state.demoEventId ?? DEFAULT_DEMO_EVENT_ID;

  useEffect(() => {
    if (!state.demoMode) return;
    const id = window.setInterval(() => setDemoTimeTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, [state.demoMode]);

  useEffect(() => {
    if (!state.demoMode) {
      setDemoSlots(null);
      setDemoWindows(null);
      return;
    }
    const evRef = doc(db, 'demoEvents', eventId);
    const unsubEv = onSnapshot(evRef, (snap) => {
      const d = snap.data();
      if (!d) {
        setDemoWindows(null);
        return;
      }
      const bs = (d.bookingWindowStart as Timestamp | undefined)?.toDate();
      const be = (d.bookingWindowEnd as Timestamp | undefined)?.toDate();
      if (bs && be) setDemoWindows({ bookingWindowStart: bs, bookingWindowEnd: be });
      else setDemoWindows(null);
    });
    const slotsQ = query(collection(db, 'demoEvents', eventId, 'slots'), orderBy('startTime'));
    const unsubSlots = onSnapshot(slotsQ, (snap) => {
      const rows: SlotDef[] = [];
      snap.forEach((s) => {
        const x = s.data();
        const st = (x.startTime as Timestamp)?.toDate();
        const en = (x.endTime as Timestamp)?.toDate();
        if (!st || !en) return;
        const capRem = Number(x.capacityRemaining ?? 0);
        const capTotal = Number(x.capacityTotal ?? 0);
        rows.push({
          id: s.id,
          time: fmtRange(st, en),
          status: 'AVAILABLE',
          slotStart: st,
          slotEnd: en,
          capacityTotal: capTotal > 0 ? capTotal : 400,
          capacityRemaining: capRem,
          defaultGate: typeof x.defaultGate === 'string' ? x.defaultGate : DEFAULT_BOOKING_GATE_ID,
        });
      });
      setDemoSlots(rows);
    });
    return () => {
      unsubEv();
      unsubSlots();
    };
  }, [state.demoMode, eventId]);

  const timeSlots = demoSlots && demoSlots.length > 0 ? demoSlots : !state.demoMode ? STATIC_SLOTS : [];

  const slotUiState = useMemo(() => {
    const map = new Map<string, SlotBookabilityState | 'legacy_blocked' | 'legacy_ok'>();
    const win = state.demoMode && demoWindows ? demoWindows : null;
    for (const slot of timeSlots) {
      if (state.demoMode && win) {
        map.set(
          slot.id,
          evaluateSlotBookability({
            now: new Date(),
            bookingWindowStart: win.bookingWindowStart,
            bookingWindowEnd: win.bookingWindowEnd,
            slotStart: slot.slotStart,
            slotEnd: slot.slotEnd,
            capacityRemaining: slot.capacityRemaining,
          })
        );
      } else {
        map.set(slot.id, blockedSlotIds.has(slot.id) ? 'legacy_blocked' : 'legacy_ok');
      }
    }
    return map;
  }, [timeSlots, state.demoMode, demoWindows, blockedSlotIds, demoTimeTick]);

  const slotIsDisabled = (slot: SlotDef) => {
    if (venueWideUnavailable) return true;
    const st = slotUiState.get(slot.id);
    if (!state.demoMode) {
      return st === 'legacy_blocked';
    }
    return st !== 'available';
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
      if (state.demoMode) {
        const slot = timeSlots.find((s) => s.id === selectedSlot);
        const gate = slot?.defaultGate ?? DEFAULT_BOOKING_GATE_ID;
        const result = await reserveDemoSlot({
          eventId,
          slotId: selectedSlot,
          gateId: gate,
        });
        const data = result.data as { transactionId?: string; status?: string };
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
        return;
      }

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
    if (!state.demoMode && blockedSlotIds.has(slot.id)) {
      return 'Unavailable for booking';
    }
    const st = slotUiState.get(slot.id);
    if (state.demoMode && st && st !== 'legacy_blocked' && st !== 'legacy_ok') {
      return bookabilityLabel(st);
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
          {state.demoMode
            ? 'Demo mode uses stadium event windows in Firestore — past slots close automatically when data is seeded.'
            : 'Windows are illustrative until you confirm — availability is enforced by the reservation service.'}
        </p>
      </div>

      {state.demoMode && timeSlots.length === 0 && (
        <p role="status" className="mb-4 text-on-surface-variant font-bold text-sm border-l-4 border-outline pl-4">
          No demo slots in Firestore yet. Run the stadium seed script, then refresh.
        </p>
      )}

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
            {state.demoMode && (
              <p className="mt-2 text-[11px] font-bold tabular-nums text-on-surface-variant normal-case tracking-normal">
                Filled {slotIngressFillPercent(slot.capacityTotal, slot.capacityRemaining)}% ·{' '}
                {slot.capacityRemaining} spots left
              </p>
            )}
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
